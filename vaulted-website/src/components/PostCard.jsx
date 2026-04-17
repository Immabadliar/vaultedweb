import { useState, useContext, useMemo } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { toggleLike } from '../services/posts'
import dayjs from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime'

dayjs.extend(relativeTime)

export default function PostCard({ post, onOpenComments, onOpenProfile, onRefresh }) {
  const { user } = useAuth()
  const [busy, setBusy] = useState(false)

  const likes = post.likes?.length || 0
  const comments = post.comments?.length || 0
  const liked = useMemo(
    () => post.likes?.some((entry) => entry.user_id === user?.id) || false,
    [post.likes, user?.id]
  )

  const handleLike = async () => {
    if (!user || busy) return
    setBusy(true)
    try {
      await toggleLike({ postId: post.id, userId: user.id, liked })
      onRefresh?.()
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="card mb-4">
      {/* Header */}
      <div
        onClick={() => onOpenProfile?.(post.users?.id)}
        className="p-3 cursor-pointer"
        style={{ cursor: 'pointer' }}
      >
        <div className="flex items-center gap-2.5">
          {post.users?.avatar_url ? (
            <img
              src={post.users.avatar_url}
              className="w-10 h-10 rounded-full"
              style={{ objectFit: 'cover' }}
              alt=""
            />
          ) : (
            <div className="w-10 h-10 rounded-full bg-[#27272A] flex items-center justify-center font-bold text-lg">
              {post.users?.username?.slice(0, 1)?.toUpperCase() || '?'}
            </div>
          )}
          <div>
            <div className="font-bold">{post.users?.username || 'unknown'}</div>
            <div className="muted text-xs">{dayjs(post.created_at).fromNow()}</div>
          </div>
        </div>
      </div>

      {/* Image - only if exists */}
      {post.image_url && (
        <img
          src={post.image_url}
          className="w-full"
          style={{ aspectRatio: '1/1', objectFit: 'cover' }}
          alt=""
        />
      )}

      {/* Actions */}
      <div className="p-3 pt-2 flex gap-5">
        <button onClick={handleLike} disabled={busy} className="flex items-center gap-1">
          {liked ? '❤️' : '🤍'} {likes}
        </button>
        <button onClick={() => onOpenComments?.(post)}>💬 {comments}</button>
      </div>

      {/* Caption & location */}
      <div className="px-3 pb-3">
        {post.caption && <div className="mt-1 whitespace-pre-wrap">{post.caption}</div>}
        {post.location && <div className="muted text-xs mt-1">@ {post.location}</div>}
      </div>
    </div>
  )
}
