import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, Package, Tag, Truck, ArrowLeftRight,
  FileBarChart, Sparkles, Users, Settings, LogOut, X, Box,
} from 'lucide-react';
import { useAuthStore } from '../../store/auth.store';
import { authApi } from '../../services/api';
import toast from 'react-hot-toast';

const navItems = [
  { label: 'Dashboard',    icon: LayoutDashboard, path: '/' },
  { label: 'Inventory',    icon: Package,          path: '/inventory' },
  { label: 'Categories',   icon: Tag,              path: '/categories' },
  { label: 'Suppliers',    icon: Truck,            path: '/suppliers' },
  { label: 'Transactions', icon: ArrowLeftRight,   path: '/transactions' },
  { label: 'Reports',      icon: FileBarChart,     path: '/reports' },
  { label: 'AI Assistant', icon: Sparkles,         path: '/ai', badge: 'AI' },
];

const bottomItems = [
  { label: 'Users',    icon: Users,    path: '/users',    roles: ['admin'] },
  { label: 'Settings', icon: Settings, path: '/settings' },
];

const ROLE_COLORS: Record<string, string> = {
  admin:   'bg-violet-100 text-violet-700',
  manager: 'bg-blue-100 text-blue-700',
  staff:   'bg-emerald-100 text-emerald-700',
  viewer:  'bg-gray-100 text-gray-600',
};

interface SidebarProps { onClose: () => void; }

export default function Sidebar({ onClose }: SidebarProps) {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try { await authApi.logout(); } catch {}
    logout();
    toast.success('Logged out successfully.');
    navigate('/login');
  };

  return (
    <div className="h-full bg-white border-r border-gray-200 flex flex-col">

      {/* Logo */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 bg-violet-600 rounded-xl flex items-center justify-center shadow-sm shadow-violet-200">
            <Box className="w-4 h-4 text-white" />
          </div>
          <span className="text-lg font-bold text-gray-900 tracking-tight">Inventra</span>
        </div>
        <button onClick={onClose} className="lg:hidden btn-ghost p-1.5 rounded-lg">
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-0.5">
        <p className="px-3 mb-2 text-[10px] font-bold text-gray-400 uppercase tracking-widest">
          Navigation
        </p>
        {navItems.map(({ label, icon: Icon, path, badge }) => (
          <NavLink
            key={path}
            to={path}
            end={path === '/'}
            onClick={onClose}
            className={({ isActive }) => `sidebar-link group ${isActive ? 'active' : ''}`}
          >
            <Icon className="icon" />
            <span className="flex-1">{label}</span>
            {badge && (
              <span className="text-[9px] font-bold bg-violet-100 text-violet-600 px-1.5 py-0.5 rounded-md">
                {badge}
              </span>
            )}
          </NavLink>
        ))}

        <div className="pt-4 mt-2 border-t border-gray-100">
          <p className="px-3 mb-2 text-[10px] font-bold text-gray-400 uppercase tracking-widest">
            Account
          </p>
          {bottomItems.map(({ label, icon: Icon, path, roles }) => {
            if (roles && !roles.includes(user?.role || '')) return null;
            return (
              <NavLink
                key={path}
                to={path}
                onClick={onClose}
                className={({ isActive }) => `sidebar-link group ${isActive ? 'active' : ''}`}
              >
                <Icon className="icon" />
                <span>{label}</span>
              </NavLink>
            );
          })}
        </div>
      </nav>

      {/* User card */}
      <div className="p-3 border-t border-gray-100">
        <div className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 border border-gray-100 mb-2">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center text-white font-bold text-sm shrink-0 shadow-sm">
            {user?.name?.charAt(0).toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-gray-800 truncate">{user?.name}</p>
            <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md ${ROLE_COLORS[user?.role || 'staff']}`}>
              {user?.role?.toUpperCase()}
            </span>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="sidebar-link w-full text-red-500 hover:text-red-600 hover:bg-red-50"
        >
          <LogOut className="icon" />
          <span>Sign Out</span>
        </button>
      </div>
    </div>
  );
}
