import { useForm } from 'react-hook-form';
import { Link, useNavigate } from 'react-router-dom';
import { Package, Loader2, ArrowRight, Eye, EyeOff, Users, Shield, BarChart3 } from 'lucide-react';
import { authApi } from '../services/api';
import { useState } from 'react';
import toast from 'react-hot-toast';

export default function RegisterPage() {
  const { register, handleSubmit, watch, formState: { errors } } = useForm();
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();

  const onSubmit = async (data: any) => {
    setLoading(true);
    try {
      const res = await authApi.register(data);
      const msg = res.data.message || 'Account created!';
      toast.success(msg);
      navigate('/login');
    } catch {}
    setLoading(false);
  };

 const features = [
  {
    icon: BarChart3,
    title: 'Inventory Insights',
    desc: 'Track stock movement and make informed business decisions.'
  },
  {
    icon: Shield,
    title: 'Secure Access',
    desc: 'Your business data is protected with modern security standards.'
  },
  {
    icon: Users,
    title: 'Work Together',
    desc: 'Collaborate with your team and manage operations efficiently.'
  },
];

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
          <p className="text-gray-500 mt-2">
            {`Start managing your inventory, products and business operations from one place.`}
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">

          {/* Form */}
          <div className="lg:col-span-3 card p-8 animate-slide-up">
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div>
                <label className="label">Full Name</label>
                <input className={`input ${errors.name ? 'border-red-400' : ''}`}
                  placeholder="Abhay Sharma"
                  {...register('name', { required: 'Name is required', minLength: { value: 2, message: 'Min 2 characters' } })} />
                {errors.name && <p className="mt-1.5 text-xs text-red-500">⚠ {errors.name.message as string}</p>}
              </div>

              <div>
                <label className="label">Work Email</label>
                <input type="email" className={`input ${errors.email ? 'border-red-400' : ''}`}
                  placeholder="you@company.com"
                  {...register('email', { required: 'Email is required', pattern: { value: /^\S+@\S+\.\S+$/, message: 'Invalid email' } })} />
                {errors.email && <p className="mt-1.5 text-xs text-red-500">⚠ {errors.email.message as string}</p>}
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
               <p className="text-xs font-semibold text-amber-800 mb-1">
               💡 Getting Started
                </p>

           <p className="text-xs text-amber-700 leading-relaxed">
             Create your account to access inventory tracking, product management,
    supplier records, reporting tools and business insights.
  </p>
</div>

              <button type="submit" disabled={loading} className="btn-primary w-full justify-center py-3 text-base mt-2">
                {loading
                  ? <Loader2 className="w-4 h-4 animate-spin" />
                  : <><span>Create Account</span><ArrowRight className="w-4 h-4" /></>
                }
              </button>
            </form>

            <p className="text-center text-sm text-gray-500 mt-5">
              Already have an account?{' '}
              <Link to="/login" className="text-violet-600 hover:text-violet-700 font-semibold">Sign in</Link>
            </p>
          </div>

          {/* Side features */}
          <div className="lg:col-span-2 space-y-4">
            {features.map(({ icon: Icon, title, desc }) => (
              <div key={title} className="card p-5 flex gap-4 items-start animate-slide-up">
                <div className="w-10 h-10 bg-violet-100 rounded-xl flex items-center justify-center shrink-0">
                  <Icon className="w-5 h-5 text-violet-600" />
                </div>
                <div>
                  <p className="font-semibold text-gray-800 text-sm">{title}</p>
                  <p className="text-gray-500 text-xs mt-0.5">{desc}</p>
                </div>
              </div>
            ))}
          <div className="card p-5 bg-gradient-to-br from-violet-600 to-indigo-700 border-0">
  <p className="text-white font-semibold text-sm mb-1">
    📦 Smarter Inventory Management
  </p>

  <p className="text-violet-200 text-xs leading-relaxed">
    Monitor stock levels, manage suppliers, track transactions and
    streamline your daily operations from a single dashboard.
  </p>
</div>
            
          </div>
        </div>
      </div>
    </div>
  );
}
