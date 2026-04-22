# PropToken — Setup Guide

Complete setup instructions for the Real Estate Asset Tokenization Platform.

## Prerequisites

- **Node.js** v18+ and npm
- **MongoDB** v6+ (running locally or MongoDB Atlas)
- **MetaMask** browser extension
- **Git** (optional)

---

## Installation Steps

### 1. Install All Dependencies

From the project root:

```bash
npm run install:all
```

This installs dependencies for:
- Root project
- Backend (Node.js + Express)
- Frontend (React + Vite)
- Blockchain (Hardhat + Solidity)

### 2. Configure Environment

Copy the example environment file:

```bash
cp backend/.env.example backend/.env
```

Edit `backend/.env` with your configuration:

```env
# MongoDB connection string
MONGODB_URI=mongodb://localhost:27017/real-estate-tokenization

# JWT secret (change in production!)
JWT_SECRET=your_super_secret_jwt_key_change_in_production

# Blockchain RPC (local Hardhat node)
ETHEREUM_RPC_URL=http://127.0.0.1:8545

# For Sepolia testnet deployment (optional)
SEPOLIA_RPC_URL=https://sepolia.infura.io/v3/YOUR_INFURA_KEY
DEPLOYER_PRIVATE_KEY=your_private_key_here
ETHERSCAN_API_KEY=your_etherscan_api_key
```

### 3. Start MongoDB

**Local MongoDB:**
```bash
mongod
```

**Or use MongoDB Atlas** and update `MONGODB_URI` in `.env`

### 4. Seed the Database

Create demo users and sample properties:

```bash
cd backend
npm run seed
```

**Demo Accounts Created:**
- **Admin**: admin@realestate.com / Admin@123
- **Property Owner**: owner@realestate.com / Owner@123
- **Investor**: investor@realestate.com / Investor@123

### 5. Start Local Blockchain (Optional)

For full on-chain functionality, start a local Hardhat node:

```bash
cd blockchain
npm run node
```

This starts a local Ethereum node at `http://127.0.0.1:8545` with 20 test accounts.

**Keep this terminal running.**

### 6. Deploy Smart Contracts

In a new terminal:

```bash
cd blockchain
npm run compile
npm run deploy
```

This:
- Compiles `PropertyToken.sol` and `RealEstatePlatform.sol`
- Deploys contracts to the local network
- Copies ABIs to `backend/src/blockchain/` and `frontend/src/blockchain/`
- Saves deployment info to `blockchain/deployments/deployment.json`

**Note:** The deploy script automatically updates the contract addresses in the ABI files.

### 7. Start the Backend

```bash
cd backend
npm run dev
```

Backend runs at **http://localhost:5000**

API endpoints available at `/api/*`

### 8. Start the Frontend

In a new terminal:

```bash
cd frontend
npm run dev
```

Frontend runs at **http://localhost:3000**

---

## Using the Platform

### 1. Connect MetaMask

- Install MetaMask browser extension
- Add the local Hardhat network:
  - **Network Name**: Hardhat Local
  - **RPC URL**: http://127.0.0.1:8545
  - **Chain ID**: 31337
  - **Currency Symbol**: ETH

- Import a test account using one of the private keys from the Hardhat node output

### 2. Login

Navigate to http://localhost:3000/login

Use one of the demo accounts:
- **Admin**: admin@realestate.com / Admin@123
- **Owner**: owner@realestate.com / Owner@123
- **Investor**: investor@realestate.com / Investor@123

### 3. Admin Workflow

1. Login as admin
2. Navigate to **Users** → Approve KYC for property owners and investors
3. Navigate to **Properties** → Verify pending properties
4. Feature properties to show on homepage

### 4. Property Owner Workflow

1. Login as property owner
2. Connect MetaMask wallet
3. Navigate to **Add Property**
4. Fill in property details, upload images and documents
5. Submit for admin review
6. Once verified, click **Tokenize** to deploy the ERC20 token contract
7. Property becomes available for investment

### 5. Investor Workflow

1. Login as investor
2. Connect MetaMask wallet
3. Browse **Marketplace**
4. Click on a property → **Buy Shares**
5. Confirm MetaMask transaction
6. View portfolio and transaction history

---

## Project Structure

```
├── blockchain/              # Solidity smart contracts
│   ├── contracts/
│   │   ├── PropertyToken.sol          # ERC20 fractional ownership
│   │   └── RealEstatePlatform.sol     # Main platform contract
│   ├── scripts/deploy.js
│   └── hardhat.config.js
│
├── backend/                 # Node.js + Express API
│   ├── src/
│   │   ├── models/          # MongoDB schemas
│   │   ├── routes/          # API endpoints
│   │   ├── middleware/      # Auth, upload, error handling
│   │   ├── services/        # Blockchain service
│   │   └── server.js
│   └── .env
│
└── frontend/                # React + Vite
    ├── src/
    │   ├── pages/           # Route pages
    │   ├── components/      # UI components
    │   ├── store/           # Zustand state management
    │   ├── services/        # API client
    │   └── blockchain/      # Contract ABIs
    └── vite.config.js
```

---

## Deployment to Sepolia Testnet

### 1. Get Sepolia ETH

Get test ETH from a Sepolia faucet:
- https://sepoliafaucet.com/
- https://www.alchemy.com/faucets/ethereum-sepolia

### 2. Configure Environment

Update `backend/.env`:

```env
SEPOLIA_RPC_URL=https://sepolia.infura.io/v3/YOUR_INFURA_KEY
DEPLOYER_PRIVATE_KEY=your_private_key_with_sepolia_eth
ETHERSCAN_API_KEY=your_etherscan_api_key
```

### 3. Deploy to Sepolia

```bash
cd blockchain
npm run deploy:sepolia
```

### 4. Update MetaMask

Add Sepolia network to MetaMask:
- **Network Name**: Sepolia Testnet
- **RPC URL**: https://sepolia.infura.io/v3/YOUR_INFURA_KEY
- **Chain ID**: 11155111
- **Currency Symbol**: ETH
- **Block Explorer**: https://sepolia.etherscan.io

---

## Troubleshooting

### MongoDB Connection Error

**Error:** `MongoServerError: connect ECONNREFUSED`

**Solution:** Ensure MongoDB is running:
```bash
mongod
```

Or update `MONGODB_URI` in `.env` to use MongoDB Atlas.

### MetaMask Transaction Fails

**Error:** `insufficient funds for gas * price + value`

**Solution:** 
- Ensure your MetaMask account has ETH
- For local network, import a Hardhat test account
- For Sepolia, get test ETH from a faucet

### Contract Not Deployed

**Error:** `Platform contract ABI/address not loaded`

**Solution:** Deploy contracts first:
```bash
cd blockchain
npm run deploy
```

### Port Already in Use

**Error:** `EADDRINUSE: address already in use :::5000`

**Solution:** Kill the process using the port:
```bash
# Windows
netstat -ano | findstr :5000
taskkill /PID <PID> /F

# Linux/Mac
lsof -ti:5000 | xargs kill -9
```

Or change the port in `backend/.env`:
```env
PORT=5001
```

---

## API Documentation

### Authentication

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/auth/register` | POST | Register new user |
| `/api/auth/login` | POST | Login |
| `/api/auth/me` | GET | Get current user |
| `/api/auth/wallet` | PUT | Connect wallet |

### Properties

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/properties` | GET | List properties (with filters) |
| `/api/properties` | POST | Create property |
| `/api/properties/:id` | GET | Get property details |
| `/api/properties/:id/tokenize` | POST | Tokenize property |
| `/api/properties/owner/my-properties` | GET | Get owner's properties |

### Transactions

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/transactions/record` | POST | Record blockchain transaction |
| `/api/transactions/my-transactions` | GET | Get user transactions |
| `/api/transactions/portfolio` | GET | Get investor portfolio |

### Admin

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/admin/dashboard` | GET | Platform stats |
| `/api/admin/users` | GET | List all users |
| `/api/admin/users/:id/kyc` | PUT | Update KYC status |
| `/api/admin/properties` | GET | List all properties |
| `/api/admin/properties/:id/verify` | PUT | Verify property |
| `/api/admin/properties/:id/reject` | PUT | Reject property |

---

## Tech Stack

- **Frontend**: React 18, Vite, TailwindCSS, Zustand, React Query, Recharts
- **Backend**: Node.js, Express.js, MongoDB, Mongoose, JWT
- **Blockchain**: Ethereum, Solidity 0.8.20, Hardhat, OpenZeppelin, ethers.js v6
- **Wallet**: MetaMask integration

---

## Security Notes

- Change `JWT_SECRET` in production
- Never commit `.env` files
- Use environment variables for sensitive data
- Enable HTTPS in production
- Implement rate limiting (already configured)
- Validate all user inputs (already implemented)
- Use secure password hashing (bcrypt with 12 rounds)

---

## Support

For issues or questions:
1. Check the troubleshooting section
2. Review the README.md
3. Check contract events on Etherscan (for Sepolia)
4. Review backend logs for API errors

---

## License

MIT License - See LICENSE file for details
