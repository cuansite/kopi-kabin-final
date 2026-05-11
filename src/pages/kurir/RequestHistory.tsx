import React from 'react';
import { useKurir } from '../../context/KurirContext';
import { Clock, CheckCircle, XCircle, Package } from 'lucide-react';

const STATUS_CONFIG = {
  pending:  { label: 'Pending',  icon: <Clock size={14} />,       cls: 'bg-yellow-100 text-yellow-700 border-yellow-400' },
  approved: { label: 'Approved', icon: <CheckCircle size={14} />, cls: 'bg-green-100 text-green-700 border-green-400' },
  rejected: { label: 'Rejected', icon: <XCircle size={14} />,     cls: 'bg-red-100 text-red-600 border-red-400' },
};

export const RequestHistory = () => {
  const { requests, loadingRequests } = useKurir();

  if (loadingRequests) return (
    <div className="bg-white border-[4px] border-black p-8 text-center font-mono font-bold">
      Loading requests...
    </div>
  );

  if (requests.length === 0) return (
    <div className="bg-white border-[4px] border-black p-8 text-center shadow-[4px_4px_0px_#FDC500]">
      <Package className="mx-auto mb-4 text-gray-400" size={48} />
      <h3 className="font-black text-xl text-[#003B73]">No Requests Yet</h3>
      <p className="font-mono text-sm text-gray-500 mt-2">Submit a restock request from the Request tab.</p>
    </div>
  );

  return (
    <div className="flex flex-col gap-4 max-w-lg mx-auto w-full">
      <div className="bg-[#003B73] text-white border-[4px] border-black p-4 shadow-[4px_4px_0px_#FDC500]">
        <h2 className="font-black text-xl uppercase">Request History</h2>
        <p className="font-mono text-xs opacity-80">Your restock requests and their status.</p>
      </div>

      {requests.map(req => {
        const cfg = STATUS_CONFIG[req.status] ?? STATUS_CONFIG.pending;
        return (
          <div key={req.id} className="bg-white border-[4px] border-black p-4 shadow-[4px_4px_0px_#003B73]">
            <div className="flex justify-between items-start gap-3 mb-3">
              <div className="min-w-0">
                <p className="font-mono text-[10px] text-gray-400 uppercase">
                  {new Date(req.created_at).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                </p>
                <p className="font-mono text-[10px] text-gray-400">ID: {req.id.slice(0, 8)}</p>
              </div>
              <span className={`flex items-center gap-1 px-2 py-1 border-[2px] font-mono text-xs font-bold uppercase shrink-0 ${cfg.cls}`}>
                {cfg.icon} {cfg.label}
              </span>
            </div>

            <div className="flex flex-col gap-1 mb-3">
              {(req.items ?? []).map((item, i) => (
                <div key={i} className="flex justify-between gap-3 font-mono text-sm border-b border-dashed border-gray-200 py-1">
                  <span className="break-words">{item.name}</span>
                  <span className="font-bold shrink-0">x{item.quantity}</span>
                </div>
              ))}
            </div>

            {req.note && (
              <p className="font-mono text-xs text-gray-500 italic border-t border-gray-100 pt-2 break-words">Note: {req.note}</p>
            )}
          </div>
        );
      })}
    </div>
  );
};
