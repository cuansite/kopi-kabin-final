import React, { useState } from 'react';
import { useKurir } from '../../context/KurirContext';
import { Plus, Minus, Send, Package, AlertCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface RequestItem {
  inventoryId: string;
  name: string;
  quantity: number;
}

export const NewRequest = () => {
  const navigate = useNavigate();
  const { inventory, loadingInventory, submitRequest } = useKurir();

  const [requestedItems, setRequestedItems] = useState<RequestItem[]>([]);
  const [note, setNote] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleUpdateQuantity = (item: typeof inventory[number], delta: number) => {
    setRequestedItems(prev => {
      const existing = prev.find(p => p.inventoryId === item.id);
      if (existing) {
        const newQuantity = Math.max(0, existing.quantity + delta);
        if (newQuantity === 0) return prev.filter(p => p.inventoryId !== item.id);
        return prev.map(p => p.inventoryId === item.id ? { ...p, quantity: newQuantity } : p);
      } else if (delta > 0) {
        return [...prev, { inventoryId: item.id, name: item.name, quantity: delta }];
      }
      return prev;
    });
  };

  const getQuantity = (id: string) => requestedItems.find(p => p.inventoryId === id)?.quantity || 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (requestedItems.length === 0) return;
    setIsSubmitting(true);
    setError('');
    try {
      await submitRequest(requestedItems, note.trim());
      navigate('/kurir/history');
    } catch (err: any) {
      setError(err?.message ?? 'Failed to submit request. Please try again.');
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col gap-4 max-w-lg mx-auto w-full">
      <div className="bg-[#003B73] text-white border-[4px] border-black p-4 shadow-[4px_4px_0px_#FDC500]">
        <h2 className="font-black text-xl uppercase mb-1">New Restock Request</h2>
        <p className="font-mono text-xs opacity-80">Select items to request from central inventory.</p>
      </div>

      {error && (
        <div className="bg-red-100 border-[3px] border-red-500 text-red-700 p-3 flex items-start gap-3">
          <AlertCircle className="shrink-0 mt-0.5" size={18} />
          <p className="font-mono text-sm font-bold">{error}</p>
        </div>
      )}

      {loadingInventory ? (
        <div className="bg-white border-[4px] border-black p-8 text-center font-mono font-bold">
          Loading inventory...
        </div>
      ) : inventory.length === 0 ? (
        <div className="bg-white border-[4px] border-black p-8 text-center shadow-[4px_4px_0px_#FDC500]">
          <Package className="mx-auto mb-4 text-gray-400" size={48} />
          <h3 className="font-black text-xl mb-2 text-[#003B73]">No Inventory Available</h3>
          <p className="font-mono text-sm text-gray-500">Contact admin to add items to the central inventory.</p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="bg-white border-[4px] border-black shadow-[4px_4px_0px_#FDC500] overflow-hidden">
            {inventory.map((item, index) => (
              <div key={item.id} className={`p-4 flex items-center justify-between gap-3 ${index !== inventory.length - 1 ? 'border-b-[2px] border-gray-200' : ''}`}>
                <div className="min-w-0">
                  <h4 className="font-bold text-[#003B73]">{item.name}</h4>
                  <p className="font-mono text-[10px] text-gray-500">Central Stock: {item.stock_level}</p>
                </div>

                <div className="flex items-center gap-2 sm:gap-3 shrink-0">
                  <button
                    type="button"
                    onClick={() => handleUpdateQuantity(item, -1)}
                    disabled={getQuantity(item.id) === 0}
                    className="w-10 h-10 flex items-center justify-center border-[2px] border-black bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-200 transition-colors"
                  >
                    <Minus size={16} />
                  </button>
                  <span className="font-mono font-bold w-6 text-center">
                    {getQuantity(item.id)}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleUpdateQuantity(item, 1)}
                    className="w-10 h-10 flex items-center justify-center border-[2px] border-black bg-[#FDC500] hover:bg-[#e5b200] transition-colors"
                  >
                    <Plus size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div className="bg-white border-[4px] border-black p-4 shadow-[4px_4px_0px_#FDC500]">
            <label className="block font-black uppercase text-sm mb-2 text-[#003B73]">Additional Notes (Optional)</label>
            <textarea
              value={note}
              onChange={e => setNote(e.target.value)}
              className="w-full border-[3px] border-black p-3 font-mono text-sm min-h-[100px] outline-none focus:border-[#003B73]"
              placeholder="e.g. Urgent restock needed for event..."
            />
          </div>

          <button
            type="submit"
            disabled={requestedItems.length === 0 || isSubmitting}
            className="w-full bg-[#003B73] text-[#FDC500] font-black py-4 uppercase tracking-widest border-[4px] border-black hover:bg-black hover:text-[#FDC500] transition-colors flex items-center justify-center gap-2 shadow-[4px_4px_0px_#FDC500] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-[#003B73]"
          >
            {isSubmitting ? 'Submitting...' : (
              <>
                <Send size={20} /> Submit Request
              </>
            )}
          </button>
        </form>
      )}
    </div>
  );
};
