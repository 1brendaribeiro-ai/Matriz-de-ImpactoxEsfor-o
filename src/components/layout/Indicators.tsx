import { useMemo } from 'react'
import { countByQuadrant, QUADRANT_ORDER, QUADRANTS } from '../../domain/quadrants'
import type { Improvement, StatusFilter } from '../../domain/types'

interface IndicatorsProps {
  items: Improvement[]
  activeStatus: StatusFilter
  onSelectStatus: (status: StatusFilter) => void
}

/** Indicadores do topo. Clicar em um indicador filtra as melhorias pelo status correspondente. */
export function Indicators({ items, activeStatus, onSelectStatus }: IndicatorsProps) {
  const counts = useMemo(() => countByQuadrant(items), [items])
  const unclassified = items.filter((i) => !i.position).length

  const tiles: { status: StatusFilter; label: string; value: number; tone: string; testId: string }[] = [
    { status: 'all', label: 'Total de melhorias', value: items.length, tone: 'total', testId: 'kpi-total' },
    { status: 'unclassified', label: 'Não classificadas', value: unclassified, tone: 'unclassified', testId: 'kpi-unclassified' },
    ...QUADRANT_ORDER.map((id) => ({
      status: id as StatusFilter,
      label: QUADRANTS[id].title,
      value: counts[id],
      tone: id,
      testId: `kpi-${id}`,
    })),
  ]

  return (
    <div className="indicators" role="list" aria-label="Indicadores">
      {tiles.map((t) => {
        const selected = activeStatus === t.status && t.status !== 'all'
        return (
          <button
            key={t.status}
            type="button"
            role="listitem"
            className={`kpi kpi-${t.tone}${selected ? ' is-selected' : ''}`}
            onClick={() => onSelectStatus(selected ? 'all' : t.status)}
            title={t.status === 'all' ? 'Mostrar todas' : `Filtrar: ${t.label}`}
            data-testid={t.testId}
          >
            <span className="kpi-label">{t.label}</span>
            <span className="kpi-value" data-testid={`${t.testId}-value`}>
              {t.value}
            </span>
          </button>
        )
      })}
    </div>
  )
}
