import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { Label } from './ui/label';
import {
  FileText,
  Upload,
  X,
  CheckCircle2,
  AlertTriangle,
  Loader2,
  Award,
  Lock
} from 'lucide-react';
import { toast } from 'sonner';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const QualityReportSubmission = ({ projectId, contractorAddress }) => {
  const [milestones, setMilestones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [reportFiles, setReportFiles] = useState([]);
  const [qualityMetrics, setQualityMetrics] = useState({
    structuralIntegrity: '',
    materialQuality: '',
    safetyCompliance: '',
    timelineAdherence: '',
    budgetUtilization: ''
  });
  const [complianceChecklist, setComplianceChecklist] = useState({
    allPermitsObtained: false,
    safetyInspectionsPassed: false,
    environmentalCompliance: false,
    qualityStandardsMet: false,
    documentationComplete: false
  });
  const [notes, setNotes] = useState('');
  const [canSubmit, setCanSubmit] = useState(false);
  const [existingReport, setExistingReport] = useState(null);

  useEffect(() => {
    fetchMilestones();
    checkExistingReport();
  }, [projectId]);

  const fetchMilestones = async () => {
    try {
      const response = await axios.get(`${API}/projects/${projectId}/milestones`);
      const milestonesData = response.data.milestones || [];
      setMilestones(milestonesData);
      
      // Check if all 5 milestones are completed
      const allCompleted = milestonesData.length === 5 && 
        milestonesData.every(m => m.status === 'completed');
      setCanSubmit(allCompleted);
    } catch (error) {
      console.error('Error fetching milestones:', error);
    } finally {
      setLoading(false);
    }
  };

  const checkExistingReport = async () => {
    try {
      const response = await axios.get(`${API}/projects/${projectId}/quality-report`);
      if (response.data) {
        setExistingReport(response.data);
      }
    } catch (error) {
      // No existing report found, that's okay
    }
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
          type: file.type
        };
      })
    );

    setReportFiles([...reportFiles, ...newFiles]);
    toast.success(`${files.length} file(s) uploaded successfully`);
  };

  const removeFile = (index) => {
    setReportFiles(reportFiles.filter((_, i) => i !== index));
  };

  const handleMetricChange = (key, value) => {
    setQualityMetrics({
      ...qualityMetrics,
      [key]: value
    });
  };

  const handleChecklistChange = (key) => {
    setComplianceChecklist({
      ...complianceChecklist,
      [key]: !complianceChecklist[key]
    });
  };

  const validateForm = () => {
    if (reportFiles.length === 0) {
      toast.error('Please upload at least one quality report document');
      return false;
    }

    const allMetricsFilled = Object.values(qualityMetrics).every(v => v.trim() !== '');
    if (!allMetricsFilled) {
      toast.error('Please fill all quality metrics');
      return false;
    }

    const allChecklistCompleted = Object.values(complianceChecklist).every(v => v === true);
    if (!allChecklistCompleted) {
      toast.error('Please complete all compliance checklist items');
      return false;
    }

    if (!notes.trim()) {
      toast.error('Please provide project summary notes');
      return false;
    }

    return true;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    try {
      setSubmitting(true);

      await axios.post(`${API}/projects/${projectId}/quality-report`, {
        contractor_address: contractorAddress,
        report_files: reportFiles,
        quality_metrics: qualityMetrics,
        compliance_checklist: complianceChecklist,
        notes: notes,
        submitted_at: new Date().toISOString()
      });

      toast.success('Quality report submitted successfully!', {
        description: 'You can now apply for new tenders'
      });

      // Refresh to show submitted report
      await checkExistingReport();
    } catch (error) {
      console.error('Error submitting report:', error);
      toast.error('Failed to submit quality report');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <Card className="bg-slate-900 border-slate-800">
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <Loader2 className="w-6 h-6 animate-spin text-blue-400" />
            <span className="ml-2 text-slate-400">Loading...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Show existing report if already submitted
  if (existingReport) {
    return (
      <Card className="bg-gradient-to-br from-green-900/20 to-emerald-900/20 border-green-500/30">
        <CardHeader>
          <CardTitle className="text-white flex items-center">
            <Award className="w-5 h-5 mr-2 text-green-400" />
            Quality Report Submitted
          </CardTitle>
          <CardDescription className="text-green-300">
            Submitted on {new Date(existingReport.submitted_at).toLocaleString()}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-4">
            <CheckCircle2 className="w-12 h-12 text-green-400 mx-auto mb-3" />
            <p className="text-center text-green-300">
              ✅ Project completed successfully
            </p>
            <p className="text-center text-sm text-slate-400 mt-2">
              You are now eligible to apply for new tenders
            </p>
          </div>

          <div className="space-y-2">
            <Label className="text-slate-300">Submitted Files</Label>
            <div className="space-y-2">
              {existingReport.report_files?.map((file, index) => (
                <div key={index} className="p-3 bg-slate-800/50 border border-slate-700 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <FileText className="w-5 h-5 text-green-400" />
                    <div className="flex-1">
                      <p className="text-sm text-slate-200">{file.name}</p>
                      <p className="text-xs text-slate-500">IPFS: {file.ipfsHash}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Show submission form if not submitted
  return (
    <div className="space-y-6">
      {/* Status Check */}
      {!canSubmit && (
        <Card className="bg-yellow-900/20 border-yellow-500/30">
          <CardContent className="p-4">
            <div className="flex items-start space-x-3">
              <Lock className="w-5 h-5 text-yellow-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-yellow-400 font-semibold">Quality Report Locked</p>
                <p className="text-sm text-yellow-300 mt-1">
                  Complete all 5 milestones (100%) before submitting quality report.
                  Currently: {milestones.filter(m => m.status === 'completed').length}/5 completed
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Warning Banner */}
      <Card className="bg-red-900/20 border-red-500/30">
        <CardContent className="p-4">
          <div className="flex items-start space-x-3">
            <AlertTriangle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-red-400 font-semibold">Mandatory Quality Report</p>
              <p className="text-sm text-red-300 mt-1">
                ⚠️ You cannot apply for new tenders until this quality report is submitted. 
                This ensures accountability and maintains quality standards across all projects.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Quality Report Form */}
      <Card className="bg-slate-900 border-slate-800">
        <CardHeader>
          <CardTitle className="text-white flex items-center">
            <FileText className="w-5 h-5 mr-2 text-blue-400" />
            Final Quality Report Submission
          </CardTitle>
          <CardDescription className="text-slate-400">
            Complete project quality report (Required after 100% milestone completion)
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Upload Section */}
          <div className="space-y-3">
            <Label className="text-slate-300">Quality Report Documents *</Label>
            <p className="text-xs text-slate-400">
              Upload comprehensive reports including completion certificates, quality tests, inspection reports, etc.
            </p>
            <div className="flex items-center space-x-3">
              <Input
                type="file"
                multiple
                accept=".pdf,.doc,.docx"
                onChange={handleFileUpload}
                className="hidden"
                id="report-upload"
                disabled={!canSubmit}
              />
              <Label
                htmlFor="report-upload"
                className={`flex items-center justify-center px-4 py-2 border-2 border-dashed border-slate-600 rounded-lg ${
                  canSubmit ? 'hover:border-blue-500 cursor-pointer' : 'opacity-50 cursor-not-allowed'
                } transition-colors bg-slate-800/30`}
              >
                <Upload className="w-5 h-5 mr-2 text-blue-400" />
                <span className="text-sm text-slate-300">Upload Reports</span>
              </Label>
              <span className="text-xs text-slate-500">PDF, DOC, DOCX</span>
            </div>

            {reportFiles.length > 0 && (
              <div className="space-y-2 mt-3">
                {reportFiles.map((file, index) => (
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

          {/* Quality Metrics */}
          <div className="space-y-4">
            <Label className="text-slate-300">Quality Metrics *</Label>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-sm text-slate-400">Structural Integrity (0-100%)</Label>
                <Input
                  type="number"
                  min="0"
                  max="100"
                  value={qualityMetrics.structuralIntegrity}
                  onChange={(e) => handleMetricChange('structuralIntegrity', e.target.value)}
                  className="bg-slate-800/50 border-slate-700 text-white"
                  disabled={!canSubmit}
                  placeholder="95"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-sm text-slate-400">Material Quality (0-100%)</Label>
                <Input
                  type="number"
                  min="0"
                  max="100"
                  value={qualityMetrics.materialQuality}
                  onChange={(e) => handleMetricChange('materialQuality', e.target.value)}
                  className="bg-slate-800/50 border-slate-700 text-white"
                  disabled={!canSubmit}
                  placeholder="98"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-sm text-slate-400">Safety Compliance (0-100%)</Label>
                <Input
                  type="number"
                  min="0"
                  max="100"
                  value={qualityMetrics.safetyCompliance}
                  onChange={(e) => handleMetricChange('safetyCompliance', e.target.value)}
                  className="bg-slate-800/50 border-slate-700 text-white"
                  disabled={!canSubmit}
                  placeholder="100"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-sm text-slate-400">Timeline Adherence (0-100%)</Label>
                <Input
                  type="number"
                  min="0"
                  max="100"
                  value={qualityMetrics.timelineAdherence}
                  onChange={(e) => handleMetricChange('timelineAdherence', e.target.value)}
                  className="bg-slate-800/50 border-slate-700 text-white"
                  disabled={!canSubmit}
                  placeholder="92"
                />
              </div>
              <div className="space-y-2 col-span-2">
                <Label className="text-sm text-slate-400">Budget Utilization (0-100%)</Label>
                <Input
                  type="number"
                  min="0"
                  max="100"
                  value={qualityMetrics.budgetUtilization}
                  onChange={(e) => handleMetricChange('budgetUtilization', e.target.value)}
                  className="bg-slate-800/50 border-slate-700 text-white"
                  disabled={!canSubmit}
                  placeholder="96"
                />
              </div>
            </div>
          </div>

          {/* Compliance Checklist */}
          <div className="space-y-3">
            <Label className="text-slate-300">Compliance Checklist * (All must be checked)</Label>
            <div className="space-y-2">
              {[
                { key: 'allPermitsObtained', label: 'All required permits obtained and documented' },
                { key: 'safetyInspectionsPassed', label: 'Safety inspections passed successfully' },
                { key: 'environmentalCompliance', label: 'Environmental regulations complied with' },
                { key: 'qualityStandardsMet', label: 'Quality standards met as per specifications' },
                { key: 'documentationComplete', label: 'Complete documentation and as-built drawings provided' }
              ].map(item => (
                <label
                  key={item.key}
                  className={`flex items-center space-x-3 p-3 rounded-lg border transition-colors cursor-pointer ${
                    complianceChecklist[item.key]
                      ? 'bg-green-500/10 border-green-500/30'
                      : 'bg-slate-800/30 border-slate-700 hover:border-slate-600'
                  } ${!canSubmit ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  <input
                    type="checkbox"
                    checked={complianceChecklist[item.key]}
                    onChange={() => handleChecklistChange(item.key)}
                    disabled={!canSubmit}
                    className="w-4 h-4 rounded border-slate-600 bg-slate-800 text-green-500"
                  />
                  <span className={`text-sm ${complianceChecklist[item.key] ? 'text-green-300' : 'text-slate-300'}`}>
                    {item.label}
                  </span>
                  {complianceChecklist[item.key] && (
                    <CheckCircle2 className="w-4 h-4 text-green-400 ml-auto" />
                  )}
                </label>
              ))}
            </div>
          </div>

          {/* Project Summary Notes */}
          <div className="space-y-2">
            <Label className="text-slate-300">Project Summary & Notes *</Label>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Provide comprehensive summary of project execution, challenges faced, solutions implemented, and overall quality assessment..."
              rows={6}
              className="bg-slate-800/50 border-slate-700 text-white placeholder:text-slate-500"
              disabled={!canSubmit}
            />
          </div>

          {/* Submit Button */}
          <Button
            onClick={handleSubmit}
            disabled={!canSubmit || submitting}
            className="w-full bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white py-6 text-lg font-semibold"
          >
            {submitting ? (
              <>
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                Submitting Quality Report...
              </>
            ) : (
              <>
                <Award className="w-5 h-5 mr-2" />
                Submit Final Quality Report
              </>
            )}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default QualityReportSubmission;
