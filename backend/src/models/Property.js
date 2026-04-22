const mongoose = require("mongoose");

const propertySchema = new mongoose.Schema(
  {
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      required: true,
    },
    propertyType: {
      type: String,
      enum: ["residential", "commercial", "industrial", "land", "mixed_use"],
      required: true,
    },
    location: {
      address: { type: String, required: true },
      city: { type: String, required: true },
      state: { type: String, required: true },
      country: { type: String, required: true },
      zipCode: String,
      coordinates: {
        lat: Number,
        lng: Number,
      },
    },
    details: {
      bedrooms: Number,
      bathrooms: Number,
      area: Number, // sq ft
      yearBuilt: Number,
      amenities: [String],
    },
    financials: {
      totalValue: { type: Number, required: true }, // USD
      totalValueWei: { type: String }, // wei string
      totalShares: { type: Number, required: true },
      pricePerShare: { type: Number, required: true }, // USD
      pricePerShareWei: { type: String }, // wei string
      expectedAnnualReturn: Number, // percentage
      rentalIncome: Number, // monthly USD
    },
    tokenization: {
      tokenName: String,
      tokenSymbol: String,
      contractAddress: String,
      blockchainPropertyId: Number,
      isTokenized: { type: Boolean, default: false },
      tokenizedAt: Date,
    },
    images: [
      {
        url: String,
        caption: String,
        isPrimary: { type: Boolean, default: false },
      },
    ],
    documents: [
      {
        name: String,
        url: String,
        documentType: {
          type: String,
          enum: ["title_deed", "inspection_report", "financial_statement", "legal_document", "other"],
        },
        uploadedAt: { type: Date, default: Date.now },
      },
    ],
    status: {
      type: String,
      enum: ["draft", "pending_review", "verified", "active", "suspended", "delisted"],
      default: "draft",
    },
    verifiedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    verifiedAt: Date,
    rejectionReason: String,
    tags: [String],
    featured: { type: Boolean, default: false },
    viewCount: { type: Number, default: 0 },
  },
  {
    timestamps: true,
  }
);

// Indexes for search
propertySchema.index({ "location.city": 1, "location.country": 1 });
propertySchema.index({ status: 1 });
propertySchema.index({ propertyType: 1 });
propertySchema.index({ "financials.pricePerShare": 1 });
propertySchema.index({ title: "text", description: "text", "location.city": "text" });

module.exports = mongoose.model("Property", propertySchema);
