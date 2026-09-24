import type { MatrixData } from '../domain/types'

/**
 * Contrato de persistência. A aplicação depende apenas desta interface;
 * para usar um banco de dados basta criar outra implementação (ex.: via API REST)
 * e trocá-la em `storage/index.ts`.
 */
export interface MatrixRepository {
  load(): Promise<MatrixData | null>
  save(data: MatrixData): Promise<void>
  clear(): Promise<void>
}
