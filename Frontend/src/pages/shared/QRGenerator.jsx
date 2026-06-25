import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/common/Card';
import { QrCode, Download, Loader2 } from 'lucide-react';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import confetti from 'canvas-confetti';

const QRGenerator = () => {
  const { register, handleSubmit, watch } = useForm({
    defaultValues: {
      type: 'Morning Attendance',
      expiryMinutes: 10,
      departmentId: '1',
      sectionId: '1'
    }
  });
  const [generatedQR, setGeneratedQR] = useState(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const { token } = useAuth();

  const watchType = watch('type');

  const triggerConfetti = () => {
    const end = Date.now() + 1.5 * 1000;
    const colors = ['#6366F1', '#10B981', '#F59E0B'];

    (function frame() {
      confetti({
        particleCount: 3,
        angle: 60,
        spread: 55,
        origin: { x: 0 },
        colors: colors
      });
      confetti({
        particleCount: 3,
        angle: 120,
        spread: 55,
        origin: { x: 1 },
        colors: colors
      });

      if (Date.now() < end) {
        requestAnimationFrame(frame);
      }
    }());
  };

  const onSubmit = async (data) => {
    setIsGenerating(true);
    try {
      const payload = {
        type: data.type,
        expiryMinutes: parseInt(data.expiryMinutes),
        departmentId: parseInt(data.departmentId),
        sectionId: parseInt(data.sectionId),
      };

      if (data.type === 'Subject Attendance') {
        payload.subjectName = data.subjectName;
        payload.period = data.period;
      }

      const response = await axios.post('http://localhost:5000/api/v1/qr/generate', payload, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setGeneratedQR({
        qrId: response.data.data.qrId,
        dataUrl: response.data.data.qrCodeImage,
        timestamp: new Date().toLocaleTimeString(),
        expiry: new Date(response.data.data.expiryTime).toLocaleTimeString(),
        type: data.type,
        departmentId: data.departmentId,
        sectionId: data.sectionId,
        subjectName: data.subjectName,
        period: data.period
      });
      
      toast.success('QR Code Generated Successfully!');
      triggerConfetti();

    } catch (error) {
      toast.error('Failed to generate QR Code');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDownload = () => {
    if (!generatedQR) return;
    const link = document.createElement('a');
    link.download = `attendance-qr-${Date.now()}.png`;
    link.href = generatedQR.dataUrl;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="max-w-4xl mx-auto space-y-6"
    >
      <div>
        <h2 className="text-3xl font-extrabold tracking-tight text-textPrimary">Generate QR Code</h2>
        <p className="text-textSecondary mt-1 font-medium">Create a dynamic QR code for attendance tracking.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <motion.div whileHover={{ scale: 1.01 }} transition={{ type: "spring", stiffness: 300 }}>
          <Card className="hover:shadow-lg transition-all border-border bg-card">
            <CardHeader>
              <CardTitle>Session Details</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-textPrimary mb-1">Class Type</label>
                  <select {...register('type')} className="input bg-background/50 focus:bg-background text-textPrimary border-border transition-colors">
                    <option value="Morning Attendance">Morning Attendance</option>
                    <option value="Subject Attendance">Subject Attendance</option>
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-textPrimary mb-1">Department <span className="text-danger">*</span></label>
                    <select {...register('departmentId', { required: true })} className="input bg-background/50 focus:bg-background text-textPrimary border-border transition-colors">
                      <option value="1">CSE</option>
                      <option value="2">IT</option>
                      <option value="3">ECE</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-textPrimary mb-1">Section <span className="text-danger">*</span></label>
                    <select {...register('sectionId', { required: true })} className="input bg-background/50 focus:bg-background text-textPrimary border-border transition-colors">
                      <option value="1">Section A</option>
                      <option value="2">Section B</option>
                    </select>
                  </div>
                </div>

                <AnimatePresence>
                  {watchType === 'Subject Attendance' && (
                    <motion.div 
                      initial={{ opacity: 0, height: 0, overflow: 'hidden' }}
                      animate={{ opacity: 1, height: 'auto', overflow: 'visible' }}
                      exit={{ opacity: 0, height: 0, overflow: 'hidden' }}
                      transition={{ duration: 0.3 }}
                      className="grid grid-cols-2 gap-4"
                    >
                      <div>
                        <label className="block text-sm font-semibold text-textPrimary mb-1 mt-2">Subject Name <span className="text-danger">*</span></label>
                        <input 
                          type="text" 
                          {...register('subjectName', { required: watchType === 'Subject Attendance' })} 
                          className="input bg-background/50 focus:bg-background text-textPrimary border-border transition-colors"
                          placeholder="e.g. Data Structures"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-textPrimary mb-1 mt-2">Class Time <span className="text-danger">*</span></label>
                        <select {...register('period', { required: watchType === 'Subject Attendance' })} className="input bg-background/50 focus:bg-background text-textPrimary border-border text-sm py-2 transition-colors">
                          <option value="09:00 AM - 09:45 AM">09:00 AM - 09:45 AM</option>
                          <option value="09:45 AM - 10:30 AM">09:45 AM - 10:30 AM</option>
                          <option value="10:30 AM - 10:45 AM (Break)">10:30 AM - 10:45 AM (Break)</option>
                          <option value="10:45 AM - 11:30 AM">10:45 AM - 11:30 AM</option>
                          <option value="11:30 AM - 12:15 PM">11:30 AM - 12:15 PM</option>
                          <option value="12:15 PM - 01:00 PM">12:15 PM - 01:00 PM</option>
                          <option value="01:00 PM - 01:45 PM (Lunch)">01:00 PM - 01:45 PM (Lunch)</option>
                          <option value="01:45 PM - 02:30 PM">01:45 PM - 02:30 PM</option>
                          <option value="02:30 PM - 03:15 PM">02:30 PM - 03:15 PM</option>
                          <option value="03:15 PM - 03:30 PM (Break)">03:15 PM - 03:30 PM (Break)</option>
                          <option value="03:30 PM - 04:15 PM">03:30 PM - 04:15 PM</option>
                          <option value="04:15 PM - 04:30 PM">04:15 PM - 04:30 PM</option>
                        </select>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                <div>
                  <label className="block text-sm font-semibold text-textPrimary mb-1">Expiry Time (Minutes)</label>
                  <input 
                    type="number" 
                    {...register('expiryMinutes')} 
                    className="input bg-background/50 focus:bg-background text-textPrimary border-border transition-colors"
                  />
                </div>

                <motion.button 
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  type="submit" 
                  disabled={isGenerating}
                  className="w-full btn-primary flex justify-center items-center py-3 shadow-md shadow-primary/20 hover:shadow-primary/40 mt-4 font-bold"
                >
                  {isGenerating ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Generate QR Code'}
                </motion.button>
              </form>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div whileHover={{ scale: 1.01 }} transition={{ type: "spring", stiffness: 300 }}>
          <Card className="hover:shadow-lg transition-all border-border bg-card h-full">
            <CardHeader>
              <CardTitle>Generated QR Code</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col items-center justify-center min-h-[350px]">
              <AnimatePresence mode="wait">
                {generatedQR ? (
                  <motion.div 
                    key="qr"
                    initial={{ opacity: 0, scale: 0.5, rotate: -10 }}
                    animate={{ opacity: 1, scale: 1, rotate: 0 }}
                    transition={{ type: "spring", stiffness: 200, damping: 15 }}
                    className="text-center w-full"
                  >
                    <div className="bg-white p-5 rounded-2xl shadow-xl border border-gray-100 inline-block mb-6 relative overflow-hidden group">
                      <div className="absolute inset-0 bg-primary/5 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"></div>
                      <img src={generatedQR.dataUrl} alt="QR Code" className="w-56 h-56" />
                    </div>
                    <div className="space-y-1.5 mb-8 bg-background rounded-xl p-4 border border-border shadow-inner max-w-xs mx-auto">
                      <p className="text-sm font-bold text-textPrimary">{generatedQR.type}</p>
                      <p className="text-xs font-medium text-textSecondary">Generated: {generatedQR.timestamp}</p>
                      <p className="text-xs font-bold text-danger bg-danger/10 px-2 py-1 rounded inline-block mt-1">Expires: {generatedQR.expiry}</p>
                    </div>
                    <div className="flex flex-col sm:flex-row justify-center gap-3 mt-4">
                      <motion.button 
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={handleDownload}
                        className="btn-secondary flex items-center justify-center gap-2 shadow-sm font-semibold"
                      >
                        <Download className="w-4 h-4" /> Download
                      </motion.button>
                      <motion.a 
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        href={`/teacher/attendance/${generatedQR.qrId}`}
                        target="_blank"
                        rel="noreferrer"
                        className="btn-primary flex items-center justify-center gap-2 shadow-sm shadow-primary/20 font-semibold"
                      >
                        Monitor Live Feed
                      </motion.a>
                    </div>
                  </motion.div>
                ) : (
                  <motion.div 
                    key="placeholder"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="text-center text-textSecondary flex flex-col items-center justify-center h-full"
                  >
                    <div className="w-24 h-24 rounded-full bg-background flex items-center justify-center mb-4 border-2 border-dashed border-border">
                      <QrCode className="w-10 h-10 text-textSecondary/50" />
                    </div>
                    <p className="text-sm font-medium">Configure session details to<br/>generate a dynamic QR code</p>
                  </motion.div>
                )}
              </AnimatePresence>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </motion.div>
  );
};

export default QRGenerator;
