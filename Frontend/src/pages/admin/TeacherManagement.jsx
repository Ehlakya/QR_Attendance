import { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';
import { useSocket } from '../../context/SocketContext';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/common/Card';
import StatCard from '../../components/common/StatCard';
import DataTable from '../../components/common/DataTable';
import { Users, UserCog, Building, BookOpen, X, AlertTriangle } from 'lucide-react';
import toast from 'react-hot-toast';

const TeacherManagement = () => {
  const [stats, setStats] = useState({
    totalTeachers: 0,
    totalHODs: 0,
    totalClassTeachers: 0,
    totalSubjectTeachers: 0,
    teachersList: []
  });
  const [loading, setLoading] = useState(true);
  const [viewTeacher, setViewTeacher] = useState(null);
  const [deleteTeacherId, setDeleteTeacherId] = useState(null);
  const { token } = useAuth();
  const socket = useSocket();

  const handleDelete = async () => {
    if (!deleteTeacherId) return;
    try {
      await axios.delete(`https://qr-attendance-y9x7.onrender.com/api/v1/teachers/${deleteTeacherId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setStats(prev => ({
        ...prev,
        totalTeachers: prev.totalTeachers - 1,
        teachersList: prev.teachersList.filter(t => t.id !== deleteTeacherId)
      }));
      toast.success('Teacher deleted successfully');
      setDeleteTeacherId(null);
    } catch (error) {
      toast.error('Failed to delete teacher');
    }
  };

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
      const response = await axios.get('https://qr-attendance-y9x7.onrender.com/api/v1/dashboard/admin/teachers', {
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
    { header: 'Mobile Number', accessor: (row) => row.phone || 'N/A' },
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
    { header: 'Subject', accessor: (row) => row.subject || 'N/A' },
    { header: 'Joined Date', accessor: (row) => new Date(row.createdAt).toLocaleDateString() },
    {
      header: 'Actions',
      accessor: 'actions',
      cell: (row) => (
        <div className="flex gap-2">
          <button onClick={() => setViewTeacher(row)} className="text-xs px-2 py-1 bg-primary/10 text-primary rounded hover:bg-primary/20 transition-colors">View</button>
          <button onClick={() => setDeleteTeacherId(row.id)} className="text-xs px-2 py-1 bg-danger/10 text-danger rounded hover:bg-danger/20 transition-colors">Delete</button>
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

      {/* View Teacher Modal */}
      {viewTeacher && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-card rounded-2xl shadow-xl w-full max-w-2xl overflow-hidden animate-scale-in border border-border">
            <div className="flex justify-between items-center p-6 border-b border-border">
              <h3 className="text-lg font-bold text-textPrimary">Teacher Details</h3>
              <button onClick={() => setViewTeacher(null)} className="text-textSecondary hover:text-danger transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="text-xs text-textSecondary uppercase tracking-wider font-semibold">Name</label>
                  <p className="text-textPrimary font-medium">{viewTeacher.name}</p>
                </div>
                <div>
                  <label className="text-xs text-textSecondary uppercase tracking-wider font-semibold">Email</label>
                  <p className="text-textPrimary font-medium">{viewTeacher.email || 'N/A'}</p>
                </div>
                <div>
                  <label className="text-xs text-textSecondary uppercase tracking-wider font-semibold">Department</label>
                  <p className="text-textPrimary font-medium">{viewTeacher.Department?.name || 'N/A'}</p>
                </div>
                <div>
                  <label className="text-xs text-textSecondary uppercase tracking-wider font-semibold">Role</label>
                  <p className="text-textPrimary font-medium">{viewTeacher.role}</p>
                </div>
                <div>
                  <label className="text-xs text-textSecondary uppercase tracking-wider font-semibold">Joining Date</label>
                  <p className="text-textPrimary font-medium">{new Date(viewTeacher.createdAt).toLocaleDateString()}</p>
                </div>
                <div>
                  <label className="text-xs text-textSecondary uppercase tracking-wider font-semibold">Phone Number</label>
                  <p className="text-textPrimary font-medium">{viewTeacher.phone || 'N/A'}</p>
                </div>
                <div className="md:col-span-2">
                  <label className="text-xs text-textSecondary uppercase tracking-wider font-semibold">Assigned Subjects / Classes</label>
                  <p className="text-textPrimary font-medium italic text-sm text-textSecondary">
                    {viewTeacher.subjects && viewTeacher.subjects.length > 0 ? (
                      viewTeacher.subjects.map(s => s.name).join(', ')
                    ) : (
                      'Subject assignments are managed in the curriculum section.'
                    )}
                  </p>
                </div>
              </div>
            </div>
            <div className="p-6 border-t border-border bg-black/5 flex justify-end">
              <button onClick={() => setViewTeacher(null)} className="btn-secondary">Close</button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteTeacherId && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-card rounded-2xl shadow-xl w-full max-w-sm overflow-hidden animate-scale-in border border-border">
            <div className="p-6 text-center space-y-4">
              <div className="w-16 h-16 bg-danger/10 text-danger rounded-full flex items-center justify-center mx-auto mb-4">
                <AlertTriangle className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-bold text-textPrimary">Delete Teacher?</h3>
              <p className="text-textSecondary text-sm">
                Are you sure you want to delete this teacher? This action cannot be undone.
              </p>
            </div>
            <div className="p-4 border-t border-border bg-black/5 flex justify-end gap-3">
              <button onClick={() => setDeleteTeacherId(null)} className="btn-secondary flex-1">Cancel</button>
              <button onClick={handleDelete} className="bg-danger text-white px-4 py-2 rounded-lg hover:bg-danger/90 transition-colors font-medium flex-1">Yes, Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TeacherManagement;
