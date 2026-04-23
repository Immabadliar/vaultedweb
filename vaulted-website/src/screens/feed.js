import { el } from '../ui/dom'
import { auth } from '../state/auth'
import { fetchPosts, toggleLike } from '../services/posts'
import dayjs from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime'
import { cache } from '../state/cache'

dayjs.extend(relativeTime)

function loadingView(text) {
  return el(
    'div',
    { class: 'flex items-center justify-center min-h-screen' },
    el('div', { class: 'muted', text })
  )
}

function avatarNode(user) {
  if (user?.avatar_url) {
    return el('img', {
      src: user.avatar_url,
      class: 'w-10 h-10 rounded-full',
      style: { objectFit: 'cover' },
      alt: '',
    })
  }
  return el(
    'div',
    {
      class: 'w-10 h-10 rounded-full bg-[#27272A] flex items-center justify-center font-bold text-lg',
      text: user?.username?.slice(0, 1)?.toUpperCase() || '?',
    }
  )
}

function postCard({ post, currentUserId, onOpenProfile, onOpenComments, onRefresh }) {
  const likes = post.likes?.length || 0
  const comments = post.comments?.length || 0
  const liked = !!post.likes?.some((entry) => entry.user_id === currentUserId)

  let busy = false

  const likeCount = el('span', { text: String(likes) })
  const likeIcon = el('span', {
    class: 'material-symbols-outlined',
    text: liked ? 'favorite' : 'favorite_border',
    style: { fontVariationSettings: liked ? "'FILL' 1" : "'FILL' 0" },
  })

  const likeBtn = el(
    'button',
    {
      type: 'button',
      class: 'flex items-center gap-1',
      onClick: async () => {
        if (!currentUserId || busy) return
        busy = true
        likeBtn.disabled = true
        try {
          await toggleLike({ postId: post.id, userId: currentUserId, liked })
          onRefresh?.()
        } finally {
          busy = false
          likeBtn.disabled = false
        }
      },
    },
    likeIcon,
    likeCount
  )

  const commentBtn = el(
    'button',
    {
      type: 'button',
      onClick: () => onOpenComments?.(post.id),
    },
    el('span', { class: 'material-symbols-outlined', text: 'chat_bubble' }),
    el('span', { class: 'ml-1', text: String(comments) })
  )

  const header = el(
    'div',
    {
      class: 'p-3 cursor-pointer',
      onClick: () => onOpenProfile?.(post.users?.id),
    },
    el(
      'div',
      { class: 'flex items-center gap-2.5' },
      avatarNode(post.users),
      el(
        'div',
        {},
        el('div', { class: 'font-bold', text: post.users?.username || 'unknown' }),
        el('div', { class: 'muted text-xs', text: dayjs(post.created_at).fromNow() })
      )
    )
  )

  const actions = el('div', { class: 'p-3 pt-2 flex gap-5' }, likeBtn, commentBtn)

  const captionWrap = el('div', { class: 'px-3 pb-3' })
  if (post.caption) captionWrap.appendChild(el('div', { class: 'mt-1 whitespace-pre-wrap', text: post.caption }))
  if (post.location) captionWrap.appendChild(el('div', { class: 'muted text-xs mt-1', text: `@ ${post.location}` }))

  const card = el('div', { class: 'card mb-4' }, header)
  if (post.image_url) {
    card.appendChild(
      el('img', {
        src: post.image_url,
        class: 'w-full',
        style: { aspectRatio: '1/1', objectFit: 'cover' },
        alt: '',
      })
    )
  }
  card.appendChild(actions)
  card.appendChild(captionWrap)
  return card
}

export const screenFeed = Object.assign(
  function screenFeed({ onOpenProfile, onOpenComments } = {}) {
    const { user } = auth.getState()
    if (!user) return loadingView('Please sign in.')

    const root = el('div', { class: 'max-w-lg mx-auto p-3' })

    const renderPosts = (posts) => {
      root.replaceChildren(
        ...(posts.length
          ? posts.map((post) =>
              postCard({
                post,
                currentUserId: user.id,
                onOpenProfile,
                onOpenComments,
                onRefresh: refresh,
              })
            )
          : [el('div', { class: 'text-center muted py-10', text: 'No posts yet.' })])
      )
    }

    const refresh = async () => {
      root.replaceChildren(loadingView('Loading...'))
      try {
        const posts = await fetchPosts({ page: 0, pageSize: 10 })
        cache.upsertPosts(posts)
        renderPosts(posts)
      } catch (err) {
        console.error(err)
        root.replaceChildren(
          el(
            'div',
            { class: 'card p-6 text-center' },
            el('h3', { class: 'font-bold mb-2', text: 'Error loading feed' }),
            el('p', { class: 'muted', text: err?.message || String(err) })
          )
        )
      }
    }

    refresh().catch((e) => console.error(e))

    return root
  },
  { loadingView }
)
