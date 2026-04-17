import { useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { uploadToBucket } from '../services/storage'
import { supabase } from '../services/supabase'

export default function OnboardingScreen({ onComplete }) {
  const { user, refreshProfile } = useAuth()
  const [username, setUsername] = useState('')
  const [bio, setBio] = useState('')
  const [avatarFile, setAvatarFile] = useState(null)
  const [loading, setLoading] = useState(false)

  const saveProfile = async () => {
    if (!username.trim()) return alert('Add a username')
    setLoading(true)
    try {
      let avatar_url = null
      if (avatarFile) {
        const path = `${user.id}/avatar-${Date.now()}.jpg`
        avatar_url = await uploadToBucket('avatars', path, avatarFile)
      }
      await supabase.from('users').upsert({
        id: user.id,
        username: username.trim(),
        bio: bio.trim(),
        avatar_url,
      })
      await refreshProfile()
      onComplete?.()
    } catch (error) {
      alert(error.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-lg mx-auto p-4 pt-10">
      <div className="card p-6">
        <h2 className="text-xl font-bold mb-2">Set up your profile</h2>
        <p className="muted mb-4">One-time setup before entering the app.</p>

        <div className="mb-4">
          <label className="block text-sm text-gray-400 mb-2">Avatar</label>
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
              onChange={(e) => setAvatarFile(e.target.files?.[0])}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
            />
          </div>
          {avatarFile && (
            <img
              src={URL.createObjectURL(avatarFile)}
              className="w-24 h-24 rounded-full mx-auto mt-2"
              style={{ objectFit: 'cover' }}
              alt="Preview"
            />
          )}
        </div>

        <input
          type="text"
          placeholder="Username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          className="input-dark w-full mb-3"
        />
        <textarea
          placeholder="Bio"
          value={bio}
          onChange={(e) => setBio(e.target.value)}
          className="input-dark w-full mb-4"
          rows="3"
        />

        <button onClick={saveProfile} disabled={loading} className={`btn-primary ${loading ? 'opacity-50' : ''}`}>
          {loading ? 'Saving...' : 'Continue'}
        </button>
      </div>
    </div>
  )
}
