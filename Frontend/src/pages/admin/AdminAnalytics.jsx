import { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/common/Card';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line } from 'recharts';
import { Download, FileText, FileSpreadsheet } from 'lucide-react';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import * as XLSX from 'xlsx';

import { motion } from 'framer-motion';

const COLORS = ['#6366F1', '#EF4444', '#10B981', '#F59E0B', '#3B82F6', '#8B5CF6'];

const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.15 }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 24 } }
};

const SkeletonCard = ({ height }) => (
  <Card className="animate-pulse">
    <CardHeader>
      <div className="h-6 bg-border rounded w-1/3"></div>
    </CardHeader>
    <CardContent className={height}>
      <div className="w-full h-full bg-border rounded-xl"></div>
    </CardContent>
  </Card>
);

const AdminAnalytics = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const { token } = useAuth();

  useEffect(() => {
    fetchData();
  }, [token]);

  const fetchData = async () => {
    try {
      const response = await axios.get('http://localhost:5000/api/v1/dashboard/admin/attendance-details', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setData(response.data.data);
    } catch (error) {
      console.error('Failed to fetch analytics data');
    } finally {
      // Small timeout to show off the skeleton loading effect for premium feel
      setTimeout(() => setLoading(false), 800);
    }
  };

  const exportPDF = () => {
    if (!data) return;
    const doc = new jsPDF();
    doc.text("Attendance Analytics Report", 14, 15);
    
    // Summary
    doc.setFontSize(12);
    doc.text(`Total Students: ${data.overall.totalStudents}`, 14, 25);
    doc.text(`Present Today: ${data.overall.presentStudentsToday}`, 14, 32);
    doc.text(`Absent Today: ${data.overall.absentStudentsToday}`, 14, 39);
    doc.text(`Overall Attendance: ${data.overall.attendancePercentage}`, 14, 46);

    // Department Table
    const tableColumn = ["Department", "Total Students", "Present", "Absent", "Attendance %"];
    const tableRows = data.departmentWise.map(dept => [
      dept.department,
      dept.totalStudents,
      dept.present,
      dept.absent,
      dept.attendancePercentage
    ]);

    doc.autoTable({
      head: [tableColumn],
      body: tableRows,
      startY: 55,
    });

    doc.save(`Attendance_Report_${new Date().toISOString().split('T')[0]}.pdf`);
  };

  const exportExcel = () => {
    if (!data) return;
    const worksheet = XLSX.utils.json_to_sheet(data.departmentWise);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Departments");
    XLSX.writeFile(workbook, `Attendance_Data_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div className="space-y-2">
            <div className="h-8 bg-border rounded w-48 animate-pulse"></div>
            <div className="h-4 bg-border rounded w-64 animate-pulse"></div>
          </div>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <SkeletonCard height="h-80" />
          <SkeletonCard height="h-80" />
          <SkeletonCard height="h-80" />
          <div className="lg:col-span-2"><SkeletonCard height="h-96" /></div>
        </div>
      </div>
    );
  }

  const pieData = [
    { name: 'Present', value: data.overall.presentStudentsToday },
    { name: 'Absent', value: data.overall.absentStudentsToday }
  ];

  const barData = data.departmentWise.map(d => ({
    name: d.department,
    Present: d.present,
    Absent: d.absent
  }));

  // Mock trend data
  const trendData = [
    { day: 'Mon', attendance: 85 },
    { day: 'Tue', attendance: 88 },
    { day: 'Wed', attendance: 92 },
    { day: 'Thu', attendance: 90 },
    { day: 'Fri', attendance: 87 },
  ];

  const monthlyTrendData = [
    { month: 'Jan', attendance: 82 },
    { month: 'Feb', attendance: 85 },
    { month: 'Mar', attendance: 84 },
    { month: 'Apr', attendance: 88 },
    { month: 'May', attendance: 90 },
    { month: 'Jun', attendance: 89 },
  ];

  return (
    <motion.div 
      initial="hidden"
      animate="show"
      variants={containerVariants}
      className="space-y-6"
    >
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <motion.div variants={itemVariants}>
          <h2 className="text-3xl font-extrabold tracking-tight text-textPrimary">Advanced Analytics</h2>
          <p className="text-textSecondary font-medium mt-1">Visual metrics and exportable reports.</p>
        </motion.div>
        <motion.div variants={itemVariants} className="flex gap-3">
          <button onClick={exportPDF} className="btn-secondary flex items-center gap-2 bg-card shadow-sm hover:shadow-md transition-all">
            <FileText className="w-4 h-4 text-danger" /> Export PDF
          </button>
          <button onClick={exportExcel} className="btn-secondary flex items-center gap-2 bg-card shadow-sm hover:shadow-md transition-all">
            <FileSpreadsheet className="w-4 h-4 text-success" /> Export Excel
          </button>
        </motion.div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <motion.div variants={itemVariants}>
          <Card className="hover:shadow-lg transition-shadow border-border">
            <CardHeader>
              <CardTitle>Today's Overview</CardTitle>
            </CardHeader>
            <CardContent className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={80}
                    outerRadius={110}
                    paddingAngle={5}
                    dataKey="value"
                    animationDuration={1500}
                    animationEasing="ease-out"
                  >
                    <Cell fill="#10B981" />
                    <Cell fill="#EF4444" />
                  </Pie>
                  <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 25px rgba(0,0,0,0.1)' }} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div variants={itemVariants}>
          <Card className="hover:shadow-lg transition-shadow border-border">
            <CardHeader>
              <CardTitle>Weekly Trend</CardTitle>
            </CardHeader>
            <CardContent className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={trendData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                  <XAxis dataKey="day" axisLine={false} tickLine={false} />
                  <YAxis domain={[0, 100]} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 25px rgba(0,0,0,0.1)' }} />
                  <Line type="monotone" dataKey="attendance" stroke="#6366F1" strokeWidth={4} dot={{ r: 4, fill: '#6366F1', strokeWidth: 2 }} activeDot={{ r: 8 }} animationDuration={1500} />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div variants={itemVariants}>
          <Card className="hover:shadow-lg transition-shadow border-border">
            <CardHeader>
              <CardTitle>Monthly Trend</CardTitle>
            </CardHeader>
            <CardContent className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={monthlyTrendData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                  <XAxis dataKey="month" axisLine={false} tickLine={false} />
                  <YAxis domain={[0, 100]} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 25px rgba(0,0,0,0.1)' }} />
                  <Line type="monotone" dataKey="attendance" stroke="#8B5CF6" strokeWidth={4} dot={{ r: 4, fill: '#8B5CF6', strokeWidth: 2 }} activeDot={{ r: 8 }} animationDuration={1500} />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div variants={itemVariants} className="lg:col-span-2">
          <Card className="hover:shadow-lg transition-shadow border-border">
            <CardHeader>
              <CardTitle>Department-wise Breakdown</CardTitle>
            </CardHeader>
            <CardContent className="h-96">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={barData} margin={{ top: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} />
                  <YAxis axisLine={false} tickLine={false} />
                  <Tooltip cursor={{ fill: 'rgba(99, 102, 241, 0.05)' }} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 25px rgba(0,0,0,0.1)' }} />
                  <Legend />
                  <Bar dataKey="Present" fill="#10B981" radius={[6, 6, 0, 0]} animationDuration={1500} />
                  <Bar dataKey="Absent" fill="#EF4444" radius={[6, 6, 0, 0]} animationDuration={1500} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </motion.div>
  );
};

export default AdminAnalytics;
