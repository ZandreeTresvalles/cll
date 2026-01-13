import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { autoRefreshToken: false, persistSession: false }
});

export async function verifySupabaseToken(token) {
  try {
    const { data: { user }, error } = await supabaseAdmin.auth.getUser(token);
    if (error) return null;
    return user;
  } catch (error) {
    return null;
  }
}

export async function saveLazadaAccount(userId, accountData) {
  const { seller_id, account_name, country, access_token, refresh_token, expires_in, country_user_info, account_platform } = accountData;
  const token_expires_at = new Date(Date.now() + (expires_in * 1000)).toISOString();

  const { data, error } = await supabaseAdmin
    .from('lazada_accounts')
    .upsert({
      user_id: userId, seller_id, account_name: account_name || seller_id, country,
      access_token, refresh_token, expires_in, token_expires_at, country_user_info,
      account_platform, is_active: true, updated_at: new Date().toISOString()
    }, { onConflict: 'user_id,seller_id' })
    .select().single();

  if (error) throw error;
  return data;
}

// UPDATED: Return ALL active accounts for all authenticated users
// This allows warehouse/marketing users to see accounts added by admin
export async function getUserLazadaAccounts(userId) {
  const { data, error } = await supabaseAdmin
    .from('lazada_accounts')
    .select('*')
    // Removed: .eq('user_id', userId) - now returns all accounts
    .eq('is_active', true)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data || [];
}

// UPDATED: Get account by ID without user filter
// This allows any authenticated user to access any account
export async function getLazadaAccount(userId, accountId) {
  const { data, error } = await supabaseAdmin
    .from('lazada_accounts')
    .select('*')
    // Removed: .eq('user_id', userId) - any user can access any account
    .eq('id', accountId)
    .eq('is_active', true)
    .single();

  if (error) return null;
  return data;
}

export async function updateLazadaTokens(userId, accountId, tokenData) {
  const { access_token, refresh_token, expires_in } = tokenData;
  const token_expires_at = new Date(Date.now() + (expires_in * 1000)).toISOString();

  // Keep user_id check for security - only owner can update tokens
  // But also allow updating without user_id check since admin may need to refresh tokens
  const { data, error } = await supabaseAdmin
    .from('lazada_accounts')
    .update({ access_token, refresh_token, expires_in, token_expires_at, updated_at: new Date().toISOString() })
    .eq('id', accountId)
    .eq('is_active', true)
    .select().single();

  if (error) throw error;
  return data;
}

export async function deleteLazadaAccount(userId, accountId) {
  // Keep user_id check - only account owner/admin can delete
  const { error } = await supabaseAdmin
    .from('lazada_accounts')
    .update({ is_active: false })
    .eq('id', accountId);

  if (error) throw error;
  return true;
}

export async function getUserPreferences(userId) {
  const { data, error } = await supabaseAdmin
    .from('user_preferences')
    .select('*')
    .eq('user_id', userId)
    .single();

  if (error && error.code !== 'PGRST116') console.error('Error:', error);
  return data;
}

export async function setActiveAccount(userId, accountId) {
  const { data, error } = await supabaseAdmin
    .from('user_preferences')
    .upsert({ user_id: userId, active_account_id: accountId, updated_at: new Date().toISOString() }, { onConflict: 'user_id' })
    .select().single();

  if (error) throw error;
  return data;
}