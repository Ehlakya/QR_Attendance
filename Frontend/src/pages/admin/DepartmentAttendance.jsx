import { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/common/Card';
import StatCard from '../../components/common/StatCard';
import DataTable from '../../components/common/DataTable';
import { Building2, Users, UserCheck, UserX, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';

const containerVariants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.15 } }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 24 } }
};

const DepartmentAttendance = () => {
  const { token } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await axios.get('http://localhost:5000/api/v1/dashboard/admin/attendance-details', {
          headers: { Authorization: `Bearer ${token}` }
        });
        setData(response.data.data);
      } catch (error) {
        console.error('Failed to fetch department attendance');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [token]);

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!data) return null;

  const COLUMNS = [
    { header: 'Department', accessor: 'department' },
    { header: 'Total Students', accessor: 'totalStudents' },
    { header: 'Present', accessor: 'present' },
    { header: 'Absent', accessor: 'absent' },
    { 
      header: 'Attendance %', 
      accessor: 'attendancePercentage',
      cell: (row) => (
        <span className="font-bold text-textPrimary">
          {row.attendancePercentage}
        </span>
      )
    },
    { 
      header: 'Present %', 
      accessor: 'presentPercent',
      cell: (row) => {
        const p = row.totalStudents > 0 ? ((row.present / row.totalStudents) * 100).toFixed(2) : 0;
        return <span className="text-success font-medium">{p}%</span>;
      }
    },
    { 
      header: 'Absent %', 
      accessor: 'absentPercent',
      cell: (row) => {
        const p = row.totalStudents > 0 ? ((row.absent / row.totalStudents) * 100).toFixed(2) : 0;
        return <span className="text-danger font-medium">{p}%</span>;
      }
    }
  ];

  return (
    <motion.div variants={containerVariants} initial="hidden" animate="show" className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <motion.div variants={itemVariants}>
          <h2 className="text-3xl font-extrabold tracking-tight text-textPrimary">Department Attendance</h2>
          <p className="text-textSecondary font-medium mt-1">Real-time attendance overview across all departments.</p>
        </motion.div>
      </div>

      <motion.div variants={itemVariants}>
        <Card className="border-border shadow-sm">
          <CardHeader>
            <CardTitle>Departments Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-8">
              {data.departmentWise.map((dept, index) => (
                <div key={index} className="bg-card rounded-xl border border-border p-5 shadow-sm hover:shadow-md transition-shadow">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                      <Building2 className="w-5 h-5 text-primary" />
                    </div>
                    <h3 className="text-xl font-bold text-textPrimary">{dept.department}</h3>
                  </div>
                  
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="bg-background rounded-lg p-3 border border-border">
                      <p className="text-xs text-textSecondary font-semibold uppercase tracking-wider mb-1">Total Students</p>
                      <p className="text-2xl font-bold text-textPrimary">{dept.totalStudents}</p>
                    </div>
                    <div className="bg-success/5 rounded-lg p-3 border border-success/20">
                      <p className="text-xs text-success font-semibold uppercase tracking-wider mb-1">Present</p>
                      <p className="text-2xl font-bold text-success">{dept.present}</p>
                    </div>
                    <div className="bg-danger/5 rounded-lg p-3 border border-danger/20">
                      <p className="text-xs text-danger font-semibold uppercase tracking-wider mb-1">Absent</p>
                      <p className="text-2xl font-bold text-danger">{dept.absent}</p>
                    </div>
                    <div className="bg-primary/5 rounded-lg p-3 border border-primary/20">
                      <p className="text-xs text-primary font-semibold uppercase tracking-wider mb-1">Attendance Rate</p>
                      <p className="text-2xl font-bold text-primary">{dept.attendancePercentage}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      <motion.div variants={itemVariants}>
        <Card className="border-border shadow-sm">
          <CardHeader>
            <CardTitle>Detailed Department Table</CardTitle>
          </CardHeader>
          <CardContent>
            <DataTable 
              columns={COLUMNS} 
              data={data.departmentWise} 
              searchable={false}
            />
          </CardContent>
        </Card>
      </motion.div>

    </motion.div>
  );
};

export default DepartmentAttendance;
