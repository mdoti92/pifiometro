import { useEffect } from 'react'

// Gif elegido por el usuario (Giphy): https://giphy.com/gifs/lotr-please-and-thank-CNAhQuDceLwwo
export const GANDALF_GIF_URL = 'https://media.giphy.com/media/CNAhQuDceLwwo/giphy.gif'

const AUTO_CLOSE_MS = 4000

interface GandalfLaughProps {
  onClose: () => void
}

export function GandalfLaugh({ onClose }: GandalfLaughProps) {
  useEffect(() => {
    const timer = setTimeout(onClose, AUTO_CLOSE_MS)
    return () => clearTimeout(timer)
  }, [onClose])

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="gandalf-laugh-title"
      className="gandalf-laugh"
      onClick={onClose}
    >
      <div className="gandalf-laugh-card">
        <img src={GANDALF_GIF_URL} alt="Gandalf riéndose" />
        <p id="gandalf-laugh-title" className="font-display">
          ¡No puedes pasar!
        </p>
        <p>El partido ya arrancó, el pronóstico está cerrado.</p>
      </div>
    </div>
  )
}
