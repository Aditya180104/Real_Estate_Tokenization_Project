const mongoose = require("mongoose");

const notificationSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    title: { type: String, required: true },
    message: { type: String, required: true },
    type: {
      type: String,
      enum: [
        "property_verified",
        "property_rejected",
        "shares_purchased",
        "shares_sold",
        "revenue_distributed",
        "kyc_approved",
        "kyc_rejected",
        "system",
      ],
      default: "system",
    },
    relatedProperty: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Property",
    },
    relatedTransaction: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Transaction",
    },
    isRead: { type: Boolean, default: false },
    readAt: Date,
  },
  { timestamps: true }
);

notificationSchema.index({ user: 1, isRead: 1 });
notificationSchema.index({ createdAt: -1 });

module.exports = mongoose.model("Notification", notificationSchema);
