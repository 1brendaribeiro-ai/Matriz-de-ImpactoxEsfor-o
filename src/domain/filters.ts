import type { Filters, Improvement } from './types'

export const EMPTY_FILTERS: Filters = {
  search: '',
  process: '',
  category: '',
  status: 'all',
}

// marcas de acentuação (U+0300–U+036F); escrito como texto para não gerar caracteres especiais no build
const DIACRITICS = new RegExp('[\\u0300-\\u036f]', 'g')

export function normalize(text: string): string {
  return text
    .normalize('NFD')
    .replace(DIACRITICS, '')
    .toLowerCase()
    .trim()
}

export function hasActiveFilters(f: Filters): boolean {
  return Boolean(f.search.trim() || f.process || f.category || f.status !== 'all')
}

export function matchesFilters(item: Improvement, f: Filters): boolean {
  if (f.search.trim()) {
    const q = normalize(f.search)
    const haystack = normalize(`${item.name} ${item.process} ${item.category}`)
    if (!haystack.includes(q)) return false
  }
  if (f.process && item.process !== f.process) return false
  if (f.category && item.category !== f.category) return false
  if (f.status === 'unclassified' && item.position) return false
  if (f.status === 'classified' && !item.position) return false
  return true
}

/** Valores distintos e não vazios de um campo, em ordem alfabética. */
export function distinctValues(items: Improvement[], key: 'process' | 'category'): string[] {
  const set = new Set(items.map((i) => i[key].trim()).filter(Boolean))
  return [...set].sort((a, b) => a.localeCompare(b, 'pt-BR'))
}
