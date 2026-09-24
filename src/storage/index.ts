import { LocalStorageRepository } from './localStorageRepository'
import type { MatrixRepository } from './repository'

export type { MatrixRepository } from './repository'

/** Ponto único de troca do mecanismo de persistência. */
export const repository: MatrixRepository = new LocalStorageRepository()

/** Preferências de interface (seções recolhidas etc.), independentes dos dados. */
export function loadPreference<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(`matriz-impacto-esforco:pref:${key}`)
    return raw === null ? fallback : (JSON.parse(raw) as T)
  } catch {
    return fallback
  }
}

export function savePreference<T>(key: string, value: T): void {
  try {
    localStorage.setItem(`matriz-impacto-esforco:pref:${key}`, JSON.stringify(value))
  } catch {
    // preferências são opcionais
  }
}
