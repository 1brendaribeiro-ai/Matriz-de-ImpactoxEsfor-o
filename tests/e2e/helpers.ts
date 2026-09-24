import type { Locator, Page } from '@playwright/test'

export type QuadrantId = 'high-impact-low-effort' | 'high-impact-high-effort' | 'low-impact-low-effort' | 'low-impact-high-effort'

/** Ponto relativo (0..1) dentro do tabuleiro para cada quadrante. */
const TARGET: Record<QuadrantId, { fx: number; fy: number }> = {
  'high-impact-low-effort': { fx: 0.25, fy: 0.3 },
  'high-impact-high-effort': { fx: 0.75, fy: 0.3 },
  'low-impact-low-effort': { fx: 0.25, fy: 0.78 },
  'low-impact-high-effort': { fx: 0.75, fy: 0.78 },
}

/** Termos interpretativos que não podem aparecer em nenhuma parte da interface. */
export const FORBIDDEN_TERMS = [
  'Ganhos rápidos',
  'Projetos estratégicos',
  'Melhorias incrementais',
  'Baixa prioridade',
  'Priorizar',
  'Planejar',
  'Avaliar',
  'Reavaliar',
]

export async function boardPoint(page: Page, q: QuadrantId) {
  const box = (await page.getByTestId('board').boundingBox())!
  return { x: box.x + box.width * TARGET[q].fx, y: box.y + box.height * TARGET[q].fy }
}

/** Arraste com o mouse, em vários passos, como um usuário real. */
export async function drag(page: Page, source: Locator, to: { x: number; y: number }, beforeDrop?: () => Promise<void>) {
  await source.scrollIntoViewIfNeeded()
  const box = (await source.boundingBox())!
  const from = { x: box.x + box.width / 2, y: box.y + box.height / 2 }
  await page.mouse.move(from.x, from.y)
  await page.mouse.down()
  await page.mouse.move(from.x + 12, from.y + 6, { steps: 3 })
  await page.mouse.move(to.x, to.y, { steps: 18 })
  if (beforeDrop) await beforeDrop()
  await page.mouse.up()
}

export const sideCard = (page: Page, name: string) => page.getByTestId('side-card').filter({ hasText: name })
export const matrixCard = (page: Page, name: string) => page.getByTestId('matrix-card').filter({ hasText: name })
export const kpi = (page: Page, id: string) => page.getByTestId(`kpi-${id}-value`)
