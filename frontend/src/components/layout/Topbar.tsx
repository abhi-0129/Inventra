import { Menu, Bell, Search, ChevronDown } from 'lucide-react';
import { useAuthStore } from '../../store/auth.store';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

interface TopbarProps { onMenuClick: () => void; }

const ROLE_COLORS: Record<string, string> = {
  admin:   'bg-violet-100 text-violet-700',
  manager: 'bg-blue-100 text-blue-700',
  staff:   'bg-emerald-100 text-emerald-700',
  viewer:  'bg-gray-100 text-gray-600',
};

export default function Topbar({ onMenuClick }: TopbarProps) {
  const user = useAuthStore(s => s.user);
  const navigate = useNavigate();
  const [search, setSearch] = useState('');

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (search.trim()) {
      navigate(`/inventory?search=${encodeURIComponent(search)}`);
      setSearch('');
    }
  };

  return (
    <header className="h-16 bg-white border-b border-gray-200 flex items-center gap-4 px-4 lg:px-6 sticky top-0 z-10">

      {/* Mobile menu button */}
      <button onClick={onMenuClick} className="btn-ghost p-2 lg:hidden">
        <Menu className="w-5 h-5" />
      </button>

      {/* Search bar */}
      <form onSubmit={handleSearch} className="flex-1 max-w-sm">
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search products, SKUs..."
            className="w-full bg-gray-50 border border-gray-200 rounded-xl pl-10 pr-4 py-2 text-sm text-gray-700
                       placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-400
                       focus:bg-white transition-all"
          />
        </div>
      </form>

      <div className="flex items-center gap-2 ml-auto">
        {/* Notifications */}
        <button className="relative w-9 h-9 rounded-xl hover:bg-gray-100 flex items-center justify-center transition-colors">
          <Bell className="w-4.5 h-4.5 w-[18px] h-[18px] text-gray-500" />
          <span className="absolute top-2 right-2 w-1.5 h-1.5 bg-violet-500 rounded-full ring-2 ring-white" />
        </button>

        {/* Divider */}
        <div className="w-px h-6 bg-gray-200 mx-1" />

        {/* User info */}
        <button
          onClick={() => navigate('/settings')}
          className="flex items-center gap-2.5 pl-1 pr-3 py-1.5 rounded-xl hover:bg-gray-50 transition-colors"
        >
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center text-white font-bold text-sm shadow-sm">
            {user?.name?.charAt(0).toUpperCase()}
          </div>
          <div className="hidden sm:block text-left">
            <p className="text-sm font-semibold text-gray-800 leading-tight">{user?.name?.split(' ')[0]}</p>
            <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${ROLE_COLORS[user?.role || 'staff']}`}>
              {user?.role?.toUpperCase()}
            </span>
          </div>
          <ChevronDown className="w-3.5 h-3.5 text-gray-400 hidden sm:block" />
        </button>
      </div>
    </header>
  );
}
