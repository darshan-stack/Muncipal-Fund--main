import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { X, Eye, EyeOff, FileText, Lock, Shield } from 'lucide-react';
import { toast } from 'sonner';

const SecurePDFViewer = ({ fileUrl, fileName, onClose, isAnonymous = false }) => {
  const [pdfBlob, setPdfBlob] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadPDF();
    
    // Prevent right-click and keyboard shortcuts
    const preventActions = (e) => {
      // Prevent right-click
      if (e.type === 'contextmenu') {
        e.preventDefault();
        toast.error('Download disabled for security', {
          description: 'Documents can only be viewed, not downloaded'
        });
        return false;
      }
      
      // Prevent Ctrl+S, Ctrl+P, F12, etc.
      if (e.ctrlKey || e.metaKey) {
        if (['s', 'p', 'u'].includes(e.key.toLowerCase())) {
          e.preventDefault();
          toast.error('Action disabled', {
            description: 'Print and save are disabled for security'
          });
          return false;
        }
      }
      
      // Prevent F12 (DevTools)
      if (e.keyCode === 123) {
        e.preventDefault();
        return false;
      }
    };

    document.addEventListener('contextmenu', preventActions);
    document.addEventListener('keydown', preventActions);

    return () => {
      document.removeEventListener('contextmenu', preventActions);
      document.removeEventListener('keydown', preventActions);
    };
  }, [fileUrl]);

  const loadPDF = async () => {
    try {
      setLoading(true);
      
      // For IPFS URLs
      if (fileUrl.startsWith('ipfs://')) {
        const ipfsHash = fileUrl.replace('ipfs://', '');
        const gatewayUrl = `https://ipfs.io/ipfs/${ipfsHash}`;
        
        const response = await fetch(gatewayUrl, {
          headers: {
            'Cache-Control': 'no-cache',
          }
        });
        
        if (!response.ok) throw new Error('Failed to load document');
        
        const blob = await response.blob();
        setPdfBlob(URL.createObjectURL(blob));
      } else {
        // For regular URLs
        const response = await fetch(fileUrl, {
          headers: {
            'Cache-Control': 'no-cache',
          }
        });
        
        if (!response.ok) throw new Error('Failed to load document');
        
        const blob = await response.blob();
        setPdfBlob(URL.createObjectURL(blob));
      }
      
      setError(null);
    } catch (err) {
      console.error('Error loading PDF:', err);
      setError('Failed to load document. Please try again.');
      toast.error('Failed to load document');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-6xl h-[90vh] glass-effect border-slate-700 flex flex-col">
        <CardHeader className="border-b border-slate-700">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-2 rounded-lg bg-blue-500/20">
                <FileText className="w-5 h-5 text-blue-400" />
              </div>
              <div>
                <CardTitle className="text-white text-lg">
                  {isAnonymous ? 'Anonymous Tender Document' : fileName || 'Document Viewer'}
                </CardTitle>
                <div className="flex items-center space-x-2 mt-1">
                  <Lock className="w-3 h-3 text-slate-400" />
                  <span className="text-xs text-slate-400">
                    View-only mode • Download disabled
                  </span>
                </div>
              </div>
            </div>
            <Button
              onClick={onClose}
              variant="ghost"
              size="sm"
              className="text-slate-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </Button>
          </div>
        </CardHeader>

        <CardContent className="flex-1 p-0 overflow-hidden">
          {loading && (
            <div className="h-full flex items-center justify-center">
              <div className="text-center space-y-3">
                <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
                <p className="text-slate-400">Loading secure document...</p>
              </div>
            </div>
          )}

          {error && (
            <div className="h-full flex items-center justify-center">
              <div className="text-center space-y-3">
                <div className="w-16 h-16 rounded-full bg-red-500/20 flex items-center justify-center mx-auto">
                  <X className="w-8 h-8 text-red-400" />
                </div>
                <p className="text-red-400">{error}</p>
                <Button onClick={loadPDF} className="mt-4">
                  Try Again
                </Button>
              </div>
            </div>
          )}

          {!loading && !error && pdfBlob && (
            <div className="h-full relative">
              {/* Security Watermark Overlay */}
              <div className="absolute top-0 left-0 right-0 z-10 pointer-events-none">
                <div className="bg-gradient-to-b from-slate-900/50 to-transparent p-4">
                  <div className="flex items-center justify-center space-x-2 text-slate-400 text-sm">
                    <Shield className="w-4 h-4" />
                    <span>Secure View Mode</span>
                  </div>
                </div>
              </div>

              {/* PDF Viewer */}
              <iframe
                src={`${pdfBlob}#toolbar=0&navpanes=0&scrollbar=1`}
                className="w-full h-full border-0"
                title="Secure PDF Viewer"
                sandbox="allow-same-origin"
                style={{
                  pointerEvents: 'auto',
                  userSelect: 'none',
                  WebkitUserSelect: 'none',
                  MozUserSelect: 'none',
                  msUserSelect: 'none'
                }}
              />

              {/* Bottom Security Notice */}
              <div className="absolute bottom-0 left-0 right-0 z-10 pointer-events-none">
                <div className="bg-gradient-to-t from-slate-900/70 to-transparent p-3">
                  <div className="flex items-center justify-center space-x-4 text-xs text-slate-400">
                    <div className="flex items-center space-x-1">
                      <EyeOff className="w-3 h-3" />
                      <span>Download disabled</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Lock className="w-3 h-3" />
                      <span>Print disabled</span>
                    </div>
                    {isAnonymous && (
                      <div className="flex items-center space-x-1">
                        <Shield className="w-3 h-3" />
                        <span>Anonymous submission</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </CardContent>

        {isAnonymous && (
          <div className="border-t border-slate-700 p-4 bg-purple-500/10">
            <div className="flex items-start space-x-3">
              <Shield className="w-5 h-5 text-purple-400 flex-shrink-0 mt-0.5" />
              <div className="text-sm">
                <p className="text-purple-300 font-semibold">Anonymous Tender Review</p>
                <p className="text-slate-400 mt-1">
                  This document is submitted anonymously. Contractor identity is hidden to ensure fair evaluation.
                  Only technical merit and proposal quality should be considered.
                </p>
              </div>
            </div>
          </div>
        )}
      </Card>

      <style jsx>{`
        /* Additional security: Disable text selection in iframe */
        iframe {
          -webkit-touch-callout: none;
          -webkit-user-select: none;
          -khtml-user-select: none;
          -moz-user-select: none;
          -ms-user-select: none;
          user-select: none;
        }
      `}</style>
    </div>
  );
};

export default SecurePDFViewer;
