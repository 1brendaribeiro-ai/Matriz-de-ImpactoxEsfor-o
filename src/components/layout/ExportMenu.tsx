import { ChevronDown, Download, FileImage, FileSpreadsheet, FileText, LoaderCircle } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'

export type ExportFormat = 'xlsx' | 'pdf' | 'png'

const OPTIONS: { format: ExportFormat; label: string; hint: string; Icon: typeof FileText }[] = [
  { format: 'xlsx', label: 'Excel', hint: 'Planilha com a classificação', Icon: FileSpreadsheet },
  { format: 'pdf', label: 'PDF', hint: 'Matriz + relação das melhorias', Icon: FileText },
  { format: 'png', label: 'PNG', hint: 'Imagem da matriz', Icon: FileImage },
]

export function ExportMenu({ onExport, exporting }: { onExport: (f: ExportFormat) => void; exporting: ExportFormat | null }) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const close = (e: MouseEvent | KeyboardEvent) => {
      if (e instanceof KeyboardEvent ? e.key === 'Escape' : !ref.current?.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', close)
    document.addEventListener('keydown', close)
    return () => {
      document.removeEventListener('mousedown', close)
      document.removeEventListener('keydown', close)
    }
  }, [open])

  return (
    <div className="menu" ref={ref}>
      <button
        type="button"
        className="btn btn-ghost btn-icon-text"
        onClick={() => setOpen(!open)}
        aria-haspopup="menu"
        aria-expanded={open}
        disabled={exporting !== null}
        data-testid="export-toggle"
      >
        {exporting ? <LoaderCircle size={16} className="spin" /> : <Download size={16} />}
        <span className="btn-label">{exporting ? 'Exportando…' : 'Exportar'}</span>
        <ChevronDown size={14} />
      </button>
      {open && (
        <div className="menu-list" role="menu">
          {OPTIONS.map(({ format, label, hint, Icon }) => (
            <button
              key={format}
              type="button"
              role="menuitem"
              className="menu-item"
              onClick={() => {
                setOpen(false)
                onExport(format)
              }}
              data-testid={`export-${format}`}
            >
              <Icon size={16} />
              <span>
                <strong>{label}</strong>
                <small>{hint}</small>
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
