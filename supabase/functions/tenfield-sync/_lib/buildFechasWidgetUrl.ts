export interface FechasWidgetParams {
  widgetId: string
  totalFechas: number
}

/**
 * Se pide siempre el rango completo de fechas de la etapa (1..totalFechas) en vez
 * de solo las ultimas, para no depender de "que fecha se esta jugando hoy": las
 * fechas que tenfield todavia no publico simplemente no aparecen en la respuesta.
 */
export function buildFechasWidgetUrl({ widgetId, totalFechas }: FechasWidgetParams): string {
  const days = Array.from({ length: totalFechas }, (_, i) => i + 1).join(',')
  return (
    'https://estadisticas.tenfield.com.uy/widgets/tf-fechas.php' +
    `?id=${widgetId}&days=${days}&style=tab&current_type=&active_index=10&tf-theme=default`
  )
}
