const hre = require("hardhat");

async function main() {
  console.log("\n🚀 Starting FundTracker Deployment...\n");
  console.log("=" .repeat(60));
  
  // Get deployer account
  const [deployer] = await hre.ethers.getSigners();
  const network = hre.network.name;
  
  console.log("📋 Deployment Information:");
  console.log("-".repeat(60));
  console.log("Network:", network);
  console.log("Deployer Address:", deployer.address);
  
  // Check balance
  const balance = await hre.ethers.provider.getBalance(deployer.address);
  const balanceInEth = hre.ethers.formatEther(balance);
  console.log("Account Balance:", balanceInEth, "ETH");
  console.log("=" .repeat(60));
  
  // Check if sufficient balance
  if (parseFloat(balanceInEth) < 0.1) {
    console.warn("\n⚠️  WARNING: Low balance! You may need more ETH for deployment.");
    console.warn("Get test ETH from:");
    if (network === "sepolia") {
      console.warn("  - https://sepoliafaucet.com/");
      console.warn("  - https://www.infura.io/faucet/sepolia");
    } else if (network === "polygonMumbai") {
      console.warn("  - https://faucet.polygon.technology/");
    }
    console.log();
  }
  
  // Deploy contract
  console.log("\n📦 Deploying FundTracker Contract...\n");
  
  const FundTracker = await hre.ethers.getContractFactory("FundTracker");
  
  console.log("⏳ Deploying... (this may take 30-60 seconds)");
  const fundTracker = await FundTracker.deploy();
  
  console.log("⏳ Waiting for deployment transaction to be mined...");
  await fundTracker.waitForDeployment();
  
  const contractAddress = await fundTracker.getAddress();
  
  console.log("\n" + "=".repeat(60));
  console.log("✅ DEPLOYMENT SUCCESSFUL!");
  console.log("=".repeat(60));
  console.log("\n📍 Contract Address:", contractAddress);
  
  // Network-specific explorer links
  if (network === "sepolia") {
    console.log("🔗 Etherscan:", `https://sepolia.etherscan.io/address/${contractAddress}`);
  } else if (network === "polygonMumbai") {
    console.log("🔗 PolygonScan:", `https://mumbai.polygonscan.com/address/${contractAddress}`);
  }
  
  console.log("\n📋 Environment Variable:");
  console.log("-".repeat(60));
  console.log(`REACT_APP_CONTRACT_ADDRESS=${contractAddress}`);
  console.log("-".repeat(60));
  
  // Get deployment transaction details
  const deployTx = fundTracker.deploymentTransaction();
  console.log("\n💎 Transaction Details:");
  console.log("-".repeat(60));
  console.log("Transaction Hash:", deployTx.hash);
  console.log("Block Number:", deployTx.blockNumber || "Pending...");
  console.log("Gas Limit:", deployTx.gasLimit?.toString() || "N/A");
  
  if (deployTx.gasPrice) {
    const gasPriceGwei = hre.ethers.formatUnits(deployTx.gasPrice, "gwei");
    console.log("Gas Price:", gasPriceGwei, "Gwei");
  }
  
  // Calculate estimated cost
  if (deployTx.gasLimit && deployTx.gasPrice) {
    const estimatedCost = deployTx.gasLimit * deployTx.gasPrice;
    const costInEth = hre.ethers.formatEther(estimatedCost);
    console.log("Estimated Cost:", costInEth, "ETH");
  }
  console.log("-".repeat(60));
  
  // Wait for confirmations
  console.log("\n⏳ Waiting for 5 block confirmations...");
  const receipt = await deployTx.wait(5);
  
  console.log("✅ Confirmed! Block Number:", receipt.blockNumber);
  
  // Verify contract on block explorer
  if (network === "sepolia" || network === "polygonMumbai") {
    console.log("\n🔍 Verifying contract on block explorer...");
    console.log("This may take a minute...\n");
    
    try {
      await hre.run("verify:verify", {
        address: contractAddress,
        constructorArguments: [],
      });
      
      console.log("✅ Contract verified successfully!");
      
      if (network === "sepolia") {
        console.log("🔗 View verified contract:", `https://sepolia.etherscan.io/address/${contractAddress}#code`);
      } else if (network === "polygonMumbai") {
        console.log("🔗 View verified contract:", `https://mumbai.polygonscan.com/address/${contractAddress}#code`);
      }
    } catch (error) {
      if (error.message.includes("Already Verified")) {
        console.log("✅ Contract already verified!");
      } else {
        console.error("❌ Verification failed:", error.message);
        console.log("\n📝 You can manually verify using:");
        console.log(`npx hardhat verify --network ${network} ${contractAddress}`);
      }
    }
  }
  
  // Display next steps
  console.log("\n" + "=".repeat(60));
  console.log("🎉 DEPLOYMENT COMPLETE!");
  console.log("=".repeat(60));
  
  console.log("\n📝 Next Steps:");
  console.log("-".repeat(60));
  console.log("1. Copy the contract address above");
  console.log("2. Add to frontend/.env:");
  console.log(`   REACT_APP_CONTRACT_ADDRESS=${contractAddress}`);
  console.log("3. Update your frontend configuration");
  console.log("4. Test your application!");
  
  if (network === "sepolia") {
    console.log("\n5. Share with judges:");
    console.log(`   Contract: https://sepolia.etherscan.io/address/${contractAddress}`);
  } else if (network === "polygonMumbai") {
    console.log("\n5. Share with judges:");
    console.log(`   Contract: https://mumbai.polygonscan.com/address/${contractAddress}`);
  }
  
  console.log("\n" + "=".repeat(60));
  
  // Save deployment info to file
  const fs = require("fs");
  const deploymentInfo = {
    network: network,
    contractAddress: contractAddress,
    deployer: deployer.address,
    transactionHash: deployTx.hash,
    blockNumber: receipt.blockNumber,
    timestamp: new Date().toISOString(),
  };
  
  const filename = `deployment-${network}-${Date.now()}.json`;
  fs.writeFileSync(filename, JSON.stringify(deploymentInfo, null, 2));
  console.log(`\n💾 Deployment info saved to: ${filename}\n`);
  
  console.log("=" .repeat(60));
  console.log("✅ All done! Your contract is live on the blockchain! 🎉");
  console.log("=" .repeat(60));
  console.log();
}

// Execute deployment
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("\n" + "=".repeat(60));
    console.error("❌ DEPLOYMENT FAILED");
    console.error("=".repeat(60));
    console.error("\nError:", error.message);
    
    if (error.message.includes("insufficient funds")) {
      console.error("\n💡 Solution: Get more test ETH from faucet");
    } else if (error.message.includes("nonce")) {
      console.error("\n💡 Solution: Reset your MetaMask account");
      console.error("   Settings > Advanced > Reset Account");
    } else if (error.message.includes("network")) {
      console.error("\n💡 Solution: Check your RPC URL in hardhat.config.js");
    }
    
    console.error("\n" + "=".repeat(60));
    process.exit(1);
  });
