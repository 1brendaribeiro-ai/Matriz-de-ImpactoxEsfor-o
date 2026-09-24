import { ChevronDown } from 'lucide-react'
import { useId, useState, type ReactNode } from 'react'
import { loadPreference, savePreference } from '../../storage'

interface CollapsibleSectionProps {
  id: string
  title: string
  count: number
  total?: number
  children: ReactNode
  testId?: string
}

export function CollapsibleSection({ id, title, count, total, children, testId }: CollapsibleSectionProps) {
  const [open, setOpen] = useState(() => loadPreference(`section:${id}`, true))
  const contentId = useId()
  const toggle = () => {
    setOpen(!open)
    savePreference(`section:${id}`, !open)
  }

  return (
    <section className={`side-section${open ? ' is-open' : ''}`} data-testid={testId}>
      <button type="button" className="side-section-header" onClick={toggle} aria-expanded={open} aria-controls={contentId}>
        <ChevronDown size={15} className="chevron" />
        <span className="side-section-title">{title}</span>
        <span className="side-section-count" data-testid={testId ? `${testId}-count` : undefined}>
          {total !== undefined && total !== count ? `${count}/${total}` : count}
        </span>
      </button>
      {open && (
        <div id={contentId} className="side-section-body">
          {children}
        </div>
      )}
    </section>
  )
}
