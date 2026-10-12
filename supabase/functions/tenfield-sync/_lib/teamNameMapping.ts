/**
 * tenfield usa nombres distintos para el mismo equipo segun el widget (ej:
 * "Defensor" vs "Defensor Sporting", "Montevideo City Torque" vs "MC Torque"),
 * por eso el mapeo es explicito en vez de derivar el slug del nombre.
 */
const TENFIELD_NAME_TO_SLUG: Record<string, string> = {
  Albion: 'albion',
  'Boston River': 'boston-river',
  'Central Español': 'central-espanol',
  'Central Espanol': 'central-espanol',
  Cerro: 'cerro',
  'Cerro Largo': 'cerro-largo',
  Danubio: 'danubio',
  Defensor: 'defensor',
  'Defensor Sporting': 'defensor',
  'Deportivo Maldonado': 'deportivo-maldonado',
  Juventud: 'juventud',
  Liverpool: 'liverpool',
  Nacional: 'nacional',
  Peñarol: 'penarol',
  Penarol: 'penarol',
  Progreso: 'progreso',
  Racing: 'racing',
  Torque: 'torque',
  'Montevideo City Torque': 'torque',
  'MC Torque': 'torque',
  Wanderers: 'wanderers',
}

export function resolveTeamSlug(tenfieldName: string): string | null {
  return TENFIELD_NAME_TO_SLUG[tenfieldName.trim()] ?? null
}
