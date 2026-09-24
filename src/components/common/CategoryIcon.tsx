import {
  Bot,
  Cpu,
  FileText,
  Landmark,
  MessageSquare,
  Scale,
  Server,
  Users,
  Workflow,
  Wrench,
  type LucideIcon,
} from 'lucide-react'
import { normalize } from '../../domain/filters'

const MAP: Record<string, LucideIcon> = {
  pessoas: Users,
  processos: Workflow,
  tecnologia: Cpu,
  sistemas: Server,
  comunicacao: MessageSquare,
  governanca: Landmark,
  documentacao: FileText,
  automacao: Bot,
  normativos: Scale,
}

export function CategoryIcon({ category, size = 14 }: { category: string; size?: number }) {
  const Icon = MAP[normalize(category)] ?? Wrench
  return <Icon size={size} strokeWidth={1.9} aria-hidden="true" />
}
