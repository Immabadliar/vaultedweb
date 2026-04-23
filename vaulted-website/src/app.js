import { clear } from './ui/dom'
import { createBottomNav, createShell } from './ui/layout'
import { auth } from './state/auth'
import { getRoute, setRoute } from './router'
import { screenAuth } from './screens/auth'
import { screenOnboarding } from './screens/onboarding'
import { screenFeed } from './screens/feed'
import { screenCreate } from './screens/create'
import { screenProfile } from './screens/profile'
import { screenAlerts } from './screens/alerts'
import { screenAlarm } from './screens/alarm'
import { screenComments } from './screens/comments'

function normalizeAppRoute({ screen, params }) {
  const next = { screen, params: params || {} }
  if (!next.screen) next.screen = 'feed'
  return next
}

function needsOnboarding(profile) {
  return !profile?.username
}

export function startApp(mountNode) {
  if (!mountNode) throw new Error('Missing mount node')

  const shell = createShell()
  mountNode.replaceWith(shell)

  const contentNode = shell.querySelector('[data-app-content]')
  const bottomNavNode = shell.querySelector('[data-app-bottomnav]')

  const render = async () => {
    const { screen, params } = normalizeAppRoute(getRoute())
    const { loading, user, profile } = auth.getState()

    // Auth gating / route correction.
    if (loading) {
      clear(contentNode)
      contentNode.appendChild(screenFeed.loadingView('Loading...'))
      clear(bottomNavNode)
      return
    }

    if (!user) {
      if (screen !== 'auth') setRoute({ screen: 'auth' })
    } else if (needsOnboarding(profile)) {
      if (screen !== 'onboarding') setRoute({ screen: 'onboarding' })
    } else if (screen === 'auth' || screen === 'onboarding') {
      setRoute({ screen: 'feed' })
    }

    const { screen: finalScreen, params: finalParams } = normalizeAppRoute(getRoute())

    clear(contentNode)
    let view = null
    switch (finalScreen) {
      case 'auth':
        view = screenAuth({
          onDone() {
            setRoute({ screen: 'feed' })
          },
        })
        break
      case 'onboarding':
        view = screenOnboarding({
          onDone() {
            setRoute({ screen: 'feed' })
          },
        })
        break
      case 'feed':
        view = screenFeed({
          onOpenProfile(userId) {
            setRoute({ screen: 'profile', params: userId ? { userId } : {} })
          },
          onOpenComments(postId) {
            setRoute({ screen: 'comments', params: { postId } })
          },
        })
        break
      case 'create':
        view = screenCreate({
          onDone() {
            setRoute({ screen: 'feed' })
          },
        })
        break
      case 'profile':
        view = screenProfile({
          userId: finalParams.userId,
          onOpenPost(postId) {
            setRoute({ screen: 'comments', params: { postId } })
          },
          onSignedOut() {
            setRoute({ screen: 'auth' })
          },
        })
        break
      case 'comments':
        view = screenComments({
          postId: finalParams.postId,
          onClose() {
            // go back to feed by default
            setRoute({ screen: 'feed' })
          },
          onOpenProfile(userId) {
            setRoute({ screen: 'profile', params: userId ? { userId } : {} })
          },
        })
        break
      case 'alerts':
        view = screenAlerts()
        break
      case 'alarm':
        view = screenAlarm()
        break
      default:
        setRoute({ screen: 'feed' })
        return
    }
    contentNode.appendChild(view)

    clear(bottomNavNode)
    const navScreens = ['feed', 'create', 'alerts', 'alarm', 'profile']
    if (user && !needsOnboarding(profile) && navScreens.includes(finalScreen)) {
      bottomNavNode.appendChild(
        createBottomNav(finalScreen, (nextScreen) => setRoute({ screen: nextScreen }))
      )
    }
  }

  window.addEventListener('hashchange', () => {
    render().catch((e) => console.error(e))
  })

  auth.subscribe(() => {
    render().catch((e) => console.error(e))
  })

  auth.init().catch((e) => {
    console.error(e)
  })

  render().catch((e) => console.error(e))
}
