import { supabase } from './supabase'

export async function uploadToBucket(bucket, path, file) {
  const { error } = await supabase.storage
    .from(bucket)
    .upload(path, file, {
      upsert: true,
      contentType: file.type || 'image/jpeg'
    })

  if (error) throw error

  const { data } = supabase.storage.from(bucket).getPublicUrl(path)
  return data.publicUrl
}
