import { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/common/Card';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line } from 'recharts';
import { Download, FileText, FileSpreadsheet } from 'lucide-react';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import * as XLSX from 'xlsx';

const COLORS = ['#4F46E5', '#EF4444', '#10B981', '#F59E0B', '#3B82F6', '#8B5CF6'];

const AdminAnalytics = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const { token } = useAuth();

  useEffect(() => {
    fetchData();
  }, [token]);

  const fetchData = async () => {
    try {
      // Re-use the robust details endpoint for chart data
      const response = await axios.get('http://localhost:5000/api/v1/dashboard/admin/attendance-details', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setData(response.data.data);
    } catch (error) {
      console.error('Failed to fetch analytics data');
    } finally {
      setLoading(false);
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

  if (loading) return <div className="p-8 text-center">Loading advanced analytics...</div>;

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
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Advanced Analytics</h2>
          <p className="text-textSecondary">Visual metrics and exportable reports.</p>
        </div>
        <div className="flex gap-3">
          <button onClick={exportPDF} className="btn-secondary flex items-center gap-2 bg-white">
            <FileText className="w-4 h-4 text-danger" /> Export PDF
          </button>
          <button onClick={exportExcel} className="btn-secondary flex items-center gap-2 bg-white">
            <FileSpreadsheet className="w-4 h-4 text-success" /> Export Excel
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
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
                >
                  <Cell fill="#10B981" />
                  <Cell fill="#EF4444" />
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Weekly Trend</CardTitle>
          </CardHeader>
          <CardContent className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={trendData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="day" />
                <YAxis domain={[0, 100]} />
                <Tooltip />
                <Line type="monotone" dataKey="attendance" stroke="#4F46E5" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Monthly Trend</CardTitle>
          </CardHeader>
          <CardContent className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={monthlyTrendData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="month" />
                <YAxis domain={[0, 100]} />
                <Tooltip />
                <Line type="monotone" dataKey="attendance" stroke="#F59E0B" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Department-wise Breakdown</CardTitle>
          </CardHeader>
          <CardContent className="h-96">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={barData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="Present" fill="#10B981" radius={[4, 4, 0, 0]} />
                <Bar dataKey="Absent" fill="#EF4444" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AdminAnalytics;
