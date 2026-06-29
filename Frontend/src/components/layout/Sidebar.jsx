import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';
import { useSocket } from '../../context/SocketContext';
import { cn } from '../../utils/cn';
import { 
  LayoutDashboard, Users, UserCog, Building2, 
  Layers, QrCode, ClipboardList, Bell, Settings,
  ChevronDown, ChevronRight, Activity, BookOpen
} from 'lucide-react';

const Sidebar = () => {
  const { user, token } = useAuth();
  const location = useLocation();
  const socket = useSocket();
  const [expanded, setExpanded] = useState({});
  const [counts, setCounts] = useState({
    students: 0,
    teachers: 0,
    departments: 0,
    attendance: 0
  });

  useEffect(() => {
    if (user?.role === 'ADMIN' || user?.role === 'admin') {
      const fetchCounts = async () => {
        try {
          const response = await axios.get('http://localhost:5000/api/v1/dashboard/admin', {
            headers: { Authorization: `Bearer ${token}` }
          });
          const { totalStudents, totalTeachers, totalDepartments, totalAttendance } = response.data.data;
          setCounts({
            students: totalStudents,
            teachers: totalTeachers,
            departments: totalDepartments,
            attendance: totalAttendance
          });
        } catch (error) {
          console.error("Failed to fetch sidebar counts");
        }
      };
      fetchCounts();
    }
  }, [user, token]);

  useEffect(() => {
    if (!socket || (user?.role !== 'ADMIN' && user?.role !== 'admin')) return;

    const handleNewReg = () => setCounts(prev => ({ ...prev, students: prev.students + 1 }));
    const handleNewTeacher = () => setCounts(prev => ({ ...prev, teachers: prev.teachers + 1 }));
    const handleNewAttendance = () => setCounts(prev => ({ ...prev, attendance: prev.attendance + 1 }));
    
    // Assumes backend might emit this eventually
    const handleNewDept = () => setCounts(prev => ({ ...prev, departments: prev.departments + 1 }));

    socket.on('new_registration', handleNewReg);
    socket.on('new_teacher_added', handleNewTeacher);
    socket.on('new_attendance', handleNewAttendance);
    socket.on('new_department', handleNewDept);

    return () => {
      socket.off('new_registration', handleNewReg);
      socket.off('new_teacher_added', handleNewTeacher);
      socket.off('new_attendance', handleNewAttendance);
      socket.off('new_department', handleNewDept);
    };
  }, [socket, user]);

  const toggleExpand = (name) => {
    setExpanded(prev => ({ ...prev, [name]: !prev[name] }));
  };

  const getNavItems = (role) => {
    switch (role) {
      case 'ADMIN':
      case 'admin':
        return [
          { name: 'Dashboard', path: '/admin', icon: LayoutDashboard },
          { 
            name: 'Students', 
            path: '/admin/students', 
            icon: Users,
            badge: counts.students
          },
          { 
            name: 'Teachers', 
            path: '/admin/teachers', 
            icon: UserCog,
            badge: counts.teachers
          },
          { 
            name: 'Department Attendance', 
            path: '/admin/departments', 
            icon: Building2,
            badge: counts.departments
          },
          { 
            name: 'Attendance', 
            path: '/admin/analytics', 
            icon: ClipboardList,
            badge: counts.attendance
          },
          { 
            name: '6-Month Report', 
            path: '/analytics/6-month', 
            icon: Activity 
          },
          { 
            name: 'Details', 
            path: '/admin/details', 
            icon: Layers
          }
        ];
      case 'HOD':
        return [
          { name: 'Dashboard', path: '/hod', icon: LayoutDashboard },
          { name: 'Department Attendance', path: '/teacher/department-attendance', icon: ClipboardList },
          { name: 'Students', path: '/hod/students', icon: Users },
          { name: 'QR Generator', path: '/hod/qr', icon: QrCode },
          { name: '6-Month Report', path: '/teacher/6-month-report', icon: Activity },
          { name: 'Manage Subjects', path: '/teacher/subjects', icon: BookOpen },
        ];
      case 'Class Teacher':
        return [
          { name: 'Dashboard', path: '/teacher', icon: LayoutDashboard },
          { name: 'Department Attendance', path: '/teacher/department-attendance', icon: ClipboardList },
          { name: 'Students', path: '/teacher/students', icon: Users },
          { name: 'Morning QR', path: '/teacher/qr', icon: QrCode },
          { name: 'Live Monitor', path: '/teacher/live-monitor', icon: Activity },
          { name: '6-Month Report', path: '/teacher/6-month-report', icon: Activity },
        ];
      case 'Subject Teacher':
        return [
          { name: 'Dashboard', path: '/teacher', icon: LayoutDashboard },
          { name: 'QR Generator', path: '/teacher/qr', icon: QrCode },
          { name: 'Live Monitor', path: '/teacher/live-monitor', icon: Activity },
        ];
      case 'Student':
        return [
          { name: 'Dashboard', path: '/student', icon: LayoutDashboard },
          { name: 'Scan QR', path: '/student/scan', icon: QrCode },
          { name: 'Profile', path: '/student/profile', icon: UserCog },
        ];
      default:
        return [];
    }
  };

  const navItems = getNavItems(user?.role);

  return (
    <aside className="w-full h-full bg-card border-r border-border flex flex-col transition-colors duration-300">
      <div className="p-6">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center shadow-[0_0_15px_rgba(99,102,241,0.4)]">
            <QrCode className="text-white w-5 h-5" />
          </div>
          <span className="text-xl font-bold text-textPrimary tracking-tight">QR Attend</span>
        </div>
      </div>
      <nav className="flex-1 px-4 pb-4 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const isBaseDashboard = ['/admin', '/teacher', '/hod', '/student'].includes(item.path);
          const isActive = isBaseDashboard 
            ? location.pathname === item.path 
            : location.pathname === item.path || location.pathname.startsWith(`${item.path}/`);
          const Icon = item.icon;
          const hasSub = item.subItems && item.subItems.length > 0;
          const isExpanded = expanded[item.name];

          return (
            <div key={item.name} className="mb-1">
              {hasSub ? (
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => toggleExpand(item.name)}
                  className={cn(
                    "w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-300 border-l-4 border-transparent",
                    isActive ? "bg-primary/10 text-primary border-l-primary shadow-[0_0_15px_rgba(99,102,241,0.2)]" : "text-textSecondary hover:bg-primary/5 dark:hover:bg-primary/10 hover:text-textPrimary hover:border-l-primary/50"
                  )}
                >
                  <div className="flex items-center gap-3">
                    <Icon className={cn("w-5 h-5", isActive ? "text-primary" : "text-textSecondary/60")} />
                    <span>{item.name}</span>
                  </div>
                  {isExpanded ? <ChevronDown className="w-4 h-4 text-textSecondary/60" /> : <ChevronRight className="w-4 h-4 text-textSecondary/60" />}
                </motion.button>
              ) : (
                <motion.div whileHover={{ scale: 1.02, x: 2 }} whileTap={{ scale: 0.98 }}>
                  <Link
                    to={item.path}
                    className={cn(
                      "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-300 border-l-4 border-transparent",
                      isActive ? "bg-primary/10 text-primary border-l-primary shadow-[0_0_15px_rgba(99,102,241,0.2)]" : "text-textSecondary hover:bg-primary/5 dark:hover:bg-primary/10 hover:text-textPrimary hover:border-l-primary/50"
                    )}
                  >
                    <Icon className={cn("w-5 h-5", isActive ? "text-primary" : "text-textSecondary/60")} />
                    <span>{item.name}</span>
                  </Link>
                </motion.div>
              )}

              {/* Sub Items */}
              {hasSub && isExpanded && (
                <div className="mt-1 ml-9 space-y-1 border-l-2 border-border pl-3">
                  {item.subItems.map((sub, idx) => (
                    <Link
                      key={idx}
                      to={sub.path}
                      className="block px-3 py-2 rounded-md text-xs font-medium text-textSecondary hover:text-primary hover:bg-primary/10 transition-colors"
                    >
                      • {sub.name}
                    </Link>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </nav>
      
      <div className="p-4 border-t border-border bg-background/50 mt-auto backdrop-blur-sm">
        <div className="flex items-center justify-between px-2">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex flex-shrink-0 items-center justify-center text-primary font-bold shadow-inner">
              {user?.name?.charAt(0) || 'U'}
            </div>
            <div className="overflow-hidden">
              <p className="text-sm font-bold text-textPrimary truncate">{user?.name || 'User'}</p>
              <p className="text-xs font-medium text-textSecondary truncate">{user?.role || 'Role'}</p>
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
