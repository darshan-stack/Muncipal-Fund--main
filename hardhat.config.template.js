require("@nomicfoundation/hardhat-toolbox");
require("@nomicfoundation/hardhat-verify");
require("dotenv").config();

// Hardhat Configuration for Municipal Fund Tracker
// Supports: Sepolia Testnet, Polygon Mumbai, Local Network

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: {
    version: "0.8.20",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200, // Optimize for deployment cost
      },
      viaIR: false, // Set to true if facing stack too deep errors
    },
  },

  networks: {
    // ========== ETHEREUM SEPOLIA (RECOMMENDED FOR HACKATHON) ==========
    sepolia: {
      url: process.env.SEPOLIA_RPC_URL || "https://sepolia.infura.io/v3/YOUR_INFURA_KEY",
      accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [],
      chainId: 11155111,
      gasPrice: "auto",
      timeout: 60000,
    },

    // ========== POLYGON MUMBAI (ALTERNATIVE) ==========
    polygonMumbai: {
      url: process.env.MUMBAI_RPC_URL || "https://rpc-mumbai.maticvigil.com/",
      accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [],
      chainId: 80001,
      gasPrice: 20000000000, // 20 gwei
      timeout: 60000,
    },

    // ========== LOCAL DEVELOPMENT ==========
    localhost: {
      url: "http://127.0.0.1:8545",
      chainId: 31337,
    },

    // ========== HARDHAT NETWORK (TESTING) ==========
    hardhat: {
      chainId: 31337,
      mining: {
        auto: true,
        interval: 0,
      },
    },
  },

  // ========== ETHERSCAN VERIFICATION ==========
  etherscan: {
    apiKey: {
      sepolia: process.env.ETHERSCAN_API_KEY,
      polygonMumbai: process.env.POLYGONSCAN_API_KEY,
    },
  },

  // ========== GAS REPORTER (OPTIONAL) ==========
  gasReporter: {
    enabled: process.env.REPORT_GAS === "true",
    currency: "USD",
    outputFile: "gas-report.txt",
    noColors: true,
  },

  // ========== PATHS ==========
  paths: {
    sources: "./contracts",
    tests: "./test",
    cache: "./cache",
    artifacts: "./artifacts",
  },
};

// ========== CONFIGURATION GUIDE ==========
/*

1. INSTALL DEPENDENCIES:
   npm install --save-dev hardhat @nomicfoundation/hardhat-toolbox @nomicfoundation/hardhat-verify dotenv

2. CREATE .env FILE:
   # Sepolia (Ethereum Testnet)
   SEPOLIA_RPC_URL=https://sepolia.infura.io/v3/YOUR_INFURA_PROJECT_ID
   PRIVATE_KEY=your_metamask_private_key_here
   ETHERSCAN_API_KEY=your_etherscan_api_key

   # Polygon Mumbai (Alternative)
   MUMBAI_RPC_URL=https://rpc-mumbai.maticvigil.com/
   POLYGONSCAN_API_KEY=your_polygonscan_api_key

   # Optional
   REPORT_GAS=true

3. GET CREDENTIALS:
   - Infura Project ID: https://infura.io/
   - Etherscan API Key: https://etherscan.io/myapikey
   - PolygonScan API Key: https://polygonscan.com/myapikey
   - MetaMask Private Key: Settings > Account Details > Export Private Key

4. GET TEST ETH:
   Sepolia: https://sepoliafaucet.com/
   Mumbai: https://faucet.polygon.technology/

5. COMPILE CONTRACT:
   npx hardhat compile

6. TEST LOCALLY:
   npx hardhat test

7. DEPLOY TO SEPOLIA:
   npx hardhat run scripts/deploy.js --network sepolia

8. VERIFY CONTRACT:
   npx hardhat verify --network sepolia CONTRACT_ADDRESS

⚠️  SECURITY WARNING:
   - NEVER commit .env file to git
   - Add .env to .gitignore
   - Never share your private key
   - Use separate wallet for testnet

*/
