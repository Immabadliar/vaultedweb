import { supabase } from '../services/supabase'
import { getProfile } from '../services/users'

function isNewUserError(err) {
  const msg = err?.message || ''
  return msg.includes('No rows') || msg.includes('PGRST116') || msg.includes('null')
}

function createAuthStore() {
  let state = {
    loading: true,
    session: null,
    user: null,
    profile: null,
  }

  const listeners = new Set()
  let unsubscribe = null

  const setState = (patch) => {
    state = { ...state, ...patch }
    for (const cb of listeners) cb(state)
  }

  const loadProfile = async (userId) => {
    if (!userId) return
    try {
      const profile = await getProfile(userId)
      setState({ profile })
    } catch (err) {
      if (isNewUserError(err)) {
        setState({ profile: null })
        return
      }
      throw err
    }
  }

  return {
    getState() {
      return state
    },
    subscribe(cb) {
      listeners.add(cb)
      return () => listeners.delete(cb)
    },
    async init() {
      if (unsubscribe) return

      setState({ loading: true })
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession()
        setState({ session: session || null, user: session?.user || null })
        if (session?.user?.id) {
          loadProfile(session.user.id).catch((e) => console.error(e))
        }

        const {
          data: { subscription },
        } = supabase.auth.onAuthStateChange(async (_event, nextSession) => {
          setState({ session: nextSession || null, user: nextSession?.user || null })
          if (nextSession?.user?.id) {
            try {
              await loadProfile(nextSession.user.id)
            } catch (e) {
              console.error(e)
            }
          } else {
            setState({ profile: null })
          }
        })

        unsubscribe = () => subscription.unsubscribe()
      } finally {
        setState({ loading: false })
      }
    },
    async refreshProfile() {
      const userId = state.user?.id
      if (!userId) return
      await loadProfile(userId)
    },
    async signIn(email, password) {
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) throw error
    },
    async signUp(email, password) {
      const { data, error } = await supabase.auth.signUp({ email, password })
      if (error) throw error
      return data
    },
    async signOut() {
      const { error } = await supabase.auth.signOut()
      if (error) throw error
    },
  }
}

export const auth = createAuthStore()

