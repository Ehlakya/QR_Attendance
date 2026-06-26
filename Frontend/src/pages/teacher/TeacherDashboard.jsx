import { Card, CardContent, CardHeader, CardTitle } from '../../components/common/Card';
import StatCard from '../../components/common/StatCard';
import { Users, Calendar } from 'lucide-react';
import PendingRegistrations from '../../components/dashboard/PendingRegistrations';
import { useAuth } from '../../context/AuthContext';

const TeacherDashboard = () => {
  const { user } = useAuth();
  
  // In a full implementation, we'd use user.sectionId.
  const sectionId = user?.sectionId || null;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Class Teacher Dashboard</h2>
        <p className="text-textSecondary">Manage your assigned section's attendance and students.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <StatCard title="Class Students" value="60" icon={Users} color="primary" />
        <StatCard title="Classes Taken" value="45" icon={Calendar} color="secondary" />
      </div>

      <PendingRegistrations sectionId={sectionId} />
      
    </div>
  );
};

export default TeacherDashboard;
