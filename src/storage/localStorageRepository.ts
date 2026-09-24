import type { MatrixData } from '../domain/types'
import { parseMatrixData } from './parse'
import type { MatrixRepository, StoredSnapshot } from './repository'

export const LOCAL_STORAGE_KEY = 'matriz-impacto-esforco:data:v1'

/** Lê a cópia em localStorage (formato atual { data, savedAt } ou o formato antigo, só com os dados). */
export function readLocalSnapshot(key = LOCAL_STORAGE_KEY): StoredSnapshot | null {
  try {
    const raw = localStorage.getItem(key)
    if (!raw) return null
    const parsed = JSON.parse(raw)
    const isWrapped = parsed && typeof parsed === 'object' && 'data' in parsed && 'savedAt' in parsed
    const data = parseMatrixData(isWrapped ? parsed.data : parsed)
    if (!data) return null
    return { data, savedAt: isWrapped ? Number(parsed.savedAt) || 0 : 0 }
  } catch {
    return null
  }
}

export function writeLocalSnapshot(snapshot: StoredSnapshot, key = LOCAL_STORAGE_KEY): boolean {
  try {
    localStorage.setItem(key, JSON.stringify(snapshot))
    return true
  } catch {
    return false
  }
}

export class LocalStorageRepository implements MatrixRepository {
  async load(): Promise<MatrixData | null> {
    return readLocalSnapshot()?.data ?? null
  }

  async save(data: MatrixData): Promise<void> {
    if (!writeLocalSnapshot({ data, savedAt: Date.now() })) throw new Error('Falha ao gravar no armazenamento local')
  }

  saveSync(data: MatrixData): void {
    writeLocalSnapshot({ data, savedAt: Date.now() })
  }

  async clear(): Promise<void> {
    localStorage.removeItem(LOCAL_STORAGE_KEY)
  }
}
