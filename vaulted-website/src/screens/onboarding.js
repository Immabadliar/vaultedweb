import { el } from '../ui/dom'
import { auth } from '../state/auth'
import { uploadToBucket } from '../services/storage'
import { supabase } from '../services/supabase'
import { usernameExists } from '../services/users'

export function screenOnboarding({ onDone } = {}) {
  const { user } = auth.getState()
  if (!user) return el('div', { class: 'p-4', text: 'Not signed in.' })

  let busy = false
  let avatarFile = null
  let avatarPreviewUrl = ''

  const usernameInput = el('input', {
    class: 'input-dark w-full mb-3',
    type: 'text',
    placeholder: 'Username',
    autocomplete: 'nickname',
  })
  const bioInput = el('textarea', {
    class: 'input-dark w-full mb-4',
    placeholder: 'Bio',
    rows: '3',
  })

  const avatarName = el('span', { text: 'Choose image...' })
  const avatarPreview = el('img', {
    class: 'w-24 h-24 rounded-full mx-auto mt-2 hidden',
    alt: 'Preview',
    style: { objectFit: 'cover' },
  })

  const fileInput = el('input', {
    type: 'file',
    accept: 'image/*',
    class: 'absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10',
    onChange(e) {
      const file = e.target.files?.[0]
      if (!file) return
      avatarFile = file
      avatarName.textContent = file.name
      if (avatarPreviewUrl) URL.revokeObjectURL(avatarPreviewUrl)
      avatarPreviewUrl = URL.createObjectURL(file)
      avatarPreview.src = avatarPreviewUrl
      avatarPreview.classList.remove('hidden')
    },
  })

  const saveBtn = el('button', {
    class: 'btn-primary w-full',
    type: 'button',
    text: 'Continue',
    onClick: saveProfile,
  })

  async function saveProfile() {
    if (busy) return
    const username = usernameInput.value.trim()
    const bio = bioInput.value.trim()
    if (!username) return alert('Add a username')

    busy = true
    saveBtn.disabled = true
    saveBtn.textContent = 'Saving...'

    try {
      if (await usernameExists(username)) {
        alert('That username is taken.')
        return
      }

      let avatar_url = null
      if (avatarFile) {
        const path = `${user.id}/avatar-${Date.now()}.jpg`
        avatar_url = await uploadToBucket('avatars', path, avatarFile)
      }

      await supabase.from('users').upsert({
        id: user.id,
        username,
        bio: bio || null,
        avatar_url,
      })
      await auth.refreshProfile()
      onDone?.()
    } catch (error) {
      alert(error?.message || String(error))
    } finally {
      busy = false
      saveBtn.disabled = false
      saveBtn.textContent = 'Continue'
    }
  }

  return el(
    'div',
    { class: 'max-w-lg mx-auto p-4 pt-10' },
    el(
      'div',
      { class: 'card p-6' },
      el('h2', { class: 'text-xl font-bold mb-2', text: 'Set up your profile' }),
      el('p', { class: 'muted mb-4', text: 'One-time setup before entering the app.' }),
      el(
        'div',
        { class: 'mb-4' },
        el('label', { class: 'block text-sm text-gray-400 mb-2', text: 'Avatar' }),
        el(
          'div',
          { class: 'relative' },
          el(
            'button',
            {
              type: 'button',
              disabled: true,
              class: 'input-dark w-full text-center py-2 flex items-center justify-center gap-2',
            },
            el('span', { class: 'material-symbols-outlined', text: 'photo_camera' }),
            avatarName
          ),
          fileInput
        ),
        avatarPreview
      ),
      usernameInput,
      bioInput,
      saveBtn
    )
  )
}
