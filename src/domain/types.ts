export type QuadrantId = 'quick-wins' | 'strategic' | 'incremental' | 'low-priority'

export type Level = 'Baixo' | 'Médio' | 'Alto'

/**
 * Posição normalizada do centro do card na matriz.
 * x = esforço (0 = esquerda / menor esforço, 1 = direita / maior esforço)
 * y = impacto (0 = base / menor impacto, 1 = topo / maior impacto)
 */
export interface Position {
  x: number
  y: number
}

export interface Improvement {
  id: string
  name: string
  description: string
  process: string
  category: string
  owner: string
  notes: string
  /** null = ainda não classificada */
  position: Position | null
  createdAt: string
  updatedAt: string
}

export type ImprovementInput = Pick<
  Improvement,
  'name' | 'description' | 'process' | 'category' | 'owner' | 'notes'
>

export interface MatrixData {
  version: 1
  items: Improvement[]
  categories: string[]
}

export type StatusFilter = 'all' | 'unclassified' | 'classified' | QuadrantId

export interface Filters {
  search: string
  process: string
  category: string
  owner: string
  status: StatusFilter
}
