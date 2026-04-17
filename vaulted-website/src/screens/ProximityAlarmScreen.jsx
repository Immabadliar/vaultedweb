import { useState, useEffect } from 'react'

export default function ProximityAlarmScreen() {
  const [armed, setArmed] = useState(true)
  const [status, setStatus] = useState('Requesting location...')

  useEffect(() => {
    // Request location permission on mount
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        () => setStatus('Armed and listening'),
        () => setStatus('Location denied')
      )
    } else {
      setStatus('Geolocation not supported')
    }
  }, [])

  return (
    <div className="max-w-lg mx-auto p-4">
      <h2 className="text-xl font-bold mb-2">Proximity Alarm</h2>
      <p className="muted mb-4">Location-based police/alarm detection</p>

      <div className="card p-4 mb-4">
        <div className="text-sm text-gray-400 mb-1">Status</div>
        <div className={`text-lg font-bold ${status.includes('THREAT') || status.includes('denied') ? 'text-red-500' : 'text-green-500'}`}>
          {status}
        </div>
      </div>

      <div className="card p-4 mb-4">
        <div className="flex items-center justify-between mb-4">
          <span className="font-bold">Armed</span>
          <button
            onClick={() => setArmed(!armed)}
            className={`px-4 py-2 rounded ${armed ? 'bg-green-500 text-black' : 'bg-gray-600 text-white'}`}
          >
            {armed ? 'ON' : 'OFF'}
          </button>
        </div>
        <p className="muted text-sm">
          When armed, you'll receive notifications for police/alarm activity within 600m.
        </p>
      </div>
    </div>
  )
}
