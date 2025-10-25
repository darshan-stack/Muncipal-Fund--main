# 🚀 Deploy Using Remix IDE (FASTEST METHOD)

Since Hardhat has installation issues, use Remix IDE to deploy quickly:

## Step 1: Open Remix IDE
1. Go to https://remix.ethereum.org
2. Wait for it to load

## Step 2: Upload Contract
1. In Remix, click "File" icon (📁) on left sidebar
2. Right-click on "contracts" folder
3. Select "New File"
4. Name it `FundTracker.sol`
5. Copy-paste the entire contract from: `c:\Users\SAKSHI SANJAY CHAVAN\Downloads\Muncipal-Fund--main\Muncipal-Fund--main\contracts\FundTracker.sol`

## Step 3: Compile
1. Click "Solidity Compiler" icon (🔨) on left sidebar
2. Select compiler version: `0.8.20`
3. Enable "Optimization": 200 runs
4. Click "Compile FundTracker.sol"
5. Wait for green checkmark ✅

## Step 4: Deploy Locally (For Testing)
1. Click "Deploy & Run" icon (🚀) on left sidebar
2. Select Environment: **"Remix VM (Shanghai)"** ← This creates local blockchain
3. Contract dropdown should show "FundTracker"
4. Click orange "Deploy" button
5. Contract appears under "Deployed Contracts" section

## Step 5: Deploy to Polygon Mainnet (REAL MONEY!)
⚠️ **WARNING**: This uses REAL MATIC tokens! Make sure you have MATIC in your wallet!

1. Install MetaMask extension if not installed
2. In MetaMask, switch network to **Polygon Mainnet**
3. In Remix, select Environment: **"Injected Provider - MetaMask"**
4. MetaMask will popup - click "Connect"
5. Your address should appear: `0xB3191a7Ce360c1708ED3b4288822e8b892Ae7E55`
6. Click orange "Deploy" button
7. MetaMask popup - review gas fees - click "Confirm"
8. Wait for transaction to confirm (30-60 seconds)
9. **COPY THE CONTRACT ADDRESS** from Deployed Contracts section

## Step 6: Get Contract ABI
1. In Remix, click "Solidity Compiler" icon
2. Scroll down to "Compilation Details" button
3. Click it
4. Find "ABI" section
5. Click copy icon 📋
6. Save this ABI - you'll need it for the backend!

## Step 7: Update Backend
1. Open `backend\.env`
2. Set `CONTRACT_ADDRESS=<the address you copied>`
3. Change `RPC_URL=https://polygon-mainnet.infura.io/v3/bf7b48767df14f50b99c46ae2e4bf3b8`
4. Save the ABI to `frontend/contractABI.json`

## Step 8: Test Contract Functions
In Remix, under "Deployed Contracts":
- Expand the contract
- You'll see all functions
- Orange buttons = write functions (cost gas)
- Blue buttons = read functions (free)

Try:
1. `createProject` - Create a test project
2. `getProject` - Read the project details
3. `submitAnonymousTender` - Submit anonymous tender

## Alternative: Use Ganache (Local Blockchain)
If you want local blockchain:
1. Download Ganache: https://trufflesuite.com/ganache/
2. Install and run it
3. It creates blockchain at `http://127.0.0.1:7545`
4. In Remix, use "External Http Provider"
5. Enter: `http://127.0.0.1:7545`

---

## 🔑 Your Keys (REMINDER TO ROTATE!)
- Private Key: `7eb87f0730b7635a8483f4c2d8fb39a69cef7990b8e3e93b4a44a765df6df77e`
- Address: `0xB3191a7Ce360c1708ED3b4288822e8b892Ae7E55`
- Infura API: `bf7b48767df14f50b99c46ae2e4bf3b8`
- Polygon RPC: `https://polygon-mainnet.infura.io/v3/bf7b48767df14f50b99c46ae2e4bf3b8`

⚠️ **CRITICAL**: Transfer all funds from this wallet and create a NEW one! The private key was exposed!
