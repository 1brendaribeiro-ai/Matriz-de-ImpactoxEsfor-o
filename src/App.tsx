import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { ConfirmDialog } from './components/common/ConfirmDialog'
import { ToastViewport, useToasts } from './components/common/Toasts'
import { MatrixDnd } from './components/dnd/MatrixDnd'
import type { ExportFormat } from './components/layout/ExportMenu'
import { Header } from './components/layout/Header'
import { Indicators } from './components/layout/Indicators'
import { ExportStage } from './components/matrix/ExportStage'
import { Matrix } from './components/matrix/Matrix'
import { DetailsModal } from './components/modals/DetailsModal'
import { ImportModal } from './components/modals/ImportModal'
import { ImprovementFormModal, type PlacementChoice } from './components/modals/ImprovementFormModal'
import { SettingsModal } from './components/modals/SettingsModal'
import { Sidebar } from './components/sidebar/Sidebar'
import { distinctValues, EMPTY_FILTERS, hasActiveFilters, matchesFilters } from './domain/filters'
import { findFreeSpot, quadrantOf, QUADRANTS } from './domain/quadrants'
import { newId } from './domain/id'
import { createSeedData } from './domain/seed'
import type { Filters, Improvement, ImprovementInput, Position, QuadrantId } from './domain/types'
import { exportBackup, exportExcel, exportPdf, exportPng } from './io/exporter'
import { useMatrixStore } from './state/useMatrixStore'
import { repository } from './storage'
import { parseMatrixData } from './storage/localStorageRepository'

type ModalState =
  | { kind: 'form'; itemId?: string }
  | { kind: 'details'; itemId: string }
  | { kind: 'import' }
  | { kind: 'settings' }
  | null

type ConfirmState =
  | { kind: 'delete'; itemId: string }
  | { kind: 'clear' }
  | { kind: 'sample' }
  | null

function isTypingTarget(el: EventTarget | null) {
  const node = el as HTMLElement | null
  return Boolean(node && (node.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(node.tagName)))
}

export default function App() {
  const store = useMatrixStore(repository)
  const { data, dispatch } = store
  const { toasts, show: toast, dismiss } = useToasts()

  const [filters, setFilters] = useState<Filters>(EMPTY_FILTERS)
  const [modal, setModal] = useState<ModalState>(null)
  const [confirm, setConfirm] = useState<ConfirmState>(null)
  const [highlightedId, setHighlightedId] = useState<string | null>(null)
  const [exporting, setExporting] = useState<ExportFormat | null>(null)

  const boardRef = useRef<HTMLDivElement>(null)
  const sidebarRef = useRef<HTMLElement>(null)
  const exportRef = useRef<HTMLDivElement>(null)

  const items = data.items
  const findItem = useCallback((id: string) => items.find((i) => i.id === id), [items])
  const isVisible = useCallback((item: Improvement) => matchesFilters(item, filters), [filters])
  const filtersActive = hasActiveFilters(filters)

  const flash = useCallback((id: string) => {
    setHighlightedId(id)
    window.setTimeout(() => setHighlightedId((cur) => (cur === id ? null : cur)), 1600)
  }, [])

  const undoWithToast = useCallback(() => {
    if (!store.canUndo) return
    const label = store.undoLabel
    store.undo()
    if (label) toast(`Desfeito: ${label}`, { tone: 'info' })
  }, [store, toast])

  const redoWithToast = useCallback(() => {
    if (!store.canRedo) return
    const label = store.redoLabel
    store.redo()
    if (label) toast(`Refeito: ${label}`, { tone: 'info' })
  }, [store, toast])

  // ---- Arrastar e soltar ---------------------------------------------------

  const handleDropOnBoard = useCallback(
    (itemId: string, position: Position, quadrant: QuadrantId) => {
      const item = findItem(itemId)
      if (!item) return
      const before = quadrantOf(item)
      dispatch({ type: 'move', id: itemId, position })
      flash(itemId)
      if (before !== quadrant) {
        const verb = before ? 'movida para' : 'classificada em'
        toast(`“${item.name}” ${verb} ${QUADRANTS[quadrant].title}`, {
          action: { label: 'Desfazer', onClick: store.undo },
        })
      }
    },
    [dispatch, findItem, flash, toast, store.undo],
  )

  const handleDropOnSidebar = useCallback(
    (itemId: string) => {
      const item = findItem(itemId)
      if (!item?.position) return
      dispatch({ type: 'move', id: itemId, position: null })
      toast(`“${item.name}” voltou para não classificadas`, {
        tone: 'info',
        action: { label: 'Desfazer', onClick: store.undo },
      })
    },
    [dispatch, findItem, toast, store.undo],
  )

  // ---- CRUD ----------------------------------------------------------------

  const placementToPosition = (choice: PlacementChoice, current?: Improvement): Position | null | undefined => {
    if (choice === 'none') return current?.position ? null : undefined
    if (current && quadrantOf(current) === choice) return undefined
    return findFreeSpot(choice, items, current?.id)
  }

  const handleSubmitForm = (input: ImprovementInput, placement: PlacementChoice) => {
    if (modal?.kind !== 'form') return
    const current = modal.itemId ? findItem(modal.itemId) : undefined
    if (current) {
      dispatch({ type: 'update', id: current.id, input, position: placementToPosition(placement, current) })
      setModal({ kind: 'details', itemId: current.id })
      toast('Melhoria atualizada')
    } else {
      const id = newId()
      dispatch({ type: 'add', id, input, position: placementToPosition(placement) ?? null })
      setModal(null)
      flash(id)
      toast(
        placement === 'none'
          ? `“${input.name.trim()}” adicionada. Arraste-a para a matriz.`
          : `“${input.name.trim()}” adicionada em ${QUADRANTS[placement].title}`,
      )
    }
  }

  const handleConfirm = () => {
    if (!confirm) return
    if (confirm.kind === 'delete') {
      const item = findItem(confirm.itemId)
      dispatch({ type: 'delete', id: confirm.itemId })
      setModal(null)
      toast(`“${item?.name}” excluída`, { tone: 'info', action: { label: 'Desfazer', onClick: store.undo } })
    } else if (confirm.kind === 'clear') {
      dispatch({ type: 'replaceAll', data: { ...data, items: [] } })
      setModal(null)
      toast('Todas as melhorias foram excluídas', { tone: 'info', action: { label: 'Desfazer', onClick: store.undo } })
    } else {
      dispatch({ type: 'replaceAll', data: createSeedData() })
      setModal(null)
      toast('Dados de exemplo carregados', { action: { label: 'Desfazer', onClick: store.undo } })
    }
    setConfirm(null)
  }

  const handleRestoreBackup = async (file: File) => {
    try {
      const parsed = parseMatrixData(JSON.parse(await file.text()))
      if (!parsed) throw new Error()
      dispatch({ type: 'replaceAll', data: parsed })
      setModal(null)
      toast(`Backup restaurado (${parsed.items.length} melhorias)`, { action: { label: 'Desfazer', onClick: store.undo } })
    } catch {
      toast('Arquivo de backup inválido', { tone: 'error' })
    }
  }

  const handleSave = useCallback(async () => {
    const ok = await store.saveNow()
    toast(ok ? 'Matriz salva com sucesso' : 'Não foi possível salvar', { tone: ok ? 'success' : 'error' })
  }, [store, toast])

  // ---- Exportação ----------------------------------------------------------

  const handleExport = async (format: ExportFormat) => {
    if (items.length === 0) {
      toast('Não há melhorias para exportar', { tone: 'info' })
      return
    }
    if (format === 'xlsx') {
      setExporting(format)
      try {
        await exportExcel(items)
        toast('Planilha Excel gerada')
      } catch {
        toast('Falha ao gerar a planilha', { tone: 'error' })
      } finally {
        setExporting(null)
      }
      return
    }
    // PNG e PDF usam a matriz renderizada fora da tela (ver efeito abaixo)
    setExporting(format)
  }

  useEffect(() => {
    if (exporting !== 'png' && exporting !== 'pdf') return
    let cancelled = false
    const run = async () => {
      await document.fonts.ready
      await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)))
      const node = exportRef.current
      if (!node || cancelled) return
      try {
        if (exporting === 'png') await exportPng(node)
        else await exportPdf(node, items)
        toast(exporting === 'png' ? 'Imagem PNG gerada' : 'PDF gerado')
      } catch {
        toast('Falha ao exportar', { tone: 'error' })
      } finally {
        if (!cancelled) setExporting(null)
      }
    }
    void run()
    return () => {
      cancelled = true
    }
  }, [exporting])

  // ---- Atalhos de teclado ---------------------------------------------------

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (!(e.ctrlKey || e.metaKey)) return
      const key = e.key.toLowerCase()
      if (key === 's') {
        e.preventDefault()
        void handleSave()
        return
      }
      if (modal || confirm || isTypingTarget(e.target)) return
      if (key === 'z' && !e.shiftKey) {
        e.preventDefault()
        undoWithToast()
      } else if (key === 'y' || (key === 'z' && e.shiftKey)) {
        e.preventDefault()
        redoWithToast()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [modal, confirm, handleSave, undoWithToast, redoWithToast])

  // ---- Render --------------------------------------------------------------

  const processes = useMemo(() => distinctValues(items, 'process'), [items])
  const owners = useMemo(() => distinctValues(items, 'owner'), [items])
  const openDetails = useCallback((id: string) => setModal({ kind: 'details', itemId: id }), [])
  const detailsItem = modal?.kind === 'details' ? findItem(modal.itemId) : undefined
  const formItem = modal?.kind === 'form' && modal.itemId ? findItem(modal.itemId) : undefined
  const confirmItem = confirm?.kind === 'delete' ? findItem(confirm.itemId) : undefined

  if (!store.loaded) {
    return <div className="app-loading">Carregando matriz…</div>
  }

  return (
    <div className="app">
      <Header
        canUndo={store.canUndo}
        canRedo={store.canRedo}
        undoLabel={store.undoLabel}
        redoLabel={store.redoLabel}
        saveStatus={store.saveStatus}
        lastSavedAt={store.lastSavedAt}
        exporting={exporting}
        onUndo={undoWithToast}
        onRedo={redoWithToast}
        onSettings={() => setModal({ kind: 'settings' })}
        onSave={handleSave}
        onExport={handleExport}
        onNew={() => setModal({ kind: 'form' })}
      />

      <Indicators items={items} activeStatus={filters.status} onSelectStatus={(status) => setFilters({ ...filters, status })} />

      <MatrixDnd
        items={items}
        boardRef={boardRef}
        sidebarRef={sidebarRef}
        onDropOnBoard={handleDropOnBoard}
        onDropOnSidebar={handleDropOnSidebar}
      >
        <main className="workspace">
          <Sidebar
            ref={sidebarRef}
            items={items}
            categories={data.categories}
            filters={filters}
            isVisible={isVisible}
            onFiltersChange={setFilters}
            onAdd={() => setModal({ kind: 'form' })}
            onImport={() => setModal({ kind: 'import' })}
            onOpen={openDetails}
            highlightedId={highlightedId}
          />
          <Matrix
            items={items}
            isVisible={isVisible}
            filtersActive={filtersActive}
            highlightedId={highlightedId}
            boardRef={boardRef}
            onOpen={openDetails}
          />
        </main>
      </MatrixDnd>

      {modal?.kind === 'form' && (
        <ImprovementFormModal
          item={formItem}
          categories={data.categories}
          processes={processes}
          owners={owners}
          onSubmit={handleSubmitForm}
          onClose={() => setModal(formItem ? { kind: 'details', itemId: formItem.id } : null)}
        />
      )}

      {detailsItem && (
        <DetailsModal
          item={detailsItem}
          onClose={() => setModal(null)}
          onEdit={() => setModal({ kind: 'form', itemId: detailsItem.id })}
          onDelete={() => setConfirm({ kind: 'delete', itemId: detailsItem.id })}
          onUnclassify={() => {
            handleDropOnSidebar(detailsItem.id)
          }}
        />
      )}

      {modal?.kind === 'import' && (
        <ImportModal
          onClose={() => setModal(null)}
          onImport={(inputs) => {
            dispatch({ type: 'import', inputs })
            setModal(null)
            setFilters(EMPTY_FILTERS)
            toast(`${inputs.length} melhoria(s) importada(s) como não classificadas`, {
              action: { label: 'Desfazer', onClick: store.undo },
            })
          }}
        />
      )}

      {modal?.kind === 'settings' && (
        <SettingsModal
          categories={data.categories}
          items={items}
          onAddCategory={(name) => dispatch({ type: 'addCategory', name })}
          onRemoveCategory={(name) => dispatch({ type: 'removeCategory', name })}
          onRestoreSample={() => setConfirm({ kind: 'sample' })}
          onClearAll={() => setConfirm({ kind: 'clear' })}
          onBackup={() => exportBackup(data)}
          onRestoreBackup={handleRestoreBackup}
          onClose={() => setModal(null)}
        />
      )}

      {confirm && (
        <ConfirmDialog
          title={confirm.kind === 'delete' ? 'Excluir melhoria' : confirm.kind === 'clear' ? 'Excluir todas as melhorias' : 'Carregar dados de exemplo'}
          message={
            confirm.kind === 'delete' ? (
              <>
                Tem certeza de que deseja excluir <strong>“{confirmItem?.name}”</strong>? Você poderá desfazer esta ação em
                seguida.
              </>
            ) : confirm.kind === 'clear' ? (
              <>Todas as {items.length} melhorias serão removidas da matriz e do painel. Deseja continuar?</>
            ) : (
              <>Os dados atuais serão substituídos pelas melhorias de exemplo. Deseja continuar?</>
            )
          }
          confirmLabel={confirm.kind === 'sample' ? 'Carregar exemplos' : 'Excluir'}
          danger={confirm.kind !== 'sample'}
          onConfirm={handleConfirm}
          onCancel={() => setConfirm(null)}
        />
      )}

      {(exporting === 'png' || exporting === 'pdf') && <ExportStage ref={exportRef} items={items} />}

      <ToastViewport toasts={toasts} onDismiss={dismiss} />
    </div>
  )
}
