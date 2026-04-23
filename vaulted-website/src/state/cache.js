const postsById = new Map()

export const cache = {
  upsertPosts(posts) {
    for (const post of posts || []) {
      if (post?.id) postsById.set(String(post.id), post)
    }
  },
  getPost(postId) {
    if (!postId) return null
    return postsById.get(String(postId)) || null
  },
}

