import { useCallback, useEffect, useReducer, useRef, useState } from 'react'
import { createSeedData } from '../domain/seed'
import type { MatrixData } from '../domain/types'
import type { MatrixRepository } from '../storage'
import { historyReducer, type MatrixAction } from './matrixReducer'

export type SaveStatus = 'idle' | 'saving' | 'saved' | 'error'

const EMPTY: MatrixData = { version: 2, items: [] }
const AUTOSAVE_DELAY = 400

export function useMatrixStore(repository: MatrixRepository) {
  const [history, dispatchHistory] = useReducer(historyReducer, {
    present: EMPTY,
    past: [],
    future: [],
  })
  const [loaded, setLoaded] = useState(false)
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle')
  const [lastSavedAt, setLastSavedAt] = useState<Date | null>(null)
  const dataRef = useRef(history.present)
  dataRef.current = history.present

  useEffect(() => {
    let cancelled = false
    repository.load().then((data) => {
      if (cancelled) return
      dispatchHistory({ type: 'load', data: data ?? createSeedData() })
      setLoaded(true)
    })
    return () => {
      cancelled = true
    }
  }, [repository])

  const persist = useCallback(
    async (data: MatrixData) => {
      setSaveStatus('saving')
      try {
        await repository.save(data)
        setSaveStatus('saved')
        setLastSavedAt(new Date())
        return true
      } catch {
        setSaveStatus('error')
        return false
      }
    },
    [repository],
  )

  // Autosave: toda alteração do estado é gravada após um pequeno intervalo.
  useEffect(() => {
    if (!loaded) return
    const timer = window.setTimeout(() => void persist(history.present), AUTOSAVE_DELAY)
    return () => window.clearTimeout(timer)
  }, [history.present, loaded, persist])

  // Garante a gravação ao fechar a aba antes do fim do intervalo do autosave.
  useEffect(() => {
    if (!loaded) return
    const flush = () => (repository.saveSync ? repository.saveSync(dataRef.current) : void repository.save(dataRef.current))
    window.addEventListener('beforeunload', flush)
    return () => window.removeEventListener('beforeunload', flush)
  }, [loaded, repository])

  const dispatch = useCallback((action: MatrixAction) => dispatchHistory({ type: 'apply', action }), [])
  const undo = useCallback(() => dispatchHistory({ type: 'undo' }), [])
  const redo = useCallback(() => dispatchHistory({ type: 'redo' }), [])
  const saveNow = useCallback(() => persist(dataRef.current), [persist])

  return {
    data: history.present,
    loaded,
    dispatch,
    undo,
    redo,
    canUndo: history.past.length > 0,
    canRedo: history.future.length > 0,
    undoLabel: history.past[history.past.length - 1]?.label ?? null,
    redoLabel: history.future[0]?.label ?? null,
    saveNow,
    saveStatus,
    lastSavedAt,
  }
}

export type MatrixStore = ReturnType<typeof useMatrixStore>
