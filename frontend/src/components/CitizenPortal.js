import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { Label } from './ui/label';
import { Badge } from './ui/badge';
import { 
  MapPin, 
  ExternalLink, 
  Star, 
  MessageSquare, 
  Eye, 
  Search,
  Filter,
  TrendingUp,
  AlertCircle,
  CheckCircle2,
  Clock,
  DollarSign,
  Building,
  FileText,
  Image as ImageIcon
} from 'lucide-react';
import { toast } from 'sonner';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:5000';
const API = `${BACKEND_URL}/api`;

// For Sepolia Etherscan links
const getEtherscanTxUrl = (txHash) => {
  return `https://sepolia.etherscan.io/tx/${txHash}`;
};

const getEtherscanAddressUrl = (address) => {
  return `https://sepolia.etherscan.io/address/${address}`;
};

const CitizenPortal = () => {
  const navigate = useNavigate();
  const [searchPincode, setSearchPincode] = useState('');
  const [searchState, setSearchState] = useState('');
  const [projects, setProjects] = useState([]);
  const [filteredProjects, setFilteredProjects] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedProject, setSelectedProject] = useState(null);
  const [showOpinionForm, setShowOpinionForm] = useState(false);
  const [opinion, setOpinion] = useState({
    rating: 5,
    comment: '',
    location: '',
    difficulty: '',
    suggestion: '',
    issueType: 'general', // general, delay, quality, safety, other
  });
  const [milestoneDocuments, setMilestoneDocuments] = useState([]);

  useEffect(() => {
    loadAllProjects();
  }, []);

  useEffect(() => {
    filterProjects();
  }, [searchPincode, searchState, projects]);

  const loadAllProjects = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${API}/projects`);
      const projectsData = response.data || [];
      setProjects(projectsData);
      
      if (projectsData.length === 0) {
        toast.info('No projects found. Check back later!');
      } else {
        toast.success(`Loaded ${projectsData.length} projects`);
      }
    } catch (error) {
      console.error('Failed to load projects:', error);
      toast.error('Failed to load projects. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const filterProjects = () => {
    let filtered = [...projects];

    if (searchPincode) {
      filtered = filtered.filter(p => 
        p.pincode && p.pincode.includes(searchPincode)
      );
    }

    if (searchState) {
      filtered = filtered.filter(p => 
        p.state && p.state.toLowerCase().includes(searchState.toLowerCase())
      );
    }

    setFilteredProjects(filtered);
  };

  const submitOpinion = async () => {
    if (!selectedProject) return;

    if (opinion.rating < 1 || opinion.rating > 5) {
      toast.error('Rating must be between 1 and 5 stars');
      return;
    }

    if (!opinion.comment.trim() && !opinion.difficulty.trim() && !opinion.suggestion.trim()) {
      toast.error('Please provide feedback, difficulty, or suggestion');
      return;
    }

    try {
      await axios.post(`${API}/opinions`, {
        project_id: selectedProject.id,
        rating: opinion.rating,
        comment: opinion.comment,
        difficulty: opinion.difficulty,
        suggestion: opinion.suggestion,
        issue_type: opinion.issueType,
        location: opinion.location,
        submitted_at: new Date().toISOString(),
      });

      toast.success('Thank you for your valuable feedback!', {
        description: 'Your opinion helps improve municipal projects'
      });
      
      setShowOpinionForm(false);
      setOpinion({ 
        rating: 5, 
        comment: '', 
        location: '', 
        difficulty: '', 
        suggestion: '', 
        issueType: 'general' 
      });
    } catch (error) {
      console.error('Failed to submit opinion:', error);
      toast.error('Failed to submit opinion. Please try again.');
    }
  };

  const getStatusBadge = (status) => {
    const variants = {
      'Created': { color: 'bg-blue-500/20 text-blue-400 border-blue-500/50', icon: Clock },
      'TenderAssigned': { color: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/50', icon: AlertCircle },
      'InProgress': { color: 'bg-purple-500/20 text-purple-400 border-purple-500/50', icon: TrendingUp },
      'Completed': { color: 'bg-green-500/20 text-green-400 border-green-500/50', icon: CheckCircle2 },
    };

    const variant = variants[status] || variants['Created'];
    const Icon = variant.icon;

    return (
      <Badge className={`${variant.color} border flex items-center gap-1`}>
        <Icon className="w-3 h-3" />
        {status}
      </Badge>
    );
  };

  const ProjectCard = ({ project }) => (
    <Card 
      className="bg-slate-800/50 border-slate-700 hover:border-blue-500/50 transition-all cursor-pointer"
      onClick={() => setSelectedProject(project)}
    >
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="text-white text-lg mb-2">{project.name}</CardTitle>
            <div className="flex items-center gap-2 text-sm text-slate-400">
              <MapPin className="w-4 h-4" />
              <span>{project.location}, {project.city}, {project.state} - {project.pincode}</span>
            </div>
          </div>
          {getStatusBadge(project.status)}
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        <p className="text-sm text-slate-300 line-clamp-2">{project.description}</p>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <p className="text-xs text-slate-500">Budget</p>
            <p className="text-lg font-semibold text-green-400 flex items-center gap-1">
              <DollarSign className="w-4 h-4" />
              ${Number(project.budget || 0).toLocaleString()}
            </p>
          </div>

          <div className="space-y-1">
            <p className="text-xs text-slate-500">Progress</p>
            <p className="text-lg font-semibold text-blue-400">
              {project.progress || 0}%
            </p>
          </div>
        </div>

        <div className="flex gap-2">
          <Button
            size="sm"
            variant="outline"
            className="flex-1 border-slate-600 text-blue-400 hover:bg-slate-700"
            onClick={(e) => {
              e.stopPropagation();
              setSelectedProject(project);
            }}
          >
            <Eye className="w-4 h-4 mr-1" />
            View Details
          </Button>

          <Button
            size="sm"
            variant="outline"
            className="border-slate-600 text-green-400 hover:bg-slate-700"
            onClick={(e) => {
              e.stopPropagation();
              setSelectedProject(project);
              setShowOpinionForm(true);
            }}
          >
            <MessageSquare className="w-4 h-4 mr-1" />
            Opinion
          </Button>
        </div>
      </CardContent>
    </Card>
  );

  const ProjectDetailsModal = () => {
    if (!selectedProject) return null;

    // Check if project has valid data
    const hasValidData = selectedProject && selectedProject.name;

    return (
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
        <Card className="w-full max-w-4xl max-h-[90vh] overflow-y-auto bg-slate-800 border-slate-700">
          <CardHeader>
            <div className="flex items-start justify-between">
              <div className="flex-1">
                {hasValidData ? (
                  <>
                    <CardTitle className="text-white text-2xl mb-2">{selectedProject.name}</CardTitle>
                    <div className="flex items-center gap-2 text-slate-400">
                      <MapPin className="w-4 h-4" />
                      <span>
                        {selectedProject.location || 'Location not specified'}, {selectedProject.city || 'N/A'}, {selectedProject.state || 'N/A'}
                      </span>
                      {selectedProject.pincode && (
                        <Badge variant="outline" className="ml-2">PIN: {selectedProject.pincode}</Badge>
                      )}
                    </div>
                  </>
                ) : (
                  <div className="space-y-2">
                    <CardTitle className="text-white text-2xl mb-2">Project Details</CardTitle>
                    <div className="flex items-center gap-2 text-red-400">
                      <AlertCircle className="w-5 h-5" />
                      <span className="font-semibold">Project data not found or incomplete</span>
                    </div>
                  </div>
                )}
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setSelectedProject(null);
                  setShowOpinionForm(false);
                }}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </Button>
            </div>
          </CardHeader>

          <CardContent className="space-y-6">
            {!hasValidData ? (
              <div className="py-12 text-center space-y-4">
                <div className="w-20 h-20 bg-red-500/10 rounded-full flex items-center justify-center mx-auto">
                  <AlertCircle className="w-10 h-10 text-red-400" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-white mb-2">Project Data Not Found</h3>
                  <p className="text-slate-400 max-w-md mx-auto">
                    The project details could not be loaded. This might be due to:
                  </p>
                  <ul className="text-sm text-slate-500 mt-3 space-y-1 text-left max-w-md mx-auto">
                    <li>• Project is still being created</li>
                    <li>• Data synchronization issue</li>
                    <li>• Network connectivity problem</li>
                  </ul>
                </div>
                <Button
                  onClick={() => {
                    setSelectedProject(null);
                    loadAllProjects();
                  }}
                  className="mt-4 bg-blue-600 hover:bg-blue-700"
                >
                  Refresh Projects
                </Button>
              </div>
            ) : (
              <>
                {/* Status & Budget */}
                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-1">
                    <p className="text-xs text-slate-500">Status</p>
                    {getStatusBadge(selectedProject.status || 'Created')}
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs text-slate-500">Budget</p>
                    <p className="text-2xl font-bold text-green-400">
                      ${Number(selectedProject.budget || 0).toLocaleString()}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs text-slate-500">Progress</p>
                    <p className="text-2xl font-bold text-blue-400">{selectedProject.progress || 0}%</p>
                  </div>
                </div>

                {/* Description */}
                <div>
                  <h3 className="text-lg font-semibold text-white mb-2">Description</h3>
                  <p className="text-slate-300">
                    {selectedProject.description || 'No description available'}
                  </p>
                </div>

                {/* Contractor Submitted Photos & Documents */}
                {selectedProject.milestones && selectedProject.milestones.some(m => m.documents && m.documents.length > 0) && (
                  <div className="border-t border-slate-700 pt-4">
                    <h3 className="text-lg font-semibold text-white mb-3">📸 Contractor Submitted Files</h3>
                    <div className="space-y-4">
                      {selectedProject.milestones.map((milestone, idx) => {
                        if (!milestone.documents || milestone.documents.length === 0) return null;
                        
                        return (
                          <div key={idx} className="bg-slate-900/30 p-4 rounded border border-slate-700">
                            <p className="text-sm font-semibold text-white mb-2">
                              {milestone.name || `Milestone ${idx + 1}`} - {milestone.percentage || 0}%
                            </p>
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                              {milestone.documents.map((doc, docIdx) => (
                                <a
                                  key={docIdx}
                                  href={doc.url || doc.ipfsHash ? `https://gateway.pinata.cloud/ipfs/${doc.ipfsHash}` : '#'}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="flex items-center gap-2 p-2 bg-slate-800 rounded border border-slate-600 hover:border-blue-500 transition-colors"
                                >
                                  {doc.type?.includes('image') ? (
                                    <ImageIcon className="w-5 h-5 text-blue-400" />
                                  ) : (
                                    <FileText className="w-5 h-5 text-green-400" />
                                  )}
                                  <div className="flex-1 min-w-0">
                                    <p className="text-xs text-white truncate">{doc.name || `File ${docIdx + 1}`}</p>
                                    <p className="text-xs text-slate-500">{doc.type || 'Unknown'}</p>
                                  </div>
                                  <ExternalLink className="w-4 h-4 text-slate-400" />
                                </a>
                              ))}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Blockchain Verification */}
                <div className="border-t border-slate-700 pt-4">
                  <h3 className="text-lg font-semibold text-white mb-3">🔗 Blockchain Verification</h3>
                  <div className="space-y-2">
                    {selectedProject.tx_hash && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full border-blue-600 text-blue-400 hover:bg-blue-500/10"
                        onClick={() => window.open(getEtherscanTxUrl(selectedProject.tx_hash), '_blank')}
                      >
                        <ExternalLink className="w-4 h-4 mr-2" />
                        Verify on Etherscan: {selectedProject.tx_hash?.slice(0, 10)}...{selectedProject.tx_hash?.slice(-8)}
                      </Button>
                    )}

                    {selectedProject.contract_address && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full border-purple-600 text-purple-400 hover:bg-purple-500/10"
                        onClick={() => window.open(getEtherscanAddressUrl(selectedProject.contract_address), '_blank')}
                      >
                        <Building className="w-4 h-4 mr-2" />
                        View Contract on Etherscan
                      </Button>
                    )}

                    <div className="bg-slate-900/50 p-3 rounded border border-slate-700 text-xs">
                      <p className="text-slate-400 mb-1">✅ <strong>Tamper-Proof:</strong> All data stored on blockchain</p>
                      <p className="text-slate-400 mb-1">✅ <strong>Transparent:</strong> Anyone can verify on Etherscan</p>
                      <p className="text-slate-400">✅ <strong>Automatic:</strong> Funds released by smart contract</p>
                    </div>
                  </div>
                </div>

                {/* Milestones */}
                {selectedProject.milestones && selectedProject.milestones.length > 0 && (
                  <div className="border-t border-slate-700 pt-4">
                    <h3 className="text-lg font-semibold text-white mb-3">Milestones Progress</h3>
                    <div className="space-y-2">
                      {selectedProject.milestones.map((milestone, index) => (
                        <div key={index} className="flex items-center justify-between p-3 bg-slate-900/30 rounded border border-slate-700">
                          <div className="flex-1">
                            <p className="text-sm font-medium text-white">{milestone.name || `Milestone ${index + 1}`}</p>
                            <p className="text-xs text-slate-400">{milestone.description || 'No description'}</p>
                          </div>
                          <Badge className={milestone.completed ? 'bg-green-500/20 text-green-400' : 'bg-yellow-500/20 text-yellow-400'}>
                            {milestone.completed ? 'Completed' : 'In Progress'}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Opinion Form */}
                {showOpinionForm && (
                  <div className="border-t border-slate-700 pt-4">
                    <h3 className="text-lg font-semibold text-white mb-3">💬 Submit Your Feedback</h3>
                    <p className="text-sm text-slate-400 mb-4">
                      Help improve this project by sharing your experience, difficulties, or suggestions
                    </p>
                    <div className="space-y-4">
                      <div>
                        <Label className="text-slate-300">Rating</Label>
                        <div className="flex gap-2 mt-2">
                          {[1, 2, 3, 4, 5].map(star => (
                            <Star
                              key={star}
                              className={`w-8 h-8 cursor-pointer transition-colors ${
                                star <= opinion.rating
                                  ? 'fill-yellow-400 text-yellow-400'
                                  : 'text-slate-600'
                              }`}
                              onClick={() => setOpinion({ ...opinion, rating: star })}
                            />
                          ))}
                        </div>
                      </div>

                      <div>
                        <Label className="text-slate-300">Issue Type</Label>
                        <select
                          value={opinion.issueType}
                          onChange={(e) => setOpinion({ ...opinion, issueType: e.target.value })}
                          className="w-full mt-2 px-3 py-2 bg-slate-900/50 border border-slate-700 rounded text-white"
                        >
                          <option value="general">General Feedback</option>
                          <option value="delay">Delay or Timeline Issue</option>
                          <option value="quality">Quality Concern</option>
                          <option value="safety">Safety Issue</option>
                          <option value="other">Other</option>
                        </select>
                      </div>

                      <div>
                        <Label className="text-slate-300">Your General Feedback</Label>
                        <Textarea
                          placeholder="Share your thoughts about this project..."
                          value={opinion.comment}
                          onChange={(e) => setOpinion({ ...opinion, comment: e.target.value })}
                          rows={3}
                          className="mt-2 bg-slate-900/50 border-slate-700 text-white"
                        />
                      </div>

                      <div>
                        <Label className="text-slate-300">Difficulties or Problems Faced 🚨</Label>
                        <Textarea
                          placeholder="Describe any difficulties or problems you've experienced (e.g., road blockage, noise, safety concerns, delays)..."
                          value={opinion.difficulty}
                          onChange={(e) => setOpinion({ ...opinion, difficulty: e.target.value })}
                          rows={3}
                          className="mt-2 bg-slate-900/50 border-slate-700 text-white"
                        />
                      </div>

                      <div>
                        <Label className="text-slate-300">Your Suggestions for Improvement 💡</Label>
                        <Textarea
                          placeholder="Share your suggestions to improve this project (e.g., better timings, improved access, additional facilities)..."
                          value={opinion.suggestion}
                          onChange={(e) => setOpinion({ ...opinion, suggestion: e.target.value })}
                          rows={3}
                          className="mt-2 bg-slate-900/50 border-slate-700 text-white"
                        />
                      </div>

                      <div>
                        <Label className="text-slate-300">Your Location (Optional)</Label>
                        <Input
                          placeholder="e.g., Near this project, 2 blocks away"
                          value={opinion.location}
                          onChange={(e) => setOpinion({ ...opinion, location: e.target.value })}
                          className="mt-2 bg-slate-900/50 border-slate-700 text-white"
                        />
                      </div>

                      <div className="flex gap-2">
                        <Button
                          onClick={submitOpinion}
                          className="flex-1 bg-blue-600 hover:bg-blue-700"
                        >
                          Submit Feedback
                        </Button>
                        <Button
                          variant="outline"
                          onClick={() => setShowOpinionForm(false)}
                          className="border-slate-600 text-slate-400"
                        >
                          Cancel
                        </Button>
                      </div>
                    </div>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">🏛️ Citizen Portal</h1>
          <p className="text-slate-400">
            View municipal projects in your area and contribute your feedback
          </p>
        </div>

        {/* Search & Filter */}
        <Card className="mb-6 bg-slate-800/50 border-slate-700">
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label className="text-slate-300 flex items-center gap-2">
                  <Search className="w-4 h-4" />
                  Search by Pincode
                </Label>
                <Input
                  placeholder="Enter pincode (e.g., 400001)"
                  value={searchPincode}
                  onChange={(e) => setSearchPincode(e.target.value)}
                  className="bg-slate-900/50 border-slate-700 text-white"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-slate-300 flex items-center gap-2">
                  <Filter className="w-4 h-4" />
                  Filter by State
                </Label>
                <Input
                  placeholder="Enter state name"
                  value={searchState}
                  onChange={(e) => setSearchState(e.target.value)}
                  className="bg-slate-900/50 border-slate-700 text-white"
                />
              </div>

              <div className="flex items-end">
                <Button
                  onClick={() => {
                    setSearchPincode('');
                    setSearchState('');
                  }}
                  variant="outline"
                  className="w-full border-slate-600 text-slate-400"
                >
                  Clear Filters
                </Button>
              </div>
            </div>

            <div className="mt-4 flex items-center gap-2 text-sm text-slate-400">
              <AlertCircle className="w-4 h-4" />
              <span>Found {filteredProjects.length} projects</span>
              {(searchPincode || searchState) && (
                <span className="text-blue-400">
                  {searchPincode && `near ${searchPincode}`}
                  {searchState && ` in ${searchState}`}
                </span>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Projects Grid */}
        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
            <p className="text-slate-400 mt-4">Loading projects...</p>
          </div>
        ) : filteredProjects.length === 0 ? (
          <Card className="bg-slate-800/50 border-slate-700">
            <CardContent className="py-12 text-center">
              <AlertCircle className="w-16 h-16 text-slate-600 mx-auto mb-4" />
              <p className="text-slate-400 text-lg">No projects found</p>
              <p className="text-sm text-slate-500 mt-2">
                Try different search filters or check back later
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredProjects.map(project => (
              <ProjectCard key={project.id} project={project} />
            ))}
          </div>
        )}

        {/* Project Details Modal */}
        {selectedProject && <ProjectDetailsModal />}
      </div>
    </div>
  );
};

export default CitizenPortal;
