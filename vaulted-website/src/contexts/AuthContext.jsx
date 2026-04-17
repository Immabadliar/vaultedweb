import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { supabase } from '../services/supabase'
import { getProfile } from '../services/users'

function isNewUserError(err) {
  const msg = err?.message || ''
  return msg.includes('No rows') || msg.includes('PGRST116') || msg.includes('null')
}

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
        
        // Check for session - don't wait for refresh to complete
        const { data: { session: existingSession } } = await supabase.auth.getSession()
        
        if (!isMounted) return;

        if (existingSession?.user) {
          setSession(existingSession)
          console.log('Session found:', existingSession.user.id)
          // Load profile async in background
          loadProfile(existingSession.user.id)
        } else {
          console.log('No session - will check if we can refresh')
          // Try to get user (may refresh session)
          try {
            const { data: { user } } = await supabase.auth.getUser()
            if (user && isMounted) {
              setSession({ user })
              console.log('Session refreshed:', user.id)
              loadProfile(user.id)
            }
          } catch (e) {
            console.log('No session found')
          }
        }
      } catch (err) {
        console.error('Auth init error:', err.message);
      } finally {
        if (isMounted) setLoading(false)
      }
    }

    // Separate function to load profile
    const loadProfile = async (userId) => {
      if (!userId) return
      try {
        const p = await getProfile(userId)
        if (isMounted) setProfile(p)
      } catch (err) {
        if (isNewUserError(err)) {
          console.log('No profile yet')
          if (isMounted) setProfile(null)
        } else {
          console.error('Profile error:', err.message)
        }
      }
    }

    initAuth()

    // Set a short timeout to prevent loading indefinitely
    timeout = setTimeout(() => {
      if (isMounted && loading) {
        console.warn('Auth timeout - continuing anyway')
        setLoading(false)
      }
    }, 2000) // 2 second timeout - don't block the UI

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
            if (err.message?.includes('No rows') || err.message?.includes('PGRST116')) {
              console.log('No profile yet - user needs to complete onboarding')
              if (isMounted) setProfile(null)
            } else {
              console.error('Error loading profile:', err.message)
            }
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
      // Only require onboarding if profile is definitively known to be missing a username
      hasCompletedOnboarding: profile && !profile.username ? false : true,
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
