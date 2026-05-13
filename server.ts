import express from 'express';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { applyApprovedTransfer, applySaleToCourierStock, LedgerItem } from './src/services/ledgerLogic.js';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL ?? '';
const serviceRoleKey = process.env.APP_SUPABASE_SERVICE_KEY ?? '';
if (!supabaseUrl || !serviceRoleKey) {
  console.error('[server] Missing VITE_SUPABASE_URL or APP_SUPABASE_SERVICE_KEY env vars');
}
const supabaseAdmin = createClient(
  supabaseUrl || 'https://placeholder.supabase.co',
  serviceRoleKey || 'placeholder-key',
  { auth: { autoRefreshToken: false, persistSession: false } },
);

const app = express();
app.use(express.json({ limit: '5mb' }));
app.use('/api', (_req, res, next) => {
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate');
  res.setHeader('Pragma', 'no-cache');
  next();
});

const asyncRoute = (fn: express.RequestHandler): express.RequestHandler =>
  (req, res, next) => (Promise.resolve(fn(req, res, next)) as Promise<unknown>).catch(next);

type StaffRole = 'admin' | 'kurir';
type StaffProfile = {
  id: string;
  email: string;
  name: string;
  role: StaffRole;
  status: 'active' | 'inactive';
  current_location?: string | null;
  last_password?: string | null;
  daily_target?: number | null;
};


async function requireProfile(req: express.Request, res: express.Response, role?: StaffRole) {
  const authHeader = req.headers.authorization;
  const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null;
  if (!token) {
    res.status(401).json({ error: 'Unauthorized' });
    return null;
  }

  const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);
  if (authError || !user) {
    res.status(401).json({ error: 'Invalid or expired token' });
    return null;
  }

  const { data: profile } = await supabaseAdmin
    .from('profiles')
    .select('id, email, name, role, status, current_location')
    .eq('id', user.id)
    .maybeSingle();

  if (!profile || (profile as StaffProfile).status !== 'active') {
    res.status(403).json({ error: 'Inactive or unregistered account' });
    return null;
  }
  if (role && (profile as StaffProfile).role !== role) {
    res.status(403).json({ error: `${role} access required` });
    return null;
  }

  return profile as StaffProfile;
}

async function loadStockMap(table: 'inventory' | 'courier_stock', ids: string[], kurirId?: string) {
  if (ids.length === 0) return {};

  let query = supabaseAdmin
    .from(table)
    .select(table === 'inventory' ? 'id, stock_level' : 'inventory_id, quantity')
    .in(table === 'inventory' ? 'id' : 'inventory_id', ids);

  if (table === 'courier_stock' && kurirId) query = query.eq('kurir_id', kurirId);

  const { data, error } = await query;
  if (error) throw error;

  return Object.fromEntries(
    (data ?? []).map((row: any) => [
      table === 'inventory' ? row.id : row.inventory_id,
      table === 'inventory' ? row.stock_level : row.quantity,
    ]),
  ) as Record<string, number>;
}

async function upsertCourierStock(kurirId: string, stock: Record<string, number>) {
  const rows = Object.entries(stock).map(([inventoryId, quantity]) => ({
    kurir_id: kurirId,
    inventory_id: inventoryId,
    quantity,
  }));
  if (rows.length === 0) return;
  const { error } = await supabaseAdmin
    .from('courier_stock')
    .upsert(rows, { onConflict: 'kurir_id,inventory_id' });
  if (error) throw error;
}

function normalizeLedgerItems(items: any[]): LedgerItem[] {
  return (items ?? []).map(item => ({
    inventoryId: String(item.inventoryId ?? item.inventory_id ?? ''),
    quantity: Number(item.quantity ?? 0),
  }));
}

// ── Public: first-time admin bootstrap ─────────────────────────────────────
app.post('/api/seed-admin', async (req, res) => {
  const { count } = await supabaseAdmin
    .from('profiles')
    .select('id', { count: 'exact', head: true })
    .eq('role', 'admin');

  if ((count ?? 0) > 0) {
    res.status(400).json({ error: 'An admin account already exists. Use the login page.' });
    return;
  }

  const { email, name, password } = req.body as { email: string; name: string; password: string };
  if (!email || !name || !password) {
    res.status(400).json({ error: 'email, name and password are required' });
    return;
  }

  try {
    // Check if a Supabase Auth user with this email already exists
    const { data: listData, error: listError } = await supabaseAdmin.auth.admin.listUsers();
    if (listError) throw listError;

    const existingAuthUser = (listData as any).users.find((u: any) => u.email === email);
    let userId: string;
    let createdNewAuthUser = false;

    if (existingAuthUser) {
      userId = existingAuthUser.id;
    } else {
      const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
      });
      if (authError || !authData.user) throw new Error(authError?.message ?? 'Failed to create auth user');
      userId = authData.user.id;
      createdNewAuthUser = true;
    }

    const { error } = await supabaseAdmin
      .from('profiles')
      .insert({ id: userId, email, name, role: 'admin', status: 'active' });

    if (error) {
      if (createdNewAuthUser) await supabaseAdmin.auth.admin.deleteUser(userId);
      throw error;
    }

    res.json({ ok: true });
  } catch (err: any) {
    res.status(400).json({ error: err?.message ?? 'Failed to create admin' });
  }
});

// ── Profile ─────────────────────────────────────────────────────────────────
app.get('/api/me', asyncRoute(async (req, res) => {
  const profile = await requireProfile(req, res);
  if (!profile) return;
  res.json(profile);
}));

// ── User management (admin only) ─────────────────────────────────────────────
app.get('/api/users', asyncRoute(async (req, res) => {
  const profile = await requireProfile(req, res, 'admin');
  if (!profile) return;

  const [{ data: profiles, error }, { data: authData }] = await Promise.all([
    supabaseAdmin.from('profiles').select('id, email, name, role, status, current_location, daily_target').order('created_at'),
    supabaseAdmin.auth.admin.listUsers({ perPage: 1000 }),
  ]);

  if (error) return res.status(500).json({ error: error.message });

  // Merge last_password from auth user_metadata — no DB column needed
  const metaMap = Object.fromEntries(
    (authData?.users ?? []).map(u => [u.id, (u.user_metadata as any)?.last_password ?? null])
  );

  res.json((profiles ?? []).map(p => ({ ...p, last_password: metaMap[p.id] ?? null })));
}));

app.post('/api/users', async (req, res) => {
  const profile = await requireProfile(req, res, 'admin');
  if (!profile) return;
  const { email, name, password, role } = req.body as {
    email: string; name: string; password: string; role: 'admin' | 'kurir';
  };
  try {
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { last_password: password },
    });
    if (authError || !authData.user) throw new Error(authError?.message ?? 'Failed to create auth user');

    const userId = authData.user.id;
    const { error } = await supabaseAdmin
      .from('profiles')
      .insert({ id: userId, email, name, role, status: 'active' });

    if (error) {
      await supabaseAdmin.auth.admin.deleteUser(userId);
      throw error;
    }

    res.json({ id: userId });
  } catch (err: any) {
    res.status(400).json({ error: err?.message ?? 'Failed to create user' });
  }
});

app.delete('/api/users/:id', async (req, res) => {
  const profile = await requireProfile(req, res, 'admin');
  if (!profile) return;
  const { id } = req.params;
  try {
    // Delete from Auth first; ignore "User not found" so orphaned profiles can still be cleaned up
    const { error: deleteAuthError } = await supabaseAdmin.auth.admin.deleteUser(id);
    if (deleteAuthError) {
      const msg = deleteAuthError.message?.toLowerCase() ?? '';
      const isNotFound = msg.includes('user not found') || msg.includes('not found') || (deleteAuthError as any).status === 404;
      if (!isNotFound) throw deleteAuthError;
    }
    // Always remove the profile row regardless of auth state
    const { error: profileError } = await supabaseAdmin.from('profiles').delete().eq('id', id);
    if (profileError) throw profileError;
    res.json({ ok: true });
  } catch (err: any) {
    res.status(400).json({ error: err?.message ?? 'Failed to delete user' });
  }
});

app.patch('/api/users/:id', async (req, res) => {
  const profile = await requireProfile(req, res, 'admin');
  if (!profile) return;
  const { id } = req.params;
  const { name, role, status, password, daily_target } = req.body as {
    name?: string;
    role?: 'admin' | 'kurir';
    status?: 'active' | 'inactive';
    password?: string;
    daily_target?: number | null;
  };

  try {
    const updateData: Partial<StaffProfile> = {};
    if (name !== undefined) updateData.name = name;
    if (role !== undefined) updateData.role = role;
    if (status !== undefined) updateData.status = status;
    if (daily_target !== undefined) updateData.daily_target = daily_target;

    // Fetch the profile row so we have the email for re-syncing auth if needed
    const { data: targetProfile } = await supabaseAdmin
      .from('profiles')
      .select('email')
      .eq('id', id)
      .maybeSingle();
    if (!targetProfile) {
      res.status(404).json({ error: 'User profile not found' });
      return;
    }

    if (Object.keys(updateData).length > 0) {
      const { error } = await supabaseAdmin.from('profiles').update(updateData).eq('id', id);
      if (error) throw error;
    }

    if (password) {
      const { error: pwError } = await supabaseAdmin.auth.admin.updateUserById(id, {
        password,
        user_metadata: { last_password: password },
      });
      if (pwError) {
        const msg = pwError.message?.toLowerCase() ?? '';
        const isNotFound = msg.includes('user not found') || msg.includes('not found');
        if (isNotFound) {
          // Auth user missing — create a new one and re-link the profile
          const { data: newAuth, error: createErr } = await supabaseAdmin.auth.admin.createUser({
            email: targetProfile.email,
            password,
            email_confirm: true,
            user_metadata: { last_password: password },
          });
          if (createErr || !newAuth.user) throw new Error(createErr?.message ?? 'Failed to re-create auth user');

          const newId = newAuth.user.id;
          if (newId !== id) {
            // Save related rows from FK tables (ignore errors for tables that don't exist yet)
            const safeSelect = async (table: string, col: string) => {
              try { const { data } = await supabaseAdmin.from(table).select('*').eq(col, id); return data ?? []; }
              catch { return []; }
            };

            const [stockRows, reqRows, txRows] = await Promise.all([
              safeSelect('courier_stock', 'kurir_id'),
              safeSelect('requests', 'kurir_id'),
              safeSelect('transactions', 'kurir_id'),
            ]);

            const { data: profileSnap } = await supabaseAdmin.from('profiles').select('*').eq('id', id).single();
            if (!profileSnap) throw new Error('Profile disappeared during re-link');

            // Delete the old profile (cascades FK children if tables exist)
            await supabaseAdmin.from('profiles').delete().eq('id', id);

            // Re-insert profile with the new auth id
            const { id: _oldId, ...rest } = profileSnap;
            const merged = { ...rest, id: newId };
            if (name !== undefined) merged.name = name;
            if (role !== undefined) merged.role = role;
            if (status !== undefined) merged.status = status;
            const { error: insertErr } = await supabaseAdmin.from('profiles').insert(merged);
            if (insertErr) throw insertErr;

            // Re-insert FK children with new kurir_id (skip tables that don't exist)
            const remap = (rows: any[]) => rows.map(({ kurir_id, ...r }: any) => ({ ...r, kurir_id: newId }));
            const safeInsert = async (table: string, rows: any[], upsertConflict?: string) => {
              if (!rows.length) return;
              try {
                if (upsertConflict) await supabaseAdmin.from(table).upsert(remap(rows), { onConflict: upsertConflict });
                else await supabaseAdmin.from(table).insert(remap(rows));
              } catch { /* table may not exist — skip */ }
            };
            await safeInsert('courier_stock', stockRows, 'kurir_id,inventory_id');
            await safeInsert('requests', reqRows);
            await safeInsert('transactions', txRows);
          }
        } else {
          throw pwError;
        }
      }

    }

    res.json({ ok: true });
  } catch (err: any) {
    res.status(400).json({ error: err?.message ?? 'Failed to update user' });
  }
});

app.patch('/api/users/:id/location', asyncRoute(async (req, res) => {
  const admin = await requireProfile(req, res, 'admin');
  if (!admin) return;
  const { location } = req.body as { location: string };
  const { error } = await supabaseAdmin
    .from('profiles')
    .update({ current_location: location ?? null })
    .eq('id', req.params.id)
    .eq('role', 'kurir');
  if (error) return res.status(400).json({ error: error.message });
  res.json({ ok: true });
}));

// ── Dashboards ───────────────────────────────────────────────────────────────
app.get('/api/dashboard/admin', asyncRoute(async (req, res) => {
  const profile = await requireProfile(req, res, 'admin');
  if (!profile) return;

  const start = new Date();
  start.setHours(0, 0, 0, 0);

  const [requests, pending, couriers, inventory, transactions] = await Promise.all([
    supabaseAdmin.from('requests').select('id', { count: 'exact', head: true }),
    supabaseAdmin.from('requests').select('id', { count: 'exact', head: true }).eq('status', 'pending'),
    supabaseAdmin.from('profiles').select('id', { count: 'exact', head: true }).eq('role', 'kurir').eq('status', 'active'),
    supabaseAdmin.from('inventory').select('stock_level, min_stock_level'),
    supabaseAdmin.from('transactions').select('total_amount, type').gte('created_at', start.toISOString()),
  ]);

  const lowStock = (inventory.data ?? []).filter((i: any) => i.stock_level <= i.min_stock_level).length;
  const todayRevenue = (transactions.data ?? [])
    .filter((tx: any) => tx.type === 'sale')
    .reduce((sum: number, tx: any) => sum + Number(tx.total_amount ?? 0), 0);

  res.json({
    totalRequests: requests.count ?? 0,
    pendingRequests: pending.count ?? 0,
    activeCouriers: couriers.count ?? 0,
    lowStock,
    todayRevenue,
    todayActivity: transactions.data?.length ?? 0,
  });
}));

app.get('/api/dashboard/kurir', asyncRoute(async (req, res) => {
  const profile = await requireProfile(req, res);
  if (!profile) return;
  if (profile.role !== 'kurir' && profile.role !== 'admin') {
    res.status(403).json({ error: 'kurir or admin access required' });
    return;
  }

  const start = new Date();
  start.setHours(0, 0, 0, 0);

  const weekStart = new Date();
  weekStart.setDate(weekStart.getDate() - 6);
  weekStart.setHours(0, 0, 0, 0);

  const [stock, latestRequest, todayTx, weekTx, profileRow] = await Promise.all([
    supabaseAdmin
      .from('courier_stock')
      .select('inventory_id, quantity, inventory(name, price, cat, image_url, min_stock_level)')
      .eq('kurir_id', profile.id)
      .order('inventory_id'),
    supabaseAdmin
      .from('requests')
      .select('*')
      .eq('kurir_id', profile.id)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle(),
    supabaseAdmin
      .from('transactions')
      .select('total_amount, type')
      .eq('kurir_id', profile.id)
      .gte('created_at', start.toISOString()),
    supabaseAdmin
      .from('transactions')
      .select('total_amount, type, created_at')
      .eq('kurir_id', profile.id)
      .eq('type', 'sale')
      .gte('created_at', weekStart.toISOString()),
    supabaseAdmin
      .from('profiles')
      .select('daily_target')
      .eq('id', profile.id)
      .maybeSingle(),
  ]);

  if (stock.error) return res.status(500).json({ error: stock.error.message });

  const todayRevenue = (todayTx.data ?? [])
    .filter((tx: any) => tx.type === 'sale')
    .reduce((sum: number, tx: any) => sum + Number(tx.total_amount ?? 0), 0);

  const weekRevenue = (weekTx.data ?? [])
    .reduce((sum: number, tx: any) => sum + Number(tx.total_amount ?? 0), 0);

  res.json({
    stock: stock.data ?? [],
    latestRequest: latestRequest.data,
    todayRevenue,
    todayActivity: todayTx.data?.length ?? 0,
    weekRevenue,
    currentLocation: profile.current_location ?? null,
    dailyTarget: (profileRow.data as any)?.daily_target ?? null,
  });
}));

// ── Courier stock ─────────────────────────────────────────────────────────────
app.get('/api/courier-stock', asyncRoute(async (req, res) => {
  const profile = await requireProfile(req, res);
  if (!profile) return;
  if (profile.role !== 'kurir' && profile.role !== 'admin') {
    res.status(403).json({ error: 'kurir or admin access required' });
    return;
  }
  const { data, error } = await supabaseAdmin
    .from('courier_stock')
    .select('inventory_id, quantity, inventory(id, name, price, cat, power, "desc", image_url, min_stock_level)')
    .eq('kurir_id', profile.id)
    .order('inventory_id');
  if (error) return res.status(500).json({ error: error.message });
  res.json(data ?? []);
}));

// ── Inventory ─────────────────────────────────────────────────────────────────
app.get('/api/inventory', asyncRoute(async (req, res) => {
  const profile = await requireProfile(req, res);
  if (!profile) return;
  const { data, error } = await supabaseAdmin
    .from('inventory')
    .select('id, name, stock_level, price')
    .order('name');
  if (error) return res.status(500).json({ error: error.message });
  res.json(data ?? []);
}));

app.post('/api/inventory', asyncRoute(async (req, res) => {
  const profile = await requireProfile(req, res, 'admin');
  if (!profile) return;

  const { data, error } = await supabaseAdmin
    .from('inventory')
    .insert(req.body)
    .select()
    .single();
  if (error) return res.status(400).json({ error: error.message });
  res.json(data);
}));

app.delete('/api/inventory/:id', asyncRoute(async (req, res) => {
  const profile = await requireProfile(req, res, 'admin');
  if (!profile) return;

  const { error } = await supabaseAdmin.from('inventory').delete().eq('id', req.params.id);
  if (error) return res.status(400).json({ error: error.message });
  res.json({ ok: true });
}));

// ── Requests ─────────────────────────────────────────────────────────────────
app.get('/api/requests', asyncRoute(async (req, res) => {
  const profile = await requireProfile(req, res);
  if (!profile) return;

  let query = supabaseAdmin.from('requests').select('*').order('created_at', { ascending: false });
  if (profile.role !== 'admin') query = query.eq('kurir_id', profile.id);
  const { data, error } = await query;
  if (error) return res.status(500).json({ error: error.message });
  res.json(data ?? []);
}));

app.post('/api/requests', async (req, res) => {
  const profile = await requireProfile(req, res);
  if (!profile) return;
  if (profile.role !== 'kurir' && profile.role !== 'admin') {
    res.status(403).json({ error: 'kurir or admin access required' });
    return;
  }

  const items = normalizeLedgerItems(req.body.items);
  try {
    if (!items.length) throw new Error('At least one item is required');
    for (const item of items) {
      if (!item.inventoryId || !Number.isFinite(item.quantity) || item.quantity <= 0) {
        throw new Error('Request items must include positive quantities');
      }
    }
    const { data, error } = await supabaseAdmin
      .from('requests')
      .insert({
        kurir_id: profile.id,
        kurir_name: profile.name || profile.email,
        items: req.body.items,
        status: 'pending',
        note: String(req.body.note ?? '').trim(),
      })
      .select()
      .single();
    if (error) throw error;
    res.json(data);
  } catch (err: any) {
    res.status(400).json({ error: err?.message ?? 'Failed to create request' });
  }
});

app.post('/api/requests/:id/approve', async (req, res) => {
  const admin = await requireProfile(req, res, 'admin');
  if (!admin) return;

  try {
    // 1. Fetch and validate the request
    const { data: reqData, error: reqErr } = await supabaseAdmin
      .from('requests').select('*').eq('id', req.params.id).single();
    if (reqErr) throw reqErr;
    if (reqData.status !== 'pending') throw new Error('Only pending requests can be approved');

    const items = normalizeLedgerItems(reqData.items);
    if (!items.length) throw new Error('Request has no items');

    const ids = items.map(item => item.inventoryId);

    // 2. Load stock maps — treat missing tables as zero stock (graceful if schema not yet applied)
    const isTableMissingErr = (e: any) => {
      const m = (e?.message ?? '').toLowerCase();
      return m.includes('could not find') || m.includes('does not exist') || m.includes('schema cache') || m.includes('relation');
    };

    const [central, courier] = await Promise.all([
      loadStockMap('inventory', ids).catch(e => {
        if (isTableMissingErr(e)) return {} as Record<string, number>;
        throw e;
      }),
      loadStockMap('courier_stock', ids, reqData.kurir_id).catch(e => {
        if (isTableMissingErr(e)) return {} as Record<string, number>;
        throw e;
      }),
    ]);

    // 3. Apply the ledger transfer (throws if insufficient stock — intentional)
    const next = applyApprovedTransfer({ central, courier, items });

    // 4. Persist stock changes (skip silently if tables don't exist)
    const safeUpdate = async (fn: () => Promise<any>) => {
      try { await fn(); } catch (e) { if (!isTableMissingErr(e)) throw e; }
    };

    await Promise.all([
      ...Object.entries(next.central).map(([id, stockLevel]) =>
        safeUpdate(async () => { const { error } = await supabaseAdmin.from('inventory').update({ stock_level: stockLevel }).eq('id', id); if (error) throw error; })
      ),
      safeUpdate(() => upsertCourierStock(reqData.kurir_id, next.courier)),
    ]);

    // 5. Mark request as approved — this MUST succeed
    const { data: updated, error: updateErr } = await supabaseAdmin
      .from('requests')
      .update({ status: 'approved' })
      .eq('id', reqData.id)
      .select()
      .single();
    if (updateErr) throw updateErr;

    // 6. Log the restock transaction (skip if table doesn't exist)
    await safeUpdate(async () => {
      const { error } = await supabaseAdmin.from('transactions').insert({
        kurir_id: reqData.kurir_id,
        kurir_name: reqData.kurir_name,
        items: reqData.items,
        total_amount: 0,
        type: 'restock',
      });
      if (error) throw error;
    });

    res.json(updated);
  } catch (err: any) {
    res.status(400).json({ error: err?.message ?? 'Failed to approve request' });
  }
});

app.post('/api/requests/:id/reject', asyncRoute(async (req, res) => {
  const admin = await requireProfile(req, res, 'admin');
  if (!admin) return;

  const { data, error } = await supabaseAdmin
    .from('requests')
    .update({ status: 'rejected' })
    .eq('id', req.params.id)
    .eq('status', 'pending')
    .select()
    .single();
  if (error) return res.status(400).json({ error: error.message });
  res.json(data);
}));

// ── Transactions ─────────────────────────────────────────────────────────────
app.get('/api/transactions', asyncRoute(async (req, res) => {
  const profile = await requireProfile(req, res);
  if (!profile) return;
  let query = supabaseAdmin.from('transactions').select('*').order('created_at', { ascending: false });
  if (profile.role !== 'admin') query = query.eq('kurir_id', profile.id);
  const { data, error } = await query;
  if (error) return res.status(500).json({ error: error.message });
  res.json(data ?? []);
}));

app.post('/api/transactions/sale', async (req, res) => {
  const profile = await requireProfile(req, res);
  if (!profile) return;
  if (profile.role !== 'kurir' && profile.role !== 'admin') {
    res.status(403).json({ error: 'kurir or admin access required' });
    return;
  }

  try {
    const items = normalizeLedgerItems(req.body.items);
    const ids = items.map(item => item.inventoryId);
    const courier = await loadStockMap('courier_stock', ids, profile.id);
    const next = applySaleToCourierStock({ courier, items });
    await upsertCourierStock(profile.id, next.courier);

    const { data, error } = await supabaseAdmin
      .from('transactions')
      .insert({
        kurir_id: profile.id,
        kurir_name: profile.name || profile.email,
        items: req.body.items,
        total_amount: Number(req.body.totalAmount ?? 0),
        type: 'sale',
      })
      .select()
      .single();
    if (error) throw error;
    res.json(data);
  } catch (err: any) {
    res.status(400).json({ error: err?.message ?? 'Failed to record sale' });
  }
});

app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error('[api error]', err);
  res.status(500).json({ error: 'Internal server error' });
});

if (process.env.NODE_ENV !== 'production') {
  app.listen(3001, () => console.log('[api] server running on :3001'));
}

export default app;
