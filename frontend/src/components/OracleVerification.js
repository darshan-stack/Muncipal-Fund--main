import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from './ui/card';
import { Button } from './ui/button';
import { Textarea } from './ui/textarea';
import { Label } from './ui/label';
import {
  CheckCircle2,
  XCircle,
  FileText,
  Image as ImageIcon,
  Clock,
  DollarSign,
  AlertCircle,
  Eye,
  X,
  Loader2,
  TrendingUp
} from 'lucide-react';
import { toast } from 'sonner';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const OracleVerification = ({ user }) => {
  const [verifications, setVerifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedVerification, setSelectedVerification] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [showFileViewer, setShowFileViewer] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [feedback, setFeedback] = useState('');
  const [verifying, setVerifying] = useState(false);
  const [action, setAction] = useState(null); // 'approve' or 'reject'

  useEffect(() => {
    fetchVerifications();
  }, []);

  const fetchVerifications = async () => {
    try {
      const response = await axios.get(`${API}/oracle/verifications`);
      setVerifications(response.data.verifications || []);
    } catch (error) {
      console.error('Error fetching verifications:', error);
      toast.error('Failed to load pending verifications');
    } finally {
      setLoading(false);
    }
  };

  const handleViewVerification = (verification) => {
    setSelectedVerification(verification);
    setShowModal(true);
    setFeedback('');
  };

  const handleFileView = (file) => {
    setSelectedFile(file);
    setShowFileViewer(true);
  };

  const handleVerify = async (approved) => {
    if (!approved && !feedback.trim()) {
      toast.error('Please provide feedback for rejection');
      return;
    }

    if (approved && !feedback.trim()) {
      setFeedback('Work meets quality standards and milestone requirements.');
    }

    setAction(approved ? 'approve' : 'reject');
    setVerifying(true);

    try {
      await axios.post(`${API}/oracle/verify`, {
        verification_id: selectedVerification.id,
        approved: approved,
        feedback: feedback || 'Work meets quality standards and milestone requirements.',
        oracle_address: user.address,
        verified_at: new Date().toISOString()
      });

      if (approved) {
        toast.success('Milestone verified and payment released!', {
          description: `$${(selectedVerification.budget / 1000000).toFixed(1)}M sent to contractor`
        });
      } else {
        toast.success('Milestone rejected with feedback', {
          description: 'Contractor will resubmit work'
        });
      }

      // Refresh list
      await fetchVerifications();
      
      // Close modal
      setShowModal(false);
      setSelectedVerification(null);
      setFeedback('');
    } catch (error) {
      console.error('Error verifying milestone:', error);
      toast.error('Failed to process verification');
    } finally {
      setVerifying(false);
      setAction(null);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white p-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-center h-64">
            <Loader2 className="w-8 h-8 animate-spin text-blue-400" />
            <span className="ml-3 text-slate-400">Loading verifications...</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
              Oracle Verification Dashboard
            </h1>
            <p className="text-slate-400 mt-2">
              Review contractor work submissions and verify milestone completion
            </p>
          </div>
          <div className="bg-purple-500/20 border border-purple-500/30 rounded-lg px-4 py-2">
            <p className="text-xs text-purple-300">Oracle Role</p>
            <p className="text-sm font-bold text-purple-400">{user?.username}</p>
          </div>
        </div>

        {/* Statistics */}
        <div className="grid grid-cols-3 gap-4">
          <Card className="bg-slate-900 border-slate-800">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-slate-400">Pending Verifications</p>
                  <p className="text-2xl font-bold text-yellow-400">{verifications.length}</p>
                </div>
                <Clock className="w-8 h-8 text-yellow-400" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-slate-900 border-slate-800">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-slate-400">Total Value Pending</p>
                  <p className="text-2xl font-bold text-blue-400">
                    ${(verifications.reduce((sum, v) => sum + v.budget, 0) / 1000000).toFixed(1)}M
                  </p>
                </div>
                <DollarSign className="w-8 h-8 text-blue-400" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-slate-900 border-slate-800">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-slate-400">Projects Affected</p>
                  <p className="text-2xl font-bold text-purple-400">
                    {new Set(verifications.map(v => v.project_id)).size}
                  </p>
                </div>
                <TrendingUp className="w-8 h-8 text-purple-400" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Pending Verifications List */}
        {verifications.length === 0 ? (
          <Card className="bg-slate-900 border-slate-800">
            <CardContent className="p-12">
              <div className="text-center text-slate-400">
                <CheckCircle2 className="w-16 h-16 mx-auto mb-4 text-slate-600" />
                <h3 className="text-xl font-semibold text-slate-300 mb-2">All Caught Up!</h3>
                <p>No pending milestone verifications at the moment.</p>
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card className="bg-slate-900 border-slate-800">
            <CardHeader>
              <CardTitle className="text-white flex items-center">
                <Clock className="w-5 h-5 mr-2 text-yellow-400" />
                Pending Milestone Verifications
              </CardTitle>
              <CardDescription className="text-slate-400">
                Review submitted work and approve/reject to release payments
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {verifications.map((verification) => (
                <div
                  key={verification.id}
                  className="p-4 bg-slate-800/50 border border-slate-700 rounded-lg hover:border-blue-500/50 transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <h3 className="text-lg font-semibold text-white">
                          {verification.milestone_name}
                        </h3>
                        <span className="px-2 py-1 bg-yellow-500/20 border border-yellow-500/30 rounded text-xs text-yellow-400">
                          Pending
                        </span>
                      </div>

                      <div className="grid grid-cols-2 gap-4 mb-3">
                        <div>
                          <p className="text-xs text-slate-500">Project ID</p>
                          <p className="text-sm text-slate-300">#{verification.project_id}</p>
                        </div>
                        <div>
                          <p className="text-xs text-slate-500">Milestone</p>
                          <p className="text-sm text-slate-300">{verification.milestone_percentage}%</p>
                        </div>
                        <div>
                          <p className="text-xs text-slate-500">Payment Amount</p>
                          <p className="text-sm text-green-400 font-bold">
                            ${(verification.budget / 1000000).toFixed(1)}M
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-slate-500">Submitted</p>
                          <p className="text-sm text-slate-300">
                            {new Date(verification.submitted_at).toLocaleDateString()}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center space-x-4 text-sm text-slate-400">
                        <span className="flex items-center">
                          <FileText className="w-4 h-4 mr-1 text-blue-400" />
                          {verification.submission_files?.length || verification.proof_documents?.length || 0} documents
                        </span>
                        <span className="text-slate-600">•</span>
                        <span className="text-xs font-mono">
                          Contractor: {verification.contractor_address 
                            ? verification.contractor_address.slice(0, 8) + '...' 
                            : verification.contractor_id || verification.contractor_name || 'Unknown'}
                        </span>
                      </div>
                    </div>

                    <Button
                      onClick={() => handleViewVerification(verification)}
                      className="ml-4 bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white"
                    >
                      <Eye className="w-4 h-4 mr-2" />
                      Review & Verify
                    </Button>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {/* Verification Modal */}
        {showModal && selectedVerification && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <Card className="bg-slate-900 border-slate-700 max-w-4xl w-full max-h-[90vh] overflow-y-auto">
              <CardHeader>
                <CardTitle className="text-white flex items-center justify-between">
                  <span>Verify Milestone Work</span>
                  <button
                    onClick={() => {
                      setShowModal(false);
                      setSelectedVerification(null);
                      setFeedback('');
                    }}
                    className="text-slate-400 hover:text-white"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </CardTitle>
                <CardDescription className="text-slate-400">
                  {selectedVerification.milestone_name}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Milestone Info */}
                <div className="grid grid-cols-2 gap-4 p-4 bg-slate-800/50 rounded-lg border border-slate-700">
                  <div>
                    <p className="text-xs text-slate-500">Project ID</p>
                    <p className="text-sm text-white">#{selectedVerification.project_id}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500">Milestone Percentage</p>
                    <p className="text-sm text-white">{selectedVerification.milestone_percentage}%</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500">Payment to Release</p>
                    <p className="text-lg text-green-400 font-bold">
                      ${(selectedVerification.budget / 1000000).toFixed(2)}M
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500">Submitted Date</p>
                    <p className="text-sm text-white">
                      {new Date(selectedVerification.submitted_at).toLocaleString()}
                    </p>
                  </div>
                </div>

                {/* Contractor Notes */}
                {selectedVerification.notes && (
                  <div className="space-y-2">
                    <Label className="text-slate-300">Contractor Notes</Label>
                    <div className="p-3 bg-slate-800/50 border border-slate-700 rounded-lg">
                      <p className="text-sm text-slate-300 whitespace-pre-wrap">
                        {selectedVerification.notes}
                      </p>
                    </div>
                  </div>
                )}

                {/* Submitted Documents */}
                <div className="space-y-3">
                  <Label className="text-slate-300 flex items-center">
                    <FileText className="w-4 h-4 mr-2 text-blue-400" />
                    Submitted Proof of Work ({selectedVerification.submission_files?.length || 0} files)
                  </Label>
                  {selectedVerification.submission_files && selectedVerification.submission_files.length > 0 ? (
                    <div className="grid grid-cols-2 gap-3">
                      {selectedVerification.submission_files.map((file, index) => (
                        <div
                          key={index}
                          className="p-3 bg-slate-800/50 border border-slate-700 rounded-lg hover:border-blue-500/50 transition-colors cursor-pointer"
                          onClick={() => handleFileView(file)}
                        >
                          <div className="flex items-center space-x-3">
                            {file.type === 'image' ? (
                              <ImageIcon className="w-5 h-5 text-blue-400" />
                            ) : (
                              <FileText className="w-5 h-5 text-purple-400" />
                            )}
                            <div className="flex-1 min-w-0">
                              <p className="text-sm text-slate-200 truncate">{file.name}</p>
                              <p className="text-xs text-slate-500">{file.size}</p>
                            </div>
                            <Eye className="w-4 h-4 text-slate-400" />
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-slate-500">No files submitted</p>
                  )}
                </div>

                {/* Oracle Feedback */}
                <div className="space-y-2">
                  <Label className="text-slate-300">Oracle Feedback (Required for rejection)</Label>
                  <Textarea
                    value={feedback}
                    onChange={(e) => setFeedback(e.target.value)}
                    placeholder="Provide detailed feedback about the work quality, completeness, and any issues found..."
                    rows={4}
                    className="bg-slate-800/50 border-slate-700 text-white placeholder:text-slate-500"
                  />
                </div>

                {/* Warning Box */}
                <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4">
                  <div className="flex items-start space-x-3">
                    <AlertCircle className="w-5 h-5 text-yellow-400 flex-shrink-0 mt-0.5" />
                    <div className="space-y-1">
                      <p className="text-sm font-semibold text-yellow-400">Important</p>
                      <ul className="text-xs text-yellow-300 space-y-1">
                        <li>✅ <strong>Approve:</strong> Payment of ${(selectedVerification.budget / 1000000).toFixed(1)}M will be released immediately to contractor</li>
                        <li>❌ <strong>Reject:</strong> Contractor must resubmit work with improvements based on your feedback</li>
                        <li>🔄 Next milestone will automatically activate upon approval</li>
                      </ul>
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex space-x-3 pt-4">
                  <Button
                    onClick={() => handleVerify(false)}
                    disabled={verifying}
                    className="flex-1 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white"
                  >
                    {verifying && action === 'reject' ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Rejecting...
                      </>
                    ) : (
                      <>
                        <XCircle className="w-4 h-4 mr-2" />
                        Reject & Request Rework
                      </>
                    )}
                  </Button>
                  <Button
                    onClick={() => handleVerify(true)}
                    disabled={verifying}
                    className="flex-1 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white"
                  >
                    {verifying && action === 'approve' ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Approving...
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="w-4 h-4 mr-2" />
                        Approve & Release Payment
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* File Viewer Modal */}
        {showFileViewer && selectedFile && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
            <div className="bg-slate-900 rounded-lg max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
              <div className="p-4 border-b border-slate-700 flex items-center justify-between">
                <div>
                  <h3 className="text-white font-semibold">{selectedFile.name}</h3>
                  <p className="text-xs text-slate-400">IPFS: {selectedFile.ipfsHash}</p>
                </div>
                <button
                  onClick={() => {
                    setShowFileViewer(false);
                    setSelectedFile(null);
                  }}
                  className="text-slate-400 hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="flex-1 overflow-auto p-4 flex items-center justify-center bg-slate-950">
                {selectedFile.type === 'image' ? (
                  <img
                    src={selectedFile.url}
                    alt={selectedFile.name}
                    className="max-w-full max-h-full object-contain"
                  />
                ) : (
                  <div className="text-center text-slate-400">
                    <FileText className="w-16 h-16 mx-auto mb-4 text-slate-600" />
                    <p>Document preview</p>
                    <p className="text-sm mt-2">{selectedFile.name}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default OracleVerification;
