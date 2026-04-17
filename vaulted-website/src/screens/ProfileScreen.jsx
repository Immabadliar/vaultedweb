import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { fetchUserPosts } from '../services/posts'
import { getProfile } from '../services/users'
import { uploadToBucket } from '../services/storage'
import { supabase } from '../services/supabase'

export default function ProfileScreen({ route, onNavigate }) {
  const { user, profile: authProfile, refreshProfile } = useAuth()
  const userId = route?.userId || user?.id
  const isOwn = !route?.userId || route.userId === user?.id

  const [profile, setProfile] = useState(authProfile)
  const [posts, setPosts] = useState([])
  const [editing, setEditing] = useState(false)
  const [bio, setBio] = useState('')
  const [avatarFile, setAvatarFile] = useState(null)
  const [avatarPreview, setAvatarPreview] = useState('')
  const [loading, setLoading] = useState(false)

  const loadData = useCallback(async () => {
    if (!userId) return
    try {
      const [p, userPosts] = await Promise.all([getProfile(userId), fetchUserPosts(userId)])
      setProfile(p)
      setBio(p?.bio || '')
      // Only show posts with images
      setPosts(userPosts.filter((p) => p.image_url))
    } catch (err) {
      console.error('Failed to load profile:', err)
    }
  }, [userId])

  useEffect(() => {
    loadData()
  }, [loadData])

  const saveProfile = async () => {
    if (!user) return
    setLoading(true)
    try {
      let avatar_url = profile?.avatar_url
      if (avatarFile) {
        const path = `${user.id}/avatar-${Date.now()}.jpg`
        avatar_url = await uploadToBucket('avatars', path, avatarFile)
      }

      await supabase.from('users').upsert({
        id: user.id,
        username: profile?.username,
        bio,
        avatar_url,
      })

      await refreshProfile()
      await loadData()
      setEditing(false)
      setAvatarFile(null)
      setAvatarPreview('')
    } catch (err) {
      alert(err.message)
    } finally {
      setLoading(false)
    }
  }

  const header = (
    <div className="card p-4 mb-4 text-center">
      <div className="relative inline-block">
        {profile?.avatar_url ? (
          <img
            src={profile.avatar_url}
            className="w-24 h-24 rounded-full"
            style={{ objectFit: 'cover' }}
            alt=""
          />
        ) : (
          <div className="w-24 h-24 rounded-full bg-[#27272A] flex items-center justify-center text-4xl font-bold mx-auto">
            {profile?.username?.slice(0, 1)?.toUpperCase() || '?'}
          </div>
        )}
      </div>
      <h2 className="text-xl font-bold mt-3">@{profile?.username || 'unknown'}</h2>
      <p className="muted mt-2">{profile?.bio || 'No bio yet.'}</p>

      {isOwn && (
        <button onClick={() => setEditing(!editing)} className="mt-4 btn-accent">
          {editing ? 'Cancel' : 'Edit Profile'}
        </button>
      )}

      {editing && (
        <div className="mt-4 text-left">
          <div className="mb-3">
            <label className="block text-sm text-gray-400 mb-1">New Avatar</label>
            <div className="relative">
              <button
                type="button"
                disabled
                className="input-dark w-full text-center py-2 flex items-center justify-center gap-2"
              >
                <span>📷</span>
                <span>{avatarFile ? avatarFile.name : 'Choose image...'}</span>
              </button>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => {
                  const file = e.target.files?.[0]
                  if (file) {
                    setAvatarFile(file)
                    setAvatarPreview(URL.createObjectURL(file))
                  }
                }}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
              />
            </div>
          </div>
          {avatarPreview && (
            <img src={avatarPreview} className="w-20 h-20 rounded-full mb-2" style={{ objectFit: 'cover' }} alt="Preview" />
          )}
          <textarea
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            placeholder="Update bio"
            className="input-dark w-full mb-3"
            rows="3"
          />
          <button onClick={saveProfile} disabled={loading} className={`btn-primary ${loading ? 'opacity-50' : ''}`}>
            {loading ? 'Saving...' : 'Save changes'}
          </button>
        </div>
      )}
    </div>
  )

  return (
    <div className="max-w-lg mx-auto p-3">
      {header}
      <h3 className="font-bold mb-3">Posts</h3>
      <div className="grid grid-cols-3 gap-2">
        {posts.map((post) => (
          post.image_url && (
            <img
              key={post.id}
              src={post.image_url}
              className="grid-image"
              onClick={() => onNavigate('post', post)}
              alt=""
            />
          )
        ))}
      </div>
    </div>
  )
}
