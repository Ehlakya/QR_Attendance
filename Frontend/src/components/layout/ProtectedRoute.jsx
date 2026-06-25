import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const ProtectedRoute = ({ allowedRoles }) => {
  const { user, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    // If role not allowed, redirect to their default dashboard
    const defaultPaths = {
      'admin': '/admin',
      'HOD': '/hod',
      'Class Teacher': '/teacher',
      'Subject Teacher': '/teacher',
      'Student': '/student'
    };
    return <Navigate to={defaultPaths[user.role] || '/login'} replace />;
  }

  return <Outlet />;
};

export default ProtectedRoute;
