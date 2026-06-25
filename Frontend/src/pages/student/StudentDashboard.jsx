import { useAuth } from '../../context/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/common/Card';
import StatCard from '../../components/common/StatCard';
import DataTable from '../../components/common/DataTable';
import { GraduationCap, Percent, BookOpen, Clock, Scan } from 'lucide-react';
import { useSocket } from '../../context/SocketContext';
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

const MOCK_HISTORY = [
  { date: '2026-06-25', time: '08:45 AM', subject: 'Data Structures', status: 'Present' },
  { date: '2026-06-24', time: '09:00 AM', subject: 'Algorithms', status: 'Present' },
  { date: '2026-06-23', time: '-', subject: 'Database Systems', status: 'Absent' },
  { date: '2026-06-22', time: '08:50 AM', subject: 'Operating Systems', status: 'Present' },
  { date: '2026-06-21', time: '10:00 AM', subject: 'Computer Networks', status: 'Present' },
];

const COLUMNS = [
  { header: 'Date', accessor: 'date' },
  { header: 'Time', accessor: 'time' },
  { header: 'Subject', accessor: 'subject' },
  { 
    header: 'Status', 
    accessor: 'status',
    cell: (row) => (
      <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${
        row.status === 'Present' ? 'bg-success/10 text-success' : 'bg-danger/10 text-danger'
      }`}>
        {row.status}
      </span>
    )
  }
];

const StudentDashboard = () => {
  const { user } = useAuth();
  const socket = useSocket();
  const navigate = useNavigate();

  useEffect(() => {
    if (!socket || !user) return;

    const handleQRGenerated = (data) => {
      // Strictly target notifications based on department and section
      if (
        user.departmentId === data.departmentId && 
        user.sectionId === data.sectionId
      ) {
        toast((t) => (
          <div className="flex flex-col gap-2 p-1">
            <div className="font-bold text-gray-900">{data.message}</div>
            <div className="text-sm text-gray-600">
              {data.type === 'Subject Attendance' && (
                <div className="mb-1">
                  <span className="font-semibold">Subject:</span> {data.subjectName} (Hour: {data.period})
                </div>
              )}
            </div>
            <button
              onClick={() => {
                toast.dismiss(t.id);
                navigate('/student/scan');
              }}
              className="mt-2 w-full btn-primary py-1.5 px-3 text-sm flex items-center justify-center gap-2"
            >
              <Scan className="w-4 h-4" /> Click here to mark attendance
            </button>
          </div>
        ), { duration: 10000, position: 'top-center' });
      }
    };

    socket.on('qr_generated', handleQRGenerated);

    return () => {
      socket.off('qr_generated', handleQRGenerated);
    };
  }, [socket, user, navigate]);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Student Dashboard</h2>
        <p className="text-textSecondary">Welcome back, {user?.name || 'Student'}</p>
      </div>

      {/* Profile Card */}
      <Card className="bg-gradient-to-r from-primary to-secondary text-white border-none shadow-md overflow-hidden relative">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white opacity-10 rounded-full blur-3xl transform translate-x-1/2 -translate-y-1/2"></div>
        <CardContent className="p-8 relative z-10">
          <div className="flex flex-col md:flex-row md:items-center gap-6">
            <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center border-2 border-white/30 backdrop-blur-sm">
              <GraduationCap className="w-10 h-10 text-white" />
            </div>
            <div>
              <h3 className="text-3xl font-bold mb-1">{user?.name || 'Student Name'}</h3>
              <div className="flex flex-wrap gap-4 text-primary-100 font-medium">
                <span className="bg-white/10 px-3 py-1 rounded-full">Reg No: {user?.registerNumber || 'CS2026001'}</span>
                <span className="bg-white/10 px-3 py-1 rounded-full">Dept: Computer Science</span>
                <span className="bg-white/10 px-3 py-1 rounded-full">Section: A</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard title="Overall Attendance" value="85.5%" icon={Percent} color="success" trend="up" trendValue="2%" />
        <StatCard title="Total Classes Attended" value="124" icon={BookOpen} color="primary" />
        <StatCard title="Total Classes Missed" value="21" icon={Clock} color="danger" />
      </div>

      {/* Attendance History */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Attendance History</CardTitle>
        </CardHeader>
        <CardContent>
          <DataTable columns={COLUMNS} data={MOCK_HISTORY} searchable={false} />
        </CardContent>
      </Card>
    </div>
  );
};

export default StudentDashboard;
