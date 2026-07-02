import { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';
import { useSocket } from '../../context/SocketContext';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/common/Card';
import StatCard from '../../components/common/StatCard';
import DataTable from '../../components/common/DataTable';
import { Users, UserPlus, Clock, CheckCircle, X, AlertTriangle } from 'lucide-react';
import toast from 'react-hot-toast';

const StudentManagement = () => {
  const [stats, setStats] = useState({
    totalStudents: 0,
    newRegistrationsToday: 0,
    pendingRegistrations: 0,
    approvedStudents: 0,
    recentRegistrations: []
  });
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [viewStudent, setViewStudent] = useState(null);
  const [deleteStudentId, setDeleteStudentId] = useState(null);
  const { token } = useAuth();
  const socket = useSocket();

  const handleDelete = async () => {
    if (!deleteStudentId) return;
    try {
      await axios.delete(`https://qr-attendance-y9x7.onrender.com/api/v1/students/${deleteStudentId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setStudents(students.filter(s => s.id !== deleteStudentId));
      setStats(prev => ({
        ...prev,
        totalStudents: prev.totalStudents - 1
      }));
      toast.success('Student deleted successfully');
      setDeleteStudentId(null);
    } catch (error) {
      toast.error('Failed to delete student');
    }
  };

  useEffect(() => {
    fetchData();
  }, [token]);

  useEffect(() => {
    if (!socket) return;
    
    // Real-time update for new student registration
    const handleNewStudent = (newStudent) => {
      setStats(prev => ({
        ...prev,
        totalStudents: prev.totalStudents + 1,
        newRegistrationsToday: prev.newRegistrationsToday + 1,
        pendingRegistrations: prev.pendingRegistrations + 1,
        recentRegistrations: [newStudent, ...prev.recentRegistrations].slice(0, 10)
      }));
      setStudents(prev => [newStudent, ...prev]);
    };

    socket.on('new_registration', handleNewStudent);
    return () => socket.off('new_registration', handleNewStudent);
  }, [socket]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [statsRes, studentsRes] = await Promise.all([
        axios.get('https://qr-attendance-y9x7.onrender.com/api/v1/dashboard/admin/students', {
          headers: { Authorization: `Bearer ${token}` }
        }),
        axios.get('https://qr-attendance-y9x7.onrender.com/api/v1/students', {
          headers: { Authorization: `Bearer ${token}` }
        })
      ]);
      setStats(statsRes.data.data);
      setStudents(studentsRes.data.data);
    } catch (error) {
      console.error('Failed to fetch student data');
    } finally {
      setLoading(false);
    }
  };

  const COLUMNS = [
    { header: 'Student Name', accessor: 'name' },
    { header: 'Register Number', accessor: 'registerNumber' },
    { header: 'Department', accessor: (row) => row.Department?.name || 'N/A' },
    { header: 'Section', accessor: (row) => row.Section?.name || 'N/A' },
    { header: 'Email', accessor: 'email' },
    { 
      header: 'Status', 
      accessor: 'status',
      cell: (row) => (
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
          row.status === 'Approved' ? 'bg-success/10 text-success' : 'bg-warning/10 text-warning'
        }`}>
          {row.status}
        </span>
      )
    },
    {
      header: 'Actions',
      accessor: 'actions',
      cell: (row) => (
        <div className="flex gap-2">
          <button onClick={() => setViewStudent(row)} className="text-xs px-2 py-1 bg-primary/10 text-primary rounded hover:bg-primary/20 transition-colors">View</button>
          <button onClick={() => setDeleteStudentId(row.id)} className="text-xs px-2 py-1 bg-danger/10 text-danger rounded hover:bg-danger/20 transition-colors">Delete</button>
        </div>
      )
    }
  ];

  if (loading) return <div className="p-8 text-center">Loading student data...</div>;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Student Management</h2>
        <p className="text-textSecondary">Manage all student registrations and details.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <StatCard title="Total Registered" value={stats.totalStudents} icon={Users} color="primary" />
        <StatCard title="New Today" value={stats.newRegistrationsToday} icon={UserPlus} color="success" />
        <StatCard title="Pending" value={stats.pendingRegistrations} icon={Clock} color="warning" />
        <StatCard title="Approved" value={stats.approvedStudents} icon={CheckCircle} color="success" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-3">
          <Card>
            <CardHeader>
              <CardTitle>All Students</CardTitle>
            </CardHeader>
            <CardContent>
              <DataTable columns={COLUMNS} data={students} searchable={true} />
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Recently Registered</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {stats.recentRegistrations.length === 0 ? (
                  <p className="text-sm text-gray-500">No recent registrations.</p>
                ) : (
                  stats.recentRegistrations.map((student) => (
                    <div key={student.id} className="p-3 bg-gray-50 rounded-lg animate-fade-in border border-gray-100">
                      <p className="font-semibold text-gray-900 text-sm">{student.name}</p>
                      <div className="flex justify-between mt-1 text-xs text-gray-500">
                        <span>{student.registerNumber}</span>
                        <span>{new Date(student.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* View Student Modal */}
      {viewStudent && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-card rounded-2xl shadow-xl w-full max-w-2xl overflow-hidden animate-scale-in border border-border">
            <div className="flex justify-between items-center p-6 border-b border-border">
              <h3 className="text-lg font-bold text-textPrimary">Student Details</h3>
              <button onClick={() => setViewStudent(null)} className="text-textSecondary hover:text-danger transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="text-xs text-textSecondary uppercase tracking-wider font-semibold">Name</label>
                  <p className="text-textPrimary font-medium">{viewStudent.name}</p>
                </div>
                <div>
                  <label className="text-xs text-textSecondary uppercase tracking-wider font-semibold">Register Number</label>
                  <p className="text-textPrimary font-medium">{viewStudent.registerNumber}</p>
                </div>
                <div>
                  <label className="text-xs text-textSecondary uppercase tracking-wider font-semibold">Department</label>
                  <p className="text-textPrimary font-medium">{viewStudent.Department?.name || 'N/A'}</p>
                </div>
                <div>
                  <label className="text-xs text-textSecondary uppercase tracking-wider font-semibold">Section</label>
                  <p className="text-textPrimary font-medium">{viewStudent.Section?.name || 'N/A'}</p>
                </div>
                <div>
                  <label className="text-xs text-textSecondary uppercase tracking-wider font-semibold">Phone Number</label>
                  <p className="text-textPrimary font-medium">{viewStudent.phone || 'N/A'}</p>
                </div>
                <div>
                  <label className="text-xs text-textSecondary uppercase tracking-wider font-semibold">Email</label>
                  <p className="text-textPrimary font-medium">{viewStudent.email || 'N/A'}</p>
                </div>
                <div>
                  <label className="text-xs text-textSecondary uppercase tracking-wider font-semibold">Year & Semester</label>
                  <p className="text-textPrimary font-medium">Year {viewStudent.year || 1}, Semester {viewStudent.semester || 1}</p>
                </div>
                <div>
                  <label className="text-xs text-textSecondary uppercase tracking-wider font-semibold">Attendance Details</label>
                  <p className="text-textPrimary font-medium">{viewStudent.attendancePercentage || 0}%</p>
                </div>
                <div className="md:col-span-2">
                  <label className="text-xs text-textSecondary uppercase tracking-wider font-semibold">QR Information</label>
                  <p className="text-textPrimary font-medium">{viewStudent.qrCode || 'No active QR assigned'}</p>
                </div>
              </div>
            </div>
            <div className="p-6 border-t border-border bg-black/5 flex justify-end">
              <button onClick={() => setViewStudent(null)} className="btn-secondary">Close</button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteStudentId && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-card rounded-2xl shadow-xl w-full max-w-sm overflow-hidden animate-scale-in border border-border">
            <div className="p-6 text-center space-y-4">
              <div className="w-16 h-16 bg-danger/10 text-danger rounded-full flex items-center justify-center mx-auto mb-4">
                <AlertTriangle className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-bold text-textPrimary">Delete Student?</h3>
              <p className="text-textSecondary text-sm">
                Are you sure you want to delete this student? This action cannot be undone.
              </p>
            </div>
            <div className="p-4 border-t border-border bg-black/5 flex justify-end gap-3">
              <button onClick={() => setDeleteStudentId(null)} className="btn-secondary flex-1">Cancel</button>
              <button onClick={handleDelete} className="bg-danger text-white px-4 py-2 rounded-lg hover:bg-danger/90 transition-colors font-medium flex-1">Yes, Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StudentManagement;
