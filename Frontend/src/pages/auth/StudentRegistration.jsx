import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Loader2, UserPlus, ShieldCheck } from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import toast from 'react-hot-toast';

const StudentRegistration = () => {
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm();
  const navigate = useNavigate();

  const onSubmit = async (data) => {
    try {
      if (data.password !== data.confirmPassword) {
        toast.error('Passwords do not match');
        return;
      }

      // Map the string selects back to integers for the backend
      const payload = {
        name: data.name,
        registerNumber: data.registerNumber,
        email: data.email,
        password: data.password,
        phone: data.phone,
        departmentId: parseInt(data.departmentId), 
        sectionId: parseInt(data.sectionId)
      };

      await axios.post('http://localhost:5000/api/v1/students/register', payload);
      
      toast.success('Registration Submitted Successfully! Awaiting Teacher Approval.');
      navigate('/login');

    } catch (error) {
      toast.error(error.response?.data?.message || 'Registration failed');
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center">
          <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center shadow-lg">
            <UserPlus className="text-primary w-10 h-10" />
          </div>
        </div>
        <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
          Student Registration
        </h2>
        <p className="mt-2 text-center text-sm text-textSecondary">
          Register to access your dashboard and scan QR codes.
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-card py-8 px-4 shadow sm:rounded-2xl sm:px-10 border border-gray-100">
          <form className="space-y-6" onSubmit={handleSubmit(onSubmit)}>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Full Name <span className="text-danger">*</span></label>
              <input
                {...register('name', { required: 'Name is required' })}
                className={`input ${errors.name ? 'border-danger' : ''}`}
                placeholder="John Doe"
              />
              {errors.name && <p className="text-danger text-xs mt-1">{errors.name.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Register Number <span className="text-danger">*</span></label>
              <input
                {...register('registerNumber', { required: 'Register Number is required' })}
                className={`input ${errors.registerNumber ? 'border-danger' : ''}`}
                placeholder="CS2026001"
              />
              {errors.registerNumber && <p className="text-danger text-xs mt-1">{errors.registerNumber.message}</p>}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Department <span className="text-danger">*</span></label>
                <select {...register('departmentId', { required: true })} className="input bg-white">
                  <option value="1">CSE</option>
                  <option value="2">IT</option>
                  <option value="3">ECE</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Section <span className="text-danger">*</span></label>
                <select {...register('sectionId', { required: true })} className="input bg-white">
                  <option value="1">Section A</option>
                  <option value="2">Section B</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Password <span className="text-danger">*</span></label>
              <input
                type="password"
                {...register('password', { required: 'Password is required', minLength: { value: 6, message: 'Must be at least 6 characters' } })}
                className={`input ${errors.password ? 'border-danger' : ''}`}
                placeholder="Create a strong password"
              />
              {errors.password && <p className="text-danger text-xs mt-1">{errors.password.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Confirm Password <span className="text-danger">*</span></label>
              <input
                type="password"
                {...register('confirmPassword', { required: 'Please confirm password' })}
                className={`input ${errors.confirmPassword ? 'border-danger' : ''}`}
                placeholder="Confirm your password"
              />
              {errors.confirmPassword && <p className="text-danger text-xs mt-1">{errors.confirmPassword.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email <span className="text-danger">*</span></label>
              <input
                {...register('email', { required: 'Email is required' })}
                type="email"
                className={`input ${errors.email ? 'border-danger' : ''}`}
                placeholder="student@college.edu"
              />
              {errors.email && <p className="text-danger text-xs mt-1">{errors.email.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Mobile Number (Optional)</label>
              <input
                {...register('phone')}
                className="input"
                placeholder="+1 234 567 8900"
              />
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full btn-primary flex justify-center items-center py-2.5 shadow-sm"
            >
              {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Complete Registration'}
            </button>

            <div className="mt-4 text-center text-sm">
              <span className="text-gray-500">Already registered? </span>
              <Link to="/login" className="font-medium text-primary hover:text-primary/80">
                Log in here
              </Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default StudentRegistration;
