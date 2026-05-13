import React, { useState } from 'react';
import { useMenu, DEFAULT_MENU } from '../../context/MenuContext';
import { apiRequest } from '../../services/api';
import { Package, Plus, Database, Trash2 } from 'lucide-react';

export const InventoryManagement = () => {
  const { menuItems, loading } = useMenu();
  const [isAdding, setIsAdding] = useState(false);
  const [isSeeding, setIsSeeding] = useState(false);
  const [newItem, setNewItem] = useState({
    id: '', name: '', price: '', cat: 'BEVERAGE', power: '50%', desc: '',
    stockLevel: '0', minStockLevel: '10'
  });

  const handleAddItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItem.name) return;

    try {
      const priceValue = parseInt(newItem.price, 10);
      const stockValue = parseInt(newItem.stockLevel, 10);
      const minStockValue = parseInt(newItem.minStockLevel, 10);
      await apiRequest('/api/inventory', {
        method: 'POST',
        body: JSON.stringify({
        name: newItem.name,
        price: isNaN(priceValue) ? 0 : priceValue,
        cat: newItem.cat,
        power: newItem.power,
        desc: newItem.desc,
        stock_level: isNaN(stockValue) ? 0 : stockValue,
        min_stock_level: isNaN(minStockValue) ? 10 : minStockValue,
        }),
      });
      setIsAdding(false);
      setNewItem({ id: '', name: '', price: '', cat: 'BEVERAGE', power: '50%', desc: '', stockLevel: '0', minStockLevel: '10' });
    } catch (err: any) {
      alert("Gagal menambahkan item:\n" + (err?.message ?? 'Unknown error'));
    }
  };

  const handleDeleteItem = async (id: string, name: string) => {
    if (!window.confirm(`Hapus "${name}" dari inventaris?`)) return;
    try {
      await apiRequest(`/api/inventory/${id}`, { method: 'DELETE' });
    } catch {
      alert('Gagal menghapus item');
    }
  };

  const handleSeed = async () => {
    setIsSeeding(true);
    try {
      await Promise.all(DEFAULT_MENU.map(item =>
        apiRequest('/api/inventory', {
          method: 'POST',
          body: JSON.stringify({
          name: item.name,
          price: parseInt(item.price),
          cat: item.cat,
          power: item.power,
          desc: item.desc,
          stock_level: 100,
          min_stock_level: 20,
          }),
        })
      ));
    } catch (error: any) {
      alert("Gagal mengisi item: " + error?.message);
    } finally {
      setIsSeeding(false);
    }
  };

  if (loading) {
     return <div className="p-8 font-mono font-bold text-center">Memuat Inventaris...</div>;
  }

  return (
    <div className="max-w-6xl mx-auto flex flex-col gap-6">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
         <div>
           <h2 className="text-3xl font-black uppercase text-[#003B73]">Dasbor Inventaris</h2>
           <p className="font-mono text-sm opacity-80 text-gray-600 mt-1">Kelola Item Stok Pusat (Sinkron dengan Aplikasi Mobile & Karousel)</p>
         </div>
         <button
           onClick={() => setIsAdding(!isAdding)}
           className="w-full sm:w-auto justify-center bg-[#FDC500] text-[#003B73] px-6 py-3 font-bold uppercase tracking-wide border-[3px] border-black hover:bg-black hover:text-[#FDC500] transition-colors flex items-center gap-2 shadow-[4px_4px_0px_#003B73]"
         >
           <Plus size={20} /> Tambah Item Baru
         </button>
      </div>

      {isAdding && (
        <form onSubmit={handleAddItem} className="bg-white border-[4px] border-black p-6 shadow-[8px_8px_0px_#FDC500] flex flex-col gap-4">
          <h3 className="font-bold text-lg border-b-[2px] border-gray-200 pb-2">Tambah Item Baru</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label className="block font-mono text-xs font-bold mb-1">Nama</label>
              <input required value={newItem.name} onChange={e => setNewItem({...newItem, name: e.target.value})} className="w-full border-[2px] border-black p-2 font-mono text-sm" placeholder="mis. Cosmic Latte" />
            </div>
            <div>
              <label className="block font-mono text-xs font-bold mb-1">Harga</label>
              <input required type="number" value={newItem.price} onChange={e => setNewItem({...newItem, price: e.target.value})} className="w-full border-[2px] border-black p-2 font-mono text-sm" placeholder="e.g. 25000" />
            </div>
            <div>
              <label className="block font-mono text-xs font-bold mb-1">Kategori</label>
              <input required value={newItem.cat} onChange={e => setNewItem({...newItem, cat: e.target.value})} className="w-full border-[2px] border-black p-2 font-mono text-sm" />
            </div>
            <div>
              <label className="block font-mono text-xs font-bold mb-1">Level Kekuatan</label>
              <input required value={newItem.power} onChange={e => setNewItem({...newItem, power: e.target.value})} className="w-full border-[2px] border-black p-2 font-mono text-sm" placeholder="e.g. 80%" />
            </div>
            <div>
              <label className="block font-mono text-xs font-bold mb-1">Stok Awal</label>
              <input type="number" min="0" required value={newItem.stockLevel} onChange={e => setNewItem({...newItem, stockLevel: e.target.value})} className="w-full border-[2px] border-black p-2 font-mono text-sm" placeholder="e.g. 50" />
            </div>
            <div>
              <label className="block font-mono text-xs font-bold mb-1">Level Stok Minimum</label>
              <input type="number" min="0" required value={newItem.minStockLevel} onChange={e => setNewItem({...newItem, minStockLevel: e.target.value})} className="w-full border-[2px] border-black p-2 font-mono text-sm" placeholder="e.g. 10" />
            </div>
            <div className="col-span-1 md:col-span-2 lg:col-span-3">
              <label className="block font-mono text-xs font-bold mb-1">Deskripsi</label>
              <input required value={newItem.desc} onChange={e => setNewItem({...newItem, desc: e.target.value})} className="w-full border-[2px] border-black p-2 font-mono text-sm" placeholder="Deskripsi singkat..." />
            </div>
          </div>
          <div className="flex justify-end gap-2 mt-4">
             <button type="button" onClick={() => setIsAdding(false)} className="px-4 py-2 border-[2px] border-black bg-gray-100 font-bold hover:bg-gray-200">Batal</button>
             <button type="submit" className="px-4 py-2 border-[2px] border-black bg-[#003B73] text-white font-bold tracking-widest hover:bg-black">Simpan Item</button>
          </div>
        </form>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
         {menuItems.map(item => (
            <div key={item.id} className="bg-white border-[4px] border-black p-4 flex flex-col hover:-translate-y-1 transition-transform shadow-[6px_6px_0px_#003B73]">
               <div className="flex justify-between items-start gap-2 mb-2">
                 <h4 className="font-black text-xl leading-tight text-[#003B73] break-words min-w-0">{item.name}</h4>
                 <div className="flex items-center gap-2">
                   <span className="font-mono text-[10px] font-bold bg-[#FDC500] px-2 py-1 border-[2px] border-black">ID_{item.id.slice(0, 6)}</span>
                   <button
                     onClick={() => handleDeleteItem(item.id, item.name)}
                     className="p-1.5 bg-red-100 text-red-600 border-[2px] border-red-200 hover:border-red-600 hover:bg-red-200 transition-colors"
                     title="Delete item"
                   >
                     <Trash2 size={14} />
                   </button>
                 </div>
               </div>

               <p className="font-mono text-sm font-bold text-gray-600 mb-4">Rp {Number(item.price).toLocaleString('id-ID')}</p>

               <div className="mt-auto border-t-[2px] border-dashed border-gray-300 pt-4">
                 <div className="flex justify-between font-mono text-[10px] mb-1">
                   <span>LEVEL STOK:</span>
                   <span className={item.stockLevel && item.stockLevel < (item.minStockLevel || 20) ? 'text-red-500 font-bold' : ''}>
                     {item.stockLevel || 0}
                   </span>
                 </div>
                 <div className="w-full h-2 bg-gray-200 overflow-hidden">
                    <div
                      className={`h-full ${item.stockLevel && item.stockLevel < (item.minStockLevel || 20) ? 'bg-red-500' : 'bg-[#003B73]'}`}
                      style={{ width: `${Math.min(((item.stockLevel || 0) / Math.max((item.minStockLevel || 20) * 5, item.stockLevel || 1) * 100), 100)}%` }}
                    />
                 </div>
               </div>
            </div>
         ))}
      </div>

      {menuItems.length === 0 && (
         <div className="bg-white border-[4px] border-black p-12 text-center shadow-[8px_8px_0px_#FDC500] flex flex-col items-center">
            <Package className="w-16 h-16 mb-4 text-gray-400" />
            <h3 className="text-xl font-bold font-mono">Tidak Ada Item Ditemukan</h3>
            <p className="font-mono text-sm mt-2 mb-6">Klik "Tambah Item Baru" untuk menginisialisasi inventaris.</p>
            <button
              onClick={handleSeed}
              disabled={isSeeding}
              className="bg-brand-blue text-white px-6 py-3 font-bold uppercase tracking-wide border-[3px] border-black hover:bg-black transition-colors flex items-center gap-2"
            >
              <Database size={20} />
              {isSeeding ? 'Mengisi...' : 'Isi Minuman Default'}
            </button>
         </div>
      )}
    </div>
  );
};
