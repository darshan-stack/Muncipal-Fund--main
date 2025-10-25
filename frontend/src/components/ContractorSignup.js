import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ethers } from 'ethers';
import axios from 'axios';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Badge } from './ui/badge';
import { Loader2, UserPlus, Wallet, Shield, CheckCircle2, Copy, Eye, EyeOff } from 'lucide-react';
import { toast } from 'sonner';
import { transactionService } from '../services/transactionService';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const ContractorSignup = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1); // 1: Details, 2: Blockchain ID Generation, 3: Complete
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [blockchainId, setBlockchainId] = useState(null);
  const [walletAddress, setWalletAddress] = useState(null);
  const [formData, setFormData] = useState({
    companyName: '',
    contactPerson: '',
    email: '',
    phone: '',
    registrationNumber: '',
    address: '',
    city: '',
    state: '',
    pincode: '',
    experience: '',
    specialization: '',
    username: '',
    password: '',
    confirmPassword: ''
  });

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const validateForm = () => {
    if (!formData.companyName || !formData.contactPerson || !formData.email || 
        !formData.phone || !formData.username || !formData.password) {
      toast.error('Please fill all required fields');
      return false;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      toast.error('Please enter a valid email address');
      return false;
    }

    if (!/^[0-9]{10}$/.test(formData.phone)) {
      toast.error('Please enter a valid 10-digit phone number');
      return false;
    }

    if (formData.password.length < 6) {
      toast.error('Password must be at least 6 characters');
      return false;
    }

    if (formData.password !== formData.confirmPassword) {
      toast.error('Passwords do not match');
      return false;
    }

    return true;
  };

  const generateBlockchainId = async () => {
    try {
      setLoading(true);
      setStep(2);

      // Check if MetaMask is installed
      if (!window.ethereum) {
        toast.error('MetaMask not found', {
          description: 'Please install MetaMask to register as a contractor'
        });
        setStep(1);
        setLoading(false);
        return;
      }

      toast.info('Connect your wallet', {
        description: 'MetaMask will open shortly to connect your wallet'
      });

      // Connect MetaMask
      const provider = new ethers.BrowserProvider(window.ethereum);
      
      // Request account access
      try {
        await window.ethereum.request({ method: 'eth_requestAccounts' });
      } catch (error) {
        if (error.code === 4001) {
          // User rejected the request
          toast.error('Connection rejected', {
            description: 'You need to connect your wallet to continue'
          });
          setStep(1);
          setLoading(false);
          return;
        }
        throw error;
      }
      
      const signer = await provider.getSigner();
      const address = await signer.getAddress();

      setWalletAddress(address);

      toast.info('Generating blockchain ID', {
        description: 'Creating unique contractor identity...',
        duration: 3000
      });

      // Register contractor on blockchain and get blockchain ID
      const txResult = await transactionService.registerContractor(signer, {
        companyName: formData.companyName,
        contactPerson: formData.contactPerson,
        walletAddress: address
      });

      // Extract blockchain ID from transaction result
      const contractorId = txResult.contractorId || `CNTR-${Date.now()}`;
      setBlockchainId(contractorId);

      if (txResult.isMock) {
        toast.warning('Demo Mode Active', {
          description: `Using generated ID: ${contractorId}. Deploy contract for real blockchain registration.`,
          duration: 8000
        });
      } else {
        toast.success('Blockchain ID generated!', {
          description: `Your unique ID: ${contractorId}`,
          duration: 5000
        });
      }

      // Save to backend
      await saveContractor(contractorId, address, txResult.hash);

    } catch (error) {
      console.error('Error generating blockchain ID:', error);
      setStep(1);
      setLoading(false);
      
      if (error.code === 4001 || error.code === 'ACTION_REJECTED') {
        toast.error('Transaction rejected', {
          description: 'You rejected the MetaMask transaction'
        });
      } else if (error.message?.includes('insufficient funds')) {
        toast.error('Insufficient funds', {
          description: 'You need test MATIC for registration. Get from https://faucet.polygon.technology/'
        });
      } else {
        toast.error('Failed to generate blockchain ID', {
          description: error.message || 'Please try again'
        });
      }
      
      setStep(1);
    } finally {
      setLoading(false);
    }
  };

  const saveContractor = async (contractorId, walletAddr, txHash) => {
    try {
      const requestData = {
        blockchain_id: contractorId,
        company_name: formData.companyName,
        contact_person: formData.contactPerson,
        email: formData.email,
        phone: formData.phone,
        registration_number: formData.registrationNumber,
        address: formData.address,
        city: formData.city,
        state: formData.state,
        pincode: formData.pincode,
        experience: parseInt(formData.experience) || 0,
        specialization: formData.specialization,
        wallet_address: walletAddr,
        username: formData.username,
        password: formData.password,
        registration_tx_hash: txHash,
        status: 'active',
        role: 'contractor'
      };
      
      console.log('📤 Sending registration data:', requestData);
      console.log('📋 Required fields check:', {
        blockchain_id: !!requestData.blockchain_id,
        company_name: !!requestData.company_name,
        email: !!requestData.email,
        username: !!requestData.username,
        password: !!requestData.password
      });
      
      const response = await axios.post(`${API}/contractors/register`, requestData);

      setStep(3);
      
      toast.success('Registration successful!', {
        description: 'You can now login with your credentials',
        duration: 5000
      });

    } catch (error) {
      console.error('❌ Error saving contractor:', error);
      console.error('Error response:', error.response?.data);
      
      // Go back to step 1 so user isn't stuck
      setStep(1);
      setLoading(false);
      
      // More specific error messages
      let errorTitle = 'Failed to complete registration';
      let errorDescription = `Please contact support with your blockchain ID: ${blockchainId}`;
      
      if (error.code === 'ERR_NETWORK' || error.message?.includes('Network Error')) {
        errorTitle = 'Backend Server Not Running';
        errorDescription = 'The backend API is not accessible. Please start the backend server: cd backend && python server_simple.py';
      } else if (error.response?.status === 404) {
        errorTitle = 'API Endpoint Not Found';
        errorDescription = 'The contractor registration endpoint is not available. Check backend/server_simple.py is running';
      } else if (error.response?.status === 400) {
        errorTitle = 'Validation Error';
        errorDescription = error.response?.data?.error || 'Please check all required fields are filled correctly';
      } else if (error.response?.status === 500) {
        errorTitle = 'Server Error';
        errorDescription = error.response?.data?.error || 'An error occurred on the server. Please try again.';
      } else if (error.response?.data?.error) {
        errorDescription = error.response.data.error;
      }
      
      toast.error(errorTitle, {
        description: errorDescription,
        duration: 10000
      });
      
      // Still show the blockchain ID so user doesn't lose it
      if (blockchainId) {
        setTimeout(() => {
          toast.info('Your Blockchain ID (save this!)', {
            description: blockchainId,
            duration: 15000
          });
        }, 1000);
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    await generateBlockchainId();
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard!');
  };

  if (step === 2) {
    return (
      <div className="min-h-screen py-8 px-4 sm:px-6 lg:px-8 flex items-center justify-center">
        <Card className="w-full max-w-md glass-effect border-slate-700">
          <CardContent className="pt-6">
            <div className="text-center space-y-4">
              <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
              <h3 className="text-xl font-semibold text-white">Generating Blockchain ID</h3>
              <p className="text-slate-400">
                Creating your unique contractor identity on the blockchain...
              </p>
              <div className="space-y-2 text-sm text-slate-500">
                <p>✓ Connecting to blockchain network</p>
                <p>✓ Creating unique contractor profile</p>
                <p className="text-blue-400 animate-pulse">⏳ Waiting for transaction confirmation...</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (step === 3) {
    return (
      <div className="min-h-screen py-8 px-4 sm:px-6 lg:px-8 flex items-center justify-center">
        <Card className="w-full max-w-2xl glass-effect border-slate-700">
          <CardHeader className="text-center">
            <div className="w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 className="w-12 h-12 text-green-400" />
            </div>
            <CardTitle className="text-3xl text-white">Registration Successful!</CardTitle>
            <CardDescription className="text-slate-400 text-lg mt-2">
              Your contractor account has been created on the blockchain
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Blockchain ID Card */}
            <div className="p-6 rounded-lg bg-gradient-to-r from-blue-500/10 to-purple-500/10 border border-blue-500/30">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center space-x-2">
                  <Shield className="w-5 h-5 text-blue-400" />
                  <span className="text-sm font-semibold text-blue-300">Your Blockchain ID</span>
                </div>
                <Badge className="bg-green-500/20 text-green-400">Active</Badge>
              </div>
              <div className="flex items-center justify-between p-4 bg-slate-900/50 rounded-lg">
                <span className="text-xl font-mono text-white">{blockchainId}</span>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => copyToClipboard(blockchainId)}
                  className="text-blue-400 hover:text-blue-300"
                >
                  <Copy className="w-4 h-4" />
                </Button>
              </div>
              <p className="text-xs text-slate-400 mt-3">
                ⚠️ Save this ID! You'll use it throughout the tendering process
              </p>
            </div>

            {/* Wallet Address */}
            <div className="p-4 rounded-lg bg-slate-800/50 border border-slate-700">
              <div className="flex items-center space-x-2 mb-2">
                <Wallet className="w-4 h-4 text-purple-400" />
                <span className="text-sm text-slate-300">Connected Wallet</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-mono text-slate-400">
                  {walletAddress?.slice(0, 10)}...{walletAddress?.slice(-8)}
                </span>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => copyToClipboard(walletAddress)}
                  className="text-purple-400 hover:text-purple-300"
                >
                  <Copy className="w-3 h-3" />
                </Button>
              </div>
            </div>

            {/* Important Information */}
            <div className="p-4 rounded-lg bg-yellow-500/10 border border-yellow-500/30">
              <h4 className="text-sm font-semibold text-yellow-300 mb-2">Important Information:</h4>
              <ul className="space-y-1 text-xs text-slate-400">
                <li>✓ Your blockchain ID is permanently recorded on the blockchain</li>
                <li>✓ Use this ID when submitting tenders and milestones</li>
                <li>✓ Your identity remains anonymous to supervisors during tender review</li>
                <li>✓ Payments will be sent directly to your connected wallet</li>
                <li>✓ Login with username: <span className="text-white font-mono">{formData.username}</span></li>
              </ul>
            </div>

            {/* Login Credentials */}
            <div className="p-4 rounded-lg bg-blue-500/10 border border-blue-500/30">
              <h4 className="text-sm font-semibold text-blue-300 mb-3">Your Login Credentials</h4>
              <div className="space-y-2">
                <div>
                  <span className="text-xs text-slate-400">Username:</span>
                  <p className="text-white font-mono">{formData.username}</p>
                </div>
                <div>
                  <span className="text-xs text-slate-400">Password:</span>
                  <p className="text-white">••••••••</p>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-3">
              <Button
                onClick={() => navigate('/login')}
                className="flex-1 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700"
              >
                Go to Login
              </Button>
              <Button
                onClick={() => window.print()}
                variant="outline"
                className="flex-1 border-slate-700 hover:bg-slate-800"
              >
                Print Details
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto space-y-6 animate-fade-in">
        <div className="text-center space-y-2">
          <h1 className="text-4xl font-bold text-white" style={{fontFamily: 'Space Grotesk'}}>
            Contractor Registration
          </h1>
          <p className="text-slate-400">
            Register and get your unique blockchain identity
          </p>
        </div>

        <Card className="glass-effect border-slate-700">
          <CardHeader>
            <CardTitle className="text-2xl text-white flex items-center">
              <UserPlus className="w-6 h-6 mr-2 text-blue-400" />
              Create Contractor Account
            </CardTitle>
            <CardDescription className="text-slate-400">
              Fill in your details to generate your blockchain-based contractor ID
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Company Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-white border-b border-slate-700 pb-2">
                  Company Information
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="companyName" className="text-slate-300">
                      Company Name *
                    </Label>
                    <Input
                      id="companyName"
                      name="companyName"
                      value={formData.companyName}
                      onChange={handleChange}
                      placeholder="ABC Construction Pvt. Ltd."
                      className="bg-slate-800/50 border-slate-700 text-white"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="registrationNumber" className="text-slate-300">
                      Registration Number
                    </Label>
                    <Input
                      id="registrationNumber"
                      name="registrationNumber"
                      value={formData.registrationNumber}
                      onChange={handleChange}
                      placeholder="REG123456"
                      className="bg-slate-800/50 border-slate-700 text-white"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="contactPerson" className="text-slate-300">
                      Contact Person *
                    </Label>
                    <Input
                      id="contactPerson"
                      name="contactPerson"
                      value={formData.contactPerson}
                      onChange={handleChange}
                      placeholder="John Doe"
                      className="bg-slate-800/50 border-slate-700 text-white"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-slate-300">
                      Email *
                    </Label>
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      value={formData.email}
                      onChange={handleChange}
                      placeholder="contact@company.com"
                      className="bg-slate-800/50 border-slate-700 text-white"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="phone" className="text-slate-300">
                      Phone Number *
                    </Label>
                    <Input
                      id="phone"
                      name="phone"
                      value={formData.phone}
                      onChange={handleChange}
                      placeholder="9876543210"
                      maxLength="10"
                      className="bg-slate-800/50 border-slate-700 text-white"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="experience" className="text-slate-300">
                      Years of Experience
                    </Label>
                    <Input
                      id="experience"
                      name="experience"
                      type="number"
                      min="0"
                      value={formData.experience}
                      onChange={handleChange}
                      placeholder="5"
                      className="bg-slate-800/50 border-slate-700 text-white"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="specialization" className="text-slate-300">
                    Specialization
                  </Label>
                  <Input
                    id="specialization"
                    name="specialization"
                    value={formData.specialization}
                    onChange={handleChange}
                    placeholder="Road Construction, Building, etc."
                    className="bg-slate-800/50 border-slate-700 text-white"
                  />
                </div>
              </div>

              {/* Address */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-white border-b border-slate-700 pb-2">
                  Address
                </h3>
                
                <div className="space-y-2">
                  <Label htmlFor="address" className="text-slate-300">
                    Street Address
                  </Label>
                  <Input
                    id="address"
                    name="address"
                    value={formData.address}
                    onChange={handleChange}
                    placeholder="123 Main Street"
                    className="bg-slate-800/50 border-slate-700 text-white"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="city" className="text-slate-300">
                      City
                    </Label>
                    <Input
                      id="city"
                      name="city"
                      value={formData.city}
                      onChange={handleChange}
                      placeholder="Mumbai"
                      className="bg-slate-800/50 border-slate-700 text-white"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="state" className="text-slate-300">
                      State
                    </Label>
                    <Input
                      id="state"
                      name="state"
                      value={formData.state}
                      onChange={handleChange}
                      placeholder="Maharashtra"
                      className="bg-slate-800/50 border-slate-700 text-white"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="pincode" className="text-slate-300">
                      Pincode
                    </Label>
                    <Input
                      id="pincode"
                      name="pincode"
                      value={formData.pincode}
                      onChange={handleChange}
                      placeholder="400001"
                      maxLength="6"
                      className="bg-slate-800/50 border-slate-700 text-white"
                    />
                  </div>
                </div>
              </div>

              {/* Login Credentials */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-white border-b border-slate-700 pb-2">
                  Login Credentials
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="username" className="text-slate-300">
                      Username *
                    </Label>
                    <Input
                      id="username"
                      name="username"
                      value={formData.username}
                      onChange={handleChange}
                      placeholder="contractor123"
                      className="bg-slate-800/50 border-slate-700 text-white"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="password" className="text-slate-300">
                      Password *
                    </Label>
                    <div className="relative">
                      <Input
                        id="password"
                        name="password"
                        type={showPassword ? 'text' : 'password'}
                        value={formData.password}
                        onChange={handleChange}
                        placeholder="••••••••"
                        className="bg-slate-800/50 border-slate-700 text-white pr-10"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-white"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="confirmPassword" className="text-slate-300">
                      Confirm Password *
                    </Label>
                    <Input
                      id="confirmPassword"
                      name="confirmPassword"
                      type="password"
                      value={formData.confirmPassword}
                      onChange={handleChange}
                      placeholder="••••••••"
                      className="bg-slate-800/50 border-slate-700 text-white"
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Blockchain Notice */}
              <div className="p-4 rounded-lg bg-blue-500/10 border border-blue-500/30">
                <div className="flex items-start space-x-3">
                  <Shield className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
                  <div className="text-sm">
                    <p className="text-blue-300 font-semibold mb-1">Blockchain Registration</p>
                    <p className="text-slate-400">
                      After submitting, MetaMask will open to generate your unique blockchain ID. 
                      This ID will be permanently recorded on the blockchain and used throughout your tendering process.
                      Make sure you have test MATIC in your wallet for the registration transaction.
                    </p>
                  </div>
                </div>
              </div>

              {/* Submit Button */}
              <div className="flex space-x-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate('/login')}
                  className="flex-1 border-slate-700 hover:bg-slate-800"
                  disabled={loading}
                >
                  Back to Login
                </Button>
                <Button
                  type="submit"
                  className="flex-1 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700"
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Generating ID...
                    </>
                  ) : (
                    <>
                      <Shield className="w-4 h-4 mr-2" />
                      Register & Generate Blockchain ID
                    </>
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ContractorSignup;
