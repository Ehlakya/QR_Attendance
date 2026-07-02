import { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';
import { useSocket } from '../../context/SocketContext';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/common/Card';
import StatCard from '../../components/common/StatCard';
import DataTable from '../../components/common/DataTable';
import { Users, CheckCircle, XCircle, Percent } from 'lucide-react';

const AdminDetails = () => {
  const [data, setData] = useState({
    overall: {
      totalStudents: 0,
      presentStudentsToday: 0,
      absentStudentsToday: 0,
      attendancePercentage: '0%'
    },
    departmentWise: [],
    recentActivity: []
  });
  const [loading, setLoading] = useState(true);
  const { token } = useAuth();
  const socket = useSocket();

  useEffect(() => {
    fetchData();
  }, [token]);

  useEffect(() => {
    if (!socket) return;
    
    // Real-time update for new attendance marked
    const handleNewAttendance = (newRecord) => {
      // In a robust implementation, we would fully recalculate all stats.
      // For this dynamic UX, we can just refetch to get the accurate updated aggregations.
      fetchData();
    };

    socket.on('new_attendance', handleNewAttendance);
    return () => socket.off('new_attendance', handleNewAttendance);
  }, [socket]);

  const fetchData = async () => {
    try {
      const response = await axios.get('https://qr-attendance-y9x7.onrender.com/api/v1/dashboard/admin/attendance-details', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setData(response.data.data);
    } catch (error) {
      console.error('Failed to fetch attendance details');
    } finally {
      setLoading(false);
    }
  };

  const DEPT_COLUMNS = [
    { header: 'Department', accessor: 'department' },
    { header: 'Total Students', accessor: 'totalStudents' },
    { header: 'Present', accessor: 'present' },
    { header: 'Absent', accessor: 'absent' },
    { 
      header: 'Attendance %', 
      accessor: 'attendancePercentage',
      cell: (row) => (
        <span className={`font-bold ${parseFloat(row.attendancePercentage) > 75 ? 'text-success' : 'text-danger'}`}>
          {row.attendancePercentage}
        </span>
      )
    }
  ];

  if (loading) return <div className="p-8 text-center">Loading attendance details...</div>;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Daily Attendance Summary</h2>
        <p className="text-textSecondary">Comprehensive breakdown of today's attendance across the institution.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <StatCard title="Total Students" value={data.overall.totalStudents} icon={Users} color="primary" />
        <StatCard title="Present Today" value={data.overall.presentStudentsToday} icon={CheckCircle} color="success" />
        <StatCard title="Absent Today" value={data.overall.absentStudentsToday} icon={XCircle} color="danger" />
        <StatCard title="Overall Percentage" value={data.overall.attendancePercentage} icon={Percent} color="primary" trend="up" trendValue="+1.2%" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Department-wise Attendance</CardTitle>
            </CardHeader>
            <CardContent>
              <DataTable columns={DEPT_COLUMNS} data={data.departmentWise} searchable={false} />
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-1">
          <Card className="h-full">
            <CardHeader>
              <CardTitle className="text-base">Recent Attendance Activity</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {data.recentActivity.length === 0 ? (
                  <p className="text-sm text-gray-500">No recent activity.</p>
                ) : (
                  data.recentActivity.map((record) => (
                    <div key={record.id} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg animate-fade-in border border-gray-100">
                      <div>
                        <p className="font-semibold text-gray-900 text-sm">
                          {record.Student?.name || 'Unknown'}
                        </p>
                        <p className="text-xs text-gray-500 mt-0.5">
                          {record.Student?.registerNumber} | {record.Student?.Department?.name}-{record.Student?.Section?.name}
                        </p>
                      </div>
                      <div className="text-right">
                        <span className="px-2 py-1 bg-success/10 text-success text-xs rounded font-medium">Present</span>
                        <p className="text-[10px] text-gray-400 mt-1">{record.time}</p>
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

export default AdminDetails;
