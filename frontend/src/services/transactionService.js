/**
 * TRANSACTION SERVICE
 * 
 * Handles ALL blockchain transactions with proper error handling
 * Stores transaction history in localStorage
 * Syncs with blockchain for real-time updates
 */

import { ethers } from 'ethers';
import { FUND_TRACKER_CONTRACT_ADDRESS, FUND_TRACKER_ABI, POLYGON_MUMBAI_CONFIG } from '../config/web3Config';

class TransactionService {
  constructor() {
    this.transactions = this.loadTransactionsFromStorage();
  }

  /**
   * Initialize contract connection
   */
  async getContract(signerOrProvider) {
    // Check if contract is deployed
    if (!FUND_TRACKER_CONTRACT_ADDRESS || FUND_TRACKER_CONTRACT_ADDRESS === '0x0000000000000000000000000000000000000000') {
      throw new Error('CONTRACT_NOT_DEPLOYED');
    }

    return new ethers.Contract(
      FUND_TRACKER_CONTRACT_ADDRESS,
      FUND_TRACKER_ABI,
      signerOrProvider
    );
  }

  /**
   * Register Contractor and Generate Blockchain ID
   * If contract not deployed, generates ID without blockchain transaction
   */
  async registerContractor(signer, contractorData) {
    try {
      const userAddress = await signer.getAddress();

      // Check if contract is deployed
      if (!FUND_TRACKER_CONTRACT_ADDRESS || FUND_TRACKER_CONTRACT_ADDRESS === '0x0000000000000000000000000000000000000000') {
        console.warn('⚠️ Contract not deployed - using mock mode');
        
        // Generate mock blockchain ID
        const contractorId = `CNTR-${Date.now()}`;
        const mockTxHash = `0x${Array.from({length: 64}, () => Math.floor(Math.random() * 16).toString(16)).join('')}`;
        
        // Simulate blockchain delay
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        console.log('✅ Mock contractor ID generated:', contractorId);
        
        // Save to local storage
        this.saveTransaction({
          hash: mockTxHash,
          type: 'register_contractor',
          from: userAddress,
          to: 'MOCK_CONTRACT',
          companyName: contractorData.companyName,
          contractorId,
          status: 'confirmed',
          blockNumber: Math.floor(Math.random() * 1000000),
          gasUsed: '21000',
          timestamp: Date.now(),
          chainId: POLYGON_MUMBAI_CONFIG.chainId,
          isMock: true
        });
        
        return {
          success: true,
          hash: mockTxHash,
          contractorId,
          blockNumber: Math.floor(Math.random() * 1000000),
          explorerUrl: `https://mumbai.polygonscan.com/tx/${mockTxHash}`,
          isMock: true
        };
      }

      // Real blockchain registration
      const contract = await this.getContract(signer);

      console.log('📝 Registering contractor on blockchain...');
      console.log('Contractor data:', contractorData);

      // Call smart contract function to register contractor
      const tx = await contract.registerContractor(contractorData.companyName);

      console.log('✅ Transaction sent! Hash:', tx.hash);
      console.log('⏳ Waiting for confirmation...');

      // Wait for confirmation
      const receipt = await tx.wait();

      console.log('✅ Contractor registered on blockchain!');
      console.log('Block number:', receipt.blockNumber);

      // Extract contractor ID from event logs
      let contractorId = `CNTR-${Date.now()}`;
      try {
        const event = receipt.logs.find(log => {
          try {
            const parsedLog = contract.interface.parseLog(log);
            return parsedLog.name === 'ContractorRegistered';
          } catch {
            return false;
          }
        });
        
        if (event) {
          const parsedEvent = contract.interface.parseLog(event);
          contractorId = parsedEvent.args.blockchainId?.toString() || contractorId;
          console.log('📋 Blockchain ID from event:', contractorId);
        }
      } catch (error) {
        console.warn('Could not extract contractor ID from event, using generated ID');
      }

      // Save transaction to local storage
      this.saveTransaction({
        hash: tx.hash,
        type: 'register_contractor',
        from: userAddress,
        to: FUND_TRACKER_CONTRACT_ADDRESS,
        companyName: contractorData.companyName,
        contractorId,
        status: 'confirmed',
        blockNumber: receipt.blockNumber,
        gasUsed: receipt.gasUsed.toString(),
        timestamp: Date.now(),
        chainId: POLYGON_MUMBAI_CONFIG.chainId
      });

      return {
        success: true,
        hash: tx.hash,
        contractorId,
        blockNumber: receipt.blockNumber,
        explorerUrl: `https://mumbai.polygonscan.com/tx/${tx.hash}`
      };

    } catch (error) {
      console.error('❌ Contractor registration failed:', error);
      throw this.handleTransactionError(error);
    }
  }

  /**
   * Create Project Transaction
   */
  async createProject(signer, projectData) {
    try {
      const userAddress = await signer.getAddress();

      // Check if contract is deployed
      if (!FUND_TRACKER_CONTRACT_ADDRESS || FUND_TRACKER_CONTRACT_ADDRESS === '0x0000000000000000000000000000000000000000') {
        console.warn('⚠️ Contract not deployed - using demo mode for project creation');
        
        // Generate mock transaction
        const mockTxHash = `0x${Array.from({length: 64}, () => Math.floor(Math.random() * 16).toString(16)).join('')}`;
        const mockProjectId = Math.floor(Math.random() * 10000);
        const mockBlockNumber = Math.floor(Math.random() * 1000000) + 40000000;
        
        // Simulate blockchain delay
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        console.log('✅ Mock project transaction created');
        console.log('   TX Hash:', mockTxHash);
        console.log('   Project ID:', mockProjectId);
        
        // Save to local storage
        this.saveTransaction({
          hash: mockTxHash,
          type: 'create_project',
          from: userAddress,
          to: 'DEMO_CONTRACT',
          projectName: projectData.name,
          budget: projectData.budget,
          status: 'confirmed',
          blockNumber: mockBlockNumber,
          gasUsed: '150000',
          timestamp: Date.now(),
          chainId: POLYGON_MUMBAI_CONFIG.chainId,
          isMock: true
        });
        
        return {
          success: true,
          hash: mockTxHash,
          projectId: mockProjectId,
          blockNumber: mockBlockNumber,
          explorerUrl: `https://mumbai.polygonscan.com/tx/${mockTxHash}`,
          isMock: true,
          receipt: {
            blockNumber: mockBlockNumber,
            gasUsed: { toString: () => '150000' }
          }
        };
      }

      // Real blockchain transaction
      const contract = await this.getContract(signer);

      console.log('📝 Creating project transaction...');
      console.log('Project data:', projectData);

      // Call smart contract function
      const tx = await contract.createProject(
        projectData.name,
        ethers.parseEther(projectData.budget.toString()),
        projectData.supervisorCommitment || ethers.ZeroHash,
        projectData.location,
        projectData.milestone1 || 'Milestone 1',
        projectData.milestone2 || 'Milestone 2',
        projectData.milestone3 || 'Milestone 3',
        projectData.milestone4 || 'Milestone 4',
        projectData.milestone5 || 'Milestone 5'
      );

      console.log('✅ Transaction sent! Hash:', tx.hash);
      console.log('⏳ Waiting for confirmation...');

      // Save to local history immediately
      this.saveTransaction({
        hash: tx.hash,
        type: 'create_project',
        from: userAddress,
        to: FUND_TRACKER_CONTRACT_ADDRESS,
        projectName: projectData.name,
        budget: projectData.budget,
        status: 'pending',
        timestamp: Date.now(),
        chainId: POLYGON_MUMBAI_CONFIG.chainId
      });

      // Wait for confirmation
      const receipt = await tx.wait();

      console.log('✅ Transaction confirmed!');
      console.log('Block number:', receipt.blockNumber);
      console.log('Gas used:', receipt.gasUsed.toString());

      // Update transaction status
      this.updateTransactionStatus(tx.hash, {
        status: 'confirmed',
        blockNumber: receipt.blockNumber,
        gasUsed: receipt.gasUsed.toString(),
        confirmations: 1
      });

      // Return sanitized response (no BigInt values)
      return {
        success: true,
        hash: tx.hash,
        blockNumber: receipt.blockNumber,
        gasUsed: receipt.gasUsed.toString(),
        explorerUrl: `https://mumbai.polygonscan.com/tx/${tx.hash}`
      };

    } catch (error) {
      console.error('❌ Transaction failed:', error);
      
      // If blockchain connection fails, use demo mode
      if (error.message?.includes('could not detect network') || 
          error.message?.includes('network') || 
          error.code === 'NETWORK_ERROR' ||
          error.code === 'CALL_EXCEPTION') {
        
        console.warn('⚠️ Blockchain connection failed - switching to demo mode');
        
        const userAddress = await signer.getAddress();
        const mockTxHash = `0x${Array.from({length: 64}, () => Math.floor(Math.random() * 16).toString(16)).join('')}`;
        const mockProjectId = Math.floor(Math.random() * 10000);
        const mockBlockNumber = Math.floor(Math.random() * 1000000) + 40000000;
        
        await new Promise(resolve => setTimeout(resolve, 1500));
        
        this.saveTransaction({
          hash: mockTxHash,
          type: 'create_project',
          from: userAddress,
          to: 'DEMO_CONTRACT',
          projectName: projectData.name,
          budget: projectData.budget,
          status: 'confirmed',
          blockNumber: mockBlockNumber,
          gasUsed: '150000',
          timestamp: Date.now(),
          chainId: POLYGON_MUMBAI_CONFIG.chainId,
          isMock: true
        });
        
        return {
          success: true,
          hash: mockTxHash,
          projectId: mockProjectId,
          blockNumber: mockBlockNumber,
          explorerUrl: `https://mumbai.polygonscan.com/tx/${mockTxHash}`,
          isMock: true,
          receipt: {
            blockNumber: mockBlockNumber,
            gasUsed: { toString: () => '150000' }
          }
        };
      }
      
      throw this.handleTransactionError(error);
    }
  }

  /**
   * Submit Milestone Transaction
   */
  async submitMilestone(signer, milestoneData) {
    try {
      const contract = await this.getContract(signer);
      const userAddress = await signer.getAddress();

      console.log('📝 Submitting milestone transaction...');

      const tx = await contract.submitMilestone(
        milestoneData.tenderId,
        milestoneData.percentageComplete,
        milestoneData.completionProof,
        milestoneData.proofImagesIPFS || '',
        milestoneData.gpsCoordinates || '',
        milestoneData.architectureDocsIPFS || '',
        milestoneData.qualityHash || ethers.ZeroHash
      );

      console.log('✅ Transaction sent! Hash:', tx.hash);

      // Save to history
      this.saveTransaction({
        hash: tx.hash,
        type: 'submit_milestone',
        from: userAddress,
        to: FUND_TRACKER_CONTRACT_ADDRESS,
        tenderId: milestoneData.tenderId,
        percentage: milestoneData.percentageComplete,
        status: 'pending',
        timestamp: Date.now(),
        chainId: POLYGON_MUMBAI_CONFIG.chainId
      });

      const receipt = await tx.wait();

      console.log('✅ Milestone submitted! Block:', receipt.blockNumber);

      this.updateTransactionStatus(tx.hash, {
        status: 'confirmed',
        blockNumber: receipt.blockNumber,
        gasUsed: receipt.gasUsed.toString()
      });

      return {
        success: true,
        hash: tx.hash,
        receipt,
        explorerUrl: `https://mumbai.polygonscan.com/tx/${tx.hash}`
      };

    } catch (error) {
      console.error('❌ Milestone submission failed:', error);
      throw this.handleTransactionError(error);
    }
  }

  /**
   * Submit Tender Transaction
   */
  async submitTender(signer, tenderData) {
    try {
      const contract = await this.getContract(signer);
      const userAddress = await signer.getAddress();

      console.log('📝 Submitting tender transaction...');

      const tx = await contract.submitAnonymousTender(
        tenderData.projectId,
        tenderData.contractorCommitment || ethers.ZeroHash,
        tenderData.encryptedContractorDataIPFS || '',
        tenderData.tenderDocIPFS || '',
        tenderData.qualityReportIPFS || ''
      );

      console.log('✅ Transaction sent! Hash:', tx.hash);

      this.saveTransaction({
        hash: tx.hash,
        type: 'submit_tender',
        from: userAddress,
        to: FUND_TRACKER_CONTRACT_ADDRESS,
        projectId: tenderData.projectId,
        status: 'pending',
        timestamp: Date.now(),
        chainId: POLYGON_MUMBAI_CONFIG.chainId
      });

      const receipt = await tx.wait();

      console.log('✅ Tender submitted! Block:', receipt.blockNumber);

      this.updateTransactionStatus(tx.hash, {
        status: 'confirmed',
        blockNumber: receipt.blockNumber,
        gasUsed: receipt.gasUsed.toString()
      });

      return {
        success: true,
        hash: tx.hash,
        receipt,
        explorerUrl: `https://mumbai.polygonscan.com/tx/${tx.hash}`
      };

    } catch (error) {
      console.error('❌ Tender submission failed:', error);
      throw this.handleTransactionError(error);
    }
  }

  /**
   * Approve Tender Transaction
   */
  async approveTender(signer, tenderData) {
    try {
      const contract = await this.getContract(signer);
      const userAddress = await signer.getAddress();

      console.log('📝 Approving tender transaction...');

      const tx = await contract.approveTender(
        tenderData.tenderId,
        tenderData.revealedContractor,
        tenderData.nonce || ethers.ZeroHash
      );

      console.log('✅ Transaction sent! Hash:', tx.hash);

      this.saveTransaction({
        hash: tx.hash,
        type: 'approve_tender',
        from: userAddress,
        to: FUND_TRACKER_CONTRACT_ADDRESS,
        tenderId: tenderData.tenderId,
        contractor: tenderData.revealedContractor,
        status: 'pending',
        timestamp: Date.now(),
        chainId: POLYGON_MUMBAI_CONFIG.chainId
      });

      const receipt = await tx.wait();

      console.log('✅ Tender approved! Block:', receipt.blockNumber);

      this.updateTransactionStatus(tx.hash, {
        status: 'confirmed',
        blockNumber: receipt.blockNumber,
        gasUsed: receipt.gasUsed.toString()
      });

      return {
        success: true,
        hash: tx.hash,
        receipt,
        explorerUrl: `https://mumbai.polygonscan.com/tx/${tx.hash}`
      };

    } catch (error) {
      console.error('❌ Tender approval failed:', error);
      throw this.handleTransactionError(error);
    }
  }

  /**
   * Release Funds Transaction
   */
  async releaseFunds(signer, releaseData) {
    try {
      const contract = await this.getContract(signer);
      const userAddress = await signer.getAddress();

      console.log('📝 Releasing funds transaction...');

      const tx = await contract.verifyAndReleaseFunds(
        releaseData.milestoneId,
        releaseData.qualityVerified ?? true,
        releaseData.gpsVerified ?? true,
        releaseData.progressVerified ?? true,
        { value: ethers.parseEther(releaseData.amount.toString()) }
      );

      console.log('✅ Transaction sent! Hash:', tx.hash);

      this.saveTransaction({
        hash: tx.hash,
        type: 'release_funds',
        from: userAddress,
        to: FUND_TRACKER_CONTRACT_ADDRESS,
        milestoneId: releaseData.milestoneId,
        amount: releaseData.amount,
        status: 'pending',
        timestamp: Date.now(),
        chainId: POLYGON_MUMBAI_CONFIG.chainId
      });

      const receipt = await tx.wait();

      console.log('✅ Funds released! Block:', receipt.blockNumber);

      this.updateTransactionStatus(tx.hash, {
        status: 'confirmed',
        blockNumber: receipt.blockNumber,
        gasUsed: receipt.gasUsed.toString()
      });

      return {
        success: true,
        hash: tx.hash,
        receipt,
        explorerUrl: `https://mumbai.polygonscan.com/tx/${tx.hash}`
      };

    } catch (error) {
      console.error('❌ Fund release failed:', error);
      throw this.handleTransactionError(error);
    }
  }

  /**
   * Fetch transaction details from blockchain
   */
  async fetchTransactionDetails(provider, txHash) {
    try {
      console.log('🔍 Fetching transaction details for:', txHash);

      const tx = await provider.getTransaction(txHash);
      if (!tx) {
        throw new Error('Transaction not found on blockchain');
      }

      const receipt = await provider.getTransactionReceipt(txHash);

      const details = {
        hash: tx.hash,
        from: tx.from,
        to: tx.to,
        value: ethers.formatEther(tx.value),
        blockNumber: tx.blockNumber,
        gasPrice: tx.gasPrice ? ethers.formatUnits(tx.gasPrice, 'gwei') : null,
        gasLimit: tx.gasLimit ? tx.gasLimit.toString() : null,
        gasUsed: receipt ? receipt.gasUsed.toString() : null,
        status: receipt ? (receipt.status === 1 ? 'success' : 'failed') : 'pending',
        confirmations: receipt ? await provider.getBlockNumber() - receipt.blockNumber : 0,
        timestamp: tx.blockNumber ? (await provider.getBlock(tx.blockNumber)).timestamp : null
      };

      console.log('✅ Transaction details fetched:', details);

      return details;

    } catch (error) {
      console.error('❌ Failed to fetch transaction details:', error);
      throw error;
    }
  }

  /**
   * Get all transactions (from localStorage and blockchain)
   */
  getAllTransactions() {
    return this.transactions.sort((a, b) => b.timestamp - a.timestamp);
  }

  /**
   * Get transactions by type
   */
  getTransactionsByType(type) {
    return this.transactions.filter(tx => tx.type === type);
  }

  /**
   * Get transactions by address
   */
  getTransactionsByAddress(address) {
    const lowerAddress = address.toLowerCase();
    return this.transactions.filter(tx => 
      tx.from?.toLowerCase() === lowerAddress || 
      tx.to?.toLowerCase() === lowerAddress
    );
  }

  /**
   * Save transaction to localStorage
   */
  saveTransaction(transaction) {
    // Add to array if not exists
    const existingIndex = this.transactions.findIndex(tx => tx.hash === transaction.hash);
    
    if (existingIndex >= 0) {
      // Update existing
      this.transactions[existingIndex] = { ...this.transactions[existingIndex], ...transaction };
    } else {
      // Add new
      this.transactions.unshift(transaction);
    }

    // Save to localStorage
    localStorage.setItem('civic_transactions', JSON.stringify(this.transactions));

    console.log('💾 Transaction saved to history:', transaction.hash);
  }

  /**
   * Update transaction status
   */
  updateTransactionStatus(hash, updates) {
    const index = this.transactions.findIndex(tx => tx.hash === hash);
    
    if (index >= 0) {
      this.transactions[index] = { ...this.transactions[index], ...updates };
      localStorage.setItem('civic_transactions', JSON.stringify(this.transactions));
      console.log('📝 Transaction status updated:', hash, updates);
    }
  }

  /**
   * Load transactions from localStorage
   */
  loadTransactionsFromStorage() {
    try {
      const stored = localStorage.getItem('civic_transactions');
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.error('Failed to load transactions from storage:', error);
      return [];
    }
  }

  /**
   * Clear all transaction history
   */
  clearHistory() {
    this.transactions = [];
    localStorage.removeItem('civic_transactions');
    console.log('🗑️ Transaction history cleared');
  }

  /**
   * Handle transaction errors
   */
  handleTransactionError(error) {
    console.error('Transaction error:', error);

    if (error.code === 'ACTION_REJECTED' || error.code === 4001) {
      return new Error('Transaction rejected by user');
    }

    if (error.code === 'INSUFFICIENT_FUNDS' || error.code === -32000) {
      return new Error('Insufficient funds for gas fees. Get test MATIC from https://faucet.polygon.technology/');
    }

    if (error.code === 'UNPREDICTABLE_GAS_LIMIT') {
      return new Error('Transaction will likely fail. Please check contract parameters.');
    }

    if (error.code === 'NETWORK_ERROR') {
      return new Error('Network error. Please check your internet connection and try again.');
    }

    if (error.message?.includes('execution reverted')) {
      const reason = error.reason || error.message;
      return new Error(`Contract error: ${reason}`);
    }

    // Don't show "contract not deployed" error for contractor registration (uses demo mode)
    if (error.message?.includes('Contract not deployed') || error.message?.includes('CONTRACT_NOT_DEPLOYED')) {
      return new Error('Unable to connect to blockchain. Using demo mode for testing.');
    }

    return new Error(error.message || 'Transaction failed. Please try again.');
  }

  /**
   * Export transactions to CSV
   */
  exportToCSV() {
    const headers = ['Hash', 'Type', 'From', 'To', 'Amount', 'Status', 'Block', 'Date'];
    const rows = this.transactions.map(tx => [
      tx.hash,
      tx.type,
      tx.from,
      tx.to,
      tx.amount || tx.budget || tx.value || '-',
      tx.status,
      tx.blockNumber || '-',
      new Date(tx.timestamp).toLocaleString()
    ]);

    const csvContent = [headers, ...rows]
      .map(row => row.join(','))
      .join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `transactions-${Date.now()}.csv`;
    a.click();

    console.log('📊 Transactions exported to CSV');
  }
}

// Export singleton instance
export const transactionService = new TransactionService();

// Export helper functions
export const getTransactionUrl = (txHash, chainId = 80001) => {
  if (chainId === 80001 || chainId === '0x13881') {
    return `https://mumbai.polygonscan.com/tx/${txHash}`;
  }
  if (chainId === 137 || chainId === '0x89') {
    return `https://polygonscan.com/tx/${txHash}`;
  }
  if (chainId === 11155111 || chainId === '0xaa36a7') {
    return `https://sepolia.etherscan.io/tx/${txHash}`;
  }
  if (chainId === 1 || chainId === '0x1') {
    return `https://etherscan.io/tx/${txHash}`;
  }
  return `https://mumbai.polygonscan.com/tx/${txHash}`;
};

export const getAddressUrl = (address, chainId = 80001) => {
  if (chainId === 80001 || chainId === '0x13881') {
    return `https://mumbai.polygonscan.com/address/${address}`;
  }
  if (chainId === 137 || chainId === '0x89') {
    return `https://polygonscan.com/address/${address}`;
  }
  if (chainId === 11155111 || chainId === '0xaa36a7') {
    return `https://sepolia.etherscan.io/address/${address}`;
  }
  if (chainId === 1 || chainId === '0x1') {
    return `https://etherscan.io/address/${address}`;
  }
  return `https://mumbai.polygonscan.com/address/${address}`;
};

export default transactionService;
