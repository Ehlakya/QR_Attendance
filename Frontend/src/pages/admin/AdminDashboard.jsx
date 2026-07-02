import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';
import { Users, UserCog, Building2, QrCode } from 'lucide-react';
import StatCard from '../../components/common/StatCard';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/common/Card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useSocket } from '../../hooks/useSocket';
import toast from 'react-hot-toast';
import PendingRegistrations from '../../components/dashboard/PendingRegistrations';

const mockAttendanceData = [
  { name: 'Mon', attendance: 85 },
  { name: 'Tue', attendance: 88 },
  { name: 'Wed', attendance: 92 },
  { name: 'Thu', attendance: 80 },
  { name: 'Fri', attendance: 95 },
];

const AdminDashboard = () => {
  const socket = useSocket();
  const { token } = useAuth();
  const [stats, setStats] = useState({
    totalStudents: 0,
    totalTeachers: 0,
    totalDepartments: 0,
    totalAttendance: 0
  });

  const [recentActivities, setRecentActivities] = useState([
    { id: 1, text: 'System Online', time: 'Just now' }
  ]);

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const response = await axios.get('https://qr-attendance-y9x7.onrender.com/api/v1/dashboard/admin', {
          headers: { Authorization: `Bearer ${token}` }
        });
        setStats(response.data.data);
      } catch (error) {
        console.error('Failed to fetch dashboard data');
      }
    };
    fetchDashboard();
  }, [token]);

  useEffect(() => {
    if (!socket) return;

    socket.on('new_registration', (data) => {
      toast.success(`New Student Registered: ${data.name}`);
      setStats(prev => ({ ...prev, totalStudents: prev.totalStudents + 1 }));
      setRecentActivities(prev => [{
        id: Date.now(),
        text: `Student ${data.name} registered`,
        time: 'Just now'
      }, ...prev].slice(0, 5));
    });

    socket.on('new_teacher_added', (data) => {
      toast.success(`New Teacher Added: ${data.name}`);
      setStats(prev => ({ ...prev, totalTeachers: prev.totalTeachers + 1 }));
      setRecentActivities(prev => [{
        id: Date.now(),
        text: `Teacher ${data.name} joined`,
        time: 'Just now'
      }, ...prev].slice(0, 5));
    });

    socket.on('new_attendance', (data) => {
      toast.success(`Attendance Marked: ${data.name}`);
      setStats(prev => ({ ...prev, totalAttendance: prev.totalAttendance + 1 }));
      setRecentActivities(prev => [{
        id: Date.now(),
        text: `Student ${data.name} marked attendance`,
        time: 'Just now'
      }, ...prev].slice(0, 5));
    });

    return () => {
      socket.off('new_registration');
      socket.off('new_teacher_added');
      socket.off('new_attendance');
    };
  }, [socket]);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Admin Dashboard</h2>
        <p className="text-textSecondary">Overview of system statistics and attendance.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard title="Total Students" value={stats.totalStudents} icon={Users} color="primary" />
        <StatCard title="Total Teachers" value={stats.totalTeachers} icon={UserCog} color="secondary" />
        <Link to="/admin/departments/1" className="block transition-transform hover:-translate-y-1">
          <StatCard title="Total Departments" value={stats.totalDepartments} icon={Building2} color="warning" />
        </Link>
        <StatCard title="Today's Attendance" value={stats.totalAttendance} icon={QrCode} color="success" />
      </div>

      {/* Pending Registrations Table */}
      <PendingRegistrations />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Weekly Attendance Overview</CardTitle>
          </CardHeader>
          <CardContent className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={mockAttendanceData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#64748B' }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748B' }} />
                <Tooltip 
                  cursor={{ fill: '#F1F5F9' }}
                  contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                />
                <Bar dataKey="attendance" fill="#4F46E5" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent Activities</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {recentActivities.map((activity) => (
                <div key={activity.id} className="flex items-center gap-4 animate-fade-in">
                  <div className="w-2 h-2 rounded-full bg-success"></div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">{activity.text}</p>
                    <p className="text-xs text-textSecondary">{activity.time}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AdminDashboard;
