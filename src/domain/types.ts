/** Identificadores técnicos dos quadrantes (usados apenas na geometria da matriz). */
export type QuadrantId =
  | 'high-impact-low-effort'
  | 'high-impact-high-effort'
  | 'low-impact-low-effort'
  | 'low-impact-high-effort'

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
  notes: string
  /** null = ainda não classificada */
  position: Position | null
  createdAt: string
  updatedAt: string
}

export type ImprovementInput = Pick<
  Improvement,
  'name' | 'description' | 'process' | 'category' | 'notes'
>

export interface MatrixData {
  version: 2
  items: Improvement[]
}

export type StatusFilter = 'all' | 'unclassified' | 'classified'

export interface Filters {
  search: string
  process: string
  category: string
  status: StatusFilter
}
