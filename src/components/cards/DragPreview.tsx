import { quadrantOf } from '../../domain/quadrants'
import type { Improvement } from '../../domain/types'
import type { DragSource, DropTarget } from '../dnd/MatrixDnd'
import { MatrixCardBody } from './MatrixCard'
import { SidebarCardBody } from './SidebarCard'

/** Card "levantado" que acompanha o ponteiro durante o arraste. */
export function DragPreview({ item, source, target }: { item: Improvement; source: DragSource; target: DropTarget }) {
  if (source === 'board') {
    const quadrant = target?.kind === 'board' ? target.quadrant : quadrantOf(item)
    return (
      <div className={`m-card is-lifted q-${quadrant}`} data-testid="drag-preview">
        <MatrixCardBody item={item} />
      </div>
    )
  }
  if (target?.kind === 'board') {
    // Sobre a matriz, a pré-visualização assume o formato do card final, centrado onde ele será solto.
    return (
      <div className="preview-center" data-testid="drag-preview">
        <div className={`m-card is-lifted q-${target.quadrant}`}>
          <MatrixCardBody item={item} />
        </div>
      </div>
    )
  }
  return (
    <div className="side-card is-lifted" data-testid="drag-preview">
      <SidebarCardBody item={item} />
    </div>
  )
}
