import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Wallet, LogOut, Activity, User, Search } from 'lucide-react';

const Header = ({ account, chainId, user, onConnect, onDisconnect, onLogout, isConnecting }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearch, setShowSearch] = useState(false);

  const isActive = (path) => location.pathname === path;

  const formatAddress = (address) => {
    if (!address) return '';
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  const getNetworkName = (chainId) => {
    if (chainId === 80001) return 'Mumbai';
    if (chainId === 137) return 'Polygon';
    return 'Unknown';
  };

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/?search=${encodeURIComponent(searchQuery.trim())}`);
      setShowSearch(false);
      setSearchQuery('');
    }
  };

  return (
    <header className="glass-effect sticky top-0 z-50 border-b border-slate-700/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center space-x-8">
            <Link to="/" className="flex items-center space-x-2 group">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center transform group-hover:scale-105 transition-transform">
                <Activity className="w-6 h-6 text-white" />
              </div>
              <span className="text-xl font-bold text-white" style={{fontFamily: 'Space Grotesk'}}>CivicLedger</span>
            </Link>

            <nav className="hidden md:flex space-x-1">
              <Link
                to="/"
                className={`px-4 py-2 rounded-lg transition-colors ${
                  isActive('/') 
                    ? 'bg-blue-500/20 text-blue-400' 
                    : 'text-slate-300 hover:text-white hover:bg-slate-800/50'
                }`}
                data-testid="nav-dashboard"
              >
                Dashboard
              </Link>
              {user?.role === 'admin' && (
                <Link
                  to="/create"
                  className={`px-4 py-2 rounded-lg transition-colors ${
                    isActive('/create') 
                      ? 'bg-blue-500/20 text-blue-400' 
                      : 'text-slate-300 hover:text-white hover:bg-slate-800/50'
                  }`}
                  data-testid="nav-create-project"
                >
                  Create Project
                </Link>
              )}
              {user?.role === 'supervisor' && (
                <>
                  <Link
                    to="/supervisor/approvals"
                    className={`px-4 py-2 rounded-lg transition-colors ${
                      isActive('/supervisor/approvals') 
                        ? 'bg-blue-500/20 text-blue-400' 
                        : 'text-slate-300 hover:text-white hover:bg-slate-800/50'
                    }`}
                    data-testid="nav-supervisor-approvals"
                  >
                    Tender Approvals
                  </Link>
                  <Link
                    to="/supervisor/verifications"
                    className={`px-4 py-2 rounded-lg transition-colors ${
                      isActive('/supervisor/verifications') 
                        ? 'bg-purple-500/20 text-purple-400' 
                        : 'text-slate-300 hover:text-white hover:bg-slate-800/50'
                    }`}
                    data-testid="nav-supervisor-verifications"
                  >
                    Milestone Verifications
                  </Link>
                </>
              )}
              <Link
                to="/transactions"
                className={`px-4 py-2 rounded-lg transition-colors ${
                  isActive('/transactions') 
                    ? 'bg-blue-500/20 text-blue-400' 
                    : 'text-slate-300 hover:text-white hover:bg-slate-800/50'
                }`}
                data-testid="nav-transactions"
              >
                Transactions
              </Link>
            </nav>
          </div>

          <div className="flex items-center space-x-4">
            {/* Search Bar */}
            {user && (
              <div className="hidden md:block">
                {showSearch ? (
                  <form onSubmit={handleSearch} className="flex items-center space-x-2">
                    <Input
                      type="text"
                      placeholder="Search projects..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-64 bg-slate-800/50 border-slate-700 text-white placeholder:text-slate-500"
                      autoFocus
                      data-testid="search-input"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setShowSearch(false);
                        setSearchQuery('');
                      }}
                      className="text-slate-400"
                    >
                      Cancel
                    </Button>
                  </form>
                ) : (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowSearch(true)}
                    className="text-slate-400 hover:text-white"
                    data-testid="search-btn"
                  >
                    <Search className="w-5 h-5" />
                  </Button>
                )}
              </div>
            )}

            {/* User Role Badge */}
            {user && (
              <div className="flex items-center px-3 py-1.5 rounded-lg bg-gradient-to-r from-blue-500/20 to-purple-500/20 border border-blue-500/30">
                <User className="w-4 h-4 mr-2 text-blue-400" />
                <span className="text-sm font-medium text-blue-300 capitalize">{user.role}</span>
              </div>
            )}

            {/* Wallet Section */}
            {account ? (
              <>
                {chainId && (
                  <div className="hidden sm:flex items-center px-3 py-1.5 rounded-lg bg-slate-800/50 border border-slate-700">
                    <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse mr-2"></div>
                    <span className="text-sm text-slate-300">{getNetworkName(chainId)}</span>
                  </div>
                )}
                <div className="flex items-center space-x-3 px-4 py-2 rounded-lg bg-slate-800/50 border border-slate-700">
                  <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                  <span className="text-sm font-medium text-slate-200" data-testid="wallet-address">{formatAddress(account)}</span>
                </div>
                <Button
                  onClick={onDisconnect}
                  variant="outline"
                  size="sm"
                  className="border-slate-700 hover:bg-slate-800 hover:border-slate-600"
                  data-testid="disconnect-wallet-btn"
                >
                  <LogOut className="w-4 h-4 mr-2" />
                  Disconnect
                </Button>
              </>
            ) : (
              <Button
                onClick={onConnect}
                disabled={isConnecting}
                className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white"
                data-testid="connect-wallet-btn"
              >
                <Wallet className="w-4 h-4 mr-2" />
                {isConnecting ? 'Connecting...' : 'Connect Wallet'}
              </Button>
            )}

            {/* Logout Button */}
            {user && (
              <Button
                onClick={onLogout}
                variant="outline"
                size="sm"
                className="border-red-700/50 text-red-400 hover:bg-red-900/20 hover:border-red-600"
                data-testid="logout-btn"
              >
                <LogOut className="w-4 h-4 mr-2" />
                Logout
              </Button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;