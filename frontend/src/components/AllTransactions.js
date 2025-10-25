import React, { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Input } from './ui/input';
import { Alert, AlertDescription } from './ui/alert';
import { ArrowLeft, ExternalLink, Loader2, RefreshCw, CheckCircle2, Clock, AlertCircle, Shield, Eye, Search, Download } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { POLYGON_MUMBAI_CONFIG, FUND_TRACKER_ABI, FUND_TRACKER_CONTRACT_ADDRESS } from '../config/web3Config';
import { walletManager } from '../utils/walletManager';

const getPolygonscanTxUrl = (txHash) => {
  return `https://mumbai.polygonscan.com/tx/${txHash}`;
};

const getPolygonscanAddressUrl = (address) => {
  return `https://mumbai.polygonscan.com/address/${address}`;
};

// Get block explorer URL based on chain ID
const getExplorerUrl = (txHash, chainId = 80001) => {
  if (chainId === 11155111) {
    return `https://sepolia.etherscan.io/tx/${txHash}`;
  } else if (chainId === 80001) {
    return `https://mumbai.polygonscan.com/tx/${txHash}`;
  } else if (chainId === 137) {
    return `https://polygonscan.com/tx/${txHash}`;
  } else if (chainId === 1) {
    return `https://etherscan.io/tx/${txHash}`;
  }
  return `https://mumbai.polygonscan.com/tx/${txHash}`;
};

const AllTransactions = ({ account }) => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [transactions, setTransactions] = useState([]);
  const [filteredTransactions, setFilteredTransactions] = useState([]);
  const [filter, setFilter] = useState('all'); // all, project, milestone, payment, report
  const [searchQuery, setSearchQuery] = useState('');
  const [verifyingTx, setVerifyingTx] = useState(null);

  useEffect(() => {
    loadTransactions();
  }, []);

  useEffect(() => {
    filterTransactions();
  }, [transactions, searchQuery, filter]);

  const loadTransactions = async () => {
    setLoading(true);
    try {
      if (typeof window.ethereum === 'undefined') {
        toast.error('Please install MetaMask to view blockchain transactions');
        return;
      }

      const provider = new ethers.BrowserProvider(window.ethereum);
      const contract = new ethers.Contract(
        FUND_TRACKER_CONTRACT_ADDRESS,
        FUND_TRACKER_ABI,
        provider
      );

      // Get current block number
      const currentBlock = await provider.getBlockNumber();
      const fromBlock = Math.max(0, currentBlock - 10000); // Last ~10000 blocks

      // Fetch all event types
      const [
        projectCreatedEvents,
        contractorRegisteredEvents,
        milestoneSubmittedEvents,
        milestoneVerifiedEvents,
        fundsReleasedEvents,
        qualityReportEvents
      ] = await Promise.all([
        contract.queryFilter(contract.filters.ProjectCreated(), fromBlock, currentBlock),
        contract.queryFilter(contract.filters.ContractorRegistered(), fromBlock, currentBlock),
        contract.queryFilter(contract.filters.MilestoneSubmitted(), fromBlock, currentBlock),
        contract.queryFilter(contract.filters.MilestoneVerified(), fromBlock, currentBlock),
        contract.queryFilter(contract.filters.FundsReleased(), fromBlock, currentBlock),
        contract.queryFilter(contract.filters.QualityReportSubmitted(), fromBlock, currentBlock)
      ]);

      // Get block timestamps for each transaction
      const allEvents = [
        ...projectCreatedEvents.map(e => ({ ...e, type: 'project' })),
        ...contractorRegisteredEvents.map(e => ({ ...e, type: 'contractor' })),
        ...milestoneSubmittedEvents.map(e => ({ ...e, type: 'milestone' })),
        ...milestoneVerifiedEvents.map(e => ({ ...e, type: 'verified' })),
        ...fundsReleasedEvents.map(e => ({ ...e, type: 'payment' })),
        ...qualityReportEvents.map(e => ({ ...e, type: 'report' }))
      ];

      // Fetch timestamps for all transactions
      const txWithDetails = await Promise.all(
        allEvents.map(async (event) => {
          const block = await provider.getBlock(event.blockNumber);
          return {
            ...event,
            timestamp: block.timestamp,
            blockHash: block.hash
          };
        })
      );

      // Format transactions
      const formattedTxs = txWithDetails.map(event => {
        let details = '';
        let title = '';
        let status = 'success';
        let category = event.type;

        switch (event.type) {
          case 'project':
            title = 'Project Created';
            details = `Project: ${event.args[1]}`;
            break;
          case 'contractor':
            title = 'Contractor Registered';
            details = `Contractor ID: #${event.args[1].toString()} - ${event.args[2]}`;
            break;
          case 'milestone':
            title = 'Milestone Submitted';
            details = `Project ID: ${event.args[0].toString()} - Milestone ${event.args[1].toString()}%`;
            break;
          case 'verified':
            title = 'Milestone Verified';
            details = `Project ID: ${event.args[0].toString()} - Milestone ${event.args[1].toString()}% verified`;
            break;
          case 'payment':
            title = 'Payment Released';
            const amount = ethers.formatEther(event.args[2]);
            details = `Project ID: ${event.args[0].toString()} - ${amount} MATIC to contractor`;
            break;
          case 'report':
            title = 'Quality Report Submitted';
            details = `Project ID: ${event.args[0].toString()} - Final quality report`;
            break;
          default:
            title = 'Blockchain Transaction';
            details = 'Transaction completed';
        }

        return {
          hash: event.transactionHash,
          blockNumber: event.blockNumber,
          blockHash: event.blockHash,
          timestamp: new Date(event.timestamp * 1000),
          title,
          details,
          status,
          type: event.type,
          category,
          from: event.args[0] || account // Use first arg as 'from' or fallback to account
        };
      });

      // Sort by block number (newest first)
      formattedTxs.sort((a, b) => b.blockNumber - a.blockNumber);

      setTransactions(formattedTxs);
      toast.success(`Loaded ${formattedTxs.length} blockchain transactions`);
    } catch (error) {
      console.error('Failed to load transactions:', error);
      toast.error('Failed to load blockchain transactions', {
        description: error.message
      });
    } finally {
      setLoading(false);
    }
  };

  const getFilteredTransactions = () => {
    if (filter === 'all') return transactions;
    return transactions.filter(tx => tx.type === filter);
  };

  const getBadgeVariant = (type) => {
    switch (type) {
      case 'project':
        return 'default';
      case 'contractor':
        return 'secondary';
      case 'milestone':
        return 'outline';
      case 'verified':
        return 'default';
      case 'payment':
        return 'default';
      case 'report':
        return 'outline';
      default:
        return 'outline';
    }
  };

  const getBadgeColor = (type) => {
    switch (type) {
      case 'project':
        return 'bg-blue-500/20 text-blue-400 border-blue-500/50';
      case 'contractor':
        return 'bg-purple-500/20 text-purple-400 border-purple-500/50';
      case 'milestone':
        return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/50';
      case 'verified':
        return 'bg-green-500/20 text-green-400 border-green-500/50';
      case 'payment':
        return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/50';
      case 'report':
        return 'bg-orange-500/20 text-orange-400 border-orange-500/50';
      default:
        return 'bg-slate-500/20 text-slate-400 border-slate-500/50';
    }
  };

  const formatDate = (date) => {
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Filter transactions based on search and filter
  const filterTransactions = () => {
    let filtered = [...transactions];

    // Apply type filter
    if (filter !== 'all') {
      filtered = filtered.filter(tx => tx.type === filter);
    }

    // Apply search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(tx =>
        tx.transactionHash?.toLowerCase().includes(query) ||
        tx.address?.toLowerCase().includes(query) ||
        tx.description?.toLowerCase().includes(query)
      );
    }

    setFilteredTransactions(filtered);
  };

  // Verify transaction on blockchain
  const verifyOnBlockchain = async (txHash) => {
    if (!txHash) {
      toast.error('No transaction hash available');
      return;
    }

    setVerifyingTx(txHash);
    try {
      // Use wallet manager to verify
      if (walletManager.isConnected()) {
        const result = await walletManager.verifyTransaction(txHash);
        
        toast.success('✅ Transaction Verified!', {
          description: `Status: ${result.status}, Confirmations: ${result.confirmations}`
        });

        // Update transaction status
        setTransactions(prev => prev.map(tx =>
          tx.transactionHash === txHash
            ? { ...tx, verified: true, blockchainStatus: result.status, confirmations: result.confirmations }
            : tx
        ));
      } else {
        // Fallback verification using ethers
        const provider = new ethers.BrowserProvider(window.ethereum);
        const receipt = await provider.getTransactionReceipt(txHash);
        
        if (receipt) {
          toast.success('✅ Transaction Verified!', {
            description: `Block: ${receipt.blockNumber}, Status: ${receipt.status === 1 ? 'Success' : 'Failed'}`
          });
        } else {
          toast.error('Transaction not found on blockchain');
        }
      }
    } catch (error) {
      console.error('Verification failed:', error);
      toast.error('Verification Failed', {
        description: error.message
      });
    } finally {
      setVerifyingTx(null);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <Button
              onClick={() => navigate('/dashboard')}
              variant="ghost"
              className="mb-4 text-slate-400 hover:text-white"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Dashboard
            </Button>
            <h1 className="text-3xl font-bold text-white mb-2">All Blockchain Transactions</h1>
            <p className="text-slate-400">
              Real blockchain transactions with verification - Every transaction has a unique hash on the blockchain
            </p>
          </div>
          <Button
            onClick={loadTransactions}
            disabled={loading}
            className="bg-blue-600 hover:bg-blue-700"
          >
            {loading ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <RefreshCw className="w-4 h-4 mr-2" />
            )}
            Refresh
          </Button>
        </div>

        {/* Contract Info Card */}
        <Card className="mb-6 bg-slate-800/50 border-slate-700">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Shield className="w-5 h-5 text-blue-400" />
              Blockchain Verification
            </CardTitle>
            <CardDescription>
              All transactions are recorded on the blockchain with unique transaction hashes
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert className="bg-blue-500/10 border-blue-500/30">
              <Shield className="w-4 h-4 text-blue-400" />
              <AlertDescription className="text-slate-300">
                <strong className="text-blue-400">Real Blockchain Transactions:</strong> Every transaction below has a unique hash recorded on-chain. Click "Verify" to see proof on the block explorer.
              </AlertDescription>
            </Alert>
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <p className="text-sm text-slate-400 mb-1">Smart Contract Address:</p>
                <code className="text-sm text-blue-400 font-mono">
                  {FUND_TRACKER_CONTRACT_ADDRESS || 'Not deployed yet'}
                </code>
              </div>
              {FUND_TRACKER_CONTRACT_ADDRESS && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => window.open(getPolygonscanAddressUrl(FUND_TRACKER_CONTRACT_ADDRESS), '_blank')}
                  className="border-slate-600 text-blue-400 hover:text-blue-300"
                >
                  <ExternalLink className="w-4 h-4 mr-1" />
                  View Contract
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Search and Filter */}
        <Card className="mb-6 bg-slate-800/50 border-slate-700">
          <CardContent className="p-4">
            <div className="flex items-center space-x-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
                <Input
                  placeholder="Search by transaction hash or address..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 bg-slate-900/50 border-slate-700 text-white"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Filter Buttons */}
        <div className="flex flex-wrap gap-2 mb-6">
          <Button
            onClick={() => setFilter('all')}
            variant={filter === 'all' ? 'default' : 'outline'}
            size="sm"
            className={filter === 'all' ? 'bg-blue-600' : 'border-slate-600 text-slate-300'}
          >
            All ({transactions.length})
          </Button>
          <Button
            onClick={() => setFilter('project')}
            variant={filter === 'project' ? 'default' : 'outline'}
            size="sm"
            className={filter === 'project' ? 'bg-blue-600' : 'border-slate-600 text-slate-300'}
          >
            Projects ({transactions.filter(t => t.type === 'project').length})
          </Button>
          <Button
            onClick={() => setFilter('contractor')}
            variant={filter === 'contractor' ? 'default' : 'outline'}
            size="sm"
            className={filter === 'contractor' ? 'bg-blue-600' : 'border-slate-600 text-slate-300'}
          >
            Contractors ({transactions.filter(t => t.type === 'contractor').length})
          </Button>
          <Button
            onClick={() => setFilter('milestone')}
            variant={filter === 'milestone' ? 'default' : 'outline'}
            size="sm"
            className={filter === 'milestone' ? 'bg-blue-600' : 'border-slate-600 text-slate-300'}
          >
            Milestones ({transactions.filter(t => t.type === 'milestone').length})
          </Button>
          <Button
            onClick={() => setFilter('verified')}
            variant={filter === 'verified' ? 'default' : 'outline'}
            size="sm"
            className={filter === 'verified' ? 'bg-blue-600' : 'border-slate-600 text-slate-300'}
          >
            Verified ({transactions.filter(t => t.type === 'verified').length})
          </Button>
          <Button
            onClick={() => setFilter('payment')}
            variant={filter === 'payment' ? 'default' : 'outline'}
            size="sm"
            className={filter === 'payment' ? 'bg-blue-600' : 'border-slate-600 text-slate-300'}
          >
            Payments ({transactions.filter(t => t.type === 'payment').length})
          </Button>
          <Button
            onClick={() => setFilter('report')}
            variant={filter === 'report' ? 'default' : 'outline'}
            size="sm"
            className={filter === 'report' ? 'bg-blue-600' : 'border-slate-600 text-slate-300'}
          >
            Reports ({transactions.filter(t => t.type === 'report').length})
          </Button>
        </div>

        {/* Transactions List */}
        {loading ? (
          <Card className="bg-slate-800/50 border-slate-700">
            <CardContent className="flex items-center justify-center py-12">
              <div className="text-center">
                <Loader2 className="w-8 h-8 animate-spin text-blue-400 mx-auto mb-4" />
                <p className="text-slate-400">Loading blockchain transactions...</p>
              </div>
            </CardContent>
          </Card>
        ) : (filteredTransactions.length > 0 ? filteredTransactions : getFilteredTransactions()).length === 0 ? (
          <Card className="bg-slate-800/50 border-slate-700">
            <CardContent className="flex items-center justify-center py-12">
              <div className="text-center">
                <AlertCircle className="w-12 h-12 text-slate-600 mx-auto mb-4" />
                <p className="text-slate-400 mb-2">No transactions found</p>
                <p className="text-sm text-slate-500">
                  {filter !== 'all' 
                    ? 'Try selecting a different filter or create some transactions'
                    : 'Create a project or submit a milestone to see transactions here'}
                </p>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {(filteredTransactions.length > 0 ? filteredTransactions : getFilteredTransactions()).map((tx, index) => (
              <Card key={index} className="bg-slate-800/50 border-slate-700 hover:border-slate-600 transition-colors">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-4">
                    {/* Left side - Transaction info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2">
                        <Badge className={`${getBadgeColor(tx.type)} border`}>
                          {tx.title}
                        </Badge>
                        <span className="text-xs text-slate-500">
                          Block #{tx.blockNumber}
                        </span>
                      </div>
                      
                      <p className="text-sm text-slate-300 mb-2">{tx.details}</p>
                      
                      <div className="flex items-center gap-4 text-xs text-slate-500">
                        <div className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          <span>{formatDate(tx.timestamp)}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <code className="font-mono">
                            {tx.hash.slice(0, 10)}...{tx.hash.slice(-8)}
                          </code>
                        </div>
                      </div>
                    </div>

                    {/* Right side - Action buttons */}
                    <div className="flex flex-col gap-2 shrink-0">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => verifyOnBlockchain(tx.transactionHash || tx.hash)}
                        disabled={verifyingTx === (tx.transactionHash || tx.hash)}
                        className="border-slate-600 text-green-400 hover:text-green-300 hover:bg-slate-700"
                      >
                        {verifyingTx === (tx.transactionHash || tx.hash) ? (
                          <>
                            <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                            Verifying...
                          </>
                        ) : (
                          <>
                            <Eye className="w-4 h-4 mr-1" />
                            Verify
                          </>
                        )}
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => window.open(getExplorerUrl(tx.transactionHash || tx.hash, tx.chainId), '_blank')}
                        className="border-slate-600 text-blue-400 hover:text-blue-300 hover:bg-slate-700"
                      >
                        <ExternalLink className="w-4 h-4 mr-1" />
                        Explorer
                      </Button>
                    </div>
                  </div>
                  
                  {/* Verification status */}
                  {tx.verified && (
                    <div className="mt-3 pt-3 border-t border-slate-700">
                      <div className="flex items-center space-x-2">
                        <CheckCircle2 className="w-4 h-4 text-green-400" />
                        <span className="text-sm text-green-400 font-medium">
                          Verified on Blockchain
                        </span>
                        {tx.confirmations && (
                          <Badge variant="outline" className="border-green-500/30 text-green-400">
                            {tx.confirmations} confirmations
                          </Badge>
                        )}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default AllTransactions;
