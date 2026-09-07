export interface Countdown {
  hours: number
  minutes: number
  seconds: number
}

const MS_PER_SECOND = 1000
const SECONDS_PER_MINUTE = 60
const MINUTES_PER_HOUR = 60

export function formatCountdown(msRemaining: number): Countdown {
  const totalSeconds = Math.max(0, Math.floor(msRemaining / MS_PER_SECOND))

  return {
    hours: Math.floor(totalSeconds / (SECONDS_PER_MINUTE * MINUTES_PER_HOUR)),
    minutes: Math.floor(totalSeconds / SECONDS_PER_MINUTE) % MINUTES_PER_HOUR,
    seconds: totalSeconds % SECONDS_PER_MINUTE,
  }
}
