import { describe, expect, it } from 'vitest'
import { clampCenterToQuadrant, pixelToPosition, quadrantAtPixel } from '../../src/components/matrix/geometry'
import { matchesFilters, EMPTY_FILTERS } from '../../src/domain/filters'
import { findFreeSpot, levelFrom, quadrantAt, quadrantBounds } from '../../src/domain/quadrants'
import { createSeedData } from '../../src/domain/seed'
import type { Improvement } from '../../src/domain/types'
import { rowsToImprovements } from '../../src/io/importer'
import { historyReducer, matrixReducer } from '../../src/state/matrixReducer'

const size = { width: 1000, height: 800 }

describe('quadrantes', () => {
  it('identifica o quadrante pela posição (esquerda = menor esforço, topo = maior impacto)', () => {
    expect(quadrantAt({ x: 0.2, y: 0.8 })).toBe('quick-wins')
    expect(quadrantAt({ x: 0.8, y: 0.8 })).toBe('strategic')
    expect(quadrantAt({ x: 0.2, y: 0.2 })).toBe('incremental')
    expect(quadrantAt({ x: 0.8, y: 0.2 })).toBe('low-priority')
  })

  it('converte pixels do tabuleiro em quadrante', () => {
    expect(quadrantAtPixel({ x: 100, y: 100 }, size)).toBe('quick-wins')
    expect(quadrantAtPixel({ x: 900, y: 100 }, size)).toBe('strategic')
    expect(quadrantAtPixel({ x: 100, y: 700 }, size)).toBe('incremental')
    expect(quadrantAtPixel({ x: 900, y: 700 }, size)).toBe('low-priority')
  })

  it('deriva níveis Baixo/Médio/Alto da posição', () => {
    expect(levelFrom(0.9)).toBe('Alto')
    expect(levelFrom(0.5)).toBe('Médio')
    expect(levelFrom(0.1)).toBe('Baixo')
  })

  it('mantém o card dentro do quadrante escolhido, mesmo soltando na borda', () => {
    const clamped = clampCenterToQuadrant({ x: 495, y: 405 }, 'quick-wins', size)
    const pos = pixelToPosition(clamped, size)
    expect(quadrantAt(pos)).toBe('quick-wins')
  })

  it('encontra um ponto livre dentro do quadrante', () => {
    for (const q of ['quick-wins', 'strategic', 'incremental', 'low-priority'] as const) {
      const spot = findFreeSpot(q, [])
      const b = quadrantBounds(q)
      expect(spot.x).toBeGreaterThan(b.xMin)
      expect(spot.x).toBeLessThan(b.xMax)
      expect(quadrantAt(spot)).toBe(q)
    }
  })
})

describe('estado e histórico', () => {
  const base = { version: 1 as const, items: [] as Improvement[], categories: ['Pessoas'] }
  const input = { name: ' Nova ', description: '', process: 'P', category: 'Inédita', owner: '', notes: '' }

  it('adiciona melhoria não classificada e registra a nova categoria', () => {
    const next = matrixReducer(base, { type: 'add', input })
    expect(next.items).toHaveLength(1)
    expect(next.items[0].name).toBe('Nova')
    expect(next.items[0].position).toBeNull()
    expect(next.categories).toContain('Inédita')
  })

  it('desfaz e refaz movimentações', () => {
    let h = historyReducer({ present: base, past: [], future: [] }, { type: 'apply', action: { type: 'add', input } })
    const id = h.present.items[0].id
    h = historyReducer(h, { type: 'apply', action: { type: 'move', id, position: { x: 0.2, y: 0.8 } } })
    expect(h.present.items[0].position).toEqual({ x: 0.2, y: 0.8 })
    h = historyReducer(h, { type: 'undo' })
    expect(h.present.items[0].position).toBeNull()
    h = historyReducer(h, { type: 'redo' })
    expect(h.present.items[0].position).toEqual({ x: 0.2, y: 0.8 })
  })

  it('carrega 8 melhorias de exemplo', () => {
    expect(createSeedData().items).toHaveLength(8)
  })
})

describe('filtros', () => {
  const item = createSeedData().items[0]
  it('busca por nome, processo e categoria sem diferenciar acentos', () => {
    expect(matchesFilters(item, { ...EMPTY_FILTERS, search: 'comunicacao' })).toBe(true)
    expect(matchesFilters(item, { ...EMPTY_FILTERS, search: 'frequência' })).toBe(true)
    expect(matchesFilters(item, { ...EMPTY_FILTERS, search: 'inexistente' })).toBe(false)
  })
})

describe('importação', () => {
  it('reconhece colunas com acentos e ignora linhas sem nome', () => {
    const result = rowsToImprovements([
      ['Melhoria', 'Descrição', 'Processo', 'Categoria', 'Responsável', 'Observações'],
      ['A', 'd', 'p', 'Pessoas', 'r', 'o'],
      ['', 'sem nome', '', '', '', ''],
      ['B', '', '', '', '', ''],
    ])
    expect(result.items.map((i) => i.name)).toEqual(['A', 'B'])
    expect(result.items[0]).toMatchObject({ description: 'd', process: 'p', category: 'Pessoas', owner: 'r', notes: 'o' })
    expect(result.skipped).toBe(1)
    expect(result.missingNameColumn).toBe(false)
  })
})
