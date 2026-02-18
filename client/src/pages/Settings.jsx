import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAccounts } from '../utils/AccountManager';
import { SyncService } from '../utils/CachedDataService';
import { useAuth } from '../App';
import { auth } from '../lib/supabase';

// Helper function to get clean display name for account
const getAccountDisplayName = (account) => {
  if (!account) return 'Unknown';
  
  // If account_name exists and is NOT an email, use it
  if (account.account_name && !account.account_name.includes('@')) {
    return account.account_name;
  }
  
  // Extract name from email (e.g., "arla.ops@..." -> "Arla")
  const emailOrName = account.account_name || account.seller_id || '';
  if (emailOrName.includes('@')) {
    const namePart = emailOrName.split('@')[0]; // "arla.ops"
    const firstName = namePart.split('.')[0]; // "arla"
    return firstName.charAt(0).toUpperCase() + firstName.slice(1); // "Arla"
  }
  
  // Fallback to seller_id
  return account.seller_id || 'Account';
};

export default function Settings({ apiUrl }) {
  const navigate = useNavigate();
  const { accounts, loading: accountsLoading, refresh: refreshAccounts, removeAccount } = useAccounts();
  const { isAdmin, role, userProfile, hasPageAccess } = useAuth();
  
  const [syncStatus, setSyncStatus] = useState(null);
  const [loadingSyncStatus, setLoadingSyncStatus] = useState(true);
  const [removingAccount, setRemovingAccount] = useState(null);
  
  // Account edit modal state
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editingAccount, setEditingAccount] = useState(null);
  const [editForm, setEditForm] = useState({ account_name: '' });
  const [saving, setSaving] = useState(false);
  
  // Account action dropdown state
  const [openDropdown, setOpenDropdown] = useState(null);

  // Redirect if no access
  useEffect(() => {
    if (!hasPageAccess('settings')) {
      navigate('/orders', { replace: true });
    }
  }, [hasPageAccess, navigate]);

  // Fetch sync status on mount
  useEffect(() => {
    fetchSyncStatus();
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (!event.target.closest('.account-dropdown')) {
        setOpenDropdown(null);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const fetchSyncStatus = async () => {
    setLoadingSyncStatus(true);
    try {
      const result = await SyncService.getStatus();
      if (result.success) {
        setSyncStatus(result.data);
      }
    } catch (err) {
      console.error('Failed to fetch sync status:', err);
    } finally {
      setLoadingSyncStatus(false);
    }
  };

  const handleAddStore = () => {
    navigate('/lazada-auth');
  };

  // Open edit modal
  const handleEditAccount = (account) => {
    setEditingAccount(account);
    setEditForm({
      account_name: getAccountDisplayName(account),
    });
    setEditModalOpen(true);
    setOpenDropdown(null);
  };

  // Save account changes
  const handleSaveAccount = async () => {
    if (!editingAccount) return;
    
    setSaving(true);
    try {
      const token = await auth.getAccessToken();
      const response = await fetch(`${apiUrl}/accounts/${editingAccount.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          account_name: editForm.account_name,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to update account');
      }

      await refreshAccounts();
      setEditModalOpen(false);
      setEditingAccount(null);
      alert('Account updated successfully');
    } catch (err) {
      alert('Failed to update account: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  // Deactivate account (soft delete)
  const handleDeactivateAccount = async (account) => {
    if (!window.confirm(`Are you sure you want to deactivate "${getAccountDisplayName(account)}"?\n\nThis will hide the account but keep the data. You can reactivate it later.`)) {
      return;
    }

    setRemovingAccount(account.id);
    setOpenDropdown(null);
    
    try {
      const token = await auth.getAccessToken();
      const response = await fetch(`${apiUrl}/accounts/${account.id}/deactivate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to deactivate account');
      }

      await refreshAccounts();
      alert('Account deactivated successfully');
    } catch (err) {
      alert('Failed to deactivate account: ' + err.message);
    } finally {
      setRemovingAccount(null);
    }
  };

  // Delete account permanently
  const handleDeleteAccount = async (account) => {
    const confirmText = `Are you sure you want to PERMANENTLY DELETE "${getAccountDisplayName(account)}"?\n\n⚠️ This action cannot be undone!\n\nAll cached data for this account will also be deleted.`;
    
    if (!window.confirm(confirmText)) {
      return;
    }

    // Double confirmation for permanent delete
    const doubleConfirm = window.prompt('Type "DELETE" to confirm permanent deletion:');
    if (doubleConfirm !== 'DELETE') {
      alert('Deletion cancelled');
      return;
    }

    setRemovingAccount(account.id);
    setOpenDropdown(null);
    
    try {
      const token = await auth.getAccessToken();
      const response = await fetch(`${apiUrl}/accounts/${account.id}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to delete account');
      }

      await refreshAccounts();
      alert('Account deleted permanently');
    } catch (err) {
      alert('Failed to delete account: ' + err.message);
    } finally {
      setRemovingAccount(null);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Never';
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getTimeSince = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
  };

  // Check if token is expired or expiring soon
  const getTokenStatus = (account) => {
    if (!account.token_expires_at) return { status: 'unknown', label: 'Unknown' };
    
    const expiresAt = new Date(account.token_expires_at);
    const now = new Date();
    const hoursUntilExpiry = (expiresAt - now) / (1000 * 60 * 60);
    
    if (hoursUntilExpiry <= 0) {
      return { status: 'expired', label: 'Expired', color: 'red' };
    } else if (hoursUntilExpiry <= 24) {
      return { status: 'expiring', label: 'Expiring Soon', color: 'yellow' };
    } else {
      return { status: 'active', label: 'Active', color: 'green' };
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Settings</h1>

      {/* Connected Stores Section */}
      <div className="bg-white rounded-lg shadow-md mb-6">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Connected Stores</h2>
              <p className="text-sm text-gray-500 mt-1">
                {isAdmin ? 'Manage your Lazada seller accounts' : 'View connected Lazada seller accounts'}
              </p>
            </div>
            {isAdmin && (
              <button
                onClick={handleAddStore}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                Add Store
              </button>
            )}
          </div>
          {!isAdmin && (
            <div className="mt-2 p-2 bg-yellow-50 border border-yellow-200 rounded text-sm text-yellow-700">
              Only administrators can add, edit, or remove stores.
            </div>
          )}
        </div>

        <div className="p-6">
          {accountsLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : accounts.length === 0 ? (
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              </div>
              <p className="text-gray-600 mb-4">No stores connected yet</p>
              {isAdmin && (
                <button
                  onClick={handleAddStore}
                  className="text-blue-600 hover:text-blue-700 font-medium"
                >
                  Connect your first Lazada store →
                </button>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              {accounts.map((account) => {
                const tokenStatus = getTokenStatus(account);
                return (
                  <div
                    key={account.id}
                    className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200 hover:border-gray-300 transition"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-lg">
                        {getAccountDisplayName(account).charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">
                          {getAccountDisplayName(account)}
                        </p>
                        <div className="flex items-center gap-2 mt-1 flex-wrap">
                          <span className="text-xs px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full uppercase font-medium">
                            {account.country}
                          </span>
                          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                            tokenStatus.color === 'green' ? 'bg-green-100 text-green-700' :
                            tokenStatus.color === 'yellow' ? 'bg-yellow-100 text-yellow-700' :
                            tokenStatus.color === 'red' ? 'bg-red-100 text-red-700' :
                            'bg-gray-100 text-gray-700'
                          }`}>
                            {tokenStatus.label}
                          </span>
                          <span className="text-xs text-gray-500">
                            Seller ID: {account.seller_id}
                          </span>
                        </div>
                        <p className="text-xs text-gray-400 mt-1">
                          Added {formatDate(account.created_at)}
                        </p>
                      </div>
                    </div>
                    
                    {/* Actions dropdown - Admin only */}
                    {isAdmin && (
                      <div className="relative account-dropdown">
                        <button
                          onClick={() => setOpenDropdown(openDropdown === account.id ? null : account.id)}
                          disabled={removingAccount === account.id}
                          className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-200 rounded-lg transition disabled:opacity-50"
                        >
                          {removingAccount === account.id ? (
                            <svg className="w-5 h-5 animate-spin" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                            </svg>
                          ) : (
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
                            </svg>
                          )}
                        </button>
                        
                        {/* Dropdown menu */}
                        {openDropdown === account.id && (
                          <div className="absolute right-0 mt-2 w-48 rounded-lg shadow-lg bg-white ring-1 ring-black ring-opacity-5 z-10">
                            <div className="py-1">
                              <button
                                onClick={() => handleEditAccount(account)}
                                className="flex items-center gap-2 w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                </svg>
                                Edit Account
                              </button>
                              <button
                                onClick={() => handleDeactivateAccount(account)}
                                className="flex items-center gap-2 w-full px-4 py-2 text-sm text-yellow-700 hover:bg-yellow-50"
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                                </svg>
                                Deactivate
                              </button>
                              <div className="border-t border-gray-100 my-1"></div>
                              <button
                                onClick={() => handleDeleteAccount(account)}
                                className="flex items-center gap-2 w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                                Delete Permanently
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Sync Status Section */}
      <div className="bg-white rounded-lg shadow-md mb-6">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Sync Status</h2>
              <p className="text-sm text-gray-500 mt-1">Data synchronization information</p>
            </div>
            <button
              onClick={() => navigate('/sync')}
              className="text-sm text-blue-600 hover:text-blue-700 font-medium"
            >
              Open Sync Dashboard →
            </button>
          </div>
        </div>

        <div className="p-6">
          {loadingSyncStatus ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Last Sync Info */}
              <div className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg p-4 border border-purple-200">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                    <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">Last Sync</p>
                    <p className="text-sm text-gray-600">
                      {syncStatus?.settings?.last_sync_at 
                        ? formatDate(syncStatus.settings.last_sync_at)
                        : 'Never synced'}
                    </p>
                  </div>
                </div>
                {syncStatus?.settings?.last_sync_at && (
                  <p className="text-sm text-purple-600 font-medium">
                    {getTimeSince(syncStatus.settings.last_sync_at)}
                  </p>
                )}
              </div>

              {/* Sync Stats Grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-gray-50 rounded-lg p-4 text-center">
                  <p className="text-2xl font-bold text-blue-600">
                    {syncStatus?.data_counts?.orders || 0}
                  </p>
                  <p className="text-sm text-gray-600">Cached Orders</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-4 text-center">
                  <p className="text-2xl font-bold text-green-600">
                    {syncStatus?.data_counts?.campaigns || 0}
                  </p>
                  <p className="text-sm text-gray-600">Campaigns</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-4 text-center">
                  <p className="text-2xl font-bold text-purple-600">
                    {syncStatus?.data_counts?.campaign_metrics || 0}
                  </p>
                  <p className="text-sm text-gray-600">Metric Records</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-4 text-center">
                  <p className="text-2xl font-bold text-orange-600">
                    {syncStatus?.recent_logs?.length || 0}
                  </p>
                  <p className="text-sm text-gray-600">Recent Syncs</p>
                </div>
              </div>

              {/* Recent Sync Logs */}
              {syncStatus?.recent_logs && syncStatus.recent_logs.length > 0 && (
                <div>
                  <h3 className="text-sm font-medium text-gray-700 mb-3">Recent Sync Activity</h3>
                  <div className="space-y-2">
                    {syncStatus.recent_logs.slice(0, 5).map((log, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between py-2 px-3 bg-gray-50 rounded-lg text-sm"
                      >
                        <div className="flex items-center gap-2">
                          <span className={`w-2 h-2 rounded-full ${
                            log.status === 'completed' ? 'bg-green-500' :
                            log.status === 'failed' ? 'bg-red-500' : 'bg-yellow-500'
                          }`}></span>
                          <span className="text-gray-900 capitalize">{log.sync_type?.replace('_', ' ')}</span>
                        </div>
                        <div className="flex items-center gap-4">
                          {log.records_synced > 0 && (
                            <span className="text-gray-500">{log.records_synced} records</span>
                          )}
                          <span className="text-gray-400">{getTimeSince(log.completed_at || log.started_at)}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* About Section */}
      <div className="bg-white rounded-lg shadow-md mb-6">
        <div className="p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">About</h2>
          <div className="space-y-3 text-sm text-gray-600">
            <p><strong>CLL Sellercenter</strong> - Lazada Seller Management Dashboard</p>
            <p>Version 2.0 with Data Caching System</p>
            <div className="pt-3 border-t border-gray-200">
              <p className="text-xs text-gray-400">
                Data is cached locally for faster performance. Use the Sync button to fetch fresh data from Lazada.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Your Profile Section */}
      <div className="bg-white rounded-lg shadow-md">
        <div className="p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Your Profile</h2>
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-2xl">
              {userProfile?.full_name?.charAt(0)?.toUpperCase() || userProfile?.email?.charAt(0)?.toUpperCase() || 'U'}
            </div>
            <div>
              <p className="text-lg font-medium text-gray-900">{userProfile?.full_name || 'User'}</p>
              <p className="text-sm text-gray-500">{userProfile?.email}</p>
              <span className={`mt-2 inline-block px-2 py-1 text-xs font-medium rounded-full ${
                role === 'admin' ? 'bg-red-100 text-red-700' :
                role === 'warehouse' ? 'bg-blue-100 text-blue-700' :
                role === 'marketing' ? 'bg-green-100 text-green-700' :
                'bg-gray-100 text-gray-700'
              }`}>
                {role?.charAt(0).toUpperCase() + role?.slice(1)}
              </span>
            </div>
          </div>
          
          <div className="mt-4 pt-4 border-t border-gray-200">
            <h3 className="text-sm font-medium text-gray-700 mb-2">Your Access</h3>
            <div className="text-sm text-gray-600">
              {role === 'admin' && (
                <p>Full access to all features including user management and store settings.</p>
              )}
              {role === 'warehouse' && (
                <p>Access to Orders and Fast Fulfilment pages. Cannot add stores or manage users.</p>
              )}
              {role === 'marketing' && (
                <p>Access to Data Insights page. Cannot add stores or manage users.</p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Edit Account Modal */}
      {editModalOpen && editingAccount && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">Edit Account</h3>
                <button
                  onClick={() => {
                    setEditModalOpen(false);
                    setEditingAccount(null);
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
            
            <div className="p-6 space-y-4">
              {/* Account Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Account Name
                </label>
                <input
                  type="text"
                  value={editForm.account_name}
                  onChange={(e) => setEditForm({ ...editForm, account_name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Enter account name"
                />
              </div>

              {/* Read-only fields */}
              <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Seller ID:</span>
                  <span className="font-medium text-gray-900">{editingAccount.seller_id}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Country:</span>
                  <span className="font-medium text-gray-900 uppercase">{editingAccount.country}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Created:</span>
                  <span className="font-medium text-gray-900">{formatDate(editingAccount.created_at)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Token Expires:</span>
                  <span className="font-medium text-gray-900">{formatDate(editingAccount.token_expires_at)}</span>
                </div>
              </div>
            </div>

            <div className="p-6 border-t border-gray-200 flex justify-end gap-3">
              <button
                onClick={() => {
                  setEditModalOpen(false);
                  setEditingAccount(null);
                }}
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveAccount}
                disabled={saving}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50"
              >
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}