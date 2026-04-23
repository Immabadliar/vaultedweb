import { el } from '../ui/dom'
import { auth } from '../state/auth'

export function screenAuth({ onDone } = {}) {
  let isSignUp = false
  let showPassword = false
  let busy = false

  const emailInput = el('input', {
    class: 'input-dark w-full',
    type: 'email',
    placeholder: 'Email',
    autocomplete: 'email',
  })

  const passwordInput = el('input', {
    class: 'input-dark w-full pr-10',
    type: 'password',
    placeholder: 'Password',
    autocomplete: isSignUp ? 'new-password' : 'current-password',
  })

  const passwordToggle = el(
    'button',
    {
      type: 'button',
      class: 'password-toggle',
      'aria-label': 'Toggle password',
      onClick() {
        showPassword = !showPassword
        passwordInput.type = showPassword ? 'text' : 'password'
        icon.textContent = showPassword ? 'visibility_off' : 'visibility'
      },
    },
  )
  const icon = el('span', { class: 'material-symbols-outlined', text: 'visibility' })
  passwordToggle.appendChild(icon)

  const submitBtn = el('button', {
    class: 'btn-primary w-full mb-3',
    type: 'button',
    text: 'Sign in',
    onClick: submit,
  })

  const modeBtn = el('button', {
    class: 'muted text-sm w-full',
    type: 'button',
    text: 'Need an account? Sign up',
    onClick() {
      isSignUp = !isSignUp
      submitBtn.textContent = isSignUp ? 'Create account' : 'Sign in'
      modeBtn.textContent = isSignUp ? 'Already have an account? Sign in' : 'Need an account? Sign up'
      passwordInput.autocomplete = isSignUp ? 'new-password' : 'current-password'
    },
  })

  async function submit() {
    if (busy) return
    const email = emailInput.value.trim()
    const password = passwordInput.value
    if (!email || password.length < 6) return alert('Invalid email/password')

    busy = true
    submitBtn.disabled = true
    submitBtn.textContent = 'Please wait...'

    try {
      if (isSignUp) {
        const data = await auth.signUp(email, password)
        if (data?.session?.user) {
          onDone?.()
        } else {
          alert('Check your email for confirmation, then sign in.')
        }
      } else {
        await auth.signIn(email, password)
        onDone?.()
      }
    } catch (error) {
      const msg = error?.message || String(error)
      if (msg.toLowerCase().includes('timeout') || msg.toLowerCase().includes('network')) {
        alert(
          'Connection error: Unable to reach authentication server. Please check your internet connection and try again.'
        )
      } else {
        alert(msg)
      }
    } finally {
      busy = false
      submitBtn.disabled = false
      submitBtn.textContent = isSignUp ? 'Create account' : 'Sign in'
    }
  }

  const passwordWrap = el(
    'div',
    { class: 'password-container mb-4' },
    passwordInput,
    passwordToggle
  )

  return el(
    'div',
    { class: 'flex items-center justify-center min-h-screen px-4' },
    el(
      'div',
      { class: 'card p-6 w-full max-w-sm' },
      el('h1', { class: 'text-2xl font-bold mb-2', text: 'Vaulted' }),
      el('p', { class: 'muted text-sm mb-6', text: 'Urban exploration intel + social feed' }),
      el('div', { class: 'mb-3' }, emailInput),
      passwordWrap,
      submitBtn,
      modeBtn
    )
  )
}
