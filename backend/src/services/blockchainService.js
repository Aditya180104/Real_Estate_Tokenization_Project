const { ethers } = require("ethers");
const path = require("path");
const fs = require("fs");

let platformABI, platformAddress, tokenABI;

// Load ABIs (generated after contract deployment)
const loadABIs = () => {
  try {
    const platformPath = path.join(__dirname, "../blockchain/RealEstatePlatform.json");
    const tokenPath = path.join(__dirname, "../blockchain/PropertyToken.json");

    if (fs.existsSync(platformPath)) {
      const platformData = JSON.parse(fs.readFileSync(platformPath, "utf8"));
      platformABI = platformData.abi;
      platformAddress = platformData.address;
    }

    if (fs.existsSync(tokenPath)) {
      const tokenData = JSON.parse(fs.readFileSync(tokenPath, "utf8"));
      tokenABI = tokenData.abi;
    }
  } catch (error) {
    console.warn("Blockchain ABIs not loaded:", error.message);
  }
};

loadABIs();

const getProvider = () => {
  const rpcUrl = process.env.ETHEREUM_RPC_URL || "http://127.0.0.1:8545";
  return new ethers.JsonRpcProvider(rpcUrl);
};

const getSigner = () => {
  const provider = getProvider();
  const privateKey = process.env.DEPLOYER_PRIVATE_KEY;
  if (!privateKey) throw new Error("DEPLOYER_PRIVATE_KEY not set");
  return new ethers.Wallet(privateKey, provider);
};

const getPlatformContract = (signerOrProvider) => {
  if (!platformABI || !platformAddress) {
    throw new Error("Platform contract ABI/address not loaded. Deploy contracts first.");
  }
  return new ethers.Contract(platformAddress, platformABI, signerOrProvider);
};

const getTokenContract = (contractAddress, signerOrProvider) => {
  if (!tokenABI) throw new Error("Token ABI not loaded");
  return new ethers.Contract(contractAddress, tokenABI, signerOrProvider);
};

// ─── Platform Functions ───────────────────────────────────────────────────────

const verifyUser = async (walletAddress) => {
  const signer = getSigner();
  const platform = getPlatformContract(signer);
  const tx = await platform.verifyUser(walletAddress);
  await tx.wait();
  return tx.hash;
};

const tokenizeProperty = async ({
  propertyId,
  tokenName,
  tokenSymbol,
  totalShares,
  pricePerShareWei,
  ownerAddress,
}) => {
  const signer = getSigner();
  const platform = getPlatformContract(signer);

  // First verify the owner on-chain if not already
  try {
    const isVerified = await platform.isUserVerified(ownerAddress);
    if (!isVerified) {
      const verifyTx = await platform.verifyUser(ownerAddress);
      await verifyTx.wait();
    }
  } catch (e) {
    console.warn("Could not verify user on-chain:", e.message);
  }

  const tx = await platform.registerProperty(
    tokenName || "Property",
    "Unknown Location",
    pricePerShareWei * totalShares,
    totalShares,
    pricePerShareWei,
    `ipfs://placeholder/${propertyId}`,
    tokenName || "PropToken",
    tokenSymbol || "PROP"
  );

  const receipt = await tx.wait();

  // Extract property ID and token contract from events
  const event = receipt.logs
    .map((log) => {
      try {
        return platform.interface.parseLog(log);
      } catch {
        return null;
      }
    })
    .find((e) => e?.name === "PropertyRegistered");

  return {
    txHash: tx.hash,
    propertyId: event?.args?.propertyId?.toString(),
    contractAddress: event?.args?.tokenContract,
  };
};

const verifyPropertyOnChain = async (blockchainPropertyId) => {
  const signer = getSigner();
  const platform = getPlatformContract(signer);
  const tx = await platform.verifyProperty(blockchainPropertyId);
  await tx.wait();
  return tx.hash;
};

const activatePropertyOnChain = async (blockchainPropertyId) => {
  const signer = getSigner();
  const platform = getPlatformContract(signer);
  const tx = await platform.activateProperty(blockchainPropertyId);
  await tx.wait();
  return tx.hash;
};

// ─── Token Data ───────────────────────────────────────────────────────────────

const getPropertyTokenData = async (contractAddress) => {
  const provider = getProvider();
  const token = getTokenContract(contractAddress, provider);

  const [
    totalShares,
    pricePerShare,
    tradingEnabled,
    propertyVerified,
    availableShares,
    shareholderCount,
  ] = await Promise.all([
    token.totalShares(),
    token.pricePerShare(),
    token.tradingEnabled(),
    token.propertyVerified(),
    token.getAvailableShares(),
    token.getShareholderCount(),
  ]);

  return {
    totalShares: totalShares.toString(),
    pricePerShare: pricePerShare.toString(),
    tradingEnabled,
    propertyVerified,
    availableShares: availableShares.toString(),
    shareholderCount: shareholderCount.toString(),
  };
};

const getInvestorPortfolio = async (walletAddress) => {
  const provider = getProvider();
  const platform = getPlatformContract(provider);

  const [propertyIds, shareBalances, ownershipPercentages] =
    await platform.getInvestorPortfolio(walletAddress);

  return propertyIds.map((id, i) => ({
    blockchainPropertyId: id.toString(),
    shares: shareBalances[i].toString(),
    ownershipPercentage: ownershipPercentages[i].toString(),
  }));
};

const getShareBalance = async (contractAddress, walletAddress) => {
  const provider = getProvider();
  const token = getTokenContract(contractAddress, provider);
  const balance = await token.balanceOf(walletAddress);
  return balance.toString();
};

const getPendingRevenue = async (contractAddress, walletAddress) => {
  const provider = getProvider();
  const token = getTokenContract(contractAddress, provider);
  const pending = await token.getPendingRevenue(walletAddress);
  return pending.toString();
};

module.exports = {
  verifyUser,
  tokenizeProperty,
  verifyPropertyOnChain,
  activatePropertyOnChain,
  getPropertyTokenData,
  getInvestorPortfolio,
  getShareBalance,
  getPendingRevenue,
  loadABIs,
};
