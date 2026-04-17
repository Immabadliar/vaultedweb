import { supabase } from './supabase'

export async function getProfile(userId) {
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('id', userId)
    .single()

  if (error) throw error
  return data
}

export async function upsertProfile(profile) {
  const { error } = await supabase
    .from('users')
    .upsert(profile)

  if (error) throw error
}

export async function usernameExists(username) {
  const { data, error } = await supabase
    .from('users')
    .select('id')
    .eq('username', username)
    .maybeSingle()

  if (error) throw error
  return !!data
}
