import { MousePointerClick } from 'lucide-react'
import { QUADRANT_ORDER, QUADRANTS } from '../../domain/quadrants'
import type { QuadrantId } from '../../domain/types'

interface QuadrantLayerProps {
  counts: Record<QuadrantId, number>
  activeQuadrant?: QuadrantId | null
  dragging?: boolean
}

/** Fundo 2x2 da matriz com os cabeçalhos dos quadrantes. */
export function QuadrantLayer({ counts, activeQuadrant = null, dragging = false }: QuadrantLayerProps) {
  return (
    <div className="quadrant-grid" aria-hidden="true">
      {QUADRANT_ORDER.map((id) => {
        const q = QUADRANTS[id]
        const isActive = activeQuadrant === id
        return (
          <div
            key={id}
            className={`quadrant q-${id}${isActive ? ' is-drop-target' : ''}${dragging ? ' is-dragging' : ''}`}
            data-testid={`quadrant-${id}`}
            data-active={isActive || undefined}
          >
            <div className="quadrant-header">
              <div className="quadrant-axes">{q.axes}</div>
              <div className="quadrant-title-row">
                <span className="quadrant-title">{q.title}</span>
                <span className="quadrant-count">{counts[id]}</span>
              </div>
              <div className="quadrant-action">{q.action}</div>
            </div>
            {isActive && (
              <div className="drop-hint">
                <MousePointerClick size={14} />
                Soltar aqui
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
