const mongoose = require("mongoose");

const transactionSchema = new mongoose.Schema(
  {
    property: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Property",
      required: true,
    },
    fromUser: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    toUser: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    fromAddress: String,
    toAddress: String,
    transactionType: {
      type: String,
      enum: ["purchase", "sale", "revenue_distribution", "revenue_claim", "transfer"],
      required: true,
    },
    shares: {
      type: Number,
      default: 0,
    },
    amountUSD: Number,
    amountWei: String,
    pricePerShareUSD: Number,
    pricePerShareWei: String,
    platformFeeWei: String,
    txHash: String,
    blockNumber: Number,
    status: {
      type: String,
      enum: ["pending", "confirmed", "failed"],
      default: "pending",
    },
    metadata: {
      type: Map,
      of: String,
    },
  },
  {
    timestamps: true,
  }
);

transactionSchema.index({ property: 1 });
transactionSchema.index({ fromUser: 1 });
transactionSchema.index({ toUser: 1 });
transactionSchema.index({ txHash: 1 });
transactionSchema.index({ createdAt: -1 });

module.exports = mongoose.model("Transaction", transactionSchema);
