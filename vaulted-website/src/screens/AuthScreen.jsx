import { useState } from 'react'
import { useAuth } from '../contexts/AuthContext'

export default function AuthScreen({ onSignIn, onSignUp }) {
  const { signIn, signUp } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [rememberMe, setRememberMe] = useState(true)
  const [isSignUp, setIsSignUp] = useState(false)
  const [loading, setLoading] = useState(false)

  const submit = async () => {
    if (!email.trim() || password.length < 6) return alert('Invalid email/password')
    setLoading(true)
    try {
      if (isSignUp) {
        await signUp(email.trim(), password)
        alert('Check your email for confirmation')
        onSignUp?.() // New account - go to onboarding
      } else {
        await signIn(email.trim(), password)
        if (!rememberMe) {
          console.log('Session will expire when browser closes')
        }
        onSignIn?.() // Existing account - go to feed
      }
    } catch (error) {
      if (error.message.includes('timeout') || error.message.includes('network')) {
        alert('Connection error: Unable to reach authentication server. Please check your internet connection and try again.')
      } else {
        alert(error.message)
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex items-center justify-center min-h-screen px-4">
      <div className="card p-6 w-full max-w-sm">
        <h1 className="text-2xl font-bold mb-2">Vaulted</h1>
        <p className="muted text-sm mb-6">Urban exploration intel + social feed</p>

        <div className="mb-3">
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="input-dark w-full"
          />
        </div>
        <div className="password-container mb-4">
          <input
            type={showPassword ? 'text' : 'password'}
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="input-dark w-full pr-10"
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="password-toggle"
            aria-label={showPassword ? 'Hide password' : 'Show password'}
          >
            <span className="material-symbols-outlined">
              {showPassword ? 'visibility_off' : 'visibility'}
            </span>
          </button>
        </div>

        {!isSignUp && (
          <div className="flex items-center mb-4">
            <input
              type="checkbox"
              id="rememberMe"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
              className="w-4 h-4 rounded border-gray-600 bg-[#1E1E1E] text-[#98079d] focus:ring-[#98079d]"
            />
            <label htmlFor="rememberMe" className="ml-2 text-sm muted cursor-pointer">
              Remember me (stay signed in)
            </label>
          </div>
        )}

        <button
          onClick={submit}
          disabled={loading}
          className={`btn-primary mb-3 ${loading ? 'opacity-50' : ''}`}
        >
          {loading ? 'Please wait...' : isSignUp ? 'Create account' : 'Sign in'}
        </button>

        <button onClick={() => setIsSignUp(!isSignUp)} className="muted text-sm w-full">
          {isSignUp ? 'Already have an account? Sign in' : 'Need an account? Sign up'}
        </button>
      </div>
    </div>
  )
}