import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Textarea } from './ui/textarea';
import { Label } from './ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from './ui/dialog';
import { FileText, Image as ImageIcon, MapPin, CheckCircle2, XCircle, Eye, Loader2, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import SecurePDFViewer from './SecurePDFViewer';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const SupervisorApproval = ({ user }) => {
  const navigate = useNavigate();
  const [pendingTenders, setPendingTenders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedTender, setSelectedTender] = useState(null);
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [processing, setProcessing] = useState(false);
  const [viewingFile, setViewingFile] = useState(null);
  const [pdfViewerOpen, setPdfViewerOpen] = useState(false);

  useEffect(() => {
    if (user?.role !== 'supervisor') {
      navigate('/');
      return;
    }
    fetchPendingTenders();
  }, [user, navigate]);

  const fetchPendingTenders = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API}/supervisor/pending-tenders`);
      setPendingTenders(response.data.tenders || []);
    } catch (error) {
      console.error('Error fetching tenders:', error);
      toast.error('Failed to load pending tenders');
    } finally {
      setLoading(false);
    }
  };

  const handleViewTender = (tender) => {
    setSelectedTender(tender);
    setViewModalOpen(true);
  };

  const handleApprove = async (tender) => {
    if (!window.confirm('Are you sure you want to approve this tender? First milestone funds will be released to contractor.')) {
      return;
    }

    try {
      setProcessing(true);
      
      const simulatedTxHash = '0x' + Array.from({ length: 64 }, () => 
        Math.floor(Math.random() * 16).toString(16)
      ).join('');

      await axios.post(`${API}/supervisor/approve-tender`, {
        project_id: tender.project_id,
        tender_id: tender.id,
        supervisor_address: user.address,
        tx_hash: simulatedTxHash,
        approved_at: new Date().toISOString()
      });

      toast.success('Tender approved successfully!', {
        description: 'First milestone funds will be released to contractor'
      });

      // Remove from pending list
      setPendingTenders(prev => prev.filter(t => t.id !== tender.id));
      setViewModalOpen(false);
      setSelectedTender(null);
    } catch (error) {
      console.error('Error approving tender:', error);
      toast.error('Failed to approve tender');
    } finally {
      setProcessing(false);
    }
  };

  const handleReject = async () => {
    if (!rejectionReason.trim()) {
      toast.error('Please provide a reason for rejection');
      return;
    }

    try {
      setProcessing(true);

      await axios.post(`${API}/supervisor/reject-tender`, {
        project_id: selectedTender.project_id,
        tender_id: selectedTender.id,
        supervisor_address: user.address,
        rejection_reason: rejectionReason,
        rejected_at: new Date().toISOString()
      });

      toast.success('Tender rejected', {
        description: 'Admin will be notified with your feedback'
      });

      // Remove from pending list
      setPendingTenders(prev => prev.filter(t => t.id !== selectedTender.id));
      setRejectModalOpen(false);
      setViewModalOpen(false);
      setSelectedTender(null);
      setRejectionReason('');
    } catch (error) {
      console.error('Error rejecting tender:', error);
      toast.error('Failed to reject tender');
    } finally {
      setProcessing(false);
    }
  };

  const handleFileView = (file) => {
    // Check if it's a PDF file - use SecurePDFViewer for PDFs
    const isPDF = file.type === 'application/pdf' || file.name?.toLowerCase().endsWith('.pdf');
    
    if (isPDF) {
      setPdfViewerOpen(true);
      setViewingFile(file);
    } else {
      setViewingFile(file);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse text-slate-400">Loading pending tenders...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-6 animate-fade-in">
        <div className="text-center space-y-2">
          <h1 className="text-4xl font-bold text-white" style={{fontFamily: 'Space Grotesk'}}>
            Tender Approval Dashboard
          </h1>
          <p className="text-lg text-slate-400">
            Review anonymous tender submissions and approve/reject projects
          </p>
          <div className="inline-block px-4 py-2 rounded-full bg-blue-500/10 border border-blue-500/30">
            <span className="text-sm text-blue-400">🔒 Anonymous Review • Contractor Identity Hidden</span>
          </div>
        </div>

        {/* Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="glass-effect border-slate-700">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-400">Pending Tenders</p>
                  <p className="text-3xl font-bold text-white">{pendingTenders.length}</p>
                </div>
                <AlertCircle className="w-10 h-10 text-amber-400" />
              </div>
            </CardContent>
          </Card>
          <Card className="glass-effect border-slate-700">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-400">Total Value</p>
                  <p className="text-3xl font-bold text-green-400">
                    {formatCurrency(pendingTenders.reduce((sum, t) => sum + (t.budget || 0), 0))}
                  </p>
                </div>
                <FileText className="w-10 h-10 text-green-400" />
              </div>
            </CardContent>
          </Card>
          <Card className="glass-effect border-slate-700">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-400">Your Role</p>
                  <p className="text-2xl font-bold text-blue-400">Supervisor</p>
                </div>
                <CheckCircle2 className="w-10 h-10 text-blue-400" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Pending Tenders List */}
        <div className="space-y-4">
          <h2 className="text-2xl font-bold text-white">Pending Tender Approvals</h2>
          
          {pendingTenders.length === 0 ? (
            <Card className="glass-effect border-slate-700">
              <CardContent className="py-12 text-center">
                <CheckCircle2 className="w-16 h-16 text-slate-600 mx-auto mb-4" />
                <p className="text-slate-400 text-lg">No pending tenders to review</p>
                <p className="text-slate-500 text-sm mt-2">All caught up! New submissions will appear here.</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 gap-6">
              {pendingTenders.map((tender, index) => (
                <Card key={tender.id} className="glass-effect border-slate-700 hover-glow">
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div className="space-y-2 flex-1">
                        <CardTitle className="text-2xl text-white">
                          Anonymous Tender #{tender.id}
                        </CardTitle>
                        <div className="flex items-center space-x-4 text-sm text-slate-400">
                          <span className="flex items-center">
                            <MapPin className="w-4 h-4 mr-1" />
                            {tender.location}
                          </span>
                          <span className="px-2 py-1 rounded-full bg-purple-500/20 text-purple-400 border border-purple-500/30">
                            {tender.category}
                          </span>
                        </div>
                        <p className="text-slate-400 mt-2">{tender.description}</p>
                      </div>
                      <div className="text-right space-y-2">
                        <div className="text-2xl font-bold text-green-400">
                          {formatCurrency(tender.budget)}
                        </div>
                        <span className="inline-block px-3 py-1 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/30 text-sm">
                          Pending Review
                        </span>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {/* Document Counts */}
                      <div className="flex items-center space-x-6 text-sm">
                        <div className="flex items-center space-x-2">
                          <FileText className="w-4 h-4 text-blue-400" />
                          <span className="text-slate-300">
                            {tender.tender_documents?.length || 0} Tender Documents
                          </span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <ImageIcon className="w-4 h-4 text-purple-400" />
                          <span className="text-slate-300">
                            {tender.design_files?.length || 0} Design Files
                          </span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <MapPin className="w-4 h-4 text-green-400" />
                          <span className="text-slate-300">
                            {tender.geo_tagged_photos?.length || 0} Site Photos
                          </span>
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div className="flex space-x-3 pt-4 border-t border-slate-700">
                        <Button
                          onClick={() => handleViewTender(tender)}
                          className="flex-1 bg-blue-500 hover:bg-blue-600"
                        >
                          <Eye className="w-4 h-4 mr-2" />
                          Review Tender Documents
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* View Tender Modal */}
        <Dialog open={viewModalOpen} onOpenChange={setViewModalOpen}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-slate-900 border-slate-700">
            <DialogHeader>
              <DialogTitle className="text-2xl text-white">Anonymous Tender Review</DialogTitle>
              <DialogDescription className="text-slate-400">
                Review all documents carefully. Contractor identity is hidden to ensure fair evaluation.
              </DialogDescription>
            </DialogHeader>

            {selectedTender && (
              <div className="space-y-6">
                {/* Project Info (Without Contractor Name) */}
                <Card className="bg-slate-800/50 border-slate-700">
                  <CardContent className="pt-6 space-y-3">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-slate-400">Location:</span>
                        <span className="text-white ml-2">{selectedTender.location}</span>
                      </div>
                      <div>
                        <span className="text-slate-400">Category:</span>
                        <span className="text-white ml-2">{selectedTender.category}</span>
                      </div>
                      <div>
                        <span className="text-slate-400">Budget:</span>
                        <span className="text-green-400 ml-2 font-semibold">{formatCurrency(selectedTender.budget)}</span>
                      </div>
                      <div>
                        <span className="text-slate-400">Project ID:</span>
                        <span className="text-white ml-2">#{selectedTender.project_id}</span>
                      </div>
                    </div>
                    <div>
                      <span className="text-slate-400">Description:</span>
                      <p className="text-white mt-1">{selectedTender.description}</p>
                    </div>
                  </CardContent>
                </Card>

                {/* Tender Documents */}
                {selectedTender.tender_documents?.length > 0 && (
                  <div className="space-y-3">
                    <h3 className="text-lg font-semibold text-white flex items-center">
                      <FileText className="w-5 h-5 mr-2 text-blue-400" />
                      Tender Documents (View Only)
                    </h3>
                    <div className="space-y-2">
                      {selectedTender.tender_documents.map((file, index) => (
                        <div key={index} className="flex items-center justify-between p-4 bg-slate-800/50 border border-slate-700 rounded-lg">
                          <div className="flex items-center space-x-3 flex-1">
                            <FileText className="w-6 h-6 text-blue-400" />
                            <div className="flex-1">
                              <p className="text-sm text-white font-medium">{file.name}</p>
                              <p className="text-xs text-slate-500 font-mono">IPFS: {file.ipfsHash}</p>
                            </div>
                          </div>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleFileView(file)}
                            className="border-blue-500 text-blue-400 hover:bg-blue-500/20"
                          >
                            <Eye className="w-4 h-4 mr-1" />
                            View
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Design Files */}
                {selectedTender.design_files?.length > 0 && (
                  <div className="space-y-3">
                    <h3 className="text-lg font-semibold text-white flex items-center">
                      <ImageIcon className="w-5 h-5 mr-2 text-purple-400" />
                      Design Files & Plans
                    </h3>
                    <div className="grid grid-cols-3 gap-3">
                      {selectedTender.design_files.map((file, index) => (
                        <div key={index} className="relative group">
                          {file.type?.startsWith('image/') ? (
                            <div className="relative cursor-pointer" onClick={() => handleFileView(file)}>
                              <img
                                src={file.url}
                                alt={file.name}
                                className="w-full h-32 object-cover rounded-lg border border-slate-700"
                              />
                              <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center">
                                <Eye className="w-8 h-8 text-white" />
                              </div>
                            </div>
                          ) : (
                            <div className="flex items-center p-3 bg-slate-800/50 border border-slate-700 rounded-lg">
                              <FileText className="w-5 h-5 text-purple-400 mr-2" />
                              <p className="text-xs text-white truncate">{file.name}</p>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Geo-Tagged Photos */}
                {selectedTender.geo_tagged_photos?.length > 0 && (
                  <div className="space-y-3">
                    <h3 className="text-lg font-semibold text-white flex items-center">
                      <MapPin className="w-5 h-5 mr-2 text-green-400" />
                      Site Photos (GPS Tagged)
                    </h3>
                    <div className="grid grid-cols-4 gap-3">
                      {selectedTender.geo_tagged_photos.map((file, index) => (
                        <div key={index} className="relative group cursor-pointer" onClick={() => handleFileView(file)}>
                          <img
                            src={file.url}
                            alt={file.name}
                            className="w-full h-24 object-cover rounded-lg border border-slate-700"
                          />
                          <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center">
                            <Eye className="w-6 h-6 text-white" />
                          </div>
                          <div className="absolute top-1 right-1">
                            <div className="bg-green-500/80 backdrop-blur-sm rounded px-1.5 py-0.5 flex items-center space-x-1">
                              <MapPin className="w-3 h-3 text-white" />
                              <span className="text-xs text-white">GPS</span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Warning Note */}
                <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-4">
                  <div className="flex items-start space-x-3">
                    <AlertCircle className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
                    <div className="space-y-1">
                      <p className="text-sm font-medium text-amber-400">Important Notice</p>
                      <p className="text-xs text-amber-300">
                        • Contractor identity is hidden to ensure unbiased evaluation<br />
                        • Download is disabled - review documents in browser only<br />
                        • Approval will release first milestone funds automatically<br />
                        • Rejection requires detailed feedback for admin
                      </p>
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex space-x-3 pt-4">
                  <Button
                    onClick={() => {
                      setRejectModalOpen(true);
                    }}
                    variant="outline"
                    className="flex-1 border-red-500 text-red-400 hover:bg-red-500/20"
                    disabled={processing}
                  >
                    <XCircle className="w-4 h-4 mr-2" />
                    Reject Tender
                  </Button>
                  <Button
                    onClick={() => handleApprove(selectedTender)}
                    className="flex-1 bg-green-500 hover:bg-green-600"
                    disabled={processing}
                  >
                    {processing ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Processing...
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="w-4 h-4 mr-2" />
                        Approve & Release Funds
                      </>
                    )}
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Rejection Reason Modal */}
        <Dialog open={rejectModalOpen} onOpenChange={setRejectModalOpen}>
          <DialogContent className="bg-slate-900 border-slate-700">
            <DialogHeader>
              <DialogTitle className="text-xl text-white">Rejection Reason Required</DialogTitle>
              <DialogDescription className="text-slate-400">
                Please provide detailed feedback for the admin. This will help improve future submissions.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label className="text-slate-300">Why are you rejecting this tender?</Label>
                <Textarea
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  placeholder="E.g., Incomplete documentation, budget not justified, design doesn't meet requirements..."
                  rows={6}
                  className="bg-slate-800 border-slate-700 text-white placeholder:text-slate-500 resize-none"
                />
              </div>
              <div className="flex space-x-3">
                <Button
                  variant="outline"
                  onClick={() => {
                    setRejectModalOpen(false);
                    setRejectionReason('');
                  }}
                  className="flex-1 border-slate-700"
                  disabled={processing}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleReject}
                  className="flex-1 bg-red-500 hover:bg-red-600"
                  disabled={processing || !rejectionReason.trim()}
                >
                  {processing ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Submitting...
                    </>
                  ) : (
                    'Submit Rejection'
                  )}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* File Viewer Modal */}
        {viewingFile && pdfViewerOpen && (
          <SecurePDFViewer
            fileUrl={viewingFile.url}
            fileName={viewingFile.name}
            onClose={() => {
              setPdfViewerOpen(false);
              setViewingFile(null);
            }}
            isAnonymous={true}
          />
        )}

        {/* Image/Other File Viewer Modal */}
        {viewingFile && !pdfViewerOpen && (
          <Dialog open={!!viewingFile} onOpenChange={() => setViewingFile(null)}>
            <DialogContent className="max-w-5xl max-h-[90vh] bg-slate-900 border-slate-700">
              <DialogHeader>
                <DialogTitle className="text-white">{viewingFile.name}</DialogTitle>
                <DialogDescription className="text-slate-400 font-mono text-xs">
                  {viewingFile.ipfsHash && `IPFS: ${viewingFile.ipfsHash}`}
                </DialogDescription>
              </DialogHeader>
              <div className="flex items-center justify-center bg-slate-950 rounded-lg p-4" style={{minHeight: '60vh'}}>
                {viewingFile.type?.startsWith('image/') ? (
                  <img
                    src={viewingFile.url}
                    alt={viewingFile.name}
                    className="max-w-full max-h-[70vh] object-contain"
                  />
                ) : (
                  <div className="text-center space-y-4">
                    <FileText className="w-20 h-20 text-slate-600 mx-auto" />
                    <p className="text-slate-400">Document preview not available</p>
                    <p className="text-xs text-slate-500">View-only mode • Download disabled</p>
                  </div>
                )}
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>
    </div>
  );
};

export default SupervisorApproval;
