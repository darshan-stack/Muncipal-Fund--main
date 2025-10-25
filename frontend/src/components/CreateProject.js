import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { Label } from './ui/label';
import { ArrowLeft, Loader2, Upload, X, FileText, Image as ImageIcon, MapPin } from 'lucide-react';
import { toast } from 'sonner';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const CreateProject = ({ account, signer }) => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category: 'Infrastructure',
    location: '',
    budget: '',
    duration: '',
    contractorName: '',
    contractorAddress: '',
    milestones: '',
    documents: ''
  });

  const [uploadedFiles, setUploadedFiles] = useState({
    tenderDocuments: [],
    designFiles: [],
    geoTaggedPhotos: [],
    expectedQualityReport: []
  });

  const [filePreviews, setFilePreviews] = useState({
    tenderDocuments: [],
    designFiles: [],
    geoTaggedPhotos: [],
    expectedQualityReport: []
  });

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleFileUpload = async (e, fileType) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    // Simulate IPFS upload (in production, use actual IPFS)
    const simulatedIPFSHashes = files.map((file, index) => ({
      name: file.name,
      size: file.size,
      type: file.type,
      ipfsHash: `Qm${Math.random().toString(36).substring(2, 15)}${Math.random().toString(36).substring(2, 15)}`,
      url: URL.createObjectURL(file),
      uploadedAt: new Date().toISOString()
    }));

    setUploadedFiles(prev => ({
      ...prev,
      [fileType]: [...prev[fileType], ...simulatedIPFSHashes]
    }));

    setFilePreviews(prev => ({
      ...prev,
      [fileType]: [...prev[fileType], ...simulatedIPFSHashes]
    }));

    toast.success(`${files.length} file(s) uploaded successfully!`, {
      description: 'Files uploaded to IPFS'
    });
  };

  const removeFile = (fileType, index) => {
    setUploadedFiles(prev => ({
      ...prev,
      [fileType]: prev[fileType].filter((_, i) => i !== index)
    }));
    setFilePreviews(prev => ({
      ...prev,
      [fileType]: prev[fileType].filter((_, i) => i !== index)
    }));
    toast.info('File removed');
  };

  const handleSubmit = async (e, sendToSupervisor = false) => {
    e.preventDefault();

    if (!formData.name || !formData.description || !formData.budget || !formData.location) {
      toast.error('Please fill all required fields');
      return;
    }

    if (parseFloat(formData.budget) <= 0) {
      toast.error('Budget must be greater than 0');
      return;
    }

    if (sendToSupervisor && uploadedFiles.tenderDocuments.length === 0) {
      toast.error('Please upload at least one tender document before sending to supervisor');
      return;
    }

    try {
      setLoading(true);

      // For MVP, we'll create a simulated transaction hash
      const simulatedTxHash = '0x' + Array.from({ length: 64 }, () => 
        Math.floor(Math.random() * 16).toString(16)
      ).join('');

      toast.info(sendToSupervisor ? 'Creating project and sending to supervisor...' : 'Creating project on blockchain...');

      // Simulate blockchain transaction delay
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Create project in backend
      const response = await axios.post(`${API}/projects`, {
        name: formData.name,
        description: formData.description,
        category: formData.category,
        location: formData.location,
        budget: parseFloat(formData.budget),
        duration: formData.duration,
        contractor_name: formData.contractorName,
        contractor_address: formData.contractorAddress,
        milestones: formData.milestones,
        documents: formData.documents,
        manager_address: account || '0xDemo',
        tx_hash: simulatedTxHash,
        contract_project_id: Math.floor(Math.random() * 10000),
        tender_documents: uploadedFiles.tenderDocuments,
        design_files: uploadedFiles.designFiles,
        geo_tagged_photos: uploadedFiles.geoTaggedPhotos,
        expected_quality_report: uploadedFiles.expectedQualityReport,
        status: sendToSupervisor ? 'PendingSupervisorApproval' : 'Created',
        sent_to_supervisor: sendToSupervisor,
        submitted_at: new Date().toISOString()
      });

      if (sendToSupervisor) {
        // Send anonymous tender to supervisor
        await axios.post(`${API}/supervisor/tenders`, {
          project_id: response.data.id,
          tender_documents: uploadedFiles.tenderDocuments,
          design_files: uploadedFiles.designFiles,
          geo_tagged_photos: uploadedFiles.geoTaggedPhotos,
          tx_hash: simulatedTxHash,
          budget: parseFloat(formData.budget),
          location: formData.location,
          category: formData.category,
          description: formData.description,
          // Contractor name is NOT sent to supervisor (anonymous)
        });

        toast.success('Project created and sent to supervisor for approval!', {
          description: 'Supervisor will review tender documents anonymously'
        });
      } else {
        toast.success('Project created successfully!', {
          description: 'Redirecting to Polygonscan...'
        });
      }
      
      // Redirect to Polygonscan (or demo page in DEMO mode)
      const polygonscanUrl = `https://polygonscan.com/tx/${simulatedTxHash}`;
      
      // Show modal with Polygonscan link
      toast.success(
        <div className="space-y-2">
          <p>View on Polygonscan:</p>
          <a 
            href={polygonscanUrl} 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-blue-400 hover:underline text-sm break-all"
          >
            {simulatedTxHash}
          </a>
        </div>,
        { duration: 10000 }
      );
      
      // Navigate to project details after short delay
      setTimeout(() => {
        navigate(`/project/${response.data.id}`);
      }, 2000);
      
    } catch (error) {
      console.error('Error creating project:', error);
      toast.error('Failed to create project');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto space-y-6 animate-fade-in">
        <Button
          onClick={() => navigate('/')}
          variant="ghost"
          className="text-slate-400 hover:text-white"
          data-testid="back-btn"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Dashboard
        </Button>

        <Card className="glass-effect border-slate-700">
          <CardHeader>
            <CardTitle className="text-3xl text-white" style={{fontFamily: 'Space Grotesk'}}>
              Create New Project
            </CardTitle>
            <CardDescription className="text-slate-400">
              Initialize a new municipal project on the blockchain
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Basic Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-white">Basic Information</h3>
                
                <div className="space-y-2">
                  <Label htmlFor="name" className="text-slate-300">Project Name *</Label>
                  <Input
                    id="name"
                    name="name"
                    placeholder="e.g., Community Park Development"
                    value={formData.name}
                    onChange={handleChange}
                    className="bg-slate-800/50 border-slate-700 text-white placeholder:text-slate-500"
                    data-testid="project-name-input"
                    required
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="category" className="text-slate-300">Category *</Label>
                    <select
                      id="category"
                      name="category"
                      value={formData.category}
                      onChange={handleChange}
                      className="w-full px-3 py-2 bg-slate-800/50 border border-slate-700 rounded-md text-white"
                      data-testid="project-category-select"
                      required
                    >
                      <option value="Infrastructure">Infrastructure</option>
                      <option value="Education">Education</option>
                      <option value="Healthcare">Healthcare</option>
                      <option value="Environment">Environment</option>
                      <option value="Transportation">Transportation</option>
                      <option value="Public Safety">Public Safety</option>
                      <option value="Community Services">Community Services</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="location" className="text-slate-300">Location *</Label>
                    <Input
                      id="location"
                      name="location"
                      placeholder="e.g., Mumbai, Maharashtra"
                      value={formData.location}
                      onChange={handleChange}
                      className="bg-slate-800/50 border-slate-700 text-white placeholder:text-slate-500"
                      data-testid="project-location-input"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description" className="text-slate-300">Description *</Label>
                  <Textarea
                    id="description"
                    name="description"
                    placeholder="Describe the project objectives, scope, and expected outcomes..."
                    value={formData.description}
                    onChange={handleChange}
                    rows={4}
                    className="bg-slate-800/50 border-slate-700 text-white placeholder:text-slate-500 resize-none"
                    data-testid="project-description-input"
                    required
                  />
                </div>
              </div>

              {/* Financial Details */}
              <div className="space-y-4 pt-4 border-t border-slate-700">
                <h3 className="text-lg font-semibold text-white">Financial Details</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="budget" className="text-slate-300">Total Budget (USD) *</Label>
                    <Input
                      id="budget"
                      name="budget"
                      type="number"
                      min="0"
                      step="0.01"
                      placeholder="e.g., 1000000"
                      value={formData.budget}
                      onChange={handleChange}
                      className="bg-slate-800/50 border-slate-700 text-white placeholder:text-slate-500"
                      data-testid="project-budget-input"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="duration" className="text-slate-300">Project Duration (months)</Label>
                    <Input
                      id="duration"
                      name="duration"
                      type="number"
                      min="1"
                      placeholder="e.g., 12"
                      value={formData.duration}
                      onChange={handleChange}
                      className="bg-slate-800/50 border-slate-700 text-white placeholder:text-slate-500"
                      data-testid="project-duration-input"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="milestones" className="text-slate-300">Planned Milestones</Label>
                  <Textarea
                    id="milestones"
                    name="milestones"
                    placeholder="List major milestones (e.g., Site preparation, Foundation work, Main construction, Finishing)"
                    value={formData.milestones}
                    onChange={handleChange}
                    rows={3}
                    className="bg-slate-800/50 border-slate-700 text-white placeholder:text-slate-500 resize-none"
                    data-testid="project-milestones-input"
                  />
                </div>
              </div>

              {/* Contractor Information */}
              <div className="space-y-4 pt-4 border-t border-slate-700">
                <h3 className="text-lg font-semibold text-white">Contractor Information</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="contractorName" className="text-slate-300">Contractor Name</Label>
                    <Input
                      id="contractorName"
                      name="contractorName"
                      placeholder="e.g., ABC Construction Pvt. Ltd."
                      value={formData.contractorName}
                      onChange={handleChange}
                      className="bg-slate-800/50 border-slate-700 text-white placeholder:text-slate-500"
                      data-testid="contractor-name-input"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="contractorAddress" className="text-slate-300">Contractor Wallet Address</Label>
                    <Input
                      id="contractorAddress"
                      name="contractorAddress"
                      placeholder="0x..."
                      value={formData.contractorAddress}
                      onChange={handleChange}
                      className="bg-slate-800/50 border-slate-700 text-white placeholder:text-slate-500 font-mono text-sm"
                      data-testid="contractor-address-input"
                    />
                  </div>
                </div>
              </div>

              {/* Documents Upload */}
              <div className="space-y-6 pt-4 border-t border-slate-700">
                <h3 className="text-lg font-semibold text-white">Document Uploads</h3>
                
                {/* Tender Documents */}
                <div className="space-y-3">
                  <Label className="text-slate-300 flex items-center">
                    <FileText className="w-4 h-4 mr-2 text-blue-400" />
                    Tender Documents *
                  </Label>
                  <div className="flex items-center space-x-3">
                    <Input
                      type="file"
                      multiple
                      accept=".pdf,.doc,.docx"
                      onChange={(e) => handleFileUpload(e, 'tenderDocuments')}
                      className="hidden"
                      id="tender-upload"
                    />
                    <Label
                      htmlFor="tender-upload"
                      className="flex items-center justify-center px-4 py-2 border-2 border-dashed border-slate-600 rounded-lg hover:border-blue-500 cursor-pointer transition-colors bg-slate-800/30"
                    >
                      <Upload className="w-5 h-5 mr-2 text-blue-400" />
                      <span className="text-sm text-slate-300">Upload Tender Documents</span>
                    </Label>
                    <span className="text-xs text-slate-500">PDF, DOC, DOCX</span>
                  </div>
                  {uploadedFiles.tenderDocuments.length > 0 && (
                    <div className="space-y-2 mt-3">
                      {uploadedFiles.tenderDocuments.map((file, index) => (
                        <div key={index} className="flex items-center justify-between p-3 bg-slate-800/50 border border-slate-700 rounded-lg">
                          <div className="flex items-center space-x-3 flex-1">
                            <FileText className="w-5 h-5 text-blue-400" />
                            <div className="flex-1 min-w-0">
                              <p className="text-sm text-white truncate">{file.name}</p>
                              <p className="text-xs text-slate-500 font-mono">IPFS: {file.ipfsHash.substring(0, 20)}...</p>
                            </div>
                            <span className="text-xs text-slate-500">{(file.size / 1024).toFixed(1)} KB</span>
                          </div>
                          <button
                            type="button"
                            onClick={() => removeFile('tenderDocuments', index)}
                            className="ml-3 p-1 hover:bg-red-500/20 rounded text-red-400"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Design Files */}
                <div className="space-y-3">
                  <Label className="text-slate-300 flex items-center">
                    <ImageIcon className="w-4 h-4 mr-2 text-purple-400" />
                    Design Files & Plans
                  </Label>
                  <div className="flex items-center space-x-3">
                    <Input
                      type="file"
                      multiple
                      accept=".pdf,.dwg,.png,.jpg,.jpeg"
                      onChange={(e) => handleFileUpload(e, 'designFiles')}
                      className="hidden"
                      id="design-upload"
                    />
                    <Label
                      htmlFor="design-upload"
                      className="flex items-center justify-center px-4 py-2 border-2 border-dashed border-slate-600 rounded-lg hover:border-purple-500 cursor-pointer transition-colors bg-slate-800/30"
                    >
                      <Upload className="w-5 h-5 mr-2 text-purple-400" />
                      <span className="text-sm text-slate-300">Upload Design Files</span>
                    </Label>
                    <span className="text-xs text-slate-500">PDF, DWG, Images</span>
                  </div>
                  {uploadedFiles.designFiles.length > 0 && (
                    <div className="grid grid-cols-2 gap-3 mt-3">
                      {uploadedFiles.designFiles.map((file, index) => (
                        <div key={index} className="relative group">
                          {file.type.startsWith('image/') ? (
                            <div className="relative">
                              <img
                                src={file.url}
                                alt={file.name}
                                className="w-full h-32 object-cover rounded-lg border border-slate-700"
                              />
                              <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center">
                                <button
                                  type="button"
                                  onClick={() => removeFile('designFiles', index)}
                                  className="p-2 bg-red-500 rounded-full text-white hover:bg-red-600"
                                >
                                  <X className="w-4 h-4" />
                                </button>
                              </div>
                              <div className="absolute bottom-0 left-0 right-0 p-2 bg-gradient-to-t from-black/80 to-transparent">
                                <p className="text-xs text-white truncate">{file.name}</p>
                              </div>
                            </div>
                          ) : (
                            <div className="flex items-center justify-between p-3 bg-slate-800/50 border border-slate-700 rounded-lg">
                              <div className="flex items-center space-x-2 flex-1">
                                <FileText className="w-4 h-4 text-purple-400" />
                                <p className="text-xs text-white truncate">{file.name}</p>
                              </div>
                              <button
                                type="button"
                                onClick={() => removeFile('designFiles', index)}
                                className="p-1 hover:bg-red-500/20 rounded text-red-400"
                              >
                                <X className="w-3 h-3" />
                              </button>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Geo-Tagged Photos */}
                <div className="space-y-3">
                  <Label className="text-slate-300 flex items-center">
                    <MapPin className="w-4 h-4 mr-2 text-green-400" />
                    Geo-Tagged Site Photos
                  </Label>
                  <div className="flex items-center space-x-3">
                    <Input
                      type="file"
                      multiple
                      accept="image/*"
                      onChange={(e) => handleFileUpload(e, 'geoTaggedPhotos')}
                      className="hidden"
                      id="photo-upload"
                    />
                    <Label
                      htmlFor="photo-upload"
                      className="flex items-center justify-center px-4 py-2 border-2 border-dashed border-slate-600 rounded-lg hover:border-green-500 cursor-pointer transition-colors bg-slate-800/30"
                    >
                      <Upload className="w-5 h-5 mr-2 text-green-400" />
                      <span className="text-sm text-slate-300">Upload Site Photos</span>
                    </Label>
                    <span className="text-xs text-slate-500">JPG, PNG with GPS data</span>
                  </div>
                  {uploadedFiles.geoTaggedPhotos.length > 0 && (
                    <div className="grid grid-cols-3 gap-3 mt-3">
                      {uploadedFiles.geoTaggedPhotos.map((file, index) => (
                        <div key={index} className="relative group">
                          <img
                            src={file.url}
                            alt={file.name}
                            className="w-full h-24 object-cover rounded-lg border border-slate-700"
                          />
                          <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center">
                            <button
                              type="button"
                              onClick={() => removeFile('geoTaggedPhotos', index)}
                              className="p-2 bg-red-500 rounded-full text-white hover:bg-red-600"
                            >
                              <X className="w-4 h-4" />
                            </button>
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
                  )}
                </div>

                {/* Expected Quality Report Template */}
                <div className="space-y-3">
                  <Label className="text-slate-300 flex items-center">
                    <FileText className="w-4 h-4 mr-2 text-yellow-400" />
                    Expected Quality Report Template
                    <span className="ml-2 text-xs text-yellow-400">(Required for project completion)</span>
                  </Label>
                  <p className="text-xs text-slate-400">
                    Upload the quality standards and report format that the contractor must submit after completing all 5 milestones (100%). 
                    Contractor cannot apply for new tenders until quality report is submitted.
                  </p>
                  <div className="flex items-center space-x-3">
                    <Input
                      type="file"
                      multiple
                      accept=".pdf,.doc,.docx"
                      onChange={(e) => handleFileUpload(e, 'expectedQualityReport')}
                      className="hidden"
                      id="quality-upload"
                    />
                    <Label
                      htmlFor="quality-upload"
                      className="flex items-center justify-center px-4 py-2 border-2 border-dashed border-slate-600 rounded-lg hover:border-yellow-500 cursor-pointer transition-colors bg-slate-800/30"
                    >
                      <Upload className="w-5 h-5 mr-2 text-yellow-400" />
                      <span className="text-sm text-slate-300">Upload Quality Standards</span>
                    </Label>
                    <span className="text-xs text-slate-500">PDF, DOC, DOCX</span>
                  </div>
                  {uploadedFiles.expectedQualityReport.length > 0 && (
                    <div className="space-y-2 mt-3">
                      {uploadedFiles.expectedQualityReport.map((file, index) => (
                        <div key={index} className="flex items-center justify-between p-3 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
                          <div className="flex items-center space-x-3 flex-1 min-w-0">
                            <FileText className="w-5 h-5 text-yellow-400 flex-shrink-0" />
                            <div className="flex-1 min-w-0">
                              <p className="text-sm text-slate-200 truncate">{file.name}</p>
                              <div className="flex items-center space-x-2 mt-1">
                                <span className="text-xs text-slate-400">{file.size}</span>
                                <span className="text-xs text-yellow-400 font-mono">
                                  IPFS: {file.ipfsHash}
                                </span>
                              </div>
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => removeFile('expectedQualityReport', index)}
                            className="ml-3 p-1.5 bg-red-500/20 rounded-lg text-red-400 hover:bg-red-500/30 flex-shrink-0"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="space-y-2 mt-4">
                  <Label htmlFor="documents" className="text-slate-300">Additional Document Links/IPFS Hashes (Optional)</Label>
                  <Textarea
                    id="documents"
                    name="documents"
                    placeholder="Paste additional IPFS hashes or document links (one per line)"
                    value={formData.documents}
                    onChange={handleChange}
                    rows={2}
                    className="bg-slate-800/50 border-slate-700 text-white placeholder:text-slate-500 resize-none font-mono text-sm"
                    data-testid="project-documents-input"
                  />
                </div>
              </div>

              {/* Project Manager */}
              <div className="bg-slate-800/30 border border-slate-700 rounded-lg p-4 space-y-2">
                <p className="text-sm font-medium text-slate-300">Project Manager (Your Address)</p>
                <p className="text-xs font-mono text-slate-400 break-all" data-testid="manager-address">
                  {account || '0xDemo (Connect wallet to see your address)'}
                </p>
              </div>

              {/* Action Buttons */}
              <div className="space-y-4 pt-4">
                <div className="flex space-x-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => navigate('/')}
                    className="flex-1 border-slate-700 hover:bg-slate-800"
                    disabled={loading}
                    data-testid="cancel-btn"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    onClick={(e) => handleSubmit(e, false)}
                    className="flex-1 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white"
                    disabled={loading}
                    data-testid="submit-project-btn"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Creating on Blockchain...
                      </>
                    ) : (
                      'Create Project'
                    )}
                  </Button>
                </div>
                
                {/* Send to Supervisor Button */}
                <Button
                  type="button"
                  onClick={(e) => handleSubmit(e, true)}
                  className="w-full bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white"
                  disabled={loading || uploadedFiles.tenderDocuments.length === 0}
                  data-testid="send-to-supervisor-btn"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Sending to Supervisor...
                    </>
                  ) : (
                    <>
                      <FileText className="w-4 h-4 mr-2" />
                      Create & Send to Supervisor for Approval
                    </>
                  )}
                </Button>
                {uploadedFiles.tenderDocuments.length === 0 && (
                  <p className="text-xs text-amber-400 text-center">
                    ⚠️ Upload tender documents to send for supervisor approval
                  </p>
                )}
              </div>
            </form>
          </CardContent>
        </Card>

        <Card className="glass-effect border-slate-700 border-blue-500/30">
          <CardContent className="pt-6">
            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-500/20 flex items-center justify-center">
                <span className="text-blue-400 text-sm">ℹ</span>
              </div>
              <div className="space-y-1">
                <p className="text-sm font-medium text-slate-300">Blockchain Transaction</p>
                <p className="text-xs text-slate-400">
                  Creating a project will initiate a blockchain transaction. Make sure you have enough test MATIC in your wallet for gas fees.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default CreateProject;