import { forwardRef } from 'react'
import { countByQuadrant, quadrantOf } from '../../domain/quadrants'
import type { Improvement } from '../../domain/types'
import { MatrixCardBody } from '../cards/MatrixCard'
import { cardTopLeft } from './geometry'
import { MatrixFrame } from './Matrix'
import { QuadrantLayer } from './QuadrantLayer'

export const EXPORT_BOARD = { width: 1360, height: 800 }

/** Versão estática e de tamanho fixo da matriz, renderizada fora da tela para gerar PNG/PDF. */
export const ExportStage = forwardRef<HTMLDivElement, { items: Improvement[] }>(function ExportStage({ items }, ref) {
  const placed = items.filter((i) => i.position)
  const counts = countByQuadrant(items)
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
            <div>{new Date().toLocaleString('pt-BR', { dateStyle: 'long', timeStyle: 'short' })}</div>
            <div>
              {items.length} melhorias · {placed.length} classificadas · {unclassified} não classificadas
            </div>
          </div>
        </header>
        <MatrixFrame>
          <div className="board" style={{ width: EXPORT_BOARD.width, height: EXPORT_BOARD.height }}>
            <QuadrantLayer counts={counts} />
            <div className="card-layer">
              {placed.map((item) => {
                const p = cardTopLeft(item.position!, EXPORT_BOARD)
                return (
                  <div
                    key={item.id}
                    className={`m-card q-${quadrantOf(item)}`}
                    style={{ transform: `translate(${p.x}px, ${p.y}px)` }}
                  >
                    <MatrixCardBody item={item} />
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
