import { Pencil, Trash2, Undo2 } from 'lucide-react'
import { levelsOf, quadrantOf, QUADRANTS } from '../../domain/quadrants'
import type { Improvement } from '../../domain/types'
import { CategoryIcon } from '../common/CategoryIcon'
import { Modal } from '../common/Modal'

interface DetailsModalProps {
  item: Improvement
  onEdit: () => void
  onDelete: () => void
  onUnclassify: () => void
  onClose: () => void
}

function Field({ label, value, wide }: { label: string; value: string; wide?: boolean }) {
  return (
    <div className={`detail-field${wide ? ' span-2' : ''}`}>
      <dt>{label}</dt>
      <dd className={value ? '' : 'is-empty'}>{value || 'Não informado'}</dd>
    </div>
  )
}

export function DetailsModal({ item, onEdit, onDelete, onUnclassify, onClose }: DetailsModalProps) {
  const quadrant = quadrantOf(item)
  const { impact, effort } = levelsOf(item)

  return (
    <Modal
      title={item.name}
      subtitle={
        <span className="details-sub">
          {item.category && (
            <span className="chip">
              <CategoryIcon category={item.category} size={12} /> {item.category}
            </span>
          )}
          {quadrant ? (
            <span className={`q-tag q-${quadrant}`} data-testid="details-quadrant">
              {QUADRANTS[quadrant].title} · {QUADRANTS[quadrant].action}
            </span>
          ) : (
            <span className="q-tag q-none" data-testid="details-quadrant">
              Não classificada
            </span>
          )}
        </span>
      }
      onClose={onClose}
      size="lg"
      testId="details-modal"
      footer={
        <>
          <button type="button" className="btn btn-danger-ghost" onClick={onDelete} data-testid="details-delete">
            <Trash2 size={15} /> Excluir
          </button>
          <span className="spacer" />
          {quadrant && (
            <button type="button" className="btn btn-ghost" onClick={onUnclassify} data-testid="details-unclassify">
              <Undo2 size={15} /> Remover da matriz
            </button>
          )}
          <button type="button" className="btn btn-primary" onClick={onEdit} data-autofocus data-testid="details-edit">
            <Pencil size={15} /> Editar
          </button>
        </>
      }
    >
      <div className="classification-strip">
        <div>
          <span className="strip-label">Impacto</span>
          <span className={`level level-${impact ?? 'none'}`} data-testid="details-impact">
            {impact ?? '—'}
          </span>
        </div>
        <div>
          <span className="strip-label">Esforço</span>
          <span className={`level level-${effort ?? 'none'}`} data-testid="details-effort">
            {effort ?? '—'}
          </span>
        </div>
        <div>
          <span className="strip-label">Quadrante atual</span>
          <span className="strip-value">{quadrant ? `${QUADRANTS[quadrant].title} (${QUADRANTS[quadrant].axes})` : 'Não classificada'}</span>
        </div>
      </div>
      {quadrant && (
        <p className="strip-note">Impacto e esforço são definidos pela posição do card na matriz — arraste-o para reclassificar.</p>
      )}
      <dl className="details-grid">
        <Field label="Nome" value={item.name} wide />
        <Field label="Descrição" value={item.description} wide />
        <Field label="Processo" value={item.process} />
        <Field label="Categoria" value={item.category} />
        <Field label="Responsável" value={item.owner} />
        <Field label="Atualizado em" value={new Date(item.updatedAt).toLocaleString('pt-BR')} />
        <Field label="Observações" value={item.notes} wide />
      </dl>
    </Modal>
  )
}
