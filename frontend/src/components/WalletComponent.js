/**
 * WALLET MANAGEMENT COMPONENT
 * 
 * Complete wallet interface with:
 * - MetaMask connection
 * - Generate new wallet
 * - Import wallet (mnemonic/private key)
 * - View balance and transactions
 * - Real blockchain verification
 */

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Alert, AlertDescription } from './ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Badge } from './ui/badge';
import { 
  Wallet, 
  Copy, 
  Eye, 
  EyeOff, 
  Download, 
  Upload, 
  Key,
  ExternalLink,
  RefreshCw,
  CheckCircle,
  AlertCircle,
  Shield,
  Send,
  History
} from 'lucide-react';
import { walletManager, NETWORKS, formatAddress, formatBalance, isValidAddress } from '../utils/walletManager';
import { toast } from 'sonner';

const WalletComponent = ({ onWalletConnected }) => {
  const [activeTab, setActiveTab] = useState('connect');
  const [walletInfo, setWalletInfo] = useState(null);
  const [balance, setBalance] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  
  // Generate wallet state
  const [generatePassword, setGeneratePassword] = useState('');
  const [generatePasswordConfirm, setGeneratePasswordConfirm] = useState('');
  const [generatedWallet, setGeneratedWallet] = useState(null);
  const [showMnemonic, setShowMnemonic] = useState(false);
  
  // Import wallet state
  const [importType, setImportType] = useState('mnemonic');
  const [importMnemonic, setImportMnemonic] = useState('');
  const [importPrivateKey, setImportPrivateKey] = useState('');
  const [importPassword, setImportPassword] = useState('');
  const [showPrivateKey, setShowPrivateKey] = useState(false);
  
  // Unlock wallet state
  const [unlockPassword, setUnlockPassword] = useState('');
  const [selectedNetwork, setSelectedNetwork] = useState('POLYGON_MUMBAI');
  
  // Transaction state
  const [sendTo, setSendTo] = useState('');
  const [sendAmount, setSendAmount] = useState('');
  const [txHistory, setTxHistory] = useState(null);

  useEffect(() => {
    // Check if wallet is already connected
    const info = walletManager.getWalletInfo();
    if (info.isConnected) {
      setWalletInfo(info);
      loadBalance();
    }
  }, []);

  // Load wallet balance
  const loadBalance = async () => {
    try {
      const bal = await walletManager.getBalance();
      setBalance(bal);
    } catch (error) {
      console.error('Failed to load balance:', error);
    }
  };

  // Connect MetaMask
  const handleConnectMetaMask = async () => {
    setIsLoading(true);
    try {
      const result = await walletManager.connectMetaMask();
      setWalletInfo(result);
      await loadBalance();
      
      toast.success('Wallet Connected!', {
        description: `Connected to ${formatAddress(result.address)}`
      });

      if (onWalletConnected) {
        onWalletConnected(result);
      }
    } catch (error) {
      toast.error('Connection Failed', {
        description: error.message
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Generate new wallet
  const handleGenerateWallet = async () => {
    if (generatePassword.length < 8) {
      toast.error('Password must be at least 8 characters');
      return;
    }

    if (generatePassword !== generatePasswordConfirm) {
      toast.error('Passwords do not match');
      return;
    }

    setIsLoading(true);
    try {
      const result = await walletManager.generateNewWallet(generatePassword);
      setGeneratedWallet(result);
      
      toast.success('Wallet Generated!', {
        description: 'Save your mnemonic phrase securely!'
      });

      // Clear password fields
      setGeneratePassword('');
      setGeneratePasswordConfirm('');
    } catch (error) {
      toast.error('Generation Failed', {
        description: error.message
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Import wallet
  const handleImportWallet = async () => {
    if (importPassword.length < 8) {
      toast.error('Password must be at least 8 characters');
      return;
    }

    setIsLoading(true);
    try {
      let result;
      
      if (importType === 'mnemonic') {
        if (!importMnemonic.trim()) {
          throw new Error('Mnemonic phrase is required');
        }
        result = await walletManager.importWalletFromMnemonic(importMnemonic, importPassword);
      } else {
        if (!importPrivateKey.trim()) {
          throw new Error('Private key is required');
        }
        result = await walletManager.importWalletFromPrivateKey(importPrivateKey, importPassword);
      }

      toast.success('Wallet Imported!', {
        description: `Address: ${formatAddress(result.address)}`
      });

      // Clear fields
      setImportMnemonic('');
      setImportPrivateKey('');
      setImportPassword('');
      
      // Switch to unlock tab
      setActiveTab('unlock');
    } catch (error) {
      toast.error('Import Failed', {
        description: error.message
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Unlock wallet
  const handleUnlockWallet = async () => {
    setIsLoading(true);
    try {
      const result = await walletManager.unlockWallet(unlockPassword, selectedNetwork);
      setWalletInfo(result);
      await loadBalance();

      toast.success('Wallet Unlocked!', {
        description: `Connected to ${formatAddress(result.address)}`
      });

      setUnlockPassword('');

      if (onWalletConnected) {
        onWalletConnected(result);
      }
    } catch (error) {
      toast.error('Unlock Failed', {
        description: error.message
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Send transaction
  const handleSendTransaction = async () => {
    if (!isValidAddress(sendTo)) {
      toast.error('Invalid recipient address');
      return;
    }

    if (!sendAmount || parseFloat(sendAmount) <= 0) {
      toast.error('Invalid amount');
      return;
    }

    setIsLoading(true);
    try {
      const result = await walletManager.sendTransaction({
        to: sendTo,
        value: ethers.parseEther(sendAmount)
      });

      toast.success('Transaction Sent!', {
        description: `Hash: ${formatAddress(result.hash)}`
      });

      // Clear form
      setSendTo('');
      setSendAmount('');

      // Reload balance
      await loadBalance();
    } catch (error) {
      toast.error('Transaction Failed', {
        description: error.message
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Get transaction history
  const handleGetHistory = async () => {
    setIsLoading(true);
    try {
      const result = await walletManager.getTransactionHistory();
      setTxHistory(result);
      
      toast.success('History Loaded', {
        description: `${result.transactionCount} transactions found`
      });
    } catch (error) {
      toast.error('Failed to load history', {
        description: error.message
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Copy to clipboard
  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard!');
  };

  // Download mnemonic as file
  const downloadMnemonic = () => {
    if (!generatedWallet?.mnemonic) return;
    
    const element = document.createElement('a');
    const file = new Blob([generatedWallet.mnemonic], { type: 'text/plain' });
    element.href = URL.createObjectURL(file);
    element.download = `wallet-backup-${Date.now()}.txt`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
    
    toast.success('Mnemonic downloaded!');
  };

  // If wallet is connected, show wallet info
  if (walletInfo?.isConnected) {
    return (
      <div className="w-full max-w-4xl mx-auto p-6 space-y-6">
        {/* Wallet Info Card */}
        <Card className="glass-effect border-slate-700">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                  <Wallet className="w-6 h-6 text-white" />
                </div>
                <div>
                  <CardTitle className="text-white">Wallet Connected</CardTitle>
                  <CardDescription className="flex items-center space-x-2">
                    <Badge variant="outline" className="border-green-500 text-green-400">
                      <CheckCircle className="w-3 h-3 mr-1" />
                      {walletInfo.walletType}
                    </Badge>
                    <Badge variant="outline" className="border-blue-500 text-blue-400">
                      {walletInfo.network?.name || 'Unknown'}
                    </Badge>
                  </CardDescription>
                </div>
              </div>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => {
                  walletManager.disconnect();
                  setWalletInfo(null);
                  setBalance(null);
                  toast.info('Wallet disconnected');
                }}
                className="border-red-700/50 text-red-400 hover:bg-red-900/20"
              >
                Disconnect
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Address */}
            <div>
              <Label className="text-slate-400 text-sm">Address</Label>
              <div className="flex items-center space-x-2 mt-1">
                <Input 
                  value={walletInfo.address} 
                  readOnly 
                  className="bg-slate-900/50 border-slate-700 text-white font-mono"
                />
                <Button 
                  size="icon" 
                  variant="outline"
                  onClick={() => copyToClipboard(walletInfo.address)}
                  className="border-slate-700"
                >
                  <Copy className="w-4 h-4" />
                </Button>
                <Button 
                  size="icon" 
                  variant="outline"
                  onClick={() => window.open(
                    `${walletInfo.network?.blockExplorer || NETWORKS.POLYGON_MUMBAI.blockExplorer}/address/${walletInfo.address}`,
                    '_blank'
                  )}
                  className="border-slate-700"
                >
                  <ExternalLink className="w-4 h-4" />
                </Button>
              </div>
            </div>

            {/* Balance */}
            <div>
              <Label className="text-slate-400 text-sm">Balance</Label>
              <div className="flex items-center space-x-2 mt-1">
                <div className="flex-1 px-4 py-3 rounded-lg bg-gradient-to-r from-blue-500/10 to-purple-500/10 border border-blue-500/30">
                  <div className="text-2xl font-bold text-white">
                    {balance ? balance.formatted : 'Loading...'}
                  </div>
                </div>
                <Button 
                  size="icon" 
                  variant="outline"
                  onClick={loadBalance}
                  disabled={isLoading}
                  className="border-slate-700"
                >
                  <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
                </Button>
              </div>
            </div>

            {/* Actions */}
            <div className="grid grid-cols-2 gap-3">
              <Card className="bg-slate-900/50 border-slate-700">
                <CardContent className="p-4 space-y-3">
                  <div className="flex items-center space-x-2 text-white">
                    <Send className="w-4 h-4" />
                    <span className="font-medium">Send</span>
                  </div>
                  <div className="space-y-2">
                    <Input 
                      placeholder="Recipient address"
                      value={sendTo}
                      onChange={(e) => setSendTo(e.target.value)}
                      className="bg-slate-800 border-slate-700 text-white text-sm"
                    />
                    <Input 
                      type="number"
                      placeholder="Amount"
                      value={sendAmount}
                      onChange={(e) => setSendAmount(e.target.value)}
                      className="bg-slate-800 border-slate-700 text-white text-sm"
                    />
                    <Button 
                      className="w-full bg-blue-600 hover:bg-blue-700"
                      onClick={handleSendTransaction}
                      disabled={isLoading}
                    >
                      Send Transaction
                    </Button>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-slate-900/50 border-slate-700">
                <CardContent className="p-4 space-y-3">
                  <div className="flex items-center space-x-2 text-white">
                    <History className="w-4 h-4" />
                    <span className="font-medium">History</span>
                  </div>
                  {txHistory ? (
                    <div className="space-y-2">
                      <div className="text-sm text-slate-400">
                        Transactions: {txHistory.transactionCount}
                      </div>
                      <div className="text-sm text-slate-400">
                        Block: {txHistory.currentBlock}
                      </div>
                      <Button 
                        className="w-full"
                        variant="outline"
                        onClick={() => window.open(txHistory.explorerUrl, '_blank')}
                      >
                        View on Explorer
                      </Button>
                    </div>
                  ) : (
                    <Button 
                      className="w-full"
                      onClick={handleGetHistory}
                      disabled={isLoading}
                    >
                      Load History
                    </Button>
                  )}
                </CardContent>
              </Card>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Wallet setup interface
  return (
    <div className="w-full max-w-2xl mx-auto p-6">
      <Card className="glass-effect border-slate-700">
        <CardHeader>
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
              <Wallet className="w-6 h-6 text-white" />
            </div>
            <div>
              <CardTitle className="text-white">Wallet Setup</CardTitle>
              <CardDescription>Connect or create your blockchain wallet</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid grid-cols-4 w-full bg-slate-900/50">
              <TabsTrigger value="connect">Connect</TabsTrigger>
              <TabsTrigger value="generate">Generate</TabsTrigger>
              <TabsTrigger value="import">Import</TabsTrigger>
              <TabsTrigger value="unlock">Unlock</TabsTrigger>
            </TabsList>

            {/* Connect MetaMask Tab */}
            <TabsContent value="connect" className="space-y-4">
              <Alert className="bg-blue-500/10 border-blue-500/30">
                <Shield className="w-4 h-4 text-blue-400" />
                <AlertDescription className="text-slate-300">
                  Connect your existing MetaMask wallet for instant access
                </AlertDescription>
              </Alert>

              <Button 
                className="w-full bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white h-12"
                onClick={handleConnectMetaMask}
                disabled={isLoading}
              >
                <Wallet className="w-5 h-5 mr-2" />
                {isLoading ? 'Connecting...' : 'Connect MetaMask'}
              </Button>

              <div className="text-sm text-slate-400 text-center">
                Don't have MetaMask?{' '}
                <a 
                  href="https://metamask.io/download/" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-blue-400 hover:underline"
                >
                  Download here
                </a>
              </div>
            </TabsContent>

            {/* Generate New Wallet Tab */}
            <TabsContent value="generate" className="space-y-4">
              <Alert className="bg-green-500/10 border-green-500/30">
                <Shield className="w-4 h-4 text-green-400" />
                <AlertDescription className="text-slate-300">
                  Generate a new wallet with a 12-word recovery phrase
                </AlertDescription>
              </Alert>

              {generatedWallet ? (
                <div className="space-y-4">
                  <Alert className="bg-yellow-500/10 border-yellow-500/30">
                    <AlertCircle className="w-4 h-4 text-yellow-400" />
                    <AlertDescription className="text-slate-300">
                      <strong>⚠️ SAVE YOUR RECOVERY PHRASE!</strong><br />
                      This is the ONLY way to recover your wallet. Store it securely offline.
                    </AlertDescription>
                  </Alert>

                  <div>
                    <Label className="text-slate-300">Your Wallet Address</Label>
                    <div className="flex items-center space-x-2 mt-1">
                      <Input 
                        value={generatedWallet.address} 
                        readOnly 
                        className="bg-slate-900/50 border-slate-700 text-white font-mono"
                      />
                      <Button 
                        size="icon" 
                        variant="outline"
                        onClick={() => copyToClipboard(generatedWallet.address)}
                        className="border-slate-700"
                      >
                        <Copy className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>

                  <div>
                    <Label className="text-slate-300">Recovery Phrase (12 words)</Label>
                    <div className="relative mt-1">
                      <textarea
                        value={generatedWallet.mnemonic}
                        readOnly
                        className={`w-full h-24 px-4 py-2 rounded-lg bg-slate-900/50 border-2 border-yellow-500/50 text-white font-mono text-sm ${
                          !showMnemonic ? 'blur-sm' : ''
                        }`}
                      />
                      <Button
                        size="icon"
                        variant="outline"
                        className="absolute top-2 right-2 border-slate-700"
                        onClick={() => setShowMnemonic(!showMnemonic)}
                      >
                        {showMnemonic ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </Button>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <Button 
                      variant="outline"
                      onClick={() => copyToClipboard(generatedWallet.mnemonic)}
                      className="border-slate-700"
                    >
                      <Copy className="w-4 h-4 mr-2" />
                      Copy Phrase
                    </Button>
                    <Button 
                      variant="outline"
                      onClick={downloadMnemonic}
                      className="border-slate-700"
                    >
                      <Download className="w-4 h-4 mr-2" />
                      Download
                    </Button>
                  </div>

                  <Button 
                    className="w-full bg-blue-600 hover:bg-blue-700"
                    onClick={() => {
                      setGeneratedWallet(null);
                      setActiveTab('unlock');
                    }}
                  >
                    Continue to Unlock
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="generatePassword" className="text-slate-300">Password</Label>
                    <Input
                      id="generatePassword"
                      type="password"
                      placeholder="Enter strong password (min 8 characters)"
                      value={generatePassword}
                      onChange={(e) => setGeneratePassword(e.target.value)}
                      className="bg-slate-900/50 border-slate-700 text-white mt-1"
                    />
                  </div>

                  <div>
                    <Label htmlFor="generatePasswordConfirm" className="text-slate-300">Confirm Password</Label>
                    <Input
                      id="generatePasswordConfirm"
                      type="password"
                      placeholder="Confirm password"
                      value={generatePasswordConfirm}
                      onChange={(e) => setGeneratePasswordConfirm(e.target.value)}
                      className="bg-slate-900/50 border-slate-700 text-white mt-1"
                    />
                  </div>

                  <Button 
                    className="w-full bg-green-600 hover:bg-green-700"
                    onClick={handleGenerateWallet}
                    disabled={isLoading}
                  >
                    <Key className="w-4 h-4 mr-2" />
                    {isLoading ? 'Generating...' : 'Generate Wallet'}
                  </Button>
                </div>
              )}
            </TabsContent>

            {/* Import Wallet Tab */}
            <TabsContent value="import" className="space-y-4">
              <Alert className="bg-purple-500/10 border-purple-500/30">
                <Upload className="w-4 h-4 text-purple-400" />
                <AlertDescription className="text-slate-300">
                  Import an existing wallet using recovery phrase or private key
                </AlertDescription>
              </Alert>

              <Tabs value={importType} onValueChange={setImportType}>
                <TabsList className="grid grid-cols-2 w-full bg-slate-900/50">
                  <TabsTrigger value="mnemonic">Recovery Phrase</TabsTrigger>
                  <TabsTrigger value="privatekey">Private Key</TabsTrigger>
                </TabsList>

                <TabsContent value="mnemonic" className="space-y-4">
                  <div>
                    <Label className="text-slate-300">Recovery Phrase (12 or 24 words)</Label>
                    <textarea
                      placeholder="Enter your recovery phrase..."
                      value={importMnemonic}
                      onChange={(e) => setImportMnemonic(e.target.value)}
                      className="w-full h-24 px-4 py-2 rounded-lg bg-slate-900/50 border border-slate-700 text-white font-mono text-sm mt-1"
                    />
                  </div>
                </TabsContent>

                <TabsContent value="privatekey" className="space-y-4">
                  <div>
                    <Label className="text-slate-300">Private Key</Label>
                    <div className="relative mt-1">
                      <Input
                        type={showPrivateKey ? 'text' : 'password'}
                        placeholder="Enter your private key (0x...)"
                        value={importPrivateKey}
                        onChange={(e) => setImportPrivateKey(e.target.value)}
                        className="bg-slate-900/50 border-slate-700 text-white font-mono pr-10"
                      />
                      <Button
                        size="icon"
                        variant="ghost"
                        className="absolute right-1 top-1 h-8 w-8"
                        onClick={() => setShowPrivateKey(!showPrivateKey)}
                      >
                        {showPrivateKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </Button>
                    </div>
                  </div>
                </TabsContent>
              </Tabs>

              <div>
                <Label className="text-slate-300">Set Password</Label>
                <Input
                  type="password"
                  placeholder="Enter password to encrypt wallet"
                  value={importPassword}
                  onChange={(e) => setImportPassword(e.target.value)}
                  className="bg-slate-900/50 border-slate-700 text-white mt-1"
                />
              </div>

              <Button 
                className="w-full bg-purple-600 hover:bg-purple-700"
                onClick={handleImportWallet}
                disabled={isLoading}
              >
                <Upload className="w-4 h-4 mr-2" />
                {isLoading ? 'Importing...' : 'Import Wallet'}
              </Button>
            </TabsContent>

            {/* Unlock Wallet Tab */}
            <TabsContent value="unlock" className="space-y-4">
              <Alert className="bg-blue-500/10 border-blue-500/30">
                <Key className="w-4 h-4 text-blue-400" />
                <AlertDescription className="text-slate-300">
                  Unlock your previously generated or imported wallet
                </AlertDescription>
              </Alert>

              <div>
                <Label className="text-slate-300">Select Network</Label>
                <select
                  value={selectedNetwork}
                  onChange={(e) => setSelectedNetwork(e.target.value)}
                  className="w-full px-4 py-2 rounded-lg bg-slate-900/50 border border-slate-700 text-white mt-1"
                >
                  {Object.entries(NETWORKS).map(([key, network]) => (
                    <option key={key} value={key}>
                      {network.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <Label className="text-slate-300">Password</Label>
                <Input
                  type="password"
                  placeholder="Enter your wallet password"
                  value={unlockPassword}
                  onChange={(e) => setUnlockPassword(e.target.value)}
                  className="bg-slate-900/50 border-slate-700 text-white mt-1"
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      handleUnlockWallet();
                    }
                  }}
                />
              </div>

              <Button 
                className="w-full bg-blue-600 hover:bg-blue-700"
                onClick={handleUnlockWallet}
                disabled={isLoading}
              >
                <Key className="w-4 h-4 mr-2" />
                {isLoading ? 'Unlocking...' : 'Unlock Wallet'}
              </Button>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Security Notice */}
      <Card className="glass-effect border-yellow-700/50 mt-4">
        <CardContent className="p-4">
          <div className="flex items-start space-x-3">
            <Shield className="w-5 h-5 text-yellow-400 mt-0.5" />
            <div className="text-sm text-slate-300">
              <strong className="text-yellow-400">Security Notice:</strong> Your private keys are encrypted and stored locally. Never share your recovery phrase or private key with anyone. This application uses production-grade encryption (AES-256).
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default WalletComponent;
