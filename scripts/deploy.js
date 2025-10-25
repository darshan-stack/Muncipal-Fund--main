const hre = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
    console.log("🚀 Deploying Anonymous Tender System...\n");
    
    // Get deployer account
    const [deployer] = await hre.ethers.getSigners();
    console.log(`📋 Deploying with account: ${deployer.address}`);
    
    const balance = await deployer.getBalance();
    console.log(`💰 Account balance: ${hre.ethers.utils.formatEther(balance)} ETH\n`);
    
    // Deploy contract
    console.log("⏳ Deploying FundTracker contract...");
    const FundTracker = await hre.ethers.getContractFactory("FundTracker");
    const contract = await FundTracker.deploy();
    
    await contract.deployed();
    
    console.log(`\n✅ Contract deployed successfully!`);
    console.log(`📍 Contract address: ${contract.address}`);
    console.log(`🔗 Network: ${hre.network.name}`);
    
    // Get network-specific explorer URL
    let explorerUrl = "";
    if (hre.network.name === "sepolia") {
        explorerUrl = `https://sepolia.etherscan.io/address/${contract.address}`;
    } else if (hre.network.name === "polygon") {
        explorerUrl = `https://polygonscan.com/address/${contract.address}`;
    } else if (hre.network.name === "localhost" || hre.network.name === "hardhat") {
        explorerUrl = "Local network - no explorer";
    }
    
    console.log(`🔍 View on Explorer: ${explorerUrl}`);
    
    // Save deployment info
    const deploymentInfo = {
        network: hre.network.name,
        contractAddress: contract.address,
        deployerAddress: deployer.address,
        deployedAt: new Date().toISOString(),
        explorerUrl: explorerUrl,
        blockNumber: contract.deployTransaction.blockNumber
    };
    
    // Save to frontend directory
    const frontendDir = path.join(__dirname, "..", "frontend");
    const deploymentPath = path.join(frontendDir, "contractAddress.json");
    
    if (!fs.existsSync(frontendDir)) {
        fs.mkdirSync(frontendDir, { recursive: true });
    }
    
    fs.writeFileSync(deploymentPath, JSON.stringify(deploymentInfo, null, 2));
    console.log(`\n💾 Deployment info saved to: ${deploymentPath}`);
    
    // Save contract ABI
    const artifactPath = path.join(__dirname, "..", "artifacts", "contracts", "FundTracker.sol", "FundTracker.json");
    if (fs.existsSync(artifactPath)) {
        const artifact = JSON.parse(fs.readFileSync(artifactPath, "utf8"));
        const abiPath = path.join(frontendDir, "contractABI.json");
        fs.writeFileSync(abiPath, JSON.stringify(artifact.abi, null, 2));
        console.log(`💾 Contract ABI saved to: ${abiPath}`);
    }
    
    // Instructions
    console.log("\n📋 Next steps:");
    console.log("=" * 50);
    
    if (hre.network.name === "sepolia") {
        console.log("1. Verify contract on Etherscan:");
        console.log(`   npx hardhat verify --network sepolia ${contract.address}`);
        console.log("\n2. Fund contract with test ETH from Sepolia faucet:");
        console.log("   https://sepoliafaucet.com/");
        console.log("\n3. Test with demo transactions");
    } else if (hre.network.name === "localhost") {
        console.log("1. Contract is deployed to local Hardhat network");
        console.log("2. Start the frontend to interact with the contract");
        console.log("3. Use Hardhat test accounts for testing");
    }
    
    console.log("\n✨ Deployment complete!");
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error("❌ Deployment failed:");
        console.error(error);
        process.exit(1);
    });
