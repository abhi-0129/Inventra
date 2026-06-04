import { useState } from 'react';
import { FileBarChart, Download, FileSpreadsheet, FileText, Loader2 } from 'lucide-react';
import { reportApi } from '../services/api';
import toast from 'react-hot-toast';

export default function ReportsPage() {
  const [loading, setLoading] = useState<string | null>(null);

  const download = async (type: string, fn: () => Promise<any>, filename: string) => {
    setLoading(type);
    const t = toast.loading('Generating report...');
    try {
      const res = await fn();
      const url = URL.createObjectURL(new Blob([res.data]));
      const a = document.createElement('a'); a.href = url; a.download = filename; a.click();
      URL.revokeObjectURL(url);
      toast.success('Report downloaded!', { id: t });
    } catch { toast.error('Export failed.', { id: t }); }
    setLoading(null);
  };

  const reports = [
    {
      id: 'inv-pdf',
      title: 'Inventory Report (PDF)',
      description: 'Complete product listing with stock levels, prices, and status.',
      icon: FileText,
      color: 'text-red-400',
      bg: 'bg-red-500/10',
      action: () => download('inv-pdf', reportApi.exportInventoryPDF, `inventory-${Date.now()}.pdf`),
    },
    {
      id: 'inv-excel',
      title: 'Inventory Report (Excel)',
      description: 'Full inventory data with summary sheet. Ready for analysis.',
      icon: FileSpreadsheet,
      color: 'text-green-400',
      bg: 'bg-green-500/10',
      action: () => download('inv-excel', reportApi.exportInventoryExcel, `inventory-${Date.now()}.xlsx`),
    },
    {
      id: 'tx-pdf',
      title: 'Transaction Report (PDF)',
      description: 'All stock movement history — purchases, sales, adjustments.',
      icon: FileText,
      color: 'text-blue-400',
      bg: 'bg-blue-500/10',
      action: () => download('tx-pdf', reportApi.exportTransactionsPDF, `transactions-${Date.now()}.pdf`),
    },
  ];

  return (
    <div className="space-y-5">
      <div className="page-header">
        <div>
          <h1 className="page-title">Reports</h1>
          <p className="page-subtitle">Export your inventory data</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {reports.map(({ id, title, description, icon: Icon, color, bg, action }) => (
          <div key={id} className="card-hover p-6 flex flex-col gap-4">
            <div className={`w-12 h-12 rounded-xl ${bg} flex items-center justify-center`}>
              <Icon className={`w-6 h-6 ${color}`} />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-slate-200 mb-1">{title}</h3>
              <p className="text-sm text-slate-500">{description}</p>
            </div>
            <button
              onClick={action}
              disabled={loading === id}
              className="btn-primary justify-center w-full"
            >
              {loading === id ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Download className="w-4 h-4" /> Download</>}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
