import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeftRight, Loader2, Filter } from 'lucide-react';
import { transactionApi } from '../services/api';
import { format } from 'date-fns';

const TYPE_BADGES: Record<string, string> = {
  purchase: 'badge-green', sale: 'badge-blue', adjustment: 'badge-yellow',
  damaged: 'badge-red', expired: 'badge-red', return: 'badge-purple', transfer: 'badge-slate',
};

export default function TransactionsPage() {
  const [page, setPage] = useState(1);
  const [typeFilter, setTypeFilter] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['transactions', { page, type: typeFilter, startDate, endDate }],
    queryFn: () => transactionApi.getAll({
      page, limit: 25,
      type: typeFilter || undefined,
      startDate: startDate || undefined,
      endDate: endDate || undefined,
    }),
  });

  const transactions = data?.data?.data?.transactions || [];
  const total = data?.data?.data?.total || 0;
  const pages = data?.data?.data?.pages || 1;

  return (
    <div className="space-y-5">
      <div className="page-header">
        <div>
          <h1 className="page-title">Transactions</h1>
          <p className="page-subtitle">{total} total records</p>
        </div>
      </div>

      {/* Filters */}
      <div className="card p-4 flex flex-wrap gap-3 items-center">
        <Filter className="w-4 h-4 text-gray-400" />
        <select value={typeFilter} onChange={e => { setTypeFilter(e.target.value); setPage(1); }} className="input h-9 text-sm w-36">
          <option value="">All Types</option>
          {['purchase','sale','adjustment','return','damaged','expired','transfer'].map(t => (
            <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>
          ))}
        </select>
        <input type="date" value={startDate} onChange={e => { setStartDate(e.target.value); setPage(1); }} className="input h-9 text-sm w-36" />
        <span className="text-gray-400 text-sm">to</span>
        <input type="date" value={endDate} onChange={e => { setEndDate(e.target.value); setPage(1); }} className="input h-9 text-sm w-36" />
        {(typeFilter || startDate || endDate) && (
          <button onClick={() => { setTypeFilter(''); setStartDate(''); setEndDate(''); setPage(1); }}
            className="text-xs text-red-400 hover:text-red-300">Clear filters</button>
        )}
      </div>

      <div className="table-wrapper">
        {isLoading ? (
          <div className="flex items-center justify-center h-48">
            <Loader2 className="w-6 h-6 animate-spin text-brand-400" />
          </div>
        ) : transactions.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 text-gray-400 gap-2">
            <ArrowLeftRight className="w-8 h-8" />
            <p className="text-sm">No transactions found</p>
          </div>
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Type</th>
                <th>Product</th>
                <th>SKU</th>
                <th>Before</th>
                <th>Change</th>
                <th>After</th>
                <th>Unit Price</th>
                <th>Total</th>
                <th>Reference</th>
                <th>By</th>
              </tr>
            </thead>
            <tbody>
              {transactions.map((tx: any) => {
                const isDecrease = ['sale','damaged','expired'].includes(tx.type);
                return (
                  <tr key={tx._id}>
                    <td className="text-gray-400 text-xs whitespace-nowrap">
                      {format(new Date(tx.createdAt), 'MMM d, yyyy HH:mm')}
                    </td>
                    <td><span className={TYPE_BADGES[tx.type] || 'badge-slate'}>{tx.type}</span></td>
                    <td className="font-medium text-gray-800 max-w-[160px] truncate">{tx.product?.name || '—'}</td>
                    <td><span className="font-mono text-xs text-gray-500">{tx.product?.sku || '—'}</span></td>
                    <td className="text-gray-500">{tx.quantityBefore}</td>
                    <td className={`font-semibold ${isDecrease ? 'text-red-400' : 'text-green-400'}`}>
                      {isDecrease ? '-' : '+'}{tx.quantity}
                    </td>
                    <td className="text-gray-800 font-medium">{tx.quantityAfter}</td>
                    <td className="text-gray-500">{tx.unitPrice > 0 ? `$${tx.unitPrice.toFixed(2)}` : '—'}</td>
                    <td className="text-gray-800">{tx.totalAmount > 0 ? `$${tx.totalAmount.toFixed(2)}` : '—'}</td>
                    <td className="text-gray-400 text-xs">{tx.reference || '—'}</td>
                    <td className="text-gray-500 text-xs">{tx.performedBy?.name || '—'}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {pages > 1 && (
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-400">Page {page} of {pages}</span>
          <div className="flex gap-2">
            <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="btn-secondary px-3 py-1.5 text-xs">Previous</button>
            <button onClick={() => setPage(p => Math.min(pages, p + 1))} disabled={page === pages} className="btn-secondary px-3 py-1.5 text-xs">Next</button>
          </div>
        </div>
      )}
    </div>
  );
}
