import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Shield, UserCircle, Eye, Loader2, UserPlus } from 'lucide-react';
import { toast } from 'sonner';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const Login = ({ onLogin }) => {
  const navigate = useNavigate();
  const [selectedRole, setSelectedRole] = useState(null);
  const [credentials, setCredentials] = useState({ username: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const roles = [
    {
      id: 'admin',
      title: 'Admin',
      description: 'Create and manage projects, approve funding',
      icon: Shield,
      color: 'from-red-500 to-red-600',
      defaultCreds: { username: 'admin', password: 'admin123' }
    },
    {
      id: 'supervisor',
      title: 'Supervisor',
      description: 'Verify milestones and approve tenders',
      icon: UserCircle,
      color: 'from-blue-500 to-blue-600',
      defaultCreds: { username: 'supervisor', password: 'super123' }
    },
    {
      id: 'contractor',
      title: 'Contractor',
      description: 'Submit tenders and complete milestones',
      icon: Shield,
      color: 'from-purple-500 to-purple-600',
      defaultCreds: null, // Contractors must register
      requiresSignup: true
    },
    {
      id: 'citizen',
      title: 'Citizen',
      description: 'View projects and track fund usage',
      icon: Eye,
      color: 'from-green-500 to-green-600',
      defaultCreds: { username: 'citizen', password: 'citizen123' }
    }
  ];

  const handleRoleSelect = (role) => {
    setSelectedRole(role);
    // Auto-fill credentials for demo (if available)
    if (role.defaultCreds) {
      setCredentials(role.defaultCreds);
    } else {
      setCredentials({ username: '', password: '' });
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    
    if (!credentials.username || !credentials.password) {
      toast.error('Please enter username and password');
      return;
    }

    try {
      setLoading(true);
      const response = await axios.post(`${API}/login`, {
        username: credentials.username,
        password: credentials.password
      });

      if (response.data.success) {
        toast.success(`Welcome ${response.data.user.username}!`);
        
        // Store user data in localStorage
        localStorage.setItem('user', JSON.stringify(response.data.user));
        
        // Call parent callback with user data
        if (onLogin) {
          onLogin(response.data.user);
        }
        
        // Navigate to dashboard
        navigate('/');
      }
    } catch (error) {
      console.error('Login error:', error);
      toast.error(error.response?.data?.message || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  const quickLogin = async (role) => {
    // Don't allow quick login for roles without default credentials
    if (!role.defaultCreds) {
      toast.error('This role requires registration. Please sign up first.');
      return;
    }
    
    setCredentials(role.defaultCreds);
    setSelectedRole(role);
    
    try {
      setLoading(true);
      const response = await axios.post(`${API}/login`, role.defaultCreds);

      if (response.data.success) {
        toast.success(`Logged in as ${role.title}!`);
        localStorage.setItem('user', JSON.stringify(response.data.user));
        
        if (onLogin) {
          onLogin(response.data.user);
        }
        
        navigate('/');
      }
    } catch (error) {
      console.error('Login error:', error);
      toast.error('Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl w-full space-y-8 animate-fade-in">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-4xl sm:text-5xl font-bold text-white mb-4" style={{fontFamily: 'Space Grotesk'}}>
            Municipal Fund Tracker
          </h1>
          <p className="text-lg text-slate-400">
            Blockchain-powered transparency for government projects
          </p>
          <div className="mt-4 inline-block px-4 py-2 rounded-full bg-blue-500/10 border border-blue-500/30">
            <span className="text-sm text-blue-400">🔒 Secure Login • Powered by Blockchain</span>
          </div>
        </div>

        {!selectedRole ? (
          /* Role Selection Screen */
          <div className="space-y-6">
            <h2 className="text-2xl font-semibold text-white text-center">Select Your Role</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {roles.map((role) => {
                const Icon = role.icon;
                return (
                  <Card 
                    key={role.id}
                    className="glass-effect border-slate-700 hover-glow cursor-pointer transition-all hover:scale-105"
                    onClick={() => !role.requiresSignup && handleRoleSelect(role)}
                    data-testid={`role-${role.id}`}
                  >
                    <CardHeader className="text-center">
                      <div className={`w-20 h-20 mx-auto mb-4 rounded-full bg-gradient-to-br ${role.color} flex items-center justify-center`}>
                        <Icon className="w-10 h-10 text-white" />
                      </div>
                      <CardTitle className="text-2xl text-white">{role.title}</CardTitle>
                      <CardDescription className="text-slate-400 mt-2">
                        {role.description}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      {role.requiresSignup ? (
                        <>
                          <Link to="/contractor/signup">
                            <Button 
                              className={`w-full bg-gradient-to-r ${role.color} hover:opacity-90`}
                            >
                              <UserPlus className="w-4 h-4 mr-2" />
                              Register as Contractor
                            </Button>
                          </Link>
                          <Button 
                            variant="outline"
                            className="w-full border-slate-700 text-slate-300 hover:bg-slate-800"
                            onClick={() => handleRoleSelect(role)}
                          >
                            Already Registered? Login
                          </Button>
                        </>
                      ) : (
                        <>
                          <Button 
                            className={`w-full bg-gradient-to-r ${role.color} hover:opacity-90`}
                            onClick={(e) => {
                              e.stopPropagation();
                              quickLogin(role);
                            }}
                            disabled={loading}
                          >
                            {loading ? (
                              <>
                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                Logging in...
                              </>
                            ) : (
                              `Login as ${role.title}`
                            )}
                          </Button>
                          <p className="text-xs text-slate-500 text-center">
                            Demo credentials auto-filled
                          </p>
                        </>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
            
            {/* Demo Info */}
            <Card className="glass-effect border-slate-700 bg-slate-800/30">
              <CardContent className="py-6">
                <h3 className="text-lg font-semibold text-white mb-4 text-center">Demo Credentials</h3>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm">
                  <div className="text-center space-y-1">
                    <p className="text-red-400 font-semibold">Admin</p>
                    <p className="text-slate-400">admin / admin123</p>
                  </div>
                  <div className="text-center space-y-1">
                    <p className="text-blue-400 font-semibold">Supervisor</p>
                    <p className="text-slate-400">supervisor / super123</p>
                  </div>
                  <div className="text-center space-y-1">
                    <p className="text-purple-400 font-semibold">Contractor</p>
                    <p className="text-slate-400">Register for blockchain ID</p>
                  </div>
                  <div className="text-center space-y-1">
                    <p className="text-green-400 font-semibold">Citizen</p>
                    <p className="text-slate-400">citizen / citizen123</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        ) : (
          /* Login Form Screen */
          <div className="max-w-md mx-auto">
            <Card className="glass-effect border-slate-700">
              <CardHeader className="text-center">
                <div className={`w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-br ${selectedRole.color} flex items-center justify-center`}>
                  {React.createElement(selectedRole.icon, { className: "w-8 h-8 text-white" })}
                </div>
                <CardTitle className="text-2xl text-white">Login as {selectedRole.title}</CardTitle>
                <CardDescription className="text-slate-400">
                  {selectedRole.description}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleLogin} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="username" className="text-slate-300">Username</Label>
                    <Input
                      id="username"
                      type="text"
                      value={credentials.username}
                      onChange={(e) => setCredentials({ ...credentials, username: e.target.value })}
                      className="bg-slate-800 border-slate-700 text-white"
                      placeholder="Enter username"
                      data-testid="username-input"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="password" className="text-slate-300">Password</Label>
                    <div className="relative">
                      <Input
                        id="password"
                        type={showPassword ? 'text' : 'password'}
                        value={credentials.password}
                        onChange={(e) => setCredentials({ ...credentials, password: e.target.value })}
                        className="bg-slate-800 border-slate-700 text-white pr-10"
                        placeholder="Enter password"
                        data-testid="password-input"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <Button 
                      type="submit" 
                      className={`w-full bg-gradient-to-r ${selectedRole.color}`}
                      disabled={loading}
                      data-testid="login-submit-btn"
                    >
                      {loading ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Logging in...
                        </>
                      ) : (
                        'Login'
                      )}
                    </Button>
                    
                    <Button 
                      type="button"
                      variant="outline"
                      className="w-full border-slate-700 text-slate-300 hover:bg-slate-800"
                      onClick={() => {
                        setSelectedRole(null);
                        setCredentials({ username: '', password: '' });
                      }}
                      data-testid="back-to-roles-btn"
                    >
                      Back to Role Selection
                    </Button>
                  </div>
                </form>

                <div className="mt-6 p-3 rounded-lg bg-slate-800/50 border border-slate-700">
                  <p className="text-xs text-slate-400 text-center">
                    <span className="font-semibold text-slate-300">Demo Mode:</span> Credentials are pre-filled for testing
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Footer */}
        <div className="text-center text-sm text-slate-500">
          <p>🔐 Secure authentication powered by blockchain technology</p>
          <p className="mt-2">Smart India Hackathon 2025 • Municipal Fund Transparency System</p>
        </div>
      </div>
    </div>
  );
};

export default Login;
