import { forwardRef } from 'react'
import type { Improvement } from '../../domain/types'
import { CategoryIcon } from '../common/CategoryIcon'
import { cardTopLeft } from './geometry'
import { MatrixFrame } from './Matrix'
import { QuadrantLayer } from './QuadrantLayer'

export const EXPORT_BOARD = { width: 1360, height: 800 }
/** Na exportação o card é mais alto para mostrar também a categoria. */
const EXPORT_CARD_H = 112

/** Versão estática e de tamanho fixo da matriz, renderizada fora da tela para gerar PNG/PDF. */
export const ExportStage = forwardRef<HTMLDivElement, { items: Improvement[] }>(function ExportStage({ items }, ref) {
  const placed = items.filter((i) => i.position)
  const unclassified = items.length - placed.length

  return (
    <div className="export-stage" aria-hidden="true">
      <div ref={ref} className="export-sheet">
        <header className="export-header">
          <div>
            <div className="export-title">Matriz de Priorização de Melhorias</div>
            <div className="export-subtitle">Impacto x Esforço</div>
          </div>
          <div className="export-meta">
            <div>Gerado em {new Date().toLocaleString('pt-BR', { dateStyle: 'long', timeStyle: 'short' })}</div>
            <div>
              {items.length} melhorias · {placed.length} classificadas · {unclassified} não classificadas
            </div>
          </div>
        </header>
        <MatrixFrame>
          <div className="board" style={{ width: EXPORT_BOARD.width, height: EXPORT_BOARD.height }}>
            <QuadrantLayer />
            <div className="card-layer">
              {placed.map((item) => {
                const p = cardTopLeft(item.position!, EXPORT_BOARD, EXPORT_CARD_H)
                return (
                  <div
                    key={item.id}
                    className="m-card m-card-export"
                    style={{ transform: `translate(${p.x}px, ${p.y}px)`, height: EXPORT_CARD_H }}
                  >
                    <span className="m-card-icon">
                      <CategoryIcon category={item.category} size={13} />
                    </span>
                    <div className="m-card-content">
                      <div className="m-card-title">{item.name}</div>
                      <div className="m-card-process">{item.process || '—'}</div>
                      <div className="m-card-category">{item.category}</div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </MatrixFrame>
      </div>
    </div>
  )
})
