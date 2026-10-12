export interface Countdown {
  days: number
  hours: number
  minutes: number
  seconds: number
}

const MS_PER_SECOND = 1000
const SECONDS_PER_MINUTE = 60
const MINUTES_PER_HOUR = 60
const HOURS_PER_DAY = 24

export function formatCountdown(msRemaining: number): Countdown {
  const totalSeconds = Math.max(0, Math.floor(msRemaining / MS_PER_SECOND))
  const totalMinutes = Math.floor(totalSeconds / SECONDS_PER_MINUTE)
  const totalHours = Math.floor(totalMinutes / MINUTES_PER_HOUR)

  return {
    days: Math.floor(totalHours / HOURS_PER_DAY),
    hours: totalHours % HOURS_PER_DAY,
    minutes: totalMinutes % MINUTES_PER_HOUR,
    seconds: totalSeconds % SECONDS_PER_MINUTE,
  }
}

function pad(value: number): string {
  return String(value).padStart(2, '0')
}

export function formatCountdownLabel({ days, hours, minutes, seconds }: Countdown): string {
  const time = `${pad(hours)}h ${pad(minutes)}m ${pad(seconds)}s`
  return days > 0 ? `${days}d ${time}` : time
}
