import { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { fetchComments, createComment } from '../services/posts'
import dayjs from 'dayjs'

export default function CommentsModal({ post, onClose }) {
  const { user } = useAuth()
  const [comments, setComments] = useState([])
  const [text, setText] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (post?.id) {
      loadComments()
    }
  }, [post?.id])

  const loadComments = async () => {
    try {
      const data = await fetchComments(post.id)
      setComments(data)
    } catch (err) {
      console.error('Failed to load comments:', err)
    }
  }

  const handlePost = async () => {
    if (!text.trim() || !user || !post?.id) return
    setLoading(true)
    try {
      await createComment({ post_id: post.id, user_id: user.id, text: text.trim() })
      setText('')
      await loadComments()
    } catch (err) {
      alert(err.message)
    } finally {
      setLoading(false)
    }
  }

  if (!post) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-80 z-50 flex items-end justify-center">
      <div className="bg-[#121212] w-full max-w-lg rounded-t-2xl p-4 max-h-[80vh] flex flex-col">
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-bold text-lg">Comments</h3>
          <button onClick={onClose} className="text-[#98079d]">
            Close
          </button>
        </div>

        <div className="flex-1 overflow-y-auto mb-4">
          {loading ? (
            <div className="text-center muted">Loading...</div>
          ) : comments.length === 0 ? (
            <div className="text-center muted">No comments yet</div>
          ) : (
            comments.map((c) => (
              <div key={c.id} className="card p-3 mb-2">
                <div className="font-bold text-sm">{c.users?.username || 'user'}</div>
                <div className="mt-1">{c.text}</div>
                <div className="muted text-xs mt-2">
                  {dayjs(c.created_at).format('MMM D, h:mm A')}
                </div>
              </div>
            ))
          )}
        </div>

        <div className="flex gap-2">
          <input
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Write a comment"
            className="input-dark flex-1"
            onKeyDown={(e) => e.key === 'Enter' && handlePost()}
          />
          <button onClick={handlePost} disabled={loading} className="btn-primary px-4">
            {loading ? '...' : 'Post'}
          </button>
        </div>
      </div>
    </div>
  )
}
