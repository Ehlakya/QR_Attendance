import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/common/Card';
import { Html5Qrcode } from 'html5-qrcode';
import { ShieldCheck, XCircle, Loader2, QrCode, Clock, BookOpen, User, RefreshCw, Download, Eye, Maximize, Upload, Camera } from 'lucide-react';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';
import { useSocket } from '../../context/SocketContext';
import toast from 'react-hot-toast';

const QRScanner = () => {
  const [activeSessions, setActiveSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Modals
  const [selectedSession, setSelectedSession] = useState(null);
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [isViewOpen, setIsViewOpen] = useState(false);

  // Scanner States
  const [scanMode, setScanMode] = useState('select'); // select, camera, upload
  const [scanStatus, setScanStatus] = useState('idle'); // idle, scanning, success, error
  const [scanMessage, setScanMessage] = useState('');
  
  // Refs
  const html5QrCodeRef = useRef(null);
  
  const { token, user } = useAuth();
  const socket = useSocket();

  const fetchActiveSessions = async () => {
    try {
      setLoading(true);
      const response = await axios.get('http://localhost:5000/api/v1/qr/active', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setActiveSessions(response.data.data);
    } catch (error) {
      toast.error('Failed to load active sessions');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchActiveSessions();
  }, [token]);

  useEffect(() => {
    if (!socket || !user) return;
    
    const handleQRGenerated = (data) => {
      toast.success(data.message || 'New Attendance Session Available!');
      fetchActiveSessions();
    };

    socket.on('qr_generated', handleQRGenerated);
    return () => socket.off('qr_generated', handleQRGenerated);
  }, [socket, user]);

  const stopCamera = async () => {
    if (html5QrCodeRef.current && html5QrCodeRef.current.isScanning) {
      try {
        await html5QrCodeRef.current.stop();
        html5QrCodeRef.current.clear();
      } catch (err) {
        console.error('Failed to stop camera', err);
      }
    }
  };

  const processQRCode = async (decodedText) => {
    await stopCamera();
    setScanMode('processing');
    setScanStatus('scanning');
    
    try {
      const qrPayload = JSON.parse(decodedText);
      const expectedPayload = JSON.parse(selectedSession.qrCodeData);
      
      console.log("Decoded QR Data:", decodedText);
      
      if (qrPayload.id !== expectedPayload.id) {
        throw new Error("You are not authorized for this QR");
      }

      const payload = {
        studentId: user.id,
        qrId: selectedSession.id,
        attendanceType: selectedSession.type,
        department: user.departmentId || "N/A",
        section: user.sectionId || "N/A",
        qrDataStr: decodedText
      };
      console.log("Attendance Payload:", payload);

      await axios.post('http://localhost:5000/api/v1/attendance/mark', payload, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setScanStatus('success');
      setScanMessage('Attendance Marked Successfully');
      toast.success('Attendance Marked Successfully');
    } catch (error) {
      setScanStatus('error');
      
      // Determine precise error message
      let msg = error.response?.data?.message || error.message || 'Invalid QR Code';
      if (msg.includes('already marked')) msg = 'Attendance Already Submitted';
      else if (msg.includes('expired')) msg = 'QR Code Expired';
      else if (msg.includes('Invalid QR Code')) msg = 'Invalid QR Code';
      
      setScanMessage(msg);
      toast.error(msg);
    }
  };

  const startCamera = async () => {
    setScanMode('camera');
    setTimeout(async () => {
      try {
        html5QrCodeRef.current = new Html5Qrcode("reader");
        await html5QrCodeRef.current.start(
          { facingMode: "environment" },
          { fps: 10, qrbox: { width: 250, height: 250 } },
          (decodedText) => {
            processQRCode(decodedText);
          },
          (errorMessage) => {
            // ignore constant frame scan errors
          }
        );
      } catch (err) {
        toast.error("Failed to start camera. Please check permissions.");
        setScanMode('select');
      }
    }, 100);
  };

  const triggerFileUpload = () => {
    document.getElementById("qrFileInput").click();
  };

  const handleQRImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    setScanMode('upload');
    setScanStatus('scanning');
    
    try {
      // Html5Qrcode requires the DOM element to be physically rendered (no display:none)
      // so we use a visually hidden, absolute positioned div instead.
      const html5QrCode = new Html5Qrcode("reader-hidden");
      const result = await html5QrCode.scanFile(file, true);
      await processQRCode(result);
    } catch (err) {
      setScanStatus('error');
      setScanMessage("Invalid QR Image");
      toast.error("Invalid QR Image");
    }
    
    // Clear the input so the same file can be selected again if needed
    e.target.value = '';
  };

  const openScanner = (session) => {
    setSelectedSession(session);
    setScanMode('select');
    setScanStatus('idle');
    setIsScannerOpen(true);
  };

  const closeScanner = async () => {
    await stopCamera();
    setIsScannerOpen(false);
    setSelectedSession(null);
    setScanMode('select');
    setScanStatus('idle');
  };

  const openView = (session) => {
    setSelectedSession(session);
    setIsViewOpen(true);
  };

  const handleDownload = (session) => {
    const link = document.createElement('a');
    link.download = `attendance-qr-${session.subjectName || session.type}.png`;
    link.href = session.qrImage;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('QR Code Downloaded!');
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6 relative">
      {/* Visually hidden div for file processing (html5qrcode crashes if display:none) */}
      <div id="reader-hidden" style={{ position: 'absolute', left: '-9999px', opacity: 0, pointerEvents: 'none' }}></div>
      
      {/* Hidden File Input as requested */}
      <input
        id="qrFileInput"
        type="file"
        accept="image/png,image/jpeg,image/jpg,image/webp"
        style={{ display: "none" }}
        onChange={handleQRImageUpload}
      />

      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Active Sessions</h2>
          <p className="text-textSecondary">Targeted attendance sessions assigned to your class.</p>
        </div>
        <button onClick={fetchActiveSessions} className="btn-secondary flex items-center gap-2 bg-white">
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} /> Refresh
        </button>
      </div>

      {loading ? (
        <div className="p-12 flex justify-center text-primary animate-pulse">Scanning for active sessions...</div>
      ) : activeSessions.length === 0 ? (
        <Card className="border-dashed border-2 border-gray-200 bg-gray-50/50">
          <CardContent className="flex flex-col items-center justify-center min-h-[300px] text-gray-500 space-y-4">
            <QrCode className="w-16 h-16 opacity-20" />
            <p className="text-lg font-medium">No active attendance sessions right now.</p>
            <p className="text-sm">Wait for your teacher to generate a QR code.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {activeSessions.map(session => (
            <Card key={session.id} className="hover:shadow-md transition-shadow border-primary/20 bg-white flex flex-col h-full overflow-hidden">
              {/* QR Preview Header */}
              <div className="bg-gray-50 p-4 border-b border-gray-100 flex justify-center relative">
                <div className="absolute top-3 left-3 px-2.5 py-1 bg-primary/10 text-primary font-medium text-xs rounded-full">
                  {session.type}
                </div>
                <img src={session.qrImage} alt="QR Preview" className="w-32 h-32 object-contain mix-blend-multiply" />
              </div>

              <CardContent className="p-5 flex flex-col flex-1">
                <div className="flex-1 space-y-3">
                  <div className="flex justify-between items-start">
                    <h3 className="text-lg font-bold text-gray-900 leading-tight">
                      {session.subjectName || 'Morning Attendance'}
                    </h3>
                  </div>
                  
                  <div className="space-y-1.5">
                    <div className="flex items-center text-sm text-gray-600 gap-2">
                      <User className="w-4 h-4 text-primary/60" /> 
                      <span className="font-medium">Generated By:</span> {session.teacherName || 'Teacher'}
                    </div>
                    {session.period && (
                      <div className="flex items-center text-sm text-gray-600 gap-2">
                        <BookOpen className="w-4 h-4 text-primary/60" /> 
                        <span className="font-medium">Hour/Period:</span> {session.period}
                      </div>
                    )}
                    <div className="flex items-center text-sm text-danger font-medium gap-2 pt-1">
                      <Clock className="w-4 h-4 animate-pulse" /> 
                      Expires at {new Date(session.expiryTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                    </div>
                  </div>
                </div>
                
                {/* Actions Grid */}
                <div className="grid grid-cols-2 gap-2 mt-5 pt-4 border-t border-gray-100">
                  <button 
                    onClick={() => openView(session)}
                    className="btn-secondary text-xs flex justify-center items-center gap-1.5 py-2 bg-gray-50"
                  >
                    <Eye className="w-3.5 h-3.5" /> View
                  </button>
                  <button 
                    onClick={() => handleDownload(session)}
                    className="btn-secondary text-xs flex justify-center items-center gap-1.5 py-2 bg-gray-50"
                  >
                    <Download className="w-3.5 h-3.5" /> Download
                  </button>
                  <button 
                    onClick={() => openScanner(session)}
                    className="btn-primary text-xs flex justify-center items-center gap-1.5 py-2 col-span-2 shadow-sm"
                  >
                    <Maximize className="w-3.5 h-3.5" /> Scan QR
                  </button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* View QR Modal */}
      {isViewOpen && selectedSession && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <Card className="w-full max-w-sm animate-scale-in overflow-hidden shadow-2xl">
            <CardHeader className="bg-gray-50 border-b border-gray-100 flex flex-row justify-between items-center">
              <CardTitle>Session QR Code</CardTitle>
              <button onClick={() => setIsViewOpen(false)} className="text-gray-400 hover:text-gray-700 transition-colors">
                <XCircle className="w-6 h-6" />
              </button>
            </CardHeader>
            <CardContent className="p-8 flex flex-col items-center text-center">
              <div className="bg-white p-4 rounded-xl shadow-inner border border-gray-100 mb-4 inline-block">
                <img src={selectedSession.qrImage} alt="QR Code" className="w-64 h-64" />
              </div>
              <p className="text-sm font-medium text-gray-900 mb-1">{selectedSession.subjectName || selectedSession.type}</p>
              <p className="text-xs text-textSecondary mb-6">Scan this code to record your attendance</p>
              
              <button onClick={() => handleDownload(selectedSession)} className="btn-secondary w-full flex items-center justify-center gap-2">
                <Download className="w-4 h-4" /> Download Image
              </button>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Custom Scanner Overlay Modal */}
      {isScannerOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <Card className="w-full max-w-lg animate-scale-in overflow-hidden shadow-2xl">
            <CardHeader className="bg-gray-50 border-b border-gray-100 flex flex-row justify-between items-center">
              <CardTitle>Scan QR: {selectedSession?.subjectName || selectedSession?.type}</CardTitle>
              <button onClick={closeScanner} className="text-gray-400 hover:text-gray-700 transition-colors">
                <XCircle className="w-6 h-6" />
              </button>
            </CardHeader>
            <CardContent className="p-6">
              
              {scanMode === 'select' ? (
                <div className="py-8 flex flex-col gap-4">
                  <p className="text-center text-gray-600 mb-4">Choose how you want to scan your attendance QR code:</p>
                  <button onClick={startCamera} className="btn-primary py-4 flex flex-col items-center justify-center gap-2 text-lg">
                    <Camera className="w-8 h-8" /> Use Camera Scanner
                  </button>
                  <div className="relative flex py-2 items-center">
                    <div className="flex-grow border-t border-gray-300"></div>
                    <span className="flex-shrink-0 mx-4 text-gray-400 text-sm">OR</span>
                    <div className="flex-grow border-t border-gray-300"></div>
                  </div>
                  <button onClick={triggerFileUpload} className="btn-secondary py-4 flex flex-col items-center justify-center gap-2 text-lg bg-gray-100 border border-gray-200">
                    <Upload className="w-8 h-8" /> Scan an Image File
                  </button>
                </div>
              ) : scanMode === 'camera' ? (
                <div className="relative">
                  <div id="reader" className="overflow-hidden rounded-xl border-2 border-primary/20 bg-black min-h-[300px]"></div>
                  <div className="absolute inset-x-0 top-0 h-0.5 bg-primary shadow-[0_0_8px_rgba(79,70,229,0.8)] animate-scan-line pointer-events-none z-10"></div>
                </div>
              ) : null}

              {(scanStatus === 'scanning' && (scanMode === 'processing' || scanMode === 'upload')) && (
                <div className="py-20 flex flex-col items-center justify-center">
                  <Loader2 className="w-12 h-12 animate-spin text-primary mb-4" />
                  <p className="font-medium text-gray-900 text-lg">Verifying Signature...</p>
                </div>
              )}

              {(scanStatus === 'success' || scanStatus === 'error') && (
                <div className="py-6 flex flex-col items-center animate-fade-in w-full">
                  {scanStatus === 'success' ? (
                    <div className="w-full">
                      <div className="flex flex-col items-center mb-6 text-center">
                        <div className="w-16 h-16 bg-success/10 rounded-full flex items-center justify-center mb-4">
                          <ShieldCheck className="w-8 h-8 text-success" />
                        </div>
                        <h3 className="text-2xl font-bold text-gray-900 mb-1">{scanMessage}</h3>
                      </div>
                      
                      <div className="bg-gray-50 border border-gray-100 rounded-xl p-5 mb-8 space-y-3 shadow-inner">
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-500 font-medium">Student:</span>
                          <span className="text-gray-900 font-bold">{user?.name || '-'}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-500 font-medium">Register Number:</span>
                          <span className="text-gray-900 font-bold">{user?.registerNumber || '-'}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-500 font-medium">Department:</span>
                          <span className="text-gray-900 font-bold uppercase">{user?.departmentId || '-'}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-500 font-medium">Section:</span>
                          <span className="text-gray-900 font-bold uppercase">{user?.sectionId || '-'}</span>
                        </div>
                        <div className="border-t border-gray-200 my-2 pt-2 flex justify-between text-sm">
                          <span className="text-gray-500 font-medium">Date:</span>
                          <span className="text-gray-900 font-bold">{new Date().toLocaleDateString()}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-500 font-medium">Time:</span>
                          <span className="text-gray-900 font-bold">{new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center text-center mb-8">
                      <div className="w-20 h-20 bg-danger/10 rounded-full flex items-center justify-center mb-6">
                        <XCircle className="w-10 h-10 text-danger" />
                      </div>
                      <h3 className="text-2xl font-bold text-gray-900 mb-2">Verification Failed</h3>
                      <p className="text-gray-600 mb-6">{scanMessage}</p>
                      <button onClick={() => { setScanMode('select'); setScanStatus('idle'); }} className="btn-secondary w-full max-w-xs">
                        Try Again
                      </button>
                    </div>
                  )}
                  
                  <button onClick={closeScanner} className="btn-primary w-full text-center">
                    Return to Dashboard
                  </button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

export default QRScanner;
