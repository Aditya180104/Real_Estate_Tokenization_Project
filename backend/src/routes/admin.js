const express = require("express");
const router = express.Router();
const User = require("../models/User");
const Property = require("../models/Property");
const Transaction = require("../models/Transaction");
const Notification = require("../models/Notification");
const { authenticate, authorize } = require("../middleware/auth");
const blockchainService = require("../services/blockchainService");

// All admin routes require authentication and admin role
router.use(authenticate, authorize("admin"));

// ─── Dashboard Stats ──────────────────────────────────────────────────────────
router.get("/dashboard", async (req, res, next) => {
  try {
    const [
      totalUsers,
      totalProperties,
      activeProperties,
      pendingProperties,
      totalTransactions,
      recentUsers,
      recentProperties,
    ] = await Promise.all([
      User.countDocuments(),
      Property.countDocuments(),
      Property.countDocuments({ status: "active" }),
      Property.countDocuments({ status: "pending_review" }),
      Transaction.countDocuments(),
      User.find().sort({ createdAt: -1 }).limit(5).select("-password"),
      Property.find().sort({ createdAt: -1 }).limit(5).populate("owner", "firstName lastName"),
    ]);

    const usersByRole = await User.aggregate([
      { $group: { _id: "$role", count: { $sum: 1 } } },
    ]);

    const transactionVolume = await Transaction.aggregate([
      { $match: { status: "confirmed" } },
      { $group: { _id: null, totalVolume: { $sum: "$amountUSD" } } },
    ]);

    res.json({
      success: true,
      data: {
        stats: {
          totalUsers,
          totalProperties,
          activeProperties,
          pendingProperties,
          totalTransactions,
          totalVolume: transactionVolume[0]?.totalVolume || 0,
        },
        usersByRole,
        recentUsers,
        recentProperties,
      },
    });
  } catch (error) {
    next(error);
  }
});

// ─── User Management ──────────────────────────────────────────────────────────
router.get("/users", async (req, res, next) => {
  try {
    const { page = 1, limit = 20, role, kycStatus, search } = req.query;
    const filter = {};

    if (role) filter.role = role;
    if (kycStatus) filter.kycStatus = kycStatus;
    if (search) {
      filter.$or = [
        { firstName: new RegExp(search, "i") },
        { lastName: new RegExp(search, "i") },
        { email: new RegExp(search, "i") },
      ];
    }

    const skip = (Number(page) - 1) * Number(limit);
    const [users, total] = await Promise.all([
      User.find(filter).sort({ createdAt: -1 }).skip(skip).limit(Number(limit)),
      User.countDocuments(filter),
    ]);

    res.json({
      success: true,
      data: users,
      pagination: { page: Number(page), limit: Number(limit), total, pages: Math.ceil(total / Number(limit)) },
    });
  } catch (error) {
    next(error);
  }
});

router.get("/users/:id", async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ success: false, message: "User not found" });
    res.json({ success: true, data: user });
  } catch (error) {
    next(error);
  }
});

router.put("/users/:id/kyc", async (req, res, next) => {
  try {
    const { kycStatus, rejectionReason } = req.body;
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { kycStatus },
      { new: true }
    );

    if (!user) return res.status(404).json({ success: false, message: "User not found" });

    // Notify user
    await Notification.create({
      user: user._id,
      title: kycStatus === "verified" ? "KYC Approved" : "KYC Rejected",
      message:
        kycStatus === "verified"
          ? "Your KYC verification has been approved. You can now invest in properties."
          : `Your KYC verification was rejected. Reason: ${rejectionReason || "Please resubmit documents."}`,
      type: kycStatus === "verified" ? "kyc_approved" : "kyc_rejected",
    });

    // If verified, also verify on blockchain
    if (kycStatus === "verified" && user.walletAddress) {
      try {
        await blockchainService.verifyUser(user.walletAddress);
      } catch (e) {
        console.error("Blockchain user verification failed:", e.message);
      }
    }

    res.json({ success: true, data: user });
  } catch (error) {
    next(error);
  }
});

router.put("/users/:id/status", async (req, res, next) => {
  try {
    const { isActive } = req.body;
    const user = await User.findByIdAndUpdate(req.params.id, { isActive }, { new: true });
    if (!user) return res.status(404).json({ success: false, message: "User not found" });
    res.json({ success: true, data: user });
  } catch (error) {
    next(error);
  }
});

router.post("/users", async (req, res, next) => {
  try {
    const { email, password, firstName, lastName, role } = req.body;
    const user = await User.create({ email, password, firstName, lastName, role });
    res.status(201).json({ success: true, data: user });
  } catch (error) {
    next(error);
  }
});

// ─── Property Management ──────────────────────────────────────────────────────
router.get("/properties", async (req, res, next) => {
  try {
    const { page = 1, limit = 20, status } = req.query;
    const filter = status ? { status } : {};
    const skip = (Number(page) - 1) * Number(limit);

    const [properties, total] = await Promise.all([
      Property.find(filter)
        .populate("owner", "firstName lastName email")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit)),
      Property.countDocuments(filter),
    ]);

    res.json({
      success: true,
      data: properties,
      pagination: { page: Number(page), limit: Number(limit), total, pages: Math.ceil(total / Number(limit)) },
    });
  } catch (error) {
    next(error);
  }
});

router.put("/properties/:id/verify", async (req, res, next) => {
  try {
    const property = await Property.findById(req.params.id).populate("owner");
    if (!property) return res.status(404).json({ success: false, message: "Property not found" });

    await Property.findByIdAndUpdate(req.params.id, {
      status: "verified",
      verifiedBy: req.user._id,
      verifiedAt: new Date(),
    });

    // Notify owner
    await Notification.create({
      user: property.owner._id,
      title: "Property Verified",
      message: `Your property "${property.title}" has been verified and is ready for tokenization.`,
      type: "property_verified",
      relatedProperty: property._id,
    });

    res.json({ success: true, message: "Property verified successfully" });
  } catch (error) {
    next(error);
  }
});

router.put("/properties/:id/reject", async (req, res, next) => {
  try {
    const { rejectionReason } = req.body;
    const property = await Property.findById(req.params.id).populate("owner");
    if (!property) return res.status(404).json({ success: false, message: "Property not found" });

    await Property.findByIdAndUpdate(req.params.id, {
      status: "draft",
      rejectionReason,
    });

    await Notification.create({
      user: property.owner._id,
      title: "Property Rejected",
      message: `Your property "${property.title}" was rejected. Reason: ${rejectionReason}`,
      type: "property_rejected",
      relatedProperty: property._id,
    });

    res.json({ success: true, message: "Property rejected" });
  } catch (error) {
    next(error);
  }
});

router.put("/properties/:id/feature", async (req, res, next) => {
  try {
    const { featured } = req.body;
    const property = await Property.findByIdAndUpdate(req.params.id, { featured }, { new: true });
    if (!property) return res.status(404).json({ success: false, message: "Property not found" });
    res.json({ success: true, data: property });
  } catch (error) {
    next(error);
  }
});

// ─── Transaction Overview ─────────────────────────────────────────────────────
router.get("/transactions", async (req, res, next) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    const [transactions, total] = await Promise.all([
      Transaction.find()
        .populate("property", "title")
        .populate("fromUser", "firstName lastName email")
        .populate("toUser", "firstName lastName email")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit)),
      Transaction.countDocuments(),
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

module.exports = router;
