import { el } from '../ui/dom'
import { auth } from '../state/auth'
import { cache } from '../state/cache'
import { createComment, fetchComments } from '../services/posts'
import dayjs from 'dayjs'

export function screenComments({ postId, onClose, onOpenProfile } = {}) {
  const { user } = auth.getState()
  if (!postId) return el('div', { class: 'p-4', text: 'Missing post.' })

  const post = cache.getPost(postId)

  const overlay = el('div', { class: 'fixed inset-0 bg-black bg-opacity-80 z-50 flex items-end justify-center' })
  const panel = el('div', { class: 'bg-[#121212] w-full max-w-lg rounded-t-2xl p-4 max-h-[80vh] flex flex-col' })
  overlay.appendChild(panel)

  const list = el('div', { class: 'flex-1 overflow-y-auto mb-4' })

  const input = el('input', { class: 'input-dark flex-1', placeholder: 'Write a comment' })
  const postBtn = el('button', { class: 'btn-primary px-4', type: 'button', text: 'Post' })

  const header = el(
    'div',
    { class: 'flex justify-between items-center mb-4' },
    el('h3', { class: 'font-bold text-lg', text: 'Comments' }),
    el('button', { type: 'button', class: 'text-[#98079d]', text: 'Close', onClick: () => onClose?.() })
  )

  if (post?.users?.id) {
    const sub = el(
      'button',
      { type: 'button', class: 'muted text-xs -mt-2 mb-3 text-left', onClick: () => onOpenProfile?.(post.users.id) },
      `Post by @${post.users?.username || 'user'}`
    )
    panel.appendChild(sub)
  }

  panel.appendChild(header)
  panel.appendChild(list)
  panel.appendChild(el('div', { class: 'flex gap-2' }, input, postBtn))

  const renderLoading = () => {
    list.replaceChildren(el('div', { class: 'text-center muted', text: 'Loading...' }))
  }

  const renderEmpty = () => {
    list.replaceChildren(el('div', { class: 'text-center muted', text: 'No comments yet' }))
  }

  const renderComments = (comments) => {
    list.replaceChildren(
      ...(comments || []).map((c) =>
        el(
          'div',
          { class: 'card p-3 mb-2' },
          el('div', { class: 'font-bold text-sm', text: c.users?.username || 'user' }),
          el('div', { class: 'mt-1', text: c.text || '' }),
          el('div', { class: 'muted text-xs mt-2', text: dayjs(c.created_at).format('MMM D, h:mm A') })
        )
      )
    )
  }

  const load = async () => {
    renderLoading()
    const comments = await fetchComments(postId)
    if (!comments.length) renderEmpty()
    else renderComments(comments)
  }

  let busy = false
  const doPost = async () => {
    if (busy) return
    if (!user) return alert('Not logged in')
    const text = input.value.trim()
    if (!text) return
    busy = true
    postBtn.disabled = true
    postBtn.textContent = '...'
    try {
      await createComment({ post_id: postId, user_id: user.id, text })
      input.value = ''
      await load()
    } catch (err) {
      alert(err?.message || String(err))
    } finally {
      busy = false
      postBtn.disabled = false
      postBtn.textContent = 'Post'
    }
  }

  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') doPost()
  })
  postBtn.addEventListener('click', doPost)

  load().catch((e) => console.error(e))
  return overlay
}
