import { newId } from './id'
import type { Improvement, MatrixData } from './types'

export const DEFAULT_CATEGORIES = [
  'Pessoas',
  'Processos',
  'Tecnologia',
  'Sistemas',
  'Comunicação',
  'Governança',
  'Documentação',
  'Automação',
  'Normativos',
]

type SeedRow = Omit<Improvement, 'id' | 'createdAt' | 'updatedAt'>

const SEED: SeedRow[] = [
  {
    name: 'Padronizar comunicação com o servidor',
    description: 'Definir modelos únicos de e-mail e mensagens para comunicações recorrentes com os servidores.',
    process: 'Controle de Frequência',
    category: 'Comunicação',
    owner: 'Ana Souza',
    notes: 'Levantar os modelos usados hoje por cada unidade.',
    position: { x: 0.2, y: 0.78 },
  },
  {
    name: 'Automatizar envio de documentos',
    description: 'Enviar automaticamente os documentos gerados para as áreas destinatárias.',
    process: 'Gestão Documental',
    category: 'Automação',
    owner: 'Carlos Lima',
    notes: '',
    position: { x: 0.78, y: 0.8 },
  },
  {
    name: 'Criar checklist de conferência',
    description: 'Checklist padronizado para conferência dos lançamentos antes do fechamento.',
    process: 'Controle de Frequência',
    category: 'Processos',
    owner: 'Ana Souza',
    notes: 'Validar com a equipe de auditoria interna.',
    position: { x: 0.24, y: 0.3 },
  },
  {
    name: 'Integrar sistemas',
    description: 'Integrar o sistema de ponto ao sistema de folha para eliminar redigitação.',
    process: 'Folha de Pagamento',
    category: 'Sistemas',
    owner: 'Marcos Pereira',
    notes: 'Depende de contrato com o fornecedor.',
    position: null,
  },
  {
    name: 'Criar manual de procedimentos',
    description: 'Consolidar em um manual as rotinas e exceções do processo.',
    process: 'Gestão Documental',
    category: 'Documentação',
    owner: 'Juliana Rocha',
    notes: '',
    position: null,
  },
  {
    name: 'Padronizar formulário',
    description: 'Unificar os formulários de solicitação utilizados pelas unidades.',
    process: 'Atendimento ao Servidor',
    category: 'Processos',
    owner: 'Juliana Rocha',
    notes: '',
    position: null,
  },
  {
    name: 'Automatizar notificações',
    description: 'Notificar automaticamente pendências e prazos aos responsáveis.',
    process: 'Controle de Frequência',
    category: 'Automação',
    owner: 'Carlos Lima',
    notes: '',
    position: null,
  },
  {
    name: 'Centralizar documentos',
    description: 'Criar repositório único para os documentos do processo, com controle de versão.',
    process: 'Gestão Documental',
    category: 'Tecnologia',
    owner: 'Marcos Pereira',
    notes: '',
    position: null,
  },
]

export function createSeedData(): MatrixData {
  const now = new Date().toISOString()
  return {
    version: 1,
    categories: [...DEFAULT_CATEGORIES],
    items: SEED.map((row) => ({ ...row, id: newId(), createdAt: now, updatedAt: now })),
  }
}
