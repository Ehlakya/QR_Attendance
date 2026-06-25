import { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';
import { useSocket } from '../../context/SocketContext';
import { Card, CardContent, CardHeader } from '../../components/common/Card';
import StatCard from '../../components/common/StatCard';
import { Users, CheckCircle2, XCircle, Percent, Search } from 'lucide-react';
import toast from 'react-hot-toast';

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
      const response = await axios.get('http://localhost:5000/api/v1/attendance/live', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setData(response.data.data);
    } catch (error) {
      console.error('Failed to fetch live global data', error);
      toast.error('Failed to load live monitor');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGlobalData();
  }, [token]);

  useEffect(() => {
    if (!socket || !data) return;

    const handleAttendanceMarked = (eventData) => {
      // Check if this attendance belongs to any of our QRs
      const isOurQR = data.qrs.some(q => q.id.toString() === eventData.qrId.toString());
      if (isOurQR) {
        toast.success(
          (t) => (
            <div className="flex flex-col gap-1">
              <strong className="text-gray-900 border-b pb-1 mb-1 border-gray-100">✅ Attendance Marked</strong>
              <span className="text-sm">Student: {eventData.name}</span>
              <span className="text-sm">Register Number: {eventData.registerNumber}</span>
              <span className="text-sm">Subject: {eventData.subjectName}</span>
              <span className="text-sm text-gray-500 mt-1">Time: {eventData.time}</span>
            </div>
          ),
          { duration: 5000 }
        );
        // Refresh silently
        fetchGlobalData();
      }
    };

    socket.on('attendanceMarked', handleAttendanceMarked);
    return () => socket.off('attendanceMarked', handleAttendanceMarked);
  }, [socket, data]);

  if (loading) return <div className="p-8 flex justify-center text-primary animate-pulse">Initializing Live Monitor...</div>;
  if (!data) return <div className="p-8 text-center text-danger">Data unavailable.</div>;

  // Apply filters to table
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

  // Get unique filter options
  const uniqueDepts = [...new Set(data.studentList.map(s => s.department))].filter(Boolean);
  const uniqueSections = [...new Set(data.studentList.map(s => s.section))].filter(Boolean);
  const uniqueSubjects = [...new Set(data.studentList.map(s => s.subjectName))].filter(Boolean);

  const activeQRs = data.qrs.filter(q => q.isActive && !q.isExpired);
  const expiredQRs = data.qrs.filter(q => !q.isActive || q.isExpired);

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Monitor Live Attendance</h1>
          <p className="text-textSecondary mt-1">Real-time global feed across all your generated QR sessions today.</p>
        </div>
        <div className="flex items-center gap-2 text-sm font-medium text-success bg-success/10 border border-success/20 px-4 py-2 rounded-full">
          <span className="relative flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-success opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-success"></span>
          </span>
          Monitoring {activeQRs.length} active sessions
        </div>
      </div>

      {/* Analytics Cards - Global Statistics */}
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

      {/* QR Monitoring Summary */}
      <Card>
        <CardHeader className="border-b border-gray-100 pb-4 mb-4">
          <h2 className="text-lg font-bold text-gray-900">Session Status</h2>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="border border-success/20 rounded-lg p-4 bg-success/5 shadow-sm">
              <h3 className="font-semibold text-success mb-3 flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5" /> Active QRs ({activeQRs.length})
              </h3>
              {activeQRs.length === 0 ? <p className="text-sm text-gray-500">No active QR sessions.</p> : (
                <ul className="space-y-3">
                  {activeQRs.map(q => (
                    <li key={q.id} className="flex justify-between items-center border-b border-success/10 pb-2">
                      <div className="flex flex-col">
                        <span className="font-medium text-gray-900">{q.subjectName}</span>
                        <span className="text-xs text-gray-500">{q.department} - Section {q.section}</span>
                      </div>
                      <span className="text-xs font-medium text-gray-600 bg-white px-2 py-1 rounded shadow-sm border border-gray-100">
                        Exp: {new Date(q.expiryTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
            <div className="border border-gray-200 rounded-lg p-4 bg-gray-50 shadow-sm">
              <h3 className="font-semibold text-gray-600 mb-3 flex items-center gap-2">
                <XCircle className="w-5 h-5 text-gray-400" /> Expired QRs ({expiredQRs.length})
              </h3>
              {expiredQRs.length === 0 ? <p className="text-sm text-gray-500">No expired QR sessions today.</p> : (
                <ul className="space-y-3">
                  {expiredQRs.map(q => (
                    <li key={q.id} className="flex justify-between items-center border-b border-gray-200 pb-2">
                      <div className="flex flex-col">
                        <span className="font-medium text-gray-600">{q.subjectName}</span>
                        <span className="text-xs text-gray-400">{q.department} - Section {q.section}</span>
                      </div>
                      <span className="text-xs font-medium text-gray-400">
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

      {/* Live Feed Table */}
      <Card>
        <CardHeader className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 border-b border-gray-100 pb-4 mb-2">
          <h2 className="text-lg font-bold text-gray-900">Live Student Feed</h2>
          
          <div className="flex flex-wrap gap-3 w-full lg:w-auto items-center">
            {/* Filters */}
            <select className="input text-sm py-2 px-3 bg-gray-50 border-gray-200" value={deptFilter} onChange={e => setDeptFilter(e.target.value)}>
              <option value="">All Departments</option>
              {uniqueDepts.map(d => <option key={d} value={d}>{d}</option>)}
            </select>
            
            <select className="input text-sm py-2 px-3 bg-gray-50 border-gray-200" value={sectionFilter} onChange={e => setSectionFilter(e.target.value)}>
              <option value="">All Sections</option>
              {uniqueSections.map(s => <option key={s} value={s}>{s}</option>)}
            </select>

            <select className="input text-sm py-2 px-3 bg-gray-50 border-gray-200" value={subjectFilter} onChange={e => setSubjectFilter(e.target.value)}>
              <option value="">All Subjects</option>
              {uniqueSubjects.map(s => <option key={s} value={s}>{s}</option>)}
            </select>

            <div className="relative flex-1 min-w-[200px]">
              <Search className="w-4 h-4 absolute left-3 top-3 text-gray-400" />
              <input 
                type="text" 
                placeholder="Search name or reg no..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="input pl-9 text-sm py-2 bg-gray-50 border-gray-200" 
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-gray-50 text-gray-600 font-medium border-y border-gray-200">
                <tr>
                  <th className="px-4 py-3">Student Name</th>
                  <th className="px-4 py-3">Register Number</th>
                  <th className="px-4 py-3">Department</th>
                  <th className="px-4 py-3">Section</th>
                  <th className="px-4 py-3">Subject</th>
                  <th className="px-4 py-3">Time</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredStudents.map((student, idx) => (
                  <tr key={`${student.id}-${idx}`} className="hover:bg-gray-50/50 transition-colors animate-in fade-in slide-in-from-top-2 duration-300">
                    <td className="px-4 py-3 font-medium text-gray-900">{student.name}</td>
                    <td className="px-4 py-3 text-gray-600">{student.registerNumber}</td>
                    <td className="px-4 py-3 text-gray-600">{student.department}</td>
                    <td className="px-4 py-3 text-gray-600">
                      <span className="bg-gray-100 text-gray-700 px-2 py-0.5 rounded text-xs font-medium border border-gray-200">
                        {student.section}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-600">
                      <span className="bg-indigo-50 text-indigo-700 px-2.5 py-1 rounded-md text-xs font-semibold border border-indigo-100">
                        {student.subjectName}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-semibold text-gray-800">{student.time}</td>
                  </tr>
                ))}
                {filteredStudents.length === 0 && (
                  <tr>
                    <td colSpan="6" className="px-4 py-12 text-center text-gray-500">
                      No live attendance data matches your filters.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default MonitorLiveAttendance;
