import type { Improvement, MatrixData } from '../domain/types'
import type { MatrixRepository } from './repository'

const STORAGE_KEY = 'matriz-impacto-esforco:data:v1'

function isValid(data: unknown): data is MatrixData {
  if (!data || typeof data !== 'object') return false
  const d = data as Partial<MatrixData>
  return Array.isArray(d.items) && Array.isArray(d.categories)
}

function sanitizeItem(raw: Partial<Improvement>): Improvement | null {
  if (!raw || typeof raw.id !== 'string' || typeof raw.name !== 'string') return null
  const pos = raw.position
  const position =
    pos && Number.isFinite(pos.x) && Number.isFinite(pos.y)
      ? { x: Math.min(1, Math.max(0, pos.x)), y: Math.min(1, Math.max(0, pos.y)) }
      : null
  const now = new Date().toISOString()
  return {
    id: raw.id,
    name: raw.name,
    description: raw.description ?? '',
    process: raw.process ?? '',
    category: raw.category ?? '',
    owner: raw.owner ?? '',
    notes: raw.notes ?? '',
    position,
    createdAt: raw.createdAt ?? now,
    updatedAt: raw.updatedAt ?? now,
  }
}

export function parseMatrixData(data: unknown): MatrixData | null {
  if (!isValid(data)) return null
  return {
    version: 1,
    categories: data.categories.filter((c): c is string => typeof c === 'string' && c.trim() !== ''),
    items: data.items.map(sanitizeItem).filter((i): i is Improvement => i !== null),
  }
}

export class LocalStorageRepository implements MatrixRepository {
  private readonly key: string

  constructor(key: string = STORAGE_KEY) {
    this.key = key
  }

  async load(): Promise<MatrixData | null> {
    try {
      const raw = localStorage.getItem(this.key)
      if (!raw) return null
      return parseMatrixData(JSON.parse(raw))
    } catch {
      return null
    }
  }

  async save(data: MatrixData): Promise<void> {
    localStorage.setItem(this.key, JSON.stringify(data))
  }

  async clear(): Promise<void> {
    localStorage.removeItem(this.key)
  }
}
