import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { Label } from './ui/label';
import { 
  CheckCircle2, 
  Circle, 
  Clock, 
  Upload, 
  FileText, 
  AlertCircle,
  TrendingUp,
  DollarSign,
  Send,
  X,
  Loader2
} from 'lucide-react';
import { toast } from 'sonner';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const MilestoneTracker = ({ projectId, contractorAddress }) => {
  const [milestones, setMilestones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [selectedMilestone, setSelectedMilestone] = useState(null);
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [submissionFiles, setSubmissionFiles] = useState([]);
  const [submissionNotes, setSubmissionNotes] = useState('');

  useEffect(() => {
    fetchMilestones();
  }, [projectId]);

  const fetchMilestones = async () => {
    try {
      const response = await axios.get(`${API}/projects/${projectId}/milestones`);
      setMilestones(response.data.milestones || []);
    } catch (error) {
      console.error('Error fetching milestones:', error);
      toast.error('Failed to load milestones');
    } finally {
      setLoading(false);
    }
  };

  const getMilestoneStatusColor = (milestone) => {
    if (milestone.status === 'completed') return 'text-green-400';
    if (milestone.status === 'active') return 'text-blue-400';
    if (milestone.verification_status === 'rejected') return 'text-red-400';
    return 'text-slate-500';
  };

  const getMilestoneStatusIcon = (milestone) => {
    if (milestone.status === 'completed') {
      return <CheckCircle2 className="w-6 h-6 text-green-400" />;
    }
    if (milestone.status === 'active') {
      return <Clock className="w-6 h-6 text-blue-400 animate-pulse" />;
    }
    if (milestone.verification_status === 'rejected') {
      return <AlertCircle className="w-6 h-6 text-red-400" />;
    }
    return <Circle className="w-6 h-6 text-slate-600" />;
  };

  const getProgressPercentage = () => {
    const completed = milestones.filter(m => m.status === 'completed').length;
    return (completed / 5) * 100;
  };

  const getTotalPaid = () => {
    return milestones
      .filter(m => m.payment_released)
      .reduce((sum, m) => sum + m.payment_amount, 0);
  };

  const handleFileUpload = async (e) => {
    const files = Array.from(e.target.files);
    
    const newFiles = await Promise.all(
      files.map(async (file) => {
        // Simulate IPFS upload
        const ipfsHash = `Qm${Math.random().toString(36).substring(2, 15)}${Math.random().toString(36).substring(2, 15)}`;
        
        return {
          name: file.name,
          size: `${(file.size / 1024).toFixed(2)} KB`,
          ipfsHash: ipfsHash,
          url: URL.createObjectURL(file),
          type: file.type.startsWith('image/') ? 'image' : 'document'
        };
      })
    );

    setSubmissionFiles([...submissionFiles, ...newFiles]);
    toast.success(`${files.length} file(s) uploaded successfully`);
  };

  const removeFile = (index) => {
    setSubmissionFiles(submissionFiles.filter((_, i) => i !== index));
  };

  const handleSubmitWork = async () => {
    if (submissionFiles.length === 0) {
      toast.error('Please upload at least one proof of work document');
      return;
    }

    if (!submissionNotes.trim()) {
      toast.error('Please provide notes about the completed work');
      return;
    }

    try {
      setSubmitting(true);

      await axios.post(`${API}/projects/${projectId}/milestones/${selectedMilestone.id}/submit`, {
        submission_files: submissionFiles,
        notes: submissionNotes,
        contractor_address: contractorAddress,
        submitted_at: new Date().toISOString()
      });

      toast.success('Work submitted for oracle verification!', {
        description: 'Supervisor will review and verify your submission'
      });

      // Refresh milestones
      await fetchMilestones();
      
      // Close modal and reset
      setShowSubmitModal(false);
      setSubmissionFiles([]);
      setSubmissionNotes('');
      setSelectedMilestone(null);
    } catch (error) {
      console.error('Error submitting work:', error);
      toast.error('Failed to submit work. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const openSubmitModal = (milestone) => {
    setSelectedMilestone(milestone);
    setShowSubmitModal(true);
  };

  if (loading) {
    return (
      <Card className="bg-slate-900 border-slate-800">
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <Loader2 className="w-6 h-6 animate-spin text-blue-400" />
            <span className="ml-2 text-slate-400">Loading milestones...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (milestones.length === 0) {
    return (
      <Card className="bg-slate-900 border-slate-800">
        <CardContent className="p-6">
          <div className="text-center text-slate-400">
            <AlertCircle className="w-12 h-12 mx-auto mb-2 text-slate-600" />
            <p>No milestones initialized yet. Milestones will be created after supervisor approval.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Progress Overview */}
      <Card className="bg-gradient-to-br from-slate-900 to-slate-800 border-slate-700">
        <CardHeader>
          <CardTitle className="text-white flex items-center">
            <TrendingUp className="w-5 h-5 mr-2 text-green-400" />
            Milestone Progress
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Progress Bar */}
          <div>
            <div className="flex justify-between text-sm mb-2">
              <span className="text-slate-400">Overall Completion</span>
              <span className="text-white font-bold">{getProgressPercentage().toFixed(0)}%</span>
            </div>
            <div className="w-full bg-slate-700 rounded-full h-3 overflow-hidden">
              <div 
                className="bg-gradient-to-r from-green-500 to-emerald-500 h-full transition-all duration-500"
                style={{ width: `${getProgressPercentage()}%` }}
              />
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-3 gap-4 mt-4">
            <div className="bg-slate-800/50 rounded-lg p-3 border border-slate-700">
              <p className="text-xs text-slate-400 mb-1">Completed</p>
              <p className="text-2xl font-bold text-green-400">
                {milestones.filter(m => m.status === 'completed').length}/5
              </p>
            </div>
            <div className="bg-slate-800/50 rounded-lg p-3 border border-slate-700">
              <p className="text-xs text-slate-400 mb-1">Current</p>
              <p className="text-2xl font-bold text-blue-400">
                {milestones.find(m => m.status === 'active')?.milestone_number || '-'}
              </p>
            </div>
            <div className="bg-slate-800/50 rounded-lg p-3 border border-slate-700">
              <p className="text-xs text-slate-400 mb-1">Total Paid</p>
              <p className="text-xl font-bold text-green-400 flex items-center">
                <DollarSign className="w-4 h-4 mr-1" />
                {(getTotalPaid() / 1000000).toFixed(1)}M
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Milestones List */}
      <Card className="bg-slate-900 border-slate-800">
        <CardHeader>
          <CardTitle className="text-white">5 Project Milestones (20% Each)</CardTitle>
          <CardDescription className="text-slate-400">
            Complete each milestone and submit for oracle verification to receive payment
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {milestones.map((milestone, index) => (
            <div
              key={milestone.id}
              className={`p-4 rounded-lg border transition-all ${
                milestone.status === 'completed'
                  ? 'bg-green-500/10 border-green-500/30'
                  : milestone.status === 'active'
                  ? 'bg-blue-500/10 border-blue-500/30'
                  : milestone.verification_status === 'rejected'
                  ? 'bg-red-500/10 border-red-500/30'
                  : 'bg-slate-800/30 border-slate-700'
              }`}
            >
              <div className="flex items-start space-x-4">
                {/* Status Icon */}
                <div className="flex-shrink-0 mt-1">
                  {getMilestoneStatusIcon(milestone)}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <h3 className={`font-semibold ${getMilestoneStatusColor(milestone)}`}>
                        Milestone {milestone.milestone_number}: {milestone.name}
                      </h3>
                      <p className="text-sm text-slate-400 mt-1">{milestone.description}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold text-green-400">
                        ${(milestone.amount / 1000000).toFixed(1)}M
                      </p>
                      <p className="text-xs text-slate-500">{milestone.percentage}%</p>
                    </div>
                  </div>

                  {/* Status Information */}
                  <div className="mt-3 space-y-2">
                    {milestone.status === 'completed' && (
                      <div className="flex items-center space-x-2 text-sm">
                        <CheckCircle2 className="w-4 h-4 text-green-400" />
                        <span className="text-green-400">Completed & Paid</span>
                        {milestone.paid_at && (
                          <span className="text-slate-500">
                            • {new Date(milestone.paid_at).toLocaleDateString()}
                          </span>
                        )}
                      </div>
                    )}

                    {milestone.status === 'active' && !milestone.work_submitted && (
                      <Button
                        onClick={() => openSubmitModal(milestone)}
                        className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white"
                      >
                        <Send className="w-4 h-4 mr-2" />
                        Submit Work for Verification
                      </Button>
                    )}

                    {milestone.verification_status === 'pending_verification' && (
                      <div className="flex items-center space-x-2 text-sm">
                        <Clock className="w-4 h-4 text-yellow-400 animate-pulse" />
                        <span className="text-yellow-400">Pending Oracle Verification</span>
                        {milestone.submitted_at && (
                          <span className="text-slate-500">
                            • Submitted {new Date(milestone.submitted_at).toLocaleDateString()}
                          </span>
                        )}
                      </div>
                    )}

                    {milestone.verification_status === 'rejected' && (
                      <div className="space-y-2">
                        <div className="flex items-center space-x-2 text-sm">
                          <AlertCircle className="w-4 h-4 text-red-400" />
                          <span className="text-red-400">Rejected - Needs Rework</span>
                        </div>
                        {milestone.oracle_feedback && (
                          <div className="bg-red-500/10 border border-red-500/30 rounded p-3">
                            <p className="text-xs text-slate-400 mb-1">Oracle Feedback:</p>
                            <p className="text-sm text-red-300">{milestone.oracle_feedback}</p>
                          </div>
                        )}
                        <Button
                          onClick={() => openSubmitModal(milestone)}
                          className="bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white"
                        >
                          <Upload className="w-4 h-4 mr-2" />
                          Resubmit Work
                        </Button>
                      </div>
                    )}

                    {milestone.status === 'pending' && (
                      <div className="flex items-center space-x-2 text-sm text-slate-500">
                        <Circle className="w-4 h-4" />
                        <span>Locked - Complete previous milestone first</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Submit Work Modal */}
      {showSubmitModal && selectedMilestone && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <Card className="bg-slate-900 border-slate-700 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <CardHeader>
              <CardTitle className="text-white flex items-center justify-between">
                <span>Submit Milestone {selectedMilestone.milestone_number} Work</span>
                <button
                  onClick={() => {
                    setShowSubmitModal(false);
                    setSubmissionFiles([]);
                    setSubmissionNotes('');
                  }}
                  className="text-slate-400 hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </CardTitle>
              <CardDescription className="text-slate-400">
                {selectedMilestone.name}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Upload Section */}
              <div className="space-y-3">
                <Label className="text-slate-300">Proof of Work Documents</Label>
                <p className="text-xs text-slate-400">
                  Upload photos, reports, or documents proving completion of this milestone
                </p>
                <div className="flex items-center space-x-3">
                  <Input
                    type="file"
                    multiple
                    onChange={handleFileUpload}
                    className="hidden"
                    id="work-upload"
                  />
                  <Label
                    htmlFor="work-upload"
                    className="flex items-center justify-center px-4 py-2 border-2 border-dashed border-slate-600 rounded-lg hover:border-blue-500 cursor-pointer transition-colors bg-slate-800/30"
                  >
                    <Upload className="w-5 h-5 mr-2 text-blue-400" />
                    <span className="text-sm text-slate-300">Upload Files</span>
                  </Label>
                </div>

                {/* Uploaded Files */}
                {submissionFiles.length > 0 && (
                  <div className="space-y-2 mt-3">
                    {submissionFiles.map((file, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between p-3 bg-slate-800/50 border border-slate-700 rounded-lg"
                      >
                        <div className="flex items-center space-x-3 flex-1 min-w-0">
                          <FileText className="w-5 h-5 text-blue-400 flex-shrink-0" />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm text-slate-200 truncate">{file.name}</p>
                            <div className="flex items-center space-x-2 mt-1">
                              <span className="text-xs text-slate-400">{file.size}</span>
                              <span className="text-xs text-blue-400 font-mono">IPFS: {file.ipfsHash}</span>
                            </div>
                          </div>
                        </div>
                        <button
                          onClick={() => removeFile(index)}
                          className="ml-3 p-1.5 bg-red-500/20 rounded-lg text-red-400 hover:bg-red-500/30 flex-shrink-0"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Notes */}
              <div className="space-y-2">
                <Label className="text-slate-300">Completion Notes</Label>
                <Textarea
                  value={submissionNotes}
                  onChange={(e) => setSubmissionNotes(e.target.value)}
                  placeholder="Describe what was completed, any challenges faced, and quality checks performed..."
                  rows={4}
                  className="bg-slate-800/50 border-slate-700 text-white placeholder:text-slate-500"
                />
              </div>

              {/* Submit Button */}
              <div className="flex space-x-3 pt-4">
                <Button
                  onClick={() => {
                    setShowSubmitModal(false);
                    setSubmissionFiles([]);
                    setSubmissionNotes('');
                  }}
                  variant="outline"
                  className="flex-1 border-slate-700 hover:bg-slate-800"
                  disabled={submitting}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleSubmitWork}
                  disabled={submitting || submissionFiles.length === 0 || !submissionNotes.trim()}
                  className="flex-1 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Submitting...
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4 mr-2" />
                      Submit for Verification
                    </>
                  )}
                </Button>
              </div>

              {/* Warning */}
              <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-3">
                <p className="text-xs text-yellow-400">
                  ⚠️ Once submitted, oracle/supervisor will review your work. Payment of $
                  {(selectedMilestone.amount / 1000000).toFixed(1)}M will be released automatically upon approval.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

export default MilestoneTracker;
