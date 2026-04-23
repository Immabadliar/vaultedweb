function parseHash() {
  const raw = window.location.hash || ''
  const hash = raw.startsWith('#') ? raw.slice(1) : raw
  const [pathPart, queryPart] = hash.split('?')
  const path = (pathPart || '').replace(/^\/+/, '')
  const screen = path || 'feed'

  const params = {}
  const qs = new URLSearchParams(queryPart || '')
  for (const [k, v] of qs.entries()) params[k] = v

  if (screen === 'profile' && params.user) {
    params.userId = params.user
    delete params.user
  }
  if (screen === 'comments' && params.post) {
    params.postId = params.post
    delete params.post
  }

  return { screen, params }
}

export function getRoute() {
  const { screen, params } = parseHash()
  return { screen, params }
}

export function setRoute({ screen, params = {} }) {
  const qs = new URLSearchParams()
  for (const [k, v] of Object.entries(params)) {
    if (v === undefined || v === null || v === '') continue
    if (k === 'userId') qs.set('user', v)
    else if (k === 'postId') qs.set('post', v)
    else qs.set(k, v)
  }
  const query = qs.toString()
  const next = `#/${screen || 'feed'}${query ? `?${query}` : ''}`
  if (window.location.hash !== next) window.location.hash = next
}

