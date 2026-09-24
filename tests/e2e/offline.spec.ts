import { chromium, expect, test, type BrowserContext } from '@playwright/test'
import { existsSync, mkdtempSync, readFileSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'
import { pathToFileURL } from 'node:url'
import { boardPoint, drag, kpi, matrixCard, sideCard } from './helpers'

const OFFLINE_FILE = resolve('offline/matriz-impacto-esforco.html')
const APP_URL = pathToFileURL(OFFLINE_FILE).href

/**
 * Abre o arquivo offline num navegador sem rede. Qualquer tentativa de acesso
 * que não seja ao próprio arquivo é bloqueada e registrada.
 */
async function openOffline(userDataDir: string, externalRequests: string[]) {
  const context = await chromium.launchPersistentContext(userDataDir, {
    offline: true,
    acceptDownloads: true,
    viewport: { width: 1440, height: 900 },
  })
  await context.route('**/*', (route) => {
    const url = route.request().url()
    if (url.startsWith('file:') || url.startsWith('data:') || url.startsWith('blob:')) return route.continue()
    externalRequests.push(url)
    return route.abort('internetdisconnected')
  })
  const page = context.pages()[0] ?? (await context.newPage())
  const errors: string[] = []
  page.on('pageerror', (e) => errors.push(e.message))
  await page.goto(APP_URL)
  await expect(page.getByTestId('board')).toBeVisible()
  return { context, page, errors }
}

test.describe('funcionamento offline (arquivo local, sem internet)', () => {
  let userDataDir: string
  let context: BrowserContext | undefined

  test.beforeAll(() => {
    if (!existsSync(OFFLINE_FILE)) throw new Error('Gere o arquivo offline antes: npm run build:offline')
  })
  test.beforeEach(() => {
    userDataDir = mkdtempSync(join(tmpdir(), 'matriz-offline-'))
  })
  test.afterEach(async () => {
    await context?.close()
    rmSync(userDataDir, { recursive: true, force: true })
  })

  test('abre, cria, edita, move, salva, fecha, reabre e exporta PDF sem rede', async () => {
    test.setTimeout(90_000)
    const external: string[] = []
    let session = await openOffline(userDataDir, external)
    context = session.context
    let { page } = session

    // 1. abre com os dados de exemplo
    await expect(kpi(page, 'total')).toHaveText('8')

    // 2. cria
    await page.getByTestId('add-improvement').click()
    await page.getByTestId('field-name').fill('Melhoria offline')
    await page.getByTestId('field-process').fill('Processo local')
    await page.getByTestId('field-category').selectOption('Recursos Tecnológicos')
    await page.getByTestId('form-submit').click()
    await expect(sideCard(page, 'Melhoria offline')).toBeVisible()

    // 3. edita
    await sideCard(page, 'Melhoria offline').click()
    await page.getByTestId('details-edit').click()
    await page.getByTestId('field-name').fill('Melhoria offline editada')
    await page.getByTestId('field-category').selectOption('Outros')
    await page.getByTestId('form-submit').click()
    await page.keyboard.press('Escape')
    await expect(sideCard(page, 'Melhoria offline editada')).toContainText('Categoria: Outros')

    // 4. arrasta para a matriz e move entre quadrantes
    await drag(page, sideCard(page, 'Melhoria offline editada'), await boardPoint(page, 'low-impact-low-effort'))
    await expect(matrixCard(page, 'Melhoria offline editada')).toHaveAttribute('data-quadrant', 'low-impact-low-effort')
    await drag(page, matrixCard(page, 'Melhoria offline editada'), await boardPoint(page, 'high-impact-high-effort'))
    await expect(matrixCard(page, 'Melhoria offline editada')).toHaveAttribute('data-quadrant', 'high-impact-high-effort')

    // 5. exclui uma melhoria de exemplo
    await sideCard(page, 'Padronizar formulário').click()
    await page.getByTestId('details-delete').click()
    await page.getByTestId('confirm-dialog').getByRole('button', { name: 'Excluir' }).click()

    // 6. busca e filtro
    await page.getByTestId('search-input').fill('offline')
    await expect(page.getByTestId('matrix-filter-note')).toContainText('Exibindo 1 de 4')
    await page.getByTestId('clear-filters').click()

    // 7. salva e fecha o navegador
    await page.getByTestId('save').click()
    await expect(page.getByText('Matriz salva com sucesso')).toBeVisible()
    await session.context.close()

    // 8. reabre (ainda sem rede) e confere a persistência
    session = await openOffline(userDataDir, external)
    context = session.context
    page = session.page
    await expect(kpi(page, 'total')).toHaveText('8')
    await expect(matrixCard(page, 'Melhoria offline editada')).toHaveAttribute('data-quadrant', 'high-impact-high-effort')
    await expect(sideCard(page, 'Padronizar formulário')).toHaveCount(0)

    // 9. exporta PDF, Excel e PNG localmente
    for (const format of ['pdf', 'xlsx', 'png'] as const) {
      await page.getByTestId('export-toggle').click()
      const download = page.waitForEvent('download')
      await page.getByTestId(`export-${format}`).click()
      const file = await download
      expect(file.suggestedFilename()).toMatch(new RegExp(`\\.${format}$`))
      const bytes = readFileSync((await file.path())!)
      expect(bytes.length).toBeGreaterThan(1000)
      if (format === 'pdf') expect(bytes.subarray(0, 5).toString()).toBe('%PDF-')
    }

    expect(session.errors).toEqual([])
    expect(external).toEqual([])
  })
})
