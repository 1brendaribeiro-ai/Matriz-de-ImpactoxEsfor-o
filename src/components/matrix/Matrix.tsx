import { ArrowRight, ArrowUp, Hand } from 'lucide-react'
import { useMemo, type RefObject } from 'react'
import { countByQuadrant } from '../../domain/quadrants'
import type { Improvement } from '../../domain/types'
import { useElementSize } from '../../hooks/useElementSize'
import { MatrixCard } from '../cards/MatrixCard'
import { useDragState } from '../dnd/MatrixDnd'
import { cardTopLeft } from './geometry'
import { QuadrantLayer } from './QuadrantLayer'

interface MatrixProps {
  items: Improvement[]
  isVisible: (item: Improvement) => boolean
  filtersActive: boolean
  highlightedId: string | null
  boardRef: RefObject<HTMLDivElement | null>
  onOpen: (id: string) => void
}

/** Eixos (rótulos) em volta do tabuleiro. Reutilizado na exportação. */
export function MatrixFrame({ children }: { children: React.ReactNode }) {
  return (
    <div className="matrix-frame">
      <div className="axis axis-y">
        <span className="axis-end">Alto</span>
        <span className="axis-label">
          <ArrowUp size={14} />
          Impacto
        </span>
        <span className="axis-end">Baixo</span>
      </div>
      {children}
      <div className="axis axis-x">
        <span className="axis-end">Baixo</span>
        <span className="axis-label">
          Esforço
          <ArrowRight size={14} />
        </span>
        <span className="axis-end">Alto</span>
      </div>
    </div>
  )
}

export function Matrix({ items, isVisible, filtersActive, highlightedId, boardRef, onOpen }: MatrixProps) {
  const size = useElementSize(boardRef)
  const { target, activeId } = useDragState()
  const placed = useMemo(() => items.filter((i) => i.position), [items])
  const counts = useMemo(() => countByQuadrant(items), [items])
  const visibleCount = placed.filter(isVisible).length
  const activeQuadrant = target?.kind === 'board' ? target.quadrant : null

  return (
    <section className="matrix-panel" aria-label="Matriz de Impacto x Esforço">
      <div className="matrix-head">
        <div>
          <h2 className="panel-title">Matriz de Impacto x Esforço</h2>
          <p className="panel-hint">
            <Hand size={13} /> Arraste as melhorias do painel para o quadrante desejado. A posição define impacto e
            esforço.
          </p>
        </div>
        {filtersActive && (
          <span className="matrix-filter-note" data-testid="matrix-filter-note">
            Exibindo {visibleCount} de {placed.length} na matriz
          </span>
        )}
      </div>

      <MatrixFrame>
        <div ref={boardRef} className="board" data-testid="board">
          <QuadrantLayer counts={counts} activeQuadrant={activeQuadrant} dragging={activeId !== null} />
          <div className="board-center-mark" aria-hidden="true" />
          {size.width > 0 && (
            <div className="card-layer">
              {placed.map((item) => (
                <MatrixCard
                  key={item.id}
                  item={item}
                  topLeft={cardTopLeft(item.position!, size)}
                  dimmed={!isVisible(item)}
                  highlighted={item.id === highlightedId}
                  onOpen={onOpen}
                />
              ))}
              {target?.kind === 'board' && (
                <div
                  className={`drop-ghost q-${target.quadrant}`}
                  style={{ transform: `translate3d(${target.preview.x}px, ${target.preview.y}px, 0)` }}
                  data-testid="drop-ghost"
                />
              )}
            </div>
          )}
          {placed.length === 0 && activeId === null && (
            <div className="board-empty">Arraste uma melhoria do painel lateral para começar a priorizar.</div>
          )}
        </div>
      </MatrixFrame>
    </section>
  )
}
