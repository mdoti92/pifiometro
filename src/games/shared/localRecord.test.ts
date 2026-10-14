import { beforeEach, describe, expect, it } from 'vitest'
import {
  addPendingResult,
  clearPendingResult,
  loadLocalRecord,
  loadPendingResult,
  localRecordStorageKey,
  saveLocalRecordIfBetter,
} from './localRecord'

beforeEach(() => {
  localStorage.clear()
})

describe('récord local', () => {
  it('usa una clave separada por juego (compatible con la de la Viborita)', () => {
    expect(localRecordStorageKey('snake')).toBe('pifiometro.games.snake.highScore')
    expect(localRecordStorageKey('tetris')).not.toBe(localRecordStorageKey('snake'))
  })

  it('devuelve null si nunca se jugó o lo guardado no es válido', () => {
    expect(loadLocalRecord('snake')).toBeNull()
    localStorage.setItem(localRecordStorageKey('snake'), 'basura')
    expect(loadLocalRecord('snake')).toBeNull()
  })

  it('con highest guarda solo si supera el récord', () => {
    expect(saveLocalRecordIfBetter('snake', 'highest', 5)).toBe(5)
    expect(saveLocalRecordIfBetter('snake', 'highest', 3)).toBe(5)
    expect(loadLocalRecord('snake')).toBe(5)
  })

  it('con lowest guarda solo si es menor', () => {
    saveLocalRecordIfBetter('minesweeper', 'lowest', 80)
    expect(saveLocalRecordIfBetter('minesweeper', 'lowest', 60)).toBe(60)
    expect(saveLocalRecordIfBetter('minesweeper', 'lowest', 90)).toBe(60)
  })

  it('con cumulative acumula', () => {
    saveLocalRecordIfBetter('pong', 'cumulative', 1)
    expect(saveLocalRecordIfBetter('pong', 'cumulative', 1)).toBe(2)
  })

  it('un 0 en highest cuenta como primera marca', () => {
    expect(saveLocalRecordIfBetter('snake', 'highest', 0)).toBe(0)
  })
})

describe('resultado pendiente de subir', () => {
  it('en highest se queda con el mejor pendiente', () => {
    addPendingResult('snake', 'highest', 4)
    addPendingResult('snake', 'highest', 2)
    expect(loadPendingResult('snake')).toBe(4)
  })

  it('en cumulative suma los pendientes', () => {
    addPendingResult('pong', 'cumulative', 1)
    addPendingResult('pong', 'cumulative', 1)
    expect(loadPendingResult('pong')).toBe(2)
  })

  it('se puede limpiar después de subirlo', () => {
    addPendingResult('snake', 'highest', 4)
    clearPendingResult('snake')
    expect(loadPendingResult('snake')).toBeNull()
  })
})
