import { FilterX, ListFilter, Search, X } from 'lucide-react'
import { useState } from 'react'
import { distinctValues, EMPTY_FILTERS, hasActiveFilters } from '../../domain/filters'
import { QUADRANT_ORDER, QUADRANTS } from '../../domain/quadrants'
import type { Filters, Improvement, StatusFilter } from '../../domain/types'
import { loadPreference, savePreference } from '../../storage'

interface SearchFiltersProps {
  items: Improvement[]
  categories: string[]
  filters: Filters
  onChange: (filters: Filters) => void
}

export function SearchFilters({ items, categories, filters, onChange }: SearchFiltersProps) {
  const [open, setOpen] = useState(() => loadPreference('filtersOpen', false))
  const toggle = () => {
    setOpen(!open)
    savePreference('filtersOpen', !open)
  }
  const set = <K extends keyof Filters>(key: K, value: Filters[K]) => onChange({ ...filters, [key]: value })

  const processes = distinctValues(items, 'process')
  const owners = distinctValues(items, 'owner')
  const allCategories = [...new Set([...categories, ...distinctValues(items, 'category')])].sort((a, b) =>
    a.localeCompare(b, 'pt-BR'),
  )
  const activeCount = [filters.process, filters.category, filters.owner, filters.status !== 'all'].filter(Boolean).length

  return (
    <div className="search-filters">
      <div className="search-row">
        <label className="search-box">
          <Search size={15} aria-hidden="true" />
          <input
            type="search"
            placeholder="Buscar melhoria…"
            value={filters.search}
            onChange={(e) => set('search', e.target.value)}
            aria-label="Buscar por nome, processo ou categoria"
            data-testid="search-input"
          />
          {filters.search && (
            <button type="button" className="search-clear" onClick={() => set('search', '')} aria-label="Limpar busca">
              <X size={14} />
            </button>
          )}
        </label>
        <button
          type="button"
          className={`btn btn-icon-text btn-ghost filter-toggle${open ? ' is-open' : ''}`}
          onClick={toggle}
          aria-expanded={open}
          data-testid="filters-toggle"
        >
          <ListFilter size={15} />
          <span>Filtros</span>
          {activeCount > 0 && <span className="badge">{activeCount}</span>}
        </button>
      </div>

      {open && (
        <div className="filter-grid">
          <FilterSelect label="Processo" value={filters.process} options={processes} onChange={(v) => set('process', v)} testId="filter-process" />
          <FilterSelect label="Categoria" value={filters.category} options={allCategories} onChange={(v) => set('category', v)} testId="filter-category" />
          <FilterSelect label="Responsável" value={filters.owner} options={owners} onChange={(v) => set('owner', v)} testId="filter-owner" />
          <label className="field field-compact">
            <span>Status</span>
            <select
              value={filters.status}
              onChange={(e) => set('status', e.target.value as StatusFilter)}
              data-testid="filter-status"
            >
              <option value="all">Todos</option>
              <option value="unclassified">Não classificadas</option>
              <option value="classified">Classificadas</option>
              {QUADRANT_ORDER.map((id) => (
                <option key={id} value={id}>
                  {QUADRANTS[id].title}
                </option>
              ))}
            </select>
          </label>
        </div>
      )}

      {hasActiveFilters(filters) && (
        <button type="button" className="link-btn clear-filters" onClick={() => onChange(EMPTY_FILTERS)} data-testid="clear-filters">
          <FilterX size={13} /> Limpar busca e filtros
        </button>
      )}
    </div>
  )
}

function FilterSelect({
  label,
  value,
  options,
  onChange,
  testId,
}: {
  label: string
  value: string
  options: string[]
  onChange: (v: string) => void
  testId: string
}) {
  return (
    <label className="field field-compact">
      <span>{label}</span>
      <select value={value} onChange={(e) => onChange(e.target.value)} data-testid={testId}>
        <option value="">Todos</option>
        {options.map((o) => (
          <option key={o} value={o}>
            {o}
          </option>
        ))}
      </select>
    </label>
  )
}
