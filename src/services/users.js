import { supabase } from '../lib/supabase';

export async function getProfile(userId) {
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('id', userId)
    .single();

  if (error && error.code !== 'PGRST116') throw error;
  return data;
}

export async function upsertProfile(profile) {
  const { data, error } = await supabase
    .from('users')
    .upsert(profile)
    .select('*')
    .single();

  if (error) throw error;
  return data;
}

export async function usernameExists(username) {
  const { data, error } = await supabase
    .from('users')
    .select('id')
    .ilike('username', username)
    .maybeSingle();

  if (error && error.code !== 'PGRST116') throw error;
  return Boolean(data);
}
