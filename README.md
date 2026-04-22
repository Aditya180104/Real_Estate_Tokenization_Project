# PropToken — Real Estate Asset Tokenization Platform

A full-stack platform for fractional real estate ownership using blockchain technology.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18 + Vite + TailwindCSS |
| Backend | Node.js + Express.js |
| Database | MongoDB + Mongoose |
| Blockchain | Ethereum + Solidity (Hardhat) |
| Wallet | MetaMask (ethers.js v6) |
| Auth | JWT |

## Project Structure

```
├── blockchain/          # Solidity smart contracts (Hardhat)
│   ├── contracts/
│   │   ├── PropertyToken.sol       # ERC20 fractional ownership token
│   │   └── RealEstatePlatform.sol  # Main platform contract
│   └── scripts/deploy.js
│
├── backend/             # Node.js + Express API
│   └── src/
│       ├── models/      # Mongoose schemas
│       ├── routes/      # REST API routes
│       ├── middleware/  # Auth, upload, error handling
│       └── services/    # Blockchain service
│
└── frontend/            # React + Vite SPA
    └── src/
        ├── pages/       # Route pages (admin, investor, owner)
        ├── components/  # Reusable UI components
        ├── store/       # Zustand state (auth, wallet)
        └── blockchain/  # Contract ABIs
```

## Quick Start

### 1. Install dependencies

```bash
npm run install:all
```

### 2. Configure environment

```bash
cp backend/.env.example backend/.env
# Edit backend/.env with your values
```

### 3. Start MongoDB

```bash
mongod
```

### 4. Seed the database

```bash
npm run seed --prefix backend
```

Demo accounts created:
- **Admin**: admin@realestate.com / Admin@123
- **Owner**: owner@realestate.com / Owner@123
- **Investor**: investor@realestate.com / Investor@123

### 5. Start the blockchain node (optional, for full on-chain features)

```bash
npm run node --prefix blockchain
```

### 6. Deploy smart contracts

```bash
npm run deploy:contracts
```

This copies ABIs to `backend/src/blockchain/` and `frontend/src/blockchain/` automatically.

### 7. Start backend

```bash
npm run dev:backend
```

### 8. Start frontend

```bash
npm run dev:frontend
```

Open http://localhost:3000

---

## User Roles

### Admin
- Dashboard with platform stats and charts
- Verify/reject property listings
- Approve/reject user KYC
- Feature properties
- View all transactions

### Property Owner
- Register properties with images, documents, financials
- Submit for admin review
- Tokenize verified properties (deploys ERC20 contract)
- View property performance

### Investor
- Browse and search tokenized properties
- Connect MetaMask wallet
- Buy fractional shares (on-chain transaction)
- View portfolio with ownership percentages
- Transaction history with Etherscan links
- Claim rental revenue distributions

---

## Smart Contracts

### PropertyToken.sol (ERC20)
- Represents fractional ownership of a single property
- Deployed per property during tokenization
- Handles share purchases, revenue distribution, and claims
- Access controlled by RealEstatePlatform

### RealEstatePlatform.sol
- Central registry for all properties
- Manages user verification (KYC on-chain)
- Orchestrates property registration and token deployment
- Collects platform fees (2.5%)
- Tracks all transactions on-chain

---

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| POST | /api/auth/register | Register new user |
| POST | /api/auth/login | Login |
| GET | /api/auth/me | Get current user |
| GET | /api/properties | List properties (with filters) |
| POST | /api/properties | Create property |
| POST | /api/properties/:id/tokenize | Tokenize property |
| GET | /api/transactions/portfolio | Investor portfolio |
| POST | /api/transactions/record | Record blockchain tx |
| GET | /api/admin/dashboard | Admin stats |
| PUT | /api/admin/properties/:id/verify | Verify property |
| PUT | /api/admin/users/:id/kyc | Update KYC status |

---

## Deployment

### Sepolia Testnet

1. Get Sepolia ETH from a faucet
2. Set `SEPOLIA_RPC_URL` and `DEPLOYER_PRIVATE_KEY` in `.env`
3. Run: `npm run deploy:sepolia --prefix blockchain`

### Production

- Set `NODE_ENV=production` in backend `.env`
- Build frontend: `npm run build --prefix frontend`
- Serve frontend build from backend or a CDN
- Use MongoDB Atlas for database
- Use Infura/Alchemy for Ethereum RPC
