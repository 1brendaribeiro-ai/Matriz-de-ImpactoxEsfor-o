import { describe, expect, it } from 'vitest'
import { clampCenterToQuadrant, pixelToPosition, quadrantAtPixel } from '../../src/components/matrix/geometry'
import { matchesFilters, EMPTY_FILTERS } from '../../src/domain/filters'
import { CATEGORIES, matchCategory } from '../../src/domain/categories'
import { levelFrom, quadrantAt } from '../../src/domain/quadrants'
import { createSeedData } from '../../src/domain/seed'
import type { Improvement } from '../../src/domain/types'
import { rowsToImprovements } from '../../src/io/importer'
import { historyReducer, matrixReducer } from '../../src/state/matrixReducer'
import { parseMatrixData } from '../../src/storage/parse'

const size = { width: 1000, height: 800 }

describe('quadrantes', () => {
  it('identifica o quadrante pela posição (esquerda = menor esforço, topo = maior impacto)', () => {
    expect(quadrantAt({ x: 0.2, y: 0.8 })).toBe('high-impact-low-effort')
    expect(quadrantAt({ x: 0.8, y: 0.8 })).toBe('high-impact-high-effort')
    expect(quadrantAt({ x: 0.2, y: 0.2 })).toBe('low-impact-low-effort')
    expect(quadrantAt({ x: 0.8, y: 0.2 })).toBe('low-impact-high-effort')
  })

  it('converte pixels do tabuleiro em quadrante', () => {
    expect(quadrantAtPixel({ x: 100, y: 100 }, size)).toBe('high-impact-low-effort')
    expect(quadrantAtPixel({ x: 900, y: 100 }, size)).toBe('high-impact-high-effort')
    expect(quadrantAtPixel({ x: 100, y: 700 }, size)).toBe('low-impact-low-effort')
    expect(quadrantAtPixel({ x: 900, y: 700 }, size)).toBe('low-impact-high-effort')
  })

  it('deriva níveis Baixo/Médio/Alto da posição', () => {
    expect(levelFrom(0.9)).toBe('Alto')
    expect(levelFrom(0.5)).toBe('Médio')
    expect(levelFrom(0.1)).toBe('Baixo')
  })

  it('mantém o card dentro do quadrante escolhido, mesmo soltando na borda', () => {
    const clamped = clampCenterToQuadrant({ x: 495, y: 405 }, 'high-impact-low-effort', size)
    const pos = pixelToPosition(clamped, size)
    expect(quadrantAt(pos)).toBe('high-impact-low-effort')
  })
})

describe('estado e histórico', () => {
  const base = { version: 2 as const, items: [] as Improvement[] }
  const input = { name: ' Nova ', description: '', process: 'P', category: 'Recursos humanos', notes: '' }

  it('adiciona melhoria não classificada', () => {
    const next = matrixReducer(base, { type: 'add', input })
    expect(next.items).toHaveLength(1)
    expect(next.items[0].name).toBe('Nova')
    expect(next.items[0].category).toBe('Recursos humanos')
    expect(next.items[0].position).toBeNull()
  })

  it('não cria categorias novas: valores fora da lista viram "Outros"', () => {
    const next = matrixReducer(base, { type: 'add', input: { ...input, category: 'Inédita' } })
    expect(next.items[0].category).toBe('Outros')
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
    expect(matchesFilters(item, { ...EMPTY_FILTERS, search: 'recursos humanos' })).toBe(true)
    expect(matchesFilters(item, { ...EMPTY_FILTERS, search: 'frequência' })).toBe(true)
    expect(matchesFilters(item, { ...EMPTY_FILTERS, search: 'inexistente' })).toBe(false)
  })
})

describe('importação', () => {
  it('reconhece colunas com acentos, ignora linhas sem nome e usa só as categorias da lista', () => {
    const result = rowsToImprovements([
      ['Melhoria', 'Descrição', 'Processo', 'Categoria', 'Observações'],
      ['A', 'd', 'p', 'recursos TECNOLOGICOS', 'o'],
      ['', 'sem nome', '', '', ''],
      ['B', '', '', 'Categoria inventada', ''],
    ])
    expect(result.items.map((i) => i.name)).toEqual(['A', 'B'])
    expect(result.items[0]).toMatchObject({ description: 'd', process: 'p', category: 'Recursos Tecnológicos', notes: 'o' })
    expect(result.items[1]).toMatchObject({ category: 'Outros', notes: 'Categoria original: Categoria inventada' })
    expect(result.unknownCategories).toBe(1)
    expect(result.skipped).toBe(1)
    expect(result.missingNameColumn).toBe(false)
  })
})

describe('categorias e migração', () => {
  it('possui exatamente as cinco categorias definidas', () => {
    expect([...CATEGORIES]).toEqual([
      'Modelo de Gestão e Organização',
      'Fluxo de atividades, informações e documentação',
      'Recursos humanos',
      'Recursos Tecnológicos',
      'Outros',
    ])
    expect(matchCategory('outros')).toBe('Outros')
  })

  it('migra dados da versão anterior (remove Responsável e converte categorias)', () => {
    const migrated = parseMatrixData({
      version: 1,
      categories: ['Pessoas'],
      items: [
        { id: '1', name: 'X', category: 'Pessoas', owner: 'Ana', position: { x: 0.2, y: 0.8 } },
        { id: '2', name: 'Y', category: 'Qualquer', owner: '', notes: 'n', position: null },
      ],
    })!
    expect(migrated.items[0]).not.toHaveProperty('owner')
    expect(migrated.items[0].category).toBe('Recursos humanos')
    expect(migrated.items[1]).toMatchObject({ category: 'Outros', notes: 'n\nCategoria original: Qualquer' })
  })
})
