import { newId } from '../domain/id'
import type { Improvement, ImprovementInput, MatrixData, Position } from '../domain/types'

export type MatrixAction =
  | { type: 'add'; input: ImprovementInput; position?: Position | null; id?: string }
  | { type: 'update'; id: string; input: ImprovementInput; position?: Position | null }
  | { type: 'delete'; id: string }
  | { type: 'move'; id: string; position: Position | null }
  | { type: 'import'; inputs: ImprovementInput[] }
  | { type: 'addCategory'; name: string }
  | { type: 'removeCategory'; name: string }
  | { type: 'replaceAll'; data: MatrixData }

function ensureCategory(categories: string[], name: string): string[] {
  const trimmed = name.trim()
  if (!trimmed) return categories
  const exists = categories.some((c) => c.toLocaleLowerCase('pt-BR') === trimmed.toLocaleLowerCase('pt-BR'))
  return exists ? categories : [...categories, trimmed]
}

function clean(input: ImprovementInput): ImprovementInput {
  return {
    name: input.name.trim(),
    description: input.description.trim(),
    process: input.process.trim(),
    category: input.category.trim(),
    owner: input.owner.trim(),
    notes: input.notes.trim(),
  }
}

export function matrixReducer(state: MatrixData, action: MatrixAction): MatrixData {
  const now = new Date().toISOString()
  switch (action.type) {
    case 'add': {
      const input = clean(action.input)
      const item: Improvement = {
        ...input,
        id: action.id ?? newId(),
        position: action.position ?? null,
        createdAt: now,
        updatedAt: now,
      }
      return {
        ...state,
        items: [...state.items, item],
        categories: ensureCategory(state.categories, input.category),
      }
    }
    case 'update': {
      const input = clean(action.input)
      return {
        ...state,
        items: state.items.map((i) =>
          i.id === action.id
            ? {
                ...i,
                ...input,
                position: action.position === undefined ? i.position : action.position,
                updatedAt: now,
              }
            : i,
        ),
        categories: ensureCategory(state.categories, input.category),
      }
    }
    case 'delete':
      return { ...state, items: state.items.filter((i) => i.id !== action.id) }
    case 'move': {
      // o item movido vai para o fim da lista, ficando visualmente por cima dos demais
      const item = state.items.find((i) => i.id === action.id)
      if (!item) return state
      const moved = { ...item, position: action.position, updatedAt: now }
      return { ...state, items: [...state.items.filter((i) => i.id !== action.id), moved] }
    }
    case 'import': {
      let categories = state.categories
      const items = action.inputs.map((raw): Improvement => {
        const input = clean(raw)
        categories = ensureCategory(categories, input.category)
        return { ...input, id: newId(), position: null, createdAt: now, updatedAt: now }
      })
      return { ...state, items: [...state.items, ...items], categories }
    }
    case 'addCategory':
      return { ...state, categories: ensureCategory(state.categories, action.name) }
    case 'removeCategory':
      return { ...state, categories: state.categories.filter((c) => c !== action.name) }
    case 'replaceAll':
      return action.data
  }
}

/** Descrição curta da ação, usada em "Desfazer: …". */
export function describeAction(state: MatrixData, action: MatrixAction): string {
  const name = (id: string) => state.items.find((i) => i.id === id)?.name ?? 'melhoria'
  switch (action.type) {
    case 'add':
      return `Adicionar “${action.input.name.trim()}”`
    case 'update':
      return `Editar “${name(action.id)}”`
    case 'delete':
      return `Excluir “${name(action.id)}”`
    case 'move':
      return action.position ? `Mover “${name(action.id)}”` : `Remover “${name(action.id)}” da matriz`
    case 'import':
      return `Importar ${action.inputs.length} melhoria(s)`
    case 'addCategory':
      return `Adicionar categoria “${action.name}”`
    case 'removeCategory':
      return `Remover categoria “${action.name}”`
    case 'replaceAll':
      return 'Substituir dados'
  }
}

// ---------------------------------------------------------------------------
// Histórico (desfazer / refazer)

export interface HistoryEntry {
  data: MatrixData
  label: string
}

export interface HistoryState {
  present: MatrixData
  past: HistoryEntry[]
  future: HistoryEntry[]
}

export type HistoryAction =
  | { type: 'apply'; action: MatrixAction }
  | { type: 'undo' }
  | { type: 'redo' }
  | { type: 'load'; data: MatrixData }

const HISTORY_LIMIT = 100

export function historyReducer(state: HistoryState, action: HistoryAction): HistoryState {
  switch (action.type) {
    case 'apply': {
      const next = matrixReducer(state.present, action.action)
      if (next === state.present) return state
      const entry = { data: state.present, label: describeAction(state.present, action.action) }
      return {
        present: next,
        past: [...state.past, entry].slice(-HISTORY_LIMIT),
        future: [],
      }
    }
    case 'undo': {
      const prev = state.past[state.past.length - 1]
      if (!prev) return state
      return {
        present: prev.data,
        past: state.past.slice(0, -1),
        future: [{ data: state.present, label: prev.label }, ...state.future],
      }
    }
    case 'redo': {
      const next = state.future[0]
      if (!next) return state
      return {
        present: next.data,
        past: [...state.past, { data: state.present, label: next.label }],
        future: state.future.slice(1),
      }
    }
    case 'load':
      return { present: action.data, past: [], future: [] }
  }
}
