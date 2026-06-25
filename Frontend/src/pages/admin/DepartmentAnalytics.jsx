import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ChevronRight, Download, Users, UserCheck, UserX, Percent } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/common/Card';
import StatCard from '../../components/common/StatCard';
import DataTable from '../../components/common/DataTable';
import { 
  PieChart, Pie, Cell, 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer,
  LineChart, Line
} from 'recharts';

// Mock Data
const PIE_DATA = [
  { name: 'Present', value: 105, color: '#10B981' },
  { name: 'Absent', value: 15, color: '#EF4444' }
];

const BAR_DATA = [
  { section: 'Section A', present: 55, absent: 5 },
  { section: 'Section B', present: 50, absent: 10 }
];

const LINE_DATA = [
  { day: 'Mon', attendance: 85 },
  { day: 'Tue', attendance: 90 },
  { day: 'Wed', attendance: 88 },
  { day: 'Thu', attendance: 82 },
  { day: 'Fri', attendance: 91 }
];

const SECTION_COLUMNS = [
  { header: 'Section', accessor: 'section' },
  { header: 'Total Students', accessor: 'total' },
  { header: 'Present', accessor: 'present' },
  { header: 'Absent', accessor: 'absent' },
  { header: 'Attendance %', accessor: 'percentage', cell: (row) => <span className="font-semibold text-textPrimary">{row.percentage}%</span> }
];

const SECTION_DATA = [
  { section: 'A', total: 60, present: 55, absent: 5, percentage: 91.6 },
  { section: 'B', total: 60, present: 50, absent: 10, percentage: 83.3 }
];

const STUDENT_COLUMNS = [
  { header: 'Student Name', accessor: 'name' },
  { header: 'Register No', accessor: 'regNo' },
  { header: 'Section', accessor: 'section' },
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
  },
  { header: 'Time', accessor: 'time' }
];

const STUDENT_DATA = Array.from({ length: 15 }).map((_, i) => ({
  id: i,
  name: `Student ${i + 1}`,
  regNo: `CS2026${i.toString().padStart(3, '0')}`,
  section: i % 2 === 0 ? 'A' : 'B',
  status: i % 8 === 0 ? 'Absent' : 'Present',
  time: i % 8 === 0 ? '-' : '08:45 AM'
}));

const DepartmentAnalytics = () => {
  const { id } = useParams();
  const [dateFilter, setDateFilter] = useState('today');

  return (
    <div className="space-y-6">
      {/* Header & Breadcrumb */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <div className="flex items-center gap-2 text-sm text-textSecondary mb-2">
            <Link to="/admin" className="hover:text-primary transition-colors">Dashboard</Link>
            <ChevronRight className="w-4 h-4" />
            <span className="text-textPrimary font-medium">Computer Science Dept</span>
          </div>
          <h2 className="text-2xl font-bold tracking-tight text-textPrimary">Department Analytics</h2>
        </div>

        <div className="flex items-center gap-3">
          <select 
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
            className="input py-2 w-40 bg-card text-textPrimary"
          >
            <option value="today">Today</option>
            <option value="yesterday">Yesterday</option>
            <option value="this_week">This Week</option>
            <option value="this_month">This Month</option>
          </select>
          
          <div className="flex gap-2">
            <button className="btn-secondary flex items-center gap-2">
              <Download className="w-4 h-4" /> PDF
            </button>
            <button className="btn-secondary flex items-center gap-2">
              <Download className="w-4 h-4" /> Excel
            </button>
          </div>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard title="Total Students" value="120" icon={Users} color="primary" />
        <StatCard title="Present Students" value="105" icon={UserCheck} color="success" />
        <StatCard title="Absent Students" value="15" icon={UserX} color="danger" />
        <StatCard title="Attendance Rate" value="87.5%" icon={Percent} color="warning" />
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Pie Chart */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle>Attendance Distribution</CardTitle>
          </CardHeader>
          <CardContent className="h-72 flex flex-col items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={PIE_DATA} innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
                  {PIE_DATA.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <RechartsTooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
              </PieChart>
            </ResponsiveContainer>
            <div className="flex justify-center gap-6 mt-4">
              {PIE_DATA.map((entry) => (
                <div key={entry.name} className="flex items-center gap-2 text-sm font-medium">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: entry.color }}></div>
                  {entry.name}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Bar Chart */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Section-wise Breakdown</CardTitle>
          </CardHeader>
          <CardContent className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={BAR_DATA} margin={{ top: 20, right: 30, left: -20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                <XAxis dataKey="section" axisLine={false} tickLine={false} tick={{ fill: '#64748B' }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748B' }} />
                <RechartsTooltip cursor={{ fill: '#F1F5F9' }} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                <Bar dataKey="present" name="Present" fill="#10B981" radius={[4, 4, 0, 0]} barSize={40} />
                <Bar dataKey="absent" name="Absent" fill="#EF4444" radius={[4, 4, 0, 0]} barSize={40} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Line Chart */}
        <Card className="lg:col-span-3">
          <CardHeader>
            <CardTitle>Attendance Trend (This Week)</CardTitle>
          </CardHeader>
          <CardContent className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={LINE_DATA} margin={{ top: 20, right: 30, left: -20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fill: '#64748B' }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748B' }} />
                <RechartsTooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                <Line type="monotone" dataKey="attendance" name="Attendance %" stroke="#4F46E5" strokeWidth={3} dot={{ r: 4, fill: '#4F46E5', strokeWidth: 2, stroke: '#fff' }} activeDot={{ r: 6 }} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Section Table */}
      <Card>
        <CardHeader>
          <CardTitle>Section Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <DataTable columns={SECTION_COLUMNS} data={SECTION_DATA} searchable={false} />
        </CardContent>
      </Card>

      {/* Student List */}
      <Card>
        <CardHeader>
          <CardTitle>Student Attendance Log</CardTitle>
        </CardHeader>
        <CardContent>
          <DataTable columns={STUDENT_COLUMNS} data={STUDENT_DATA} />
        </CardContent>
      </Card>

    </div>
  );
};

export default DepartmentAnalytics;
