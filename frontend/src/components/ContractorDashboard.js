import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from './ui/dialog';
import { Badge } from './ui/badge';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Input } from './ui/input';
import { 
  FileText, 
  Image as ImageIcon, 
  MapPin, 
  CheckCircle2, 
  XCircle, 
  Clock,
  Upload,
  DollarSign,
  Briefcase,
  Shield,
  Copy,
  ExternalLink,
  Loader2,
  AlertCircle,
  TrendingUp
} from 'lucide-react';
import { toast } from 'sonner';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const ContractorDashboard = ({ user }) => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [availableTenders, setAvailableTenders] = useState([]);
  const [mySubmissions, setMySubmissions] = useState([]);
  const [activeProjects, setActiveProjects] = useState([]);
  const [completedProjects, setCompletedProjects] = useState([]);
  const [citizenSuggestions, setCitizenSuggestions] = useState([]);
  const [selectedProject, setSelectedProject] = useState(null);
  const [submitModalOpen, setSubmitModalOpen] = useState(false);
  const [milestoneModalOpen, setMilestoneModalOpen] = useState(false);
  const [tenderProposal, setTenderProposal] = useState('');
  const [milestoneProof, setMilestoneProof] = useState('');
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (user?.role !== 'contractor') {
      navigate('/');
      return;
    }
    fetchContractorData();
  }, [user, navigate]);

  const fetchContractorData = async () => {
    try {
      setLoading(true);
      // Fetch all contractor-related data
      const [tendersRes, submissionsRes, projectsRes, suggestionsRes] = await Promise.all([
        axios.get(`${API}/contractor/available-tenders`),
        axios.get(`${API}/contractor/my-submissions?contractor_id=${user.blockchain_id}`),
        axios.get(`${API}/contractor/my-projects?contractor_id=${user.blockchain_id}`),
        axios.get(`${API}/suggestions`).catch(() => ({ data: [] })) // Fallback if fails
      ]);

      setAvailableTenders(tendersRes.data.tenders || []);
      setMySubmissions(submissionsRes.data.submissions || []);
      
      const projects = projectsRes.data.projects || [];
      setActiveProjects(projects.filter(p => p.status === 'active' || p.status === 'in_progress'));
      setCompletedProjects(projects.filter(p => p.status === 'completed'));
      
      // Filter suggestions related to contractor's projects
      const allSuggestions = Array.isArray(suggestionsRes.data) ? suggestionsRes.data : [];
      const projectIds = projects.map(p => p.id);
      const relevantSuggestions = allSuggestions.filter(s => 
        projectIds.includes(s.project_id)
      );
      setCitizenSuggestions(relevantSuggestions);
    } catch (error) {
      console.error('Error fetching contractor data:', error);
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitTender = async (tender) => {
    setSelectedProject(tender);
    setSubmitModalOpen(true);
  };

  const submitTenderProposal = async () => {
    if (!tenderProposal.trim()) {
      toast.error('Please provide a proposal description');
      return;
    }

    try {
      setUploading(true);
      
      await axios.post(`${API}/contractor/submit-tender`, {
        project_id: selectedProject.id,
        contractor_id: user.blockchain_id,
        contractor_address: user.address,
        proposal: tenderProposal,
        submitted_at: new Date().toISOString()
      });

      toast.success('Tender submitted successfully!', {
        description: 'Your proposal is under review'
      });

      setSubmitModalOpen(false);
      setTenderProposal('');
      fetchContractorData(); // Refresh data
    } catch (error) {
      console.error('Error submitting tender:', error);
      toast.error('Failed to submit tender');
    } finally {
      setUploading(false);
    }
  };

  const handleSubmitMilestone = async (project) => {
    setSelectedProject(project);
    setMilestoneModalOpen(true);
  };

  const submitMilestoneProof = async () => {
    if (!milestoneProof.trim()) {
      toast.error('Please provide milestone completion proof');
      return;
    }

    try {
      setUploading(true);

      await axios.post(`${API}/contractor/submit-milestone`, {
        project_id: selectedProject.id,
        contractor_id: user.blockchain_id,
        milestone_number: selectedProject.current_milestone,
        proof_description: milestoneProof,
        submitted_at: new Date().toISOString()
      });

      toast.success('Milestone proof submitted!', {
        description: 'Awaiting supervisor approval'
      });

      setMilestoneModalOpen(false);
      setMilestoneProof('');
      fetchContractorData(); // Refresh data
    } catch (error) {
      console.error('Error submitting milestone:', error);
      toast.error('Failed to submit milestone proof');
    } finally {
      setUploading(false);
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard!');
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      pending: { color: 'bg-amber-500/20 text-amber-400 border-amber-500/30', label: 'Pending Review' },
      approved: { color: 'bg-green-500/20 text-green-400 border-green-500/30', label: 'Approved' },
      rejected: { color: 'bg-red-500/20 text-red-400 border-red-500/30', label: 'Rejected' },
      active: { color: 'bg-blue-500/20 text-blue-400 border-blue-500/30', label: 'Active' },
      completed: { color: 'bg-purple-500/20 text-purple-400 border-purple-500/30', label: 'Completed' }
    };

    const config = statusConfig[status] || statusConfig.pending;
    return (
      <Badge className={`${config.color} border px-3 py-1`}>
        {config.label}
      </Badge>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <Loader2 className="w-12 h-12 animate-spin text-purple-400 mx-auto" />
          <p className="text-slate-400">Loading contractor dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-6 animate-fade-in">
        {/* Header with Blockchain ID */}
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-bold text-white" style={{fontFamily: 'Space Grotesk'}}>
            Contractor Dashboard
          </h1>
          <p className="text-lg text-slate-400">
            Submit tenders, track milestones, and manage your projects
          </p>
          
          {/* Blockchain ID Card */}
          <Card className="glass-effect border-purple-500/30 max-w-2xl mx-auto">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="bg-purple-500/20 p-3 rounded-full">
                    <Shield className="w-8 h-8 text-purple-400" />
                  </div>
                  <div className="text-left">
                    <p className="text-sm text-slate-400">Your Blockchain ID</p>
                    <p className="text-2xl font-bold text-purple-400 font-mono">
                      {user.blockchain_id || 'CNTR-XXXXX'}
                    </p>
                  </div>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => copyToClipboard(user.blockchain_id)}
                  className="border-purple-500 text-purple-400 hover:bg-purple-500/20"
                >
                  <Copy className="w-4 h-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card className="glass-effect border-slate-700">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-400">Available Tenders</p>
                  <p className="text-3xl font-bold text-blue-400">{availableTenders.length}</p>
                </div>
                <Briefcase className="w-10 h-10 text-blue-400" />
              </div>
            </CardContent>
          </Card>
          
          <Card className="glass-effect border-slate-700">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-400">My Submissions</p>
                  <p className="text-3xl font-bold text-amber-400">{mySubmissions.length}</p>
                </div>
                <FileText className="w-10 h-10 text-amber-400" />
              </div>
            </CardContent>
          </Card>
          
          <Card className="glass-effect border-slate-700">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-400">Active Projects</p>
                  <p className="text-3xl font-bold text-green-400">{activeProjects.length}</p>
                </div>
                <TrendingUp className="w-10 h-10 text-green-400" />
              </div>
            </CardContent>
          </Card>
          
          <Card className="glass-effect border-slate-700">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-400">Completed</p>
                  <p className="text-3xl font-bold text-purple-400">{completedProjects.length}</p>
                </div>
                <CheckCircle2 className="w-10 h-10 text-purple-400" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Available Tenders */}
        <div className="space-y-4">
          <h2 className="text-2xl font-bold text-white flex items-center">
            <Briefcase className="w-6 h-6 mr-2 text-blue-400" />
            Available Tenders
          </h2>
          
          {availableTenders.length === 0 ? (
            <Card className="glass-effect border-slate-700">
              <CardContent className="py-12 text-center">
                <Briefcase className="w-16 h-16 text-slate-600 mx-auto mb-4" />
                <p className="text-slate-400 text-lg">No tenders available at the moment</p>
                <p className="text-slate-500 text-sm mt-2">Check back later for new opportunities</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 gap-6">
              {availableTenders.map((tender) => (
                <Card key={tender.id} className="glass-effect border-slate-700 hover-glow">
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div className="space-y-2 flex-1">
                        <CardTitle className="text-2xl text-white">{tender.title}</CardTitle>
                        <div className="flex items-center space-x-4 text-sm text-slate-400">
                          <span className="flex items-center">
                            <MapPin className="w-4 h-4 mr-1" />
                            {tender.location}
                          </span>
                          <Badge className="bg-purple-500/20 text-purple-400 border border-purple-500/30">
                            {tender.category}
                          </Badge>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-bold text-green-400">{formatCurrency(tender.budget)}</p>
                        <p className="text-xs text-slate-500 mt-1">Total Budget</p>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-slate-300 mb-4">{tender.description}</p>
                    <Button
                      onClick={() => handleSubmitTender(tender)}
                      className="w-full bg-blue-500 hover:bg-blue-600"
                    >
                      <Upload className="w-4 h-4 mr-2" />
                      Submit Tender Proposal
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* My Submissions */}
        {mySubmissions.length > 0 && (
          <div className="space-y-4">
            <h2 className="text-2xl font-bold text-white flex items-center">
              <FileText className="w-6 h-6 mr-2 text-amber-400" />
              My Tender Submissions
            </h2>
            
            <div className="grid grid-cols-1 gap-4">
              {mySubmissions.map((submission) => (
                <Card key={submission.id} className="glass-effect border-slate-700">
                  <CardContent className="pt-6">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-white">{submission.project_title}</h3>
                        <p className="text-sm text-slate-400 mt-1">{submission.proposal}</p>
                        <p className="text-xs text-slate-500 mt-2">
                          Submitted: {new Date(submission.submitted_at).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="flex items-center space-x-4">
                        <div className="text-right">
                          <p className="text-lg font-bold text-green-400">{formatCurrency(submission.budget)}</p>
                        </div>
                        {getStatusBadge(submission.status)}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Active Projects */}
        {activeProjects.length > 0 && (
          <div className="space-y-4">
            <h2 className="text-2xl font-bold text-white flex items-center">
              <TrendingUp className="w-6 h-6 mr-2 text-green-400" />
              Active Projects
            </h2>
            
            <div className="grid grid-cols-1 gap-6">
              {activeProjects.map((project) => (
                <Card key={project.id} className="glass-effect border-green-500/30 hover-glow">
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <CardTitle className="text-2xl text-white">{project.title}</CardTitle>
                        <div className="flex items-center space-x-3 mt-2">
                          <Badge className="bg-green-500/20 text-green-400 border border-green-500/30">
                            Milestone {project.current_milestone}/4
                          </Badge>
                          <span className="text-sm text-slate-400">{project.location}</span>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-bold text-green-400">{formatCurrency(project.budget)}</p>
                        <p className="text-xs text-slate-500 mt-1">Total Value</p>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-slate-300 mb-4">{project.description}</p>
                    
                    {/* Milestone Progress */}
                    <div className="space-y-2 mb-4">
                      <div className="flex justify-between text-sm">
                        <span className="text-slate-400">Progress</span>
                        <span className="text-white font-medium">{project.current_milestone * 25}%</span>
                      </div>
                      <div className="w-full bg-slate-800 rounded-full h-2">
                        <div 
                          className="bg-gradient-to-r from-green-500 to-blue-500 h-2 rounded-full transition-all duration-500"
                          style={{width: `${project.current_milestone * 25}%`}}
                        />
                      </div>
                    </div>

                    <Button
                      onClick={() => handleSubmitMilestone(project)}
                      className="w-full bg-green-500 hover:bg-green-600"
                    >
                      <Upload className="w-4 h-4 mr-2" />
                      Submit Milestone {project.current_milestone} Proof
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Citizen Suggestions & Feedback */}
        {citizenSuggestions.length > 0 && (
          <div className="space-y-4">
            <h2 className="text-2xl font-bold text-white flex items-center">
              <AlertCircle className="w-6 h-6 mr-2 text-yellow-400" />
              Citizen Suggestions & Feedback
              <Badge className="ml-3 bg-yellow-500/20 text-yellow-400 border border-yellow-500/30">
                {citizenSuggestions.length} New
              </Badge>
            </h2>
            
            <div className="grid grid-cols-1 gap-4">
              {citizenSuggestions.map((suggestion) => (
                <Card key={suggestion.id} className="glass-effect border-yellow-500/30 hover:border-yellow-500/50 transition-all">
                  <CardContent className="pt-6">
                    <div className="space-y-3">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-2">
                            <Badge className="bg-blue-500/20 text-blue-400 border border-blue-500/30">
                              {suggestion.project_name || 'Project Feedback'}
                            </Badge>
                            <Badge className="bg-yellow-500/20 text-yellow-400 border border-yellow-500/30">
                              {suggestion.category || 'general'}
                            </Badge>
                          </div>
                          <p className="text-slate-300 leading-relaxed">{suggestion.suggestion_text}</p>
                        </div>
                      </div>
                      
                      <div className="flex items-center justify-between pt-3 border-t border-slate-700">
                        <div className="flex items-center space-x-4 text-sm text-slate-400">
                          <span className="flex items-center">
                            <MapPin className="w-4 h-4 mr-1" />
                            {suggestion.citizen_location || 'Citizen'}
                          </span>
                          <span>
                            {new Date(suggestion.submitted_at).toLocaleDateString('en-IN', {
                              day: 'numeric',
                              month: 'short',
                              year: 'numeric'
                            })}
                          </span>
                        </div>
                        <div className="flex items-center space-x-2">
                          {suggestion.status === 'new' && (
                            <Badge className="bg-green-500/20 text-green-400 border border-green-500/30">
                              New
                            </Badge>
                          )}
                          <span className="text-sm font-medium text-slate-400">
                            From: {suggestion.citizen_name || 'Anonymous'}
                          </span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Completed Projects */}
        {completedProjects.length > 0 && (
          <div className="space-y-4">
            <h2 className="text-2xl font-bold text-white flex items-center">
              <CheckCircle2 className="w-6 h-6 mr-2 text-purple-400" />
              Completed Projects
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {completedProjects.map((project) => (
                <Card key={project.id} className="glass-effect border-purple-500/30">
                  <CardContent className="pt-6">
                    <div className="flex items-start justify-between mb-3">
                      <h3 className="text-lg font-semibold text-white">{project.title}</h3>
                      <CheckCircle2 className="w-6 h-6 text-purple-400" />
                    </div>
                    <p className="text-sm text-slate-400 mb-3">{project.location}</p>
                    <div className="flex justify-between items-center">
                      <Badge className="bg-purple-500/20 text-purple-400 border border-purple-500/30">
                        Completed
                      </Badge>
                      <span className="text-lg font-bold text-green-400">{formatCurrency(project.budget)}</span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Submit Tender Modal */}
        <Dialog open={submitModalOpen} onOpenChange={setSubmitModalOpen}>
          <DialogContent className="bg-slate-900 border-slate-700 max-w-2xl">
            <DialogHeader>
              <DialogTitle className="text-2xl text-white">Submit Tender Proposal</DialogTitle>
              <DialogDescription className="text-slate-400">
                Provide your proposal for this tender. Your blockchain ID will be used for verification.
              </DialogDescription>
            </DialogHeader>

            {selectedProject && (
              <div className="space-y-6">
                <Card className="bg-slate-800/50 border-slate-700">
                  <CardContent className="pt-6 space-y-2">
                    <h3 className="text-lg font-semibold text-white">{selectedProject.title}</h3>
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-400">Budget:</span>
                      <span className="text-green-400 font-semibold">{formatCurrency(selectedProject.budget)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-400">Location:</span>
                      <span className="text-white">{selectedProject.location}</span>
                    </div>
                  </CardContent>
                </Card>

                <div className="space-y-2">
                  <Label className="text-slate-300">Your Proposal *</Label>
                  <Textarea
                    value={tenderProposal}
                    onChange={(e) => setTenderProposal(e.target.value)}
                    placeholder="Describe your approach, timeline, resources, and why you're the best fit for this project..."
                    rows={8}
                    className="bg-slate-800 border-slate-700 text-white placeholder:text-slate-500 resize-none"
                  />
                  <p className="text-xs text-slate-500">
                    Your submission will be reviewed anonymously. Only your blockchain ID will be visible.
                  </p>
                </div>

                <div className="flex space-x-3">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setSubmitModalOpen(false);
                      setTenderProposal('');
                    }}
                    className="flex-1 border-slate-700"
                    disabled={uploading}
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={submitTenderProposal}
                    className="flex-1 bg-blue-500 hover:bg-blue-600"
                    disabled={uploading || !tenderProposal.trim()}
                  >
                    {uploading ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Submitting...
                      </>
                    ) : (
                      <>
                        <Upload className="w-4 h-4 mr-2" />
                        Submit Proposal
                      </>
                    )}
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Submit Milestone Modal */}
        <Dialog open={milestoneModalOpen} onOpenChange={setMilestoneModalOpen}>
          <DialogContent className="bg-slate-900 border-slate-700 max-w-2xl">
            <DialogHeader>
              <DialogTitle className="text-2xl text-white">Submit Milestone Proof</DialogTitle>
              <DialogDescription className="text-slate-400">
                Provide proof of milestone completion. Upload photos, documents, or detailed description.
              </DialogDescription>
            </DialogHeader>

            {selectedProject && (
              <div className="space-y-6">
                <Card className="bg-slate-800/50 border-slate-700">
                  <CardContent className="pt-6 space-y-2">
                    <h3 className="text-lg font-semibold text-white">{selectedProject.title}</h3>
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-400">Current Milestone:</span>
                      <Badge className="bg-green-500/20 text-green-400 border border-green-500/30">
                        Milestone {selectedProject.current_milestone}/4
                      </Badge>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-400">Expected Payment:</span>
                      <span className="text-green-400 font-semibold">
                        {formatCurrency(selectedProject.budget * 0.25)}
                      </span>
                    </div>
                  </CardContent>
                </Card>

                <div className="space-y-2">
                  <Label className="text-slate-300">Completion Proof *</Label>
                  <Textarea
                    value={milestoneProof}
                    onChange={(e) => setMilestoneProof(e.target.value)}
                    placeholder="Describe completed work, attach photo links, provide verification details..."
                    rows={8}
                    className="bg-slate-800 border-slate-700 text-white placeholder:text-slate-500 resize-none"
                  />
                  <p className="text-xs text-slate-500">
                    Supervisor will review your proof before releasing the milestone payment.
                  </p>
                </div>

                <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4">
                  <div className="flex items-start space-x-3">
                    <AlertCircle className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
                    <div className="space-y-1">
                      <p className="text-sm font-medium text-blue-400">Payment Release</p>
                      <p className="text-xs text-blue-300">
                        Upon approval, {formatCurrency(selectedProject.budget * 0.25)} will be released to your wallet automatically via smart contract.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex space-x-3">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setMilestoneModalOpen(false);
                      setMilestoneProof('');
                    }}
                    className="flex-1 border-slate-700"
                    disabled={uploading}
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={submitMilestoneProof}
                    className="flex-1 bg-green-500 hover:bg-green-600"
                    disabled={uploading || !milestoneProof.trim()}
                  >
                    {uploading ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Submitting...
                      </>
                    ) : (
                      <>
                        <Upload className="w-4 h-4 mr-2" />
                        Submit Proof
                      </>
                    )}
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

export default ContractorDashboard;
