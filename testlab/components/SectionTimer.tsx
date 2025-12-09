'use client'

import { useEffect, useState } from 'react'
import { formatTime } from '@/lib/timer'

interface SectionTimerProps {
  sectionAttemptId: string
  initialSeconds: number
  onExpire: () => void
}

export function SectionTimer({ sectionAttemptId, initialSeconds, onExpire }: SectionTimerProps) {
  const [remainingSeconds, setRemainingSeconds] = useState(initialSeconds)
  const [isExpired, setIsExpired] = useState(false)

  useEffect(() => {
    if (isExpired || remainingSeconds <= 0) return

    const interval = setInterval(() => {
      setRemainingSeconds((prev) => {
        if (prev <= 1) {
          setIsExpired(true)
          onExpire()
          return 0
        }
        return prev - 1
      })
    }, 1000)

    // Sync with server every 30 seconds
    const syncInterval = setInterval(async () => {
      try {
        const response = await fetch(`/api/section-attempts/${sectionAttemptId}/heartbeat`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ remainingSecondsClient: remainingSeconds }),
        })

        if (response.ok) {
          const data = await response.json()
          if (data.expired) {
            setIsExpired(true)
            onExpire()
          } else {
            setRemainingSeconds(data.sectionAttempt.remainingSeconds)
          }
        }
      } catch (error) {
        console.error('Failed to sync timer:', error)
      }
    }, 30000)

    return () => {
      clearInterval(interval)
      clearInterval(syncInterval)
    }
  }, [sectionAttemptId, remainingSeconds, isExpired, onExpire])

  const isLowTime = remainingSeconds < 300 // Less than 5 minutes

  return (
    <div className={`flex items-center space-x-2 ${isLowTime ? 'text-red-600' : 'text-gray-700'}`}>
      <svg
        className="w-5 h-5"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
        />
      </svg>
      <span className="font-mono font-semibold text-lg">{formatTime(remainingSeconds)}</span>
    </div>
  )
}

