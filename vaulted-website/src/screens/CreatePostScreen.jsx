import { useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { uploadToBucket } from '../services/storage'
import { supabase } from '../services/supabase'

export default function CreatePostScreen({ onNavigate }) {
  const { user } = useAuth()
  const [caption, setCaption] = useState('')
  const [imageFile, setImageFile] = useState(null)
  const [imagePreview, setImagePreview] = useState('')
  const [loading, setLoading] = useState(false)

  const handleImageChange = (e) => {
    const file = e.target.files?.[0]
    if (file) {
      setImageFile(file)
      setImagePreview(URL.createObjectURL(file))
    }
  }

  const handlePost = async () => {
    if (!caption.trim() && !imageFile) return alert('Add caption or image')
    if (!user) return alert('Not logged in')
    setLoading(true)
    try {
      let imageUrlFinal = null
      if (imageFile) {
        const ext = imageFile.name.split('.').pop() || 'jpg'
        const path = `${user.id}/${Date.now()}.${ext}`
        imageUrlFinal = await uploadToBucket('posts', path, imageFile)
      }

      await supabase.from('posts').insert({
        user_id: user.id,
        image_url: imageUrlFinal,
        caption: caption.trim() || null,
      })

      setCaption('')
      setImageFile(null)
      setImagePreview('')
      onNavigate?.('feed')
    } catch (e) {
      alert('Post failed: ' + e.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-lg mx-auto p-4">
      <h2 className="text-xl font-bold mb-4">Create Post</h2>
      <div className="card p-4">
        <div className="mb-4">
          <label className="block text-sm text-gray-400 mb-2">Add Image</label>
          <div className="relative">
            <button
              type="button"
              disabled
              className="input-dark w-full text-center py-3 flex items-center justify-center gap-2"
            >
              <span>📷</span>
              <span>{imageFile ? imageFile.name : 'Choose image...'}</span>
            </button>
            <input
              type="file"
              accept="image/*"
              onChange={handleImageChange}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
            />
          </div>
          {imagePreview && (
            <img src={imagePreview} className="w-full mt-2 rounded" style={{ maxHeight: '400px', objectFit: 'cover' }} alt="Preview" />
          )}
        </div>
        <textarea
          value={caption}
          onChange={(e) => setCaption(e.target.value)}
          placeholder="Write a caption..."
          className="input-dark w-full mb-3"
          rows="3"
        />
        <button onClick={handlePost} disabled={loading} className={`btn-primary ${loading ? 'opacity-50' : ''}`}>
          {loading ? 'Posting...' : 'Post'}
        </button>
      </div>
    </div>
  )
}
