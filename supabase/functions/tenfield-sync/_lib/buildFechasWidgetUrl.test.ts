import { describe, expect, it } from 'vitest'
import { buildFechasWidgetUrl } from './buildFechasWidgetUrl'

describe('buildFechasWidgetUrl', () => {
  it('arma la url con el rango completo de fechas de la etapa, de 1 a totalFechas', () => {
    const url = buildFechasWidgetUrl({ widgetId: '11918', totalFechas: 15 })

    expect(url).toBe(
      'https://estadisticas.tenfield.com.uy/widgets/tf-fechas.php' +
        '?id=11918&days=1,2,3,4,5,6,7,8,9,10,11,12,13,14,15' +
        '&style=tab&current_type=&active_index=10&tf-theme=default',
    )
  })

  it('con una sola fecha en la etapa arma el rango de un solo elemento', () => {
    const url = buildFechasWidgetUrl({ widgetId: '11918', totalFechas: 1 })

    expect(url).toContain('days=1&')
  })
})
