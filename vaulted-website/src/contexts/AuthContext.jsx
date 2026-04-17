import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { supabase } from '../services/supabase'
import { getProfile } from '../services/users'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let isMounted = true;
    let timeout;

    const initAuth = async () => {
      try {
        console.log('Initializing auth...')
        
        // Try to get session from URL first (for OAuth callbacks)
        // Then fall back to stored session with a short timeout
        const { data: { session: urlSession } } = await supabase.auth.getSession();
        
        if (!isMounted) return;
        setSession(urlSession ?? null)

        if (urlSession?.user?.id) {
          console.log('User logged in:', urlSession.user.id)
          try {
            const p = await getProfile(urlSession.user.id)
            if (isMounted) setProfile(p)
          } catch (err) {
            console.log('No profile yet - user needs to complete onboarding')
            if (isMounted) setProfile(null)
          }
        } else {
          console.log('No active session - showing auth screen')
        }
      } catch (err) {
        console.error('Auth initialization error:', err.message);
        // On error, still set loading to false so user can interact
      } finally {
        if (isMounted) setLoading(false)
      }
    }

    initAuth()

    // Set a timeout to prevent loading indefinitely
    timeout = setTimeout(() => {
      if (isMounted && loading) {
        console.warn('Auth initialization timeout - setting loading to false')
        setLoading(false)
      }
    }, 5000) // 5 second timeout

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_, nextSession) => {
        if (!isMounted) return;
        setSession(nextSession)

        if (nextSession?.user?.id) {
          try {
            const p = await getProfile(nextSession.user.id)
            if (isMounted) setProfile(p)
          } catch (err) {
            console.log('No profile yet - user needs to complete onboarding')
            if (isMounted) setProfile(null)
          }
        } else {
          setProfile(null)
        }
      }
    )

    return () => {
      isMounted = false;
      clearTimeout(timeout)
      subscription.unsubscribe()
    }
  }, [])

  const value = useMemo(
    () => ({
      session,
      user: session?.user ?? null,
      profile,
      loading,
      // Check if user has completed onboarding (has a username)
      hasCompletedOnboarding: !!profile?.username,
      async refreshProfile() {
        if (!session?.user?.id) return
        const p = await getProfile(session.user.id)
        setProfile(p)
      },
      async signIn(email, password) {
        const { error } = await supabase.auth.signInWithPassword({ email, password })
        if (error) throw error
      },
      async signUp(email, password) {
        const { error } = await supabase.auth.signUp({ email, password })
        if (error) throw error
      },
      async signOut() {
        const { error } = await supabase.auth.signOut()
        if (error) throw error
      },
    }),
    [session, profile, loading]
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth must be used inside AuthProvider')
  return context
}
