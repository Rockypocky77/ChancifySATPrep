/**
 * Timer utilities for section timing
 */

export function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60)
  const secs = seconds % 60
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
}

export function calculateElapsedSeconds(startedAt: Date | null, now: Date = new Date()): number {
  if (!startedAt) return 0
  return Math.floor((now.getTime() - startedAt.getTime()) / 1000)
}

export function calculateRemainingSeconds(
  durationSeconds: number,
  startedAt: Date | null,
  now: Date = new Date()
): number {
  if (!startedAt) return durationSeconds
  const elapsed = calculateElapsedSeconds(startedAt, now)
  return Math.max(0, durationSeconds - elapsed)
}

