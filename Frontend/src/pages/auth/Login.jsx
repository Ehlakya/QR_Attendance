import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { QrCode, ShieldCheck, Zap, Clock, Eye, EyeOff, Loader2 } from 'lucide-react';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import axios from 'axios';

const Login = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

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
        // Admin Login
        endpoint = 'http://localhost:5000/api/v1/auth/admin-login';
        payload = { email: cleanUsername, password: cleanPassword };
      } else {
        // Student Login
        endpoint = 'http://localhost:5000/api/v1/auth/student-login';
        payload = { registerNumber: cleanUsername, password: cleanPassword };
      }

      const response = await axios.post(endpoint, payload);

      const { user, token } = response.data.data;
      
      // If student is pending, we can block them here, or let them in to a pending screen
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

  const handleGoogleSuccess = async (credentialResponse) => {
    setIsGoogleLoading(true);
    try {
      // Since Google OAuth isn't fully configured yet on the backend for all edge cases
      const response = await axios.post('http://localhost:5000/api/v1/auth/mock-login', {
        role: 'Subject Teacher'
      });

      const { user, token } = response.data.data;

      login(user, token);
      toast.success('Successfully logged in with Google!');
      handleRouteRedirect(user.role);
      
    } catch (error) {
      toast.error('Google Login failed. Please try again.');
      console.error(error);
    } finally {
      setIsGoogleLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col md:flex-row font-sans">
      {/* Left side - Branding & Features */}
      <div className="w-full md:w-1/2 bg-primary p-8 md:p-12 lg:p-24 flex flex-col justify-between text-white relative overflow-hidden">
        
        {/* Background Decorative Shapes */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-white opacity-5 rounded-full blur-3xl transform translate-x-1/2 -translate-y-1/2"></div>
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-secondary opacity-20 rounded-full blur-3xl transform -translate-x-1/2 translate-y-1/2"></div>

        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-12">
            <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center shadow-lg">
              <QrCode className="text-primary w-8 h-8" />
            </div>
            <span className="text-2xl font-bold tracking-tight">QR Attend</span>
          </div>
          
          <h1 className="text-4xl md:text-5xl font-bold leading-tight mb-6">
            Modernize your institution's attendance tracking.
          </h1>
          <p className="text-primary-100 text-lg mb-12 max-w-md opacity-90">
            A secure, fast, and reliable QR-based attendance management system for students, teachers, and administrators.
          </p>

          <div className="space-y-6">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center backdrop-blur-sm border border-white/10">
                <Zap className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-semibold text-white">Lightning Fast</h3>
                <p className="text-sm text-primary-100">Scan and record attendance instantly</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center backdrop-blur-sm border border-white/10">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-semibold text-white">Secure & Anti-Fraud</h3>
                <p className="text-sm text-primary-100">Dynamic QR codes with short expiry</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center backdrop-blur-sm border border-white/10">
                <Clock className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-semibold text-white">Real-time Analytics</h3>
                <p className="text-sm text-primary-100">Instant reports and dashboards</p>
              </div>
            </div>
          </div>
        </div>
        
        <div className="mt-12 text-sm text-primary-200 relative z-10">
          © {new Date().getFullYear()} QR Attend System. All rights reserved.
        </div>
      </div>

      {/* Right side - Login Form */}
      <div className="w-full md:w-1/2 flex items-center justify-center p-6 sm:p-8 bg-background">
        <div className="max-w-md w-full">
          
          <div className="bg-card rounded-2xl shadow-xl border border-gray-100 p-8 sm:p-10">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold text-gray-900 mb-2">Welcome Back</h2>
              <p className="text-textSecondary">Please sign in to your account</p>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
              {/* Email / Username Field */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Email / Register Number</label>
                <input 
                  type="text" 
                  {...register('username', { 
                    required: 'Email or Register Number is required'
                  })}
                  className={`input ${errors.username ? 'border-danger focus:ring-danger/20 focus:border-danger' : ''}`}
                  placeholder="admin@gmail.com or CS2026001"
                />
                {errors.username && <p className="text-danger text-xs mt-1.5">{errors.username.message}</p>}
              </div>

              {/* Password Field */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Password</label>
                <div className="relative">
                  <input 
                    type={showPassword ? "text" : "password"} 
                    {...register('password', { required: 'Password is required' })}
                    className={`input pr-10 ${errors.password ? 'border-danger focus:ring-danger/20 focus:border-danger' : ''}`}
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 focus:outline-none"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
                {errors.password && <p className="text-danger text-xs mt-1.5">{errors.password.message}</p>}
              </div>

              {/* Remember Me & Forgot Password */}
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <input
                    id="remember-me"
                    type="checkbox"
                    {...register('rememberMe')}
                    className="h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded cursor-pointer"
                  />
                  <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-600 cursor-pointer">
                    Remember me
                  </label>
                </div>

                <div className="text-sm">
                  <a href="#" className="font-medium text-primary hover:text-primary/80 transition-colors">
                    Forgot your password?
                  </a>
                </div>
              </div>

              {/* Login Button */}
              <button 
                type="submit" 
                disabled={isSubmitting}
                className="w-full btn-primary py-2.5 flex justify-center items-center gap-2 text-base shadow-sm mt-2"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Signing in...
                  </>
                ) : (
                  'Login'
                )}
              </button>
            </form>

            {/* Divider */}
            <div className="mt-8 mb-6 relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-200"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-4 bg-card text-gray-400 font-medium tracking-wide uppercase">OR</span>
              </div>
            </div>

            {/* Google Login */}
            <div className="flex flex-col items-center mt-6">
              {isGoogleLoading ? (
                <div className="py-2"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>
              ) : (
                <button
                  type="button"
                  onClick={() => handleGoogleSuccess()}
                  className="w-full flex items-center justify-center gap-3 bg-white border border-gray-300 text-gray-700 font-medium py-2.5 px-4 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-200 transition-colors"
                >
                  <svg className="w-5 h-5" viewBox="0 0 24 24">
                    <path
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                      fill="#4285F4"
                    />
                    <path
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                      fill="#34A853"
                    />
                    <path
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                      fill="#FBBC05"
                    />
                    <path
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                      fill="#EA4335"
                    />
                  </svg>
                  Continue with Google
                </button>
              )}
            </div>

            <div className="mt-8 text-center text-sm">
              <span className="text-gray-500">Don't have an account? </span>
              <button 
                onClick={() => navigate('/register')}
                className="font-medium text-primary hover:text-primary/80 transition-colors"
              >
                Register Here
              </button>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
