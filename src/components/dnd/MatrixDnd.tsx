import {
  DndContext,
  DragOverlay,
  MouseSensor,
  TouchSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragMoveEvent,
  type DragStartEvent,
} from '@dnd-kit/core'
import { createContext, useCallback, useContext, useRef, useState, type ReactNode, type RefObject } from 'react'
import type { Improvement, Position, QuadrantId } from '../../domain/types'
import { DragPreview } from '../cards/DragPreview'
import { clampCenterToQuadrant, CARD_H, CARD_W, pixelToPosition, quadrantAtPixel, type PixelPoint } from '../matrix/geometry'

export type DragSource = 'side' | 'board'

export interface DragData {
  itemId: string
  source: DragSource
}

/** Onde o card seria solto neste momento. */
export type DropTarget =
  | { kind: 'board'; quadrant: QuadrantId; preview: PixelPoint; position: Position }
  | { kind: 'sidebar' }
  | null

interface DragState {
  activeId: string | null
  source: DragSource | null
  target: DropTarget
  /** true logo após soltar um card, para não abrir detalhes por engano */
  shouldIgnoreClick: () => boolean
}

const DragStateContext = createContext<DragState>({
  activeId: null,
  source: null,
  target: null,
  shouldIgnoreClick: () => false,
})

export const useDragState = () => useContext(DragStateContext)

export function dragId(source: DragSource, itemId: string) {
  return `${source}:${itemId}`
}

interface MatrixDndProps {
  items: Improvement[]
  boardRef: RefObject<HTMLDivElement | null>
  sidebarRef: RefObject<HTMLElement | null>
  onDropOnBoard: (itemId: string, position: Position, quadrant: QuadrantId) => void
  onDropOnSidebar: (itemId: string) => void
  children: ReactNode
}

function clientPoint(event: Event | null): PixelPoint | null {
  if (!event) return null
  if ('touches' in event) {
    const t = (event as TouchEvent).touches[0] ?? (event as TouchEvent).changedTouches[0]
    return t ? { x: t.clientX, y: t.clientY } : null
  }
  const m = event as MouseEvent
  return { x: m.clientX, y: m.clientY }
}

const inside = (p: PixelPoint, r: DOMRect) => p.x >= r.left && p.x <= r.right && p.y >= r.top && p.y <= r.bottom

export function MatrixDnd({ items, boardRef, sidebarRef, onDropOnBoard, onDropOnSidebar, children }: MatrixDndProps) {
  const [active, setActive] = useState<DragData | null>(null)
  const [target, setTarget] = useState<DropTarget>(null)
  const startPointer = useRef<PixelPoint | null>(null)
  const lastDropAt = useRef(0)

  const sensors = useSensors(
    // pequena distância mínima: um clique simples continua abrindo os detalhes
    useSensor(MouseSensor, { activationConstraint: { distance: 5 } }),
    // em telas touch, segurar brevemente para arrastar (permite rolar a lista)
    useSensor(TouchSensor, { activationConstraint: { delay: 160, tolerance: 8 } }),
  )

  /** Calcula o destino a partir do ponteiro e do centro do card arrastado. */
  const resolveTarget = useCallback(
    (event: DragMoveEvent | DragEndEvent): DropTarget => {
      const data = event.active.data.current as DragData | undefined
      const start = startPointer.current
      const board = boardRef.current
      if (!data || !start || !board) return null
      const pointer = { x: start.x + event.delta.x, y: start.y + event.delta.y }
      const boardRect = board.getBoundingClientRect()

      if (inside(pointer, boardRect)) {
        const size = { width: boardRect.width, height: boardRect.height }
        const local = { x: pointer.x - boardRect.left, y: pointer.y - boardRect.top }
        // O quadrante é definido pelo ponteiro; o card fica centrado onde estava o card arrastado.
        const quadrant = quadrantAtPixel(local, size)
        const initial = event.active.rect.current.initial
        const center = initial
          ? {
              x: initial.left + initial.width / 2 + event.delta.x - boardRect.left,
              y: initial.top + initial.height / 2 + event.delta.y - boardRect.top,
            }
          : local
        const clamped = clampCenterToQuadrant(center, quadrant, size)
        return {
          kind: 'board',
          quadrant,
          preview: { x: clamped.x - CARD_W / 2, y: clamped.y - CARD_H / 2 },
          position: pixelToPosition(clamped, size),
        }
      }

      const sidebar = sidebarRef.current
      if (data.source === 'board' && sidebar && inside(pointer, sidebar.getBoundingClientRect())) {
        return { kind: 'sidebar' }
      }
      return null
    },
    [boardRef, sidebarRef],
  )

  const handleStart = (event: DragStartEvent) => {
    startPointer.current = clientPoint(event.activatorEvent)
    setActive((event.active.data.current as DragData) ?? null)
    setTarget(null)
  }

  const handleMove = (event: DragMoveEvent) => {
    const next = resolveTarget(event)
    setTarget((prev) => {
      if (!prev || !next || prev.kind !== next.kind) return next
      if (prev.kind === 'board' && next.kind === 'board') {
        const same =
          prev.quadrant === next.quadrant &&
          Math.abs(prev.preview.x - next.preview.x) < 0.5 &&
          Math.abs(prev.preview.y - next.preview.y) < 0.5
        return same ? prev : next
      }
      return prev
    })
  }

  const finish = () => {
    setActive(null)
    setTarget(null)
    startPointer.current = null
    lastDropAt.current = Date.now()
  }

  const handleEnd = (event: DragEndEvent) => {
    const data = event.active.data.current as DragData | undefined
    const dest = resolveTarget(event)
    finish()
    if (!data || !dest) return
    if (dest.kind === 'board') onDropOnBoard(data.itemId, dest.position, dest.quadrant)
    else if (dest.kind === 'sidebar') onDropOnSidebar(data.itemId)
  }

  const shouldIgnoreClick = useCallback(() => Date.now() - lastDropAt.current < 250, [])
  const activeItem = active ? items.find((i) => i.id === active.itemId) : undefined

  return (
    <DragStateContext.Provider
      value={{ activeId: active?.itemId ?? null, source: active?.source ?? null, target, shouldIgnoreClick }}
    >
      <DndContext
        sensors={sensors}
        autoScroll={false}
        onDragStart={handleStart}
        onDragMove={handleMove}
        onDragEnd={handleEnd}
        onDragCancel={finish}
      >
        {children}
        <DragOverlay dropAnimation={null} zIndex={1000}>
          {activeItem && active ? <DragPreview item={activeItem} source={active.source} target={target} /> : null}
        </DragOverlay>
      </DndContext>
    </DragStateContext.Provider>
  )
}
