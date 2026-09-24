import { DEFAULT_CATEGORY, matchCategory } from '../domain/categories'
import type { Improvement, MatrixData } from '../domain/types'

type RawItem = Partial<Improvement>

function sanitizeItem(raw: RawItem): Improvement | null {
  if (!raw || typeof raw.id !== 'string' || typeof raw.name !== 'string') return null
  const pos = raw.position
  const position =
    pos && Number.isFinite(pos.x) && Number.isFinite(pos.y)
      ? { x: Math.min(1, Math.max(0, pos.x)), y: Math.min(1, Math.max(0, pos.y)) }
      : null
  const now = new Date().toISOString()
  const originalCategory = typeof raw.category === 'string' ? raw.category.trim() : ''
  const category = matchCategory(originalCategory) ?? DEFAULT_CATEGORY
  let notes = typeof raw.notes === 'string' ? raw.notes : ''
  // categoria antiga sem correspondência: preserva o texto original nas observações
  if (originalCategory && !matchCategory(originalCategory)) {
    notes = [notes, `Categoria original: ${originalCategory}`].filter(Boolean).join('\n')
  }
  return {
    id: raw.id,
    name: raw.name,
    description: typeof raw.description === 'string' ? raw.description : '',
    process: typeof raw.process === 'string' ? raw.process : '',
    category,
    notes,
    position,
    createdAt: raw.createdAt ?? now,
    updatedAt: raw.updatedAt ?? now,
  }
}

/** Valida e migra dados salvos (inclusive de versões anteriores da aplicação). */
export function parseMatrixData(data: unknown): MatrixData | null {
  if (!data || typeof data !== 'object') return null
  const items = (data as { items?: unknown }).items
  if (!Array.isArray(items)) return null
  return {
    version: 2,
    items: items.map((i) => sanitizeItem(i as RawItem)).filter((i): i is Improvement => i !== null),
  }
}
