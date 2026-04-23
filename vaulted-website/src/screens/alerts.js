import { el } from '../ui/dom'
import { supabase } from '../services/supabase'

export function screenAlerts() {
  const root = el('div', { class: 'max-w-lg mx-auto p-3' })
  root.appendChild(
    el(
      'div',
      { class: 'flex items-center justify-center min-h-screen' },
      el('div', { class: 'muted', text: 'Loading alerts...' })
    )
  )

  const load = async () => {
    const { data, error } = await supabase
      .from('alerts')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(50)
    if (error) throw error
    return data || []
  }

  const renderList = (alerts) => {
    root.replaceChildren(
      el(
        'div',
        { class: 'flex justify-between items-center mb-4' },
        el('h2', { class: 'text-xl font-bold', text: 'Recent Alerts' }),
        el('button', { type: 'button', class: 'text-sm text-[#98079d]', text: 'Refresh', onClick: refresh })
      ),
      ...(alerts.length
        ? alerts.map((alert) =>
            el(
              'div',
              { class: 'card p-4 mb-3' },
              el(
                'div',
                { class: 'flex items-center gap-3 mb-2' },
                el('span', {
                  class: `w-3 h-3 rounded-full ${
                    alert.type === 'police' || alert.type === 'alarm'
                      ? 'bg-red-500'
                      : alert.type === 'security'
                        ? 'bg-yellow-500'
                        : 'bg-green-500'
                  }`,
                }),
                el('span', { class: 'font-bold uppercase', text: alert.type || 'alert' }),
                el('span', { class: 'muted text-xs', text: alert.source ? `(${alert.source})` : '' })
              ),
              el('p', { class: 'mb-2', text: alert.note || 'No note' }),
              el('p', { class: 'muted text-xs', text: new Date(alert.created_at).toLocaleString() })
            )
          )
        : [el('div', { class: 'text-center muted py-10', text: 'No alerts found' })])
    )
  }

  const renderError = (msg) => {
    root.replaceChildren(
      el(
        'div',
        { class: 'flex items-center justify-center min-h-screen' },
        el(
          'div',
          { class: 'card p-6 text-center' },
          el('h3', { class: 'font-bold mb-2', text: 'Error loading alerts' }),
          el('p', { class: 'muted', text: msg }),
          el('button', { type: 'button', class: 'btn-primary w-full mt-4', text: 'Retry', onClick: refresh })
        )
      )
    )
  }

  const refresh = async () => {
    try {
      root.replaceChildren(
        el(
          'div',
          { class: 'flex items-center justify-center min-h-screen' },
          el('div', { class: 'muted', text: 'Loading alerts...' })
        )
      )
      const alerts = await load()
      renderList(alerts)
    } catch (err) {
      console.error(err)
      renderError(err?.message || String(err))
    }
  }

  refresh().catch((e) => console.error(e))
  return root
}
