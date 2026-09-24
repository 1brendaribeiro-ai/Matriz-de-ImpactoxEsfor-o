import { CircleAlert, CircleCheck, Info, X } from 'lucide-react'
import { useCallback, useRef, useState } from 'react'

export interface Toast {
  id: number
  message: string
  tone: 'success' | 'info' | 'error'
  action?: { label: string; onClick: () => void }
}

export type ShowToast = (message: string, options?: Partial<Omit<Toast, 'id' | 'message'>>) => void

export function useToasts() {
  const [toasts, setToasts] = useState<Toast[]>([])
  const counter = useRef(0)

  const dismiss = useCallback((id: number) => setToasts((list) => list.filter((t) => t.id !== id)), [])

  const show = useCallback<ShowToast>(
    (message, options) => {
      const id = ++counter.current
      const toast: Toast = { id, message, tone: options?.tone ?? 'success', action: options?.action }
      setToasts((list) => [...list.slice(-2), toast])
      window.setTimeout(() => dismiss(id), toast.action ? 5000 : 3000)
    },
    [dismiss],
  )

  return { toasts, show, dismiss }
}

const ICONS = { success: CircleCheck, info: Info, error: CircleAlert }

export function ToastViewport({ toasts, onDismiss }: { toasts: Toast[]; onDismiss: (id: number) => void }) {
  return (
    <div className="toast-viewport" role="status" aria-live="polite">
      {toasts.map((t) => {
        const Icon = ICONS[t.tone]
        return (
          <div key={t.id} className={`toast toast-${t.tone}`}>
            <Icon size={16} className="toast-icon" />
            <span className="toast-message">{t.message}</span>
            {t.action && (
              <button
                type="button"
                className="toast-action"
                onClick={() => {
                  t.action?.onClick()
                  onDismiss(t.id)
                }}
              >
                {t.action.label}
              </button>
            )}
            <button type="button" className="toast-close" onClick={() => onDismiss(t.id)} aria-label="Fechar aviso">
              <X size={14} />
            </button>
          </div>
        )
      })}
    </div>
  )
}
