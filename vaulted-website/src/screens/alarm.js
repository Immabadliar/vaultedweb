import { el } from '../ui/dom'

export function screenAlarm() {
  let armed = true
  let status = 'Requesting location...'

  const statusText = el('div', { class: 'text-lg font-bold', text: status })
  const armedBtn = el('button', { type: 'button', class: 'px-4 py-2 rounded', text: 'ON' })

  const syncUi = () => {
    statusText.textContent = status
    statusText.className = `text-lg font-bold ${
      status.includes('THREAT') || status.includes('denied') ? 'text-red-500' : 'text-green-500'
    }`
    armedBtn.textContent = armed ? 'ON' : 'OFF'
    armedBtn.className = `px-4 py-2 rounded ${armed ? 'bg-green-500 text-black' : 'bg-gray-600 text-white'}`
  }

  armedBtn.addEventListener('click', () => {
    armed = !armed
    syncUi()
  })

  // Request location permission on mount.
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(
      () => {
        status = 'Armed and listening'
        syncUi()
      },
      () => {
        status = 'Location denied'
        syncUi()
      }
    )
  } else {
    status = 'Geolocation not supported'
  }

  syncUi()

  return el(
    'div',
    { class: 'max-w-lg mx-auto p-4' },
    el('h2', { class: 'text-xl font-bold mb-2', text: 'Proximity Alarm' }),
    el('p', { class: 'muted mb-4', text: 'Location-based police/alarm detection' }),
    el(
      'div',
      { class: 'card p-4 mb-4' },
      el('div', { class: 'text-sm text-gray-400 mb-1', text: 'Status' }),
      statusText
    ),
    el(
      'div',
      { class: 'card p-4 mb-4' },
      el(
        'div',
        { class: 'flex items-center justify-between mb-4' },
        el('span', { class: 'font-bold', text: 'Armed' }),
        armedBtn
      ),
      el('p', {
        class: 'muted text-sm',
        text: "When armed, you'll receive notifications for police/alarm activity within 600m.",
      })
    )
  )
}

