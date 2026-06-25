import { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';
import { useSocket } from '../../context/SocketContext';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/common/Card';
import StatCard from '../../components/common/StatCard';
import DataTable from '../../components/common/DataTable';
import { Users, UserCog, Building, BookOpen } from 'lucide-react';

const TeacherManagement = () => {
  const [stats, setStats] = useState({
    totalTeachers: 0,
    totalHODs: 0,
    totalClassTeachers: 0,
    totalSubjectTeachers: 0,
    teachersList: []
  });
  const [loading, setLoading] = useState(true);
  const { token } = useAuth();
  const socket = useSocket();

  useEffect(() => {
    fetchData();
  }, [token]);

  useEffect(() => {
    if (!socket) return;
    
    const handleNewTeacher = (newTeacher) => {
      setStats(prev => ({
        ...prev,
        totalTeachers: prev.totalTeachers + 1,
        totalHODs: newTeacher.role === 'HOD' ? prev.totalHODs + 1 : prev.totalHODs,
        totalClassTeachers: newTeacher.role === 'Class Teacher' ? prev.totalClassTeachers + 1 : prev.totalClassTeachers,
        totalSubjectTeachers: newTeacher.role === 'Subject Teacher' ? prev.totalSubjectTeachers + 1 : prev.totalSubjectTeachers,
        teachersList: [newTeacher, ...prev.teachersList]
      }));
    };

    socket.on('new_teacher_added', handleNewTeacher);
    return () => socket.off('new_teacher_added', handleNewTeacher);
  }, [socket]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const response = await axios.get('http://localhost:5000/api/v1/dashboard/admin/teachers', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setStats(response.data.data);
    } catch (error) {
      console.error('Failed to fetch teacher data');
    } finally {
      setLoading(false);
    }
  };

  const COLUMNS = [
    { header: 'Teacher Name', accessor: 'name' },
    { header: 'Email', accessor: 'email' },
    { 
      header: 'Role', 
      accessor: 'role',
      cell: (row) => (
        <span className="px-2.5 py-1 rounded-md text-xs font-semibold bg-primary/10 text-primary">
          {row.role}
        </span>
      )
    },
    { header: 'Department', accessor: (row) => row.Department?.name || 'N/A' },
    { header: 'Joined Date', accessor: (row) => new Date(row.createdAt).toLocaleDateString() },
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

  if (loading) return <div className="p-8 text-center">Loading teacher data...</div>;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Teacher Management</h2>
        <p className="text-textSecondary">Manage faculty members and their administrative roles.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <StatCard title="Total Teachers" value={stats.totalTeachers} icon={Users} color="primary" />
        <StatCard title="Total HODs" value={stats.totalHODs} icon={Building} color="success" />
        <StatCard title="Class Teachers" value={stats.totalClassTeachers} icon={UserCog} color="warning" />
        <StatCard title="Subject Teachers" value={stats.totalSubjectTeachers} icon={BookOpen} color="primary" />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Faculty Directory</CardTitle>
        </CardHeader>
        <CardContent>
          <DataTable columns={COLUMNS} data={stats.teachersList} searchable={true} />
        </CardContent>
      </Card>
    </div>
  );
};

export default TeacherManagement;
