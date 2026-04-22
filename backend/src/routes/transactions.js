const express = require("express");
const router = express.Router();
const Transaction = require("../models/Transaction");
const Property = require("../models/Property");
const Notification = require("../models/Notification");
const { authenticate, requireKYC } = require("../middleware/auth");
const blockchainService = require("../services/blockchainService");

// ─── Record a transaction (called after blockchain tx confirmed) ───────────────
router.post("/record", authenticate, requireKYC, async (req, res, next) => {
  try {
    const {
      propertyId,
      transactionType,
      shares,
      amountUSD,
      amountWei,
      pricePerShareUSD,
      pricePerShareWei,
      txHash,
      blockNumber,
      toAddress,
    } = req.body;

    const property = await Property.findById(propertyId);
    if (!property) {
      return res.status(404).json({ success: false, message: "Property not found" });
    }

    // Find toUser by wallet address if provided
    let toUser = null;
    if (toAddress) {
      const User = require("../models/User");
      toUser = await User.findOne({ walletAddress: toAddress.toLowerCase() });
    }

    const transaction = await Transaction.create({
      property: propertyId,
      fromUser: req.user._id,
      toUser: toUser?._id,
      fromAddress: req.user.walletAddress,
      toAddress,
      transactionType,
      shares: Number(shares),
      amountUSD: Number(amountUSD),
      amountWei,
      pricePerShareUSD: Number(pricePerShareUSD),
      pricePerShareWei,
      txHash,
      blockNumber,
      status: "confirmed",
    });

    // Send notifications
    if (transactionType === "purchase") {
      await Notification.create({
        user: req.user._id,
        title: "Shares Purchased",
        message: `You successfully purchased ${shares} shares of "${property.title}".`,
        type: "shares_purchased",
        relatedProperty: property._id,
        relatedTransaction: transaction._id,
      });

      if (toUser) {
        await Notification.create({
          user: toUser._id,
          title: "Shares Sold",
          message: `${shares} shares of "${property.title}" were sold from your portfolio.`,
          type: "shares_sold",
          relatedProperty: property._id,
          relatedTransaction: transaction._id,
        });
      }
    }

    res.status(201).json({ success: true, data: transaction });
  } catch (error) {
    next(error);
  }
});

// ─── Get user's transaction history ──────────────────────────────────────────
router.get("/my-transactions", authenticate, async (req, res, next) => {
  try {
    const { page = 1, limit = 20, type } = req.query;
    const filter = {
      $or: [{ fromUser: req.user._id }, { toUser: req.user._id }],
    };
    if (type) filter.transactionType = type;

    const skip = (Number(page) - 1) * Number(limit);
    const [transactions, total] = await Promise.all([
      Transaction.find(filter)
        .populate("property", "title images location")
        .populate("fromUser", "firstName lastName")
        .populate("toUser", "firstName lastName")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit)),
      Transaction.countDocuments(filter),
    ]);

    res.json({
      success: true,
      data: transactions,
      pagination: { page: Number(page), limit: Number(limit), total, pages: Math.ceil(total / Number(limit)) },
    });
  } catch (error) {
    next(error);
  }
});

// ─── Get investor portfolio ───────────────────────────────────────────────────
router.get("/portfolio", authenticate, async (req, res, next) => {
  try {
    if (!req.user.walletAddress) {
      return res.json({ success: true, data: { properties: [], totalValue: 0 } });
    }

    // Get all properties where user has transactions
    const purchasedPropertyIds = await Transaction.distinct("property", {
      toUser: req.user._id,
      transactionType: "purchase",
      status: "confirmed",
    });

    const properties = await Property.find({
      _id: { $in: purchasedPropertyIds },
    }).select("title location financials tokenization images status");

    // Get blockchain portfolio data
    let portfolioData = [];
    if (req.user.walletAddress) {
      try {
        portfolioData = await blockchainService.getInvestorPortfolio(req.user.walletAddress);
      } catch (e) {
        console.error("Portfolio blockchain fetch error:", e.message);
      }
    }

    // Merge DB and blockchain data
    const enrichedProperties = properties.map((prop) => {
      const bcData = portfolioData.find(
        (p) => p.contractAddress?.toLowerCase() === prop.tokenization.contractAddress?.toLowerCase()
      );
      return {
        ...prop.toObject(),
        shares: bcData?.shares || 0,
        ownershipPercentage: bcData?.ownershipPercentage || 0,
        pendingRevenue: bcData?.pendingRevenue || "0",
      };
    });

    const totalValue = enrichedProperties.reduce((sum, p) => {
      return sum + (p.shares * p.financials.pricePerShare || 0);
    }, 0);

    res.json({
      success: true,
      data: { properties: enrichedProperties, totalValue },
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
