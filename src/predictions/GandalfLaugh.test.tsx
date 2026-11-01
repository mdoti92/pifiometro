import { act, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { GANDALF_GIF_URL, GandalfLaugh } from './GandalfLaugh'

describe('GandalfLaugh', () => {
  afterEach(() => {
    vi.useRealTimers()
  })

  it('muestra el gif de Gandalf con el aviso de que el partido ya arranco', () => {
    render(<GandalfLaugh onClose={vi.fn()} />)

    const dialog = screen.getByRole('dialog', { name: '¡No puedes pasar!' })
    expect(dialog).toBeInTheDocument()
    expect(screen.getByRole('img', { name: 'Gandalf riéndose' })).toHaveAttribute('src', GANDALF_GIF_URL)
    expect(screen.getByText('El partido ya arrancó, el pronóstico está cerrado.')).toBeInTheDocument()
  })

  it('se cierra al tocarlo', async () => {
    const onClose = vi.fn()
    const user = userEvent.setup()
    render(<GandalfLaugh onClose={onClose} />)

    await user.click(screen.getByRole('dialog', { name: '¡No puedes pasar!' }))

    expect(onClose).toHaveBeenCalled()
  })

  it('se cierra solo despues de unos segundos', () => {
    vi.useFakeTimers()
    const onClose = vi.fn()
    render(<GandalfLaugh onClose={onClose} />)

    act(() => {
      vi.advanceTimersByTime(3999)
    })
    expect(onClose).not.toHaveBeenCalled()

    act(() => {
      vi.advanceTimersByTime(1)
    })
    expect(onClose).toHaveBeenCalled()
  })
})
