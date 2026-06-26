import { Card, CardContent, CardHeader, CardTitle } from '../../components/common/Card';
import StatCard from '../../components/common/StatCard';
import { Users, BookOpen } from 'lucide-react';
import PendingRegistrations from '../../components/dashboard/PendingRegistrations';
import { useAuth } from '../../context/AuthContext';

const HODDashboard = () => {
  const { user } = useAuth();
  
  // In a full implementation, we'd use user.departmentId.
  const deptId = user?.departmentId || null;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">HOD Dashboard</h2>
        <p className="text-textSecondary">Manage your department's attendance and student registrations.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <StatCard title="Department Students" value="845" icon={Users} color="primary" />
        <StatCard title="Total Sections" value="12" icon={BookOpen} color="secondary" />
      </div>

      <PendingRegistrations departmentId={deptId} />
      
    </div>
  );
};

export default HODDashboard;
