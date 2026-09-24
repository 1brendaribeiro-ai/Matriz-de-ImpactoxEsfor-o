import { CloudCheck, LayoutGrid, LoaderCircle, Plus, Redo2, Save, Settings, TriangleAlert, Undo2 } from 'lucide-react'
import type { SaveStatus } from '../../state/useMatrixStore'
import { ExportMenu, type ExportFormat } from './ExportMenu'

interface HeaderProps {
  canUndo: boolean
  canRedo: boolean
  undoLabel: string | null
  redoLabel: string | null
  saveStatus: SaveStatus
  lastSavedAt: Date | null
  exporting: ExportFormat | null
  onUndo: () => void
  onRedo: () => void
  onSettings: () => void
  onSave: () => void
  onExport: (format: ExportFormat) => void
  onNew: () => void
}

function SaveIndicator({ status, lastSavedAt }: { status: SaveStatus; lastSavedAt: Date | null }) {
  if (status === 'saving') {
    return (
      <span className="save-indicator">
        <LoaderCircle size={13} className="spin" /> Salvando…
      </span>
    )
  }
  if (status === 'error') {
    return (
      <span className="save-indicator is-error">
        <TriangleAlert size={13} /> Falha ao salvar
      </span>
    )
  }
  if (!lastSavedAt) return null
  return (
    <span className="save-indicator" data-testid="save-indicator">
      <CloudCheck size={13} /> Salvo automaticamente às{' '}
      {lastSavedAt.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
    </span>
  )
}

export function Header(props: HeaderProps) {
  const { canUndo, canRedo, undoLabel, redoLabel, saveStatus, lastSavedAt, exporting } = props
  return (
    <header className="app-header">
      <div className="brand">
        <span className="brand-mark" aria-hidden="true">
          <LayoutGrid size={20} />
        </span>
        <div>
          <h1>Matriz de Priorização de Melhorias</h1>
          <div className="brand-sub">
            Impacto x Esforço
            <SaveIndicator status={saveStatus} lastSavedAt={lastSavedAt} />
          </div>
        </div>
      </div>

      <div className="header-actions">
        <div className="btn-group">
          <button
            type="button"
            className="btn btn-ghost btn-icon-text"
            onClick={props.onUndo}
            disabled={!canUndo}
            title={undoLabel ? `Desfazer: ${undoLabel} (Ctrl+Z)` : 'Desfazer (Ctrl+Z)'}
            data-testid="undo"
          >
            <Undo2 size={16} />
            <span className="btn-label">Desfazer</span>
          </button>
          <button
            type="button"
            className="btn btn-ghost btn-icon-text"
            onClick={props.onRedo}
            disabled={!canRedo}
            title={redoLabel ? `Refazer: ${redoLabel} (Ctrl+Y)` : 'Refazer (Ctrl+Y)'}
            data-testid="redo"
          >
            <Redo2 size={16} />
            <span className="btn-label">Refazer</span>
          </button>
        </div>
        <span className="header-divider" aria-hidden="true" />
        <button type="button" className="btn btn-ghost btn-icon-text" onClick={props.onSettings} title="Configurações" data-testid="open-settings">
          <Settings size={16} />
          <span className="btn-label">Configurações</span>
        </button>
        <ExportMenu onExport={props.onExport} exporting={exporting} />
        <button type="button" className="btn btn-secondary btn-icon-text" onClick={props.onSave} title="Salvar (Ctrl+S)" data-testid="save">
          <Save size={16} />
          <span className="btn-label">Salvar</span>
        </button>
        <button type="button" className="btn btn-primary btn-icon-text" onClick={props.onNew} data-testid="header-new">
          <Plus size={16} />
          <span className="btn-label">Nova melhoria</span>
        </button>
      </div>
    </header>
  )
}
