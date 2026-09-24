import { normalize } from './filters'

/** Lista fechada de categorias. Não é possível criar outras. */
export const CATEGORIES = [
  'Modelo de Gestão e Organização',
  'Fluxo de atividades, informações e documentação',
  'Recursos humanos',
  'Recursos Tecnológicos',
  'Outros',
] as const

export type Category = (typeof CATEGORIES)[number]

export const DEFAULT_CATEGORY: Category = 'Outros'

/** Categorias usadas em versões anteriores, convertidas para a nova lista. */
const LEGACY: Record<string, Category> = {
  pessoas: 'Recursos humanos',
  processos: 'Fluxo de atividades, informações e documentação',
  comunicacao: 'Fluxo de atividades, informações e documentação',
  documentacao: 'Fluxo de atividades, informações e documentação',
  tecnologia: 'Recursos Tecnológicos',
  sistemas: 'Recursos Tecnológicos',
  automacao: 'Recursos Tecnológicos',
  governanca: 'Modelo de Gestão e Organização',
  normativos: 'Modelo de Gestão e Organização',
}

/**
 * Converte um texto qualquer em uma das categorias permitidas
 * (sem diferenciar maiúsculas e acentos). Retorna null se não houver correspondência.
 */
export function matchCategory(value: string): Category | null {
  const n = normalize(value)
  if (!n) return null
  return CATEGORIES.find((c) => normalize(c) === n) ?? LEGACY[n] ?? null
}

export function isCategory(value: string): value is Category {
  return (CATEGORIES as readonly string[]).includes(value)
}
