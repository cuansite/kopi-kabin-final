import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import { apiRequest } from '../../services/api';
import { supabase } from '../../supabase';
import { handleFirestoreError, OperationType } from '../../utils/firestoreErrorHandler';
import { Trash2, UserPlus, MapPin, Pencil, Eye, EyeOff } from 'lucide-react';

const PROTECTED_EMAIL = 'admin@kopikabin.com';

interface StaffUser {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'kurir';
  status: 'active' | 'inactive';
  current_location?: string | null;
  last_password?: string | null;
  daily_target?: number | null;
}

export const UserManagement = () => {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState<StaffUser[]>([]);
  const [loading, setLoading] = useState(true);

  // Add user modal
  const [showAddModal, setShowAddModal] = useState(false);
  const [newEmail, setNewEmail] = useState('');
  const [newName, setNewName] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newConfirmPassword, setNewConfirmPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showNewConfirm, setShowNewConfirm] = useState(false);
  const [newRole, setNewRole] = useState<'admin' | 'kurir'>('kurir');
  const [addError, setAddError] = useState('');
  const [addLoading, setAddLoading] = useState(false);

  // Edit user modal
  const [editUser, setEditUser] = useState<StaffUser | null>(null);
  const [editName, setEditName] = useState('');
  const [editRole, setEditRole] = useState<'admin' | 'kurir'>('kurir');
  const [editStatus, setEditStatus] = useState<'active' | 'inactive'>('active');
  const [editDailyTarget, setEditDailyTarget] = useState<number | null>(null);
  const [editPassword, setEditPassword] = useState('');
  const [editConfirmPassword, setEditConfirmPassword] = useState('');
  const [showEditPassword, setShowEditPassword] = useState(false);
  const [showEditConfirm, setShowEditConfirm] = useState(false);
  const [editError, setEditError] = useState('');
  const [editLoading, setEditLoading] = useState(false);

  // View last password toggle (per user)
  const [visiblePasswordIds, setVisiblePasswordIds] = useState<Set<string>>(new Set());
  const togglePasswordVisibility = (userId: string) => {
    setVisiblePasswordIds(prev => {
      const next = new Set(prev);
      if (next.has(userId)) next.delete(userId);
      else next.add(userId);
      return next;
    });
  };

  // Location assignment
  const [editingLocationId, setEditingLocationId] = useState<string | null>(null);
  const [locationInput, setLocationInput] = useState('');

  const reloadRef = useRef<() => Promise<void>>();

  const reload = async () => {
    try {
      setUsers(await apiRequest<StaffUser[]>('/api/users'));
    } catch (error) {
      handleFirestoreError(error, OperationType.LIST, 'profiles');
    }
    setLoading(false);
  };

  reloadRef.current = reload;

  useEffect(() => {
    reload();

    // Subscribe to any INSERT / UPDATE / DELETE on the profiles table so all
    // admin sessions stay in sync without a manual page refresh.
    const channel = supabase
      .channel('admin-user-management')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'profiles' },
        async () => {
          const { data: { session } } = await supabase.auth.getSession();
          if (session) reloadRef.current?.();
        },
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  // ── Add user ────────────────────────────────────────────────────────────────
  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEmail || !newName || !newPassword) return;
    if (newPassword !== newConfirmPassword) {
      setAddError('Passwords do not match');
      return;
    }
    setAddError('');
    setAddLoading(true);
    try {
      await apiRequest('/api/users', {
        method: 'POST',
        body: JSON.stringify({ email: newEmail, name: newName, password: newPassword, role: newRole }),
      });
      setShowAddModal(false);
      setNewEmail(''); setNewName(''); setNewPassword(''); setNewConfirmPassword('');
      setShowNewPassword(false); setShowNewConfirm(false); setNewRole('kurir');
      await reload();
    } catch (err: any) {
      setAddError(err?.message || 'Failed to create user');
      handleFirestoreError(err, OperationType.CREATE, `profiles/${newEmail}`);
    } finally {
      setAddLoading(false);
    }
  };

  // ── Edit user ───────────────────────────────────────────────────────────────
  const openEdit = (u: StaffUser) => {
    setEditUser(u);
    setEditName(u.name);
    setEditRole(u.role);
    setEditStatus(u.status);
    setEditDailyTarget(u.daily_target ?? null);
    setEditPassword('');
    setEditConfirmPassword('');
    setShowEditPassword(false);
    setShowEditConfirm(false);
    setEditError('');
  };

  const handleEditUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editUser) return;
    if (editPassword && editPassword !== editConfirmPassword) {
      setEditError('Passwords do not match');
      return;
    }
    if (editPassword && editPassword.length < 8) {
      setEditError('Password must be at least 8 characters');
      return;
    }
    setEditError('');
    setEditLoading(true);
    try {
      const body: any = { name: editName, role: editRole, status: editStatus };
      if (editRole === 'kurir') body.daily_target = editDailyTarget;
      if (editPassword) body.password = editPassword;
      await apiRequest(`/api/users/${editUser.id}`, {
        method: 'PATCH',
        body: JSON.stringify(body),
      });

      // Supabase invalidates the session when a password is changed via the admin API.
      // If the logged-in admin just changed their own password, re-sign-in silently
      // with the new password so the session is restored and they stay on this page.
      if (editPassword && editUser.id === currentUser?.id) {
        await supabase.auth.signInWithPassword({
          email: editUser.email,
          password: editPassword,
        });
      }

      setEditUser(null);
      await reload();
    } catch (err: any) {
      setEditError(err?.message || 'Failed to update user');
    } finally {
      setEditLoading(false);
    }
  };

  // ── Delete user ─────────────────────────────────────────────────────────────
  const handleDeleteUser = async (id: string) => {
    if (!window.confirm('Delete this user? This cannot be undone.')) return;
    try {
      await apiRequest(`/api/users/${id}`, { method: 'DELETE' });
      reload();
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `profiles/${id}`);
    }
  };

  // ── Location ────────────────────────────────────────────────────────────────
  const openLocationEdit = (u: StaffUser) => {
    setEditingLocationId(u.id);
    setLocationInput(u.current_location ?? '');
  };

  const saveLocation = async (id: string) => {
    try {
      await apiRequest(`/api/users/${id}/location`, {
        method: 'PATCH',
        body: JSON.stringify({ location: locationInput.trim() || null }),
      });
      setEditingLocationId(null);
      reload();
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `profiles/${id}`);
    }
  };

  if (loading) return <div className="font-mono text-sm p-4">Loading...</div>;

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-6">
        <h2 className="text-3xl font-black uppercase text-[#003B73]">User Management</h2>
        <button
          onClick={() => { setShowAddModal(true); setAddError(''); }}
          className="bg-[#FDC500] text-[#003B73] px-4 py-2 font-bold uppercase border-[3px] border-black brutal-shadow hover:bg-black hover:text-[#FDC500] flex items-center gap-2 transition-colors"
        >
          <UserPlus size={18} /> Add User
        </button>
      </div>

      {/* Desktop table */}
      <div className="hidden md:block bg-white border-[4px] border-black shadow-[8px_8px_0px_#FDC500] overflow-hidden">
        <table className="w-full text-left font-mono text-sm">
          <thead className="bg-[#003B73] text-white border-b-[4px] border-black font-bold uppercase">
            <tr>
              <th className="p-4">Name</th>
              <th className="p-4">Email</th>
              <th className="p-4">Role</th>
              <th className="p-4">Status</th>
              <th className="p-4">Current Password</th>
              <th className="p-4">Location</th>
              <th className="p-4 text-center">Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id} className="border-b-[2px] border-gray-200 hover:bg-gray-50">
                <td className="p-4 font-bold text-[#003B73]">{u.name}</td>
                <td className="p-4">{u.email}</td>
                <td className="p-4">
                  <span className={`px-2 py-1 text-xs font-bold uppercase border-[2px] border-black ${u.role === 'admin' ? 'bg-red-400 text-white' : 'bg-blue-200'}`}>
                    {u.role}
                  </span>
                </td>
                <td className="p-4">
                  <span className={`px-2 py-1 text-xs font-bold uppercase ${u.status === 'active' ? 'text-green-600' : 'text-red-500'}`}>
                    {u.status}
                  </span>
                </td>
                <td className="p-4">
                  {u.last_password ? (
                    <div className="flex items-center gap-1">
                      <span className="font-mono text-xs">
                        {visiblePasswordIds.has(u.id) ? u.last_password : '••••••••'}
                      </span>
                      <button
                        onClick={() => togglePasswordVisibility(u.id)}
                        className="text-gray-400 hover:text-[#003B73] transition-colors"
                        title={visiblePasswordIds.has(u.id) ? 'Hide password' : 'Show password'}
                      >
                        {visiblePasswordIds.has(u.id) ? <EyeOff size={14} /> : <Eye size={14} />}
                      </button>
                    </div>
                  ) : (
                    <span className="text-xs text-gray-300 italic">Not set</span>
                  )}
                </td>
                <td className="p-4">
                  {u.role === 'kurir' ? (
                    editingLocationId === u.id ? (
                      <div className="flex gap-1">
                        <input
                          autoFocus
                          value={locationInput}
                          onChange={e => setLocationInput(e.target.value)}
                          onKeyDown={e => { if (e.key === 'Enter') saveLocation(u.id); if (e.key === 'Escape') setEditingLocationId(null); }}
                          className="border-[2px] border-black px-2 py-1 text-xs w-32 outline-none focus:border-[#003B73]"
                          placeholder="e.g. Metropolis Sq"
                        />
                        <button onClick={() => saveLocation(u.id)} className="px-2 py-1 bg-[#003B73] text-white text-xs font-bold border-[2px] border-black">Save</button>
                        <button onClick={() => setEditingLocationId(null)} className="px-2 py-1 bg-gray-200 text-xs font-bold border-[2px] border-black">✕</button>
                      </div>
                    ) : (
                      <button
                        onClick={() => openLocationEdit(u)}
                        className="flex items-center gap-1 text-xs text-gray-500 hover:text-[#003B73] transition-colors"
                      >
                        <MapPin size={12} />
                        {u.current_location ?? <span className="italic text-gray-400">Not set</span>}
                      </button>
                    )
                  ) : (
                    <span className="text-xs text-gray-300">—</span>
                  )}
                </td>
                <td className="p-4">
                  <div className="flex items-center justify-center gap-2">
                    <button
                      onClick={() => openEdit(u)}
                      className="p-2 bg-blue-100 text-blue-600 border-[2px] border-blue-200 hover:border-blue-600 transition-colors"
                      title="Edit user"
                    >
                      <Pencil size={16} />
                    </button>
                    {u.email !== PROTECTED_EMAIL && (
                      <button
                        onClick={() => handleDeleteUser(u.id)}
                        className="p-2 bg-red-100 text-red-600 border-[2px] border-red-200 hover:border-red-600 transition-colors"
                        title="Delete user"
                      >
                        <Trash2 size={16} />
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
            {users.length === 0 && (
              <tr>
                <td colSpan={7} className="p-4 text-center text-gray-500">No users found.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Mobile cards */}
      <div className="md:hidden flex flex-col gap-4">
        {users.map(u => (
          <div key={u.id} className="bg-white border-[4px] border-black p-4 shadow-[5px_5px_0px_#FDC500]">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="font-black text-lg text-[#003B73] break-words">{u.name}</p>
                <p className="font-mono text-xs text-gray-500 break-all">{u.email}</p>
              </div>
              <div className="flex gap-2 shrink-0">
                <button
                  onClick={() => openEdit(u)}
                  className="p-2 bg-blue-100 text-blue-600 border-[2px] border-blue-200"
                  title="Edit user"
                >
                  <Pencil size={16} />
                </button>
                {u.email !== PROTECTED_EMAIL && (
                  <button
                    onClick={() => handleDeleteUser(u.id)}
                    className="p-2 bg-red-100 text-red-600 border-[2px] border-red-200"
                    title="Delete user"
                  >
                    <Trash2 size={16} />
                  </button>
                )}
              </div>
            </div>
            <div className="flex gap-2 mt-3 flex-wrap">
              <span className={`px-2 py-1 text-xs font-bold uppercase border-[2px] border-black ${u.role === 'admin' ? 'bg-red-400 text-white' : 'bg-blue-200'}`}>
                {u.role}
              </span>
              <span className={`px-2 py-1 text-xs font-bold uppercase border-[2px] border-black ${u.status === 'active' ? 'text-green-600 bg-green-50' : 'text-red-500 bg-red-50'}`}>
                {u.status}
              </span>
            </div>
            {/* Current Password section */}
            <div className="mt-3 pt-3 border-t border-dashed border-gray-200">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-gray-500 uppercase">Current Password:</span>
                {u.last_password ? (
                  <div className="flex items-center gap-1">
                    <span className="font-mono text-xs text-[#003B73]">
                      {visiblePasswordIds.has(u.id) ? u.last_password : '••••••••'}
                    </span>
                    <button
                      onClick={() => togglePasswordVisibility(u.id)}
                      className="text-gray-400 hover:text-[#003B73] transition-colors"
                    >
                      {visiblePasswordIds.has(u.id) ? <EyeOff size={14} /> : <Eye size={14} />}
                    </button>
                  </div>
                ) : (
                  <span className="text-xs text-gray-300 italic">Not set</span>
                )}
              </div>
            </div>
            {u.role === 'kurir' && (
              <div className="mt-3 pt-3 border-t border-dashed border-gray-200">
                {editingLocationId === u.id ? (
                  <div className="flex gap-1">
                    <input
                      autoFocus
                      value={locationInput}
                      onChange={e => setLocationInput(e.target.value)}
                      onKeyDown={e => { if (e.key === 'Enter') saveLocation(u.id); if (e.key === 'Escape') setEditingLocationId(null); }}
                      className="flex-1 border-[2px] border-black px-2 py-1 text-xs outline-none"
                      placeholder="Location"
                    />
                    <button onClick={() => saveLocation(u.id)} className="px-2 py-1 bg-[#003B73] text-white text-xs font-bold border-[2px] border-black">Save</button>
                    <button onClick={() => setEditingLocationId(null)} className="px-2 py-1 bg-gray-200 text-xs font-bold border-[2px] border-black">✕</button>
                  </div>
                ) : (
                  <button onClick={() => openLocationEdit(u)} className="flex items-center gap-2 text-xs text-gray-600 hover:text-[#003B73] transition-colors">
                    <MapPin size={12} />
                    <span>{u.current_location ?? <span className="italic text-gray-400">Set location</span>}</span>
                  </button>
                )}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* ── Add User Modal ─────────────────────────────────────────────────── */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white border-[6px] border-black p-6 w-full max-w-md shadow-[12px_12px_0px_#FDC500]">
            <h3 className="text-2xl font-black uppercase text-[#003B73] mb-4">Add User</h3>
            {addError && (
              <div className="mb-3 p-3 bg-red-100 border-[2px] border-red-500 text-red-700 font-mono text-sm font-bold">
                {addError}
              </div>
            )}
            <form onSubmit={handleAddUser} className="flex flex-col gap-4 font-mono">
              <div>
                <label className="block text-xs font-bold mb-1">Email</label>
                <input
                  type="email"
                  required
                  value={newEmail}
                  onChange={e => setNewEmail(e.target.value)}
                  className="w-full border-[3px] border-black p-2 outline-none focus:border-[#003B73]"
                  placeholder="user@example.com"
                />
              </div>
              <div>
                <label className="block text-xs font-bold mb-1">Display Name</label>
                <input
                  required
                  value={newName}
                  onChange={e => setNewName(e.target.value)}
                  className="w-full border-[3px] border-black p-2 outline-none focus:border-[#003B73]"
                  placeholder="Full name"
                />
              </div>
              <div>
                <label className="block text-xs font-bold mb-1">Password <span className="font-normal text-gray-400">(min 8 characters)</span></label>
                <div className="relative">
                  <input
                    type={showNewPassword ? 'text' : 'password'}
                    required
                    minLength={8}
                    value={newPassword}
                    onChange={e => setNewPassword(e.target.value)}
                    className="w-full border-[3px] border-black p-2 pr-10 outline-none focus:border-[#003B73]"
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(v => !v)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 hover:text-[#003B73]"
                    tabIndex={-1}
                  >
                    {showNewPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold mb-1">Confirm Password</label>
                <div className="relative">
                  <input
                    type={showNewConfirm ? 'text' : 'password'}
                    required
                    minLength={8}
                    value={newConfirmPassword}
                    onChange={e => setNewConfirmPassword(e.target.value)}
                    className={`w-full border-[3px] p-2 pr-10 outline-none focus:border-[#003B73] ${newConfirmPassword && newPassword !== newConfirmPassword ? 'border-red-500 bg-red-50' : 'border-black'}`}
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewConfirm(v => !v)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 hover:text-[#003B73]"
                    tabIndex={-1}
                  >
                    {showNewConfirm ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
                {newConfirmPassword && newPassword !== newConfirmPassword && (
                  <p className="text-red-500 text-xs mt-1 font-bold">Passwords do not match</p>
                )}
              </div>
              <div>
                <label className="block text-xs font-bold mb-1">Role</label>
                <select
                  value={newRole}
                  onChange={e => setNewRole(e.target.value as 'admin' | 'kurir')}
                  className="w-full border-[3px] border-black p-2 outline-none font-bold uppercase"
                >
                  <option value="kurir">Kurir (Courier)</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
              <div className="flex gap-4 mt-2">
                <button
                  type="submit"
                  disabled={addLoading}
                  className="flex-grow bg-[#003B73] text-white font-bold py-3 uppercase border-[3px] border-black hover:bg-[#FDC500] hover:text-black transition-colors disabled:opacity-50"
                >
                  {addLoading ? 'Creating...' : 'Create User'}
                </button>
                <button
                  type="button"
                  onClick={() => { setShowAddModal(false); setAddError(''); }}
                  className="flex-grow bg-gray-200 text-black font-bold py-3 uppercase border-[3px] border-black hover:bg-gray-300 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Edit User Modal ────────────────────────────────────────────────── */}
      {editUser && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white border-[6px] border-black p-6 w-full max-w-md shadow-[12px_12px_0px_#FDC500]">
            <h3 className="text-2xl font-black uppercase text-[#003B73] mb-1">Edit User</h3>
            <p className="font-mono text-xs text-gray-500 mb-4">{editUser.email}</p>
            {editError && (
              <div className="mb-3 p-3 bg-red-100 border-[2px] border-red-500 text-red-700 font-mono text-sm font-bold">
                {editError}
              </div>
            )}
            <form onSubmit={handleEditUser} className="flex flex-col gap-4 font-mono">
              <div>
                <label className="block text-xs font-bold mb-1">Display Name</label>
                <input
                  required
                  value={editName}
                  onChange={e => setEditName(e.target.value)}
                  className="w-full border-[3px] border-black p-2 outline-none focus:border-[#003B73]"
                />
              </div>
              <div>
                <label className="block text-xs font-bold mb-1">Role</label>
                <select
                  value={editRole}
                  onChange={e => setEditRole(e.target.value as 'admin' | 'kurir')}
                  disabled={editUser.email === PROTECTED_EMAIL}
                  className="w-full border-[3px] border-black p-2 outline-none font-bold uppercase disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <option value="kurir">Kurir (Courier)</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold mb-1">Status</label>
                <select
                  value={editStatus}
                  onChange={e => setEditStatus(e.target.value as 'active' | 'inactive')}
                  disabled={editUser.email === PROTECTED_EMAIL}
                  className="w-full border-[3px] border-black p-2 outline-none font-bold uppercase disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>
              {editRole === 'kurir' && (
                <div>
                  <label className="block text-xs font-bold mb-1">Daily Sales Target (Rp) <span className="font-normal text-gray-400">(leave empty for no target)</span></label>
                  <input
                    type="number"
                    min={0}
                    value={editDailyTarget ?? ''}
                    onChange={e => setEditDailyTarget(e.target.value ? Number(e.target.value) : null)}
                    className="w-full border-[3px] border-black p-2 outline-none focus:border-[#003B73]"
                    placeholder="e.g. 500000"
                  />
                </div>
              )}
              <div>
                <label className="block text-xs font-bold mb-1">New Password <span className="font-normal text-gray-400">(leave blank to keep current)</span></label>
                <div className="relative">
                  <input
                    type={showEditPassword ? 'text' : 'password'}
                    minLength={8}
                    value={editPassword}
                    onChange={e => { setEditPassword(e.target.value); if (!e.target.value) setEditConfirmPassword(''); }}
                    className="w-full border-[3px] border-black p-2 pr-10 outline-none focus:border-[#003B73]"
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    onClick={() => setShowEditPassword(v => !v)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 hover:text-[#003B73]"
                    tabIndex={-1}
                  >
                    {showEditPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold mb-1">Confirm New Password</label>
                <div className="relative">
                  <input
                    type={showEditConfirm ? 'text' : 'password'}
                    minLength={editPassword ? 8 : undefined}
                    value={editConfirmPassword}
                    onChange={e => setEditConfirmPassword(e.target.value)}
                    disabled={!editPassword}
                    className={`w-full border-[3px] p-2 pr-10 outline-none focus:border-[#003B73] disabled:opacity-40 disabled:cursor-not-allowed disabled:bg-gray-50 ${editPassword && editConfirmPassword && editPassword !== editConfirmPassword ? 'border-red-500 bg-red-50' : 'border-black'}`}
                    placeholder={editPassword ? '••••••••' : 'Enter new password first'}
                  />
                  <button
                    type="button"
                    onClick={() => setShowEditConfirm(v => !v)}
                    disabled={!editPassword}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 hover:text-[#003B73] disabled:opacity-40 disabled:cursor-not-allowed"
                    tabIndex={-1}
                  >
                    {showEditConfirm ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
                {editPassword && editConfirmPassword && editPassword !== editConfirmPassword && (
                  <p className="text-red-500 text-xs mt-1 font-bold">Passwords do not match</p>
                )}
                {editPassword && editConfirmPassword && editPassword === editConfirmPassword && (
                  <p className="text-green-600 text-xs mt-1 font-bold">✓ Passwords match</p>
                )}
              </div>
              <div className="flex gap-4 mt-2">
                <button
                  type="submit"
                  disabled={editLoading}
                  className="flex-grow bg-[#003B73] text-white font-bold py-3 uppercase border-[3px] border-black hover:bg-[#FDC500] hover:text-black transition-colors disabled:opacity-50"
                >
                  {editLoading ? 'Saving...' : 'Save Changes'}
                </button>
                <button
                  type="button"
                  onClick={() => setEditUser(null)}
                  className="flex-grow bg-gray-200 text-black font-bold py-3 uppercase border-[3px] border-black hover:bg-gray-300 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
