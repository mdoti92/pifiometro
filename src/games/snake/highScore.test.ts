import { beforeEach, describe, expect, it } from 'vitest'
import { HIGH_SCORE_STORAGE_KEY, loadHighScore, saveHighScoreIfBetter } from './highScore'

beforeEach(() => {
  localStorage.clear()
})

describe('loadHighScore', () => {
  it('devuelve 0 si nunca se jugó', () => {
    expect(loadHighScore()).toBe(0)
  })

  it('devuelve el récord guardado', () => {
    localStorage.setItem(HIGH_SCORE_STORAGE_KEY, '12')

    expect(loadHighScore()).toBe(12)
  })

  it('devuelve 0 si lo guardado no es un número válido', () => {
    localStorage.setItem(HIGH_SCORE_STORAGE_KEY, 'basura')

    expect(loadHighScore()).toBe(0)
  })
})

describe('saveHighScoreIfBetter', () => {
  it('guarda y devuelve el puntaje si supera el récord', () => {
    localStorage.setItem(HIGH_SCORE_STORAGE_KEY, '5')

    expect(saveHighScoreIfBetter(8)).toBe(8)
    expect(loadHighScore()).toBe(8)
  })

  it('no pisa el récord con un puntaje menor o igual', () => {
    localStorage.setItem(HIGH_SCORE_STORAGE_KEY, '5')

    expect(saveHighScoreIfBetter(5)).toBe(5)
    expect(saveHighScoreIfBetter(3)).toBe(5)
    expect(loadHighScore()).toBe(5)
  })
})
