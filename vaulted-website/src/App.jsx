import { useState, useEffect, useCallback } from 'react'
import { useAuth } from './contexts/AuthContext'
import FeedScreen from './screens/FeedScreen'
import CreatePostScreen from './screens/CreatePostScreen'
import ProfileScreen from './screens/ProfileScreen'
import AuthScreen from './screens/AuthScreen'
import OnboardingScreen from './screens/OnboardingScreen'
import CommentsModal from './components/CommentsModal'
import AlertsScreen from './screens/AlertsScreen'
import ProximityAlarmScreen from './screens/ProximityAlarmScreen'

export default function App() {
  const [screen, setScreen] = useState(null) // Start with null to wait for auth
  const [params, setParams] = useState({})
  const { user, loading, hasCompletedOnboarding } = useAuth()

  const navigate = useCallback((screenName, params = {}) => {
    setScreen(screenName)
    setParams(params)
  }, [])

  // Set initial screen based on auth status
  useEffect(() => {
    if (loading) return; // Wait for auth to finish
    
    if (!user) {
      setScreen('auth'); // Redirect to auth if not logged in
    } else if (screen === null) {
      // User is logged in - check if they need to complete onboarding
      if (!hasCompletedOnboarding) {
        setScreen('onboarding');
      } else {
        setScreen('feed');
      }
    }
  }, [user, loading, screen, hasCompletedOnboarding])

  if (loading || screen === null) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="muted">Loading...</div>
      </div>
    )
  }

  // Render screen
  let content
  switch (screen) {
    case 'auth':
      content = (
        <AuthScreen
          onSignIn={() => setScreen('feed')} // Sign in - go directly to feed
          onSignUp={() => setScreen('onboarding')} // Sign up - go to onboarding
        />
      )
      break
    case 'onboarding':
      content = <OnboardingScreen onComplete={() => setScreen('feed')} />
      break
    case 'feed':
      content = <FeedScreen onNavigate={navigate} />
      break
    case 'create':
      content = <CreatePostScreen onNavigate={navigate} />
      break
    case 'profile':
      content = <ProfileScreen route={params} onNavigate={navigate} />
      break
    case 'comments':
      content = <CommentsModal post={params} onClose={() => navigate('feed')} />
      break
    case 'post':
      // For now, just show feed; could add post detail screen
      content = <FeedScreen onNavigate={navigate} />
      break
    case 'alerts':
      content = <AlertsScreen />
      break
    case 'alarm':
      content = <ProximityAlarmScreen />
      break
    default:
      content = <FeedScreen onNavigate={navigate} />
  }

  return (
    <div className="min-h-screen">
      {content}
      {/* Bottom navigation - show only on main screens */}
      {['feed', 'create', 'profile', 'alerts', 'alarm'].includes(screen) && (
        <BottomNav activeScreen={screen} onNavigate={navigate} />
      )}
    </div>
  )
}

function BottomNav({ activeScreen, onNavigate }) {
  const items = [
    { icon: 'home', label: 'Feed', screen: 'feed' },
    { icon: 'notifications', label: 'Alerts', screen: 'alerts' },
    { icon: 'add_circle', label: 'Post', screen: 'create' },
    { icon: 'warning', label: 'Alarm', screen: 'alarm' },
    { icon: 'person', label: 'Profile', screen: 'profile' },
  ]

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-[#121212] border-t border-[#262626] flex justify-around py-3 z-50">
      {items.map((item) => (
        <div
          key={item.screen}
          onClick={() => onNavigate(item.screen)}
          className={`flex flex-col items-center gap-1 cursor-pointer ${
            activeScreen === item.screen ? 'text-[#98079d]' : 'text-[#A3A3A3]'
          }`}
        >
          <span className="material-symbols-outlined text-2xl">
            {item.icon}
          </span>
          <span className="text-xs">{item.label}</span>
        </div>
      ))}
    </div>
  )
}
