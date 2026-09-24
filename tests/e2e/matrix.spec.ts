import { expect, test } from '@playwright/test'
import { boardPoint, drag, FORBIDDEN_TERMS, kpi, matrixCard, sideCard, type QuadrantId } from './helpers'

const CATEGORIES = [
  'Modelo de Gestão e Organização',
  'Fluxo de atividades, informações e documentação',
  'Recursos humanos',
  'Recursos Tecnológicos',
  'Outros',
]

test.beforeEach(async ({ page }) => {
  await page.goto('/')
  await page.evaluate(async () => {
    localStorage.clear()
    await new Promise((resolve) => {
      const req = indexedDB.deleteDatabase('matriz-impacto-esforco')
      req.onsuccess = req.onerror = req.onblocked = resolve
    })
  })
  await page.reload()
  await expect(page.getByTestId('board')).toBeVisible()
})

test('carrega os dados de exemplo e os indicadores neutros', async ({ page }) => {
  await expect(kpi(page, 'total')).toHaveText('8')
  await expect(kpi(page, 'unclassified')).toHaveText('5')
  await expect(kpi(page, 'classified')).toHaveText('3')
  await expect(page.locator('.kpi')).toHaveCount(3)
  await expect(page.getByTestId('side-card')).toHaveCount(5)
  await expect(page.getByTestId('matrix-card')).toHaveCount(3)
})

test('matriz com quatro quadrantes, sem nomes, e eixos visíveis', async ({ page }) => {
  await expect(page.getByTestId('quadrant')).toHaveCount(4)
  for (const q of await page.getByTestId('quadrant').all()) {
    await expect(q).toHaveText('')
  }
  const board = page.locator('.matrix-frame').first()
  await expect(board.locator('.axis-y')).toContainText('Impacto')
  await expect(board.locator('.axis-y')).toContainText('Alto')
  await expect(board.locator('.axis-y')).toContainText('Baixo')
  await expect(board.locator('.axis-x')).toContainText('Esforço')
  await expect(board.locator('.axis-x')).toContainText('Alto')
  await expect(board.locator('.axis-x')).toContainText('Baixo')

  // nenhum termo interpretativo em toda a interface, inclusive filtros, detalhes e configurações
  const assertClean = async () => {
    const text = await page.locator('body').innerText()
    for (const term of FORBIDDEN_TERMS) expect(text).not.toMatch(new RegExp(`\\b${term}\\b`, 'i'))
  }
  await assertClean()
  await page.getByTestId('filters-toggle').click()
  const statusOptions = await page.getByTestId('filter-status').locator('option').allTextContents()
  expect(statusOptions).toEqual(['Todos', 'Não classificadas', 'Classificadas'])
  await assertClean()
  await matrixCard(page, 'Automatizar envio de documentos').click()
  await assertClean()
  await page.keyboard.press('Escape')
  await page.getByTestId('open-settings').click()
  await assertClean()
})

test('formulário sem Responsável e com Categoria em lista fechada', async ({ page }) => {
  await page.getByTestId('add-improvement').click()
  const form = page.getByTestId('improvement-form')
  await expect(form).not.toContainText('Responsável')
  await expect(form.getByTestId('field-owner')).toHaveCount(0)
  const labels = await form.locator('.field > span').allTextContents()
  expect(labels.map((l) => l.replace('*', '').trim())).toEqual(['Nome da melhoria', 'Descrição', 'Processo', 'Categoria', 'Observações'])

  const category = form.getByTestId('field-category')
  expect(await category.evaluate((el) => el.tagName)).toBe('SELECT')
  const options = await category.locator('option:not([disabled])').allTextContents()
  expect(options).toEqual(CATEGORIES)

  // categoria obrigatória
  await form.getByTestId('field-name').fill('Sem categoria')
  await page.getByTestId('form-submit').click()
  await expect(form.getByText('Selecione uma categoria.')).toBeVisible()
})

test('cria uma melhoria e ela aparece no painel lateral com processo e categoria', async ({ page }) => {
  await page.getByTestId('add-improvement').click()
  await page.getByTestId('field-name').fill('Automatizar envio de frequência')
  await page.getByTestId('field-description').fill('Enviar a frequência automaticamente')
  await page.getByTestId('field-process').fill('Controle de Frequência')
  await page.getByTestId('field-category').selectOption('Outros')
  await page.getByTestId('field-notes').fill('Teste')
  await page.getByTestId('form-submit').click()

  const card = sideCard(page, 'Automatizar envio de frequência')
  await expect(card).toBeVisible()
  await expect(card).toContainText('Controle de Frequência')
  await expect(card).toContainText('Categoria: Outros')
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
  const quadrants: QuadrantId[] = ['high-impact-low-effort', 'high-impact-high-effort', 'low-impact-low-effort', 'low-impact-high-effort']

  for (let i = 0; i < 4; i++) {
    const q = quadrants[i]
    const quadrant = page.locator(`[data-testid="quadrant"][data-quadrant="${q}"]`)
    await drag(page, sideCard(page, names[i]), await boardPoint(page, q), async () => {
      // destaque do quadrante e rótulo "Soltar aqui" durante o arraste
      await expect(quadrant).toHaveAttribute('data-active', 'true')
      await expect(quadrant.getByText('Soltar aqui')).toBeVisible()
      await expect(page.getByTestId('drop-ghost')).toBeVisible()
    })
    await expect(matrixCard(page, names[i])).toHaveAttribute('data-quadrant', q)
    await expect(sideCard(page, names[i])).toHaveCount(0)
    await expect(kpi(page, 'classified')).toHaveText(String(4 + i))
    // o card fica visualmente dentro do quadrante
    const card = (await matrixCard(page, names[i]).boundingBox())!
    const quad = (await quadrant.boundingBox())!
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
  await expect(matrixCard(page, name)).toHaveAttribute('data-quadrant', 'low-impact-low-effort')
  await drag(page, matrixCard(page, name), await boardPoint(page, 'high-impact-low-effort'))
  await expect(matrixCard(page, name)).toHaveAttribute('data-quadrant', 'high-impact-low-effort')
  // soltar o card não abre os detalhes por engano
  await page.waitForTimeout(300)
  await expect(page.getByTestId('details-modal')).toHaveCount(0)

  // reposiciona dentro do mesmo quadrante
  const before = (await matrixCard(page, name).boundingBox())!
  await drag(page, matrixCard(page, name), { x: before.x + before.width / 2 + 60, y: before.y + before.height / 2 + 50 })
  const after = (await matrixCard(page, name).boundingBox())!
  expect(Math.round(after.x - before.x)).toBeGreaterThan(40)
  await expect(matrixCard(page, name)).toHaveAttribute('data-quadrant', 'high-impact-low-effort')

  await page.waitForTimeout(700)
  await page.reload()
  await expect(matrixCard(page, name)).toHaveAttribute('data-quadrant', 'high-impact-low-effort')
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
  await expect(details.getByTestId('details-status')).toHaveText('Classificada na matriz')
  await expect(details.getByTestId('details-impact')).toHaveText('Alto')
  await expect(details.getByTestId('details-effort')).toHaveText('Baixo')
  await expect(details).toContainText('Controle de Frequência')
  await expect(details).toContainText('Recursos humanos')
  await expect(details).not.toContainText('Responsável')

  await details.getByTestId('details-edit').click()
  await expect(page.getByTestId('field-category')).toHaveValue('Recursos humanos')
  await page.getByTestId('field-name').fill('Padronizar comunicação (editada)')
  await page.getByTestId('field-category').selectOption('Modelo de Gestão e Organização')
  await page.getByTestId('form-submit').click()
  await expect(page.getByTestId('details-modal')).toContainText('Modelo de Gestão e Organização')
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
  await expect(kpi(page, 'classified')).toHaveText('2')
})

test('busca e filtros', async ({ page }) => {
  await page.getByTestId('search-input').fill('documentos')
  await expect(page.getByTestId('side-card')).toHaveCount(1) // Centralizar documentos
  await expect(page.getByTestId('matrix-filter-note')).toContainText('Exibindo 1 de 3')

  await page.getByTestId('search-input').fill('gestao documental') // busca por processo sem acento
  await expect(page.getByTestId('side-card')).toHaveCount(2)

  await page.getByTestId('search-input').fill('tecnologicos') // busca por categoria
  await expect(page.getByTestId('side-card')).toHaveCount(3)

  await page.getByTestId('clear-filters').click()
  await page.getByTestId('filters-toggle').click()
  await expect(page.getByTestId('filter-owner')).toHaveCount(0)
  const categoryOptions = await page.getByTestId('filter-category').locator('option').allTextContents()
  expect(categoryOptions).toEqual(['Todos', ...CATEGORIES])
  await page.getByTestId('filter-category').selectOption('Recursos Tecnológicos')
  await expect(page.getByTestId('side-card')).toHaveCount(3)
  await expect(page.locator('[data-testid="matrix-card"]:not(.is-dimmed)')).toHaveCount(1)

  await page.getByTestId('filter-category').selectOption('')
  await page.getByTestId('filter-process').selectOption('Gestão Documental')
  await page.getByTestId('filter-status').selectOption('unclassified')
  await expect(page.getByTestId('side-card')).toHaveCount(2)
  await expect(page.getByTestId('section-classified').getByTestId('classified-row')).toHaveCount(0)

  // clicar em um indicador filtra por status
  await page.getByTestId('clear-filters').click()
  await page.getByTestId('kpi-classified').click()
  await expect(page.getByTestId('filter-status')).toHaveValue('classified')
  await expect(page.getByTestId('side-card')).toHaveCount(0)
})

test('desfazer e refazer movimentação', async ({ page }) => {
  const name = 'Integrar sistemas'
  await drag(page, sideCard(page, name), await boardPoint(page, 'high-impact-high-effort'))
  await expect(matrixCard(page, name)).toHaveAttribute('data-quadrant', 'high-impact-high-effort')

  await page.getByTestId('undo').click()
  await expect(matrixCard(page, name)).toHaveCount(0)
  await expect(sideCard(page, name)).toBeVisible()

  await page.getByTestId('redo').click()
  await expect(matrixCard(page, name)).toHaveAttribute('data-quadrant', 'high-impact-high-effort')

  await page.keyboard.press('Control+z')
  await expect(sideCard(page, name)).toBeVisible()
})

test('dados permanecem após recarregar a página (IndexedDB)', async ({ page }) => {
  await page.getByTestId('add-improvement').click()
  await page.getByTestId('field-name').fill('Persistir teste')
  await page.getByTestId('field-category').selectOption('Recursos humanos')
  await page.getByTestId('form-submit').click()
  await drag(page, sideCard(page, 'Persistir teste'), await boardPoint(page, 'low-impact-high-effort'))
  await expect(matrixCard(page, 'Persistir teste')).toHaveAttribute('data-quadrant', 'low-impact-high-effort')
  await page.getByTestId('save').click()
  await expect(page.getByText('Matriz salva com sucesso')).toBeVisible()

  // o registro está no IndexedDB
  const stored = await page.evaluate(
    () =>
      new Promise<string[]>((resolve) => {
        const open = indexedDB.open('matriz-impacto-esforco')
        open.onsuccess = () => {
          const get = open.result.transaction('state').objectStore('state').get('current')
          get.onsuccess = () => resolve(get.result.data.items.map((i: { name: string }) => i.name))
        }
      }),
  )
  expect(stored).toContain('Persistir teste')

  await page.reload()
  await expect(matrixCard(page, 'Persistir teste')).toHaveAttribute('data-quadrant', 'low-impact-high-effort')
  await expect(kpi(page, 'total')).toHaveText('9')
})

test('migra dados salvos pela versão anterior', async ({ browser }) => {
  // contexto novo (sem IndexedDB), com os dados gravados pela versão anterior em localStorage
  const context = await browser.newContext()
  await context.addInitScript(() => {
    if (sessionStorage.getItem('legacy-seeded')) return
    sessionStorage.setItem('legacy-seeded', '1')
    localStorage.setItem(
      'matriz-impacto-esforco:data:v1',
      JSON.stringify({
        version: 1,
        categories: ['Pessoas'],
        items: [
          { id: 'a', name: 'Antiga', description: '', process: 'P', category: 'Pessoas', owner: 'Ana', notes: '', position: { x: 0.2, y: 0.8 }, createdAt: '2026-01-01', updatedAt: '2026-01-01' },
        ],
      }),
    )
  })
  const page = await context.newPage()
  await page.goto('/')
  await expect(kpi(page, 'total')).toHaveText('1')
  await matrixCard(page, 'Antiga').click()
  await expect(page.getByTestId('details-modal')).toContainText('Recursos humanos')
  await expect(page.getByTestId('details-modal')).not.toContainText('Ana')
  await context.close()
})

test('importa CSV como não classificadas, sem criar categorias', async ({ page }) => {
  await page.getByTestId('open-import').click()
  const csv =
    'Melhoria;Descrição;Processo;Categoria;Observações\r\nImportada A;desc;Proc X;Recursos humanos;\r\nImportada B;;Proc Y;Categoria Nova;obs\r\n'
  await page.getByTestId('import-file').setInputFiles({ name: 'melhorias.csv', mimeType: 'text/csv', buffer: Buffer.from(csv, 'utf-8') })
  await expect(page.getByTestId('import-preview')).toContainText('2')
  await expect(page.getByTestId('import-unknown-categories')).toBeVisible()
  await page.getByTestId('import-confirm').click()
  await expect(sideCard(page, 'Importada A')).toContainText('Categoria: Recursos humanos')
  await expect(sideCard(page, 'Importada B')).toContainText('Categoria: Outros')
  await expect(kpi(page, 'unclassified')).toHaveText('7')

  await page.getByTestId('filters-toggle').click()
  const categoryOptions = await page.getByTestId('filter-category').locator('option').allTextContents()
  expect(categoryOptions).toEqual(['Todos', ...CATEGORIES])
})

test('exporta Excel, PNG e PDF', async ({ page }) => {
  for (const format of ['xlsx', 'png', 'pdf'] as const) {
    await page.getByTestId('export-toggle').click()
    const download = page.waitForEvent('download')
    await page.getByTestId(`export-${format}`).click()
    const file = await download
    expect(file.suggestedFilename()).toMatch(new RegExp(`\\.${format}$`))
    expect(await file.path()).toBeTruthy()
  }
})
