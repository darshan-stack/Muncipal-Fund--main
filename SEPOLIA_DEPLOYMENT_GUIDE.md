# 🚀 SEPOLIA TESTNET DEPLOYMENT GUIDE

## Why Sepolia for Hackathon?

**Judges WILL Ask:** "Show me the contract address on Etherscan"

Sepolia is **ETHEREUM's official testnet** - more credible than Polygon for demonstrations:
- ✅ Shows on **Etherscan** (same as Ethereum mainnet)
- ✅ Free test ETH from faucets
- ✅ Contract verification included
- ✅ Professional blockchain explorer

---

## ⚡ QUICK DEPLOYMENT (5 Minutes)

### Prerequisites:
```bash
# Ensure you have:
- MetaMask installed
- Node.js 16+ installed
- Project files ready
```

### Step 1: Get Test ETH (2 minutes)

Visit these faucets and get 0.5-1 SepoliaETH:

1. **Infura Sepolia Faucet** (Best)
   - https://www.infura.io/faucet/sepolia
   - Login with Google/GitHub
   - Get 0.5 ETH per request

2. **Alchemy Sepolia Faucet**
   - https://sepoliafaucet.com/
   - Login with Alchemy account
   - Get 0.5 ETH per day

3. **Sepolia PoW Faucet**
   - https://sepolia-faucet.pk910.de/
   - Mine test ETH
   - No registration needed

### Step 2: Install Hardhat (1 minute)

```bash
# In project root
npm install --save-dev hardhat @nomicfoundation/hardhat-toolbox @nomicfoundation/hardhat-verify

# Initialize Hardhat
npx hardhat init
# Select: "Create a TypeScript project" or "Create a JavaScript project"
```

### Step 3: Configure Hardhat (1 minute)

Create `hardhat.config.js`:

```javascript
require("@nomicfoundation/hardhat-toolbox");
require("@nomicfoundation/hardhat-verify");

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
    sepolia: {
      url: process.env.SEPOLIA_RPC_URL || "https://sepolia.infura.io/v3/YOUR_INFURA_KEY",
      accounts: [process.env.PRIVATE_KEY],
      chainId: 11155111,
    },
  },
  etherscan: {
    apiKey: process.env.ETHERSCAN_API_KEY,
  },
};
```

### Step 4: Create .env File

```bash
# .env (DO NOT COMMIT!)
SEPOLIA_RPC_URL=https://sepolia.infura.io/v3/YOUR_INFURA_PROJECT_ID
PRIVATE_KEY=your_metamask_private_key_here
ETHERSCAN_API_KEY=your_etherscan_api_key

# Get Infura Project ID from: https://infura.io/
# Get Etherscan API Key from: https://etherscan.io/myapikey
```

⚠️ **CRITICAL:** Add `.env` to `.gitignore`!

```bash
echo ".env" >> .gitignore
```

### Step 5: Create Deploy Script (30 seconds)

Create `scripts/deploy.js`:

```javascript
const hre = require("hardhat");

async function main() {
  console.log("🚀 Deploying FundTracker to Sepolia...\n");

  const [deployer] = await hre.ethers.getSigners();
  console.log("Deploying with account:", deployer.address);
  
  const balance = await hre.ethers.provider.getBalance(deployer.address);
  console.log("Account balance:", hre.ethers.formatEther(balance), "ETH\n");

  // Deploy contract
  const FundTracker = await hre.ethers.getContractFactory("FundTracker");
  console.log("Deploying contract...");
  
  const fundTracker = await FundTracker.deploy();
  await fundTracker.waitForDeployment();

  const address = await fundTracker.getAddress();

  console.log("\n✅ FundTracker deployed successfully!\n");
  console.log("📍 Contract Address:", address);
  console.log("🔗 Etherscan:", `https://sepolia.etherscan.io/address/${address}`);
  console.log("\n📋 Add this to your frontend:");
  console.log(`REACT_APP_CONTRACT_ADDRESS=${address}`);
  console.log("\n⏳ Waiting for block confirmations...");

  // Wait for 5 confirmations before verifying
  await fundTracker.deploymentTransaction().wait(5);

  console.log("\n🔍 Verifying contract on Etherscan...");
  
  try {
    await hre.run("verify:verify", {
      address: address,
      constructorArguments: [],
    });
    console.log("✅ Contract verified on Etherscan!");
  } catch (error) {
    console.error("❌ Verification failed:", error.message);
    console.log("\nManual verification command:");
    console.log(`npx hardhat verify --network sepolia ${address}`);
  }

  console.log("\n🎉 DEPLOYMENT COMPLETE!");
  console.log("\n📝 Next steps:");
  console.log("1. Copy contract address to frontend .env");
  console.log("2. Update REACT_APP_CONTRACT_ADDRESS");
  console.log("3. Visit Etherscan to verify contract");
  console.log("4. Test your dApp!");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
```

### Step 6: Deploy! (1 minute)

```bash
# Deploy to Sepolia
npx hardhat run scripts/deploy.js --network sepolia

# You'll see:
# 🚀 Deploying FundTracker to Sepolia...
# Deploying with account: 0xYourAddress
# Account balance: 0.5 ETH
# Deploying contract...
# ✅ FundTracker deployed successfully!
# 📍 Contract Address: 0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb
# 🔗 Etherscan: https://sepolia.etherscan.io/address/0x742...
# ✅ Contract verified on Etherscan!
# 🎉 DEPLOYMENT COMPLETE!
```

**COPY THE CONTRACT ADDRESS!** You'll need it!

---

## 🔍 Step 7: Verify on Etherscan

### Automatic Verification (Included in deploy script):
The script automatically verifies your contract after deployment.

### Manual Verification (if automatic fails):

```bash
npx hardhat verify --network sepolia YOUR_CONTRACT_ADDRESS
```

### What You'll See on Etherscan:

Visit: `https://sepolia.etherscan.io/address/YOUR_CONTRACT_ADDRESS`

✅ Contract source code visible  
✅ Read/Write functions available  
✅ Transaction history  
✅ Event logs  
✅ Verified ✓ checkmark  

---

## 📱 Step 8: Update Frontend

### Update .env:
```bash
# frontend/.env
REACT_APP_CONTRACT_ADDRESS=0xYourDeployedAddress
REACT_APP_NETWORK=sepolia
REACT_APP_CHAIN_ID=11155111
REACT_APP_RPC_URL=https://sepolia.infura.io/v3/YOUR_PROJECT_ID
```

### Update web3Config.js:
```javascript
// frontend/src/config/web3Config.js

export const SEPOLIA_CONFIG = {
  chainId: '0xaa36a7', // 11155111 in hex
  chainName: 'Sepolia Testnet',
  nativeCurrency: {
    name: 'Sepolia ETH',
    symbol: 'ETH',
    decimals: 18,
  },
  rpcUrls: ['https://sepolia.infura.io/v3/YOUR_INFURA_KEY'],
  blockExplorerUrls: ['https://sepolia.etherscan.io/'],
};

export const FUND_TRACKER_CONTRACT_ADDRESS = '0xYourContractAddress';

export const getEtherscanTxUrl = (txHash) => {
  return `https://sepolia.etherscan.io/tx/${txHash}`;
};

export const getEtherscanAddressUrl = (address) => {
  return `https://sepolia.etherscan.io/address/${address}`;
};
```

---

## 🧪 Step 9: Test Your Contract

### Via Etherscan (No Code):

1. Go to your contract on Etherscan
2. Click "Write Contract"
3. Connect MetaMask
4. Test functions like `createProject`, `allocateFunds`

### Via Frontend:

```bash
cd frontend
npm start
```

1. Connect MetaMask (switch to Sepolia)
2. Create a project
3. Confirm transaction in MetaMask
4. Wait for transaction to be mined
5. Click "View on Etherscan"
6. ✅ **Transaction will be visible!**

---

## 🎯 FOR JUDGES: DEMO PREPARATION

### 1. Have Ready:
- ✅ Contract address: `0x742d35Cc...`
- ✅ Etherscan link: `https://sepolia.etherscan.io/address/0x742...`
- ✅ Transaction history showing real blockchain activity
- ✅ Verified contract source code

### 2. Demo Script:

> **You:** "Our contract is deployed on Ethereum Sepolia testnet at address 0x742d35Cc..."
> 
> **Judge:** "Show me on Etherscan"
> 
> **You:** *Opens Etherscan link* "Here's our verified contract with 15 transactions..."
> 
> **You:** *Shows recent transaction* "This is a real milestone submission with GPS verification and automatic fund release..."
> 
> **Judge:** ✅ **IMPRESSED!**

### 3. Key Points to Mention:
- "Contract is **verified** on Etherscan"
- "Funds are **locked** on-chain, released automatically"
- "GPS verification happens **on-chain**"
- "Citizens can **verify** everything on Etherscan"
- "No human approval needed - **smart contract enforces** rules"

---

## 🔧 Troubleshooting

### Error: "Insufficient funds"
**Solution:** Get more test ETH from faucets (see Step 1)

### Error: "Nonce too high"
**Solution:** Reset MetaMask account (Settings > Advanced > Reset Account)

### Error: "Already verified"
**Solution:** Skip verification, contract already verified!

### Error: "Invalid API key"
**Solution:** Get Etherscan API key from https://etherscan.io/myapikey

### Error: "Cannot find module hardhat"
**Solution:** Run `npm install` in project root

---

## 💡 Pro Tips

### 1. Save Gas:
```javascript
// In hardhat.config.js
optimizer: {
  enabled: true,
  runs: 200, // Lower = cheaper deployment
}
```

### 2. Multiple Deployments:
If you need to deploy multiple times (fixing bugs), just run deploy again. Each deployment gets a new address.

### 3. Keep Track:
Save deployment info:
```bash
npx hardhat run scripts/deploy.js --network sepolia | tee deployment-log.txt
```

### 4. Test First:
Test on local network before Sepolia:
```bash
npx hardhat node
# In another terminal:
npx hardhat run scripts/deploy.js --network localhost
```

---

## 📊 Cost Estimate

| Action | Gas Cost | ETH Cost (at 20 gwei) |
|--------|----------|----------------------|
| Deploy Contract | ~3,500,000 gas | ~0.07 ETH |
| Create Project | ~200,000 gas | ~0.004 ETH |
| Submit Milestone | ~150,000 gas | ~0.003 ETH |
| Release Funds | ~100,000 gas | ~0.002 ETH |

**Total for full demo:** ~0.1 ETH (FREE from faucets!)

---

## ✅ Deployment Checklist

Pre-Deployment:
- [ ] Hardhat installed
- [ ] .env file created with keys
- [ ] Test ETH received in wallet
- [ ] Contract compiles successfully
- [ ] .env added to .gitignore

Deployment:
- [ ] Deployed to Sepolia
- [ ] Contract address copied
- [ ] Verified on Etherscan
- [ ] Frontend updated with address

Post-Deployment:
- [ ] Tested via Etherscan
- [ ] Tested via frontend
- [ ] Transaction visible on Etherscan
- [ ] Demo prepared for judges

---

## 🎉 SUCCESS!

Your contract is now:
- ✅ Deployed on Ethereum Sepolia
- ✅ Verified on Etherscan
- ✅ Publicly accessible
- ✅ Ready to impress judges!

**Show judges this URL:**
```
https://sepolia.etherscan.io/address/YOUR_CONTRACT_ADDRESS
```

**Your winning points:**
- Real blockchain deployment ✓
- Verified contract source code ✓
- Automatic fund release ✓
- GPS verification ✓
- Citizen transparency ✓

---

## 📞 Need Help?

Common commands:
```bash
# Compile contract
npx hardhat compile

# Test locally
npx hardhat test

# Deploy to Sepolia
npx hardhat run scripts/deploy.js --network sepolia

# Verify contract
npx hardhat verify --network sepolia CONTRACT_ADDRESS

# Check deployment
npx hardhat console --network sepolia
```

**You're ready to win! 🏆**
