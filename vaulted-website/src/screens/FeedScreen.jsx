import { useState, useEffect } from 'react'
import PostCard from '../components/PostCard'
import { fetchPosts } from '../services/posts'
import { useAuth } from '../contexts/AuthContext'

export default function FeedScreen({ onNavigate }) {
  const [posts, setPosts] = useState([])
  const [loading, setLoading] = useState(true)
  const [refreshKey, setRefreshKey] = useState(0)
  const { user } = useAuth()

  const loadPosts = async () => {
    if (!user) {
      setLoading(false)
      return
    }
    setLoading(true)
    try {
      const data = await fetchPosts({ page: 0, pageSize: 10 })
      setPosts(data)
    } catch (err) {
      console.error('Failed to load posts:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadPosts()
  }, [refreshKey, user])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="muted">Loading...</div>
      </div>
    )
  }

  return (
    <div className="max-w-lg mx-auto p-3">
      {posts.map((post) => (
        <PostCard
          key={post.id}
          post={post}
          onOpenProfile={onNavigate}
          onOpenComments={(p) => onNavigate('comments', p)}
          onRefresh={() => setRefreshKey((k) => k + 1)}
        />
      ))}
    </div>
  )
}
