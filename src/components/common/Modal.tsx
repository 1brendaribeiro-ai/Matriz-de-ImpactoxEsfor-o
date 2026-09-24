import { X } from 'lucide-react'
import { useEffect, useId, useRef, type ReactNode } from 'react'
import { createPortal } from 'react-dom'

// Pilha de modais abertos: apenas o do topo responde ao Esc.
const openStack: symbol[] = []

interface ModalProps {
  title: string
  subtitle?: ReactNode
  onClose: () => void
  children: ReactNode
  footer?: ReactNode
  size?: 'sm' | 'md' | 'lg'
  testId?: string
}

export function Modal({ title, subtitle, onClose, children, footer, size = 'md', testId }: ModalProps) {
  const titleId = useId()
  const dialogRef = useRef<HTMLDivElement>(null)
  const onCloseRef = useRef(onClose)
  onCloseRef.current = onClose

  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null
    const dialog = dialogRef.current
    const first =
      dialog?.querySelector<HTMLElement>('[data-autofocus]') ??
      dialog?.querySelector<HTMLElement>('.modal-body input, .modal-body select, .modal-body textarea') ??
      dialog
    first?.focus()
    const token = Symbol('modal')
    openStack.push(token)
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && openStack[openStack.length - 1] === token) {
        e.stopPropagation()
        onCloseRef.current()
      }
    }
    document.addEventListener('keydown', onKey)
    return () => {
      openStack.splice(openStack.indexOf(token), 1)
      document.removeEventListener('keydown', onKey)
      previous?.focus?.()
    }
  }, [])

  return createPortal(
    <div className="modal-backdrop" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div
        ref={dialogRef}
        className={`modal modal-${size}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        data-testid={testId}
      >
        <header className="modal-header">
          <div>
            <h2 id={titleId}>{title}</h2>
            {subtitle && <div className="modal-subtitle">{subtitle}</div>}
          </div>
          <button type="button" className="icon-btn" onClick={onClose} aria-label="Fechar">
            <X size={18} />
          </button>
        </header>
        <div className="modal-body">{children}</div>
        {footer && <footer className="modal-footer">{footer}</footer>}
      </div>
    </div>,
    document.body,
  )
}
