import { Cpu, Landmark, Shapes, Users, Workflow, type LucideIcon } from 'lucide-react'
import type { Category } from '../../domain/categories'

const MAP: Record<Category, LucideIcon> = {
  'Modelo de Gestão e Organização': Landmark,
  'Fluxo de atividades, informações e documentação': Workflow,
  'Recursos humanos': Users,
  'Recursos Tecnológicos': Cpu,
  Outros: Shapes,
}

export function CategoryIcon({ category, size = 14 }: { category: string; size?: number }) {
  const Icon = MAP[category as Category] ?? Shapes
  return <Icon size={size} strokeWidth={1.9} aria-hidden="true" />
}
