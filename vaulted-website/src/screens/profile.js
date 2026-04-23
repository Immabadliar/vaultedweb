import { el } from '../ui/dom'
import { auth } from '../state/auth'
import { fetchUserPosts } from '../services/posts'
import { getProfile } from '../services/users'
import { uploadToBucket } from '../services/storage'
import { supabase } from '../services/supabase'

function avatarNode(profile) {
  if (profile?.avatar_url) {
    return el('img', {
      src: profile.avatar_url,
      class: 'w-24 h-24 rounded-full',
      style: { objectFit: 'cover' },
      alt: '',
    })
  }
  return el('div', {
    class: 'w-24 h-24 rounded-full bg-[#27272A] flex items-center justify-center text-4xl font-bold mx-auto',
    text: profile?.username?.slice(0, 1)?.toUpperCase() || '?',
  })
}

export function screenProfile({ userId, onOpenPost, onSignedOut } = {}) {
  const { user, profile: authProfile } = auth.getState()
  const effectiveUserId = userId || user?.id
  const isOwn = !userId || userId === user?.id

  if (!effectiveUserId) return el('div', { class: 'p-4', text: 'Not signed in.' })

  const root = el('div', { class: 'max-w-lg mx-auto p-3' })
  root.appendChild(el('div', { class: 'text-center muted py-10', text: 'Loading...' }))

  let profile = isOwn ? authProfile : null
  let posts = []

  let editing = false
  let busy = false
  let avatarFile = null
  let avatarPreviewUrl = ''

  const bioInput = el('textarea', {
    class: 'input-dark w-full mb-3',
    placeholder: 'Update bio',
    rows: '3',
  })
  bioInput.value = profile?.bio || ''

  const avatarName = el('span', { text: 'Choose image...' })
  const avatarPreview = el('img', {
    class: 'w-20 h-20 rounded-full mb-2 hidden',
    style: { objectFit: 'cover' },
    alt: 'Preview',
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

  const editBtn = el('button', {
    class: 'mt-4 btn-accent',
    type: 'button',
    text: 'Edit Profile',
    onClick() {
      editing = !editing
      editBtn.textContent = editing ? 'Cancel' : 'Edit Profile'
      editorWrap.classList.toggle('hidden', !editing)
    },
  })

  const saveBtn = el('button', {
    class: 'btn-primary w-full',
    type: 'button',
    text: 'Save changes',
    onClick: saveProfile,
  })

  async function saveProfile() {
    if (!user || busy) return
    busy = true
    saveBtn.disabled = true
    saveBtn.textContent = 'Saving...'

    try {
      let avatar_url = profile?.avatar_url || null
      if (avatarFile) {
        const path = `${user.id}/avatar-${Date.now()}.jpg`
        avatar_url = await uploadToBucket('avatars', path, avatarFile)
      }

      const { error } = await supabase.from('users').upsert({
        id: user.id,
        username: profile?.username,
        bio: bioInput.value.trim() || null,
        avatar_url,
      })
      if (error) throw error

      await auth.refreshProfile()
      editing = false
      editorWrap.classList.add('hidden')
      editBtn.textContent = 'Edit Profile'
      if (avatarPreviewUrl) URL.revokeObjectURL(avatarPreviewUrl)
      avatarPreviewUrl = ''
      avatarFile = null
      avatarName.textContent = 'Choose image...'
      avatarPreview.classList.add('hidden')
      alert('Saved.')
    } catch (err) {
      alert(err?.message || String(err))
    } finally {
      busy = false
      saveBtn.disabled = false
      saveBtn.textContent = 'Save changes'
    }
  }

  const signOutBtn = el('button', {
    class: 'mt-3 muted text-sm',
    type: 'button',
    text: 'Sign out',
    onClick: async () => {
      try {
        await auth.signOut()
        onSignedOut?.()
      } catch (e) {
        alert(e?.message || String(e))
      }
    },
  })

  const editorWrap = el(
    'div',
    { class: 'mt-4 text-left hidden' },
    el(
      'div',
      { class: 'mb-3' },
      el('label', { class: 'block text-sm text-gray-400 mb-1', text: 'New Avatar' }),
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
      )
    ),
    avatarPreview,
    bioInput,
    saveBtn
  )

  const render = () => {
    const headerCard = el(
      'div',
      { class: 'card p-4 mb-4 text-center' },
      el('div', { class: 'relative inline-block' }, avatarNode(profile)),
      el('h2', { class: 'text-xl font-bold mt-3', text: `@${profile?.username || 'unknown'}` }),
      el('p', { class: 'muted mt-2', text: profile?.bio || 'No bio yet.' }),
      isOwn ? editBtn : null,
      isOwn ? signOutBtn : null,
      isOwn ? editorWrap : null
    )

    const grid = el('div', { class: 'grid grid-cols-3 gap-2' })
    for (const post of posts) {
      grid.appendChild(
        el('img', {
          src: post.image_url,
          class: 'grid-image',
          alt: '',
          onClick: () => onOpenPost?.(post.id),
        })
      )
    }

    root.replaceChildren(headerCard, el('h3', { class: 'font-bold mb-3', text: 'Posts' }), grid)
  }

  ;(async () => {
    try {
      const [p, userPosts] = await Promise.all([getProfile(effectiveUserId), fetchUserPosts(effectiveUserId)])
      profile = p
      posts = (userPosts || []).filter((x) => x.image_url)
      bioInput.value = profile?.bio || ''
      render()
    } catch (err) {
      console.error(err)
      root.replaceChildren(
        el(
          'div',
          { class: 'card p-6 text-center' },
          el('h3', { class: 'font-bold mb-2', text: 'Error loading profile' }),
          el('p', { class: 'muted', text: err?.message || String(err) })
        )
      )
    }
  })()

  return root
}
