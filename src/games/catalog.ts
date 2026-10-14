import type { GameMetric } from './ranking/rankingLogic'

export interface GameDefinition {
  key: string
  name: string
  description: string
  path: string
  metric: GameMetric
  formatValue?: (value: number) => string
  /** Qué hay que lograr, para mostrar en la pantalla de inicio del juego. */
  goal: string
  /** Controles en celular y en compu, para mostrar en la pantalla de inicio del juego. */
  howToPlay: string
}

export const SNAKE_GAME: GameDefinition = {
  key: 'snake',
  name: 'Viborita',
  description: 'La del Nokia 1100, de toda la vida',
  path: '/games/snake',
  metric: 'highest',
  goal: 'Comé todos los puntitos que puedas sin morderte la cola: cada uno te hace más larga.',
  howToPlay:
    'Deslizá en cualquier parte de la pantalla para cambiar de dirección (en la compu, flechas). Los bordes te pasan al otro lado.',
}

export const SPRING_BALL_GAME: GameDefinition = {
  key: 'spring-ball',
  name: 'Spring Ball',
  description: 'La pelotita saltarina del Motorola C115',
  path: '/games/spring-ball',
  metric: 'highest',
  goal: 'Subí lo más alto posible rebotando de plataforma en plataforma sin caerte.',
  howToPlay:
    'La pelota rebota sola. Mantené tocada la mitad izquierda o derecha para moverla (flechas ← →). Si sale por un costado, aparece del otro.',
}

export const SMALL_BEE_GAME: GameDefinition = {
  key: 'small-bee',
  name: 'Small Bee',
  description: 'La abejita a los aguijonazos, también del C115',
  path: '/games/small-bee',
  metric: 'highest',
  goal: 'Bajá a todos los bichos antes de que lleguen abajo. Tenés 3 vidas.',
  howToPlay:
    'La abeja dispara sola. Mantené tocada la mitad izquierda o derecha para moverla (flechas ← →). Con más puntaje, los bichos bajan más rápido.',
}

export const FLAPPY_GAME: GameDefinition = {
  key: 'flappy',
  name: 'Flappy Bird',
  description: 'Pasá entre las tuberías sin chocar',
  path: '/games/flappy',
  metric: 'highest',
  goal: 'Pasá entre la mayor cantidad de tuberías sin chocar.',
  howToPlay:
    'Tocá la pantalla para aletear (espacio o ↑). Si no tocás, el pájaro cae. Ojo con el piso y el techo.',
}

export const TETRIS_GAME: GameDefinition = {
  key: 'tetris',
  name: 'Tetris',
  description: 'Encajá las piezas y borrá líneas',
  path: '/games/tetris',
  metric: 'highest',
  goal: 'Completá líneas horizontales para borrarlas antes de que las piezas lleguen arriba.',
  howToPlay:
    'Deslizá ← → para mover, tocá para rotar y deslizá ↓ para soltar la pieza (en la compu: flechas, ↑ rota y ↓ suelta).',
}

export const PENALTIES_GAME: GameDefinition = {
  key: 'penalties',
  name: 'Penales',
  description: 'Muerte súbita desde los once metros',
  path: '/games/penales',
  metric: 'highest',
  goal: 'Meté la mayor cantidad de goles seguidos: el primer penal que errás termina la serie.',
  howToPlay:
    'Una mira recorre el arco: tocá (o espacio) cuando esté donde querés patear. El arquero se tira a una de las tres zonas: si adivina la tuya, ataja.',
}

const SECONDS_PER_MINUTE = 60

export function formatSeconds(totalSeconds: number): string {
  const minutes = Math.floor(totalSeconds / SECONDS_PER_MINUTE)
  const seconds = totalSeconds % SECONDS_PER_MINUTE
  return `${minutes}:${String(seconds).padStart(2, '0')}`
}

const TENTHS_PER_SECOND = 10

export function formatTenths(totalTenths: number): string {
  return `${formatSeconds(Math.floor(totalTenths / TENTHS_PER_SECOND))}.${totalTenths % TENTHS_PER_SECOND}`
}

export const MINESWEEPER_GAME: GameDefinition = {
  key: 'minesweeper',
  name: 'Buscaminas',
  description: 'Destapá todo sin pisar una mina',
  path: '/games/buscaminas',
  metric: 'lowest',
  formatValue: formatSeconds,
  goal: 'Destapá todas las casillas que no tienen mina, en el menor tiempo posible.',
  howToPlay:
    'Tocá para destapar: el número dice cuántas minas hay alrededor. Mantené presionado (o click derecho) para marcar una mina con bandera.',
}

export const TWENTY48_GAME: GameDefinition = {
  key: '2048',
  name: '2048',
  description: 'Juntá fichas iguales hasta llegar a 2048',
  path: '/games/2048',
  metric: 'highest',
  goal: 'Juntá fichas iguales para que se sumen hasta llegar a la ficha 2048.',
  howToPlay:
    'Deslizá en cualquier dirección (o flechas) y todas las fichas se mueven hacia ese lado. Dos fichas iguales que se tocan se fusionan.',
}

export const PONG_GAME: GameDefinition = {
  key: 'pong',
  name: 'Pong',
  description: 'Paletas contra la CPU, partido a 5',
  path: '/games/pong',
  metric: 'cumulative',
  goal: 'Ganale a la CPU: el primero que llega a 5 puntos gana el partido.',
  howToPlay:
    'Arrastrá el dedo para mover tu paleta de abajo (flechas ← →). Según dónde pegue la pelota en la paleta, cambia el ángulo.',
}

export const DINO_GAME: GameDefinition = {
  key: 'dino',
  name: 'Dino',
  description: 'Corré y saltá los cactus',
  path: '/games/dino',
  metric: 'highest',
  goal: 'Corré lo más lejos posible sin chocar los cactus.',
  howToPlay:
    'Tocá la pantalla para saltar (espacio o ↑). Cada vez vas más rápido.',
}

export const BREAKOUT_GAME: GameDefinition = {
  key: 'breakout',
  name: 'Breakout',
  description: 'Rompé todos los ladrillos con la pelotita',
  path: '/games/breakout',
  metric: 'highest',
  goal: 'Rompé todos los ladrillos sin dejar caer la pelota. Tenés 3 vidas.',
  howToPlay:
    'Arrastrá el dedo para mover la paleta (flechas ← →) y tocá (o espacio) para lanzar la pelota. Pegale con los bordes de la paleta para cambiar el ángulo.',
}

export const VRALLY_GAME: GameDefinition = {
  key: 'vrally',
  name: 'V-Rally',
  description: 'Rally contra reloj del Sony Ericsson T290',
  path: '/games/v-rally',
  metric: 'lowest',
  formatValue: formatTenths,
  goal: 'Llegá a la meta en el menor tiempo posible pasando a los rivales.',
  howToPlay:
    'El auto acelera solo. Mantené tocada la mitad izquierda o derecha para doblar (flechas ← →). El pasto te frena, los árboles te paran y a los rivales hay que pasarlos por otro carril.',
}

export const DEEP_ABYSS_GAME: GameDefinition = {
  key: 'deep-abyss',
  name: 'Deep Abyss',
  description: 'Bajá al fondo del abismo, del Sony Ericsson T290',
  path: '/games/deep-abyss',
  metric: 'highest',
  goal: 'Bajá hasta la salida del fondo de cada nivel. Las gemas y los cofres suman puntos.',
  howToPlay:
    'Usá ◀ ▶ y Saltar (en la compu ← → y espacio). Subite a las burbujas para cruzar la lava. Pinchos y lava te quitan una vida.',
}

export const GAMES: GameDefinition[] = [
  SNAKE_GAME,
  SPRING_BALL_GAME,
  SMALL_BEE_GAME,
  FLAPPY_GAME,
  TETRIS_GAME,
  PENALTIES_GAME,
  MINESWEEPER_GAME,
  TWENTY48_GAME,
  PONG_GAME,
  DINO_GAME,
  BREAKOUT_GAME,
  VRALLY_GAME,
  DEEP_ABYSS_GAME,
]

export function formatGameValue(game: GameDefinition, value: number): string {
  return game.formatValue ? game.formatValue(value) : String(value)
}
