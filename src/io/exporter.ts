import { levelsOf } from '../domain/quadrants'
import type { Improvement } from '../domain/types'
import { triggerDownload } from './importer'

function stamp(): string {
  const d = new Date()
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}_${pad(d.getHours())}${pad(d.getMinutes())}`
}

/** Ordena por nome, com as não classificadas por último (sem interpretar os quadrantes). */
export function sortForReport(items: Improvement[]): Improvement[] {
  return [...items].sort(
    (a, b) => Number(!a.position) - Number(!b.position) || a.name.localeCompare(b.name, 'pt-BR'),
  )
}

export function reportRow(item: Improvement) {
  const { impact, effort } = levelsOf(item)
  return {
    name: item.name,
    process: item.process,
    category: item.category,
    impact: impact ?? '—',
    effort: effort ?? '—',
    status: item.position ? 'Classificada' : 'Não classificada',
    description: item.description,
    notes: item.notes,
  }
}

export async function exportExcel(items: Improvement[]): Promise<void> {
  const { default: writeXlsxFile } = await import('write-excel-file/browser')
  const headers = [
    'Melhoria',
    'Processo',
    'Categoria',
    'Impacto',
    'Esforço',
    'Situação',
    'Descrição',
    'Observações',
  ]
  const headerRow = headers.map((value) => ({
    value,
    fontWeight: 'bold' as const,
    backgroundColor: '#1F2A44',
    textColor: '#FFFFFF',
  }))
  const rows = sortForReport(items).map((item) => {
    const r = reportRow(item)
    return [r.name, r.process, r.category, r.impact, r.effort, r.status, r.description, r.notes].map(
      (value) => ({ value, type: String, wrap: true }),
    )
  })
  await writeXlsxFile([headerRow, ...rows], {
    sheet: 'Matriz',
    columns: [{ width: 40 }, { width: 26 }, { width: 34 }, { width: 10 }, { width: 10 }, { width: 18 }, { width: 50 }, { width: 40 }],
    stickyRowsCount: 1,
  }).toFile(`matriz-impacto-esforco_${stamp()}.xlsx`)
}

async function renderImage(node: HTMLElement, format: 'png' | 'jpeg' = 'png'): Promise<string> {
  const { toPng, toJpeg } = await import('html-to-image')
  const options = { pixelRatio: 2, backgroundColor: '#ffffff', cacheBust: true }
  // JPEG mantém o PDF leve; PNG preserva nitidez máxima na exportação de imagem
  return format === 'png' ? toPng(node, options) : toJpeg(node, { ...options, quality: 0.92 })
}

export async function exportPng(node: HTMLElement): Promise<void> {
  const dataUrl = await renderImage(node)
  const blob = await (await fetch(dataUrl)).blob()
  triggerDownload(blob, `matriz-impacto-esforco_${stamp()}.png`)
}

export async function exportPdf(node: HTMLElement, items: Improvement[]): Promise<void> {
  const [{ jsPDF }, { autoTable }] = await Promise.all([import('jspdf'), import('jspdf-autotable')])
  const dataUrl = await renderImage(node, 'jpeg')
  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' })
  const pageW = doc.internal.pageSize.getWidth()
  const pageH = doc.internal.pageSize.getHeight()
  const margin = 10

  // Página 1: a matriz, ajustada à página mantendo a proporção
  const img = new Image()
  img.src = dataUrl
  await img.decode()
  const maxW = pageW - margin * 2
  const maxH = pageH - margin * 2
  const ratio = Math.min(maxW / img.width, maxH / img.height)
  const w = img.width * ratio
  const h = img.height * ratio
  doc.addImage(dataUrl, 'JPEG', (pageW - w) / 2, (pageH - h) / 2, w, h)

  // Página 2+: relação detalhada
  doc.addPage()
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(13)
  doc.setTextColor(31, 42, 68)
  doc.text('Relação das melhorias', margin, 16)
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(9)
  doc.setTextColor(100, 110, 125)
  doc.text(`Gerado em ${new Date().toLocaleString('pt-BR')}`, margin, 21)
  autoTable(doc, {
    startY: 26,
    margin: { left: margin, right: margin },
    head: [['Melhoria', 'Processo', 'Categoria', 'Impacto', 'Esforço', 'Situação']],
    body: sortForReport(items).map((i) => {
      const r = reportRow(i)
      return [r.name, r.process, r.category, r.impact, r.effort, r.status]
    }),
    styles: { fontSize: 8.5, cellPadding: 2.2, textColor: [40, 48, 62], lineColor: [226, 230, 236], lineWidth: 0.2 },
    headStyles: { fillColor: [31, 42, 68], textColor: 255, fontStyle: 'bold' },
    alternateRowStyles: { fillColor: [247, 248, 250] },
    columnStyles: { 0: { cellWidth: 72 }, 2: { cellWidth: 58 } },
  })
  doc.save(`matriz-impacto-esforco_${stamp()}.pdf`)
}

export function exportBackup(data: unknown): void {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
  triggerDownload(blob, `matriz-backup_${stamp()}.json`)
}
