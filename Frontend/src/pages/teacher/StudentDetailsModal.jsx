import { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';
import { X, Loader2, Calendar, BookOpen, Clock } from 'lucide-react';
import { motion } from 'framer-motion';

const StudentDetailsModal = ({ studentId, onClose }) => {
  const { token } = useAuth();
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDetails = async () => {
      try {
        const response = await axios.get(`http://localhost:5000/api/v1/dashboard/6-month-report/${studentId}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setReport(response.data.data);
      } catch (error) {
        console.error('Failed to fetch student details');
      } finally {
        setLoading(false);
      }
    };
    fetchDetails();
  }, [studentId, token]);

  if (loading) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
        <div className="bg-card rounded-xl p-8 flex flex-col items-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary mb-4" />
          <p className="text-textSecondary font-medium">Loading details...</p>
        </div>
      </div>
    );
  }

  if (!report) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-card w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-2xl shadow-xl flex flex-col"
      >
        <div className="sticky top-0 bg-card border-b border-border p-4 sm:p-6 flex justify-between items-center z-10">
          <div>
            <h2 className="text-2xl font-bold text-textPrimary">{report.student.name}</h2>
            <p className="text-sm text-textSecondary font-medium mt-1">
              {report.student.registerNumber} • {report.student.department} • {report.student.section}
            </p>
          </div>
          <button 
            onClick={onClose}
            className="p-2 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4 sm:p-6 space-y-8">
          
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="bg-primary/5 rounded-xl p-4 border border-primary/20 text-center">
              <p className="text-sm text-primary font-semibold uppercase mb-1">Overall %</p>
              <p className="text-3xl font-extrabold text-primary">{report.overallPercentage}%</p>
            </div>
            <div className="bg-success/5 rounded-xl p-4 border border-success/20 text-center">
              <p className="text-sm text-success font-semibold uppercase mb-1">Total Present</p>
              <p className="text-3xl font-extrabold text-success">{report.totalPresent}</p>
            </div>
            <div className="bg-danger/5 rounded-xl p-4 border border-danger/20 text-center">
              <p className="text-sm text-danger font-semibold uppercase mb-1">Total Absent</p>
              <p className="text-3xl font-extrabold text-danger">{report.totalAbsent}</p>
            </div>
            <div className="bg-secondary/5 rounded-xl p-4 border border-secondary/20 text-center">
              <p className="text-sm text-secondary font-semibold uppercase mb-1">Total Classes</p>
              <p className="text-3xl font-extrabold text-secondary">{report.totalClasses}</p>
            </div>
          </div>

          <div>
            <h3 className="text-lg font-bold text-textPrimary mb-4 flex items-center gap-2">
              <Calendar className="w-5 h-5 text-primary" /> Month-wise Breakdown (6 Months)
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
              {report.monthlyData.map((m, idx) => (
                <div key={idx} className="bg-background rounded-lg p-3 border border-border text-center shadow-sm">
                  <p className="text-sm font-semibold text-textSecondary mb-2">{m.month}</p>
                  <p className={`text-xl font-bold ${m.percentage >= 75 ? 'text-success' : 'text-danger'}`}>
                    {m.percentage}%
                  </p>
                  <p className="text-xs text-textSecondary mt-1">P: {m.present} | A: {m.absent}</p>
                </div>
              ))}
            </div>
          </div>

          {report.subjectWiseData && report.subjectWiseData.length > 0 && (
            <div>
              <h3 className="text-lg font-bold text-textPrimary mb-4 flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-secondary" /> Subject-wise Breakdown
              </h3>
              <div className="bg-background rounded-xl border border-border overflow-hidden">
                <div className="grid grid-cols-4 bg-card border-b border-border p-3 text-sm font-bold text-textSecondary">
                  <div className="col-span-1">Subject</div>
                  <div className="text-center">Present</div>
                  <div className="text-center">Absent</div>
                  <div className="text-right">Attendance %</div>
                </div>
                <div className="max-h-48 overflow-y-auto">
                  {report.subjectWiseData.map((s, idx) => (
                    <div key={idx} className="grid grid-cols-4 p-3 text-sm border-b border-border last:border-0 items-center hover:bg-gray-50 transition-colors">
                      <div className="col-span-1 font-medium text-textPrimary truncate" title={s.subject}>{s.subject}</div>
                      <div className="text-center text-success font-semibold">{s.present}</div>
                      <div className="text-center text-danger font-semibold">{s.absent}</div>
                      <div className={`text-right font-bold ${s.percentage >= 75 ? 'text-success' : 'text-danger'}`}>
                        {s.percentage}%
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          <div>
            <h3 className="text-lg font-bold text-textPrimary mb-4 flex items-center gap-2">
              <Clock className="w-5 h-5 text-gray-500" /> Recent Daily History
            </h3>
            <div className="bg-background rounded-xl border border-border overflow-hidden">
              <div className="grid grid-cols-4 bg-card border-b border-border p-3 text-sm font-bold text-textSecondary">
                <div>Date</div>
                <div>Subject / Type</div>
                <div>Time</div>
                <div className="text-right">Status</div>
              </div>
              <div className="max-h-64 overflow-y-auto">
                {report.history && report.history.length > 0 ? (
                  report.history.slice(0, 50).map((h, idx) => (
                    <div key={idx} className="grid grid-cols-4 p-3 text-sm border-b border-border last:border-0 hover:bg-gray-50 transition-colors">
                      <div className="font-medium text-textPrimary">{h.date}</div>
                      <div className="text-textSecondary truncate" title={h.subject || h.type}>{h.subject || h.type}</div>
                      <div className="text-textSecondary">{h.time || '-'}</div>
                      <div className={`text-right font-semibold ${h.status === 'Present' ? 'text-success' : 'text-danger'}`}>
                        {h.status}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="p-4 text-center text-textSecondary">No attendance history available.</div>
                )}
              </div>
            </div>
          </div>

        </div>
      </motion.div>
    </div>
  );
};

export default StudentDetailsModal;
