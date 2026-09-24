import { ArchiveRestore, Database, Download, Plus, RotateCcw, Trash2, Upload, X } from 'lucide-react'
import { useRef, useState, type FormEvent } from 'react'
import type { Improvement } from '../../domain/types'
import { Modal } from '../common/Modal'

interface SettingsModalProps {
  categories: string[]
  items: Improvement[]
  onAddCategory: (name: string) => void
  onRemoveCategory: (name: string) => void
  onRestoreSample: () => void
  onClearAll: () => void
  onBackup: () => void
  onRestoreBackup: (file: File) => void
  onClose: () => void
}

export function SettingsModal(props: SettingsModalProps) {
  const { categories, items } = props
  const [name, setName] = useState('')
  const backupRef = useRef<HTMLInputElement>(null)
  const usage = (c: string) => items.filter((i) => i.category === c).length

  const add = (e: FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return
    props.onAddCategory(name.trim())
    setName('')
  }

  return (
    <Modal title="Configurações" onClose={props.onClose} size="lg" testId="settings-modal">
      <section className="settings-section">
        <h3>Categorias</h3>
        <p className="muted">Usadas no cadastro e nos filtros. Remover uma categoria não altera as melhorias que já a utilizam.</p>
        <form className="inline-form" onSubmit={add}>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Nova categoria"
            aria-label="Nome da nova categoria"
            data-testid="settings-category-input"
          />
          <button type="submit" className="btn btn-secondary" disabled={!name.trim()} data-testid="settings-category-add">
            <Plus size={15} /> Adicionar
          </button>
        </form>
        <ul className="category-list" data-testid="category-list">
          {categories.map((c) => (
            <li key={c} className="category-chip">
              <span>{c}</span>
              <small>{usage(c)}</small>
              <button type="button" onClick={() => props.onRemoveCategory(c)} aria-label={`Remover categoria ${c}`}>
                <X size={13} />
              </button>
            </li>
          ))}
        </ul>
      </section>

      <section className="settings-section">
        <h3>Dados</h3>
        <p className="muted">
          <Database size={13} /> Os dados ficam salvos neste navegador (armazenamento local) e são gravados automaticamente.
        </p>
        <div className="settings-actions">
          <button type="button" className="btn btn-ghost" onClick={props.onBackup}>
            <Download size={15} /> Exportar backup (JSON)
          </button>
          <button type="button" className="btn btn-ghost" onClick={() => backupRef.current?.click()}>
            <Upload size={15} /> Restaurar backup
          </button>
          <input
            ref={backupRef}
            type="file"
            accept=".json,application/json"
            hidden
            onChange={(e) => {
              const file = e.target.files?.[0]
              if (file) props.onRestoreBackup(file)
              e.target.value = ''
            }}
          />
          <button type="button" className="btn btn-ghost" onClick={props.onRestoreSample}>
            <ArchiveRestore size={15} /> Carregar dados de exemplo
          </button>
          <button type="button" className="btn btn-danger-ghost" onClick={props.onClearAll} data-testid="settings-clear">
            <Trash2 size={15} /> Excluir todas as melhorias
          </button>
        </div>
        <p className="muted small">
          <RotateCcw size={12} /> Todas as ações podem ser desfeitas com Ctrl+Z.
        </p>
      </section>
    </Modal>
  )
}

