import React, { createContext, useContext, useState, useEffect } from "react";
import { supabase } from '../supabase';
import { handleFirestoreError, OperationType } from '../utils/firestoreErrorHandler';

export interface MenuItem {
  id: string;
  name: string;
  price: string;
  cat: string;
  power: string;
  desc: string;
  imageUrl?: string;
  stockLevel?: number;
  minStockLevel?: number;
  updatedAt?: any;
}

export const DEFAULT_MENU: MenuItem[] = [
  { id: "01", name: "Kabin Signature", price: "28000", cat: "ICED_COFFEE", power: "90%", desc: "Cold brew, aren sugar, creamy oat milk." },
  { id: "02", name: "Dark Void Americano", price: "25000", cat: "BLACK_COFFEE", power: "100%", desc: "Double shot espresso straight from the abyss." },
  { id: "03", name: "Neon Matcha", price: "30000", cat: "NON_COFFEE", power: "60%", desc: "Kyoto matcha blended with vanilla sweet cream." },
  { id: "04", name: "Cyber Hazelnut", price: "32000", cat: "FLAVORED", power: "75%", desc: "Roasted hazelnut syrup with espresso base." },
  { id: "05", name: "Glitch Lychee Tea", price: "22000", cat: "REFRESHER", power: "40%", desc: "Black tea, fresh lychee, mint leaves." },
  { id: "06", name: "Caramel Overdrive", price: "35000", cat: "FLAVORED", power: "85%", desc: "Salted caramel ribbon over our signature latte." },
  { id: "07", name: "Plasma Velvet", price: "35000", cat: "NON_COFFEE", power: "10%", desc: "Red velvet choco blend with cream cheese." },
  { id: "08", name: "Quantum Nitro", price: "38000", cat: "BLACK_COFFEE", power: "110%", desc: "Nitrogen-infused cold brew. Maximum focus." },
];

interface MenuContextType {
  menuItems: MenuItem[];
  updateMenuItem: (id: string, updates: Partial<MenuItem>) => Promise<void>;
  deleteMenuItem: (id: string) => Promise<void>;
  loading: boolean;
}

const MenuContext = createContext<MenuContextType | undefined>(undefined);

function rowToMenu(row: any): MenuItem {
  return {
    id: row.id,
    name: row.name,
    price: String(row.price ?? '0'),
    cat: row.cat ?? '',
    power: row.power ?? '',
    desc: row.desc ?? '',
    imageUrl: row.image_url || undefined,
    stockLevel: row.stock_level,
    minStockLevel: row.min_stock_level,
    updatedAt: row.updated_at,
  };
}

export const MenuProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);

  const loadAll = async () => {
    const { data, error } = await supabase
      .from('inventory')
      .select('*')
      .order('name');
    if (error) {
      handleFirestoreError(error, OperationType.LIST, 'inventory');
      return;
    }
    setMenuItems((data ?? []).map(rowToMenu));
  };

  useEffect(() => {
    let active = true;

    loadAll().finally(() => { if (active) setLoading(false); });

    const channel = supabase
      .channel('menu-inventory')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'inventory' }, (payload) => {
        if (!active) return;
        if (payload.eventType === 'DELETE') {
          setMenuItems(prev => prev.filter(p => p.id !== payload.old.id));
        } else {
          const item = rowToMenu(payload.new);
          setMenuItems(prev => {
            const idx = prev.findIndex(p => p.id === item.id);
            if (idx === -1) return [...prev, item].sort((a, b) => a.name.localeCompare(b.name));
            const copy = [...prev];
            copy[idx] = item;
            return copy;
          });
        }
      })
      .subscribe();

    return () => {
      active = false;
      supabase.removeChannel(channel);
    };
  }, []);

  const updateMenuItem = async (id: string, updates: Partial<MenuItem>) => {
    const payload: any = {};
    if (updates.name !== undefined) payload.name = updates.name;
    if (updates.price !== undefined) payload.price = Number(updates.price);
    if (updates.cat !== undefined) payload.cat = updates.cat;
    if (updates.power !== undefined) payload.power = updates.power;
    if (updates.desc !== undefined) payload.desc = updates.desc;
    if (updates.imageUrl !== undefined) payload.image_url = updates.imageUrl;
    if (updates.stockLevel !== undefined) payload.stock_level = updates.stockLevel;
    if (updates.minStockLevel !== undefined) payload.min_stock_level = updates.minStockLevel;

    const { error } = await supabase.from('inventory').update(payload).eq('id', id);
    if (error) handleFirestoreError(error, OperationType.UPDATE, `inventory/${id}`);
  };

  const deleteMenuItem = async (id: string) => {
    const { error } = await supabase.from('inventory').delete().eq('id', id);
    if (error) {
      handleFirestoreError(error, OperationType.DELETE, `inventory/${id}`);
      throw error;
    }
  };

  return (
    <MenuContext.Provider value={{ menuItems, updateMenuItem, deleteMenuItem, loading }}>
      {children}
    </MenuContext.Provider>
  );
};

export const useMenu = () => {
  const context = useContext(MenuContext);
  if (!context) throw new Error("useMenu must be used within a MenuProvider");
  return context;
};
