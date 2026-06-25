import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/common/Card';
import { Html5Qrcode } from 'html5-qrcode';
import { ShieldCheck, XCircle, Loader2, QrCode, Clock, BookOpen, User, RefreshCw, Download, Eye, Maximize, Upload, Camera } from 'lucide-react';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';
import { useSocket } from '../../context/SocketContext';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';

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
      setTimeout(() => setLoading(false), 500); // Simulate smooth skeleton load
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

      await axios.post('http://localhost:5000/api/v1/attendance/mark', payload, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setScanStatus('success');
      setScanMessage('Attendance Marked Successfully');
      toast.success('Attendance Marked Successfully');
    } catch (error) {
      setScanStatus('error');
      
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
      const html5QrCode = new Html5Qrcode("reader-hidden");
      const result = await html5QrCode.scanFile(file, true);
      await processQRCode(result);
    } catch (err) {
      setScanStatus('error');
      setScanMessage("Invalid QR Image");
      toast.error("Invalid QR Image");
    }
    
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

  // Variants for staggered lists
  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 24 } }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6 relative">
      <div id="reader-hidden" style={{ position: 'absolute', left: '-9999px', opacity: 0, pointerEvents: 'none' }}></div>
      
      <input
        id="qrFileInput"
        type="file"
        accept="image/png,image/jpeg,image/jpg,image/webp"
        style={{ display: "none" }}
        onChange={handleQRImageUpload}
      />

      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-extrabold tracking-tight text-textPrimary">Active Sessions</h2>
          <p className="text-textSecondary font-medium mt-1">Targeted attendance sessions assigned to your class.</p>
        </div>
        <button onClick={fetchActiveSessions} className="btn-secondary flex items-center gap-2 bg-card shadow-sm hover:shadow-md transition-all">
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} /> Refresh
        </button>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-6">
          {[...Array(3)].map((_, i) => (
            <Card key={i} className="animate-pulse h-[340px]">
              <div className="bg-border h-[160px] w-full rounded-t-[20px]"></div>
              <CardContent className="p-5">
                <div className="h-6 bg-border rounded w-3/4 mb-4"></div>
                <div className="space-y-2">
                  <div className="h-4 bg-border rounded w-1/2"></div>
                  <div className="h-4 bg-border rounded w-2/3"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : activeSessions.length === 0 ? (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
          <Card className="border-dashed border-2 border-border bg-background/50 hover:bg-background/80 transition-colors">
            <CardContent className="flex flex-col items-center justify-center min-h-[350px] text-textSecondary space-y-4">
              <QrCode className="w-20 h-20 opacity-20" />
              <p className="text-xl font-bold text-textPrimary">No active attendance sessions right now.</p>
              <p className="text-sm font-medium text-textSecondary/60">Wait for your teacher to generate a QR code.</p>
            </CardContent>
          </Card>
        </motion.div>
      ) : (
        <motion.div 
          variants={containerVariants} 
          initial="hidden" 
          animate="show" 
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
        >
          {activeSessions.map(session => (
            <motion.div key={session.id} variants={itemVariants} whileHover={{ scale: 1.02, translateY: -4 }} transition={{ type: "spring", stiffness: 300, damping: 20 }}>
              <Card className="hover:shadow-xl transition-all border-border bg-card flex flex-col h-full overflow-hidden">
                <div className="bg-background/80 p-4 border-b border-border flex justify-center relative backdrop-blur-sm">
                  <div className="absolute top-3 left-3 px-3 py-1 bg-primary/10 text-primary font-bold text-xs rounded-full shadow-sm">
                    {session.type}
                  </div>
                  <img src={session.qrImage} alt="QR Preview" className="w-32 h-32 object-contain mix-blend-multiply drop-shadow-sm dark:mix-blend-normal dark:bg-white rounded" />
                </div>

                <CardContent className="p-5 flex flex-col flex-1">
                  <div className="flex-1 space-y-3">
                    <div className="flex justify-between items-start">
                      <h3 className="text-xl font-bold text-textPrimary leading-tight">
                        {session.subjectName || 'Morning Attendance'}
                      </h3>
                    </div>
                    
                    <div className="space-y-2 pt-1">
                      <div className="flex items-center text-sm text-textSecondary gap-2">
                        <User className="w-4 h-4 text-primary/60" /> 
                        <span className="font-semibold">Generated By:</span> {session.teacherName || 'Teacher'}
                      </div>
                      {session.period && (
                        <div className="flex items-center text-sm text-textSecondary gap-2">
                          <BookOpen className="w-4 h-4 text-primary/60" /> 
                          <span className="font-semibold">Hour/Period:</span> {session.period}
                        </div>
                      )}
                      <div className="flex items-center text-sm text-danger font-bold gap-2 pt-1 bg-danger/5 px-2 py-1.5 rounded-lg w-max border border-danger/10">
                        <Clock className="w-4 h-4 animate-pulse" /> 
                        Expires at {new Date(session.expiryTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                      </div>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-2 mt-5 pt-4 border-t border-border">
                    <motion.button 
                      whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                      onClick={() => openView(session)}
                      className="btn-secondary text-xs flex justify-center items-center gap-1.5 py-2.5 bg-background font-semibold"
                    >
                      <Eye className="w-3.5 h-3.5" /> View
                    </motion.button>
                    <motion.button 
                      whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                      onClick={() => handleDownload(session)}
                      className="btn-secondary text-xs flex justify-center items-center gap-1.5 py-2.5 bg-background font-semibold"
                    >
                      <Download className="w-3.5 h-3.5" /> Download
                    </motion.button>
                    <motion.button 
                      whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                      onClick={() => openScanner(session)}
                      className="btn-primary text-sm font-bold flex justify-center items-center gap-1.5 py-3 col-span-2 shadow-md shadow-primary/20 hover:shadow-primary/40 mt-1"
                    >
                      <Maximize className="w-4 h-4" /> Scan to Mark Attendance
                    </motion.button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </motion.div>
      )}

      {/* View QR Modal */}
      <AnimatePresence>
        {isViewOpen && selectedSession && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 10 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="w-full max-w-sm"
            >
              <Card className="overflow-hidden shadow-2xl border-border">
                <CardHeader className="bg-background/80 backdrop-blur border-b border-border flex flex-row justify-between items-center">
                  <CardTitle>Session QR Code</CardTitle>
                  <button onClick={() => setIsViewOpen(false)} className="text-textSecondary/60 hover:text-textPrimary transition-colors bg-card rounded-full p-1 shadow-sm">
                    <XCircle className="w-6 h-6" />
                  </button>
                </CardHeader>
                <CardContent className="p-8 flex flex-col items-center text-center bg-card">
                  <div className="bg-white p-5 rounded-2xl shadow-xl border border-gray-100 mb-6 inline-block">
                    <img src={selectedSession.qrImage} alt="QR Code" className="w-64 h-64" />
                  </div>
                  <p className="text-lg font-bold text-textPrimary mb-1">{selectedSession.subjectName || selectedSession.type}</p>
                  <p className="text-sm font-medium text-textSecondary mb-6">Scan this code with another device to record your attendance.</p>
                  
                  <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={() => handleDownload(selectedSession)} className="btn-secondary w-full flex items-center justify-center gap-2 py-3 font-semibold shadow-sm">
                    <Download className="w-4 h-4" /> Download Image
                  </motion.button>
                </CardContent>
              </Card>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Custom Scanner Overlay Modal */}
      <AnimatePresence>
        {isScannerOpen && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4"
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 10 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="w-full max-w-lg"
            >
              <Card className="overflow-hidden shadow-2xl border-border bg-card">
                <CardHeader className="bg-card/90 backdrop-blur border-b border-border flex flex-row justify-between items-center">
                  <CardTitle>Scan QR: {selectedSession?.subjectName || selectedSession?.type}</CardTitle>
                  <button onClick={closeScanner} className="text-textSecondary/60 hover:text-textPrimary transition-colors bg-background rounded-full p-1 shadow-sm">
                    <XCircle className="w-6 h-6" />
                  </button>
                </CardHeader>
                <CardContent className="p-6 bg-background/50">
                  
                  <AnimatePresence mode="wait">
                    {scanMode === 'select' ? (
                      <motion.div key="select" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} className="py-8 flex flex-col gap-4">
                        <p className="text-center font-medium text-textSecondary mb-4">Choose how you want to scan your attendance QR code:</p>
                        <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={startCamera} className="btn-primary py-5 flex flex-col items-center justify-center gap-3 text-lg font-bold shadow-lg shadow-primary/20 hover:shadow-primary/40 text-white">
                          <Camera className="w-10 h-10" /> Use Camera Scanner
                        </motion.button>
                        <div className="relative flex py-3 items-center">
                          <div className="flex-grow border-t border-border"></div>
                          <span className="flex-shrink-0 mx-4 font-bold text-textSecondary/60 text-sm">OR</span>
                          <div className="flex-grow border-t border-border"></div>
                        </div>
                        <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={triggerFileUpload} className="btn-secondary py-5 flex flex-col items-center justify-center gap-3 text-lg font-bold bg-card border border-border shadow-sm hover:shadow-md text-textPrimary">
                          <Upload className="w-10 h-10 text-secondary" /> Scan an Image File
                        </motion.button>
                      </motion.div>
                    ) : scanMode === 'camera' ? (
                      <motion.div key="camera" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="relative">
                        <div className="absolute -inset-1 bg-gradient-to-r from-primary to-secondary rounded-xl blur opacity-30 animate-pulse-glow"></div>
                        <div id="reader" className="relative overflow-hidden rounded-xl border-2 border-primary/50 bg-black min-h-[350px] shadow-2xl"></div>
                        <div className="absolute inset-x-0 top-0 h-0.5 bg-primary shadow-[0_0_12px_rgba(99,102,241,1)] animate-scan-line pointer-events-none z-10"></div>
                      </motion.div>
                    ) : null}
                  </AnimatePresence>

                  {(scanStatus === 'scanning' && (scanMode === 'processing' || scanMode === 'upload')) && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="py-24 flex flex-col items-center justify-center">
                      <Loader2 className="w-14 h-14 animate-spin text-primary mb-5" />
                      <p className="font-bold text-textPrimary text-xl tracking-tight">Verifying Signature...</p>
                      <p className="text-sm text-textSecondary font-medium mt-2">Checking authorization & location</p>
                    </motion.div>
                  )}

                  {(scanStatus === 'success' || scanStatus === 'error') && (
                    <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="py-8 flex flex-col items-center w-full">
                      {scanStatus === 'success' ? (
                        <div className="w-full">
                          <div className="flex flex-col items-center mb-6 text-center">
                            <motion.div 
                              initial={{ scale: 0, rotate: -180 }} animate={{ scale: 1, rotate: 0 }} transition={{ type: "spring", damping: 12 }}
                              className="w-20 h-20 bg-success/10 rounded-full flex items-center justify-center mb-5 shadow-[0_0_20px_rgba(16,185,129,0.3)]"
                            >
                              <ShieldCheck className="w-10 h-10 text-success" />
                            </motion.div>
                            <h3 className="text-3xl font-extrabold text-textPrimary mb-2 tracking-tight">{scanMessage}</h3>
                            <p className="text-success font-medium">Your presence has been recorded.</p>
                          </div>
                          
                          <div className="bg-card border border-border rounded-2xl p-6 mb-8 space-y-4 shadow-xl shadow-black/5">
                            <div className="flex justify-between items-center text-sm border-b border-border pb-3">
                              <span className="text-textSecondary font-medium">Student</span>
                              <span className="text-textPrimary font-bold text-base">{user?.name || '-'}</span>
                            </div>
                            <div className="flex justify-between items-center text-sm border-b border-border pb-3">
                              <span className="text-textSecondary font-medium">Register Number</span>
                              <span className="text-textPrimary font-bold">{user?.registerNumber || '-'}</span>
                            </div>
                            <div className="flex justify-between items-center text-sm border-b border-border pb-3">
                              <span className="text-textSecondary font-medium">Department & Section</span>
                              <span className="text-textPrimary font-bold uppercase">{user?.departmentId || '-'} - {user?.sectionId || '-'}</span>
                            </div>
                            <div className="flex justify-between items-center text-sm pt-1">
                              <span className="text-textSecondary font-medium">Timestamp</span>
                              <span className="text-primary font-bold bg-primary/10 px-2.5 py-1 rounded-md">
                                {new Date().toLocaleDateString()} at {new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                              </span>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="flex flex-col items-center text-center mb-8 w-full">
                          <motion.div 
                            initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", damping: 10, stiffness: 200 }}
                            className="w-24 h-24 bg-danger/10 rounded-full flex items-center justify-center mb-6 shadow-[0_0_20px_rgba(239,68,68,0.3)]"
                          >
                            <XCircle className="w-12 h-12 text-danger" />
                          </motion.div>
                          <h3 className="text-3xl font-extrabold text-textPrimary mb-3 tracking-tight">Verification Failed</h3>
                          <p className="text-textSecondary mb-8 font-medium bg-danger/5 py-3 px-6 rounded-lg text-danger border border-danger/10 w-full">{scanMessage}</p>
                          <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={() => { setScanMode('select'); setScanStatus('idle'); }} className="btn-secondary w-full py-3 font-bold shadow-sm">
                            Try Again
                          </motion.button>
                        </div>
                      )}
                      
                      <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={closeScanner} className="btn-primary w-full text-center py-3.5 font-bold shadow-md shadow-primary/20">
                        Return to Dashboard
                      </motion.button>
                    </motion.div>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default QRScanner;
