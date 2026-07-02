import { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';
import { useSocket } from '../../hooks/useSocket';
import { Check, X, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { Card, CardContent, CardHeader, CardTitle } from '../common/Card';

const PendingRegistrations = ({ departmentId, sectionId }) => {
  const [students, setStudents] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const { token } = useAuth();
  const socket = useSocket();

  const fetchPendingStudents = async () => {
    try {
      let url = 'https://qr-attendance-y9x7.onrender.com/api/v1/students?status=Pending';
      if (departmentId && departmentId !== '1' && departmentId !== 1) url += `&departmentId=${departmentId}`;
      if (sectionId && sectionId !== '1' && sectionId !== 1) url += `&sectionId=${sectionId}`;

      const response = await axios.get(url, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setStudents(response.data.data);
    } catch (error) {
      toast.error('Failed to load pending registrations');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPendingStudents();
  }, [departmentId, sectionId, token]);

  useEffect(() => {
    if (!socket) return;

    socket.on('new_registration', (data) => {
      // Show notification if no filters apply, or if it matches department/section filters
      if (
        (!departmentId && !sectionId) || 
        (departmentId && data.departmentId === departmentId) ||
        (sectionId && data.sectionId === sectionId)
      ) {
        toast.success(`New Registration: ${data.name} (${data.registerNumber})`);
      }
      fetchPendingStudents();
    });

    socket.on('student_status_updated', () => {
      fetchPendingStudents();
    });

    return () => {
      socket.off('new_registration');
      socket.off('student_status_updated');
    };
  }, [socket]);

  const handleUpdateStatus = async (id, status) => {
    try {
      await axios.put(`https://qr-attendance-y9x7.onrender.com/api/v1/students/${id}/status`, { status }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success(`Student ${status} successfully`);
      fetchPendingStudents();
    } catch (error) {
      toast.error(`Failed to update student status`);
    }
  };

  if (isLoading) {
    return <div className="flex justify-center p-8"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>New Student Registrations</CardTitle>
      </CardHeader>
      <CardContent>
        {students.length === 0 ? (
          <p className="text-gray-500 text-center py-8">No pending registrations at this time.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-gray-500 bg-gray-50 uppercase">
                <tr>
                  <th className="px-6 py-3 rounded-tl-lg">Student Name</th>
                  <th className="px-6 py-3">Register No</th>
                  <th className="px-6 py-3">Department</th>
                  <th className="px-6 py-3">Section</th>
                  <th className="px-6 py-3">Date</th>
                  <th className="px-6 py-3 rounded-tr-lg text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {students.map((student) => (
                  <tr key={student.id} className="border-b last:border-0 hover:bg-gray-50/50 transition-colors">
                    <td className="px-6 py-4 font-medium text-gray-900">{student.name}</td>
                    <td className="px-6 py-4">{student.registerNumber}</td>
                    <td className="px-6 py-4">{student.Department?.code || 'N/A'}</td>
                    <td className="px-6 py-4">{student.Section?.name || 'N/A'}</td>
                    <td className="px-6 py-4">{new Date(student.createdAt).toLocaleDateString()}</td>
                    <td className="px-6 py-4 text-right flex justify-end gap-2">
                      <button 
                        onClick={() => handleUpdateStatus(student.id, 'Approved')}
                        className="p-1.5 bg-success/10 text-success rounded-lg hover:bg-success/20 transition-colors"
                        title="Approve"
                      >
                        <Check className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => handleUpdateStatus(student.id, 'Rejected')}
                        className="p-1.5 bg-danger/10 text-danger rounded-lg hover:bg-danger/20 transition-colors"
                        title="Reject"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default PendingRegistrations;
