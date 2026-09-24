import type { MatrixData } from '../domain/types'
import { readLocalSnapshot, writeLocalSnapshot, LOCAL_STORAGE_KEY } from './localStorageRepository'
import { parseMatrixData } from './parse'
import type { MatrixRepository, StoredSnapshot } from './repository'

const DB_NAME = 'matriz-impacto-esforco'
const STORE = 'state'
const RECORD_KEY = 'current'

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === 'undefined') {
      reject(new Error('IndexedDB indisponível'))
      return
    }
    const request = indexedDB.open(DB_NAME, 1)
    request.onupgradeneeded = () => {
      if (!request.result.objectStoreNames.contains(STORE)) request.result.createObjectStore(STORE)
    }
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
    request.onblocked = () => reject(new Error('IndexedDB bloqueado'))
  })
}

function run<T>(db: IDBDatabase, mode: IDBTransactionMode, fn: (store: IDBObjectStore) => IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, mode)
    const request = fn(tx.objectStore(STORE))
    tx.oncomplete = () => resolve(request.result)
    tx.onerror = () => reject(tx.error)
    tx.onabort = () => reject(tx.error)
  })
}

/**
 * Armazenamento principal em IndexedDB, no próprio dispositivo.
 * Uma cópia de segurança síncrona é mantida em localStorage: ela garante a gravação
 * mesmo quando a janela é fechada no meio de uma escrita assíncrona e permite
 * continuar funcionando se o IndexedDB estiver indisponível no navegador.
 * Ao carregar, vale a cópia gravada mais recentemente.
 */
export class IndexedDbRepository implements MatrixRepository {
  private dbPromise: Promise<IDBDatabase> | null = null

  private db(): Promise<IDBDatabase> {
    if (!this.dbPromise) {
      this.dbPromise = openDb()
      this.dbPromise.catch(() => {
        this.dbPromise = null
      })
    }
    return this.dbPromise
  }

  private async readIdb(): Promise<StoredSnapshot | null> {
    try {
      const raw = await run<unknown>(await this.db(), 'readonly', (s) => s.get(RECORD_KEY))
      if (!raw || typeof raw !== 'object') return null
      const record = raw as { data?: unknown; savedAt?: unknown }
      const data = parseMatrixData(record.data)
      return data ? { data, savedAt: Number(record.savedAt) || 0 } : null
    } catch {
      return null
    }
  }

  async load(): Promise<MatrixData | null> {
    const [idb, local] = [await this.readIdb(), readLocalSnapshot()]
    if (idb && local) return local.savedAt > idb.savedAt ? local.data : idb.data
    return idb?.data ?? local?.data ?? null
  }

  async save(data: MatrixData): Promise<void> {
    const snapshot: StoredSnapshot = { data, savedAt: Date.now() }
    const localOk = writeLocalSnapshot(snapshot)
    try {
      await run(await this.db(), 'readwrite', (s) => s.put(snapshot, RECORD_KEY))
    } catch (error) {
      if (!localOk) throw error
    }
  }

  /** Gravação imediata e síncrona (usada ao fechar a janela). */
  saveSync(data: MatrixData): void {
    writeLocalSnapshot({ data, savedAt: Date.now() })
  }

  async clear(): Promise<void> {
    localStorage.removeItem(LOCAL_STORAGE_KEY)
    try {
      await run(await this.db(), 'readwrite', (s) => s.delete(RECORD_KEY))
    } catch {
      // nada a limpar
    }
  }
}
