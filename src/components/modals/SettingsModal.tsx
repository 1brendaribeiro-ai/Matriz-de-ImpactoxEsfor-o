import { ArchiveRestore, Database, Download, RotateCcw, Trash2, Upload, WifiOff } from 'lucide-react'
import { useRef } from 'react'
import { Modal } from '../common/Modal'

interface SettingsModalProps {
  onRestoreSample: () => void
  onClearAll: () => void
  onBackup: () => void
  onRestoreBackup: (file: File) => void
  onClose: () => void
}

export function SettingsModal(props: SettingsModalProps) {
  const backupRef = useRef<HTMLInputElement>(null)

  return (
    <Modal title="Configurações" onClose={props.onClose} size="lg" testId="settings-modal">
      <section className="settings-section">
        <h3>Dados</h3>
        <p className="muted">
          <Database size={13} /> Os dados ficam salvos neste dispositivo (IndexedDB do navegador) e são gravados automaticamente.
        </p>
        <p className="muted">
          <WifiOff size={13} /> A aplicação funciona sem internet, inclusive a exportação para PDF, Excel e PNG.
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

