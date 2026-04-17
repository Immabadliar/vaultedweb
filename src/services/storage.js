import { supabase } from '../lib/supabase';

export async function uploadToBucket(bucket, path, arrayBuffer, contentType = 'image/jpeg') {
  const { error } = await supabase.storage.from(bucket).upload(path, arrayBuffer, {
    contentType,
    upsert: true
  });

  if (error) throw error;

  const { data } = supabase.storage.from(bucket).getPublicUrl(path);
  return data.publicUrl;
}
