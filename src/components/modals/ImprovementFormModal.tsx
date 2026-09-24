import { Info } from 'lucide-react'
import { useId, useState, type FormEvent } from 'react'
import { QUADRANT_ORDER, QUADRANTS, quadrantOf } from '../../domain/quadrants'
import type { Improvement, ImprovementInput, QuadrantId } from '../../domain/types'
import { Modal } from '../common/Modal'

export type PlacementChoice = QuadrantId | 'none'

interface ImprovementFormModalProps {
  item?: Improvement
  categories: string[]
  processes: string[]
  owners: string[]
  onSubmit: (input: ImprovementInput, placement: PlacementChoice) => void
  onClose: () => void
}

const EMPTY: ImprovementInput = { name: '', description: '', process: '', category: '', owner: '', notes: '' }
const NEW_CATEGORY = '__new__'

export function ImprovementFormModal({ item, categories, processes, owners, onSubmit, onClose }: ImprovementFormModalProps) {
  const [values, setValues] = useState<ImprovementInput>(() =>
    item
      ? { name: item.name, description: item.description, process: item.process, category: item.category, owner: item.owner, notes: item.notes }
      : EMPTY,
  )
  const initialPlacement: PlacementChoice = (item && quadrantOf(item)) || 'none'
  const [placement, setPlacement] = useState<PlacementChoice>(initialPlacement)
  const [newCategory, setNewCategory] = useState<string | null>(null)
  const [error, setError] = useState('')
  const ids = { process: useId(), owner: useId() }

  const categoryOptions =
    values.category && !categories.includes(values.category) ? [...categories, values.category] : categories

  const set = (key: keyof ImprovementInput, value: string) => setValues((v) => ({ ...v, [key]: value }))

  const submit = (e: FormEvent) => {
    e.preventDefault()
    if (!values.name.trim()) {
      setError('Informe o nome da melhoria.')
      return
    }
    const category = newCategory !== null ? newCategory.trim() : values.category
    onSubmit({ ...values, category }, placement)
  }

  return (
    <Modal
      title={item ? 'Editar melhoria' : 'Nova melhoria'}
      subtitle={item ? undefined : 'Após salvar, arraste o card do painel lateral para a matriz.'}
      onClose={onClose}
      testId="improvement-form"
      footer={
        <>
          <button type="button" className="btn btn-ghost" onClick={onClose}>
            Cancelar
          </button>
          <button type="submit" form="improvement-form" className="btn btn-primary" data-testid="form-submit">
            {item ? 'Salvar alterações' : 'Adicionar melhoria'}
          </button>
        </>
      }
    >
      <form id="improvement-form" className="form-grid" onSubmit={submit} noValidate>
        <label className="field span-2">
          <span>
            Nome da melhoria <em className="req">*</em>
          </span>
          <input
            value={values.name}
            onChange={(e) => {
              set('name', e.target.value)
              setError('')
            }}
            placeholder="Ex.: Automatizar envio de frequência"
            maxLength={140}
            aria-invalid={Boolean(error)}
            data-autofocus
            data-testid="field-name"
          />
          {error && <small className="field-error">{error}</small>}
        </label>

        <label className="field span-2">
          <span>Descrição</span>
          <textarea
            value={values.description}
            onChange={(e) => set('description', e.target.value)}
            rows={3}
            placeholder="O que será feito e qual problema resolve"
            data-testid="field-description"
          />
        </label>

        <label className="field">
          <span>Processo</span>
          <input
            value={values.process}
            onChange={(e) => set('process', e.target.value)}
            list={ids.process}
            placeholder="Ex.: Controle de Frequência"
            data-testid="field-process"
          />
          <datalist id={ids.process}>
            {processes.map((p) => (
              <option key={p} value={p} />
            ))}
          </datalist>
        </label>

        <label className="field">
          <span>Categoria</span>
          {newCategory === null ? (
            <select
              value={values.category}
              onChange={(e) => (e.target.value === NEW_CATEGORY ? setNewCategory('') : set('category', e.target.value))}
              data-testid="field-category"
            >
              <option value="">Selecione…</option>
              {categoryOptions.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
              <option value={NEW_CATEGORY}>+ Nova categoria…</option>
            </select>
          ) : (
            <div className="inline-input">
              <input
                autoFocus
                value={newCategory}
                onChange={(e) => setNewCategory(e.target.value)}
                placeholder="Nome da nova categoria"
                data-testid="field-new-category"
              />
              <button type="button" className="link-btn" onClick={() => setNewCategory(null)}>
                Cancelar
              </button>
            </div>
          )}
        </label>

        <label className="field">
          <span>Responsável</span>
          <input
            value={values.owner}
            onChange={(e) => set('owner', e.target.value)}
            list={ids.owner}
            placeholder="Nome do responsável"
            data-testid="field-owner"
          />
          <datalist id={ids.owner}>
            {owners.map((o) => (
              <option key={o} value={o} />
            ))}
          </datalist>
        </label>

        <label className="field">
          <span>Posição na matriz</span>
          <select value={placement} onChange={(e) => setPlacement(e.target.value as PlacementChoice)} data-testid="field-placement">
            <option value="none">Não classificada (arrastar depois)</option>
            {QUADRANT_ORDER.map((id) => (
              <option key={id} value={id}>
                {QUADRANTS[id].title} — {QUADRANTS[id].axes}
              </option>
            ))}
          </select>
        </label>

        <label className="field span-2">
          <span>Observações</span>
          <textarea value={values.notes} onChange={(e) => set('notes', e.target.value)} rows={2} data-testid="field-notes" />
        </label>
      </form>
      {!item && (
        <p className="form-tip">
          <Info size={12} /> Dica: a classificação principal é visual — basta arrastar o card para a matriz.
        </p>
      )}
    </Modal>
  )
}
