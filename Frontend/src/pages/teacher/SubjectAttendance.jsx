import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';
import { useSocket } from '../../context/SocketContext';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/common/Card';
import StatCard from '../../components/common/StatCard';
import { Users, CheckCircle2, XCircle, Percent, Download, Search, FileText, FileSpreadsheet } from 'lucide-react';
import autoTable from 'jspdf-autotable';
import jsPDF from 'jspdf';
import * as XLSX from 'xlsx';
import toast from 'react-hot-toast';

const SubjectAttendance = () => {
  const { qrId } = useParams();
  const { token } = useAuth();
  const socket = useSocket();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('all'); // all, present, absent

  const fetchSessionData = async () => {
    try {
      const response = await axios.get(`http://localhost:5000/api/v1/attendance/session/${qrId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setData(response.data.data);
    } catch (error) {
      console.error('Failed to fetch session', error);
      toast.error('Failed to load session details');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSessionData();
  }, [qrId, token]);

  useEffect(() => {
    if (!socket || !data) return;
    
    const handleNewAttendance = (eventData) => {
      // Ensure the event matches the specific session being viewed (qrId is string from useParams, eventData.qrId is int)
      if (eventData.qrId.toString() === qrId.toString()) {
        toast.success(
          (t) => (
            <div className="flex flex-col gap-1">
              <strong className="text-gray-900 border-b pb-1 mb-1 border-gray-100">✅ New Attendance Marked</strong>
              <span className="text-sm">Student: {eventData.name}</span>
              <span className="text-sm">Register No: {eventData.registerNumber}</span>
              <span className="text-sm">Subject: {eventData.subjectName}</span>
              <span className="text-sm text-gray-500 mt-1">Time: {eventData.time}</span>
            </div>
          ),
          { duration: 5000 }
        );
        fetchSessionData();
      }
    };

    socket.on('attendanceMarked', handleNewAttendance);
    return () => socket.off('attendanceMarked', handleNewAttendance);
  }, [socket, data, qrId]);

  const exportPDF = () => {
    if (!data) return;
    const doc = new jsPDF();
    doc.setFontSize(16);
    doc.text(`Subject Attendance: ${data.sessionInfo.subjectName}`, 14, 15);
    
    doc.setFontSize(10);
    doc.text(`Department: ${data.sessionInfo.department}`, 14, 25);
    doc.text(`Section: ${data.sessionInfo.section}`, 14, 30);
    doc.text(`Date: ${data.sessionInfo.date}`, 14, 35);

    autoTable(doc, {
      head: [["Student Name", "Register Number", "Subject", "Time"]],
      body: data.studentList.map(s => [s.name, s.registerNumber, data.sessionInfo.subjectName, s.time]),
      startY: 45,
      headStyles: { fillColor: [79, 70, 229] }
    });
    doc.save(`Attendance_${data.sessionInfo.subjectName}_${data.sessionInfo.date}.pdf`);
  };

  const exportExcel = () => {
    if (!data) return;
    const worksheet = XLSX.utils.json_to_sheet(data.studentList);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Attendance");
    XLSX.writeFile(workbook, `Attendance_${data.sessionInfo.subjectName}_${data.sessionInfo.date}.xlsx`);
  };

  if (loading) return <div className="p-8 flex justify-center text-primary animate-pulse">Loading Live Session...</div>;
  if (!data) return <div className="p-8 text-center text-danger">Session not found.</div>;

  let displayedStudents = data.studentList;
  if (activeTab === 'present') displayedStudents = data.presentStudents;
  if (activeTab === 'absent') displayedStudents = data.absentStudents;

  if (searchTerm) {
    displayedStudents = displayedStudents.filter(s => 
      s.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
      s.registerNumber.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      
      {/* Session Header Card */}
      <Card className="bg-gradient-to-r from-primary to-indigo-600 text-white border-none shadow-lg">
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
            <div className="space-y-1">
              <h1 className="text-3xl font-bold">{data.sessionInfo.subjectName}</h1>
              <div className="flex flex-wrap gap-4 text-white/80 text-sm">
                <span><strong className="text-white">Department:</strong> {data.sessionInfo.department}</span>
                <span><strong className="text-white">Section:</strong> {data.sessionInfo.section}</span>
                <span><strong className="text-white">Class Time:</strong> {data.sessionInfo.period}</span>
                <span><strong className="text-white">Date:</strong> {data.sessionInfo.date}</span>
                <span><strong className="text-white">Teacher:</strong> {data.sessionInfo.teacherName}</span>
              </div>
            </div>
            <div className="flex gap-3">
              <button onClick={exportPDF} className="btn-secondary bg-white/10 hover:bg-white/20 text-white border-none flex items-center justify-center gap-2">
                <FileText className="w-4 h-4" /> PDF Report
              </button>
              <button onClick={exportExcel} className="btn-secondary bg-white/10 hover:bg-white/20 text-white border-none flex items-center justify-center gap-2">
                <FileSpreadsheet className="w-4 h-4" /> Excel Export
              </button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Analytics Cards */}
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

      {/* Student List Section */}
      <Card>
        <CardHeader className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex bg-gray-100 p-1 rounded-lg">
            <button 
              className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${activeTab === 'all' ? 'bg-white shadow text-gray-900' : 'text-gray-500 hover:text-gray-900'}`}
              onClick={() => setActiveTab('all')}
            >
              All Students
            </button>
            <button 
              className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${activeTab === 'present' ? 'bg-white shadow text-success' : 'text-gray-500 hover:text-gray-900'}`}
              onClick={() => setActiveTab('present')}
            >
              Present ({data.stats.presentCount})
            </button>
            <button 
              className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${activeTab === 'absent' ? 'bg-white shadow text-danger' : 'text-gray-500 hover:text-gray-900'}`}
              onClick={() => setActiveTab('absent')}
            >
              Absent ({data.stats.absentCount})
            </button>
          </div>
          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 absolute left-3 top-3 text-gray-400" />
            <input 
              type="text" 
              placeholder="Search student..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="input pl-9" 
            />
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-gray-50 text-gray-600 font-medium border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3 rounded-tl-lg">Student Name</th>
                  <th className="px-4 py-3">Register Number</th>
                  <th className="px-4 py-3">Department</th>
                  <th className="px-4 py-3">Section</th>
                  <th className="px-4 py-3">Subject</th>
                  <th className="px-4 py-3 rounded-tr-lg">Time</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {displayedStudents.map((student) => (
                  <tr key={student.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-4 py-3 font-medium text-gray-900">{student.name}</td>
                    <td className="px-4 py-3 text-gray-600">{student.registerNumber}</td>
                    <td className="px-4 py-3 text-gray-600">{student.department}</td>
                    <td className="px-4 py-3 text-gray-600">{student.section}</td>
                    <td className="px-4 py-3 text-gray-600">
                      {data.sessionInfo.subjectName}
                    </td>
                    <td className="px-4 py-3 text-textSecondary">{student.time}</td>
                  </tr>
                ))}
                {displayedStudents.length === 0 && (
                  <tr>
                    <td colSpan="6" className="px-4 py-8 text-center text-textSecondary">
                      No students found.
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

export default SubjectAttendance;
