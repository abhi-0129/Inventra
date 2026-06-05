import { useForm } from 'react-hook-form';
import { Link, useNavigate } from 'react-router-dom';
import { Package, Loader2, ArrowRight, Eye, EyeOff, Shield, BarChart3, Users, Mail, RefreshCw } from 'lucide-react';
import { authApi } from '../services/api';
import { useState, useRef } from 'react';
import toast from 'react-hot-toast';

export default function RegisterPage() {
  const { register, handleSubmit, watch, formState: { errors } } = useForm();
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();

  // OTP state
  const [step, setStep] = useState<'form' | 'otp'>('form');
  const [otpToken, setOtpToken] = useState('');
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [otpLoading, setOtpLoading] = useState(false);
  const [sendingOtp, setSendingOtp] = useState(false);
  const [formData, setFormData] = useState<any>(null);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  const features = [
    { icon: BarChart3, title: 'Inventory Insights', desc: 'Track stock movement and make informed business decisions.' },
    { icon: Shield,    title: 'Secure Access',       desc: 'Your business data is protected with modern security standards.' },
    { icon: Users,     title: 'Work Together',       desc: 'Collaborate with your team and manage operations efficiently.' },
  ];

  // Step 1: Send OTP
  const onSubmit = async (data: any) => {
    setSendingOtp(true);
    try {
      const res = await authApi.sendEmailOTP(data.email);
      setOtpToken(res.data.otpToken);
      setFormData(data);
      setStep('otp');
      toast.success('OTP sent to your email!');
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to send OTP');
    }
    setSendingOtp(false);
  };

  // Handle OTP input
  const handleOtpChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;
    const newOtp = [...otp];
    newOtp[index] = value.slice(-1);
    setOtp(newOtp);
    if (value && index < 5) inputRefs.current[index + 1]?.focus();
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleOtpPaste = (e: React.ClipboardEvent) => {
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (pasted.length === 6) {
      setOtp(pasted.split(''));
      inputRefs.current[5]?.focus();
    }
  };

  // Step 2: Verify OTP + Register
  const onVerifyOtp = async () => {
    const otpValue = otp.join('');
    if (otpValue.length !== 6) return toast.error('Enter 6-digit OTP');

    setOtpLoading(true);
    try {
      await authApi.register({ ...formData, otp: otpValue, otpToken });
      toast.success('Account created! Please log in.');
      navigate('/login');
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Invalid OTP');
    }
    setOtpLoading(false);
  };

  // Resend OTP
  const resendOtp = async () => {
    setSendingOtp(true);
    try {
      const res = await authApi.sendEmailOTP(formData.email);
      setOtpToken(res.data.otpToken);
      setOtp(['', '', '', '', '', '']);
      toast.success('New OTP sent!');
    } catch {
      toast.error('Failed to resend OTP');
    }
    setSendingOtp(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-violet-50/30 to-blue-50/20 flex items-center justify-center p-6">
      <div className="w-full max-w-4xl">

        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 mb-4">
            <div className="w-10 h-10 bg-violet-600 rounded-xl flex items-center justify-center shadow-lg shadow-violet-200">
              <Package className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold text-gray-900">Inventra</span>
          </div>
          <h1 className="text-3xl font-bold text-gray-900">Create your account</h1>
          <p className="text-gray-500 mt-2">Start managing your inventory, products and business operations from one place.</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">

          {/* STEP 1: Registration Form */}
          {step === 'form' && (
            <div className="lg:col-span-3 card p-8 animate-slide-up">
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">

                <div>
                  <label className="label">Full Name</label>
                  <input className={`input ${errors.name ? 'border-red-400' : ''}`}
                    placeholder="John Doe"
                    {...register('name', { required: 'Name is required', minLength: { value: 2, message: 'Min 2 characters' } })} />
                  {errors.name && <p className="mt-1.5 text-xs text-red-500">⚠ {errors.name.message as string}</p>}
                </div>

                <div>
                  <label className="label">Work Email</label>
                  <input type="email" className={`input ${errors.email ? 'border-red-400' : ''}`}
                    placeholder="you@company.com"
                    {...register('email', { required: 'Email is required', pattern: { value: /^\S+@\S+\.\S+$/, message: 'Invalid email' } })} />
                  {errors.email && <p className="mt-1.5 text-xs text-red-500">⚠ {errors.email.message as string}</p>}
                  <p className="mt-1.5 text-xs text-gray-400">A 6-digit OTP will be sent to verify your email.</p>
                </div>

                <div>
                  <label className="label">Phone (optional)</label>
                  <input className="input" placeholder="+91 98765 43210" {...register('phone')} />
                </div>

                <div>
                  <label className="label">Password</label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      className={`input pr-11 ${errors.password ? 'border-red-400' : ''}`}
                      placeholder="Min 8 characters"
                      {...register('password', {
                        required: 'Password is required',
                        minLength: { value: 8, message: 'Min 8 characters' },
                        pattern: { value: /^(?=.*[A-Z])(?=.*\d)/, message: 'Need at least 1 uppercase & 1 number' }
                      })}
                    />
                    <button type="button" onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  {errors.password && <p className="mt-1.5 text-xs text-red-500">⚠ {errors.password.message as string}</p>}
                </div>

                {/* Role info */}
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-3.5">
                  <p className="text-xs font-semibold text-amber-800 mb-1">🎯 Getting Started</p>
                  <p className="text-xs text-amber-700 leading-relaxed">
                    Create your account to access inventory tracking, product management, supplier records, reporting tools and business insights.
                  </p>
                </div>

                <button type="submit" disabled={sendingOtp}
                  className="btn-primary w-full flex items-center justify-center gap-2 py-3">
                  {sendingOtp ? <Loader2 className="w-4 h-4 animate-spin" /> : <>Send OTP & Continue <ArrowRight className="w-4 h-4" /></>}
                </button>

                <p className="text-center text-sm text-gray-500">
                  Already have an account? <Link to="/login" className="text-violet-600 font-medium hover:underline">Sign in</Link>
                </p>
              </form>
            </div>
          )}

          {/* STEP 2: OTP Verification */}
          {step === 'otp' && (
            <div className="lg:col-span-3 card p-8 animate-slide-up">
              <div className="text-center mb-6">
                <div className="w-14 h-14 bg-violet-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <Mail className="w-7 h-7 text-violet-600" />
                </div>
                <h2 className="text-xl font-bold text-gray-900">Verify your email</h2>
                <p className="text-sm text-gray-500 mt-1">
                  We sent a 6-digit code to <strong>{formData?.email}</strong>
                </p>
              </div>

              {/* 6-digit OTP input */}
              <div className="flex justify-center gap-3 mb-6" onPaste={handleOtpPaste}>
                {otp.map((digit, i) => (
                  <input
                    key={i}
                    ref={el => inputRefs.current[i] = el}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    onChange={e => handleOtpChange(i, e.target.value)}
                    onKeyDown={e => handleOtpKeyDown(i, e)}
                    className="w-12 h-14 text-center text-xl font-bold border-2 border-gray-200 rounded-xl focus:border-violet-500 focus:outline-none transition-colors"
                  />
                ))}
              </div>

              <button
                onClick={onVerifyOtp}
                disabled={otpLoading || otp.join('').length !== 6}
                className="btn-primary w-full flex items-center justify-center gap-2 py-3 mb-3">
                {otpLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <>Verify & Create Account <ArrowRight className="w-4 h-4" /></>}
              </button>

              <div className="flex items-center justify-between text-sm">
                <button onClick={() => setStep('form')} className="text-gray-500 hover:text-gray-700">
                  ← Change email
                </button>
                <button onClick={resendOtp} disabled={sendingOtp}
                  className="flex items-center gap-1 text-violet-600 hover:underline disabled:opacity-50">
                  {sendingOtp ? <Loader2 className="w-3 h-3 animate-spin" /> : <RefreshCw className="w-3 h-3" />}
                  Resend OTP
                </button>
              </div>
            </div>
          )}

          {/* Right panel - features */}
          <div className="lg:col-span-2 space-y-4">
            {features.map(({ icon: Icon, title, desc }) => (
              <div key={title} className="card p-5 flex gap-4 items-start animate-slide-up">
                <div className="w-9 h-9 bg-violet-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Icon className="w-4 h-4 text-violet-600" />
                </div>
                <div>
                  <p className="font-semibold text-gray-900 text-sm">{title}</p>
                  <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">{desc}</p>
                </div>
              </div>
            ))}

            <div className="card p-5 bg-gradient-to-br from-violet-600 to-violet-700 text-white animate-slide-up">
              <p className="font-semibold text-sm mb-1">🚀 Smarter Inventory Management</p>
              <p className="text-xs text-violet-200 leading-relaxed">
                Monitor stock levels, manage suppliers, track transactions and streamline your daily operations from a single dashboard.
              </p>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}