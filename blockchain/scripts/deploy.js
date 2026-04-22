const { ethers } = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
  console.log("🚀 Deploying Real Estate Tokenization Platform...\n");

  const [deployer] = await ethers.getSigners();
  console.log(`Deployer address: ${deployer.address}`);
  console.log(`Deployer balance: ${ethers.formatEther(await ethers.provider.getBalance(deployer.address))} ETH\n`);

  // Deploy RealEstatePlatform
  const platformFeePercent = 250; // 2.5%
  const feeRecipient = deployer.address;

  const RealEstatePlatform = await ethers.getContractFactory("RealEstatePlatform");
  const platform = await RealEstatePlatform.deploy(feeRecipient, platformFeePercent);
  await platform.waitForDeployment();

  const platformAddress = await platform.getAddress();
  console.log(`✅ RealEstatePlatform deployed to: ${platformAddress}`);

  // Verify deployer as user (for testing)
  await platform.verifyUser(deployer.address);
  console.log(`✅ Deployer verified as user`);

  // Save deployment info
  const deploymentInfo = {
    network: (await ethers.provider.getNetwork()).name,
    chainId: (await ethers.provider.getNetwork()).chainId.toString(),
    deployer: deployer.address,
    contracts: {
      RealEstatePlatform: platformAddress,
    },
    deployedAt: new Date().toISOString(),
  };

  const deploymentsDir = path.join(__dirname, "../deployments");
  if (!fs.existsSync(deploymentsDir)) {
    fs.mkdirSync(deploymentsDir, { recursive: true });
  }

  fs.writeFileSync(
    path.join(deploymentsDir, "deployment.json"),
    JSON.stringify(deploymentInfo, null, 2)
  );

  // Copy ABI to backend
  const artifactsDir = path.join(__dirname, "../artifacts/contracts");
  const backendDir = path.join(__dirname, "../../backend/src/blockchain");

  if (!fs.existsSync(backendDir)) {
    fs.mkdirSync(backendDir, { recursive: true });
  }

  // Copy platform ABI
  const platformArtifact = JSON.parse(
    fs.readFileSync(
      path.join(artifactsDir, "RealEstatePlatform.sol/RealEstatePlatform.json"),
      "utf8"
    )
  );

  const tokenArtifact = JSON.parse(
    fs.readFileSync(
      path.join(artifactsDir, "PropertyToken.sol/PropertyToken.json"),
      "utf8"
    )
  );

  fs.writeFileSync(
    path.join(backendDir, "RealEstatePlatform.json"),
    JSON.stringify({ abi: platformArtifact.abi, address: platformAddress }, null, 2)
  );

  fs.writeFileSync(
    path.join(backendDir, "PropertyToken.json"),
    JSON.stringify({ abi: tokenArtifact.abi }, null, 2)
  );

  // Copy to frontend
  const frontendDir = path.join(__dirname, "../../frontend/src/blockchain");
  if (!fs.existsSync(frontendDir)) {
    fs.mkdirSync(frontendDir, { recursive: true });
  }

  fs.writeFileSync(
    path.join(frontendDir, "RealEstatePlatform.json"),
    JSON.stringify({ abi: platformArtifact.abi, address: platformAddress }, null, 2)
  );

  fs.writeFileSync(
    path.join(frontendDir, "PropertyToken.json"),
    JSON.stringify({ abi: tokenArtifact.abi }, null, 2)
  );

  console.log("\n📁 ABIs copied to backend and frontend");
  console.log("\n🎉 Deployment complete!");
  console.log("─".repeat(50));
  console.log(JSON.stringify(deploymentInfo, null, 2));
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
