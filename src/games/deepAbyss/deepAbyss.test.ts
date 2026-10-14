import { describe, expect, it } from 'vitest'
import {
  CHEST_POINTS,
  GEM_POINTS,
  INITIAL_LIVES,
  JUMP_VELOCITY,
  LEVEL_COMPLETE_BONUS,
  PLAYER_HEIGHT,
  PLAYER_WIDTH,
  SCREEN_HEIGHT,
  SCREEN_WIDTH,
  TILE_SIZE,
  cameraFor,
  createDeepAbyss,
  parseLevel,
  stepDeepAbyss,
  type AbyssInput,
  type DeepAbyssState,
  type LevelDefinition,
} from './deepAbyss'
import { LEVELS } from './levels'

const still: AbyssInput = { move: 0, jump: false }
const none = () => 0.5

// Nivel de prueba chico: piso de arena, pinchos, lava con burbuja, gema, cofre y salida.
const TEST_LEVEL: LevelDefinition = {
  map: [
    '############',
    '#S.g.c.....#',
    '#.........E#',
    '#===~~~====#',
    '############',
  ],
  bubbles: [{ from: [4, 2], to: [6, 2] }],
}

function onTestLevel(overrides: Partial<DeepAbyssState> = {}): DeepAbyssState {
  return { ...createDeepAbyss(none, [TEST_LEVEL]), ...overrides }
}

function run(state: DeepAbyssState, steps: number, input: AbyssInput = still): DeepAbyssState {
  let current = state
  for (let i = 0; i < steps; i++) current = stepDeepAbyss(current, input, none)
  return current
}

function standingAtTile(tileX: number, tileY: number) {
  return { x: tileX * TILE_SIZE + 1, y: (tileY + 1) * TILE_SIZE - PLAYER_HEIGHT, vx: 0, vy: 0, grounded: true, riding: null }
}

describe('parseLevel', () => {
  it('lee el inicio, la salida, los sólidos y las burbujas del tilemap', () => {
    const level = parseLevel(TEST_LEVEL)

    expect(level.start).toEqual({ x: TILE_SIZE, y: TILE_SIZE })
    expect(level.exit).toEqual({ x: 10 * TILE_SIZE, y: 2 * TILE_SIZE })
    expect(level.bubbles).toHaveLength(1)
    expect(level.width).toBe(12 * TILE_SIZE)
  })

  it('el nivel 1 está diseñado como datos: un inicio, una salida en lo más profundo y burbujas sobre la lava', () => {
    const [first] = LEVELS
    const text = first.map.join('')

    expect(text.split('S')).toHaveLength(2)
    expect(text.split('E')).toHaveLength(2)
    const exitRow = first.map.findIndex((row) => row.includes('E'))
    expect(first.map.slice(exitRow + 1).every((row) => /^#+$/.test(row))).toBe(true)
    expect(first.map.some((row) => row.includes('~'))).toBe(true)
    expect(first.bubbles.length).toBeGreaterThan(0)
  })
})

describe('arranque', () => {
  it('empieza en el punto de inicio con 3 vidas y el HUD en cero', () => {
    const state = onTestLevel()

    expect(state.player.x).toBe(TILE_SIZE + (TILE_SIZE - PLAYER_WIDTH) / 2)
    expect(state.lives).toBe(INITIAL_LIVES)
    expect([state.gems, state.chests, state.score]).toEqual([0, 0, 0])
  })
})

describe('movimiento', () => {
  it('camina hacia el lado apretado y no atraviesa la roca', () => {
    const walking = run(onTestLevel(), 10, { move: 1, jump: false })
    expect(walking.player.x).toBeGreaterThan(onTestLevel().player.x)

    const againstWall = run(onTestLevel(), 60, { move: -1, jump: false })
    expect(againstWall.player.x).toBeGreaterThanOrEqual(TILE_SIZE)
  })

  it('salta solo apoyado y cae por gravedad', () => {
    const grounded = run(onTestLevel(), 30)
    expect(grounded.player.grounded).toBe(true)

    const jumping = stepDeepAbyss(grounded, { move: 0, jump: true }, none)
    expect(jumping.player.vy).toBeLessThan(0)
    expect(jumping.player.vy).toBeGreaterThanOrEqual(JUMP_VELOCITY)

    const inAir = stepDeepAbyss(jumping, { move: 0, jump: true }, none)
    expect(inAir.player.vy).toBeGreaterThan(jumping.player.vy)
  })
})

describe('peligros', () => {
  it('tocar lava quita una vida y reaparece en el inicio conservando lo juntado', () => {
    const overLava = onTestLevel({ player: { ...standingAtTile(5, 2), y: 3 * TILE_SIZE - PLAYER_HEIGHT + 2 }, gems: 1, score: GEM_POINTS })

    const next = stepDeepAbyss(overLava, still, none)

    expect(next.lives).toBe(INITIAL_LIVES - 1)
    expect(next.player.x).toBe(onTestLevel().player.x)
    expect(next.gems).toBe(1)
    expect(next.score).toBe(GEM_POINTS)
  })

  it('sin vidas es Game Over', () => {
    const overLava = onTestLevel({ lives: 1, player: { ...standingAtTile(5, 2), y: 3 * TILE_SIZE - PLAYER_HEIGHT + 2 } })

    const next = stepDeepAbyss(overLava, still, none)

    expect(next.phase).toBe('over')
    expect(next.isOver).toBe(true)
  })
})

describe('coleccionables', () => {
  it('juntar una gema y un cofre suma distinto y los saca del nivel', () => {
    const atGem = stepDeepAbyss(onTestLevel({ player: standingAtTile(3, 1) }), still, none)
    expect(atGem.gems).toBe(1)
    expect(atGem.score).toBe(GEM_POINTS)

    const again = stepDeepAbyss(atGem, still, none)
    expect(again.gems).toBe(1)

    const atChest = stepDeepAbyss(onTestLevel({ player: standingAtTile(5, 1) }), still, none)
    expect(atChest.chests).toBe(1)
    expect(atChest.score).toBe(CHEST_POINTS)
    expect(CHEST_POINTS).not.toBe(GEM_POINTS)
  })
})

describe('burbuja', () => {
  it('al caer encima queda montado, lo lleva hasta el otro lado y al soltarse vuelve', () => {
    const level = parseLevel(TEST_LEVEL)
    const bubble = level.bubbles[0]
    const above = onTestLevel({
      player: { x: bubble.from.x + 1, y: bubble.from.y - PLAYER_HEIGHT - 2, vx: 0, vy: 1, grounded: false, riding: null },
    })

    const landed = run(above, 3)
    expect(landed.player.riding).toBe(0)

    const carried = run(landed, 200)
    expect(carried.bubbles[0].x).toBeCloseTo(bubble.to.x)
    expect(carried.lives).toBe(INITIAL_LIVES)

    const off = run(carried, 10, { move: 1, jump: false })
    expect(off.player.riding).toBeNull()
    const back = run(off, 300)
    expect(back.bubbles[0].x).toBeCloseTo(bubble.from.x)
  })
})

describe('salida', () => {
  it('llegar a la salida completa el nivel con bonus', () => {
    const atExit = onTestLevel({ player: standingAtTile(10, 2), score: 10 })

    const next = stepDeepAbyss(atExit, still, none)

    expect(next.phase).toBe('complete')
    expect(next.score).toBe(10 + LEVEL_COMPLETE_BONUS)
  })
})

describe('cameraFor', () => {
  it('sigue al jugador sin salirse de los límites del nivel', () => {
    const level = { width: 400, height: 300 }

    expect(cameraFor({ x: 0, y: 0 }, level)).toEqual({ x: 0, y: 0 })
    expect(cameraFor({ x: 390, y: 290 }, level)).toEqual({ x: 400 - SCREEN_WIDTH, y: 300 - SCREEN_HEIGHT })
    expect(cameraFor({ x: 200, y: 150 }, level).x).toBeCloseTo(200 - SCREEN_WIDTH / 2 + PLAYER_WIDTH / 2)
  })
})

describe('nivel 1', () => {
  // Bot con la ruta pensada para el nivel 1: en cada piso va hacia el hueco o la burbuja, salta los pinchos
  // y en el aire mantiene la dirección.
  const DIRECTION_BY_FLOOR_ROW: Record<number, -1 | 1> = { 3: 1, 8: -1, 12: 1, 17: -1 }

  function createBot() {
    let direction: -1 | 1 = 1
    return (state: DeepAbyssState): AbyssInput => {
      const level = state.levels[0]
      const { player } = state

      if (player.riding !== null) {
        const arrived = Math.abs(state.bubbles[player.riding].x - level.bubbles[player.riding].to.x) < 0.01
        return { move: arrived ? 1 : 0, jump: false }
      }

      const floorRow = Math.round((player.y + PLAYER_HEIGHT) / TILE_SIZE)
      if (player.grounded) direction = DIRECTION_BY_FLOOR_ROW[floorRow] ?? direction

      const lookAhead = direction < 0 ? player.x - TILE_SIZE : player.x + PLAYER_WIDTH + TILE_SIZE
      const spikeAhead = level.tiles[floorRow - 1]?.[Math.floor(lookAhead / TILE_SIZE)] === '^'
      return { move: direction, jump: spikeAhead && player.grounded }
    }
  }

  it('se puede completar sin perder vidas', () => {
    const bot = createBot()
    let state = createDeepAbyss(none, LEVELS)
    for (let i = 0; i < 6000 && state.phase === 'playing'; i++) state = stepDeepAbyss(state, bot(state), none)

    expect(state.phase).toBe('complete')
    expect(state.lives).toBe(INITIAL_LIVES)
  })
})
