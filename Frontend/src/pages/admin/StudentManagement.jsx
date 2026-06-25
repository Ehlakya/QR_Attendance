import { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';
import { useSocket } from '../../context/SocketContext';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/common/Card';
import StatCard from '../../components/common/StatCard';
import DataTable from '../../components/common/DataTable';
import { Users, UserPlus, Clock, CheckCircle } from 'lucide-react';

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
  const { token } = useAuth();
  const socket = useSocket();

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
        axios.get('http://localhost:5000/api/v1/dashboard/admin/students', {
          headers: { Authorization: `Bearer ${token}` }
        }),
        axios.get('http://localhost:5000/api/v1/students', {
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
          <button className="text-xs px-2 py-1 bg-primary/10 text-primary rounded hover:bg-primary/20 transition-colors">View</button>
          <button className="text-xs px-2 py-1 bg-warning/10 text-warning rounded hover:bg-warning/20 transition-colors">Edit</button>
          <button className="text-xs px-2 py-1 bg-danger/10 text-danger rounded hover:bg-danger/20 transition-colors">Delete</button>
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
    </div>
  );
};

export default StudentManagement;
