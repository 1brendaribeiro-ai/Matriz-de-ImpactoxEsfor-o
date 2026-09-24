import { useDraggable } from '@dnd-kit/core'
import { GripVertical } from 'lucide-react'
import { memo, useEffect, useRef } from 'react'
import { quadrantOf, QUADRANTS } from '../../domain/quadrants'
import type { Improvement } from '../../domain/types'
import { CategoryIcon } from '../common/CategoryIcon'
import { dragId, useDragState } from '../dnd/MatrixDnd'

interface CardProps {
  item: Improvement
  onOpen: (id: string) => void
}

function openOnKey(e: React.KeyboardEvent, open: () => void) {
  if (e.key === 'Enter' || e.key === ' ') {
    e.preventDefault()
    open()
  }
}

/** Conteúdo visual do card não classificado (reutilizado na pré-visualização do arraste). */
export function SidebarCardBody({ item }: { item: Improvement }) {
  return (
    <>
      <span className="side-card-grip" aria-hidden="true">
        <GripVertical size={14} />
      </span>
      <div className="side-card-content">
        <div className="side-card-title">{item.name}</div>
        {item.process && <div className="side-card-process">{item.process}</div>}
        {item.category && (
          <div className="side-card-meta">
            <CategoryIcon category={item.category} size={12} />
            <span>Categoria: {item.category}</span>
          </div>
        )}
      </div>
    </>
  )
}

export const SidebarCard = memo(function SidebarCard({ item, onOpen, highlighted }: CardProps & { highlighted?: boolean }) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: dragId('side', item.id),
    data: { itemId: item.id, source: 'side' },
  })
  const nodeRef = useRef<HTMLDivElement | null>(null)

  // melhoria recém-criada: rola até ela para que possa ser arrastada imediatamente
  useEffect(() => {
    if (highlighted) nodeRef.current?.scrollIntoView({ block: 'nearest', behavior: 'smooth' })
  }, [highlighted])
  const { shouldIgnoreClick } = useDragState()
  const open = () => !shouldIgnoreClick() && onOpen(item.id)

  return (
    <div
      ref={(node) => {
        setNodeRef(node)
        nodeRef.current = node
      }}
      className={`side-card${isDragging ? ' is-ghost' : ''}${highlighted ? ' is-highlighted' : ''}`}
      data-testid="side-card"
      data-item-id={item.id}
      {...listeners}
      {...attributes}
      aria-roledescription="melhoria arrastável"
      aria-label={`${item.name}. Arraste para a matriz ou pressione Enter para ver detalhes.`}
      onClick={open}
      onKeyDown={(e) => openOnKey(e, open)}
    >
      <SidebarCardBody item={item} />
    </div>
  )
})

/** Linha compacta da seção "Melhorias classificadas" (também arrastável). */
export const ClassifiedRow = memo(function ClassifiedRow({ item, onOpen }: CardProps) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: dragId('side', item.id),
    data: { itemId: item.id, source: 'side' },
  })
  const { shouldIgnoreClick } = useDragState()
  const quadrant = quadrantOf(item)
  const open = () => !shouldIgnoreClick() && onOpen(item.id)

  return (
    <div
      ref={setNodeRef}
      className={`classified-row${isDragging ? ' is-ghost' : ''}`}
      data-testid="classified-row"
      data-item-id={item.id}
      {...listeners}
      {...attributes}
      aria-roledescription="melhoria arrastável"
      aria-label={`${item.name}, ${quadrant ? QUADRANTS[quadrant].title : ''}`}
      onClick={open}
      onKeyDown={(e) => openOnKey(e, open)}
    >
      <span className={`q-dot q-${quadrant}`} aria-hidden="true" />
      <span className="classified-row-name">{item.name}</span>
      {quadrant && <span className={`q-tag q-${quadrant}`}>{QUADRANTS[quadrant].title}</span>}
    </div>
  )
})
