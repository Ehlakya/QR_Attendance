import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/layout/Layout';
import ProtectedRoute from './components/layout/ProtectedRoute';
import Login from './pages/auth/Login';
import StudentRegistration from './pages/auth/StudentRegistration';
import AdminDashboard from './pages/admin/AdminDashboard';
import DepartmentAnalytics from './pages/admin/DepartmentAnalytics';
import DepartmentAttendance from './pages/admin/DepartmentAttendance';
import HODDashboard from './pages/hod/HODDashboard';
import TeacherDashboard from './pages/teacher/TeacherDashboard';
import TeacherStudents from './pages/teacher/TeacherStudents';
import DepartmentAttendanceTeacher from './pages/teacher/DepartmentAttendanceTeacher';
import SubjectAttendance from './pages/teacher/SubjectAttendance';
import StudentDashboard from './pages/student/StudentDashboard';
import QRGenerator from './pages/shared/QRGenerator';
import QRScanner from './pages/student/QRScanner';
import StudentProfile from './pages/student/StudentProfile';
import StudentManagement from './pages/admin/StudentManagement';
import TeacherManagement from './pages/admin/TeacherManagement';
import AdminDetails from './pages/admin/AdminDetails';
import AdminAnalytics from './pages/admin/AdminAnalytics';
import MonitorLiveAttendance from './pages/teacher/MonitorLiveAttendance';
import SubjectSelection from './pages/teacher/SubjectSelection';
import SixMonthDashboard from './pages/shared/SixMonthDashboard';
import TeacherSixMonthReport from './pages/teacher/TeacherSixMonthReport';
import TeacherSetup from './pages/auth/TeacherSetup';

// Dummy components for now
const Dashboard = ({ role }) => <div className="p-8 text-xl">{role} Dashboard</div>;
const NotFound = () => <div className="p-8 text-center text-red-500">404 Not Found</div>;

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<StudentRegistration />} />
        <Route path="/teacher-setup" element={<TeacherSetup />} />
        
        {/* Admin Routes */}
        <Route element={<ProtectedRoute allowedRoles={['admin', 'ADMIN']} />}>
          <Route element={<Layout />}>
            <Route path="/admin" element={<AdminDashboard />} />
            <Route path="/admin/students" element={<StudentManagement />} />
            <Route path="/admin/teachers" element={<TeacherManagement />} />
            <Route path="/admin/details" element={<AdminDetails />} />
            <Route path="/admin/analytics" element={<AdminAnalytics />} />
            <Route path="/admin/departments" element={<DepartmentAttendance />} />
            <Route path="/admin/departments/:id" element={<DepartmentAnalytics />} />
            <Route path="/admin/qr" element={<QRGenerator />} />
            <Route path="/analytics/6-month" element={<SixMonthDashboard />} />
            {/* Add more admin routes here */}
          </Route>
        </Route>

        {/* HOD Routes */}
        <Route element={<ProtectedRoute allowedRoles={['HOD']} />}>
          <Route element={<Layout />}>
            <Route path="/hod" element={<HODDashboard />} />
            <Route path="/hod/students" element={<TeacherStudents />} />
            <Route path="/hod/qr" element={<QRGenerator />} />
            <Route path="/teacher/subjects" element={<SubjectSelection />} />
          </Route>
        </Route>

        {/* Teacher Routes */}
        <Route element={<ProtectedRoute allowedRoles={['Class Teacher', 'HOD']} />}>
          <Route element={<Layout />}>
            <Route path="/teacher/department-attendance" element={<DepartmentAttendanceTeacher />} />
            <Route path="/teacher/6-month-report" element={<TeacherSixMonthReport />} />
          </Route>
        </Route>

        <Route element={<ProtectedRoute allowedRoles={['Class Teacher', 'Subject Teacher', 'HOD', 'admin']} />}>
          <Route element={<Layout />}>
            <Route path="/teacher" element={<TeacherDashboard />} />
            <Route path="/teacher/students" element={<TeacherStudents />} />
            <Route path="/teacher/qr" element={<QRGenerator />} />
            <Route path="/teacher/attendance/:qrId" element={<SubjectAttendance />} />
            <Route path="/teacher/live-monitor" element={<MonitorLiveAttendance />} />
            <Route path="/teacher/subjects" element={<SubjectSelection />} />
          </Route>
        </Route>

        {/* Student Routes */}
        <Route element={<ProtectedRoute allowedRoles={['Student']} />}>
          <Route element={<Layout />}>
            <Route path="/student" element={<StudentDashboard />} />
            <Route path="/student/scan" element={<QRScanner />} />
            <Route path="/student/profile" element={<StudentProfile />} />
          </Route>
        </Route>

        {/* Default Redirect */}
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Router>
  );
}

export default App;
