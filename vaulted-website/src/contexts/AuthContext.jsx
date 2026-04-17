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
        
        // First check for existing session
        const { data: { session: existingSession } } = await supabase.auth.getSession()
        
        if (!isMounted) return;

        if (existingSession?.user) {
          // Session exists, use it
          setSession(existingSession)
          console.log('Session restored from storage:', existingSession.user.id)
          try {
            const p = await getProfile(existingSession.user.id)
            if (isMounted) setProfile(p)
          } catch (err) {
            console.log('No profile yet - user needs to complete onboarding')
            if (isMounted) setProfile(null)
          }
        } else {
          // Try to get user from URL (OAuth callback) or check if we can refresh
          try {
            const { data: { user } } = await supabase.auth.getUser()
            if (user && isMounted) {
              // Refreshed valid session
              const { data: { session } } = await supabase.auth.getSession()
              setSession(session)
              console.log('Session refreshed:', user.id)
              try {
                const p = await getProfile(user.id)
                if (isMounted) setProfile(p)
              } catch (err) {
                if (isMounted) setProfile(null)
              }
            } else {
              console.log('No active session - showing auth screen')
            }
          } catch (e) {
            console.log('No active session - showing auth screen')
          }
        }
      } catch (err) {
        console.error('Auth initialization error:', err.message);
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
    }, 10000) // 10 second timeout to allow for session restoration

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, nextSession) => {
        if (!isMounted) return;
        console.log('Auth state change:', event)
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
