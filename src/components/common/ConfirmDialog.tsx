import { TriangleAlert } from 'lucide-react'
import type { ReactNode } from 'react'
import { Modal } from './Modal'

interface ConfirmDialogProps {
  title: string
  message: ReactNode
  confirmLabel?: string
  danger?: boolean
  onConfirm: () => void
  onCancel: () => void
}

export function ConfirmDialog({ title, message, confirmLabel = 'Confirmar', danger, onConfirm, onCancel }: ConfirmDialogProps) {
  return (
    <Modal
      title={title}
      onClose={onCancel}
      size="sm"
      testId="confirm-dialog"
      footer={
        <>
          <button type="button" className="btn btn-ghost" onClick={onCancel} data-autofocus>
            Cancelar
          </button>
          <button type="button" className={`btn ${danger ? 'btn-danger' : 'btn-primary'}`} onClick={onConfirm}>
            {confirmLabel}
          </button>
        </>
      }
    >
      <div className="confirm-body">
        {danger && (
          <span className="confirm-icon">
            <TriangleAlert size={20} />
          </span>
        )}
        <div>{message}</div>
      </div>
    </Modal>
  )
}
