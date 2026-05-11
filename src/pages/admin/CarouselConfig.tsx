import React, { useState } from 'react';
import { useMenu } from '../../context/MenuContext';
import { Image as ImageIcon, Plus } from 'lucide-react';
import { Link } from 'react-router-dom';

export const CarouselConfig = () => {
  const { menuItems, updateMenuItem } = useMenu();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [tempUrl, setTempUrl] = useState('');

  return (
    <div className="min-h-screen bg-brand-yellow font-sans p-8 bg-tech-grid">
      <div className="max-w-4xl mx-auto bg-white border-[6px] border-brand-blue brutal-shadow p-8 mt-12">
        <div className="flex items-center justify-between mb-8 border-b-[4px] border-brand-blue pb-4">
          <h1 className="text-4xl md:text-5xl font-black uppercase text-brand-navy flex items-center gap-4">
            Menu Dashboard
          </h1>
          <div className="font-mono text-xs font-bold bg-brand-red text-white px-3 py-1 tracking-widest hidden md:block">SEC_LEVEL_99 // ADMIN</div>
        </div>
        
        <p className="mb-8 font-mono text-sm font-medium border-l-[4px] border-brand-red pl-4 bg-red-50 py-2 text-brand-navy">
          Update custom images for carousel items. Changes auto-save to browser storage.
        </p>
        
        <div className="grid gap-6">
          {menuItems.map(item => (
            <div key={item.id} className="border-[4px] border-brand-navy p-4 md:p-6 flex flex-col md:flex-row gap-4 md:gap-6 items-start md:items-center bg-gray-50 hover:bg-white transition-colors brutal-shadow-yellow group">
               <div className="w-24 h-24 border-[4px] border-brand-navy shrink-0 bg-white flex items-center justify-center overflow-hidden self-center md:self-auto group-hover:scale-105 transition-transform">
                 {item.imageUrl ? <img src={item.imageUrl} className="w-full h-full object-cover"/> : <ImageIcon className="text-gray-300 w-10 h-10"/>}
               </div>
               
               <div className="flex-grow w-full">
                 <div className="font-black text-2xl uppercase text-brand-navy">{item.name}</div>
                 <div className="font-mono text-xs font-bold tracking-widest bg-brand-yellow/30 inline-block px-2 py-0.5 border-[1px] border-brand-blue mb-2">
                   ID: {item.id} | TYPE: {item.cat}
                 </div>
                 
                 {editingId === item.id ? (
                   <div className="mt-2 flex flex-col gap-2">
                     <input 
                       className="w-full border-[3px] border-brand-navy px-3 py-2 font-mono text-sm focus:outline-none focus:border-brand-red focus:ring-0" 
                       placeholder="Paste Image URL (https://...)"
                       value={tempUrl}
                       onChange={e => setTempUrl(e.target.value)}
                       autoFocus
                     />
                     <div className="flex gap-2">
                       <button 
                         className="bg-brand-blue text-white px-4 py-2 font-bold uppercase text-xs tracking-wider border-[2px] border-brand-blue hover:bg-brand-red hover:border-brand-red transition-colors"
                         onClick={() => {
                           updateMenuItem(item.id, { imageUrl: tempUrl });
                           setEditingId(null);
                         }}
                       >
                         Save URL
                       </button>
                       <button 
                         className="bg-white text-brand-navy px-4 py-2 font-bold uppercase text-xs tracking-wider border-[2px] border-brand-navy hover:bg-gray-100 transition-colors"
                         onClick={() => setEditingId(null)}
                       >
                         Cancel
                       </button>
                     </div>
                   </div>
                 ) : (
                   <div className="mt-2 font-mono text-xs truncate w-full max-w-[200px] md:max-w-md text-gray-500">
                     {item.imageUrl ? (
                        <span className="text-brand-blue underline">{item.imageUrl}</span>
                     ) : (
                        <span className="opacity-60 italic">No custom image. Using default visualizer.</span>
                     )}
                   </div>
                 )}
               </div>
               
               {editingId !== item.id && (
                 <button 
                   className="w-full md:w-auto shrink-0 bg-brand-yellow border-[3px] border-brand-navy px-6 py-3 font-black uppercase text-sm tracking-widest hover:bg-brand-blue hover:text-white transition-colors brutal-shadow ml-auto"
                   onClick={() => {
                     setEditingId(item.id);
                     setTempUrl(item.imageUrl || '');
                   }}
                 >
                   Edit Image
                 </button>
               )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
