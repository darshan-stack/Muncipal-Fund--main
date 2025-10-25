// Web3 Configuration for Polygon Mumbai Testnet

export const POLYGON_MUMBAI_CONFIG = {
  chainId: '0x13881', // 80001 in hex
  chainName: 'Polygon Mumbai Testnet',
  nativeCurrency: {
    name: 'MATIC',
    symbol: 'MATIC',
    decimals: 18
  },
  rpcUrls: [
    'https://rpc-mumbai.maticvigil.com',
    'https://matic-mumbai.chainstacklabs.com',
    'https://polygon-mumbai.g.alchemy.com/v2/YOUR_ALCHEMY_KEY' // Replace with your Alchemy key
  ],
  blockExplorerUrls: ['https://mumbai.polygonscan.com/']
};

// Contract Address (Update after deployment)
// For testing without deployed contract, using a placeholder address
// IMPORTANT: Replace this with your actual deployed contract address
export const FUND_TRACKER_CONTRACT_ADDRESS = '0x0000000000000000000000000000000000000000'; // UPDATE THIS AFTER DEPLOYMENT

// Contract ABI (Updated with registerContractor function)
export const FUND_TRACKER_ABI = [
  // ========== CONTRACTOR REGISTRATION ==========
  {
    "inputs": [
      { "internalType": "string", "name": "_name", "type": "string" }
    ],
    "name": "registerContractor",
    "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "anonymous": false,
    "inputs": [
      { "indexed": true, "internalType": "address", "name": "contractor", "type": "address" },
      { "indexed": true, "internalType": "uint256", "name": "blockchainId", "type": "uint256" },
      { "indexed": false, "internalType": "string", "name": "name", "type": "string" }
    ],
    "name": "ContractorRegistered",
    "type": "event"
  },
  {
    "inputs": [
      { "internalType": "address", "name": "_contractor", "type": "address" }
    ],
    "name": "getContractorProfile",
    "outputs": [
      {
        "components": [
          { "internalType": "address", "name": "walletAddress", "type": "address" },
          { "internalType": "uint256", "name": "blockchainId", "type": "uint256" },
          { "internalType": "string", "name": "name", "type": "string" },
          { "internalType": "bool", "name": "isRegistered", "type": "bool" },
          { "internalType": "uint256", "name": "registeredAt", "type": "uint256" },
          { "internalType": "uint256", "name": "projectsCompleted", "type": "uint256" },
          { "internalType": "uint256", "name": "totalEarned", "type": "uint256" }
        ],
        "internalType": "struct FundTracker.ContractorProfile",
        "name": "",
        "type": "tuple"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      { "internalType": "uint256", "name": "_blockchainId", "type": "uint256" }
    ],
    "name": "getContractorByBlockchainId",
    "outputs": [
      { "internalType": "address", "name": "", "type": "address" }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  // ========== PROJECT MANAGEMENT ==========
  {
    "inputs": [
      { "internalType": "string", "name": "_name", "type": "string" },
      { "internalType": "uint256", "name": "_budget", "type": "uint256" },
      { "internalType": "bytes32", "name": "_supervisorCommitment", "type": "bytes32" },
      { "internalType": "string", "name": "_location", "type": "string" },
      { "internalType": "string", "name": "_milestone1Task", "type": "string" },
      { "internalType": "string", "name": "_milestone2Task", "type": "string" },
      { "internalType": "string", "name": "_milestone3Task", "type": "string" },
      { "internalType": "string", "name": "_milestone4Task", "type": "string" },
      { "internalType": "string", "name": "_milestone5Task", "type": "string" }
    ],
    "name": "createProject",
    "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      { "internalType": "uint256", "name": "_projectId", "type": "uint256" },
      { "internalType": "bytes32", "name": "_contractorCommitment", "type": "bytes32" },
      { "internalType": "string", "name": "_encryptedContractorDataIPFS", "type": "string" },
      { "internalType": "string", "name": "_tenderDocIPFS", "type": "string" },
      { "internalType": "string", "name": "_qualityReportIPFS", "type": "string" }
    ],
    "name": "submitAnonymousTender",
    "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      { "internalType": "uint256", "name": "_tenderId", "type": "uint256" },
      { "internalType": "address", "name": "_revealedContractor", "type": "address" },
      { "internalType": "bytes32", "name": "_nonce", "type": "bytes32" }
    ],
    "name": "approveTender",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      { "internalType": "uint256", "name": "_tenderId", "type": "uint256" },
      { "internalType": "uint8", "name": "_percentageComplete", "type": "uint8" },
      { "internalType": "string", "name": "_completionProof", "type": "string" },
      { "internalType": "string", "name": "_proofImagesIPFS", "type": "string" },
      { "internalType": "string", "name": "_gpsCoordinates", "type": "string" },
      { "internalType": "string", "name": "_architectureDocsIPFS", "type": "string" },
      { "internalType": "bytes32", "name": "_qualityHash", "type": "bytes32" }
    ],
    "name": "submitMilestone",
    "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      { "internalType": "uint256", "name": "_milestoneId", "type": "uint256" },
      { "internalType": "bool", "name": "_qualityVerified", "type": "bool" },
      { "internalType": "bool", "name": "_gpsVerified", "type": "bool" },
      { "internalType": "bool", "name": "_progressVerified", "type": "bool" }
    ],
    "name": "verifyAndReleaseFunds",
    "outputs": [],
    "stateMutability": "payable",
    "type": "function"
  },
  {
    "inputs": [
      { "internalType": "uint256", "name": "_tenderId", "type": "uint256" },
      { "internalType": "string", "name": "_qualityReportIPFS", "type": "string" }
    ],
    "name": "submitFinalQualityReport",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [{ "internalType": "address", "name": "_contractor", "type": "address" }],
    "name": "isContractorEligible",
    "outputs": [
      { "internalType": "bool", "name": "", "type": "bool" },
      { "internalType": "uint256", "name": "", "type": "uint256" }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [{ "internalType": "uint256", "name": "_projectId", "type": "uint256" }],
    "name": "getProject",
    "outputs": [
      {
        "components": [
          { "internalType": "uint256", "name": "id", "type": "uint256" },
          { "internalType": "string", "name": "name", "type": "string" },
          { "internalType": "uint256", "name": "budget", "type": "uint256" },
          { "internalType": "uint256", "name": "allocatedFunds", "type": "uint256" },
          { "internalType": "uint256", "name": "spentFunds", "type": "uint256" },
          { "internalType": "address", "name": "admin", "type": "address" },
          { "internalType": "bytes32", "name": "supervisorCommitment", "type": "bytes32" },
          { "internalType": "enum FundTracker.ProjectStatus", "name": "status", "type": "uint8" },
          { "internalType": "string", "name": "location", "type": "string" },
          { "internalType": "uint256", "name": "createdAt", "type": "uint256" },
          { "internalType": "bool", "name": "exists", "type": "bool" },
          { "internalType": "string", "name": "milestone1Task", "type": "string" },
          { "internalType": "string", "name": "milestone2Task", "type": "string" },
          { "internalType": "string", "name": "milestone3Task", "type": "string" },
          { "internalType": "string", "name": "milestone4Task", "type": "string" },
          { "internalType": "string", "name": "milestone5Task", "type": "string" }
        ],
        "internalType": "struct FundTracker.Project",
        "name": "",
        "type": "tuple"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [{ "internalType": "uint256", "name": "_projectId", "type": "uint256" }],
    "name": "getProjectMilestoneTasks",
    "outputs": [
      { "internalType": "string", "name": "task1", "type": "string" },
      { "internalType": "string", "name": "task2", "type": "string" },
      { "internalType": "string", "name": "task3", "type": "string" },
      { "internalType": "string", "name": "task4", "type": "string" },
      { "internalType": "string", "name": "task5", "type": "string" }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [{ "internalType": "uint256", "name": "_tenderId", "type": "uint256" }],
    "name": "getQualityReportStatus",
    "outputs": [
      { "internalType": "bool", "name": "submitted", "type": "bool" },
      { "internalType": "string", "name": "reportIPFS", "type": "string" },
      { "internalType": "uint256", "name": "submittedAt", "type": "uint256" }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "anonymous": false,
    "inputs": [
      { "indexed": true, "internalType": "uint256", "name": "projectId", "type": "uint256" },
      { "indexed": false, "internalType": "string", "name": "name", "type": "string" },
      { "indexed": false, "internalType": "uint256", "name": "budget", "type": "uint256" },
      { "indexed": false, "internalType": "address", "name": "admin", "type": "address" },
      { "indexed": false, "internalType": "uint256", "name": "timestamp", "type": "uint256" }
    ],
    "name": "ProjectCreated",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      { "indexed": true, "internalType": "uint256", "name": "milestoneId", "type": "uint256" },
      { "indexed": false, "internalType": "uint256", "name": "amountReleased", "type": "uint256" }
    ],
    "name": "MilestoneApproved",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      { "indexed": true, "internalType": "uint256", "name": "projectId", "type": "uint256" },
      { "indexed": false, "internalType": "address", "name": "contractor", "type": "address" },
      { "indexed": false, "internalType": "uint256", "name": "amount", "type": "uint256" },
      { "indexed": false, "internalType": "uint8", "name": "milestone", "type": "uint8" }
    ],
    "name": "FundsReleased",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      { "indexed": true, "internalType": "uint256", "name": "tenderId", "type": "uint256" },
      { "indexed": false, "internalType": "address", "name": "contractor", "type": "address" },
      { "indexed": false, "internalType": "string", "name": "reportIPFS", "type": "string" }
    ],
    "name": "QualityReportSubmitted",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      { "indexed": false, "internalType": "address", "name": "contractor", "type": "address" },
      { "indexed": false, "internalType": "bool", "name": "eligible", "type": "bool" }
    ],
    "name": "ContractorEligibilityUpdated",
    "type": "event"
  },
  {
    "stateMutability": "payable",
    "type": "receive"
  }
];

// Helper functions for Web3 operations
export const switchToPolygonMumbai = async () => {
  if (!window.ethereum) {
    throw new Error('MetaMask is not installed!');
  }

  try {
    // Try to switch to Mumbai
    await window.ethereum.request({
      method: 'wallet_switchEthereumChain',
      params: [{ chainId: POLYGON_MUMBAI_CONFIG.chainId }],
    });
  } catch (switchError) {
    // This error code indicates that the chain has not been added to MetaMask
    if (switchError.code === 4902) {
      try {
        await window.ethereum.request({
          method: 'wallet_addEthereumChain',
          params: [POLYGON_MUMBAI_CONFIG],
        });
      } catch (addError) {
        throw new Error('Failed to add Polygon Mumbai network');
      }
    } else {
      throw switchError;
    }
  }
};

export const getPolygonscanTxUrl = (txHash) => {
  return `https://mumbai.polygonscan.com/tx/${txHash}`;
};

export const getPolygonscanAddressUrl = (address) => {
  return `https://mumbai.polygonscan.com/address/${address}`;
};

export const getPolygonscanContractUrl = () => {
  return `https://mumbai.polygonscan.com/address/${FUND_TRACKER_CONTRACT_ADDRESS}`;
};
