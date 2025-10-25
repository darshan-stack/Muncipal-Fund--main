import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Badge } from './ui/badge';
import { 
  ExternalLink, 
  Search, 
  Filter, 
  Download, 
  CheckCircle2, 
  Clock, 
  XCircle,
  ArrowUpRight,
  ArrowDownLeft,
  Wallet,
  FileText
} from 'lucide-react';
import { toast } from 'sonner';
import { transactionService, getTransactionUrl } from '../services/transactionService';

const TX_TYPES = {
  'All Types': null,
  'Create Project': 'create_project',
  'Submit Milestone': 'submit_milestone',
  'Submit Tender': 'submit_tender',
  'Approve Tender': 'approve_tender',
  'Release Funds': 'release_funds'
};

const TX_STATUS = {
  'All Status': null,
  'Pending': 'pending',
  'Confirmed': 'confirmed',
  'Failed': 'failed'
};

const AdminTransactionHistory = ({ user }) => {
  const [transactions, setTransactions] = useState([]);
  const [filteredTransactions, setFilteredTransactions] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState('All Types');
  const [selectedStatus, setSelectedStatus] = useState('All Status');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTransactions();
    // Refresh transactions every 30 seconds
    const interval = setInterval(fetchTransactions, 30000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    filterTransactions();
  }, [transactions, searchQuery, selectedType, selectedStatus]);

  const fetchTransactions = async () => {
    try {
      const allTx = transactionService.getAllTransactions();
      setTransactions(allTx);
    } catch (error) {
      console.error('Error fetching transactions:', error);
      toast.error('Failed to load transactions');
    } finally {
      setLoading(false);
    }
  };

  const filterTransactions = () => {
    let filtered = [...transactions];

    // Filter by type
    if (TX_TYPES[selectedType]) {
      filtered = filtered.filter(tx => tx.type === TX_TYPES[selectedType]);
    }

    // Filter by status
    if (TX_STATUS[selectedStatus]) {
      filtered = filtered.filter(tx => tx.status === TX_STATUS[selectedStatus]);
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(tx =>
        tx.hash?.toLowerCase().includes(query) ||
        tx.from?.toLowerCase().includes(query) ||
        tx.to?.toLowerCase().includes(query) ||
        tx.projectName?.toLowerCase().includes(query)
      );
    }

    // Sort by timestamp (newest first)
    filtered.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

    setFilteredTransactions(filtered);
  };

  const handleExportCSV = () => {
    transactionService.exportToCSV();
    toast.success('Transactions exported to CSV');
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'confirmed':
        return <CheckCircle2 className="w-4 h-4 text-green-400" />;
      case 'pending':
        return <Clock className="w-4 h-4 text-yellow-400" />;
      case 'failed':
        return <XCircle className="w-4 h-4 text-red-400" />;
      default:
        return <Clock className="w-4 h-4 text-slate-400" />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'confirmed':
        return 'bg-green-500/20 text-green-400 border-green-500/30';
      case 'pending':
        return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
      case 'failed':
        return 'bg-red-500/20 text-red-400 border-red-500/30';
      default:
        return 'bg-slate-500/20 text-slate-400 border-slate-500/30';
    }
  };

  const getTypeIcon = (type) => {
    switch (type) {
      case 'create_project':
        return <FileText className="w-4 h-4" />;
      case 'submit_milestone':
        return <CheckCircle2 className="w-4 h-4" />;
      case 'release_funds':
        return <ArrowUpRight className="w-4 h-4" />;
      case 'approve_tender':
        return <CheckCircle2 className="w-4 h-4" />;
      default:
        return <Wallet className="w-4 h-4" />;
    }
  };

  const getTypeLabel = (type) => {
    return Object.keys(TX_TYPES).find(key => TX_TYPES[key] === type) || type;
  };

  const formatAddress = (address) => {
    if (!address) return 'N/A';
    return `${address.slice(0, 8)}...${address.slice(-6)}`;
  };

  const formatDate = (timestamp) => {
    return new Date(timestamp).toLocaleString();
  };

  const formatAmount = (amount) => {
    if (!amount) return 'N/A';
    try {
      const ethValue = parseFloat(amount) / 1e18;
      return `${ethValue.toFixed(4)} ETH`;
    } catch {
      return 'N/A';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse text-slate-400">Loading transactions...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-6 animate-fade-in">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-white" style={{fontFamily: 'Space Grotesk'}}>
              Transaction History
            </h1>
            <p className="text-slate-400 mt-1">Complete blockchain transaction records</p>
          </div>
          <Button
            onClick={handleExportCSV}
            className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700"
          >
            <Download className="w-4 h-4 mr-2" />
            Export CSV
          </Button>
        </div>

        {/* Filters */}
        <Card className="glass-effect border-slate-700">
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
                <Input
                  type="text"
                  placeholder="Search by hash, address, project..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 bg-slate-800/50 border-slate-700 text-white placeholder:text-slate-500"
                />
              </div>

              {/* Type Filter */}
              <div className="flex items-center space-x-2">
                <Filter className="w-4 h-4 text-slate-400" />
                <select
                  value={selectedType}
                  onChange={(e) => setSelectedType(e.target.value)}
                  className="flex-1 px-4 py-2 bg-slate-800/50 border border-slate-700 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {Object.keys(TX_TYPES).map((type) => (
                    <option key={type} value={type}>
                      {type}
                    </option>
                  ))}
                </select>
              </div>

              {/* Status Filter */}
              <div className="flex items-center space-x-2">
                <Filter className="w-4 h-4 text-slate-400" />
                <select
                  value={selectedStatus}
                  onChange={(e) => setSelectedStatus(e.target.value)}
                  className="flex-1 px-4 py-2 bg-slate-800/50 border border-slate-700 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {Object.keys(TX_STATUS).map((status) => (
                    <option key={status} value={status}>
                      {status}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Active Filters */}
            {(selectedType !== 'All Types' || selectedStatus !== 'All Status' || searchQuery) && (
              <div className="flex items-center space-x-2 mt-4 pt-4 border-t border-slate-700">
                <span className="text-sm text-slate-400">Active filters:</span>
                {selectedType !== 'All Types' && (
                  <Badge className="bg-blue-500/20 text-blue-400">
                    {selectedType}
                  </Badge>
                )}
                {selectedStatus !== 'All Status' && (
                  <Badge className="bg-purple-500/20 text-purple-400">
                    {selectedStatus}
                  </Badge>
                )}
                {searchQuery && (
                  <Badge className="bg-green-500/20 text-green-400">
                    Search: {searchQuery}
                  </Badge>
                )}
                <button
                  onClick={() => {
                    setSelectedType('All Types');
                    setSelectedStatus('All Status');
                    setSearchQuery('');
                  }}
                  className="text-sm text-slate-400 hover:text-white ml-2"
                >
                  Clear all
                </button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Transaction Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="glass-effect border-slate-700">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-400">Total Transactions</p>
                  <p className="text-2xl font-bold text-white mt-1">{transactions.length}</p>
                </div>
                <Wallet className="w-8 h-8 text-blue-400" />
              </div>
            </CardContent>
          </Card>

          <Card className="glass-effect border-slate-700">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-400">Confirmed</p>
                  <p className="text-2xl font-bold text-green-400 mt-1">
                    {transactions.filter(tx => tx.status === 'confirmed').length}
                  </p>
                </div>
                <CheckCircle2 className="w-8 h-8 text-green-400" />
              </div>
            </CardContent>
          </Card>

          <Card className="glass-effect border-slate-700">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-400">Pending</p>
                  <p className="text-2xl font-bold text-yellow-400 mt-1">
                    {transactions.filter(tx => tx.status === 'pending').length}
                  </p>
                </div>
                <Clock className="w-8 h-8 text-yellow-400" />
              </div>
            </CardContent>
          </Card>

          <Card className="glass-effect border-slate-700">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-400">Failed</p>
                  <p className="text-2xl font-bold text-red-400 mt-1">
                    {transactions.filter(tx => tx.status === 'failed').length}
                  </p>
                </div>
                <XCircle className="w-8 h-8 text-red-400" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Transactions List */}
        {filteredTransactions.length === 0 ? (
          <Card className="glass-effect border-slate-700">
            <CardContent className="py-12 text-center">
              <Wallet className="w-16 h-16 text-slate-600 mx-auto mb-4" />
              <p className="text-slate-400 text-lg">
                {transactions.length === 0 
                  ? 'No transactions yet'
                  : 'No transactions match your filters'}
              </p>
            </CardContent>
          </Card>
        ) : (
          <Card className="glass-effect border-slate-700">
            <CardHeader>
              <CardTitle className="text-white">
                Transactions ({filteredTransactions.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {filteredTransactions.map((tx, index) => (
                  <div
                    key={tx.hash || index}
                    className="p-4 rounded-lg bg-slate-800/30 border border-slate-700 hover:border-slate-600 transition-colors"
                  >
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                      {/* Left Side - Transaction Info */}
                      <div className="flex-1 space-y-3">
                        {/* Transaction Type & Status */}
                        <div className="flex items-center space-x-3">
                          <div className="p-2 rounded-lg bg-blue-500/20">
                            {getTypeIcon(tx.type)}
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center space-x-2">
                              <h3 className="text-white font-semibold">
                                {getTypeLabel(tx.type)}
                              </h3>
                              <Badge className={getStatusColor(tx.status)}>
                                {getStatusIcon(tx.status)}
                                <span className="ml-1 capitalize">{tx.status}</span>
                              </Badge>
                            </div>
                            {tx.projectName && (
                              <p className="text-sm text-slate-400 mt-1">
                                Project: {tx.projectName}
                              </p>
                            )}
                          </div>
                        </div>

                        {/* Transaction Details */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                          <div>
                            <span className="text-slate-400">Hash:</span>
                            <p className="text-white font-mono break-all mt-1">
                              {tx.hash ? formatAddress(tx.hash) : 'Pending...'}
                            </p>
                          </div>
                          <div>
                            <span className="text-slate-400">Timestamp:</span>
                            <p className="text-white mt-1">{formatDate(tx.timestamp)}</p>
                          </div>
                          <div>
                            <span className="text-slate-400">From:</span>
                            <p className="text-white font-mono mt-1">
                              {formatAddress(tx.from)}
                            </p>
                          </div>
                          <div>
                            <span className="text-slate-400">To:</span>
                            <p className="text-white font-mono mt-1">
                              {formatAddress(tx.to)}
                            </p>
                          </div>
                          {tx.amount && (
                            <div>
                              <span className="text-slate-400">Amount:</span>
                              <p className="text-white font-semibold mt-1">
                                {formatAmount(tx.amount)}
                              </p>
                            </div>
                          )}
                          {tx.gasUsed && (
                            <div>
                              <span className="text-slate-400">Gas Used:</span>
                              <p className="text-white mt-1">{tx.gasUsed}</p>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Right Side - Actions */}
                      <div className="flex flex-col space-y-2">
                        {tx.hash && (
                          <a
                            href={getTransactionUrl(tx.hash, tx.network || 'mumbai')}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center justify-center px-4 py-2 bg-blue-500/20 hover:bg-blue-500/30 border border-blue-500/30 rounded-lg text-blue-400 transition-colors"
                          >
                            <ExternalLink className="w-4 h-4 mr-2" />
                            View on Explorer
                          </a>
                        )}
                        {tx.status === 'confirmed' && (
                          <div className="flex items-center justify-center text-xs text-green-400">
                            <CheckCircle2 className="w-3 h-3 mr-1" />
                            Confirmed
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default AdminTransactionHistory;
