const express = require("express");
const router = express.Router();
const { body, query, validationResult } = require("express-validator");
const Property = require("../models/Property");
const Transaction = require("../models/Transaction");
const Notification = require("../models/Notification");
const { authenticate, authorize, requireKYC } = require("../middleware/auth");
const upload = require("../middleware/upload");
const blockchainService = require("../services/blockchainService");

// ─── Get All Properties (public with filters) ─────────────────────────────────
router.get("/", async (req, res, next) => {
  try {
    const {
      page = 1,
      limit = 12,
      status,
      propertyType,
      city,
      country,
      minPrice,
      maxPrice,
      search,
      sortBy = "createdAt",
      sortOrder = "desc",
      featured,
    } = req.query;

    const filter = {};

    // Public users only see active properties
    if (!req.headers.authorization) {
      filter.status = "active";
    } else if (status) {
      filter.status = status;
    }

    if (propertyType) filter.propertyType = propertyType;
    if (city) filter["location.city"] = new RegExp(city, "i");
    if (country) filter["location.country"] = new RegExp(country, "i");
    if (featured === "true") filter.featured = true;

    if (minPrice || maxPrice) {
      filter["financials.pricePerShare"] = {};
      if (minPrice) filter["financials.pricePerShare"].$gte = Number(minPrice);
      if (maxPrice) filter["financials.pricePerShare"].$lte = Number(maxPrice);
    }

    if (search) {
      filter.$text = { $search: search };
    }

    const sortOptions = {};
    sortOptions[sortBy] = sortOrder === "asc" ? 1 : -1;

    const skip = (Number(page) - 1) * Number(limit);
    const [properties, total] = await Promise.all([
      Property.find(filter)
        .populate("owner", "firstName lastName email")
        .sort(sortOptions)
        .skip(skip)
        .limit(Number(limit)),
      Property.countDocuments(filter),
    ]);

    res.json({
      success: true,
      data: properties,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / Number(limit)),
      },
    });
  } catch (error) {
    next(error);
  }
});

// ─── Get Single Property ──────────────────────────────────────────────────────
router.get("/:id", async (req, res, next) => {
  try {
    const property = await Property.findById(req.params.id)
      .populate("owner", "firstName lastName email walletAddress")
      .populate("verifiedBy", "firstName lastName");

    if (!property) {
      return res.status(404).json({ success: false, message: "Property not found" });
    }

    // Increment view count
    await Property.findByIdAndUpdate(req.params.id, { $inc: { viewCount: 1 } });

    // Get blockchain data if tokenized
    let blockchainData = null;
    if (property.tokenization.isTokenized && property.tokenization.contractAddress) {
      try {
        blockchainData = await blockchainService.getPropertyTokenData(
          property.tokenization.contractAddress
        );
      } catch (e) {
        console.error("Blockchain data fetch error:", e.message);
      }
    }

    res.json({ success: true, data: { ...property.toObject(), blockchainData } });
  } catch (error) {
    next(error);
  }
});

// ─── Create Property ──────────────────────────────────────────────────────────
router.post(
  "/",
  authenticate,
  authorize("property_owner", "admin"),
  upload.fields([
    { name: "images", maxCount: 10 },
    { name: "documents", maxCount: 5 },
  ]),
  async (req, res, next) => {
    try {
      const {
        title, description, propertyType,
        address, city, state, country, zipCode,
        bedrooms, bathrooms, area, yearBuilt, amenities,
        totalValue, totalShares, pricePerShare, expectedAnnualReturn, rentalIncome,
        tokenName, tokenSymbol, tags,
      } = req.body;

      const images = req.files?.images?.map((f, i) => ({
        url: `/uploads/properties/images/${f.filename}`,
        caption: `Image ${i + 1}`,
        isPrimary: i === 0,
      })) || [];

      const documents = req.files?.documents?.map((f) => ({
        name: f.originalname,
        url: `/uploads/properties/documents/${f.filename}`,
        documentType: "other",
        uploadedAt: new Date(),
      })) || [];

      const property = await Property.create({
        owner: req.user._id,
        title,
        description,
        propertyType,
        location: { address, city, state, country, zipCode },
        details: {
          bedrooms: Number(bedrooms),
          bathrooms: Number(bathrooms),
          area: Number(area),
          yearBuilt: Number(yearBuilt),
          amenities: amenities ? JSON.parse(amenities) : [],
        },
        financials: {
          totalValue: Number(totalValue),
          totalShares: Number(totalShares),
          pricePerShare: Number(pricePerShare),
          expectedAnnualReturn: Number(expectedAnnualReturn),
          rentalIncome: Number(rentalIncome),
        },
        tokenization: { tokenName, tokenSymbol },
        images,
        documents,
        tags: tags ? JSON.parse(tags) : [],
        status: "pending_review",
      });

      res.status(201).json({ success: true, data: property });
    } catch (error) {
      next(error);
    }
  }
);

// ─── Update Property ──────────────────────────────────────────────────────────
router.put("/:id", authenticate, authorize("property_owner", "admin"), async (req, res, next) => {
  try {
    const property = await Property.findById(req.params.id);
    if (!property) {
      return res.status(404).json({ success: false, message: "Property not found" });
    }

    // Only owner or admin can update
    if (
      property.owner.toString() !== req.user._id.toString() &&
      req.user.role !== "admin"
    ) {
      return res.status(403).json({ success: false, message: "Not authorized" });
    }

    const updated = await Property.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    res.json({ success: true, data: updated });
  } catch (error) {
    next(error);
  }
});

// ─── Tokenize Property ────────────────────────────────────────────────────────
router.post(
  "/:id/tokenize",
  authenticate,
  authorize("property_owner", "admin"),
  requireKYC,
  async (req, res, next) => {
    try {
      const property = await Property.findById(req.params.id).populate("owner");
      if (!property) {
        return res.status(404).json({ success: false, message: "Property not found" });
      }

      if (property.owner._id.toString() !== req.user._id.toString() && req.user.role !== "admin") {
        return res.status(403).json({ success: false, message: "Not authorized" });
      }

      if (property.status !== "verified") {
        return res.status(400).json({ success: false, message: "Property must be verified before tokenization" });
      }

      if (property.tokenization.isTokenized) {
        return res.status(400).json({ success: false, message: "Property already tokenized" });
      }

      if (!property.owner.walletAddress) {
        return res.status(400).json({ success: false, message: "Property owner must connect a wallet first" });
      }

      // Deploy token contract via blockchain service
      const result = await blockchainService.tokenizeProperty({
        propertyId: property._id.toString(),
        tokenName: property.tokenization.tokenName,
        tokenSymbol: property.tokenization.tokenSymbol,
        totalShares: property.financials.totalShares,
        pricePerShareWei: req.body.pricePerShareWei,
        ownerAddress: property.owner.walletAddress,
      });

      await Property.findByIdAndUpdate(req.params.id, {
        "tokenization.isTokenized": true,
        "tokenization.contractAddress": result.contractAddress,
        "tokenization.blockchainPropertyId": result.propertyId,
        "tokenization.tokenizedAt": new Date(),
        "financials.pricePerShareWei": req.body.pricePerShareWei,
        status: "active",
      });

      // Notify owner
      await Notification.create({
        user: property.owner._id,
        title: "Property Tokenized",
        message: `Your property "${property.title}" has been successfully tokenized.`,
        type: "property_verified",
        relatedProperty: property._id,
      });

      res.json({ success: true, message: "Property tokenized successfully", data: result });
    } catch (error) {
      next(error);
    }
  }
);

// ─── Get Owner's Properties ───────────────────────────────────────────────────
router.get("/owner/my-properties", authenticate, authorize("property_owner", "admin"), async (req, res, next) => {
  try {
    const properties = await Property.find({ owner: req.user._id }).sort({ createdAt: -1 });
    res.json({ success: true, data: properties });
  } catch (error) {
    next(error);
  }
});

// ─── Get Property Transactions ────────────────────────────────────────────────
router.get("/:id/transactions", authenticate, async (req, res, next) => {
  try {
    const transactions = await Transaction.find({ property: req.params.id })
      .populate("fromUser", "firstName lastName email")
      .populate("toUser", "firstName lastName email")
      .sort({ createdAt: -1 })
      .limit(50);

    res.json({ success: true, data: transactions });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
