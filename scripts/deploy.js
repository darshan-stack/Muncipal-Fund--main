const hre = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
    console.log("🚀 Deploying Municipal Fund Tracker to Blockchain...\n");
    
    // Get deployer account
    const [deployer] = await hre.ethers.getSigners();
    console.log(`📋 Deploying with account: ${deployer.address}`);
    
    const balance = await hre.ethers.provider.getBalance(deployer.address);
    const balanceFormatted = hre.ethers.formatEther(balance);
    console.log(`💰 Account balance: ${balanceFormatted} ${hre.network.name === 'mumbai' ? 'MATIC' : 'ETH'}\n`);
    
    if (balance === 0n) {
        console.log("❌ ERROR: Insufficient balance!");
        if (hre.network.name === 'mumbai') {
            console.log("   Get free testnet MATIC from: https://faucet.polygon.technology/");
        } else {
            console.log("   Fund your wallet with testnet tokens");
        }
        process.exit(1);
    }
    
    // Deploy contract
    console.log("⏳ Deploying FundTracker contract...");
    const FundTracker = await hre.ethers.getContractFactory("FundTracker");
    const contract = await FundTracker.deploy();
    
    await contract.waitForDeployment();
    const contractAddress = await contract.getAddress();
    
    console.log(`\n✅ Contract deployed successfully!`);
    console.log(`📍 Contract address: ${contractAddress}`);
    console.log(`🔗 Network: ${hre.network.name}`);
    
    // Get network-specific explorer URL
    let explorerUrl = "";
    if (hre.network.name === "sepolia") {
        explorerUrl = `https://sepolia.etherscan.io/address/${contractAddress}`;
    } else if (hre.network.name === "polygon") {
        explorerUrl = `https://polygonscan.com/address/${contractAddress}`;
    } else if (hre.network.name === "mumbai") {
        explorerUrl = `https://mumbai.polygonscan.com/address/${contractAddress}`;
    } else if (hre.network.name === "localhost" || hre.network.name === "hardhat") {
        explorerUrl = "Local network - no explorer";
    }
    
    console.log(`🔍 View on Explorer: ${explorerUrl}`);
    
    // Save deployment info
    const deploymentInfo = {
        network: hre.network.name,
        contractAddress: contractAddress,
        deployerAddress: deployer.address,
        deployedAt: new Date().toISOString(),
        explorerUrl: explorerUrl,
        blockNumber: await hre.ethers.provider.getBlockNumber()
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
    
    // Update web3Config.js with deployed address
    console.log("\n⏳ Updating frontend configuration...");
    const configPath = path.join(frontendDir, "src", "config", "web3Config.js");
    
    if (fs.existsSync(configPath)) {
        let configContent = fs.readFileSync(configPath, "utf8");
        
        // Replace the placeholder address with the deployed address
        const oldAddress = "0x0000000000000000000000000000000000000000";
        configContent = configContent.replace(
            `export const FUND_TRACKER_CONTRACT_ADDRESS = '${oldAddress}';`,
            `export const FUND_TRACKER_CONTRACT_ADDRESS = '${contractAddress}';`
        );
        
        // Also replace any other instances
        configContent = configContent.replace(new RegExp(oldAddress, 'g'), contractAddress);
        
        fs.writeFileSync(configPath, configContent);
        console.log(`✅ Updated: frontend/src/config/web3Config.js`);
        console.log(`✅ Contract address configured: ${contractAddress}`);
        console.log(`✅ Demo mode automatically disabled!`);
    } else {
        console.log(`⚠️  Warning: Could not find web3Config.js at ${configPath}`);
        console.log(`   Please manually update FUND_TRACKER_CONTRACT_ADDRESS to: ${contractAddress}`);
    }
    
    // Instructions
    console.log("\n📋 Next steps:");
    console.log("=".repeat(70));
    
    if (hre.network.name === "mumbai") {
        console.log("\n✅ DEPLOYMENT SUCCESSFUL TO MUMBAI TESTNET!");
        console.log("\n1. Contract is now live on Polygon Mumbai");
        console.log("2. Frontend config automatically updated");
        console.log("3. Demo mode automatically disabled");
        console.log("\n🧪 To test:");
        console.log("   - Restart frontend: cd frontend && npm start");
        console.log("   - Go to: http://localhost:3000/contractor/signup");
        console.log("   - Register a contractor with MetaMask");
        console.log("   - You'll get a REAL blockchain ID!");
        console.log(`\n🔍 Verify on Polygonscan: ${explorerUrl}`);
        console.log("\n🎉 Your Municipal Fund Tracker is now 100% blockchain-secured!");
    } else if (hre.network.name === "sepolia") {
        console.log("1. Verify contract on Etherscan:");
        console.log(`   npx hardhat verify --network sepolia ${contractAddress}`);
        console.log("\n2. Fund contract with test ETH from Sepolia faucet:");
        console.log("   https://sepoliafaucet.com/");
        console.log("\n3. Test with demo transactions");
    } else if (hre.network.name === "localhost") {
        console.log("1. Contract is deployed to local Hardhat network");
        console.log("2. Start the frontend to interact with the contract");
        console.log("3. Use Hardhat test accounts for testing");
    }
    
    console.log("\n✨ Deployment complete!");
    console.log("=".repeat(70));
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error("❌ Deployment failed:");
        console.error(error);
        process.exit(1);
    });
