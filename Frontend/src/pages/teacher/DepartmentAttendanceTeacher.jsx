import { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';
import DataTable from '../../components/common/DataTable';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/common/Card';
import StatCard from '../../components/common/StatCard';
import { Loader2, Users, UserCheck, UserX, Percent, Eye } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import StudentDetailsModal from './StudentDetailsModal';

const containerVariants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.15 } }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 24 } }
};

const DepartmentAttendanceTeacher = () => {
  const { token, user } = useAuth();
  const [students, setStudents] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedStudentId, setSelectedStudentId] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [statsRes, studentsRes] = await Promise.all([
          axios.get('http://localhost:5000/api/v1/dashboard/teacher/stats', {
            headers: { Authorization: `Bearer ${token}` }
          }),
          axios.get('http://localhost:5000/api/v1/dashboard/teacher/students', {
            headers: { Authorization: `Bearer ${token}` }
          })
        ]);
        setStats(statsRes.data.data);
        setStudents(studentsRes.data.data);
      } catch (error) {
        console.error('Failed to fetch department attendance data');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [token]);

  const COLUMNS = [
    { header: 'Register Number', accessor: 'registerNumber' },
    { header: 'Student Name', accessor: 'name' },
    { header: 'Department', accessor: 'department' },
    { header: 'Year', accessor: 'year' },
    { header: 'Semester', accessor: 'semester' },
    { header: 'Section', accessor: 'section' },
    { header: 'Present Days', accessor: 'presentDays' },
    { header: 'Absent Days', accessor: 'absentDays' },
    { 
      header: 'Attendance %', 
      accessor: 'attendancePercentage',
      cell: (row) => (
        <span className={`font-bold ${row.attendancePercentage >= 75 ? 'text-success' : 'text-danger'}`}>
          {row.attendancePercentage}%
        </span>
      )
    },
    { 
      header: "Today's Status", 
      accessor: 'todaysStatus',
      cell: (row) => (
        <span className={`px-2.5 py-1 rounded-md text-xs font-semibold ${
          row.todaysStatus === 'Present' ? 'bg-success/10 text-success' : 
          row.todaysStatus === 'Absent' ? 'bg-danger/10 text-danger' : 
          'bg-gray-500/10 text-gray-500'
        }`}>
          {row.todaysStatus}
        </span>
      )
    },
    {
      header: 'Actions',
      accessor: 'actions',
      cell: (row) => (
        <button
          onClick={() => setSelectedStudentId(row.id)}
          className="p-1.5 bg-primary/10 text-primary rounded-md hover:bg-primary/20 transition-colors flex items-center justify-center"
          title="View Details"
        >
          <Eye className="w-4 h-4" />
        </button>
      )
    }
  ];

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <>
      <motion.div variants={containerVariants} initial="hidden" animate="show" className="space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <motion.div variants={itemVariants}>
            <h2 className="text-3xl font-extrabold tracking-tight text-textPrimary">Department Attendance</h2>
            <p className="text-textSecondary font-medium mt-1">
              Comprehensive attendance tracking for your assigned {user?.role === 'HOD' ? 'department' : 'class'}.
            </p>
          </motion.div>
        </div>

        {stats && (
          <motion.div variants={itemVariants} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <StatCard title="Total Students" value={stats.totalStudents} icon={Users} color="primary" />
            <StatCard title="Present Today" value={stats.presentToday} icon={UserCheck} color="success" />
            <StatCard title="Absent Today" value={stats.absentToday} icon={UserX} color="danger" />
            <StatCard title="Attendance Rate" value={stats.attendancePercentage} icon={Percent} color="warning" />
          </motion.div>
        )}

        <motion.div variants={itemVariants}>
          <Card className="border-border shadow-sm">
            <CardHeader>
              <CardTitle>Student Attendance Records</CardTitle>
            </CardHeader>
            <CardContent>
              <DataTable 
                columns={COLUMNS} 
                data={students} 
                searchable={true}
                searchPlaceholder="Search by Reg No or Name..."
              />
            </CardContent>
          </Card>
        </motion.div>
      </motion.div>

      <AnimatePresence>
        {selectedStudentId && (
          <StudentDetailsModal
            studentId={selectedStudentId}
            onClose={() => setSelectedStudentId(null)}
          />
        )}
      </AnimatePresence>
    </>
  );
};

export default DepartmentAttendanceTeacher;
