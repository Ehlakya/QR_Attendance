import { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';
import { useSocket } from '../../context/SocketContext';
import { Card, CardContent, CardHeader } from '../../components/common/Card';
import StatCard from '../../components/common/StatCard';
import { Users, CheckCircle2, XCircle, Percent, Search } from 'lucide-react';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';

const SkeletonRow = () => (
  <tr className="animate-pulse border-b border-border last:border-0">
    <td className="px-4 py-4"><div className="h-4 bg-border rounded w-32"></div></td>
    <td className="px-4 py-4"><div className="h-4 bg-border rounded w-24"></div></td>
    <td className="px-4 py-4"><div className="h-4 bg-border rounded w-16"></div></td>
    <td className="px-4 py-4"><div className="h-4 bg-border rounded w-12"></div></td>
    <td className="px-4 py-4"><div className="h-4 bg-border rounded w-24"></div></td>
    <td className="px-4 py-4"><div className="h-4 bg-border rounded w-20"></div></td>
  </tr>
);

const MonitorLiveAttendance = () => {
  const { token } = useAuth();
  const socket = useSocket();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Filters
  const [deptFilter, setDeptFilter] = useState('');
  const [sectionFilter, setSectionFilter] = useState('');
  const [subjectFilter, setSubjectFilter] = useState('');

  const fetchGlobalData = async () => {
    try {
      const response = await axios.get('https://qr-attendance-y9x7.onrender.com/api/v1/attendance/live', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setData(response.data.data);
    } catch (error) {
      console.error('Failed to fetch live global data', error);
      toast.error('Failed to load live monitor');
    } finally {
      setTimeout(() => setLoading(false), 800); // Simulate premium skeleton loader
    }
  };

  useEffect(() => {
    fetchGlobalData();
  }, [token]);

  useEffect(() => {
    if (!socket || !data) return;

    const handleAttendanceMarked = (eventData) => {
      const isOurQR = data.qrs.some(q => q.id.toString() === eventData.qrId.toString());
      if (isOurQR) {
        toast.success(
          (t) => (
            <div className="flex flex-col gap-1">
              <strong className="text-textPrimary border-b pb-1 mb-1 border-border">✅ Attendance Marked</strong>
              <span className="text-sm">Student: {eventData.name}</span>
              <span className="text-sm">Register Number: {eventData.registerNumber}</span>
              <span className="text-sm">Subject: {eventData.subjectName}</span>
              <span className="text-sm text-textSecondary mt-1">Time: {eventData.time}</span>
            </div>
          ),
          { duration: 5000 }
        );
        fetchGlobalData();
      }
    };

    socket.on('attendanceMarked', handleAttendanceMarked);
    return () => socket.off('attendanceMarked', handleAttendanceMarked);
  }, [socket, data]);

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex justify-between items-center">
          <div className="space-y-2">
            <div className="h-8 bg-border rounded w-64 animate-pulse"></div>
            <div className="h-4 bg-border rounded w-96 animate-pulse"></div>
          </div>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="h-28 bg-border rounded-[20px] animate-pulse"></div>
          <div className="h-28 bg-border rounded-[20px] animate-pulse"></div>
          <div className="h-28 bg-border rounded-[20px] animate-pulse"></div>
          <div className="h-28 bg-border rounded-[20px] animate-pulse"></div>
        </div>
        <Card>
          <CardContent className="p-0">
            <table className="w-full">
              <tbody>
                <SkeletonRow /><SkeletonRow /><SkeletonRow /><SkeletonRow />
              </tbody>
            </table>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!data) return <div className="p-8 text-center text-danger">Data unavailable.</div>;

  let filteredStudents = data.studentList;
  if (deptFilter) filteredStudents = filteredStudents.filter(s => s.department === deptFilter);
  if (sectionFilter) filteredStudents = filteredStudents.filter(s => s.section === sectionFilter);
  if (subjectFilter) filteredStudents = filteredStudents.filter(s => s.subjectName === subjectFilter);
  if (searchTerm) {
    filteredStudents = filteredStudents.filter(s => 
      s.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
      s.registerNumber.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }

  const uniqueDepts = [...new Set(data.studentList.map(s => s.department))].filter(Boolean);
  const uniqueSections = [...new Set(data.studentList.map(s => s.section))].filter(Boolean);
  const uniqueSubjects = [...new Set(data.studentList.map(s => s.subjectName))].filter(Boolean);

  const activeQRs = data.qrs.filter(q => q.isActive && !q.isExpired);
  const expiredQRs = data.qrs.filter(q => !q.isActive || q.isExpired);

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="max-w-7xl mx-auto space-y-6"
    >
      
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-textPrimary tracking-tight">Monitor Live Attendance</h1>
          <p className="text-textSecondary mt-1 font-medium">Real-time global feed across all your generated QR sessions today.</p>
        </div>
        <div className="flex items-center gap-2 text-sm font-medium text-success bg-success/10 border border-success/20 px-4 py-2 rounded-full shadow-sm">
          <span className="relative flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-success opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-success"></span>
          </span>
          Monitoring {activeQRs.length} active sessions
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard title="Total Students" value={data.stats.totalStudents} icon={Users} color="primary" />
        <StatCard title="Present Students" value={data.stats.presentCount} icon={CheckCircle2} color="success" />
        <StatCard title="Absent Students" value={data.stats.absentCount} icon={XCircle} color="danger" />
        <StatCard 
          title="Attendance %" 
          value={`${data.stats.attendancePercentage}%`} 
          icon={Percent} 
          color={data.stats.attendancePercentage >= 75 ? "success" : "warning"} 
        />
      </div>

      <Card>
        <CardHeader className="border-b border-border pb-4 mb-4">
          <h2 className="text-lg font-bold text-textPrimary">Session Status</h2>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="border border-success/20 rounded-xl p-4 bg-success/5 shadow-sm">
              <h3 className="font-semibold text-success mb-3 flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5" /> Active QRs ({activeQRs.length})
              </h3>
              {activeQRs.length === 0 ? <p className="text-sm text-textSecondary">No active QR sessions.</p> : (
                <ul className="space-y-3">
                  {activeQRs.map(q => (
                    <li key={q.id} className="flex justify-between items-center border-b border-success/10 pb-2">
                      <div className="flex flex-col">
                        <span className="font-medium text-textPrimary">{q.subjectName}</span>
                        <span className="text-xs text-textSecondary/80">{q.department} - Section {q.section}</span>
                      </div>
                      <span className="text-xs font-medium text-textSecondary bg-card px-2 py-1 rounded shadow-sm border border-border">
                        Exp: {new Date(q.expiryTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
            <div className="border border-border rounded-xl p-4 bg-background shadow-sm">
              <h3 className="font-semibold text-textSecondary mb-3 flex items-center gap-2">
                <XCircle className="w-5 h-5 text-textSecondary/60" /> Expired QRs ({expiredQRs.length})
              </h3>
              {expiredQRs.length === 0 ? <p className="text-sm text-textSecondary/80">No expired QR sessions today.</p> : (
                <ul className="space-y-3">
                  {expiredQRs.map(q => (
                    <li key={q.id} className="flex justify-between items-center border-b border-border pb-2">
                      <div className="flex flex-col">
                        <span className="font-medium text-textSecondary">{q.subjectName}</span>
                        <span className="text-xs text-textSecondary/60">{q.department} - Section {q.section}</span>
                      </div>
                      <span className="text-xs font-medium text-textSecondary/60">
                        Exp: {new Date(q.expiryTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 border-b border-border pb-4 mb-2">
          <h2 className="text-lg font-bold text-textPrimary">Live Student Feed</h2>
          
          <div className="flex flex-wrap gap-3 w-full lg:w-auto items-center">
            <select className="input text-sm py-2 px-3 bg-background/50 focus:bg-background border-border transition-colors text-textPrimary" value={deptFilter} onChange={e => setDeptFilter(e.target.value)}>
              <option value="">All Departments</option>
              {uniqueDepts.map(d => <option key={d} value={d}>{d}</option>)}
            </select>
            
            <select className="input text-sm py-2 px-3 bg-background/50 focus:bg-background border-border transition-colors text-textPrimary" value={sectionFilter} onChange={e => setSectionFilter(e.target.value)}>
              <option value="">All Sections</option>
              {uniqueSections.map(s => <option key={s} value={s}>{s}</option>)}
            </select>

            <select className="input text-sm py-2 px-3 bg-background/50 focus:bg-background border-border transition-colors text-textPrimary" value={subjectFilter} onChange={e => setSubjectFilter(e.target.value)}>
              <option value="">All Subjects</option>
              {uniqueSubjects.map(s => <option key={s} value={s}>{s}</option>)}
            </select>

            <div className="relative flex-1 min-w-[200px]">
              <Search className="w-4 h-4 absolute left-3 top-3 text-textSecondary/60" />
              <input 
                type="text" 
                placeholder="Search name or reg no..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="input pl-9 text-sm py-2 bg-background/50 focus:bg-background border-border transition-colors text-textPrimary" 
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-background/80 text-textSecondary font-medium border-y border-border">
                <tr>
                  <th className="px-4 py-3">Student Name</th>
                  <th className="px-4 py-3">Register Number</th>
                  <th className="px-4 py-3">Department</th>
                  <th className="px-4 py-3">Section</th>
                  <th className="px-4 py-3">Subject</th>
                  <th className="px-4 py-3">Time</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                <AnimatePresence>
                  {filteredStudents.map((student, idx) => (
                    <motion.tr 
                      key={`${student.id}-${student.time}`}
                      initial={{ opacity: 0, x: -20, backgroundColor: 'rgba(99, 102, 241, 0.1)' }}
                      animate={{ opacity: 1, x: 0, backgroundColor: 'rgba(255, 255, 255, 0)' }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      transition={{ duration: 0.5, delay: idx * 0.05 }}
                      className="hover:bg-gray-50/50 transition-colors"
                    >
                      <td className="px-4 py-3 font-medium text-textPrimary">{student.name}</td>
                      <td className="px-4 py-3 text-textSecondary">{student.registerNumber}</td>
                      <td className="px-4 py-3 text-textSecondary">{student.department}</td>
                      <td className="px-4 py-3 text-textSecondary">
                        <span className="bg-background text-textPrimary px-2 py-0.5 rounded text-xs font-medium border border-border shadow-sm">
                          {student.section}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-textSecondary">
                        <span className="bg-primary/10 text-primary px-2.5 py-1 rounded-md text-xs font-semibold border border-primary/20 shadow-sm">
                          {student.subjectName}
                        </span>
                      </td>
                      <td className="px-4 py-3 font-semibold text-textPrimary">{student.time}</td>
                    </motion.tr>
                  ))}
                </AnimatePresence>
                {filteredStudents.length === 0 && (
                  <tr>
                    <td colSpan="6" className="px-4 py-12 text-center text-textSecondary/80 font-medium">
                      No live attendance data matches your filters.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default MonitorLiveAttendance;
