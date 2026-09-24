import Papa from 'papaparse'
import { DEFAULT_CATEGORY, matchCategory } from '../domain/categories'
import { normalize } from '../domain/filters'
import type { ImprovementInput } from '../domain/types'

export interface ImportResult {
  items: ImprovementInput[]
  skipped: number
  /** Colunas reconhecidas, na forma "Coluna do arquivo → campo" */
  mappedColumns: string[]
  missingNameColumn: boolean
  /** Linhas cuja categoria não está na lista e foi importada como "Outros" */
  unknownCategories: number
}

type Field = keyof ImprovementInput

const COLUMN_ALIASES: Record<Field, string[]> = {
  name: ['melhoria', 'nome', 'nome da melhoria', 'titulo', 'oportunidade', 'oportunidade de melhoria'],
  description: ['descricao', 'descricao da melhoria', 'detalhamento'],
  process: ['processo', 'processo de trabalho'],
  category: ['categoria', 'tipo'],
  notes: ['observacoes', 'observacao', 'obs', 'comentarios'],
}

export const FIELD_LABELS: Record<Field, string> = {
  name: 'Melhoria',
  description: 'Descrição',
  process: 'Processo',
  category: 'Categoria',
  notes: 'Observações',
}

function matchField(header: string): Field | null {
  const h = normalize(header).replace(/[:*]/g, '').trim()
  for (const [field, aliases] of Object.entries(COLUMN_ALIASES) as [Field, string[]][]) {
    if (aliases.includes(h)) return field
  }
  return null
}

function cellToString(value: unknown): string {
  if (value === null || value === undefined) return ''
  if (value instanceof Date) return value.toLocaleDateString('pt-BR')
  return String(value).trim()
}

/** Converte uma tabela (primeira linha = cabeçalho) em melhorias. */
export function rowsToImprovements(rows: unknown[][]): ImportResult {
  const headerIndex = rows.findIndex((r) => r.some((c) => cellToString(c) !== ''))
  if (headerIndex < 0) return { items: [], skipped: 0, mappedColumns: [], missingNameColumn: true, unknownCategories: 0 }

  const header = rows[headerIndex].map(cellToString)
  const mapping = new Map<number, Field>()
  header.forEach((h, idx) => {
    const field = matchField(h)
    if (field && ![...mapping.values()].includes(field)) mapping.set(idx, field)
  })

  const missingNameColumn = ![...mapping.values()].includes('name')
  const items: ImprovementInput[] = []
  let skipped = 0
  let unknownCategories = 0

  for (const row of rows.slice(headerIndex + 1)) {
    if (!row || row.every((c) => cellToString(c) === '')) continue
    const input: ImprovementInput = { name: '', description: '', process: '', category: '', notes: '' }
    mapping.forEach((field, idx) => {
      input[field] = cellToString(row[idx])
    })
    if (!input.name) {
      skipped++
      continue
    }
    // Apenas as categorias da lista fechada são aceitas; o texto original é preservado nas observações.
    const category = matchCategory(input.category)
    if (!category) {
      if (input.category) {
        unknownCategories++
        input.notes = [input.notes, `Categoria original: ${input.category}`].filter(Boolean).join('\n')
      }
      input.category = DEFAULT_CATEGORY
    } else {
      input.category = category
    }
    items.push(input)
  }

  return {
    items,
    skipped,
    missingNameColumn,
    unknownCategories,
    mappedColumns: [...mapping.entries()].map(([idx, field]) => `${header[idx]} → ${FIELD_LABELS[field]}`),
  }
}

/** Lê CSV tentando UTF-8 e, se houver caracteres inválidos, Windows-1252 (padrão do Excel em PT-BR). */
async function readCsvText(file: File): Promise<string> {
  const buffer = await file.arrayBuffer()
  const utf8 = new TextDecoder('utf-8').decode(buffer)
  // o caractere de substituição (U+FFFD) indica bytes inválidos em UTF-8
  if (!utf8.includes(String.fromCharCode(0xfffd))) return utf8.replace(/^\uFEFF/, '')
  return new TextDecoder('windows-1252').decode(buffer)
}

export async function parseImportFile(file: File): Promise<ImportResult> {
  const name = file.name.toLowerCase()
  if (name.endsWith('.csv') || name.endsWith('.txt') || file.type === 'text/csv') {
    const text = await readCsvText(file)
    const parsed = Papa.parse<string[]>(text, { skipEmptyLines: 'greedy' })
    return rowsToImprovements(parsed.data)
  }
  if (name.endsWith('.xlsx')) {
    const { readSheet } = await import('read-excel-file/browser')
    const rows = await readSheet(file)
    return rowsToImprovements(rows as unknown[][])
  }
  throw new Error('Formato não suportado. Use um arquivo .csv ou .xlsx.')
}

export function downloadTemplate(): void {
  const header = Object.values(FIELD_LABELS).join(';')
  const example = [
    'Padronizar comunicação',
    'Criar modelos únicos de mensagens',
    'Controle de Frequência',
    'Fluxo de atividades, informações e documentação',
    '',
  ].join(';')
  const blob = new Blob(['﻿' + header + '\r\n' + example + '\r\n'], { type: 'text/csv;charset=utf-8' })
  triggerDownload(blob, 'modelo-importacao-melhorias.csv')
}

export function triggerDownload(blob: Blob, fileName: string): void {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = fileName
  document.body.appendChild(a)
  a.click()
  a.remove()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}
