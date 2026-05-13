import React, { useState } from 'react';
import { useMenu } from '../../context/MenuContext';
import { Image as ImageIcon, Plus, Trash2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { apiRequest } from '../../services/api';
import { compressImageToBase64 } from '../../utils/imageCompression';

export const CarouselConfig = () => {
  const { menuItems, updateMenuItem, deleteMenuItem } = useMenu();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [tempBinary, setTempBinary] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const [newItem, setNewItem] = useState({
    name: '',
    price: '',
    cat: 'BEVERAGE',
    power: '50%',
    desc: '',
    imageBinary: '',
  });

  const handleFileSelect = (file: File) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      const base64 = result.split(',')[1];
      setTempBinary(base64);
    };
    reader.readAsDataURL(file);
  };

  const handleAddItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItem.name || !newItem.price || !newItem.desc) return;

    try {
      const priceValue = parseInt(newItem.price, 10);
      await apiRequest('/api/inventory', {
        method: 'POST',
        body: JSON.stringify({
          name: newItem.name,
          price: isNaN(priceValue) ? 0 : priceValue,
          cat: newItem.cat,
          power: newItem.power,
          desc: newItem.desc,
          image_url: newItem.imageBinary || null,
          stock_level: 100,
          min_stock_level: 20,
        }),
      });
      setIsAdding(false);
      setNewItem({
        name: '',
        price: '',
        cat: 'BEVERAGE',
        power: '50%',
        desc: '',
        imageBinary: '',
      });
    } catch (err: any) {
      alert("Gagal menambahkan item karousel:\n" + (err?.message ?? 'Unknown error'));
    }
  };

  const handleDeleteItem = async (id: string, name: string) => {
    if (!window.confirm(`Hapus item "${name}"?`)) return;
    try {
      await deleteMenuItem(id);
    } catch (err: any) {
      alert("Gagal menghapus item:\n" + (err?.message ?? 'Unknown error'));
    }
  };

  const getImageSrc = (imageUrl: string | undefined) => {
    if (!imageUrl) return '';
    if (imageUrl.startsWith('data:')) return imageUrl;
    if (imageUrl.startsWith('png;base64,') || imageUrl.startsWith('jpeg;base64,')) {
      const [format, base64] = imageUrl.split(';base64,');
      return `data:image/${format};base64,${base64}`;
    }
    return `data:image/png;base64,${imageUrl}`;
  };

  return (
    <div className="min-h-screen bg-brand-yellow font-sans p-8 bg-tech-grid">
      <div className="max-w-4xl mx-auto bg-white border-[6px] border-brand-blue brutal-shadow p-8 mt-12">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-8 border-b-[4px] border-brand-blue pb-4 gap-4">
          <h1 className="text-4xl md:text-5xl font-black uppercase text-brand-navy flex items-center gap-4">
            Dasbor Menu
          </h1>
          <div className="flex flex-col md:flex-row items-start md:items-center gap-4 ml-auto">
            <button
              onClick={() => setIsAdding(!isAdding)}
              className="bg-brand-yellow text-brand-navy px-4 py-2 font-bold uppercase tracking-wide border-[3px] border-brand-navy hover:bg-brand-blue hover:text-white transition-colors flex items-center gap-2 brutal-shadow"
            >
              <Plus size={20} /> Tambah Item Karousel
            </button>
            <div className="font-mono text-xs font-bold bg-brand-red text-white px-3 py-1 tracking-widest hidden md:block">SEC_LEVEL_99 // ADMIN</div>
          </div>
        </div>
        
        <p className="mb-8 font-mono text-sm font-medium border-l-[4px] border-brand-red pl-4 bg-red-50 py-2 text-brand-navy">
          Unggah gambar kustom untuk item karousel. Format PNG/JPG/WebP didukung. Perubahan otomatis tersimpan.
        </p>

        {isAdding && (
          <form onSubmit={handleAddItem} className="bg-gray-50 border-[4px] border-brand-navy p-6 mb-8 brutal-shadow-yellow">
            <h3 className="font-black text-lg uppercase text-brand-navy border-b-[2px] border-brand-blue pb-3 mb-4">Tambah Item Karousel Baru</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block font-mono text-xs font-bold mb-1 text-brand-navy">Nama</label>
                <input required value={newItem.name} onChange={e => setNewItem({...newItem, name: e.target.value})} className="w-full border-[2px] border-brand-navy p-2 font-mono text-sm focus:outline-none focus:border-brand-red" placeholder="mis. Cosmic Latte" />
              </div>
              <div>
                <label className="block font-mono text-xs font-bold mb-1 text-brand-navy">Harga</label>
                <input required type="number" value={newItem.price} onChange={e => setNewItem({...newItem, price: e.target.value})} className="w-full border-[2px] border-brand-navy p-2 font-mono text-sm focus:outline-none focus:border-brand-red" placeholder="e.g. 25000" />
              </div>
              <div>
                <label className="block font-mono text-xs font-bold mb-1 text-brand-navy">Kategori</label>
                <input value={newItem.cat} onChange={e => setNewItem({...newItem, cat: e.target.value})} className="w-full border-[2px] border-brand-navy p-2 font-mono text-sm focus:outline-none focus:border-brand-red" placeholder="e.g. BEVERAGE" />
              </div>
              <div>
                <label className="block font-mono text-xs font-bold mb-1 text-brand-navy">Level Kekuatan</label>
                <input value={newItem.power} onChange={e => setNewItem({...newItem, power: e.target.value})} className="w-full border-[2px] border-brand-navy p-2 font-mono text-sm focus:outline-none focus:border-brand-red" placeholder="e.g. 80%" />
              </div>
              <div className="md:col-span-2">
                <label className="block font-mono text-xs font-bold mb-1 text-brand-navy">Upload Gambar (Opsional)</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={async (e) => {
                    if (e.target.files?.[0]) {
                      try {
                        const base64 = await compressImageToBase64(e.target.files[0]);
                        setNewItem({...newItem, imageBinary: base64});
                      } catch (err) {
                        alert(`Error processing image: ${err instanceof Error ? err.message : 'Unknown error'}`);
                      }
                    }
                  }}
                  className="w-full border-[2px] border-brand-navy p-2 font-mono text-sm focus:outline-none focus:border-brand-red"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block font-mono text-xs font-bold mb-1 text-brand-navy">Deskripsi</label>
                <input required value={newItem.desc} onChange={e => setNewItem({...newItem, desc: e.target.value})} className="w-full border-[2px] border-brand-navy p-2 font-mono text-sm focus:outline-none focus:border-brand-red" placeholder="Deskripsi singkat..." />
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <button type="button" onClick={() => setIsAdding(false)} className="px-4 py-2 border-[2px] border-brand-navy bg-white text-brand-navy font-bold uppercase text-xs hover:bg-gray-100 transition-colors">Batal</button>
              <button type="submit" className="px-4 py-2 border-[2px] border-brand-navy bg-brand-yellow text-brand-navy font-bold uppercase text-xs hover:bg-brand-blue hover:text-white transition-colors">Simpan Item</button>
            </div>
          </form>
        )}

        <div className="grid gap-6">
          {menuItems.map(item => (
            <div key={item.id} className="border-[4px] border-brand-navy p-4 md:p-6 flex flex-col md:flex-row gap-4 md:gap-6 items-start md:items-center bg-gray-50 hover:bg-white transition-colors brutal-shadow-yellow group">
               <div className="w-24 h-24 border-[4px] border-brand-navy shrink-0 bg-white flex items-center justify-center overflow-hidden self-center md:self-auto group-hover:scale-105 transition-transform">
                 {item.imageUrl ? <img src={getImageSrc(item.imageUrl)} className="w-full h-full object-contain"/> : <ImageIcon className="text-gray-300 w-10 h-10"/>}
               </div>
               
               <div className="flex-grow w-full">
                 <div className="font-black text-2xl uppercase text-brand-navy">{item.name}</div>
                 <div className="font-mono text-xs font-bold tracking-widest bg-brand-yellow/30 inline-block px-2 py-0.5 border-[1px] border-brand-blue mb-2">
                   ID: {item.id} | TYPE: {item.cat}
                 </div>
                 
                 {editingId === item.id ? (
                   <div className="mt-2 flex flex-col gap-2">
                     <input
                       type="file"
                       accept="image/*"
                       onChange={async (e) => {
                         if (e.target.files?.[0]) {
                           try {
                             const base64 = await compressImageToBase64(e.target.files[0]);
                             setTempBinary(base64);
                           } catch (err) {
                             alert(`Error processing image: ${err instanceof Error ? err.message : 'Unknown error'}`);
                           }
                         }
                       }}
                       className="w-full border-[3px] border-brand-navy px-3 py-2 font-mono text-sm focus:outline-none focus:border-brand-red focus:ring-0"
                       autoFocus
                     />
                     <div className="flex gap-2">
                       <button
                         className="bg-brand-blue text-white px-4 py-2 font-bold uppercase text-xs tracking-wider border-[2px] border-brand-blue hover:bg-brand-red hover:border-brand-red transition-colors"
                         onClick={() => {
                           updateMenuItem(item.id, { imageUrl: tempBinary });
                           setEditingId(null);
                         }}
                       >
                         Simpan Gambar
                       </button>
                       <button
                         className="bg-white text-brand-navy px-4 py-2 font-bold uppercase text-xs tracking-wider border-[2px] border-brand-navy hover:bg-gray-100 transition-colors"
                         onClick={() => setEditingId(null)}
                       >
                         Batal
                       </button>
                     </div>
                   </div>
                 ) : (
                   <div className="mt-2 font-mono text-xs truncate w-full max-w-[200px] md:max-w-md text-gray-500">
                     {item.imageUrl ? (
                        <span className="text-brand-blue">✓ Gambar disimpan</span>
                     ) : (
                        <span className="opacity-60 italic">Tidak ada gambar kustom. Menggunakan visualizer default.</span>
                     )}
                   </div>
                 )}
               </div>
               
               {editingId !== item.id && (
                 <div className="flex gap-2 ml-auto w-full md:w-auto">
                   <button
                     className="flex-1 md:flex-none bg-brand-yellow border-[3px] border-brand-navy px-6 py-3 font-black uppercase text-sm tracking-widest hover:bg-brand-blue hover:text-white transition-colors brutal-shadow"
                     onClick={() => {
                       setEditingId(item.id);
                       setTempBinary(item.imageUrl || '');
                     }}
                   >
                     Edit Gambar
                   </button>
                   <button
                     className="p-3 bg-red-100 text-red-600 border-[2px] border-red-200 hover:border-red-600 transition-colors"
                     onClick={() => handleDeleteItem(item.id, item.name)}
                     aria-label={`Delete ${item.name}`}
                   >
                     <Trash2 size={16} />
                   </button>
                 </div>
               )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
