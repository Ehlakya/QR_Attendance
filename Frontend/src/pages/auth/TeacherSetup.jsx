import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import axios from 'axios';
import { motion } from 'framer-motion';
import { MASTER_DEPARTMENTS } from '../../constants/departments';
import { PREDEFINED_SUBJECTS } from '../../constants/subjects';

const TeacherSetup = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const setupData = location.state?.setupData;

  const [setupLoading, setSetupLoading] = useState(false);
  const [selectedRole, setSelectedRole] = useState('');
  const [sections, setSections] = useState([]);
  const [selectedDepartment, setSelectedDepartment] = useState('');
  const [selectedSubjects, setSelectedSubjects] = useState([]);

  useEffect(() => {
    if (!setupData) {
      toast.error('Direct access to setup is not allowed. Please login via Google.');
      navigate('/login', { replace: true });
    }
  }, [setupData, navigate]);

  useEffect(() => {
    const fetchSections = async () => {
      try {
        const response = await axios.get('http://localhost:5000/api/v1/sections');
        setSections(response.data.data || []);
      } catch (error) {
        console.error('Failed to fetch sections:', error);
      }
    };
    fetchSections();
  }, []);

  const handleRouteRedirect = (role) => {
    const defaultPaths = {
      'HOD': '/hod',
      'Class Teacher': '/teacher',
      'Subject Teacher': '/teacher'
    };
    navigate(defaultPaths[role] || '/login');
  };

  const handleSetupSubmit = async (e) => {
    e.preventDefault();
    if (!setupData) return;

    const formData = new FormData(e.target);
    const data = {
      name: formData.get('name'),
      email: setupData.email,
      phone: formData.get('phone'),
      role: formData.get('role'),
      departmentId: formData.get('departmentId') || null,
      subject: selectedRole === 'Subject Teacher' ? selectedSubjects.join(',') : (formData.get('subject') || null),
      year: formData.get('year') || null,
      sectionId: formData.get('sectionId') || null,
      googleId: setupData.googleId
    };

    if (data.phone.length !== 10 || isNaN(data.phone)) {
      toast.error('Mobile number must be exactly 10 digits');
      return;
    }

    setSetupLoading(true);
    try {
      const response = await axios.post('http://localhost:5000/api/v1/auth/setup-teacher', data);
      const { user, token } = response.data.data;
      login(user, token);
      toast.success('Profile setup completed successfully!');
      handleRouteRedirect(user.role);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Setup failed. Please try again.');
    } finally {
      setSetupLoading(false);
    }
  };

  if (!setupData) return null;

  return (
    <div className="min-h-screen bg-background flex flex-col md:flex-row font-sans overflow-hidden relative transition-colors duration-300">
      {/* Background Animated Orbs */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/20 rounded-full blur-[120px] mix-blend-multiply animate-pulse-glow" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-secondary/20 rounded-full blur-[120px] mix-blend-multiply animate-pulse-glow" style={{ animationDelay: '1s' }} />

      <div className="w-full flex items-center justify-center p-6 sm:p-8 bg-transparent relative z-10">
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="max-w-xl w-full"
        >
          <div className="card">
            <div className="animate-fade-in">
              <div className="text-center mb-8">
                <h2 className="text-3xl font-extrabold text-textPrimary mb-2 tracking-tight">Profile Setup</h2>
                <p className="text-textSecondary font-medium">Complete your teacher profile to continue</p>
              </div>
              <form onSubmit={handleSetupSubmit} className="space-y-5">
                <div>
                  <label className="block text-sm font-semibold text-textPrimary mb-1.5">Full Name</label>
                  <input 
                    type="text" 
                    name="name" 
                    defaultValue={setupData.name || ''} 
                    required 
                    className="input bg-background/50 focus:bg-background text-textPrimary border-border" 
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-textPrimary mb-1.5">Email ID</label>
                  <input 
                    type="email" 
                    value={setupData.email || ''} 
                    disabled 
                    className="input bg-background/10 text-textSecondary border-border opacity-70 cursor-not-allowed" 
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-textPrimary mb-1.5">Mobile Number</label>
                  <input 
                    type="text" 
                    name="phone" 
                    required 
                    maxLength={10}
                    pattern="\d{10}"
                    placeholder="10 digit mobile number"
                    className="input bg-background/50 focus:bg-background text-textPrimary border-border" 
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-textPrimary mb-1.5">Role</label>
                  <select 
                    name="role" 
                    required 
                    value={selectedRole}
                    onChange={(e) => setSelectedRole(e.target.value)}
                    className="input bg-background/50 focus:bg-background text-textPrimary border-border"
                  >
                    <option value="">Select Role</option>
                    <option value="HOD">HOD</option>
                    <option value="Class Teacher">Class Teacher</option>
                    <option value="Subject Teacher">Subject Teacher</option>
                  </select>
                </div>
                
                {(selectedRole === 'HOD' || selectedRole === 'Class Teacher') && (
                  <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="space-y-5">
                    <div>
                      <label className="block text-sm font-semibold text-textPrimary mb-1.5">Department</label>
                      <select 
                        name="departmentId" 
                        required 
                        value={selectedDepartment}
                        onChange={(e) => setSelectedDepartment(e.target.value)}
                        className="input bg-background/50 focus:bg-background text-textPrimary border-border"
                      >
                        <option value="">Select Department</option>
                        {MASTER_DEPARTMENTS.map(dept => (
                          <option key={dept.id} value={dept.id}>{dept.name} ({dept.abbr})</option>
                        ))}
                      </select>
                    </div>

                    {selectedRole === 'Class Teacher' && (
                      <>
                        <div>
                          <label className="block text-sm font-semibold text-textPrimary mb-1.5">Year</label>
                          <select 
                            name="year" 
                            required 
                            className="input bg-background/50 focus:bg-background text-textPrimary border-border"
                          >
                            <option value="">Select Year</option>
                            <option value="I">I</option>
                            <option value="II">II</option>
                            <option value="III">III</option>
                            <option value="IV">IV</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-sm font-semibold text-textPrimary mb-1.5">Section</label>
                          <select 
                            name="sectionId" 
                            required 
                            className="input bg-background/50 focus:bg-background text-textPrimary border-border"
                          >
                            <option value="">Select Section</option>
                            {sections
                              .filter(sec => !selectedDepartment || sec.departmentId === parseInt(selectedDepartment))
                              .map(sec => (
                                <option key={sec.id} value={sec.id}>{sec.name}</option>
                              ))
                            }
                          </select>
                        </div>
                      </>
                    )}
                  </motion.div>
                )}

                {selectedRole === 'Subject Teacher' && (
                  <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}>
                    <label className="block text-sm font-semibold text-textPrimary mb-1.5">Select Subjects</label>
                    <div className="bg-background/50 border border-border rounded-xl p-4 max-h-48 overflow-y-auto space-y-2 custom-scrollbar">
                      {PREDEFINED_SUBJECTS.map(sub => (
                        <label key={sub.id} className="flex items-center gap-3 p-2 hover:bg-background rounded-lg cursor-pointer transition-colors group">
                          <input 
                            type="checkbox" 
                            name="subject"
                            value={sub.name}
                            checked={selectedSubjects.includes(sub.name)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedSubjects([...selectedSubjects, sub.name]);
                              } else {
                                setSelectedSubjects(selectedSubjects.filter(s => s !== sub.name));
                              }
                            }}
                            className="w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary/50 cursor-pointer"
                          />
                          <span className="text-sm font-medium text-textPrimary group-hover:text-primary transition-colors">{sub.name}</span>
                        </label>
                      ))}
                    </div>
                  </motion.div>
                )}

                <button 
                  type="submit" 
                  disabled={setupLoading}
                  className="w-full btn-primary py-3 flex justify-center items-center gap-2 text-base shadow-lg shadow-primary/30 mt-4 hover:shadow-primary/40 hover:-translate-y-0.5 transition-all text-white"
                >
                  {setupLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Complete Setup & Login'}
                </button>
                <button 
                  type="button" 
                  onClick={() => navigate('/login')}
                  className="w-full py-2 text-sm text-textSecondary font-medium hover:text-textPrimary transition-colors"
                >
                  Cancel
                </button>
              </form>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default TeacherSetup;
