import type { MatrixData } from '../domain/types'

/**
 * Contrato de persistência. A aplicação depende apenas desta interface;
 * para usar outro mecanismo basta criar outra implementação e trocá-la em `storage/index.ts`.
 */
export interface MatrixRepository {
  load(): Promise<MatrixData | null>
  save(data: MatrixData): Promise<void>
  /** Gravação síncrona de emergência, chamada quando a janela está sendo fechada. */
  saveSync?(data: MatrixData): void
  clear(): Promise<void>
}

export interface StoredSnapshot {
  data: MatrixData
  savedAt: number
}
