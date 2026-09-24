import { quadrantOf } from './quadrants'
import type { Filters, Improvement } from './types'

export const EMPTY_FILTERS: Filters = {
  search: '',
  process: '',
  category: '',
  owner: '',
  status: 'all',
}

export function normalize(text: string): string {
  return text
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .trim()
}

export function hasActiveFilters(f: Filters): boolean {
  return Boolean(f.search.trim() || f.process || f.category || f.owner || f.status !== 'all')
}

export function matchesFilters(item: Improvement, f: Filters): boolean {
  if (f.search.trim()) {
    const q = normalize(f.search)
    const haystack = normalize(`${item.name} ${item.process} ${item.category}`)
    if (!haystack.includes(q)) return false
  }
  if (f.process && item.process !== f.process) return false
  if (f.category && item.category !== f.category) return false
  if (f.owner && item.owner !== f.owner) return false
  if (f.status !== 'all') {
    const q = quadrantOf(item)
    if (f.status === 'unclassified' && q) return false
    if (f.status === 'classified' && !q) return false
    if (f.status !== 'unclassified' && f.status !== 'classified' && q !== f.status) return false
  }
  return true
}

/** Valores distintos e não vazios de um campo, em ordem alfabética. */
export function distinctValues(items: Improvement[], key: 'process' | 'category' | 'owner'): string[] {
  const set = new Set(items.map((i) => i[key].trim()).filter(Boolean))
  return [...set].sort((a, b) => a.localeCompare(b, 'pt-BR'))
}
