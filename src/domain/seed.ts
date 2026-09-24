import { newId } from './id'
import type { Improvement, MatrixData } from './types'

type SeedRow = Omit<Improvement, 'id' | 'createdAt' | 'updatedAt'>

const SEED: SeedRow[] = [
  {
    name: 'Padronizar comunicação com o servidor',
    description: 'Definir modelos únicos de e-mail e mensagens para comunicações recorrentes com os servidores.',
    process: 'Controle de Frequência',
    category: 'Recursos humanos',
    notes: 'Levantar os modelos usados hoje por cada unidade.',
    position: { x: 0.2, y: 0.78 },
  },
  {
    name: 'Automatizar envio de documentos',
    description: 'Enviar automaticamente os documentos gerados para as áreas destinatárias.',
    process: 'Gestão Documental',
    category: 'Recursos Tecnológicos',
    notes: '',
    position: { x: 0.78, y: 0.8 },
  },
  {
    name: 'Criar checklist de conferência',
    description: 'Checklist padronizado para conferência dos lançamentos antes do fechamento.',
    process: 'Controle de Frequência',
    category: 'Fluxo de atividades, informações e documentação',
    notes: 'Validar com a equipe de auditoria interna.',
    position: { x: 0.24, y: 0.3 },
  },
  {
    name: 'Integrar sistemas',
    description: 'Integrar o sistema de ponto ao sistema de folha para eliminar redigitação.',
    process: 'Folha de Pagamento',
    category: 'Recursos Tecnológicos',
    notes: 'Depende de contrato com o fornecedor.',
    position: null,
  },
  {
    name: 'Criar manual de procedimentos',
    description: 'Consolidar em um manual as rotinas e exceções do processo.',
    process: 'Gestão Documental',
    category: 'Modelo de Gestão e Organização',
    notes: '',
    position: null,
  },
  {
    name: 'Padronizar formulário',
    description: 'Unificar os formulários de solicitação utilizados pelas unidades.',
    process: 'Atendimento ao Servidor',
    category: 'Fluxo de atividades, informações e documentação',
    notes: '',
    position: null,
  },
  {
    name: 'Automatizar notificações',
    description: 'Notificar automaticamente pendências e prazos aos responsáveis.',
    process: 'Controle de Frequência',
    category: 'Recursos Tecnológicos',
    notes: '',
    position: null,
  },
  {
    name: 'Centralizar documentos',
    description: 'Criar repositório único para os documentos do processo, com controle de versão.',
    process: 'Gestão Documental',
    category: 'Recursos Tecnológicos',
    notes: '',
    position: null,
  },
]

export function createSeedData(): MatrixData {
  const now = new Date().toISOString()
  return {
    version: 2,
    items: SEED.map((row) => ({ ...row, id: newId(), createdAt: now, updatedAt: now })),
  }
}
