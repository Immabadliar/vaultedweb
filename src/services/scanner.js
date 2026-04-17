import { supabase } from '../lib/supabase';

export async function fetchScannerSnapshot() {
  const { data, error } = await supabase.functions.invoke('scanner-ingest', {
    body: { mode: 'snapshot' }
  });

  if (error) throw error;
  return data;
}

export async function ingestScannerAlerts() {
  const { data, error } = await supabase.functions.invoke('scanner-ingest', {
    body: { mode: 'ingest' }
  });

  if (error) throw error;
  return data;
}
