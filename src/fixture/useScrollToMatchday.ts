import { useEffect, useRef } from 'react'

export function matchdaySectionId(matchday: number | null): string {
  return `fecha-${matchday ?? 'sin-fecha'}`
}

export function scrollToMatchday(matchday: number, behavior: ScrollBehavior = 'smooth') {
  document.getElementById(matchdaySectionId(matchday))?.scrollIntoView({ behavior, block: 'start' })
}

/** Al cargar (y cada vez que cambia `resetKey`), se para una sola vez en `matchday`. */
export function useScrollToMatchdayOnLoad(matchday: number | null, resetKey: string | undefined) {
  const scrolledForKey = useRef<string | undefined | null>(null)

  useEffect(() => {
    if (matchday === null || scrolledForKey.current === resetKey) return

    scrolledForKey.current = resetKey
    scrollToMatchday(matchday, 'auto')
  }, [matchday, resetKey])
}
