import { supabase } from '../lib/supabase';
import { PAGE_SIZE } from '../lib/constants';

export async function fetchPosts({ page = 0, pageSize = PAGE_SIZE }) {
  const from = page * pageSize;
  const to = from + pageSize - 1;

  const { data, error } = await supabase
    .from('posts')
    .select('id,user_id,image_url,caption,location,created_at,users(id,username,avatar_url),likes(user_id),comments(id)')
    .order('created_at', { ascending: false })
    .range(from, to);

  if (error) throw error;
  return data || [];
}

export async function createPost(post) {
  const { data, error } = await supabase.from('posts').insert(post).select('*').single();
  if (error) throw error;
  return data;
}

export async function toggleLike({ postId, userId, liked }) {
  if (liked) {
    const { error } = await supabase.from('likes').delete().eq('post_id', postId).eq('user_id', userId);
    if (error) throw error;
    return;
  }

  const { error } = await supabase.from('likes').insert({ post_id: postId, user_id: userId });
  if (error) throw error;
}

export async function fetchComments(postId) {
  const { data, error } = await supabase
    .from('comments')
    .select('id,post_id,user_id,text,created_at,users(id,username,avatar_url)')
    .eq('post_id', postId)
    .order('created_at', { ascending: true });

  if (error) throw error;
  return data || [];
}

export async function createComment(comment) {
  const { data, error } = await supabase
    .from('comments')
    .insert(comment)
    .select('id,post_id,user_id,text,created_at,users(id,username,avatar_url)')
    .single();

  if (error) throw error;
  return data;
}

export async function fetchUserPosts(userId) {
  const { data, error } = await supabase
    .from('posts')
    .select('id,image_url,caption,created_at')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data || [];
}
