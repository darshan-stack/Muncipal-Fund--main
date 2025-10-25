import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import axios from 'axios';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Progress } from './ui/progress';
import { Plus, TrendingUp, DollarSign, FolderOpen, CheckCircle2, ExternalLink, Filter } from 'lucide-react';
import { toast } from 'sonner';
import TransactionVerificationModal from './TransactionVerificationModal';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const CATEGORIES = [
  'All Categories',
  'Infrastructure',
  'Education',
  'Healthcare',
  'Environment',
  'Transportation',
  'Public Safety',
  'Community Services',
  'Other'
];

const Dashboard = ({ account }) => {
  const location = useLocation();
  const [projects, setProjects] = useState([]);
  const [filteredProjects, setFilteredProjects] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('All Categories');
  const [searchQuery, setSearchQuery] = useState('');
  const [verificationModal, setVerificationModal] = useState({
    isOpen: false,
    txHash: '',
    type: '',
    details: {}
  });

  useEffect(() => {   
    fetchData();
  }, []);

  // Handle search from URL params
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const search = params.get('search');
    if (search) {
      setSearchQuery(search);
    }
  }, [location.search]);

  // Filter projects when category or search changes
  useEffect(() => {
    let filtered = [...projects];

    // Filter by category
    if (selectedCategory !== 'All Categories') {
      filtered = filtered.filter(p => p.category === selectedCategory);
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(p => 
        p.name?.toLowerCase().includes(query) ||
        p.description?.toLowerCase().includes(query) ||
        p.category?.toLowerCase().includes(query) ||
        p.location?.toLowerCase().includes(query) ||
        p.city?.toLowerCase().includes(query) ||
        p.state?.toLowerCase().includes(query)
      );
    }

    setFilteredProjects(filtered);
  }, [projects, selectedCategory, searchQuery]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [projectsRes, statsRes] = await Promise.all([
        axios.get(`${API}/projects`),
        axios.get(`${API}/stats`)
      ]);
      // Extract projects array from response
      setProjects(projectsRes.data.projects || projectsRes.data || []);
      setStats(statsRes.data);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const getProgressPercentage = (spent, budget) => {
    if (!budget) return 0;
    return Math.min((spent / budget) * 100, 100);
  };

  const handleVerifyTransaction = (txHash, type, details) => {
    setVerificationModal({
      isOpen: true,
      txHash,
      type: type || 'project_create',
      details: details || {}
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse text-slate-400">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-8 animate-fade-in">
        {/* Hero Section */}
        <div className="text-center space-y-4">
          <h1 className="text-4xl sm:text-5xl font-bold text-white" style={{fontFamily: 'Space Grotesk'}}>
            Municipal Fund Transparency
          </h1>
          <p className="text-lg text-slate-400 max-w-2xl mx-auto">
            Track government project funding and progress on the blockchain in real-time
          </p>
          {account && (
            <Link to="/create">
              <Button 
                className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white mt-4"
                data-testid="create-project-btn"
              >
                <Plus className="w-5 h-5 mr-2" />
                Create New Project
              </Button>
            </Link>
          )}
        </div>

        {/* Fund Flow Overview */}
        {stats && (
          <Card className="glass-effect border-slate-700 mb-6">
            <CardHeader>
              <CardTitle className="text-2xl text-white" style={{fontFamily: 'Space Grotesk'}}>
                Municipal Fund Flow
              </CardTitle>
              <p className="text-slate-400 text-sm">Real-time tracking of budget allocation and spending</p>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                    <p className="text-sm text-slate-400">Total Budget</p>
                  </div>
                  <p className="text-3xl font-bold text-white">{formatCurrency(stats.total_budget)}</p>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 rounded-full bg-green-500"></div>
                    <p className="text-sm text-slate-400">Allocated</p>
                  </div>
                  <p className="text-3xl font-bold text-green-400">{formatCurrency(stats.total_allocated)}</p>
                  <p className="text-xs text-slate-500">{stats.allocation_rate?.toFixed(1)}% of budget</p>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 rounded-full bg-purple-500"></div>
                    <p className="text-sm text-slate-400">Spent</p>
                  </div>
                  <p className="text-3xl font-bold text-purple-400">{formatCurrency(stats.total_spent)}</p>
                  <p className="text-xs text-slate-500">{stats.spending_rate?.toFixed(1)}% of allocated</p>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                    <p className="text-sm text-slate-400">Remaining</p>
                  </div>
                  <p className="text-3xl font-bold text-yellow-400">{formatCurrency(stats.allocated_unspent || 0)}</p>
                  <p className="text-xs text-slate-500">Available to spend</p>
                </div>
              </div>

              {/* Visual Fund Flow */}
              <div className="space-y-3">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-400">Budget Allocation Progress</span>
                    <span className="text-white font-semibold">{stats.allocation_rate?.toFixed(1)}%</span>
                  </div>
                  <div className="h-4 bg-slate-800 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-gradient-to-r from-green-500 to-green-600 transition-all duration-500"
                      style={{width: `${Math.min(stats.allocation_rate || 0, 100)}%`}}
                    ></div>
                  </div>
                  <div className="flex justify-between text-xs text-slate-500">
                    <span>Allocated: {formatCurrency(stats.total_allocated)}</span>
                    <span>Unallocated: {formatCurrency(stats.unallocated_funds || 0)}</span>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-400">Spending Progress</span>
                    <span className="text-white font-semibold">{stats.budget_utilization?.toFixed(1)}%</span>
                  </div>
                  <div className="h-4 bg-slate-800 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-gradient-to-r from-purple-500 to-purple-600 transition-all duration-500"
                      style={{width: `${Math.min(stats.budget_utilization || 0, 100)}%`}}
                    ></div>
                  </div>
                  <div className="flex justify-between text-xs text-slate-500">
                    <span>Spent: {formatCurrency(stats.total_spent)}</span>
                    <span>Budget: {formatCurrency(stats.total_budget)}</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Stats Grid */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card className="glass-effect border-slate-700 hover-glow" data-testid="stat-total-projects">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-slate-400">Total Projects</CardTitle>
                <FolderOpen className="w-5 h-5 text-blue-400" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-white">{stats.total_projects}</div>
                <p className="text-xs text-slate-500 mt-1">{stats.active_projects} active</p>
              </CardContent>
            </Card>

            <Card className="glass-effect border-slate-700 hover-glow" data-testid="stat-total-budget">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-slate-400">Allocated Funds</CardTitle>
                <DollarSign className="w-5 h-5 text-green-400" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-white">{formatCurrency(stats.total_allocated)}</div>
                <p className="text-xs text-slate-500 mt-1">of {formatCurrency(stats.total_budget)} budget</p>
              </CardContent>
            </Card>

            <Card className="glass-effect border-slate-700 hover-glow" data-testid="stat-total-spent">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-slate-400">Funds Spent</CardTitle>
                <TrendingUp className="w-5 h-5 text-purple-400" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-white">{formatCurrency(stats.total_spent)}</div>
                <p className="text-xs text-slate-500 mt-1">{stats.budget_utilization?.toFixed(1)}% of budget used</p>
              </CardContent>
            </Card>

            <Card className="glass-effect border-slate-700 hover-glow" data-testid="stat-completed-milestones">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-slate-400">Milestones</CardTitle>
                <CheckCircle2 className="w-5 h-5 text-emerald-400" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-white">{stats.completed_milestones}</div>
                <p className="text-xs text-slate-500 mt-1">of {stats.total_milestones} completed</p>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Category Breakdown */}
        {stats && stats.budget_by_project_category && Object.keys(stats.budget_by_project_category).length > 0 && (
          <Card className="glass-effect border-slate-700">
            <CardHeader>
              <CardTitle className="text-xl text-white">Budget by Category</CardTitle>
              <p className="text-sm text-slate-400">Distribution of funds across project categories</p>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {Object.entries(stats.budget_by_project_category).map(([category, budget]) => {
                  const spent = stats.spent_by_project_category?.[category] || 0;
                  const percentage = budget > 0 ? (spent / budget) * 100 : 0;
                  return (
                    <div key={category} className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium text-slate-300">{category}</span>
                        <div className="text-right">
                          <span className="text-sm text-white font-semibold">{formatCurrency(spent)}</span>
                          <span className="text-xs text-slate-500"> / {formatCurrency(budget)}</span>
                        </div>
                      </div>
                      <Progress value={percentage} className="h-2" />
                      <div className="flex justify-between text-xs text-slate-500">
                        <span>{percentage.toFixed(1)}% spent</span>
                        <span>Remaining: {formatCurrency(budget - spent)}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Projects List */}
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <h2 className="text-2xl font-bold text-white" style={{fontFamily: 'Space Grotesk'}}>All Projects</h2>
            
            {/* Category Filter */}
            <div className="flex items-center space-x-3">
              <Filter className="w-5 h-5 text-slate-400" />
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="px-4 py-2 bg-slate-800/50 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                data-testid="category-filter"
              >
                {CATEGORIES.map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Active Filters Display */}
          {(selectedCategory !== 'All Categories' || searchQuery) && (
            <div className="flex items-center space-x-2">
              <span className="text-sm text-slate-400">Active filters:</span>
              {selectedCategory !== 'All Categories' && (
                <span className="inline-flex items-center px-3 py-1 rounded-full bg-blue-500/20 text-blue-400 text-sm">
                  {selectedCategory}
                  <button
                    onClick={() => setSelectedCategory('All Categories')}
                    className="ml-2 hover:text-blue-300"
                  >
                    ×
                  </button>
                </span>
              )}
              {searchQuery && (
                <span className="inline-flex items-center px-3 py-1 rounded-full bg-purple-500/20 text-purple-400 text-sm">
                  Search: {searchQuery}
                  <button
                    onClick={() => setSearchQuery('')}
                    className="ml-2 hover:text-purple-300"
                  >
                    ×
                  </button>
                </span>
              )}
              <button
                onClick={() => {
                  setSelectedCategory('All Categories');
                  setSearchQuery('');
                }}
                className="text-sm text-slate-400 hover:text-white"
              >
                Clear all
              </button>
            </div>
          )}

          {filteredProjects.length === 0 ? (
            <Card className="glass-effect border-slate-700">
              <CardContent className="py-12 text-center">
                <FolderOpen className="w-16 h-16 text-slate-600 mx-auto mb-4" />
                <p className="text-slate-400 text-lg">
                  {projects.length === 0 
                    ? 'No projects yet'
                    : `No projects found matching your filters`}
                </p>
                {account && projects.length === 0 && (
                  <Link to="/create">
                    <Button className="mt-4 bg-blue-500 hover:bg-blue-600" data-testid="create-first-project-btn">
                      Create First Project
                    </Button>
                  </Link>
                )}
                {filteredProjects.length === 0 && projects.length > 0 && (
                  <Button
                    onClick={() => {
                      setSelectedCategory('All Categories');
                      setSearchQuery('');
                    }}
                    className="mt-4 bg-blue-500 hover:bg-blue-600"
                  >
                    Clear Filters
                  </Button>
                )}
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {filteredProjects.map((project, index) => {
                // Safely handle project data with defaults
                const spentFunds = project.spent_funds || project.spentFunds || 0;
                const allocatedFunds = project.allocated_funds || project.allocatedFunds || 0;
                const budget = project.budget || 0;
                const progress = getProgressPercentage(spentFunds, budget);
                return (
                  <Card 
                    key={project.id} 
                    className="glass-effect border-slate-700 hover-glow animate-slide-in"
                    style={{ animationDelay: `${index * 0.1}s` }}
                    data-testid={`project-card-${index}`}
                  >
                    <CardHeader>
                      <div className="flex justify-between items-start">
                        <div className="space-y-1">
                          <CardTitle className="text-xl text-white">{project.name || 'Unnamed Project'}</CardTitle>
                          <p className="text-sm text-slate-400">{project.description || 'No description'}</p>
                          <span className="inline-block mt-2 px-2 py-1 text-xs rounded-full bg-purple-500/20 text-purple-400 border border-purple-500/30">
                            {project.category || 'Uncategorized'}
                          </span>
                        </div>
                        <span className={(project.status === 'Active' || project.status === 'active') ? 'status-active' : 'status-completed'}>
                          {project.status || 'Unknown'}
                        </span>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-slate-400">Spending Progress</span>
                          <span className="text-white font-semibold">{progress.toFixed(1)}%</span>
                        </div>
                        <Progress value={progress} className="h-2" />
                        <div className="flex justify-between text-sm">
                          <div className="space-y-1">
                            <div className="text-slate-500">Allocated: {formatCurrency(allocatedFunds)}</div>
                            <div className="text-slate-500">Spent: {formatCurrency(spentFunds)}</div>
                          </div>
                          <div className="text-right space-y-1">
                            <div className="text-slate-500">Budget: {formatCurrency(budget)}</div>
                            <div className="text-yellow-400 font-medium">Available: {formatCurrency(allocatedFunds - spentFunds)}</div>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center justify-between pt-4 border-t border-slate-700">
                        <div className="text-sm text-slate-400">
                          <span className="font-medium">Manager:</span>
                          <br />
                          <span className="text-xs font-mono">
                            {project.manager_address ? 
                              `${project.manager_address.slice(0, 8)}...${project.manager_address.slice(-6)}` : 
                              'N/A'}
                          </span>
                        </div>
                        <div className="flex space-x-2">
                          {project.tx_hash && (
                            <button
                              onClick={() => handleVerifyTransaction(
                                project.tx_hash,
                                'project_create',
                                { name: project.name, budget: project.budget, category: project.category }
                              )}
                              className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 transition-colors"
                              data-testid={`verify-tx-${index}`}
                              title="View Transaction Details"
                            >
                              <ExternalLink className="w-4 h-4 text-blue-400" />
                            </button>
                          )}
                          <Link to={`/project/${project.id}`}>
                            <Button size="sm" className="bg-blue-500 hover:bg-blue-600" data-testid={`view-details-${index}`}>
                              View Details
                            </Button>
                          </Link>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Transaction Verification Modal */}
      <TransactionVerificationModal
        isOpen={verificationModal.isOpen}
        onClose={() => setVerificationModal({ isOpen: false, txHash: '', type: '', details: {} })}
        txHash={verificationModal.txHash}
        type={verificationModal.type}
        details={verificationModal.details}
      />
    </div>
  );
};

export default Dashboard;