// Note: The rest of the file stays exactly the same, but the form text colors and borders are updated.
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { QrCode, ShieldCheck, Zap, Clock, Eye, EyeOff, Loader2 } from 'lucide-react';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import axios from 'axios';
import { motion } from 'framer-motion';
import { MASTER_DEPARTMENTS } from '../../constants/departments';
import { PREDEFINED_SUBJECTS } from '../../constants/subjects';
const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.1, delayChildren: 0.2 }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 24 } }
};

const Login = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  
  const [showSetupForm, setShowSetupForm] = useState(false);
  const [setupData, setSetupData] = useState(null);
  const [setupLoading, setSetupLoading] = useState(false);
  const [selectedRole, setSelectedRole] = useState('');

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm({
    defaultValues: {
      username: 'admin@gmail.com',
      password: 'admin@123',
      rememberMe: false
    }
  });

  const handleRouteRedirect = (role) => {
    const defaultPaths = {
      'ADMIN': '/admin',
      'HOD': '/hod',
      'Class Teacher': '/teacher',
      'Subject Teacher': '/teacher',
      'Student': '/student'
    };
    navigate(defaultPaths[role] || '/login');
  };

  const onSubmit = async (data) => {
    try {
      let endpoint = '';
      let payload = {};

      const cleanUsername = data.username.trim();
      const cleanPassword = data.password.trim();

      if (cleanUsername.includes('@')) {
        endpoint = 'http://localhost:5000/api/v1/auth/admin-login';
        payload = { email: cleanUsername, password: cleanPassword };
      } else {
        endpoint = 'http://localhost:5000/api/v1/auth/student-login';
        payload = { registerNumber: cleanUsername, password: cleanPassword };
      }

      const response = await axios.post(endpoint, payload);

      const { user, token } = response.data.data;
      
      if (user.status === 'Pending') {
        toast.error('Your registration is pending approval from your class teacher.');
        return;
      }
      
      if (user.status === 'Rejected') {
        toast.error('Your registration was rejected. Please contact administration.');
        return;
      }

      login(user, token);
      toast.success('Welcome Back!');
      handleRouteRedirect(user.role);

    } catch (error) {
      toast.error(error.response?.data?.message || 'Invalid email or password');
    }
  };

  const handleGoogleSuccess = async () => {
    setIsGoogleLoading(true);
    try {
      const response = await axios.post('http://localhost:5000/api/v1/auth/mock-login', {
        role: 'Subject Teacher',
        email: 'teacher@college.edu'
      });

      if (response.data.data && response.data.data.isFirstTimeSetup) {
        setSetupData(response.data.data);
        setShowSetupForm(true);
      } else {
        const { user, token } = response.data.data;
        login(user, token);
        toast.success('Successfully logged in with Google!');
        handleRouteRedirect(user.role);
      }
    } catch (error) {
      toast.error('Google Login failed. Please try again.');
      console.error(error);
    } finally {
      setIsGoogleLoading(false);
    }
  };

  const handleSetupSubmit = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const data = {
      name: formData.get('name'),
      email: setupData.email,
      phone: formData.get('phone'),
      role: formData.get('role'),
      departmentId: formData.get('departmentId') || null,
      subject: formData.get('subject') || null,
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

  return (
    <div className="min-h-screen bg-background flex flex-col md:flex-row font-sans overflow-hidden relative transition-colors duration-300">
      
      {/* Background Animated Orbs for the whole page */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/20 rounded-full blur-[120px] mix-blend-multiply animate-pulse-glow" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-secondary/20 rounded-full blur-[120px] mix-blend-multiply animate-pulse-glow" style={{ animationDelay: '1s' }} />

      {/* Left side - Branding & Features */}
      <motion.div 
        initial={{ opacity: 0, x: -50 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="w-full md:w-1/2 bg-gradient-to-br from-primary to-secondary p-8 md:p-12 lg:p-24 flex flex-col justify-between text-white relative z-10 shadow-2xl"
      >
        
        {/* Floating Geometric Shapes */}
        <div className="absolute top-20 right-20 w-32 h-32 bg-white/10 rounded-3xl backdrop-blur-md border border-white/20 rotate-12 animate-[float_8s_ease-in-out_infinite]" />
        <div className="absolute bottom-40 left-10 w-24 h-24 bg-white/10 rounded-full backdrop-blur-md border border-white/20 animate-[float_6s_ease-in-out_infinite]" style={{ animationDelay: '2s' }} />
        <div className="absolute top-1/2 right-10 w-16 h-16 bg-white/10 rounded-xl backdrop-blur-md border border-white/20 rotate-45 animate-[float_7s_ease-in-out_infinite]" style={{ animationDelay: '1s' }} />

        <div className="relative z-10">
          <motion.div 
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.5 }}
            className="flex items-center gap-3 mb-12"
          >
            <div className="w-12 h-12 bg-white/20 backdrop-blur-md rounded-xl flex items-center justify-center shadow-lg border border-white/30">
              <QrCode className="text-white w-8 h-8" />
            </div>
            <span className="text-2xl font-bold tracking-tight text-white drop-shadow-md">QR Attend</span>
          </motion.div>
          
          <motion.h1 
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.3, duration: 0.5 }}
            className="text-4xl md:text-5xl font-extrabold leading-tight mb-6 drop-shadow-sm"
          >
            Modernize your institution's attendance tracking.
          </motion.h1>
          
          <motion.p 
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.4, duration: 0.5 }}
            className="text-white/80 text-lg mb-12 max-w-md font-medium"
          >
            A secure, fast, and reliable QR-based attendance management system for students, teachers, and administrators.
          </motion.p>

          <motion.div 
            variants={containerVariants}
            initial="hidden"
            animate="show"
            className="space-y-6"
          >
            <motion.div variants={itemVariants} className="flex items-center gap-4 group">
              <div className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center backdrop-blur-md border border-white/20 group-hover:bg-white/20 transition-colors">
                <Zap className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="font-semibold text-white text-lg">Lightning Fast</h3>
                <p className="text-sm text-white/70">Scan and record attendance instantly</p>
              </div>
            </motion.div>
            <motion.div variants={itemVariants} className="flex items-center gap-4 group">
              <div className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center backdrop-blur-md border border-white/20 group-hover:bg-white/20 transition-colors">
                <ShieldCheck className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="font-semibold text-white text-lg">Secure & Anti-Fraud</h3>
                <p className="text-sm text-white/70">Dynamic QR codes with short expiry</p>
              </div>
            </motion.div>
            <motion.div variants={itemVariants} className="flex items-center gap-4 group">
              <div className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center backdrop-blur-md border border-white/20 group-hover:bg-white/20 transition-colors">
                <Clock className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="font-semibold text-white text-lg">Real-time Analytics</h3>
                <p className="text-sm text-white/70">Instant reports and dashboards</p>
              </div>
            </motion.div>
          </motion.div>
        </div>
        
        <div className="mt-12 text-sm text-white/50 relative z-10">
          © {new Date().getFullYear()} QR Attend System. All rights reserved.
        </div>
      </motion.div>

      {/* Right side - Login Form */}
      <div className="w-full md:w-1/2 flex items-center justify-center p-6 sm:p-8 bg-transparent relative z-10">
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="max-w-md w-full"
        >
          
          <div className="card">
            {showSetupForm ? (
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
                      defaultValue={setupData?.name || ''} 
                      required 
                      className="input bg-background/50 focus:bg-background text-textPrimary border-border" 
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-textPrimary mb-1.5">Email ID</label>
                    <input 
                      type="email" 
                      value={setupData?.email || ''} 
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
                    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}>
                      <label className="block text-sm font-semibold text-textPrimary mb-1.5">Department</label>
                      <select 
                        name="departmentId" 
                        required 
                        className="input bg-background/50 focus:bg-background text-textPrimary border-border"
                      >
                        <option value="">Select Department</option>
                        {MASTER_DEPARTMENTS.map(dept => (
                          <option key={dept.id} value={dept.id}>{dept.name} ({dept.abbr})</option>
                        ))}
                      </select>
                    </motion.div>
                  )}

                  {selectedRole === 'Subject Teacher' && (
                    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}>
                      <label className="block text-sm font-semibold text-textPrimary mb-1.5">Subject</label>
                      <select 
                        name="subject" 
                        required 
                        className="input bg-background/50 focus:bg-background text-textPrimary border-border"
                      >
                        <option value="">Select Subject</option>
                        {PREDEFINED_SUBJECTS.map(sub => (
                          <option key={sub.id} value={sub.name}>{sub.name}</option>
                        ))}
                      </select>
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
                    onClick={() => setShowSetupForm(false)}
                    className="w-full py-2 text-sm text-textSecondary font-medium hover:text-textPrimary transition-colors"
                  >
                    Cancel
                  </button>
                </form>
              </div>
            ) : (
              <>
            <div className="text-center mb-8">
              <h2 className="text-3xl font-extrabold text-textPrimary mb-2 tracking-tight">Welcome Back</h2>
              <p className="text-textSecondary font-medium">Please sign in to your account</p>
            </div>

            <motion.form 
              variants={containerVariants}
              initial="hidden"
              animate="show"
              onSubmit={handleSubmit(onSubmit)} 
              className="space-y-5"
            >
              {/* Email / Username Field */}
              <motion.div variants={itemVariants}>
                <label className="block text-sm font-semibold text-textPrimary mb-1.5">Email / Register Number</label>
                <input 
                  type="text" 
                  {...register('username', { required: 'Email or Register Number is required' })}
                  className={`input bg-background/50 focus:bg-background text-textPrimary border-border ${errors.username ? 'border-danger focus:ring-danger/20 focus:border-danger' : ''}`}
                  placeholder="admin@gmail.com or CS2026001"
                />
                {errors.username && <p className="text-danger text-xs mt-1.5">{errors.username.message}</p>}
              </motion.div>

              {/* Password Field */}
              <motion.div variants={itemVariants}>
                <label className="block text-sm font-semibold text-textPrimary mb-1.5">Password</label>
                <div className="relative">
                  <input 
                    type={showPassword ? "text" : "password"} 
                    {...register('password', { required: 'Password is required' })}
                    className={`input pr-10 bg-background/50 focus:bg-background text-textPrimary border-border ${errors.password ? 'border-danger focus:ring-danger/20 focus:border-danger' : ''}`}
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-textSecondary hover:text-textPrimary focus:outline-none transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
                {errors.password && <p className="text-danger text-xs mt-1.5">{errors.password.message}</p>}
              </motion.div>

              {/* Remember Me & Forgot Password */}
              <motion.div variants={itemVariants} className="flex items-center justify-between">
                <div className="flex items-center">
                  <input
                    id="remember-me"
                    type="checkbox"
                    {...register('rememberMe')}
                    className="h-4 w-4 text-primary focus:ring-primary border-border rounded cursor-pointer bg-background"
                  />
                  <label htmlFor="remember-me" className="ml-2 block text-sm font-medium text-textSecondary cursor-pointer">
                    Remember me
                  </label>
                </div>

                <div className="text-sm">
                  <a href="#" className="font-semibold text-primary hover:text-primary/80 transition-colors">
                    Forgot password?
                  </a>
                </div>
              </motion.div>

              {/* Login Button */}
              <motion.div variants={itemVariants}>
                <button 
                  type="submit" 
                  disabled={isSubmitting}
                  className="w-full btn-primary py-3 flex justify-center items-center gap-2 text-base shadow-lg shadow-primary/30 mt-4 hover:shadow-primary/40 hover:-translate-y-0.5 transition-all text-white"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Signing in...
                    </>
                  ) : (
                    'Login to Dashboard'
                  )}
                </button>
              </motion.div>
            </motion.form>

            {/* Divider */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6 }}
              className="mt-8 mb-6 relative"
            >
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-border"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-4 bg-card text-textSecondary font-semibold tracking-wide uppercase">Or continue with</span>
              </div>
            </motion.div>

            {/* Google Login */}
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7 }}
              className="flex flex-col items-center mt-6"
            >
              {isGoogleLoading ? (
                <div className="py-2"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>
              ) : (
                <button
                  type="button"
                  onClick={() => handleGoogleSuccess()}
                  className="w-full flex items-center justify-center gap-3 bg-card border border-border text-textPrimary font-semibold py-2.5 px-4 rounded-xl hover:bg-black/5 dark:hover:bg-white/5 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary/20 transition-all shadow-sm hover:shadow-md"
                >
                  <svg className="w-5 h-5" viewBox="0 0 24 24">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                  </svg>
                  Google
                </button>
              )}
            </motion.div>

            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.8 }}
              className="mt-8 text-center text-sm"
            >
              <span className="text-textSecondary font-medium">Don't have an account? </span>
              <button 
                onClick={() => navigate('/register')}
                className="font-bold text-primary hover:text-secondary transition-colors"
              >
                Register Here
              </button>
            </motion.div>
            </>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default Login;
