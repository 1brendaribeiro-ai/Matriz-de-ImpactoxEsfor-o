import { MousePointerClick } from 'lucide-react'
import { QUADRANT_ORDER } from '../../domain/quadrants'
import type { QuadrantId } from '../../domain/types'

interface QuadrantLayerProps {
  activeQuadrant?: QuadrantId | null
  dragging?: boolean
}

/** Fundo 2x2 da matriz: quatro áreas visualmente divididas, sem títulos. */
export function QuadrantLayer({ activeQuadrant = null, dragging = false }: QuadrantLayerProps) {
  return (
    <div className="quadrant-grid" aria-hidden="true">
      {QUADRANT_ORDER.map((id) => {
        const isActive = activeQuadrant === id
        return (
          <div
            key={id}
            className={`quadrant${isActive ? ' is-drop-target' : ''}${dragging ? ' is-dragging' : ''}`}
            data-testid="quadrant"
            data-quadrant={id}
            data-active={isActive || undefined}
          >
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
