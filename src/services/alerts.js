import { supabase } from '../lib/supabase';

export async function fetchAlerts(limit = 100) {
  const { data, error } = await supabase
    .from('alerts')
    .select('id,user_id,type,latitude,longitude,note,source,created_at,users(username)')
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) throw error;
  return data || [];
}

export async function createAlert(alert) {
  const { data, error } = await supabase.from('alerts').insert(alert).select('*').single();
  if (error) throw error;
  return data;
}
