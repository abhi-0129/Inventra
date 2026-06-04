import { useQuery } from '@tanstack/react-query';
import {
  Package, Truck, AlertTriangle, DollarSign,
  TrendingUp, BarChart3, Sparkles, ArrowUpRight,
} from 'lucide-react';
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts';
import { dashboardApi } from '../services/api';
import { format, parseISO } from 'date-fns';
import { Link } from 'react-router-dom';

const COLORS = ['#3b82f6','#10b981','#f59e0b','#ef4444','#8b5cf6','#06b6d4','#f97316'];

const TYPE_COLORS: Record<string, string> = {
  purchase: 'badge-green', sale: 'badge-blue', adjustment: 'badge-yellow',
  damaged: 'badge-red', expired: 'badge-red', return: 'badge-purple',
};

function StatCard({ icon: Icon, label, value, sub, iconBg, iconColor }: {
  icon: React.ElementType; label: string; value: string | number;
  sub?: string; iconBg: string; iconColor: string;
}) {
  return (
    <div className="card p-5 flex items-start gap-4 hover:shadow-md transition-shadow duration-200">
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${iconBg}`}>
        <Icon className={`w-5 h-5 ${iconColor}`} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-2xl font-bold text-gray-900 leading-none">{value}</p>
        <p className="text-sm text-gray-500 mt-1">{label}</p>
        {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
      </div>
    </div>
  );
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-gray-200 rounded-xl p-3 shadow-lg text-xs">
      <p className="text-gray-500 font-medium mb-1.5">{label}</p>
      {payload.map((p: any, i: number) => (
        <p key={i} style={{ color: p.color }} className="font-semibold">
          {p.name}: {p.value}
        </p>
      ))}
    </div>
  );
};

export default function DashboardPage() {
  const { data: statsData } = useQuery({ queryKey: ['dashboard-stats'], queryFn: dashboardApi.getStats });
  const { data: trendData }  = useQuery({ queryKey: ['dashboard-trend'], queryFn: () => dashboardApi.getTrend(30) });
  const { data: catData }    = useQuery({ queryKey: ['dashboard-categories'], queryFn: dashboardApi.getCategories });
  const { data: topData }    = useQuery({ queryKey: ['dashboard-top-products'], queryFn: () => dashboardApi.getTopProducts({ limit: 5 }) });

  const stats   = statsData?.data?.data?.stats || {};
  const recent  = statsData?.data?.data?.recentTransactions || [];
  const categories = catData?.data?.data?.distribution || [];
  const topProducts = topData?.data?.data?.topProducts || [];

  const trendChart = (() => {
    const raw: any[] = trendData?.data?.data?.trend || [];
    const byDate: Record<string, any> = {};
    raw.forEach(({ _id, totalQty }) => {
      if (!byDate[_id.date]) byDate[_id.date] = { date: _id.date };
      byDate[_id.date][_id.type] = (byDate[_id.date][_id.type] || 0) + totalQty;
    });
    return Object.values(byDate)
      .sort((a, b) => a.date.localeCompare(b.date))
      .slice(-14)
      .map(d => ({ ...d, date: format(parseISO(d.date), 'MMM d') }));
  })();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-500 text-sm mt-0.5">Welcome back — here's what's happening</p>
        </div>
        <Link to="/ai" className="btn-primary shadow-sm">
          <Sparkles className="w-4 h-4" /> AI Insights
        </Link>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard icon={Package}       label="Total Products"    value={stats.totalProducts ?? 0}
          sub="Active items"  iconBg="bg-blue-50"   iconColor="text-blue-600" />
        <StatCard icon={Truck}         label="Suppliers"         value={stats.totalSuppliers ?? 0}
          sub="Active vendors" iconBg="bg-violet-50" iconColor="text-violet-600" />
        <StatCard icon={AlertTriangle} label="Low Stock Items"   value={stats.lowStockCount ?? 0}
          sub={`${stats.outOfStockCount ?? 0} out of stock`} iconBg="bg-amber-50" iconColor="text-amber-600" />
        <StatCard icon={DollarSign}    label="Inventory Value"
          value={stats.totalCostValue ? ` ₹${(stats.totalCostValue/1000).toFixed(1)}k` : '$0'}
          sub={`Retail  ₹${stats.totalRetailValue ? (stats.totalRetailValue/1000).toFixed(1) : 0}k`}
          iconBg="bg-emerald-50" iconColor="text-emerald-600" />
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
        {/* Area chart */}
        <div className="card p-5 xl:col-span-2">
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-blue-600" />
              <h3 className="font-semibold text-gray-800">Stock Movement</h3>
              <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">Last 30 days</span>
            </div>
          </div>
          {trendChart.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={trendChart}>
                <defs>
                  <linearGradient id="gPurchase" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor="#10b981" stopOpacity={0.15} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="gSale" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor="#3b82f6" stopOpacity={0.15} />
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="date" tick={{ fill: '#9ca3af', fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: '#9ca3af', fontSize: 11 }} axisLine={false} tickLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <Legend wrapperStyle={{ fontSize: 12, paddingTop: 8 }} />
                <Area type="monotone" dataKey="purchase" stroke="#10b981" fill="url(#gPurchase)" strokeWidth={2} name="Purchases" />
                <Area type="monotone" dataKey="sale"     stroke="#3b82f6" fill="url(#gSale)"     strokeWidth={2} name="Sales" />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[220px] flex flex-col items-center justify-center text-gray-300">
              <TrendingUp className="w-10 h-10 mb-2" />
              <p className="text-sm text-gray-400">No movement data yet</p>
              <p className="text-xs text-gray-300 mt-1">Start adding transactions to see trends</p>
            </div>
          )}
        </div>

        {/* Pie chart */}
        <div className="card p-5">
          <div className="flex items-center gap-2 mb-5">
            <BarChart3 className="w-4 h-4 text-blue-600" />
            <h3 className="font-semibold text-gray-800">By Category</h3>
          </div>
          {categories.length > 0 ? (
            <>
              <ResponsiveContainer width="100%" height={150}>
                <PieChart>
                  <Pie data={categories} cx="50%" cy="50%" innerRadius={40} outerRadius={65}
                    paddingAngle={3} dataKey="productCount">
                    {categories.map((_: any, i: number) => (
                      <Cell key={i} fill={COLORS[i % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                </PieChart>
              </ResponsiveContainer>
              <div className="space-y-2 mt-3">
                {categories.slice(0, 5).map((cat: any, i: number) => (
                  <div key={i} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: COLORS[i % COLORS.length] }} />
                      <span className="text-xs text-gray-600 truncate max-w-[110px]">{cat.name}</span>
                    </div>
                    <span className="text-xs font-semibold text-gray-800">{cat.productCount}</span>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="h-[200px] flex flex-col items-center justify-center text-gray-300">
              <BarChart3 className="w-8 h-8 mb-2" />
              <p className="text-sm text-gray-400">No categories yet</p>
            </div>
          )}
        </div>
      </div>

      {/* Bottom row */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
        {/* Top products bar chart */}
        <div className="card p-5">
          <div className="flex items-center justify-between mb-5">
            <h3 className="font-semibold text-gray-800">Top Selling Products</h3>
          </div>
          {topProducts.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={topProducts} layout="vertical" margin={{ left: 0, right: 8 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false} />
                <XAxis type="number" tick={{ fill: '#9ca3af', fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis type="category" dataKey="name" width={110}
                  tick={{ fill: '#6b7280', fontSize: 11 }} axisLine={false} tickLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="totalQuantity" fill="#3b82f6" radius={[0,4,4,0]} name="Units Sold" />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[200px] flex flex-col items-center justify-center text-gray-300">
              <Package className="w-8 h-8 mb-2" />
              <p className="text-sm text-gray-400">No sales data yet</p>
            </div>
          )}
        </div>

        {/* Recent activity */}
        <div className="card p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-800">Recent Activity</h3>
            <Link to="/transactions" className="text-xs text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1">
              View all <ArrowUpRight className="w-3 h-3" />
            </Link>
          </div>
          {recent.length === 0 ? (
            <div className="h-48 flex flex-col items-center justify-center text-gray-300">
              <Package className="w-8 h-8 mb-2" />
              <p className="text-sm text-gray-400">No transactions yet</p>
              <p className="text-xs text-gray-300 mt-1">Adjust stock to see activity here</p>
            </div>
          ) : (
            <div className="space-y-1">
              {recent.slice(0, 8).map((tx: any) => (
                <div key={tx._id} className="flex items-center gap-3 py-2.5 border-b border-gray-50 last:border-0">
                  <span className={`${TYPE_COLORS[tx.type] || 'badge-slate'} flex-shrink-0`}>{tx.type}</span>
                  <span className="text-sm text-gray-700 flex-1 truncate font-medium">{tx.product?.name || '—'}</span>
                  <span className="text-xs text-gray-400 flex-shrink-0">
                    {format(new Date(tx.createdAt), 'MMM d')}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
