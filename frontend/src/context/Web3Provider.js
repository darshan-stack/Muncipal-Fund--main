// Web3 Provider Context for Real Blockchain Integration
import React, { createContext, useContext, useState, useEffect } from 'react';
import { ethers } from 'ethers';
import { toast } from 'sonner';
import { 
  POLYGON_MUMBAI_CONFIG, 
  FUND_TRACKER_CONTRACT_ADDRESS, 
  FUND_TRACKER_ABI,
  switchToPolygonMumbai,
  getPolygonscanTxUrl 
} from '../config/web3Config';

const Web3Context = createContext();

export const useWeb3 = () => {
  const context = useContext(Web3Context);
  if (!context) {
    throw new Error('useWeb3 must be used within a Web3Provider');
  }
  return context;
};

export const Web3Provider = ({ children }) => {
  const [account, setAccount] = useState(null);
  const [provider, setProvider] = useState(null);
  const [signer, setSigner] = useState(null);
  const [contract, setContract] = useState(null);
  const [chainId, setChainId] = useState(null);
  const [connected, setConnected] = useState(false);
  const [loading, setLoading] = useState(false);

  // Initialize provider
  useEffect(() => {
    if (window.ethereum) {
      const web3Provider = new ethers.BrowserProvider(window.ethereum);
      setProvider(web3Provider);
    }
  }, []);

  // Listen for account changes
  useEffect(() => {
    if (window.ethereum) {
      window.ethereum.on('accountsChanged', handleAccountsChanged);
      window.ethereum.on('chainChanged', handleChainChanged);
    }

    return () => {
      if (window.ethereum) {
        window.ethereum.removeListener('accountsChanged', handleAccountsChanged);
        window.ethereum.removeListener('chainChanged', handleChainChanged);
      }
    };
  }, []);

  const handleAccountsChanged = (accounts) => {
    if (accounts.length === 0) {
      disconnectWallet();
      toast.info('Please connect to MetaMask');
    } else if (accounts[0] !== account) {
      setAccount(accounts[0]);
      toast.success(`Account changed to ${accounts[0].substring(0, 6)}...${accounts[0].substring(38)}`);
    }
  };

  const handleChainChanged = (chainIdHex) => {
    const newChainId = parseInt(chainIdHex, 16);
    setChainId(newChainId);
    
    if (newChainId !== 80001) {
      toast.warning('Please switch to Polygon Mumbai Testnet');
    } else {
      toast.success('Connected to Polygon Mumbai');
    }
    
    // Reload to refresh state
    window.location.reload();
  };

  const connectWallet = async () => {
    if (!window.ethereum) {
      toast.error('MetaMask is not installed!', {
        description: 'Please install MetaMask to use this application'
      });
      window.open('https://metamask.io/download.html', '_blank');
      return null;
    }

    try {
      setLoading(true);
      
      // Request account access
      const accounts = await window.ethereum.request({ 
        method: 'eth_requestAccounts' 
      });
      
      const web3Provider = new ethers.BrowserProvider(window.ethereum);
      const web3Signer = await web3Provider.getSigner();
      const network = await web3Provider.getNetwork();
      
      setAccount(accounts[0]);
      setProvider(web3Provider);
      setSigner(web3Signer);
      setChainId(Number(network.chainId));
      setConnected(true);

      // Check if on correct network
      if (Number(network.chainId) !== 80001) {
        toast.warning('Wrong network detected', {
          description: 'Please switch to Polygon Mumbai Testnet'
        });
        
        try {
          await switchToPolygonMumbai();
          const updatedNetwork = await web3Provider.getNetwork();
          setChainId(Number(updatedNetwork.chainId));
        } catch (error) {
          console.error('Failed to switch network:', error);
        }
      }

      // Initialize contract if address is set
      if (FUND_TRACKER_CONTRACT_ADDRESS !== '0x0000000000000000000000000000000000000000') {
        const fundTrackerContract = new ethers.Contract(
          FUND_TRACKER_CONTRACT_ADDRESS,
          FUND_TRACKER_ABI,
          web3Signer
        );
        setContract(fundTrackerContract);
      } else {
        console.warn('Contract address not configured');
        toast.warning('Smart contract not deployed', {
          description: 'Some features may not work until contract is deployed'
        });
      }

      toast.success('Wallet connected successfully!', {
        description: `${accounts[0].substring(0, 6)}...${accounts[0].substring(38)}`
      });

      return accounts[0];
    } catch (error) {
      console.error('Error connecting wallet:', error);
      toast.error('Failed to connect wallet', {
        description: error.message
      });
      return null;
    } finally {
      setLoading(false);
    }
  };

  const disconnectWallet = () => {
    setAccount(null);
    setProvider(null);
    setSigner(null);
    setContract(null);
    setConnected(false);
    toast.info('Wallet disconnected');
  };

  const switchNetwork = async () => {
    try {
      await switchToPolygonMumbai();
      toast.success('Switched to Polygon Mumbai');
    } catch (error) {
      console.error('Error switching network:', error);
      toast.error('Failed to switch network');
    }
  };

  // Smart Contract Functions

  const createProjectOnChain = async (projectData) => {
    if (!contract) {
      throw new Error('Contract not initialized. Please deploy the contract first.');
    }

    if (!signer) {
      throw new Error('Wallet not connected');
    }

    try {
      toast.info('Creating project on blockchain...', {
        description: 'Please confirm the transaction in MetaMask'
      });

      // Create supervisor commitment hash
      const supervisorCommitment = ethers.keccak256(
        ethers.toUtf8Bytes(projectData.supervisorAddress || account)
      );

      const tx = await contract.createProject(
        projectData.name,
        ethers.parseEther(projectData.budget.toString()),
        supervisorCommitment,
        projectData.location,
        projectData.milestone1Task || '',
        projectData.milestone2Task || '',
        projectData.milestone3Task || '',
        projectData.milestone4Task || '',
        projectData.milestone5Task || ''
      );

      toast.info('Transaction submitted!', {
        description: 'Waiting for confirmation...'
      });

      const receipt = await tx.wait();
      
      toast.success('Project created on blockchain!', {
        description: `Transaction: ${receipt.hash.substring(0, 10)}...`
      });

      return {
        txHash: receipt.hash,
        blockNumber: receipt.blockNumber,
        gasUsed: receipt.gasUsed.toString(),
        polygonscanUrl: getPolygonscanTxUrl(receipt.hash)
      };
    } catch (error) {
      console.error('Error creating project on chain:', error);
      
      if (error.code === 'ACTION_REJECTED') {
        toast.error('Transaction rejected by user');
      } else {
        toast.error('Failed to create project on blockchain', {
          description: error.message
        });
      }
      
      throw error;
    }
  };

  const submitMilestoneOnChain = async (milestoneData) => {
    if (!contract) throw new Error('Contract not initialized');
    if (!signer) throw new Error('Wallet not connected');

    try {
      toast.info('Submitting milestone to blockchain...');

      const qualityHash = ethers.keccak256(
        ethers.toUtf8Bytes(JSON.stringify(milestoneData.qualityData || {}))
      );

      const tx = await contract.submitMilestone(
        milestoneData.tenderId,
        milestoneData.percentageComplete,
        milestoneData.completionProof,
        milestoneData.proofImagesIPFS,
        milestoneData.gpsCoordinates,
        milestoneData.architectureDocsIPFS,
        qualityHash
      );

      toast.info('Transaction submitted! Waiting for confirmation...');
      const receipt = await tx.wait();

      toast.success('Milestone submitted on blockchain!');

      return {
        txHash: receipt.hash,
        blockNumber: receipt.blockNumber,
        polygonscanUrl: getPolygonscanTxUrl(receipt.hash)
      };
    } catch (error) {
      console.error('Error submitting milestone:', error);
      toast.error('Failed to submit milestone', {
        description: error.message
      });
      throw error;
    }
  };

  const verifyAndReleaseFundsOnChain = async (milestoneId, verificationData) => {
    if (!contract) throw new Error('Contract not initialized');
    if (!signer) throw new Error('Wallet not connected');

    try {
      toast.info('Verifying milestone and releasing funds...');

      const tx = await contract.verifyAndReleaseFunds(
        milestoneId,
        verificationData.qualityVerified,
        verificationData.gpsVerified,
        verificationData.progressVerified,
        {
          value: verificationData.amount ? ethers.parseEther(verificationData.amount.toString()) : 0
        }
      );

      toast.info('Transaction submitted! Releasing payment...');
      const receipt = await tx.wait();

      toast.success('Funds released to contractor!', {
        description: 'Milestone approved and payment transferred'
      });

      return {
        txHash: receipt.hash,
        blockNumber: receipt.blockNumber,
        polygonscanUrl: getPolygonscanTxUrl(receipt.hash)
      };
    } catch (error) {
      console.error('Error releasing funds:', error);
      toast.error('Failed to release funds', {
        description: error.message
      });
      throw error;
    }
  };

  const submitQualityReportOnChain = async (tenderId, reportIPFS) => {
    if (!contract) throw new Error('Contract not initialized');
    if (!signer) throw new Error('Wallet not connected');

    try {
      toast.info('Submitting quality report to blockchain...');

      const tx = await contract.submitFinalQualityReport(tenderId, reportIPFS);

      toast.info('Transaction submitted! Updating contractor eligibility...');
      const receipt = await tx.wait();

      toast.success('Quality report submitted!', {
        description: 'You are now eligible for new tenders'
      });

      return {
        txHash: receipt.hash,
        blockNumber: receipt.blockNumber,
        polygonscanUrl: getPolygonscanTxUrl(receipt.hash)
      };
    } catch (error) {
      console.error('Error submitting quality report:', error);
      toast.error('Failed to submit quality report', {
        description: error.message
      });
      throw error;
    }
  };

  const checkContractorEligibility = async (contractorAddress) => {
    if (!contract) throw new Error('Contract not initialized');

    try {
      const [eligible, pendingReports] = await contract.isContractorEligible(contractorAddress);
      return {
        eligible,
        pendingReports: pendingReports.toString()
      };
    } catch (error) {
      console.error('Error checking eligibility:', error);
      throw error;
    }
  };

  const getProjectFromChain = async (projectId) => {
    if (!contract) throw new Error('Contract not initialized');

    try {
      const project = await contract.getProject(projectId);
      return project;
    } catch (error) {
      console.error('Error fetching project:', error);
      throw error;
    }
  };

  const value = {
    account,
    provider,
    signer,
    contract,
    chainId,
    connected,
    loading,
    connectWallet,
    disconnectWallet,
    switchNetwork,
    createProjectOnChain,
    submitMilestoneOnChain,
    verifyAndReleaseFundsOnChain,
    submitQualityReportOnChain,
    checkContractorEligibility,
    getProjectFromChain,
    isPolygonMumbai: chainId === 80001
  };

  return <Web3Context.Provider value={value}>{children}</Web3Context.Provider>;
};

export default Web3Provider;
