import { useState, useEffect } from 'react';
import axios from 'axios';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/common/Card';
import StatCard from '../../components/common/StatCard';
import { Users, UserCheck, UserX, Percent } from 'lucide-react';
import PendingRegistrations from '../../components/dashboard/PendingRegistrations';
import { useAuth } from '../../context/AuthContext';
import { Loader2 } from 'lucide-react';

const HODDashboard = () => {
  const { user, token } = useAuth();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  
  const deptId = user?.departmentId || null;

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await axios.get('https://qr-attendance-y9x7.onrender.com/api/v1/dashboard/teacher/stats', {
          headers: { Authorization: `Bearer ${token}` }
        });
        setStats(response.data.data);
      } catch (error) {
        console.error('Failed to fetch dashboard stats');
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, [token]);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">HOD Dashboard</h2>
        <p className="text-textSecondary">Manage your department's attendance and student registrations.</p>
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-32">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      ) : stats ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard title="Total Students" value={stats.totalStudents} icon={Users} color="primary" />
          <StatCard title="Present Today" value={stats.presentToday} icon={UserCheck} color="success" />
          <StatCard title="Absent Today" value={stats.absentToday} icon={UserX} color="danger" />
          <StatCard title="Attendance Rate" value={stats.attendancePercentage} icon={Percent} color="warning" />
        </div>
      ) : (
        <div className="text-center text-textSecondary py-10">Failed to load statistics.</div>
      )}

      <PendingRegistrations departmentId={deptId} />
      
    </div>
  );
};

export default HODDashboard;
