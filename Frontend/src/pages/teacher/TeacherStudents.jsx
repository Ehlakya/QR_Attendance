import { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';
import DataTable from '../../components/common/DataTable';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/common/Card';
import { Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';

const containerVariants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.15 } }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 24 } }
};

const TeacherStudents = () => {
  const { token, user } = useAuth();
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters state (Managed directly by DataTable typically, but we can configure columns)
  
  useEffect(() => {
    const fetchStudents = async () => {
      try {
        const response = await axios.get('https://qr-attendance-y9x7.onrender.com/api/v1/dashboard/teacher/students', {
          headers: { Authorization: `Bearer ${token}` }
        });
        setStudents(response.data.data);
      } catch (error) {
        console.error('Failed to fetch assigned students');
      } finally {
        setLoading(false);
      }
    };
    fetchStudents();
  }, [token]);

  const COLUMNS = [
    { header: 'Register Number', accessor: 'registerNumber' },
    { header: 'Student Name', accessor: 'name' },
    { header: 'Department', accessor: 'department' },
    { header: 'Year', accessor: 'year' },
    { header: 'Section', accessor: 'section' },
    { header: 'Semester', accessor: 'semester' },
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
    <motion.div variants={containerVariants} initial="hidden" animate="show" className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <motion.div variants={itemVariants}>
          <h2 className="text-3xl font-extrabold tracking-tight text-textPrimary">My Students</h2>
          <p className="text-textSecondary font-medium mt-1">Manage and view attendance for your assigned students.</p>
        </motion.div>
      </div>

      <motion.div variants={itemVariants}>
        <Card className="border-border shadow-sm">
          <CardHeader>
            <CardTitle>Student List</CardTitle>
          </CardHeader>
          <CardContent>
            <DataTable 
              columns={COLUMNS} 
              data={students} 
              searchable={true}
              searchPlaceholder="Search by Register Number or Name..."
            />
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  );
};

export default TeacherStudents;
