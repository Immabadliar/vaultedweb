import { el } from '../ui/dom'
import { auth } from '../state/auth'
import { uploadToBucket } from '../services/storage'
import { supabase } from '../services/supabase'

export function screenCreate({ onDone } = {}) {
  const { user } = auth.getState()
  if (!user) return el('div', { class: 'p-4', text: 'Not signed in.' })

  let busy = false
  let imageFile = null
  let imagePreviewUrl = ''

  const caption = el('textarea', {
    class: 'input-dark w-full mb-3',
    placeholder: 'Write a caption...',
    rows: '3',
  })

  const fileName = el('span', { text: 'Choose image...' })
  const previewImg = el('img', {
    class: 'w-full mt-2 rounded hidden',
    style: { maxHeight: '400px', objectFit: 'cover' },
    alt: 'Preview',
  })

  const fileInput = el('input', {
    type: 'file',
    accept: 'image/*',
    class: 'absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10',
    onChange(e) {
      const file = e.target.files?.[0]
      if (!file) return
      imageFile = file
      fileName.textContent = file.name
      if (imagePreviewUrl) URL.revokeObjectURL(imagePreviewUrl)
      imagePreviewUrl = URL.createObjectURL(file)
      previewImg.src = imagePreviewUrl
      previewImg.classList.remove('hidden')
    },
  })

  const postBtn = el('button', {
    class: 'btn-primary w-full',
    type: 'button',
    text: 'Post',
    onClick: handlePost,
  })

  async function handlePost() {
    if (busy) return
    const captionText = caption.value.trim()
    if (!captionText && !imageFile) return alert('Add caption or image')

    busy = true
    postBtn.disabled = true
    postBtn.textContent = 'Posting...'

    try {
      let imageUrlFinal = null
      if (imageFile) {
        const ext = imageFile.name.split('.').pop() || 'jpg'
        const path = `${user.id}/${Date.now()}.${ext}`
        imageUrlFinal = await uploadToBucket('posts', path, imageFile)
      }

      const { error } = await supabase.from('posts').insert({
        user_id: user.id,
        image_url: imageUrlFinal,
        caption: captionText || null,
      })
      if (error) throw error

      caption.value = ''
      imageFile = null
      fileName.textContent = 'Choose image...'
      previewImg.classList.add('hidden')
      if (imagePreviewUrl) URL.revokeObjectURL(imagePreviewUrl)
      imagePreviewUrl = ''
      onDone?.()
    } catch (e) {
      alert('Post failed: ' + (e?.message || String(e)))
    } finally {
      busy = false
      postBtn.disabled = false
      postBtn.textContent = 'Post'
    }
  }

  return el(
    'div',
    { class: 'max-w-lg mx-auto p-4' },
    el('h2', { class: 'text-xl font-bold mb-4', text: 'Create Post' }),
    el(
      'div',
      { class: 'card p-4' },
      el(
        'div',
        { class: 'mb-4' },
        el('label', { class: 'block text-sm text-gray-400 mb-2', text: 'Add Image' }),
        el(
          'div',
          { class: 'relative' },
          el(
            'button',
            {
              type: 'button',
              disabled: true,
              class: 'input-dark w-full text-center py-3 flex items-center justify-center gap-2',
            },
            el('span', { class: 'material-symbols-outlined', text: 'photo_camera' }),
            fileName
          ),
          fileInput
        ),
        previewImg
      ),
      caption,
      postBtn
    )
  )
}
