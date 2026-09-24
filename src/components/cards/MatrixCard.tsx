import { useDraggable } from '@dnd-kit/core'
import { memo } from 'react'
import { quadrantOf } from '../../domain/quadrants'
import type { Improvement } from '../../domain/types'
import { CategoryIcon } from '../common/CategoryIcon'
import { dragId, useDragState } from '../dnd/MatrixDnd'
import type { PixelPoint } from '../matrix/geometry'

/** Conteúdo visual do card posicionado na matriz (usado também na exportação e no arraste). */
export function MatrixCardBody({ item }: { item: Improvement }) {
  return (
    <>
      <span className="m-card-icon">
        <CategoryIcon category={item.category} size={13} />
      </span>
      <div className="m-card-content">
        <div className="m-card-title" title={item.name}>
          {item.name}
        </div>
        <div className="m-card-process">{item.process || item.category || '—'}</div>
      </div>
    </>
  )
}

interface MatrixCardProps {
  item: Improvement
  topLeft: PixelPoint
  dimmed: boolean
  highlighted: boolean
  onOpen: (id: string) => void
}

export const MatrixCard = memo(function MatrixCard({ item, topLeft, dimmed, highlighted, onOpen }: MatrixCardProps) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: dragId('board', item.id),
    data: { itemId: item.id, source: 'board' },
  })
  const { shouldIgnoreClick } = useDragState()
  const quadrant = quadrantOf(item)
  const open = () => !shouldIgnoreClick() && onOpen(item.id)

  return (
    <div
      ref={setNodeRef}
      className={[
        'm-card',
        `q-${quadrant}`,
        isDragging && 'is-ghost',
        dimmed && 'is-dimmed',
        highlighted && 'is-highlighted',
      ]
        .filter(Boolean)
        .join(' ')}
      style={{ transform: `translate3d(${topLeft.x}px, ${topLeft.y}px, 0)` }}
      data-testid="matrix-card"
      data-item-id={item.id}
      data-quadrant={quadrant ?? ''}
      {...listeners}
      {...attributes}
      aria-roledescription="melhoria arrastável"
      aria-label={item.name}
      onClick={open}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          open()
        }
      }}
    >
      <MatrixCardBody item={item} />
    </div>
  )
})
