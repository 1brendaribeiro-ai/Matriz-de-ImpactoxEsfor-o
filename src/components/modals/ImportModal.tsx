import { Download, FileSpreadsheet, FileUp, LoaderCircle, TriangleAlert } from 'lucide-react'
import { useRef, useState, type DragEvent } from 'react'
import type { ImprovementInput } from '../../domain/types'
import { downloadTemplate, parseImportFile, type ImportResult } from '../../io/importer'
import { Modal } from '../common/Modal'

interface ImportModalProps {
  onImport: (items: ImprovementInput[]) => void
  onClose: () => void
}

export function ImportModal({ onImport, onClose }: ImportModalProps) {
  const [result, setResult] = useState<ImportResult | null>(null)
  const [fileName, setFileName] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [dragOver, setDragOver] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const handleFile = async (file: File | undefined) => {
    if (!file) return
    setFileName(file.name)
    setError('')
    setResult(null)
    setLoading(true)
    try {
      const parsed = await parseImportFile(file)
      if (parsed.missingNameColumn) {
        setError('Não foi encontrada a coluna "Melhoria" (ou "Nome") na primeira linha do arquivo.')
      } else if (parsed.items.length === 0) {
        setError('Nenhuma melhoria encontrada no arquivo.')
      } else {
        setResult(parsed)
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Não foi possível ler o arquivo.')
    } finally {
      setLoading(false)
    }
  }

  const onDrop = (e: DragEvent) => {
    e.preventDefault()
    setDragOver(false)
    void handleFile(e.dataTransfer.files[0])
  }

  return (
    <Modal
      title="Importar melhorias"
      subtitle="Arquivo CSV ou Excel (.xlsx). As melhorias entram no painel como não classificadas."
      onClose={onClose}
      size="lg"
      testId="import-modal"
      footer={
        <>
          <button type="button" className="btn btn-ghost" onClick={downloadTemplate}>
            <Download size={15} /> Baixar modelo CSV
          </button>
          <span className="spacer" />
          <button type="button" className="btn btn-ghost" onClick={onClose}>
            Cancelar
          </button>
          <button
            type="button"
            className="btn btn-primary"
            disabled={!result}
            onClick={() => result && onImport(result.items)}
            data-testid="import-confirm"
          >
            Importar {result ? result.items.length : ''} melhoria{result && result.items.length === 1 ? '' : 's'}
          </button>
        </>
      }
    >
      <div
        className={`dropzone${dragOver ? ' is-over' : ''}`}
        onDragOver={(e) => {
          e.preventDefault()
          setDragOver(true)
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={onDrop}
        onClick={() => inputRef.current?.click()}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && inputRef.current?.click()}
      >
        {loading ? <LoaderCircle size={26} className="spin" /> : <FileUp size={26} />}
        <strong>{fileName || 'Arraste o arquivo aqui ou clique para selecionar'}</strong>
        <small>Colunas: Melhoria, Descrição, Processo, Categoria, Responsável, Observações</small>
        <input
          ref={inputRef}
          type="file"
          accept=".csv,.xlsx,text/csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
          hidden
          onChange={(e) => {
            void handleFile(e.target.files?.[0])
            e.target.value = ''
          }}
          data-testid="import-file"
        />
      </div>

      {error && (
        <div className="alert alert-error" data-testid="import-error">
          <TriangleAlert size={16} /> {error}
        </div>
      )}

      {result && (
        <div className="import-preview" data-testid="import-preview">
          <div className="import-summary">
            <FileSpreadsheet size={16} />
            <span>
              <strong>{result.items.length}</strong> melhoria(s) prontas para importar
              {result.skipped > 0 && ` · ${result.skipped} linha(s) sem nome serão ignoradas`}
            </span>
          </div>
          <div className="import-columns">Colunas reconhecidas: {result.mappedColumns.join(' · ')}</div>
          <div className="table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Melhoria</th>
                  <th>Processo</th>
                  <th>Categoria</th>
                  <th>Responsável</th>
                </tr>
              </thead>
              <tbody>
                {result.items.slice(0, 8).map((item, idx) => (
                  <tr key={idx}>
                    <td>{item.name}</td>
                    <td>{item.process}</td>
                    <td>{item.category}</td>
                    <td>{item.owner}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {result.items.length > 8 && <small className="muted">… e mais {result.items.length - 8}.</small>}
        </div>
      )}
    </Modal>
  )
}
