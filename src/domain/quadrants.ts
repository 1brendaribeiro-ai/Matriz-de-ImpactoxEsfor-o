import type { Improvement, Level, Position, QuadrantId } from './types'

/**
 * Quadrantes da matriz 2x2. Servem apenas à geometria (limites de cada área);
 * propositalmente não possuem nomes ou interpretações.
 */
export interface QuadrantMeta {
  id: QuadrantId
  /** Coluna (0 = menor esforço) e linha (0 = maior impacto) no grid 2x2 */
  col: 0 | 1
  row: 0 | 1
}

export const QUADRANTS: Record<QuadrantId, QuadrantMeta> = {
  'high-impact-low-effort': { id: 'high-impact-low-effort', col: 0, row: 0 },
  'high-impact-high-effort': { id: 'high-impact-high-effort', col: 1, row: 0 },
  'low-impact-low-effort': { id: 'low-impact-low-effort', col: 0, row: 1 },
  'low-impact-high-effort': { id: 'low-impact-high-effort', col: 1, row: 1 },
}

/** Quadrantes na ordem de exibição do grid (esquerda→direita, cima→baixo). */
export const QUADRANT_ORDER: QuadrantId[] = [
  'high-impact-low-effort',
  'high-impact-high-effort',
  'low-impact-low-effort',
  'low-impact-high-effort',
]

export function quadrantAt(pos: Position): QuadrantId {
  const highImpact = pos.y >= 0.5
  const lowEffort = pos.x < 0.5
  if (highImpact) return lowEffort ? 'high-impact-low-effort' : 'high-impact-high-effort'
  return lowEffort ? 'low-impact-low-effort' : 'low-impact-high-effort'
}

export function quadrantOf(item: Improvement): QuadrantId | null {
  return item.position ? quadrantAt(item.position) : null
}

/**
 * Converte a coordenada contínua em nível de 3 faixas.
 * O terço central de cada eixo (próximo às linhas divisórias) é "Médio".
 */
export function levelFrom(value: number): Level {
  if (value >= 2 / 3) return 'Alto'
  if (value <= 1 / 3) return 'Baixo'
  return 'Médio'
}

export function levelsOf(item: Improvement): { impact: Level | null; effort: Level | null } {
  if (!item.position) return { impact: null, effort: null }
  return { impact: levelFrom(item.position.y), effort: levelFrom(item.position.x) }
}
