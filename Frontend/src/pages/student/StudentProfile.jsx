import { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';
import { useSocket } from '../../context/SocketContext';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/common/Card';
import StatCard from '../../components/common/StatCard';
import { User, Mail, Phone, BookOpen, Layers, Calendar, Clock, Download, Edit3, Key, ShieldCheck, Building2 } from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import toast from 'react-hot-toast';

const StudentProfile = () => {
  const { user, token } = useAuth();
  const socket = useSocket();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  // Modal States
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  
  // Form States
  const [editForm, setEditForm] = useState({ name: '', mobile: '' });
  const [passwordForm, setPasswordForm] = useState({ oldPassword: '', newPassword: '', confirmPassword: '' });
  const [submitting, setSubmitting] = useState(false);

  const fetchProfile = async () => {
    try {
      const response = await axios.get('http://localhost:5000/api/v1/students/profile', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = response.data.data;
      setProfile(data);
      setEditForm({ name: data.name, mobile: data.mobile || '' });
    } catch (error) {
      console.error('Failed to fetch profile', error);
      toast.error('Failed to load profile details');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, [token]);

  useEffect(() => {
    if (!socket || !user) return;
    
    // Real-time stat update for attendance
    const handleNewAttendance = (data) => {
      if (data.studentId === user.id) {
        toast.success("New attendance logged! Updating profile...");
        fetchProfile(); // Fast enough to just refetch the fresh aggregations
      }
    };

    socket.on('new_attendance', handleNewAttendance);
    return () => socket.off('new_attendance', handleNewAttendance);
  }, [socket, user]);

  const exportPDF = () => {
    if (!profile || !profile.history) return;
    const doc = new jsPDF();
    
    // Header
    doc.setFontSize(16);
    doc.text("Student Attendance Report", 14, 15);
    
    doc.setFontSize(10);
    doc.text(`Name: ${profile.name}`, 14, 25);
    doc.text(`Register Number: ${profile.registerNumber}`, 14, 30);
    doc.text(`Department: ${profile.department}`, 14, 35);
    doc.text(`Section: ${profile.section}`, 14, 40);
    
    // Stats
    doc.text(`Total Attendance: ${profile.stats.totalClasses}`, 120, 25);
    doc.text(`Present: ${profile.stats.presentDays}`, 120, 30);
    doc.text(`Absent: ${profile.stats.absentDays}`, 120, 35);
    doc.text(`Attendance Percentage: ${profile.stats.attendancePercentage}%`, 120, 40);

    // Table
    const tableColumn = ["Date", "Type", "Subject", "Status", "Time"];
    const tableRows = profile.history.map(record => [
      record.date,
      record.type,
      record.subject || '-',
      record.status,
      record.time
    ]);

    autoTable(doc, {
      head: [tableColumn],
      body: tableRows,
      startY: 50,
      styles: { fontSize: 8 },
      headStyles: { fillColor: [79, 70, 229] } // Primary color
    });

    doc.save(`Attendance_Report_${profile.registerNumber}.pdf`);
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await axios.put('http://localhost:5000/api/v1/students/profile', editForm, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success('Profile updated successfully');
      setIsEditModalOpen(false);
      fetchProfile();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update profile');
    } finally {
      setSubmitting(false);
    }
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      return toast.error("New passwords don't match");
    }
    setSubmitting(true);
    try {
      await axios.put('http://localhost:5000/api/v1/students/profile/password', {
        oldPassword: passwordForm.oldPassword,
        newPassword: passwordForm.newPassword
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success('Password changed successfully');
      setIsPasswordModalOpen(false);
      setPasswordForm({ oldPassword: '', newPassword: '', confirmPassword: '' });
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to change password');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div className="p-8 flex justify-center text-primary animate-pulse">Loading Profile...</div>;
  if (!profile) return <div className="p-8 text-center text-danger">Profile not found.</div>;

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      
      {/* Profile Header Card */}
      <Card className="bg-gradient-to-r from-primary to-indigo-600 text-white overflow-hidden relative">
        <div className="absolute top-0 right-0 p-16 opacity-10">
          <User className="w-64 h-64" />
        </div>
        <CardContent className="p-8 relative z-10 flex flex-col md:flex-row items-center md:items-start gap-6">
          <div className="w-24 h-24 bg-white/20 rounded-full border-4 border-white/30 flex items-center justify-center text-4xl font-bold uppercase shadow-xl">
            {profile.name.charAt(0)}
          </div>
          <div className="flex-1 text-center md:text-left space-y-2">
            <h1 className="text-3xl font-bold tracking-tight">{profile.name}</h1>
            <div className="flex flex-wrap justify-center md:justify-start gap-4 text-white/90">
              <span className="flex items-center gap-1"><BookOpen className="w-4 h-4"/> {profile.registerNumber}</span>
              <span className="flex items-center gap-1"><Building2 className="w-4 h-4"/> {profile.department}</span>
              <span className="flex items-center gap-1"><Layers className="w-4 h-4"/> {profile.section}</span>
            </div>
            <div className="pt-2">
              <span className="inline-flex items-center gap-1 bg-success/20 text-success-light border border-success/30 px-3 py-1 rounded-full text-sm font-medium">
                <ShieldCheck className="w-4 h-4" /> Active Account
              </span>
            </div>
          </div>
          <div className="flex flex-col gap-3 w-full md:w-auto">
            <button onClick={() => setIsEditModalOpen(true)} className="btn-secondary bg-white/10 hover:bg-white/20 text-white border-none flex items-center justify-center gap-2">
              <Edit3 className="w-4 h-4" /> Edit Profile
            </button>
            <button onClick={() => setIsPasswordModalOpen(true)} className="btn-secondary bg-white/10 hover:bg-white/20 text-white border-none flex items-center justify-center gap-2">
              <Key className="w-4 h-4" /> Change Password
            </button>
            <button onClick={exportPDF} className="btn-secondary bg-white text-primary hover:bg-gray-50 flex items-center justify-center gap-2 font-semibold">
              <Download className="w-4 h-4" /> Download Report
            </button>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column: Personal Info & QR Activity */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Personal Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-3 text-sm">
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary"><User className="w-4 h-4"/></div>
                <div><p className="text-textSecondary text-xs">Student Name</p><p className="font-medium">{profile.name}</p></div>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary"><BookOpen className="w-4 h-4"/></div>
                <div><p className="text-textSecondary text-xs">Register Number</p><p className="font-medium">{profile.registerNumber}</p></div>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary"><Mail className="w-4 h-4"/></div>
                <div><p className="text-textSecondary text-xs">Email Address</p><p className="font-medium">{profile.email}</p></div>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary"><Phone className="w-4 h-4"/></div>
                <div><p className="text-textSecondary text-xs">Mobile Number</p><p className="font-medium">{profile.mobile || 'Not Provided'}</p></div>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary"><Calendar className="w-4 h-4"/></div>
                <div><p className="text-textSecondary text-xs">Registration Date</p><p className="font-medium">{new Date(profile.createdAt).toLocaleDateString()}</p></div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>QR Activity</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between items-center border-b border-gray-100 pb-2">
                <span className="text-sm text-textSecondary">Total QR Scanned</span>
                <span className="font-bold text-primary">{profile.stats.presentDays}</span>
              </div>
              <div className="flex justify-between items-center border-b border-gray-100 pb-2">
                <span className="text-sm text-textSecondary">Last QR Scanned</span>
                <span className="text-sm font-medium">{profile.lastQrScanned || 'N/A'}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-textSecondary">Last Attendance</span>
                <span className="text-sm font-medium">{profile.lastAttendanceTime || 'N/A'}</span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Attendance Summary & History Table */}
        <div className="lg:col-span-2 space-y-6">
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <StatCard title="Total Classes" value={profile.stats.totalClasses} icon={BookOpen} color="primary" />
            <StatCard title="Present Days" value={profile.stats.presentDays} icon={ShieldCheck} color="success" />
            <StatCard title="Absent Days" value={profile.stats.absentDays} icon={User} color="danger" />
            <StatCard 
              title="Attendance %" 
              value={`${profile.stats.attendancePercentage}%`} 
              icon={Clock} 
              color={profile.stats.attendancePercentage >= 75 ? "success" : "warning"} 
            />
          </div>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Attendance History</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="bg-gray-50 text-gray-600 font-medium border-b border-gray-200">
                    <tr>
                      <th className="px-4 py-3 rounded-tl-lg">Date</th>
                      <th className="px-4 py-3">Type</th>
                      <th className="px-4 py-3">Subject</th>
                      <th className="px-4 py-3">Status</th>
                      <th className="px-4 py-3 rounded-tr-lg">Time</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {profile.history.map((record, idx) => (
                      <tr key={idx} className="hover:bg-gray-50/50 transition-colors">
                        <td className="px-4 py-3 font-medium text-gray-900">{record.date}</td>
                        <td className="px-4 py-3">
                          <span className="px-2 py-1 rounded-md text-xs font-medium bg-primary/10 text-primary">
                            {record.type}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-gray-600">{record.subject || '-'}</td>
                        <td className="px-4 py-3">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            record.status === 'Present' ? 'bg-success/10 text-success' : 'bg-danger/10 text-danger'
                          }`}>
                            {record.status}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-textSecondary">{record.time}</td>
                      </tr>
                    ))}
                    {profile.history.length === 0 && (
                      <tr>
                        <td colSpan="5" className="px-4 py-8 text-center text-textSecondary">
                          No attendance records found.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

        </div>
      </div>

      {/* Edit Profile Modal */}
      {isEditModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <Card className="w-full max-w-md animate-scale-in">
            <CardHeader>
              <CardTitle>Edit Profile</CardTitle>
            </CardHeader>
            <form onSubmit={handleEditSubmit}>
              <CardContent className="space-y-4">
                <div>
                  <label className="label">Full Name</label>
                  <input type="text" value={editForm.name} onChange={e => setEditForm({...editForm, name: e.target.value})} className="input" required />
                </div>
                <div>
                  <label className="label">Mobile Number</label>
                  <input 
                    type="tel" 
                    maxLength="10" 
                    pattern="\d{10}"
                    title="Mobile number must be exactly 10 digits"
                    value={editForm.mobile} 
                    onChange={e => setEditForm({...editForm, mobile: e.target.value.replace(/\D/g, '').slice(0, 10)})} 
                    className="input" 
                  />
                </div>
                <div className="pt-4 border-t border-gray-100 bg-gray-50/50 -mx-6 px-6 -mb-6 pb-6 rounded-b-xl flex justify-end gap-3 mt-6">
                  <button type="button" onClick={() => setIsEditModalOpen(false)} className="btn-secondary">Cancel</button>
                  <button type="submit" disabled={submitting} className="btn-primary">{submitting ? 'Saving...' : 'Save Changes'}</button>
                </div>
              </CardContent>
            </form>
          </Card>
        </div>
      )}

      {/* Change Password Modal */}
      {isPasswordModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <Card className="w-full max-w-md animate-scale-in">
            <CardHeader>
              <CardTitle>Change Password</CardTitle>
            </CardHeader>
            <form onSubmit={handlePasswordSubmit}>
              <CardContent className="space-y-4">
                <div>
                  <label className="label">Current Password</label>
                  <input type="password" value={passwordForm.oldPassword} onChange={e => setPasswordForm({...passwordForm, oldPassword: e.target.value})} className="input" required />
                </div>
                <div>
                  <label className="label">New Password</label>
                  <input type="password" value={passwordForm.newPassword} onChange={e => setPasswordForm({...passwordForm, newPassword: e.target.value})} className="input" required />
                </div>
                <div>
                  <label className="label">Confirm New Password</label>
                  <input type="password" value={passwordForm.confirmPassword} onChange={e => setPasswordForm({...passwordForm, confirmPassword: e.target.value})} className="input" required />
                </div>
                <div className="pt-4 border-t border-gray-100 bg-gray-50/50 -mx-6 px-6 -mb-6 pb-6 rounded-b-xl flex justify-end gap-3 mt-6">
                  <button type="button" onClick={() => setIsPasswordModalOpen(false)} className="btn-secondary">Cancel</button>
                  <button type="submit" disabled={submitting} className="btn-primary">{submitting ? 'Updating...' : 'Change Password'}</button>
                </div>
              </CardContent>
            </form>
          </Card>
        </div>
      )}
    </div>
  );
};

export default StudentProfile;
