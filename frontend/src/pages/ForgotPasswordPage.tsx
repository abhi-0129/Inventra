// ForgotPasswordPage.tsx
import { useForm } from 'react-hook-form';
import { Link } from 'react-router-dom';
import { Box, Loader2 } from 'lucide-react';
import { authApi } from '../services/api';
import { useState } from 'react';
import toast from 'react-hot-toast';

export default function ForgotPasswordPage() {
  const { register, handleSubmit } = useForm();
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const onSubmit = async (data: any) => {
    setLoading(true);
    try {
      await authApi.forgotPassword(data.email);
      setSent(true);
      toast.success('Reset link sent if account exists.');
    } catch {}
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 bg-brand-500 rounded-2xl shadow-glow mb-4">
            <Box className="w-7 h-7 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white">Forgot Password</h1>
        </div>
        <div className="card p-8 animate-slide-up">
          {sent ? (
            <div className="text-center py-4">
              <p className="text-green-400 font-medium mb-2">✓ Reset link sent!</p>
              <p className="text-gray-500 text-sm mb-6">Check your email for a password reset link.</p>
              <Link to="/login" className="btn-primary justify-center">Back to Login</Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <p className="text-gray-500 text-sm mb-4">Enter your email and we'll send you a reset link.</p>
              <div>
                <label className="label">Email Address</label>
                <input type="email" className="input" placeholder="you@company.com" {...register('email', { required: true })} />
              </div>
              <button type="submit" disabled={loading} className="btn-primary w-full justify-center py-2.5">
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Send Reset Link'}
              </button>
              <p className="text-center text-sm"><Link to="/login" className="text-blue-600 hover:text-brand-300">← Back to login</Link></p>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
