const express = require("express");
const router = express.Router();
const { body, validationResult } = require("express-validator");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const { authenticate } = require("../middleware/auth");

const generateToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN || "7d" });

// ─── Register ────────────────────────────────────────────────────────────────
router.post(
  "/register",
  [
    body("email").isEmail().normalizeEmail(),
    body("password").isLength({ min: 6 }),
    body("firstName").notEmpty().trim(),
    body("lastName").notEmpty().trim(),
    body("role").isIn(["property_owner", "investor"]),
  ],
  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ success: false, errors: errors.array() });
      }

      const { email, password, firstName, lastName, role, phoneNumber } = req.body;

      const existingUser = await User.findOne({ email });
      if (existingUser) {
        return res.status(409).json({ success: false, message: "Email already registered" });
      }

      const user = await User.create({ email, password, firstName, lastName, role, phoneNumber });
      const token = generateToken(user._id);

      res.status(201).json({
        success: true,
        message: "Registration successful",
        token,
        user,
      });
    } catch (error) {
      next(error);
    }
  }
);

// ─── Login ───────────────────────────────────────────────────────────────────
router.post(
  "/login",
  [body("email").isEmail().normalizeEmail(), body("password").notEmpty()],
  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ success: false, errors: errors.array() });
      }

      const { email, password } = req.body;
      const user = await User.findOne({ email }).select("+password");

      if (!user || !(await user.comparePassword(password))) {
        return res.status(401).json({ success: false, message: "Invalid email or password" });
      }

      if (!user.isActive) {
        return res.status(401).json({ success: false, message: "Account is deactivated" });
      }

      user.lastLogin = new Date();
      await user.save({ validateBeforeSave: false });

      const token = generateToken(user._id);

      res.json({
        success: true,
        message: "Login successful",
        token,
        user,
      });
    } catch (error) {
      next(error);
    }
  }
);

// ─── Get Current User ─────────────────────────────────────────────────────────
router.get("/me", authenticate, async (req, res) => {
  res.json({ success: true, user: req.user });
});

// ─── Update Profile ───────────────────────────────────────────────────────────
router.put("/profile", authenticate, async (req, res, next) => {
  try {
    const { firstName, lastName, phoneNumber, address } = req.body;
    const user = await User.findByIdAndUpdate(
      req.user._id,
      { firstName, lastName, phoneNumber, address },
      { new: true, runValidators: true }
    );
    res.json({ success: true, user });
  } catch (error) {
    next(error);
  }
});

// ─── Connect Wallet ───────────────────────────────────────────────────────────
router.put("/wallet", authenticate, async (req, res, next) => {
  try {
    const { walletAddress } = req.body;
    if (!walletAddress || !/^0x[a-fA-F0-9]{40}$/.test(walletAddress)) {
      return res.status(400).json({ success: false, message: "Invalid wallet address" });
    }

    // Check if wallet is already used by another user
    const existing = await User.findOne({
      walletAddress: walletAddress.toLowerCase(),
      _id: { $ne: req.user._id },
    });
    if (existing) {
      return res.status(409).json({ success: false, message: "Wallet already connected to another account" });
    }

    const user = await User.findByIdAndUpdate(
      req.user._id,
      { walletAddress: walletAddress.toLowerCase() },
      { new: true }
    );
    res.json({ success: true, user });
  } catch (error) {
    next(error);
  }
});

// ─── Change Password ──────────────────────────────────────────────────────────
router.put(
  "/change-password",
  authenticate,
  [body("currentPassword").notEmpty(), body("newPassword").isLength({ min: 6 })],
  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ success: false, errors: errors.array() });
      }

      const { currentPassword, newPassword } = req.body;
      const user = await User.findById(req.user._id).select("+password");

      if (!(await user.comparePassword(currentPassword))) {
        return res.status(401).json({ success: false, message: "Current password is incorrect" });
      }

      user.password = newPassword;
      await user.save();

      res.json({ success: true, message: "Password updated successfully" });
    } catch (error) {
      next(error);
    }
  }
);

module.exports = router;
