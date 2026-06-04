import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Users, Loader2, ShieldCheck, Crown, UserCheck, Eye, UserCog } from 'lucide-react';
import { userApi } from '../services/api';
import { useAuthStore } from '../store/auth.store';
import toast from 'react-hot-toast';
import { format } from 'date-fns';

const ROLE_CONFIG: Record<string, { label: string; color: string; icon: any; desc: string }> = {
  admin:   { label: 'Admin',   color: 'bg-violet-100 text-violet-700 border-violet-200', icon: Crown,     desc: 'Full access' },
  manager: { label: 'Manager', color: 'bg-blue-100 text-blue-700 border-blue-200',       icon: UserCog,   desc: 'Manage inventory' },
  staff:   { label: 'Staff',   color: 'bg-emerald-100 text-emerald-700 border-emerald-200', icon: UserCheck, desc: 'Adjust stock' },
  viewer:  { label: 'Viewer',  color: 'bg-gray-100 text-gray-600 border-gray-200',       icon: Eye,       desc: 'Read only' },
};

export default function UsersPage() {
  const queryClient = useQueryClient();
  const currentUser = useAuthStore(s => s.user);
  const isAdmin = currentUser?.role === 'admin';

  const { data, isLoading } = useQuery({ queryKey: ['users'], queryFn: () => userApi.getAll() });

  const roleMutation = useMutation({
    mutationFn: ({ id, role }: { id: string; role: string }) => userApi.updateRole(id, role),
    onSuccess: (_, { role }) => {
      toast.success(`Role updated to ${role}.`);
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
  });

  const statusMutation = useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) => userApi.toggleStatus(id, isActive),
    onSuccess: (_, { isActive }) => {
      toast.success(isActive ? 'User activated.' : 'User deactivated.');
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
  });

  const users = data?.data?.data?.users || [];

  // Stats
  const roleCounts = users.reduce((acc: Record<string, number>, u: any) => {
    acc[u.role] = (acc[u.role] || 0) + 1;
    return acc;
  }, {});

  return (
    <div className="space-y-6 animate-fade-in">

      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">User Management</h1>
          <p className="page-subtitle">Manage team members and their access levels</p>
        </div>
        <div className="badge-purple text-sm py-1.5 px-3">
          {users.length} total members
        </div>
      </div>

      {/* Role explanation cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {Object.entries(ROLE_CONFIG).map(([role, { label, color, icon: Icon, desc }]) => (
          <div key={role} className="card p-4 flex items-center gap-3">
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center border ${color}`}>
              <Icon className="w-4 h-4" />
            </div>
            <div>
              <p className="font-bold text-sm text-gray-800">{label}</p>
              <p className="text-xs text-gray-500">{desc}</p>
              <p className="text-xs font-bold text-gray-400 mt-0.5">{roleCounts[role] || 0} users</p>
            </div>
          </div>
        ))}
      </div>

      {/* Users table */}
      {isLoading ? (
        <div className="flex items-center justify-center h-48 card">
          <Loader2 className="w-6 h-6 animate-spin text-violet-500" />
        </div>
      ) : (
        <div className="card overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
            <h3 className="font-bold text-gray-800">Team Members</h3>
            {!isAdmin && (
              <span className="text-xs text-amber-600 bg-amber-50 border border-amber-200 px-3 py-1 rounded-full font-medium">
                ⚠ Only Admins can change roles
              </span>
            )}
          </div>

          <div className="divide-y divide-gray-100">
            {users.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-gray-400 gap-2">
                <Users className="w-10 h-10 opacity-30" />
                <p className="text-sm">No users found</p>
              </div>
            ) : (
              users.map((u: any) => {
                const isYou = u._id === currentUser?._id;
                const cfg = ROLE_CONFIG[u.role] || ROLE_CONFIG.staff;
                const RoleIcon = cfg.icon;

                return (
                  <div key={u._id} className="flex items-center gap-4 px-6 py-4 hover:bg-gray-50 transition-colors">
                    {/* Avatar */}
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center text-white font-bold text-sm shrink-0">
                      {u.name?.charAt(0).toUpperCase()}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-semibold text-gray-800 text-sm">{u.name}</p>
                        {isYou && <span className="text-[10px] bg-violet-100 text-violet-600 font-bold px-1.5 py-0.5 rounded">YOU</span>}
                        {!u.isActive && <span className="text-[10px] bg-red-100 text-red-600 font-bold px-1.5 py-0.5 rounded">INACTIVE</span>}
                      </div>
                      <p className="text-xs text-gray-500 truncate">{u.email}</p>
                      <div className="flex items-center gap-2 mt-1">
                        {u.isEmailVerified
                          ? <span className="text-[10px] text-emerald-600 font-medium">✓ Verified</span>
                          : <span className="text-[10px] text-amber-500 font-medium">⏳ Unverified</span>
                        }
                        {u.otpEnabled && <span className="text-[10px] text-blue-600 font-medium flex items-center gap-0.5"><ShieldCheck className="w-3 h-3" /> 2FA On</span>}
                        <span className="text-[10px] text-gray-400">
                          Joined {u.createdAt && !isNaN(new Date(u.createdAt).getTime())
                            ? format(new Date(u.createdAt), 'MMM d, yyyy')
                            : 'N/A'}
                        </span>
                      </div>
                    </div>

                    {/* Role selector */}
                    <div className="shrink-0">
                      {isAdmin && !isYou ? (
                        <div className="flex items-center gap-2">
                          <select
                            value={u.role}
                            onChange={e => {
                              if (confirm(`Change ${u.name}'s role to ${e.target.value}?`)) {
                                roleMutation.mutate({ id: u._id, role: e.target.value });
                              }
                            }}
                            disabled={roleMutation.isPending}
                            className="text-xs border border-gray-200 rounded-lg px-2.5 py-1.5 bg-white text-gray-700
                                       focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-400
                                       cursor-pointer hover:border-gray-300 transition-colors font-medium"
                          >
                            <option value="admin">👑 Admin</option>
                            <option value="manager">🔧 Manager</option>
                            <option value="staff">👷 Staff</option>
                            <option value="viewer">👀 Viewer</option>
                          </select>
                        </div>
                      ) : (
                        <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-lg border ${cfg.color}`}>
                          <RoleIcon className="w-3 h-3" />
                          {cfg.label}
                        </span>
                      )}
                    </div>

                    {/* Status toggle */}
                    {isAdmin && !isYou && (
                      <button
                        onClick={() => {
                          if (confirm(`${u.isActive ? 'Deactivate' : 'Activate'} ${u.name}?`)) {
                            statusMutation.mutate({ id: u._id, isActive: !u.isActive });
                          }
                        }}
                        disabled={statusMutation.isPending}
                        className={`shrink-0 text-xs font-semibold px-3 py-1.5 rounded-lg border transition-colors ${
                          u.isActive
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                            : 'bg-red-50 text-red-600 border-red-200 hover:bg-red-100'
                        }`}
                      >
                        {u.isActive ? '● Active' : '○ Inactive'}
                      </button>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* Role guide */}
      <div className="card p-6">
        <h3 className="font-bold text-gray-800 mb-4">📋 Role Permissions Guide</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-2 pr-6 text-gray-500 font-semibold text-xs uppercase tracking-wider">Feature</th>
                {['Admin','Manager','Staff','Viewer'].map(r => (
                  <th key={r} className="text-center py-2 px-4 text-gray-500 font-semibold text-xs uppercase tracking-wider">{r}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {[
                ['View Inventory & Dashboard', true, true, true, true],
                ['Adjust Stock (receive/ship)', true, true, true, false],
                ['Add/Edit Products', true, true, false, false],
                ['Manage Categories & Suppliers', true, true, false, false],
                ['Export PDF & Excel Reports', true, true, false, false],
                ['Delete Products', true, false, false, false],
                ['Manage Users & Roles', true, false, false, false],
                ['AI Assistant', true, true, true, true],
              ].map(([feature, ...perms]) => (
                <tr key={feature as string} className="hover:bg-gray-50">
                  <td className="py-2.5 pr-6 text-gray-700 font-medium text-xs">{feature}</td>
                  {perms.map((p, i) => (
                    <td key={i} className="text-center py-2.5 px-4">
                      {p
                        ? <span className="text-emerald-500 font-bold">✓</span>
                        : <span className="text-gray-300 font-bold">—</span>
                      }
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}