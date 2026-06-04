import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useMutation } from '@tanstack/react-query';
import { Settings, User, Shield, Loader2, Check } from 'lucide-react';
import { userApi, authApi } from '../services/api';
import { useAuthStore } from '../store/auth.store';
import toast from 'react-hot-toast';

export default function SettingsPage() {
  const { user, setUser } = useAuthStore();
  const [activeTab, setActiveTab] = useState<'profile' | 'security'>('profile');

  const profileForm = useForm({ defaultValues: { name: user?.name, phone: user?.phone || '' } });
  const passwordForm = useForm();

  const profileMutation = useMutation({
    mutationFn: (data: any) => userApi.updateProfile(data),
    onSuccess: (res) => {
      setUser(res.data.data.user);
      toast.success('Profile updated.');
    },
  });

  const otpMutation = useMutation({
    mutationFn: (enable: boolean) => enable ? authApi.setupOTP() : authApi.disableOTP(),
    onSuccess: (_, enable) => {
      toast.success(enable ? '2FA enabled.' : '2FA disabled.');
      if (user) setUser({ ...user, otpEnabled: enable });
    },
  });

  const tabs = [
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'security', label: 'Security', icon: Shield },
  ];

  return (
    <div className="space-y-5 max-w-2xl">
      <div className="page-header">
        <div>
          <h1 className="page-title">Settings</h1>
          <p className="page-subtitle">Manage your account preferences</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2">
        {tabs.map(({ id, label, icon: Icon }) => (
          <button key={id} onClick={() => setActiveTab(id as any)}
            className={`btn text-sm ${activeTab === id ? 'btn-primary' : 'btn-secondary'}`}>
            <Icon className="w-4 h-4" /> {label}
          </button>
        ))}
      </div>

      {activeTab === 'profile' && (
        <div className="card p-6 space-y-5">
          {/* Avatar */}
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-brand-500/20 border border-brand-500/30 flex items-center justify-center text-blue-600 font-bold text-2xl">
              {user?.name?.charAt(0).toUpperCase()}
            </div>
            <div>
              <p className="font-semibold text-gray-800">{user?.name}</p>
              <p className="text-sm text-gray-400">{user?.email}</p>
              <span className="badge-purple mt-1">{user?.role}</span>
            </div>
          </div>

          <form onSubmit={profileForm.handleSubmit(d => profileMutation.mutate(d))} className="space-y-4">
            <div>
              <label className="label">Full Name</label>
              <input className="input" {...profileForm.register('name', { required: true })} />
            </div>
            <div>
              <label className="label">Phone Number</label>
              <input className="input" placeholder="+1 (555) 000-0000" {...profileForm.register('phone')} />
            </div>
            <div>
              <label className="label">Email Address</label>
              <input className="input opacity-50 cursor-not-allowed" value={user?.email || ''} disabled />
              <p className="text-xs text-slate-600 mt-1">Contact admin to change your email</p>
            </div>
            <button type="submit" disabled={profileMutation.isPending} className="btn-primary">
              {profileMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Check className="w-4 h-4" /> Save Changes</>}
            </button>
          </form>
        </div>
      )}

      {activeTab === 'security' && (
        <div className="space-y-4">
          {/* 2FA */}
          <div className="card p-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 className="font-semibold text-gray-800 flex items-center gap-2">
                  <Shield className="w-4 h-4 text-blue-600" /> Two-Factor Authentication
                </h3>
                <p className="text-sm text-gray-400 mt-1">
                  {user?.otpEnabled
                    ? 'OTP via email is currently enabled for your account.'
                    : 'Add an extra layer of security with one-time passwords.'}
                </p>
              </div>
              <button
                onClick={() => otpMutation.mutate(!user?.otpEnabled)}
                disabled={otpMutation.isPending}
                className={user?.otpEnabled ? 'btn-danger shrink-0' : 'btn-primary shrink-0'}
              >
                {otpMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : (user?.otpEnabled ? 'Disable 2FA' : 'Enable 2FA')}
              </button>
            </div>
          </div>

          {/* Password */}
          <div className="card p-6">
            <h3 className="font-semibold text-gray-800 mb-4">Change Password</h3>
            <p className="text-sm text-gray-400 mb-4">Use the forgot password flow to reset your password securely.</p>
            <button onClick={() => { authApi.forgotPassword(user?.email || ''); toast.success('Reset email sent.'); }}
              className="btn-secondary">
              Send Reset Email
            </button>
          </div>

          {/* Session info */}
          <div className="card p-6">
            <h3 className="font-semibold text-gray-800 mb-3">Account Info</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-400">Email verified</span>
                <span className={user?.isEmailVerified ? 'text-green-400' : 'text-yellow-400'}>
                  {user?.isEmailVerified ? '✓ Verified' : 'Pending'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Role</span>
                <span className="text-gray-700 capitalize">{user?.role}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Last login</span>
                <span className="text-gray-700">{user?.lastLogin ? new Date(user.lastLogin).toLocaleString() : 'N/A'}</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}