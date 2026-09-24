import type { Improvement, Level, Position, QuadrantId } from './types'

export interface QuadrantMeta {
  id: QuadrantId
  /** Ex.: "Alto impacto / Baixo esforço" */
  axes: string
  title: string
  action: string
  /** Coluna (0 = baixo esforço) e linha (0 = alto impacto) no grid 2x2 */
  col: 0 | 1
  row: 0 | 1
  /** Ordem de prioridade para listagens e exportação */
  priority: number
}

export const QUADRANTS: Record<QuadrantId, QuadrantMeta> = {
  'quick-wins': {
    id: 'quick-wins',
    axes: 'Alto impacto / Baixo esforço',
    title: 'Ganhos rápidos',
    action: 'Priorizar',
    col: 0,
    row: 0,
    priority: 1,
  },
  strategic: {
    id: 'strategic',
    axes: 'Alto impacto / Alto esforço',
    title: 'Projetos estratégicos',
    action: 'Planejar',
    col: 1,
    row: 0,
    priority: 2,
  },
  incremental: {
    id: 'incremental',
    axes: 'Baixo impacto / Baixo esforço',
    title: 'Melhorias incrementais',
    action: 'Avaliar',
    col: 0,
    row: 1,
    priority: 3,
  },
  'low-priority': {
    id: 'low-priority',
    axes: 'Baixo impacto / Alto esforço',
    title: 'Baixa prioridade',
    action: 'Reavaliar',
    col: 1,
    row: 1,
    priority: 4,
  },
}

/** Quadrantes na ordem de exibição do grid (esquerda→direita, cima→baixo). */
export const QUADRANT_ORDER: QuadrantId[] = ['quick-wins', 'strategic', 'incremental', 'low-priority']

export function quadrantAt(pos: Position): QuadrantId {
  const highImpact = pos.y >= 0.5
  const lowEffort = pos.x < 0.5
  if (highImpact) return lowEffort ? 'quick-wins' : 'strategic'
  return lowEffort ? 'incremental' : 'low-priority'
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

/** Limites normalizados de um quadrante. */
export function quadrantBounds(id: QuadrantId) {
  const { col, row } = QUADRANTS[id]
  return {
    xMin: col * 0.5,
    xMax: col * 0.5 + 0.5,
    yMin: row === 0 ? 0.5 : 0,
    yMax: row === 0 ? 1 : 0.5,
  }
}

/**
 * Procura um ponto livre dentro do quadrante (maior distância dos cards já posicionados).
 * Usado quando a melhoria é movida sem arrastar (ex.: pelo formulário).
 */
export function findFreeSpot(id: QuadrantId, items: Improvement[], ignoreId?: string): Position {
  const b = quadrantBounds(id)
  const others = items
    .filter((i) => i.id !== ignoreId && i.position && quadrantAt(i.position) === id)
    .map((i) => i.position as Position)
  const candidates: Position[] = []
  const cols = 3
  const rows = 4
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      candidates.push({
        x: b.xMin + ((c + 0.5) / cols) * (b.xMax - b.xMin),
        // deixa espaço para o cabeçalho do quadrante no topo
        y: b.yMax - 0.1 - ((r + 0.5) / rows) * (b.yMax - b.yMin - 0.12),
      })
    }
  }
  if (others.length === 0) return candidates[4]
  let best = candidates[0]
  let bestDist = -1
  for (const c of candidates) {
    const d = Math.min(...others.map((o) => Math.hypot((o.x - c.x) * 1.6, o.y - c.y)))
    if (d > bestDist + 1e-6) {
      bestDist = d
      best = c
    }
  }
  return best
}

export function statusLabel(item: Improvement): string {
  const q = quadrantOf(item)
  return q ? QUADRANTS[q].title : 'Não classificada'
}

export function countByQuadrant(items: Improvement[]): Record<QuadrantId, number> {
  const counts: Record<QuadrantId, number> = { 'quick-wins': 0, strategic: 0, incremental: 0, 'low-priority': 0 }
  for (const item of items) {
    const q = quadrantOf(item)
    if (q) counts[q]++
  }
  return counts
}
