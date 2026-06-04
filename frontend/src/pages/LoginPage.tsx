import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Package, Loader2, ShieldCheck, ArrowRight, Sparkles } from 'lucide-react';
import { authApi } from '../services/api';
import { useAuthStore } from '../store/auth.store';
import toast from 'react-hot-toast';

type LoginForm = { email: string; password: string };
type OTPForm = { otp: string };

export default function LoginPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [otpStep, setOtpStep] = useState(false);
  const [tempToken, setTempToken] = useState('');
  const { setAuth } = useAuthStore();
  const navigate = useNavigate();

  const { register, handleSubmit, formState: { errors } } = useForm<LoginForm>();
  const { register: regOtp, handleSubmit: handleOtp, formState: { errors: otpErrors } } = useForm<OTPForm>();

  const onLogin = async (data: LoginForm) => {
    setLoading(true);
    try {
      const res = await authApi.login(data);
      const { requiresOTP, tempToken: tt, token, refreshToken, data: d } = res.data;
      if (requiresOTP) {
        setTempToken(tt);
        setOtpStep(true);
        toast.success('OTP sent to your email.');
      } else {
        setAuth(d.user, token, refreshToken);
        toast.success(`Welcome back, ${d.user.name.split(' ')[0]}! 👋`);
        navigate('/');
      }
    } catch {}
    setLoading(false);
  };

  const onVerifyOTP = async (data: OTPForm) => {
    setLoading(true);
    try {
      const res = await authApi.verifyOTP({ otp: data.otp, tempToken });
      const { token, refreshToken, data: d } = res.data;
      setAuth(d.user, token, refreshToken);
      toast.success('Verified! Welcome back. 🎉');
      navigate('/');
    } catch {}
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-violet-50/30 to-blue-50/20 flex">

      {/* Left Panel — Branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-violet-600 via-violet-700 to-indigo-800 flex-col justify-between p-12 relative overflow-hidden">
        {/* Background decoration */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-20 -right-20 w-80 h-80 bg-white/5 rounded-full" />
          <div className="absolute bottom-20 -left-10 w-60 h-60 bg-white/5 rounded-full" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-white/3 rounded-full" />
        </div>

        {/* Logo */}
        <div className="relative flex items-center gap-3">
          <div className="w-10 h-10 bg-white/20 backdrop-blur rounded-xl flex items-center justify-center">
            <Package className="w-5 h-5 text-white" />
          </div>
          <span className="text-xl font-bold text-white">Inventra</span>
        </div>

        {/* Main content */}
        <div className="relative space-y-6">
          <div className="inline-flex items-center gap-2 bg-white/15 backdrop-blur-sm text-white/90 text-xs font-medium px-3 py-1.5 rounded-full border border-white/20">
            <Sparkles className="w-3.5 h-3.5" />
            AI-Powered Inventory Management
          </div>
          <h1 className="text-4xl font-bold text-white leading-tight">
            Manage your inventory<br />
            <span className="text-violet-200">smarter, faster.</span>
          </h1>
          <p className="text-violet-200 text-lg leading-relaxed max-w-sm">
            Track stock levels, manage suppliers, and get AI-powered insights — all in one place.
          </p>

          {/* Feature pills */}
          <div className="flex flex-wrap gap-2 pt-2">
            {['Real-time tracking', 'AI insights', 'PDF & Excel export', '2FA Security'].map(f => (
              <span key={f} className="text-xs bg-white/10 text-white/80 px-3 py-1.5 rounded-full border border-white/15">
                ✓ {f}
              </span>
            ))}
          </div>
        </div>

        {/* Bottom quote */}
        <div className="relative bg-white/10 backdrop-blur-sm rounded-2xl p-5 border border-white/15">
          <p className="text-white/80 text-sm italic leading-relaxed">
            "Inventra transformed how we manage our warehouse. Stock-outs reduced by 80%."
          </p>
          <p className="text-violet-300 text-xs mt-2 font-medium">— Warehouse Manager, RetailCo</p>
        </div>
      </div>

      {/* Right Panel — Form */}
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-md">

          {/* Mobile logo */}
          <div className="lg:hidden flex items-center gap-2 mb-8">
            <div className="w-9 h-9 bg-violet-600 rounded-xl flex items-center justify-center">
              <Package className="w-4.5 h-4.5 text-white w-[18px] h-[18px]" />
            </div>
            <span className="text-lg font-bold text-gray-900">Inventra</span>
          </div>

          {!otpStep ? (
            <div className="animate-slide-up">
              <div className="mb-8">
                <h2 className="text-2xl font-bold text-gray-900">Welcome back 👋</h2>
                <p className="text-gray-500 mt-1">Sign in to your Inventra account</p>
              </div>

              <form onSubmit={handleSubmit(onLogin)} className="space-y-4">
                <div>
                  <label className="label">Email address</label>
                  <input
                    type="email"
                    className={`input ${errors.email ? 'border-red-400 focus:border-red-400 focus:ring-red-100' : ''}`}
                    placeholder="you@company.com"
                    {...register('email', { required: 'Email is required' })}
                  />
                  {errors.email && <p className="mt-1.5 text-xs text-red-500 flex items-center gap-1">⚠ {errors.email.message}</p>}
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="label mb-0">Password</label>
                    <Link to="/forgot-password" className="text-xs text-violet-600 hover:text-violet-700 font-medium">
                      Forgot password?
                    </Link>
                  </div>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      className={`input pr-11 ${errors.password ? 'border-red-400' : ''}`}
                      placeholder="Enter your password"
                      {...register('password', { required: 'Password is required' })}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  {errors.password && <p className="mt-1.5 text-xs text-red-500">⚠ {errors.password.message}</p>}
                </div>

                <button type="submit" disabled={loading} className="btn-primary w-full justify-center py-3 mt-2 text-base">
                  {loading
                    ? <Loader2 className="w-4 h-4 animate-spin" />
                    : <><span>Sign In</span><ArrowRight className="w-4 h-4" /></>
                  }
                </button>
              </form>

              <p className="text-center text-sm text-gray-500 mt-5">
                Don't have an account?{' '}
                <Link to="/register" className="text-violet-600 hover:text-violet-700 font-semibold">
                  Create one free
                </Link>
              </p>
            </div>
          ) : (
            <div className="animate-slide-up">
              <div className="mb-8">
                <div className="w-14 h-14 bg-violet-100 rounded-2xl flex items-center justify-center mb-4">
                  <ShieldCheck className="w-7 h-7 text-violet-600" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900">Check your email</h2>
                <p className="text-gray-500 mt-1">We've sent a 6-digit code to verify your identity</p>
              </div>

              <form onSubmit={handleOtp(onVerifyOTP)} className="space-y-4">
                <div>
                  <label className="label">One-Time Password</label>
                  <input
                    type="text"
                    maxLength={6}
                    className={`input font-mono text-center text-3xl tracking-[0.5em] h-16 ${otpErrors.otp ? 'border-red-400' : ''}`}
                    placeholder="······"
                    {...regOtp('otp', { required: 'OTP required', minLength: { value: 6, message: '6 digits required' } })}
                  />
                  {otpErrors.otp && <p className="mt-1.5 text-xs text-red-500">⚠ {otpErrors.otp.message}</p>}
                </div>
                <button type="submit" disabled={loading} className="btn-primary w-full justify-center py-3 text-base">
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <><span>Verify & Sign In</span><ArrowRight className="w-4 h-4" /></>}
                </button>
                <button type="button" onClick={() => setOtpStep(false)} className="btn-ghost w-full justify-center text-sm">
                  ← Back to login
                </button>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
