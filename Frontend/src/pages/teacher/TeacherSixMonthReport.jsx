import { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/common/Card';
import { Search, Loader2, User, BookOpen, AlertCircle, CheckCircle2, Calendar, Users, TrendingUp, X, Download, FileText, TableProperties, ArrowUpCircle, ArrowDownCircle } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from 'recharts';
import { MASTER_DEPARTMENTS } from '../../constants/departments';
import { motion, AnimatePresence } from 'framer-motion';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import * as XLSX from 'xlsx';

const TeacherSixMonthReport = () => {
  const { token, user } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [students, setStudents] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [reportData, setReportData] = useState(null);
  const [isLoadingReport, setIsLoadingReport] = useState(false);

  // Filters State
  const [filters, setFilters] = useState({
    departmentId: '',
    semester: '',
    sectionId: '',
    subjectName: '',
    month: '',
    year: ''
  });

  // Default Overview State
  const [defaultOverview, setDefaultOverview] = useState(null);
  const [isLoadingDefault, setIsLoadingDefault] = useState(true);

  // Recharts colors
  const COLORS = ['#10B981', '#EF4444']; // Green for Present, Red for Absent

  useEffect(() => {
    fetchDefaultOverview();
  }, [token, filters]);

  const fetchDefaultOverview = async () => {
    setIsLoadingDefault(true);
    try {
      const queryParams = new URLSearchParams(filters).toString();
      const res = await axios.get(`http://localhost:5000/api/v1/dashboard/6-month-overview?${queryParams}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setDefaultOverview(res.data.data);
    } catch (error) {
      console.error('Failed to fetch default overview', error);
    } finally {
      setIsLoadingDefault(false);
    }
  };

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    
    setIsSearching(true);
    setStudents([]);
    try {
      const res = await axios.get(`http://localhost:5000/api/v1/students?search=${searchQuery}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setStudents(res.data.data || []);
    } catch (error) {
      console.error('Search failed', error);
    } finally {
      setIsSearching(false);
    }
  };

  const handleFilterChange = (e) => {
    setFilters({ ...filters, [e.target.name]: e.target.value });
  };

  const fetchReport = async (student) => {
    setSelectedStudent(student);
    setIsLoadingReport(true);
    setStudents([]); // hide search results
    try {
      const res = await axios.get(`http://localhost:5000/api/v1/dashboard/6-month-report/${student.id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setReportData(res.data.data);
    } catch (error) {
      console.error('Failed to fetch report', error);
    } finally {
      setIsLoadingReport(false);
    }
  };

  const clearReport = () => {
    setReportData(null);
    setSelectedStudent(null);
    setSearchQuery('');
  };

  const exportPDF = () => {
    if (!reportData) return;
    const doc = new jsPDF();
    doc.text(`6-Month Attendance Report: ${reportData.student.name}`, 14, 15);
    doc.setFontSize(10);
    doc.text(`Register No: ${reportData.student.registerNumber} | Department: ${reportData.student.department}`, 14, 22);
    doc.text(`Overall Attendance: ${reportData.overallPercentage}%`, 14, 28);
    
    const tableColumn = ["Date", "Time", "Type", "Subject", "Status"];
    const tableRows = [];

    reportData.history.forEach(record => {
      const rowData = [
        record.date,
        record.time || '-',
        record.type,
        record.subject || '-',
        record.status
      ];
      tableRows.push(rowData);
    });

    doc.autoTable({
      head: [tableColumn],
      body: tableRows,
      startY: 35,
    });

    doc.save(`${reportData.student.name}_Attendance_Report.pdf`);
  };

  const exportExcel = () => {
    if (!reportData) return;
    const ws = XLSX.utils.json_to_sheet(reportData.history);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Attendance History");
    XLSX.writeFile(wb, `${reportData.student.name}_Attendance_Report.xlsx`);
  };

  const getPercentageColor = (percentage) => {
    if (percentage >= 85) return 'text-success';
    if (percentage < 75) return 'text-danger';
    return 'text-warning';
  };

  const getPercentageBg = (percentage) => {
    if (percentage >= 85) return 'bg-success/10 border-success/30';
    if (percentage < 75) return 'bg-danger/10 border-danger/30';
    return 'bg-warning/10 border-warning/30';
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-12">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-extrabold tracking-tight text-textPrimary">
            6-Month Attendance Report
          </h2>
          <p className="text-textSecondary mt-1 font-medium">View and analyze student attendance for the last six months.</p>
        </div>
      </div>

      <Card className="border-border bg-card shadow-sm z-50 relative">
        <CardContent className="pt-6 space-y-4">
          <form onSubmit={handleSearch} className="flex gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-textSecondary w-5 h-5" />
              <input
                type="text"
                placeholder="Search by Student Name or Register Number to view detailed profile..."
                className="w-full pl-10 pr-4 py-3 rounded-xl border border-border bg-background/50 focus:bg-background text-textPrimary transition-colors outline-none focus:ring-2 focus:ring-primary/50"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <button
              type="submit"
              disabled={isSearching}
              className="btn-primary flex items-center justify-center gap-2 py-3 px-6 shadow-md"
            >
              {isSearching ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Search'}
            </button>
          </form>

          {/* Filters Row */}
          {!reportData && (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 pt-4 border-t border-border">
              {(user?.role === 'HOD' || user?.role === 'Class Teacher' || user?.role === 'ADMIN' || user?.role === 'admin') && (
                <select name="departmentId" onChange={handleFilterChange} className="input bg-background/50 text-sm py-2">
                  <option value="">All Departments</option>
                  {MASTER_DEPARTMENTS.map(dept => (
                    <option key={dept.id} value={dept.id}>{dept.abbr}</option>
                  ))}
                </select>
              )}
              <select name="semester" onChange={handleFilterChange} className="input bg-background/50 text-sm py-2">
                <option value="">All Semesters</option>
                <option value="1">Semester 1</option>
                <option value="2">Semester 2</option>
                <option value="3">Semester 3</option>
                <option value="4">Semester 4</option>
                <option value="5">Semester 5</option>
                <option value="6">Semester 6</option>
                <option value="7">Semester 7</option>
                <option value="8">Semester 8</option>
              </select>
              <select name="sectionId" onChange={handleFilterChange} className="input bg-background/50 text-sm py-2">
                <option value="">All Sections</option>
                <option value="1">Section A</option>
                <option value="2">Section B</option>
                <option value="3">Section C</option>
              </select>
              {user?.role === 'Subject Teacher' && (
                <select name="subjectName" onChange={handleFilterChange} className="input bg-background/50 text-sm py-2">
                  <option value="">All Subjects</option>
                  <option value="Data Structures">Data Structures</option>
                  <option value="Engineering Math">Engineering Math</option>
                  <option value="Database Systems">Database Systems</option>
                  <option value="Operating Systems">Operating Systems</option>
                </select>
              )}
              <select name="month" onChange={handleFilterChange} className="input bg-background/50 text-sm py-2">
                <option value="">All Months</option>
                <option value="01">January</option>
                <option value="02">February</option>
                <option value="03">March</option>
                <option value="04">April</option>
                <option value="05">May</option>
                <option value="06">June</option>
                <option value="07">July</option>
                <option value="08">August</option>
                <option value="09">September</option>
                <option value="10">October</option>
                <option value="11">November</option>
                <option value="12">December</option>
              </select>
              <select name="year" onChange={handleFilterChange} className="input bg-background/50 text-sm py-2">
                <option value="">All Years</option>
                <option value="2026">2026</option>
                <option value="2025">2025</option>
                <option value="2024">2024</option>
              </select>
              <div className="flex gap-2 col-span-2 md:col-span-3 lg:col-span-6 justify-end mt-2">
                <button type="button" onClick={fetchDefaultOverview} className="btn-primary text-sm px-4 py-2 flex items-center gap-2">
                  <Search className="w-4 h-4" /> Filter
                </button>
                <button 
                  type="button" 
                  onClick={() => {
                    setFilters({ departmentId: '', semester: '', sectionId: '', subjectName: '', month: '', year: '' });
                    // Will auto-fetch due to useEffect on filters change
                  }} 
                  className="btn-secondary text-sm px-4 py-2 text-danger hover:bg-danger/10"
                >
                  Reset
                </button>
              </div>
            </div>
          )}

          {/* Search Results */}
          <AnimatePresence>
            {students.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="mt-4 border border-border rounded-xl overflow-hidden bg-background shadow-lg absolute w-[calc(100%-3rem)] z-50 left-6"
              >
                {students.map((student) => (
                  <div
                    key={student.id}
                    onClick={() => fetchReport(student)}
                    className="p-4 border-b border-border last:border-b-0 hover:bg-primary/5 cursor-pointer flex items-center justify-between transition-colors"
                  >
                    <div>
                      <p className="font-bold text-textPrimary">{student.name}</p>
                      <p className="text-sm text-textSecondary">{student.registerNumber} • {student.Department?.name} - {student.Section?.name}</p>
                    </div>
                    <button className="text-sm text-primary font-semibold hover:underline">View Detailed Report</button>
                  </div>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </CardContent>
      </Card>

      {/* Global Default Overview if NO student is selected */}
      <AnimatePresence mode="wait">
        {!selectedStudent && !isLoadingReport && (
          <motion.div 
            key="overview"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-6"
          >
            {isLoadingDefault ? (
              <div className="flex flex-col items-center justify-center py-20 text-textSecondary">
                <Loader2 className="w-10 h-10 animate-spin mb-4 text-primary" />
                <p className="font-medium">Loading Dashboard Analytics...</p>
              </div>
            ) : defaultOverview ? (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  <Card className="border-border bg-card shadow-sm hover:shadow-md transition-shadow">
                    <CardContent className="p-6">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="text-sm font-semibold text-textSecondary mb-1">Total Students</p>
                          <h3 className="text-3xl font-bold text-textPrimary">{defaultOverview.overview.totalStudents}</h3>
                        </div>
                        <div className="p-3 rounded-xl bg-primary/10 text-primary">
                          <Users className="w-6 h-6" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                  
                  <Card className="border-border bg-card shadow-sm hover:shadow-md transition-shadow">
                    <CardContent className="p-6">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="text-sm font-semibold text-textSecondary mb-1">Avg Attendance</p>
                          <h3 className="text-3xl font-bold text-primary">{defaultOverview.overview.avgMonthlyAttendance}%</h3>
                        </div>
                        <div className="p-3 rounded-xl bg-primary/10 text-primary">
                          <TrendingUp className="w-6 h-6" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="border-border bg-card shadow-sm hover:shadow-md transition-shadow">
                    <CardContent className="p-6">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="text-sm font-semibold text-textSecondary mb-1">Students &gt; 75%</p>
                          <h3 className="text-3xl font-bold text-success">{defaultOverview.overview.above75Count}</h3>
                        </div>
                        <div className="p-3 rounded-xl bg-success/10 text-success">
                          <ArrowUpCircle className="w-6 h-6" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="border-border bg-card shadow-sm hover:shadow-md transition-shadow">
                    <CardContent className="p-6">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="text-sm font-semibold text-textSecondary mb-1">Students &lt; 75%</p>
                          <h3 className="text-3xl font-bold text-danger">{defaultOverview.overview.below75Count}</h3>
                        </div>
                        <div className="p-3 rounded-xl bg-danger/10 text-danger">
                          <ArrowDownCircle className="w-6 h-6" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Dashboard Charts */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  <Card className="border-border bg-card shadow-sm">
                    <CardHeader>
                      <CardTitle>Monthly Attendance Trend</CardTitle>
                    </CardHeader>
                    <CardContent className="h-80">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={defaultOverview.charts.monthlyTrend} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="currentColor" className="opacity-10" />
                          <XAxis dataKey="month" tick={{ fill: 'currentColor', opacity: 0.6 }} axisLine={false} tickLine={false} />
                          <YAxis tick={{ fill: 'currentColor', opacity: 0.6 }} axisLine={false} tickLine={false} />
                          <Tooltip 
                            contentStyle={{ backgroundColor: 'var(--tw-colors-card)', borderColor: 'var(--tw-colors-border)', color: 'var(--tw-colors-textPrimary)', borderRadius: '0.5rem', fontWeight: 'bold' }}
                          />
                          <Line type="monotone" dataKey="percentage" name="Avg Attendance %" stroke="#6366F1" strokeWidth={3} dot={{ r: 4, fill: '#6366F1' }} activeDot={{ r: 6 }} />
                        </LineChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>

                  <Card className="border-border bg-card shadow-sm">
                    <CardHeader>
                      <CardTitle>Present vs Absent</CardTitle>
                    </CardHeader>
                    <CardContent className="h-80">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={defaultOverview.charts.presentAbsent}
                            cx="50%"
                            cy="50%"
                            innerRadius={60}
                            outerRadius={90}
                            paddingAngle={5}
                            dataKey="value"
                          >
                            <Cell key="cell-0" fill="#10B981" />
                            <Cell key="cell-1" fill="#EF4444" />
                          </Pie>
                          <Tooltip contentStyle={{ backgroundColor: 'var(--tw-colors-card)', borderColor: 'var(--tw-colors-border)', color: 'var(--tw-colors-textPrimary)', borderRadius: '0.5rem', fontWeight: 'bold' }} />
                        </PieChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>

                  <Card className="border-border bg-card shadow-sm">
                    <CardHeader>
                      <CardTitle>Attendance Percentage Graph</CardTitle>
                    </CardHeader>
                    <CardContent className="h-80">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={defaultOverview.charts.classWise.slice(0, 5)} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="currentColor" className="opacity-10" />
                          <XAxis dataKey="className" tick={{ fill: 'currentColor', opacity: 0.6 }} axisLine={false} tickLine={false} />
                          <YAxis tick={{ fill: 'currentColor', opacity: 0.6 }} axisLine={false} tickLine={false} />
                          <Tooltip 
                            contentStyle={{ backgroundColor: 'var(--tw-colors-card)', borderColor: 'var(--tw-colors-border)', color: 'var(--tw-colors-textPrimary)', borderRadius: '0.5rem', fontWeight: 'bold' }}
                            cursor={{ fill: 'currentColor', opacity: 0.05 }}
                          />
                          <Bar dataKey="percentage" name="Attendance %" fill="#8B5CF6" radius={[4, 4, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>
                </div>

                <Card className="border-border bg-card shadow-sm overflow-hidden">
                  <CardHeader className="border-b border-border">
                    <CardTitle>Student Attendance Table</CardTitle>
                  </CardHeader>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                      <thead className="bg-background/50 text-textSecondary uppercase text-xs font-bold border-b border-border">
                        <tr>
                          <th className="px-6 py-4">Register No</th>
                          <th className="px-6 py-4">Student Name</th>
                          <th className="px-6 py-4">Department</th>
                          <th className="px-6 py-4">Year</th>
                          <th className="px-6 py-4">Semester</th>
                          <th className="px-6 py-4">Section</th>
                          {defaultOverview.tableData[0]?.monthWise.map((m, idx) => (
                            <th key={idx} className="px-6 py-4 whitespace-nowrap">{m.month}</th>
                          ))}
                          <th className="px-6 py-4">Overall %</th>
                          <th className="px-6 py-4">Status</th>
                          <th className="px-6 py-4">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border">
                        {defaultOverview.tableData.map((row) => (
                          <tr key={row.id} className="hover:bg-background/30 transition-colors">
                            <td className="px-6 py-4 text-textSecondary font-semibold">{row.registerNumber}</td>
                            <td className="px-6 py-4 font-bold text-textPrimary">{row.name}</td>
                            <td className="px-6 py-4 text-textSecondary">{row.department}</td>
                            <td className="px-6 py-4 text-textSecondary">{row.year}</td>
                            <td className="px-6 py-4 text-textSecondary">{row.semester}</td>
                            <td className="px-6 py-4 font-medium text-textPrimary">{row.section}</td>
                            
                            {row.monthWise.map((m, idx) => (
                              <td key={idx} className="px-6 py-4 font-medium">
                                <span className={m.percentage >= 75 ? 'text-success' : 'text-danger'}>{m.percentage}%</span>
                              </td>
                            ))}
                            <td className="px-6 py-4">
                              <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-bold border ${row.overall >= 85 ? 'bg-success/10 text-success border-success/30' : row.overall < 75 ? 'bg-danger/10 text-danger border-danger/30' : 'bg-warning/10 text-warning border-warning/30'}`}>
                                {row.overall}%
                              </span>
                            </td>
                            <td className="px-6 py-4 font-bold">
                              <span className={row.overall >= 85 ? 'text-success' : row.overall < 75 ? 'text-danger' : 'text-warning'}>
                                {row.status}
                              </span>
                            </td>
                            <td className="px-6 py-4">
                              <button onClick={() => fetchReport(row)} className="text-primary hover:underline font-semibold text-sm">
                                View
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </Card>
              </>
            ) : null}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Specific Student Report View */}
      <AnimatePresence mode="wait">
        {isLoadingReport && (
          <motion.div
            key="loader"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex flex-col items-center justify-center py-20 text-textSecondary"
          >
            <Loader2 className="w-12 h-12 animate-spin mb-4 text-primary" />
            <p className="text-lg font-medium">Compiling 6-Month History...</p>
          </motion.div>
        )}

        {reportData && !isLoadingReport && (
          <motion.div
            key="report"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-6"
          >
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mt-6 gap-4">
              <h3 className="text-xl font-bold text-textPrimary border-l-4 border-primary pl-4">Student Profile Report</h3>
              <div className="flex gap-3">
                <button onClick={() => window.print()} className="btn-secondary flex items-center gap-2 bg-card shadow-sm hover:shadow-md transition-all"><FileText className="w-4 h-4"/> Print Report</button>
                <button onClick={exportPDF} className="btn-secondary flex items-center gap-2"><FileText className="w-4 h-4"/> PDF</button>
                <button onClick={exportExcel} className="btn-secondary flex items-center gap-2"><TableProperties className="w-4 h-4"/> Excel</button>
                <button onClick={clearReport} className="p-2 rounded-full hover:bg-danger/10 hover:text-danger transition-colors bg-background border border-border shadow-sm text-textSecondary ml-2">
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Profile Header */}
            <Card className="border-border bg-gradient-to-r from-card to-background shadow-md overflow-hidden relative">
              <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full -translate-y-1/2 translate-x-1/3 blur-3xl pointer-events-none"></div>
              <CardContent className="p-8">
                <div className="flex flex-col md:flex-row gap-8 items-start md:items-center">
                  <div className="w-24 h-24 rounded-2xl bg-primary/10 text-primary flex items-center justify-center border-2 border-primary/20 shrink-0">
                    <User className="w-12 h-12" />
                  </div>
                  <div className="flex-1">
                    <h2 className="text-3xl font-black text-textPrimary tracking-tight">{reportData.student.name}</h2>
                    <div className="flex flex-wrap gap-x-6 gap-y-2 mt-3 text-sm font-medium text-textSecondary">
                      <p className="flex items-center gap-2"><BookOpen className="w-4 h-4 text-primary"/> Register: <span className="text-textPrimary font-bold">{reportData.student.registerNumber}</span></p>
                      <p className="flex items-center gap-2"><Users className="w-4 h-4 text-primary"/> Class: <span className="text-textPrimary font-bold">{reportData.student.department} - {reportData.student.section}</span></p>
                      <p className="flex items-center gap-2"><Calendar className="w-4 h-4 text-primary"/> Year: <span className="text-textPrimary font-bold">{reportData.student.year}</span></p>
                      <p className="flex items-center gap-2"><Calendar className="w-4 h-4 text-primary"/> Semester: <span className="text-textPrimary font-bold">{reportData.student.semester}</span></p>
                    </div>
                  </div>
                  
                  <div className={`p-6 rounded-2xl border flex flex-col items-center justify-center shrink-0 w-40 backdrop-blur-sm ${getPercentageBg(reportData.overallPercentage)}`}>
                    <p className={`text-4xl font-black ${getPercentageColor(reportData.overallPercentage)}`}>{reportData.overallPercentage}%</p>
                    <p className={`text-xs font-bold uppercase tracking-wider mt-1 ${getPercentageColor(reportData.overallPercentage)}`}>Overall Auth</p>
                  </div>
                </div>

                {reportData.overallPercentage < 75 && (
                  <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="mt-6 bg-danger/10 border border-danger/30 rounded-xl p-4 flex gap-4 items-start shadow-sm">
                    <AlertCircle className="w-6 h-6 text-danger shrink-0 mt-0.5" />
                    <div>
                      <h4 className="font-bold text-danger text-lg tracking-tight">Low Attendance Warning</h4>
                      <p className="text-sm text-danger mt-1 font-medium leading-relaxed">This student's overall attendance is critically below the required 75% threshold. Formal intervention and parental notification may be required according to university regulations.</p>
                    </div>
                  </motion.div>
                )}
              </CardContent>
            </Card>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Present / Absent Pie Chart & Cards */}
              <Card className="border-border bg-card shadow-sm">
                <CardContent className="p-6 flex flex-col justify-center h-full relative">
                  <div className="absolute top-4 left-4 z-10">
                    <p className="text-sm font-semibold text-textSecondary uppercase tracking-wider mb-2">Total Classes: <span className="font-bold text-textPrimary">{reportData.totalClasses}</span></p>
                    <div className="space-y-1">
                      <p className="text-xl font-bold text-success">{reportData.totalPresent} <span className="text-xs font-semibold text-textSecondary uppercase tracking-wider">Present</span></p>
                      <p className="text-xl font-bold text-danger">{reportData.totalAbsent} <span className="text-xs font-semibold text-textSecondary uppercase tracking-wider">Absent</span></p>
                    </div>
                  </div>
                  <div className="w-full h-48 mt-4">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={[
                            { name: 'Present', value: reportData.totalPresent },
                            { name: 'Absent', value: reportData.totalAbsent }
                          ]}
                          cx="60%"
                          cy="50%"
                          innerRadius={50}
                          outerRadius={80}
                          paddingAngle={5}
                          dataKey="value"
                        >
                          <Cell key="cell-0" fill="#10B981" />
                          <Cell key="cell-1" fill="#EF4444" />
                        </Pie>
                        <Tooltip contentStyle={{ backgroundColor: 'var(--tw-colors-card)', borderColor: 'var(--tw-colors-border)', color: 'var(--tw-colors-textPrimary)', borderRadius: '0.5rem', fontWeight: 'bold' }} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
              
              {/* Monthly Trend Chart for Student */}
              <Card className="border-border bg-card shadow-sm md:col-span-2">
                <CardHeader>
                  <CardTitle>Student Monthly Trend</CardTitle>
                </CardHeader>
                <CardContent className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={reportData.monthlyData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="currentColor" className="opacity-10" />
                      <XAxis dataKey="month" tick={{ fill: 'currentColor', opacity: 0.6 }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fill: 'currentColor', opacity: 0.6 }} axisLine={false} tickLine={false} />
                      <Tooltip 
                        contentStyle={{ backgroundColor: 'var(--tw-colors-card)', borderColor: 'var(--tw-colors-border)', color: 'var(--tw-colors-textPrimary)', borderRadius: '0.5rem', fontWeight: 'bold' }}
                        cursor={{ fill: 'currentColor', opacity: 0.05 }}
                      />
                      <Bar dataKey="percentage" name="Attendance %" fill="#6366F1" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>

            {/* Subject-wise Summary Table */}
            {reportData.subjectWiseData && reportData.subjectWiseData.length > 0 && (
              <Card className="border-border bg-card shadow-sm overflow-hidden">
                <CardHeader className="border-b border-border bg-background/30">
                  <CardTitle>Subject-wise Summary</CardTitle>
                </CardHeader>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead className="bg-background/50 text-textSecondary uppercase text-xs font-bold border-b border-border">
                      <tr>
                        <th className="px-6 py-4">Subject</th>
                        <th className="px-6 py-4">Present</th>
                        <th className="px-6 py-4">Absent</th>
                        <th className="px-6 py-4">Percentage</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {reportData.subjectWiseData.map((subj, idx) => (
                        <tr key={idx} className="hover:bg-background/30 transition-colors">
                          <td className="px-6 py-4 font-bold text-textPrimary">{subj.subject}</td>
                          <td className="px-6 py-4 text-success font-semibold">{subj.present}</td>
                          <td className="px-6 py-4 text-danger font-semibold">{subj.absent}</td>
                          <td className="px-6 py-4">
                            <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-xs font-bold border ${subj.percentage >= 85 ? 'bg-success/10 text-success border-success/30' : subj.percentage < 75 ? 'bg-danger/10 text-danger border-danger/30' : 'bg-warning/10 text-warning border-warning/30'}`}>
                              {subj.percentage}%
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Card>
            )}

            {/* History Table */}
            <Card className="border-border bg-card shadow-sm overflow-hidden">
              <CardHeader className="border-b border-border bg-background/30">
                <CardTitle>Detailed Attendance History</CardTitle>
              </CardHeader>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-background/50 text-textSecondary uppercase text-xs font-bold border-b border-border">
                    <tr>
                      <th className="px-6 py-4">Date</th>
                      <th className="px-6 py-4">Time</th>
                      <th className="px-6 py-4">Type</th>
                      <th className="px-6 py-4">Subject</th>
                      <th className="px-6 py-4">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {reportData.history.length === 0 ? (
                      <tr>
                        <td colSpan="5" className="px-6 py-8 text-center text-textSecondary font-medium">
                          No attendance records found for the past 6 months.
                        </td>
                      </tr>
                    ) : (
                      reportData.history.map((record, idx) => (
                        <tr key={idx} className="hover:bg-background/30 transition-colors">
                          <td className="px-6 py-4 font-semibold text-textPrimary">{record.date}</td>
                          <td className="px-6 py-4 text-textSecondary">{record.time || '-'}</td>
                          <td className="px-6 py-4">
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-background border border-border text-xs font-semibold text-textSecondary">
                              {record.type}
                            </span>
                          </td>
                          <td className="px-6 py-4 font-medium text-textPrimary">{record.subject || '-'}</td>
                          <td className="px-6 py-4">
                            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md border text-xs font-bold ${record.status === 'Present' ? 'bg-success/10 border-success/30 text-success' : 'bg-danger/10 border-danger/30 text-danger'}`}>
                              {record.status}
                            </span>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </Card>

          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
};

export default TeacherSixMonthReport;
