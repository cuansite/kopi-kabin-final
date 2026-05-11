import React, { useState, useEffect } from 'react';
import { handleFirestoreError, OperationType } from '../../utils/firestoreErrorHandler';
import { apiRequest } from '../../services/api';
import { Clock, CheckCircle, XCircle, Package } from 'lucide-react';

interface RequestRecord {
  id: string;
  kurir_id: string;
  kurir_name: string;
  items: { inventoryId: string; name: string; quantity: number }[];
  status: 'pending' | 'approved' | 'rejected';
  note: string;
  created_at: string;
}

const STATUS_CONFIG = {
  pending:  { label: 'Pending',  icon: <Clock size={14} />,       cls: 'bg-yellow-100 text-yellow-700 border-yellow-400' },
  approved: { label: 'Approved', icon: <CheckCircle size={14} />, cls: 'bg-green-100 text-green-700 border-green-400' },
  rejected: { label: 'Rejected', icon: <XCircle size={14} />,     cls: 'bg-red-100 text-red-600 border-red-400' },
};

export const RequestManagement = () => {
  const [requests, setRequests] = useState<RequestRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');

  const load = async () => {
    try {
      setRequests(await apiRequest<RequestRecord[]>('/api/requests'));
    } catch (error) {
      handleFirestoreError(error, OperationType.LIST, 'requests');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const handleApprove = async (req: RequestRecord) => {
    if (processing) return;
    setProcessing(req.id);
    try {
      const updated = await apiRequest<RequestRecord>(`/api/requests/${req.id}/approve`, { method: 'POST' });
      setRequests(prev => prev.map(r => r.id === updated.id ? updated : r));
    } catch (e) {
      handleFirestoreError(e, OperationType.UPDATE, `requests/${req.id}`);
      alert(e instanceof Error ? e.message : 'Failed to approve request');
    } finally {
      setProcessing(null);
    }
  };

  const handleReject = async (req: RequestRecord) => {
    if (processing) return;
    if (!window.confirm('Reject this request?')) return;
    setProcessing(req.id);
    try {
      const updated = await apiRequest<RequestRecord>(`/api/requests/${req.id}/reject`, { method: 'POST' });
      setRequests(prev => prev.map(r => r.id === updated.id ? updated : r));
    } catch (e) {
      handleFirestoreError(e, OperationType.UPDATE, `requests/${req.id}`);
      alert('Failed to reject request');
    } finally {
      setProcessing(null);
    }
  };

  const filtered = filter === 'all' ? requests : requests.filter(r => r.status === filter);
  const pendingCount = requests.filter(r => r.status === 'pending').length;

  if (loading) return <div className="p-8 font-mono font-bold text-center">Loading requests...</div>;

  return (
    <div className="max-w-4xl mx-auto flex flex-col gap-6">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-black uppercase text-[#003B73]">Request Management</h2>
          <p className="font-mono text-sm text-gray-600 mt-1">
            Kurir restock requests - approve to transfer central stock to courier stock.
          </p>
        </div>
        {pendingCount > 0 && (
          <span className="bg-[#FDC500] border-[3px] border-black px-4 py-2 font-black text-[#003B73] uppercase text-sm">
            {pendingCount} Pending
          </span>
        )}
      </div>

      <div className="flex gap-2 flex-wrap">
        {(['all', 'pending', 'approved', 'rejected'] as const).map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-2 border-[2px] border-black font-bold uppercase text-sm transition-colors ${filter === f ? 'bg-[#003B73] text-white' : 'bg-white hover:bg-gray-100'}`}
          >
            {f}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="bg-white border-[4px] border-black p-8 sm:p-12 text-center shadow-[8px_8px_0px_#FDC500]">
          <Package className="mx-auto mb-4 text-gray-400" size={48} />
          <h3 className="font-black text-xl text-[#003B73]">No Requests</h3>
          <p className="font-mono text-sm text-gray-500 mt-1">No {filter !== 'all' ? filter : ''} requests found.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {filtered.map(req => {
            const cfg = STATUS_CONFIG[req.status] ?? STATUS_CONFIG.pending;
            const isProcessing = processing === req.id;
            return (
              <div key={req.id} className="bg-white border-[4px] border-black p-4 shadow-[6px_6px_0px_#003B73]">
                <div className="flex flex-col md:flex-row md:items-start justify-between gap-3 mb-4">
                  <div className="min-w-0">
                    <p className="font-black text-lg text-[#003B73] break-words">{req.kurir_name}</p>
                    <p className="font-mono text-[10px] text-gray-400">
                      {new Date(req.created_at).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                      {' · '}ID: {req.id.slice(0, 8)}
                    </p>
                  </div>
                  <span className={`self-start flex items-center gap-1 px-2 py-1 border-[2px] font-mono text-xs font-bold uppercase ${cfg.cls}`}>
                    {cfg.icon} {cfg.label}
                  </span>
                </div>

                <div className="border-[2px] border-gray-200 mb-4">
                  <div className="bg-gray-50 px-3 py-1 border-b-[2px] border-gray-200 font-mono text-[10px] font-bold uppercase text-gray-500">
                    Requested Items
                  </div>
                  {(req.items ?? []).map((item, i) => (
                    <div key={i} className="flex justify-between gap-3 px-3 py-2 font-mono text-sm border-b border-dashed border-gray-100 last:border-b-0">
                      <span className="break-words">{item.name}</span>
                      <span className="font-bold shrink-0">x{item.quantity}</span>
                    </div>
                  ))}
                </div>

                {req.note && (
                  <p className="font-mono text-xs text-gray-500 italic mb-4 border-t border-gray-100 pt-2 break-words">
                    Note: {req.note}
                  </p>
                )}

                {req.status === 'pending' && (
                  <div className="flex flex-col sm:flex-row gap-3">
                    <button
                      onClick={() => handleApprove(req)}
                      disabled={isProcessing}
                      className="flex-1 flex items-center justify-center gap-2 py-3 border-[3px] border-black bg-green-500 text-white font-bold uppercase hover:bg-green-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <CheckCircle size={18} />
                      {isProcessing ? 'Processing...' : 'Approve Transfer'}
                    </button>
                    <button
                      onClick={() => handleReject(req)}
                      disabled={isProcessing}
                      className="flex-1 flex items-center justify-center gap-2 py-3 border-[3px] border-black bg-red-100 text-red-700 font-bold uppercase hover:bg-red-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <XCircle size={18} />
                      Reject
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
