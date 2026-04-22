require("dotenv").config();
const mongoose = require("mongoose");
const User = require("../models/User");
const Property = require("../models/Property");

const seed = async () => {
  await mongoose.connect(process.env.MONGODB_URI || "mongodb://localhost:27017/real-estate-tokenization");
  console.log("Connected to MongoDB");

  // Clear existing data
  await User.deleteMany({});
  await Property.deleteMany({});

  // Create admin
  const admin = await User.create({
    email: "admin@realestate.com",
    password: "Admin@123",
    firstName: "Platform",
    lastName: "Admin",
    role: "admin",
    kycStatus: "verified",
    isActive: true,
  });

  // Create property owner
  const owner = await User.create({
    email: "owner@realestate.com",
    password: "Owner@123",
    firstName: "John",
    lastName: "Smith",
    role: "property_owner",
    kycStatus: "verified",
    walletAddress: "0x70997970c51812dc3a010c7d01b50e0d17dc79c8",
    isActive: true,
  });

  // Create investor
  const investor = await User.create({
    email: "investor@realestate.com",
    password: "Investor@123",
    firstName: "Jane",
    lastName: "Doe",
    role: "investor",
    kycStatus: "verified",
    walletAddress: "0x3c44cdddb6a900fa2b585dd299e03d12fa4293bc",
    isActive: true,
  });

  // Create sample properties
  const properties = [
    {
      owner: owner._id,
      title: "Luxury Downtown Apartment Complex",
      description: "A premium 24-unit apartment complex in the heart of downtown Manhattan. Features modern amenities, rooftop terrace, and concierge service.",
      propertyType: "residential",
      location: { address: "123 Park Avenue", city: "New York", state: "NY", country: "USA", zipCode: "10001" },
      details: { bedrooms: 2, bathrooms: 2, area: 1200, yearBuilt: 2018, amenities: ["Pool", "Gym", "Concierge", "Rooftop"] },
      financials: { totalValue: 5000000, totalShares: 1000, pricePerShare: 5000, expectedAnnualReturn: 8.5, rentalIncome: 35000 },
      tokenization: { tokenName: "Manhattan Apt Token", tokenSymbol: "MAT" },
      status: "active",
      featured: true,
      images: [{ url: "https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=800", caption: "Building exterior", isPrimary: true }],
    },
    {
      owner: owner._id,
      title: "Silicon Valley Tech Office Park",
      description: "Modern 3-building office complex in the heart of Silicon Valley. Fully leased to Fortune 500 tech companies.",
      propertyType: "commercial",
      location: { address: "456 Innovation Drive", city: "San Jose", state: "CA", country: "USA", zipCode: "95101" },
      details: { area: 50000, yearBuilt: 2020, amenities: ["Parking", "Cafeteria", "Conference Rooms", "EV Charging"] },
      financials: { totalValue: 15000000, totalShares: 5000, pricePerShare: 3000, expectedAnnualReturn: 7.2, rentalIncome: 90000 },
      tokenization: { tokenName: "SV Office Token", tokenSymbol: "SVOT" },
      status: "active",
      featured: true,
      images: [{ url: "https://images.unsplash.com/photo-1486325212027-8081e485255e?w=800", caption: "Office exterior", isPrimary: true }],
    },
    {
      owner: owner._id,
      title: "Miami Beach Vacation Villa",
      description: "Stunning oceanfront villa with private beach access. High-yield vacation rental property.",
      propertyType: "residential",
      location: { address: "789 Ocean Drive", city: "Miami Beach", state: "FL", country: "USA", zipCode: "33139" },
      details: { bedrooms: 5, bathrooms: 4, area: 4500, yearBuilt: 2015, amenities: ["Pool", "Beach Access", "Smart Home", "Garage"] },
      financials: { totalValue: 3500000, totalShares: 700, pricePerShare: 5000, expectedAnnualReturn: 12, rentalIncome: 25000 },
      tokenization: { tokenName: "Miami Villa Token", tokenSymbol: "MVT" },
      status: "pending_review",
      images: [{ url: "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=800", caption: "Villa exterior", isPrimary: true }],
    },
  ];

  await Property.insertMany(properties);

  console.log("✅ Seed data created:");
  console.log("  Admin: admin@realestate.com / Admin@123");
  console.log("  Owner: owner@realestate.com / Owner@123");
  console.log("  Investor: investor@realestate.com / Investor@123");

  await mongoose.disconnect();
  process.exit(0);
};

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});
