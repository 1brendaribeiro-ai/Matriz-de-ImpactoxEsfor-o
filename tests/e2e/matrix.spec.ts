import { expect, test, type Locator, type Page } from '@playwright/test'

type QuadrantId = 'quick-wins' | 'strategic' | 'incremental' | 'low-priority'

/** Ponto relativo (0..1) dentro do tabuleiro para cada quadrante. */
const TARGET: Record<QuadrantId, { fx: number; fy: number }> = {
  'quick-wins': { fx: 0.25, fy: 0.3 },
  strategic: { fx: 0.75, fy: 0.3 },
  incremental: { fx: 0.25, fy: 0.78 },
  'low-priority': { fx: 0.75, fy: 0.78 },
}

async function boardPoint(page: Page, q: QuadrantId) {
  const box = (await page.getByTestId('board').boundingBox())!
  return { x: box.x + box.width * TARGET[q].fx, y: box.y + box.height * TARGET[q].fy }
}

/** Arraste com o mouse, em vários passos, como um usuário real. */
async function drag(page: Page, source: Locator, to: { x: number; y: number }, beforeDrop?: () => Promise<void>) {
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

const sideCard = (page: Page, name: string) => page.getByTestId('side-card').filter({ hasText: name })
const matrixCard = (page: Page, name: string) => page.getByTestId('matrix-card').filter({ hasText: name })
const kpi = (page: Page, id: string) => page.getByTestId(`kpi-${id}-value`)

test.beforeEach(async ({ page }) => {
  await page.goto('/')
  await page.evaluate(() => localStorage.clear())
  await page.reload()
  await expect(page.getByTestId('board')).toBeVisible()
})

test('carrega os dados de exemplo e os indicadores', async ({ page }) => {
  await expect(kpi(page, 'total')).toHaveText('8')
  await expect(kpi(page, 'unclassified')).toHaveText('5')
  await expect(page.getByTestId('side-card')).toHaveCount(5)
  await expect(page.getByTestId('matrix-card')).toHaveCount(3)
})

test('cria uma melhoria e ela aparece no painel lateral', async ({ page }) => {
  await page.getByTestId('add-improvement').click()
  await page.getByTestId('field-name').fill('Automatizar envio de frequência')
  await page.getByTestId('field-description').fill('Enviar a frequência automaticamente')
  await page.getByTestId('field-process').fill('Controle de Frequência')
  await page.getByTestId('field-category').selectOption('Automação')
  await page.getByTestId('field-owner').fill('Equipe RH')
  await page.getByTestId('field-notes').fill('Teste')
  await page.getByTestId('form-submit').click()

  await expect(sideCard(page, 'Automatizar envio de frequência')).toBeVisible()
  await expect(kpi(page, 'total')).toHaveText('9')
  await expect(kpi(page, 'unclassified')).toHaveText('6')
})

test('valida nome obrigatório', async ({ page }) => {
  await page.getByTestId('add-improvement').click()
  await page.getByTestId('form-submit').click()
  await expect(page.getByText('Informe o nome da melhoria.')).toBeVisible()
})

test('arrasta do painel para cada um dos quatro quadrantes', async ({ page }) => {
  const names = ['Integrar sistemas', 'Criar manual de procedimentos', 'Padronizar formulário', 'Automatizar notificações']
  const quadrants: QuadrantId[] = ['quick-wins', 'strategic', 'incremental', 'low-priority']

  for (let i = 0; i < 4; i++) {
    const q = quadrants[i]
    const before = Number(await kpi(page, q).textContent())
    await drag(page, sideCard(page, names[i]), await boardPoint(page, q), async () => {
      // destaque do quadrante e rótulo "Soltar aqui" durante o arraste
      await expect(page.getByTestId(`quadrant-${q}`)).toHaveAttribute('data-active', 'true')
      await expect(page.getByTestId(`quadrant-${q}`).getByText('Soltar aqui')).toBeVisible()
      await expect(page.getByTestId('drop-ghost')).toBeVisible()
    })
    await expect(matrixCard(page, names[i])).toHaveAttribute('data-quadrant', q)
    await expect(sideCard(page, names[i])).toHaveCount(0)
    await expect(kpi(page, q)).toHaveText(String(before + 1))
    // o card fica visualmente dentro do quadrante
    const card = (await matrixCard(page, names[i]).boundingBox())!
    const quad = (await page.getByTestId(`quadrant-${q}`).boundingBox())!
    expect(card.x).toBeGreaterThanOrEqual(quad.x)
    expect(card.y).toBeGreaterThanOrEqual(quad.y)
    expect(card.x + card.width).toBeLessThanOrEqual(quad.x + quad.width + 1)
    expect(card.y + card.height).toBeLessThanOrEqual(quad.y + quad.height + 1)
  }

  await expect(kpi(page, 'unclassified')).toHaveText('1')
  await expect(page.getByTestId('section-classified').getByTestId('classified-row')).toHaveCount(7)
})

test('move uma melhoria de um quadrante para outro e salva automaticamente', async ({ page }) => {
  const name = 'Criar checklist de conferência'
  await expect(matrixCard(page, name)).toHaveAttribute('data-quadrant', 'incremental')
  await drag(page, matrixCard(page, name), await boardPoint(page, 'quick-wins'))
  await expect(matrixCard(page, name)).toHaveAttribute('data-quadrant', 'quick-wins')
  await expect(kpi(page, 'quick-wins')).toHaveText('2')
  await expect(kpi(page, 'incremental')).toHaveText('0')

  // reposiciona dentro do mesmo quadrante
  const before = (await matrixCard(page, name).boundingBox())!
  await drag(page, matrixCard(page, name), { x: before.x + before.width / 2 + 60, y: before.y + before.height / 2 + 50 })
  const after = (await matrixCard(page, name).boundingBox())!
  expect(Math.round(after.x - before.x)).toBeGreaterThan(40)
  await expect(matrixCard(page, name)).toHaveAttribute('data-quadrant', 'quick-wins')

  await page.waitForTimeout(700)
  await page.reload()
  await expect(matrixCard(page, name)).toHaveAttribute('data-quadrant', 'quick-wins')
})

test('soltar fora da matriz não altera nada; soltar no painel remove da matriz', async ({ page }) => {
  const name = 'Integrar sistemas'
  const header = (await page.locator('.app-header').boundingBox())!
  await drag(page, sideCard(page, name), { x: header.x + 400, y: header.y + 20 })
  await expect(sideCard(page, name)).toBeVisible()
  await expect(kpi(page, 'unclassified')).toHaveText('5')

  const boardName = 'Automatizar envio de documentos'
  const sidebar = (await page.getByTestId('sidebar').boundingBox())!
  await drag(page, matrixCard(page, boardName), { x: sidebar.x + sidebar.width / 2, y: sidebar.y + sidebar.height / 2 }, async () => {
    await expect(page.getByTestId('return-zone')).toBeVisible()
  })
  await expect(matrixCard(page, boardName)).toHaveCount(0)
  await expect(sideCard(page, boardName)).toBeVisible()
  await expect(kpi(page, 'unclassified')).toHaveText('6')
})

test('abre detalhes, edita e exclui uma melhoria', async ({ page }) => {
  const name = 'Padronizar comunicação com o servidor'
  await matrixCard(page, name).click()
  const details = page.getByTestId('details-modal')
  await expect(details).toBeVisible()
  await expect(details.getByTestId('details-quadrant')).toContainText('Ganhos rápidos')
  await expect(details.getByTestId('details-impact')).toHaveText('Alto')
  await expect(details.getByTestId('details-effort')).toHaveText('Baixo')
  await expect(details).toContainText('Controle de Frequência')

  await details.getByTestId('details-edit').click()
  await page.getByTestId('field-name').fill('Padronizar comunicação (editada)')
  await page.getByTestId('field-owner').fill('Novo Responsável')
  await page.getByTestId('form-submit').click()
  await expect(page.getByTestId('details-modal')).toContainText('Novo Responsável')
  await expect(page.getByTestId('details-modal').getByRole('heading')).toHaveText('Padronizar comunicação (editada)')

  await page.getByTestId('details-delete').click()
  await expect(page.getByTestId('confirm-dialog')).toBeVisible()
  await page.getByTestId('confirm-dialog').getByRole('button', { name: 'Cancelar' }).click()
  await expect(matrixCard(page, 'Padronizar comunicação (editada)')).toBeVisible()

  await page.getByTestId('details-delete').click()
  await page.getByTestId('confirm-dialog').getByRole('button', { name: 'Excluir' }).click()
  await expect(page.getByTestId('details-modal')).toHaveCount(0)
  await expect(matrixCard(page, 'Padronizar comunicação (editada)')).toHaveCount(0)
  await expect(kpi(page, 'total')).toHaveText('7')
  await expect(kpi(page, 'quick-wins')).toHaveText('0')
})

test('busca e filtros', async ({ page }) => {
  await page.getByTestId('search-input').fill('documentos')
  await expect(page.getByTestId('side-card')).toHaveCount(1) // Centralizar documentos
  await expect(page.getByTestId('matrix-filter-note')).toContainText('Exibindo 1 de 3')

  await page.getByTestId('search-input').fill('gestao documental') // busca por processo sem acento
  await expect(page.getByTestId('side-card')).toHaveCount(2)

  await page.getByTestId('clear-filters').click()
  await page.getByTestId('filters-toggle').click()
  await page.getByTestId('filter-category').selectOption('Automação')
  await expect(page.getByTestId('side-card')).toHaveCount(1)
  await expect(page.locator('[data-testid="matrix-card"]:not(.is-dimmed)')).toHaveCount(1)

  await page.getByTestId('filter-category').selectOption('')
  await page.getByTestId('filter-owner').selectOption('Ana Souza')
  await expect(page.getByTestId('side-card')).toHaveCount(0)
  await expect(page.getByTestId('section-classified').getByTestId('classified-row')).toHaveCount(2)

  await page.getByTestId('filter-owner').selectOption('')
  await page.getByTestId('filter-process').selectOption('Gestão Documental')
  await page.getByTestId('filter-status').selectOption('unclassified')
  await expect(page.getByTestId('side-card')).toHaveCount(2)
  await expect(page.getByTestId('section-classified').getByTestId('classified-row')).toHaveCount(0)

  // clicar em um indicador filtra por status
  await page.getByTestId('clear-filters').click()
  await page.getByTestId('kpi-strategic').click()
  await expect(page.getByTestId('filter-status')).toHaveValue('strategic')
  await expect(page.getByTestId('side-card')).toHaveCount(0)
})

test('desfazer e refazer movimentação', async ({ page }) => {
  const name = 'Integrar sistemas'
  await drag(page, sideCard(page, name), await boardPoint(page, 'strategic'))
  await expect(matrixCard(page, name)).toHaveAttribute('data-quadrant', 'strategic')

  await page.getByTestId('undo').click()
  await expect(matrixCard(page, name)).toHaveCount(0)
  await expect(sideCard(page, name)).toBeVisible()

  await page.getByTestId('redo').click()
  await expect(matrixCard(page, name)).toHaveAttribute('data-quadrant', 'strategic')

  await page.keyboard.press('Control+z')
  await expect(sideCard(page, name)).toBeVisible()
})

test('dados permanecem após recarregar a página', async ({ page }) => {
  await page.getByTestId('add-improvement').click()
  await page.getByTestId('field-name').fill('Persistir teste')
  await page.getByTestId('form-submit').click()
  await drag(page, sideCard(page, 'Persistir teste'), await boardPoint(page, 'low-priority'))
  await expect(matrixCard(page, 'Persistir teste')).toHaveAttribute('data-quadrant', 'low-priority')
  await page.getByTestId('save').click()
  await expect(page.getByText('Matriz salva com sucesso')).toBeVisible()

  await page.reload()
  await expect(matrixCard(page, 'Persistir teste')).toHaveAttribute('data-quadrant', 'low-priority')
  await expect(kpi(page, 'total')).toHaveText('9')
  await expect(kpi(page, 'low-priority')).toHaveText('1')
})

test('importa CSV como não classificadas', async ({ page }) => {
  await page.getByTestId('open-import').click()
  const csv = 'Melhoria;Descrição;Processo;Categoria;Responsável;Observações\r\nImportada A;desc;Proc X;Governança;Fulano;\r\nImportada B;;Proc Y;Categoria Nova;;obs\r\n'
  await page.getByTestId('import-file').setInputFiles({ name: 'melhorias.csv', mimeType: 'text/csv', buffer: Buffer.from(csv, 'utf-8') })
  await expect(page.getByTestId('import-preview')).toContainText('2')
  await page.getByTestId('import-confirm').click()
  await expect(sideCard(page, 'Importada A')).toBeVisible()
  await expect(sideCard(page, 'Importada B')).toBeVisible()
  await expect(kpi(page, 'unclassified')).toHaveText('7')

  // nova categoria passa a existir nas configurações
  await page.getByTestId('open-settings').click()
  await expect(page.getByTestId('category-list')).toContainText('Categoria Nova')
})

test('adiciona categoria nas configurações', async ({ page }) => {
  await page.getByTestId('open-settings').click()
  await page.getByTestId('settings-category-input').fill('Qualidade')
  await page.getByTestId('settings-category-add').click()
  await expect(page.getByTestId('category-list')).toContainText('Qualidade')
  await page.keyboard.press('Escape')
  await page.getByTestId('add-improvement').click()
  await expect(page.getByTestId('field-category').locator('option', { hasText: 'Qualidade' })).toHaveCount(1)
})

test('exporta Excel, PNG e PDF', async ({ page }) => {
  for (const format of ['xlsx', 'png', 'pdf'] as const) {
    await page.getByTestId('export-toggle').click()
    const download = page.waitForEvent('download')
    await page.getByTestId(`export-${format}`).click()
    const file = await download
    expect(file.suggestedFilename()).toMatch(new RegExp(`\\.${format}$`))
    const path = await file.path()
    expect(path).toBeTruthy()
  }
})
