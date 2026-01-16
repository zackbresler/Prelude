import { useState, useEffect } from 'react';
import { useAuthStore } from '@/store/authStore';
import { AdminUser, listUsers, createUser, updateUser, deleteUser } from '@/api/admin';
import { ApiError } from '@/api/client';
import { Button } from '@/components/common';
import { format } from 'date-fns';

interface UserFormData {
  email: string;
  password: string;
  name: string;
  role: 'USER' | 'ADMIN';
}

export function AdminDashboard({ onClose }: { onClose: () => void }) {
  const { user: currentUser } = useAuthStore();
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingUser, setEditingUser] = useState<AdminUser | null>(null);
  const [formData, setFormData] = useState<UserFormData>({
    email: '',
    password: '',
    name: '',
    role: 'USER',
  });
  const [formError, setFormError] = useState('');

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    setIsLoading(true);
    try {
      const data = await listUsers();
      setUsers(data);
      setError('');
    } catch (err) {
      setError('Failed to load users');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    try {
      await createUser(formData);
      await loadUsers();
      setShowCreateForm(false);
      setFormData({ email: '', password: '', name: '', role: 'USER' });
    } catch (err) {
      if (err instanceof ApiError) {
        setFormError(err.message);
      } else {
        setFormError('Failed to create user');
      }
    }
  };

  const handleUpdateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;
    setFormError('');
    try {
      const updates: Parameters<typeof updateUser>[1] = {
        email: formData.email,
        name: formData.name,
        role: formData.role,
      };
      if (formData.password) {
        updates.password = formData.password;
      }
      await updateUser(editingUser.id, updates);
      await loadUsers();
      setEditingUser(null);
      setFormData({ email: '', password: '', name: '', role: 'USER' });
    } catch (err) {
      if (err instanceof ApiError) {
        setFormError(err.message);
      } else {
        setFormError('Failed to update user');
      }
    }
  };

  const handleDeleteUser = async (user: AdminUser) => {
    if (!confirm(`Are you sure you want to delete ${user.name}? This will also delete all their projects.`)) {
      return;
    }
    try {
      await deleteUser(user.id);
      await loadUsers();
    } catch (err) {
      if (err instanceof ApiError) {
        alert(err.message);
      } else {
        alert('Failed to delete user');
      }
    }
  };

  const startEditing = (user: AdminUser) => {
    setEditingUser(user);
    setFormData({
      email: user.email,
      password: '',
      name: user.name,
      role: user.role,
    });
    setFormError('');
  };

  const cancelForm = () => {
    setShowCreateForm(false);
    setEditingUser(null);
    setFormData({ email: '', password: '', name: '', role: 'USER' });
    setFormError('');
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-surface-300 rounded-xl shadow-2xl border border-surface-100 w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-surface-100 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-gray-100 font-display">User Management</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-200 transition-colors">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto p-6">
          {error && (
            <div className="mb-4 bg-red-500/10 border border-red-500/50 text-red-400 px-4 py-3 rounded-lg">
              {error}
            </div>
          )}

          {/* Create/Edit Form */}
          {(showCreateForm || editingUser) && (
            <div className="mb-6 bg-surface-200 rounded-lg border border-surface-100 p-4">
              <h3 className="text-lg font-medium text-gray-100 mb-4">
                {editingUser ? 'Edit User' : 'Create New User'}
              </h3>
              <form onSubmit={editingUser ? handleUpdateUser : handleCreateUser}>
                {formError && (
                  <div className="mb-4 bg-red-500/10 border border-red-500/50 text-red-400 px-3 py-2 rounded text-sm">
                    {formError}
                  </div>
                )}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="label">Name</label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="input"
                      required
                    />
                  </div>
                  <div>
                    <label className="label">Email</label>
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="input"
                      required
                    />
                  </div>
                  <div>
                    <label className="label">
                      Password {editingUser && <span className="text-gray-500">(leave blank to keep current)</span>}
                    </label>
                    <input
                      type="password"
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      className="input"
                      required={!editingUser}
                      minLength={6}
                    />
                  </div>
                  <div>
                    <label className="label">Role</label>
                    <select
                      value={formData.role}
                      onChange={(e) => setFormData({ ...formData, role: e.target.value as 'USER' | 'ADMIN' })}
                      className="input"
                    >
                      <option value="USER">User</option>
                      <option value="ADMIN">Admin</option>
                    </select>
                  </div>
                </div>
                <div className="mt-4 flex gap-2">
                  <Button type="submit">{editingUser ? 'Save Changes' : 'Create User'}</Button>
                  <Button type="button" variant="secondary" onClick={cancelForm}>
                    Cancel
                  </Button>
                </div>
              </form>
            </div>
          )}

          {/* Actions */}
          {!showCreateForm && !editingUser && (
            <div className="mb-4">
              <Button onClick={() => setShowCreateForm(true)}>Add User</Button>
            </div>
          )}

          {/* Users Table */}
          {isLoading ? (
            <div className="text-center py-8">
              <div className="w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full animate-spin mx-auto" />
              <p className="text-gray-500 mt-4">Loading users...</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-surface-100">
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-400">Name</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-400">Email</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-400">Role</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-400">Projects</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-400">Created</th>
                    <th className="text-right py-3 px-4 text-sm font-medium text-gray-400">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((user) => (
                    <tr key={user.id} className="border-b border-surface-100 hover:bg-surface-200/50">
                      <td className="py-3 px-4">
                        <span className="text-gray-100">{user.name}</span>
                        {user.id === currentUser?.id && (
                          <span className="ml-2 text-xs text-primary-400">(you)</span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-gray-300">{user.email}</td>
                      <td className="py-3 px-4">
                        <span
                          className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${
                            user.role === 'ADMIN'
                              ? 'bg-primary-500/20 text-primary-400'
                              : 'bg-gray-500/20 text-gray-400'
                          }`}
                        >
                          {user.role}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-gray-400">{user.projectCount}</td>
                      <td className="py-3 px-4 text-gray-500 text-sm">
                        {format(new Date(user.createdAt), 'MMM d, yyyy')}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={() => startEditing(user)}
                            className="text-gray-400 hover:text-gray-200 transition-colors"
                            title="Edit"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                          </button>
                          {user.id !== currentUser?.id && (
                            <button
                              onClick={() => handleDeleteUser(user)}
                              className="text-gray-400 hover:text-red-400 transition-colors"
                              title="Delete"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
