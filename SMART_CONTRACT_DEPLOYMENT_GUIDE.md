# 🚀 Smart Contract Deployment Guide - Polygon Mumbai

## Complete Guide to Deploy FundTracker.sol to Polygon Mumbai Testnet

---

## 📋 Prerequisites

### 1. Install Required Tools

```bash
# Install Node.js (v16 or higher)
https://nodejs.org/

# Install Hardhat
npm install --save-dev hardhat

# Install dependencies
npm install --save-dev @nomicfoundation/hardhat-toolbox
npm install --save-dev @nomiclabs/hardhat-ethers ethers
```

### 2. Get Polygon Mumbai MATIC

1. Visit Mumbai Faucet: https://faucet.polygon.technology/
2. Enter your wallet address
3. Select "Mumbai" network
4. Request test MATIC
5. Wait 1-2 minutes for tokens to arrive

**Alternative Faucets:**
- https://mumbaifaucet.com/
- https://faucet.quicknode.com/polygon/mumbai

### 3. Get RPC URL (Choose one)

**Option A: Alchemy (Recommended)**
1. Sign up: https://www.alchemy.com/
2. Create new app → Select "Polygon Mumbai"
3. Copy HTTP URL: `https://polygon-mumbai.g.alchemy.com/v2/YOUR_API_KEY`

**Option B: Infura**
1. Sign up: https://infura.io/
2. Create project → Select "Polygon Mumbai"
3. Copy endpoint URL

**Option C: QuickNode**
1. Sign up: https://www.quicknode.com/
2. Create endpoint → Select "Polygon Mumbai"
3. Copy HTTP provider URL

---

## 🛠️ Step 1: Project Setup

### Create Hardhat Project

```bash
cd "C:\Users\SAKSHI SANJAY CHAVAN\Downloads\Muncipal-Fund--main\Muncipal-Fund--main"

# Initialize Hardhat project
npx hardhat
# Select: "Create a JavaScript project"
# Accept defaults

# Install dependencies
npm install
```

---

## 🔐 Step 2: Configuration

### Create .env file in project root

```env
# .env file
PRIVATE_KEY=your_metamask_private_key_here
ALCHEMY_API_KEY=your_alchemy_api_key_here
POLYGONSCAN_API_KEY=your_polygonscan_api_key_here
```

**⚠️ CRITICAL: How to get Private Key from MetaMask**
1. Open MetaMask
2. Click 3 dots → Account details
3. Click "Export Private Key"
4. Enter password
5. Copy the key (NEVER share this!)

**Get Polygonscan API Key:**
1. Visit: https://polygonscan.com/apis
2. Sign up/Login
3. Create API Key
4. Copy the key

### Update hardhat.config.js

Create file: `hardhat.config.js`

```javascript
require("@nomicfoundation/hardhat-toolbox");
require('dotenv').config();

module.exports = {
  solidity: {
    version: "0.8.20",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200,
      },
    },
  },
  networks: {
    polygonMumbai: {
      url: `https://polygon-mumbai.g.alchemy.com/v2/${process.env.ALCHEMY_API_KEY}`,
      accounts: [process.env.PRIVATE_KEY],
      chainId: 80001,
      gasPrice: 20000000000, // 20 gwei
    },
  },
  etherscan: {
    apiKey: {
      polygonMumbai: process.env.POLYGONSCAN_API_KEY,
    },
  },
  paths: {
    sources: "./contracts",
    tests: "./test",
    cache: "./cache",
    artifacts: "./artifacts",
  },
};
```

---

## 📝 Step 3: Create Deployment Script

Create file: `scripts/deploy.js`

```javascript
const hre = require("hardhat");

async function main() {
  console.log("🚀 Starting FundTracker deployment to Polygon Mumbai...\n");

  // Get deployer account
  const [deployer] = await hre.ethers.getSigners();
  console.log("📍 Deploying contracts with account:", deployer.address);

  // Check balance
  const balance = await hre.ethers.provider.getBalance(deployer.address);
  console.log("💰 Account balance:", hre.ethers.formatEther(balance), "MATIC\n");

  if (balance === 0n) {
    console.error("❌ Insufficient funds! Get test MATIC from faucet:");
    console.error("   https://faucet.polygon.technology/");
    process.exit(1);
  }

  // Deploy FundTracker contract
  console.log("📦 Deploying FundTracker contract...");
  const FundTracker = await hre.ethers.getContractFactory("FundTracker");
  const fundTracker = await FundTracker.deploy();

  await fundTracker.waitForDeployment();
  const address = await fundTracker.getAddress();

  console.log("\n✅ FundTracker deployed successfully!");
  console.log("📍 Contract address:", address);
  console.log("🔗 Polygonscan:", `https://mumbai.polygonscan.com/address/${address}`);

  // Wait for block confirmations
  console.log("\n⏳ Waiting for 5 block confirmations...");
  await fundTracker.deploymentTransaction().wait(5);
  console.log("✅ Confirmed!\n");

  // Verify contract on Polygonscan
  console.log("🔍 Verifying contract on Polygonscan...");
  try {
    await hre.run("verify:verify", {
      address: address,
      constructorArguments: [],
    });
    console.log("✅ Contract verified on Polygonscan!");
  } catch (error) {
    if (error.message.includes("already verified")) {
      console.log("ℹ️  Contract already verified");
    } else {
      console.error("❌ Verification failed:", error.message);
      console.log("ℹ️  You can verify manually later");
    }
  }

  // Save deployment info
  const fs = require("fs");
  const deploymentInfo = {
    contractAddress: address,
    deployer: deployer.address,
    network: "Polygon Mumbai",
    chainId: 80001,
    blockNumber: await hre.ethers.provider.getBlockNumber(),
    timestamp: new Date().toISOString(),
    polygonscanUrl: `https://mumbai.polygonscan.com/address/${address}`,
  };

  fs.writeFileSync(
    "deployment-info.json",
    JSON.stringify(deploymentInfo, null, 2)
  );

  console.log("\n📄 Deployment info saved to deployment-info.json");
  console.log("\n🎉 Deployment complete!");
  console.log("\n📌 Next steps:");
  console.log("1. Update FUND_TRACKER_CONTRACT_ADDRESS in frontend/src/config/web3Config.js");
  console.log(`2. Replace with: "${address}"`);
  console.log("3. Test the contract on Mumbai network");
  console.log("4. Fund the contract with MATIC for milestone payments\n");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
```

---

## 🚀 Step 4: Deploy Contract

```bash
# Deploy to Polygon Mumbai
npx hardhat run scripts/deploy.js --network polygonMumbai
```

**Expected Output:**
```
🚀 Starting FundTracker deployment to Polygon Mumbai...
📍 Deploying contracts with account: 0xYourAddress...
💰 Account balance: 2.5 MATIC
📦 Deploying FundTracker contract...
✅ FundTracker deployed successfully!
📍 Contract address: 0xAbC123...
🔗 Polygonscan: https://mumbai.polygonscan.com/address/0xAbC123...
```

---

## ✅ Step 5: Verify Deployment

### Check on Polygonscan
1. Open the Polygonscan URL from deployment output
2. You should see:
   - ✅ Contract code
   - ✅ Transaction history
   - ✅ Verified checkmark (green)

### Test Contract Functions

```bash
# Open Hardhat console
npx hardhat console --network polygonMumbai
```

```javascript
// Get contract instance
const FundTracker = await ethers.getContractFactory("FundTracker");
const contract = await FundTracker.attach("0xYourContractAddress");

// Test reading
const projectCount = await contract.projectCount();
console.log("Project count:", projectCount.toString());

// Test creating project
const tx = await contract.createProject(
  "Test Project",
  ethers.parseEther("1.0"),
  ethers.keccak256(ethers.toUtf8Bytes("supervisor123")),
  "Mumbai",
  "Task 1", "Task 2", "Task 3", "Task 4", "Task 5"
);
await tx.wait();
console.log("Project created!");
```

---

## 🔧 Step 6: Update Frontend Configuration

### Update web3Config.js

```javascript
// frontend/src/config/web3Config.js

// Replace this line:
export const FUND_TRACKER_CONTRACT_ADDRESS = '0x0000000000000000000000000000000000000000';

// With your deployed contract address:
export const FUND_TRACKER_CONTRACT_ADDRESS = '0xYourActualContractAddress';
```

### Update .env file (frontend)

```env
# frontend/.env

REACT_APP_BACKEND_URL=http://localhost:5000
REACT_APP_FUND_TRACKER_ADDRESS=0xYourContractAddress
REACT_APP_POLYGON_MUMBAI_RPC=https://polygon-mumbai.g.alchemy.com/v2/YOUR_KEY
REACT_APP_WEB3_STORAGE_TOKEN=your_web3_storage_token
```

---

## 💰 Step 7: Fund the Contract

The contract needs MATIC to pay contractors for milestones.

```bash
# Send MATIC to contract
# In MetaMask or programmatically:

# Using Hardhat console:
npx hardhat console --network polygonMumbai

const [deployer] = await ethers.getSigners();
const tx = await deployer.sendTransaction({
  to: "0xYourContractAddress",
  value: ethers.parseEther("10.0") // Send 10 MATIC
});
await tx.wait();
console.log("Contract funded with 10 MATIC");
```

---

## 🧪 Step 8: Test Complete Flow

### 1. Test Project Creation

```javascript
// In Hardhat console
const contract = await ethers.getContractAt("FundTracker", "0xYourAddress");

const tx = await contract.createProject(
  "Mumbai Road Construction",
  ethers.parseEther("5.0"),
  ethers.keccak256(ethers.toUtf8Bytes("supervisor")),
  "Mumbai, Maharashtra",
  "Site preparation and boundary marking",
  "Foundation and excavation",
  "Main structure construction",
  "Finishing and fixtures",
  "Final inspection and handover"
);

const receipt = await tx.wait();
console.log("✅ Project created! TX:", receipt.hash);
console.log("🔗 View on Polygonscan:", `https://mumbai.polygonscan.com/tx/${receipt.hash}`);
```

### 2. Test Milestone Submission

```javascript
// Submit milestone as contractor
const tx = await contract.submitMilestone(
  1, // tenderId
  20, // 20% complete
  "Completed site preparation and boundary marking",
  "QmIPFSHashForImages",
  "19.0760,72.8777",
  "QmIPFSHashForDocs",
  ethers.keccak256(ethers.toUtf8Bytes("quality-data"))
);

await tx.wait();
console.log("✅ Milestone submitted!");
```

### 3. Test Oracle Verification

```javascript
// Verify and release funds as supervisor
const tx = await contract.verifyAndReleaseFunds(
  1, // milestoneId
  true, // quality verified
  true, // GPS verified
  true, // progress verified
  { value: ethers.parseEther("1.0") } // Send payment
);

await tx.wait();
console.log("✅ Milestone verified! Funds released to contractor!");
```

---

## 📊 Monitoring & Analytics

### View Contract Events

```javascript
// Listen to ProjectCreated events
const filter = contract.filters.ProjectCreated();
const events = await contract.queryFilter(filter);

events.forEach(event => {
  console.log("Project ID:", event.args.projectId.toString());
  console.log("Name:", event.args.name);
  console.log("Budget:", ethers.formatEther(event.args.budget));
});
```

### Check Contract Balance

```javascript
const balance = await ethers.provider.getBalance("0xContractAddress");
console.log("Contract balance:", ethers.formatEther(balance), "MATIC");
```

---

## 🔒 Security Checklist

- ✅ Private keys stored in .env (never commit!)
- ✅ .env added to .gitignore
- ✅ Contract verified on Polygonscan
- ✅ Test all functions on testnet first
- ✅ Use multi-sig for admin functions (production)
- ✅ Set up monitoring for contract events
- ✅ Regular security audits

---

## 🆘 Troubleshooting

### Error: Insufficient funds
**Solution:** Get more test MATIC from faucet

### Error: Nonce too high
**Solution:** Reset MetaMask account

### Error: Contract verification failed
**Solution:** Verify manually on Polygonscan:
1. Go to contract page
2. Click "Contract" → "Verify and Publish"
3. Select compiler version 0.8.20
4. Paste contract code
5. Submit

### Error: Transaction reverted
**Solution:** Check:
- Correct parameters
- Sufficient gas
- Contract state allows operation

---

## 📚 Additional Resources

- **Hardhat Docs:** https://hardhat.org/docs
- **Polygon Docs:** https://docs.polygon.technology/
- **Mumbai Faucet:** https://faucet.polygon.technology/
- **Polygonscan Mumbai:** https://mumbai.polygonscan.com/
- **Ethers.js Docs:** https://docs.ethers.org/v6/

---

## 🎉 You're Done!

Your smart contract is now live on Polygon Mumbai testnet with:
- ✅ Real blockchain transactions
- ✅ Verified contract code
- ✅ Polygonscan integration
- ✅ Automatic payment system
- ✅ Quality report tracking

**All transactions will show real hashes on Polygonscan!** 🚀
