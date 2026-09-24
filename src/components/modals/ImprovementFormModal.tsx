import { Info } from 'lucide-react'
import { useId, useState, type FormEvent } from 'react'
import { CATEGORIES, isCategory } from '../../domain/categories'
import type { Improvement, ImprovementInput } from '../../domain/types'
import { Modal } from '../common/Modal'

interface ImprovementFormModalProps {
  item?: Improvement
  processes: string[]
  onSubmit: (input: ImprovementInput) => void
  onClose: () => void
}

const EMPTY: ImprovementInput = { name: '', description: '', process: '', category: '', notes: '' }

type Errors = Partial<Record<'name' | 'category', string>>

export function ImprovementFormModal({ item, processes, onSubmit, onClose }: ImprovementFormModalProps) {
  const [values, setValues] = useState<ImprovementInput>(() =>
    item
      ? { name: item.name, description: item.description, process: item.process, category: item.category, notes: item.notes }
      : EMPTY,
  )
  const [errors, setErrors] = useState<Errors>({})
  const processListId = useId()

  const set = (key: keyof ImprovementInput, value: string) => {
    setValues((v) => ({ ...v, [key]: value }))
    if (key === 'name' || key === 'category') setErrors((e) => ({ ...e, [key]: undefined }))
  }

  const submit = (e: FormEvent) => {
    e.preventDefault()
    const next: Errors = {}
    if (!values.name.trim()) next.name = 'Informe o nome da melhoria.'
    if (!isCategory(values.category)) next.category = 'Selecione uma categoria.'
    setErrors(next)
    if (next.name || next.category) return
    onSubmit(values)
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
            onChange={(e) => set('name', e.target.value)}
            placeholder="Ex.: Automatizar envio de frequência"
            maxLength={140}
            aria-invalid={Boolean(errors.name)}
            data-autofocus
            data-testid="field-name"
          />
          {errors.name && <small className="field-error">{errors.name}</small>}
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

        <label className="field span-2">
          <span>Processo</span>
          <input
            value={values.process}
            onChange={(e) => set('process', e.target.value)}
            list={processListId}
            placeholder="Ex.: Controle de Frequência"
            data-testid="field-process"
          />
          <datalist id={processListId}>
            {processes.map((p) => (
              <option key={p} value={p} />
            ))}
          </datalist>
        </label>

        <label className="field span-2">
          <span>
            Categoria <em className="req">*</em>
          </span>
          <select
            value={values.category}
            onChange={(e) => set('category', e.target.value)}
            aria-invalid={Boolean(errors.category)}
            data-testid="field-category"
          >
            <option value="" disabled>
              Selecione…
            </option>
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
          {errors.category && <small className="field-error">{errors.category}</small>}
        </label>

        <label className="field span-2">
          <span>Observações</span>
          <textarea value={values.notes} onChange={(e) => set('notes', e.target.value)} rows={2} data-testid="field-notes" />
        </label>
      </form>
      {!item && (
        <p className="form-tip">
          <Info size={12} /> A classificação de impacto e esforço é feita arrastando o card para a matriz.
        </p>
      )}
    </Modal>
  )
}
