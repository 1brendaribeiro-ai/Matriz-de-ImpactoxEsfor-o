import { Inbox, Plus, Undo2, Upload } from 'lucide-react'
import { forwardRef } from 'react'
import type { Filters, Improvement } from '../../domain/types'
import { ClassifiedRow, SidebarCard } from '../cards/SidebarCard'
import { useDragState } from '../dnd/MatrixDnd'
import { CollapsibleSection } from './CollapsibleSection'
import { SearchFilters } from './SearchFilters'

interface SidebarProps {
  items: Improvement[]
  filters: Filters
  isVisible: (item: Improvement) => boolean
  onFiltersChange: (filters: Filters) => void
  onAdd: () => void
  onImport: () => void
  onOpen: (id: string) => void
  highlightedId: string | null
}

export const Sidebar = forwardRef<HTMLElement, SidebarProps>(function Sidebar(
  { items, filters, isVisible, onFiltersChange, onAdd, onImport, onOpen, highlightedId },
  ref,
) {
  const { target, source } = useDragState()
  const unclassified = items.filter((i) => !i.position)
  const classified = items.filter((i) => i.position).sort((a, b) => a.name.localeCompare(b.name, 'pt-BR'))
  const visibleUnclassified = unclassified.filter(isVisible)
  const visibleClassified = classified.filter(isVisible)
  const isReturnTarget = target?.kind === 'sidebar'

  return (
    <aside
      ref={ref}
      className={`sidebar${isReturnTarget ? ' is-return-target' : ''}${source === 'board' ? ' is-board-dragging' : ''}`}
      aria-label="Melhorias"
      data-testid="sidebar"
    >
      <div className="sidebar-head">
        <h2 className="panel-title">Melhorias identificadas</h2>
        <div className="sidebar-actions">
          <button type="button" className="btn btn-primary btn-block" onClick={onAdd} data-testid="add-improvement">
            <Plus size={16} /> Adicionar melhoria
          </button>
          <button type="button" className="btn btn-secondary" onClick={onImport} title="Importar melhorias (CSV ou Excel)" data-testid="open-import">
            <Upload size={15} /> Importar melhorias
          </button>
        </div>
        <SearchFilters items={items} filters={filters} onChange={onFiltersChange} />
      </div>

      <div className="sidebar-scroll">
        <CollapsibleSection
          id="unclassified"
          title="Melhorias não classificadas"
          count={visibleUnclassified.length}
          total={unclassified.length}
          testId="section-unclassified"
        >
          {visibleUnclassified.length === 0 ? (
            <div className="empty-state">
              <Inbox size={18} />
              {unclassified.length === 0
                ? 'Todas as melhorias já estão na matriz.'
                : 'Nenhuma melhoria corresponde à busca/filtros.'}
            </div>
          ) : (
            <div className="side-card-list">
              {visibleUnclassified.map((item) => (
                <SidebarCard key={item.id} item={item} onOpen={onOpen} highlighted={item.id === highlightedId} />
              ))}
            </div>
          )}
        </CollapsibleSection>

        <CollapsibleSection
          id="classified"
          title="Melhorias classificadas"
          count={visibleClassified.length}
          total={classified.length}
          testId="section-classified"
        >
          {visibleClassified.length === 0 ? (
            <div className="empty-state">
              {classified.length === 0 ? 'Nenhuma melhoria posicionada na matriz ainda.' : 'Nenhuma corresponde aos filtros.'}
            </div>
          ) : (
            <div className="classified-list">
              {visibleClassified.map((item) => (
                <ClassifiedRow key={item.id} item={item} onOpen={onOpen} />
              ))}
            </div>
          )}
        </CollapsibleSection>
      </div>

      {source === 'board' && (
        <div className="return-zone" data-testid="return-zone">
          <Undo2 size={16} /> Solte aqui para remover da matriz
        </div>
      )}
    </aside>
  )
})

