import { act, fireEvent, render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it } from 'vitest'
import { HIGH_SCORE_STORAGE_KEY } from './highScore'
import { BOARD_COLUMNS, BOARD_ROWS, INITIAL_SNAKE_LENGTH } from './snakeGame'
import { MIN_SWIPE_DISTANCE_PX } from './snakeInput'
import { SnakeGamePage } from './SnakeGamePage'
import { resetSavedSnakeGame } from './useSnakeGame'

beforeEach(() => {
  localStorage.clear()
  resetSavedSnakeGame()
})

function swipe(target: HTMLElement, deltaX: number, deltaY: number) {
  fireEvent.touchStart(target, { touches: [{ clientX: 100, clientY: 100 }] })
  fireEvent.touchEnd(target, { changedTouches: [{ clientX: 100 + deltaX, clientY: 100 + deltaY }] })
}

describe('SnakeGamePage', () => {
  it('dibuja el tablero con la víbora y la comida', () => {
    render(<SnakeGamePage />)

    expect(screen.getAllByTestId('snake-cell')).toHaveLength(BOARD_COLUMNS * BOARD_ROWS)
    expect(document.querySelectorAll('.snake-cell.is-snake')).toHaveLength(INITIAL_SNAKE_LENGTH)
    expect(document.querySelectorAll('.snake-cell.is-food')).toHaveLength(1)
  })

  it('muestra el puntaje y el récord guardado', () => {
    localStorage.setItem(HIGH_SCORE_STORAGE_KEY, '17')

    render(<SnakeGamePage />)

    expect(screen.getByLabelText('Puntaje')).toHaveTextContent('0')
    expect(screen.getByLabelText('Récord')).toHaveTextContent('17')
  })

  it('invita a tocar para empezar y arranca con un toque', () => {
    render(<SnakeGamePage />)
    expect(screen.getByText(/tocá para jugar/i)).toBeInTheDocument()

    fireEvent.click(screen.getByTestId('snake-screen'))

    expect(screen.queryByText(/tocá para jugar/i)).not.toBeInTheDocument()
  })

  it('una flecha del teclado arranca el juego y evita el scroll de la página', () => {
    render(<SnakeGamePage />)

    const event = new KeyboardEvent('keydown', { key: 'ArrowUp', cancelable: true })
    act(() => {
      window.dispatchEvent(event)
    })

    expect(event.defaultPrevented).toBe(true)
    expect(screen.queryByText(/tocá para jugar/i)).not.toBeInTheDocument()
  })

  it('un swipe arranca el juego', () => {
    render(<SnakeGamePage />)

    swipe(screen.getByTestId('snake-screen'), 0, -MIN_SWIPE_DISTANCE_PX * 2)

    expect(screen.queryByText(/tocá para jugar/i)).not.toBeInTheDocument()
  })

  it('al desmontar deja de capturar las flechas', () => {
    const { unmount } = render(<SnakeGamePage />)
    unmount()

    const event = new KeyboardEvent('keydown', { key: 'ArrowUp', cancelable: true })
    window.dispatchEvent(event)

    expect(event.defaultPrevented).toBe(false)
  })
})
