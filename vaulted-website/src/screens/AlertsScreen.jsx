import { useState, useEffect } from 'react'
import { supabase } from '../services/supabase'

export default function AlertsScreen() {
  const [alerts, setAlerts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    loadAlerts()
  }, [])

  const loadAlerts = async () => {
    try {
      const { data, error } = await supabase
        .from('alerts')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50)

      if (error) throw error
      setAlerts(data || [])
    } catch (err) {
      console.error('Failed to load alerts:', err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="muted">Loading alerts...</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="card p-6 text-center">
          <h3 className="font-bold mb-2">Error loading alerts</h3>
          <p className="muted">{error}</p>
          <button onClick={loadAlerts} className="btn-primary mt-4">
            Retry
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-lg mx-auto p-3">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold">Recent Alerts</h2>
        <button onClick={loadAlerts} className="text-sm text-[#98079d]">
          Refresh
        </button>
      </div>
      {alerts.length === 0 ? (
        <div className="text-center muted py-10">No alerts found</div>
      ) : (
        alerts.map((alert) => (
          <div key={alert.id} className="card p-4 mb-3">
            <div className="flex items-center gap-3 mb-2">
              <span
                className={`w-3 h-3 rounded-full ${
                  alert.type === 'police' || alert.type === 'alarm'
                    ? 'bg-red-500'
                    : alert.type === 'security'
                    ? 'bg-yellow-500'
                    : 'bg-green-500'
                }`}
              ></span>
              <span className="font-bold uppercase">{alert.type}</span>
              <span className="muted text-xs">({alert.source})</span>
            </div>
            <p className="mb-2">{alert.note || 'No note'}</p>
            <p className="muted text-xs">{new Date(alert.created_at).toLocaleString()}</p>
          </div>
        ))
      )}
    </div>
  )
}
