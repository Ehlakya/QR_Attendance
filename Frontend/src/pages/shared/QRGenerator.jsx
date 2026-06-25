import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/common/Card';
import { QrCode, Download, Loader2 } from 'lucide-react';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';

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
      toast.success('QR Code Generated Successfully');
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
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Generate QR Code</h2>
        <p className="text-textSecondary">Create a dynamic QR code for attendance tracking.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <Card>
          <CardHeader>
            <CardTitle>Session Details</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Class Type</label>
                <select {...register('type')} className="input bg-white">
                  <option value="Morning Attendance">Morning Attendance</option>
                  <option value="Subject Attendance">Subject Attendance</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Department <span className="text-danger">*</span></label>
                  <select {...register('departmentId', { required: true })} className="input bg-white">
                    <option value="1">CSE</option>
                    <option value="2">IT</option>
                    <option value="3">ECE</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Section <span className="text-danger">*</span></label>
                  <select {...register('sectionId', { required: true })} className="input bg-white">
                    <option value="1">Section A</option>
                    <option value="2">Section B</option>
                  </select>
                </div>
              </div>

              {watchType === 'Subject Attendance' && (
                <div className="grid grid-cols-2 gap-4 animate-fade-in">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Subject Name <span className="text-danger">*</span></label>
                    <input 
                      type="text" 
                      {...register('subjectName', { required: watchType === 'Subject Attendance' })} 
                      className="input"
                      placeholder="e.g. Data Structures"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Class Time <span className="text-danger">*</span></label>
                    <select {...register('period', { required: watchType === 'Subject Attendance' })} className="input bg-white text-sm py-2">
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
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Expiry Time (Minutes)</label>
                <input 
                  type="number" 
                  {...register('expiryMinutes')} 
                  className="input"
                />
              </div>

              <button 
                type="submit" 
                disabled={isGenerating}
                className="w-full btn-primary flex justify-center items-center py-2.5"
              >
                {isGenerating ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Generate QR Code'}
              </button>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Generated QR Code</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col items-center justify-center min-h-[300px]">
            {generatedQR ? (
              <div className="text-center animate-fade-in">
                <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 inline-block mb-4">
                  <img src={generatedQR.dataUrl} alt="QR Code" className="w-48 h-48" />
                </div>
                <div className="space-y-1 mb-6">
                  <p className="text-sm font-medium text-gray-900">Type: {generatedQR.type}</p>
                  <p className="text-xs text-textSecondary">Generated: {generatedQR.timestamp}</p>
                  <p className="text-xs font-medium text-danger">Expires: {generatedQR.expiry}</p>
                </div>
                <div className="flex justify-center gap-3 mt-4">
                  <button 
                    onClick={handleDownload}
                    className="btn-secondary flex items-center justify-center gap-2"
                  >
                    <Download className="w-4 h-4" /> Download QR
                  </button>
                  <a 
                    href={`/teacher/attendance/${generatedQR.qrId}`}
                    target="_blank"
                    rel="noreferrer"
                    className="btn-primary flex items-center justify-center gap-2"
                  >
                    Monitor Live Attendance
                  </a>
                </div>
              </div>
            ) : (
              <div className="text-center text-gray-400">
                <QrCode className="w-16 h-16 mx-auto mb-3 opacity-20" />
                <p className="text-sm">Generate a QR code to display it here</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default QRGenerator;
