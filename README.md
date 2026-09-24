# Matriz de Priorização de Melhorias — Impacto x Esforço

Aplicação web para cadastrar oportunidades de melhoria e priorizá-las visualmente, arrastando cada uma para a
**Matriz de Impacto x Esforço**.

**Cadastrar → Arrastar → Posicionar → Priorizar → Analisar**

## Como executar

```bash
npm install
npm run dev        # desenvolvimento em http://localhost:5173
npm run build      # gera a versão de produção em dist/ (arquivos estáticos)
npm run preview    # serve o build
```

O conteúdo de `dist/` pode ser publicado em qualquer servidor de arquivos estáticos.

## Funcionalidades

- **Painel lateral** com as seções recolhíveis *Melhorias não classificadas* e *Melhorias classificadas*
- **Arrastar e soltar** do painel para a matriz, entre quadrantes, dentro do mesmo quadrante e de volta ao painel
  (remove a classificação). O quadrante sob o ponteiro fica destacado com o rótulo **“Soltar aqui”** e uma
  pré-visualização tracejada mostra onde o card vai ficar
- **Classificação automática pela posição**: esquerda/direita = menor/maior esforço; baixo/cima = menor/maior impacto.
  O terço central de cada eixo corresponde a “Médio”
- **Detalhes, edição e exclusão** (com confirmação); o formulário também permite escolher o quadrante sem arrastar
- **Busca** por nome, processo e categoria (sem diferenciar acentos) e **filtros** por processo, categoria,
  responsável e status. Clicar em um indicador do topo filtra pelo status correspondente
- **Indicadores** atualizados em tempo real
- **Desfazer/Refazer** (botões ou Ctrl+Z / Ctrl+Y) e **salvamento automático**; Ctrl+S salva na hora
- **Categorias configuráveis** (Configurações), backup/restauração em JSON e recarga dos dados de exemplo
- **Importação** de CSV (`;` ou `,`, UTF-8 ou Windows-1252) ou Excel `.xlsx` com as colunas
  Melhoria, Descrição, Processo, Categoria, Responsável, Observações. Há um modelo para baixar na tela de importação
- **Exportação** para Excel, PDF (matriz + relação das melhorias) e PNG
- Layout para desktop, notebook e tablet (arraste por toque: segure o card por um instante)

## Arquitetura

```
src/
  domain/        tipos, regras dos quadrantes, filtros, dados de exemplo
  state/         reducer das ações + histórico (desfazer/refazer) e hook com autosave
  storage/       persistência: interface MatrixRepository + implementação em localStorage
  io/            importação (CSV/XLSX) e exportação (Excel/PDF/PNG/JSON)
  components/
    dnd/         controle do arrastar e soltar (dnd-kit)
    matrix/      matriz, quadrantes, geometria e versão de exportação
    cards/       cards do painel, da matriz e pré-visualização do arraste
    sidebar/     painel lateral, busca/filtros e seções recolhíveis
    layout/      cabeçalho, indicadores e menu de exportação
    modals/      formulário, detalhes, importação e configurações
    common/      modal, confirmação, avisos e ícones
  styles/        CSS por área
```

### Trocando o armazenamento por um banco de dados

A aplicação depende apenas da interface `MatrixRepository` (`src/storage/repository.ts`):

```ts
interface MatrixRepository {
  load(): Promise<MatrixData | null>
  save(data: MatrixData): Promise<void>
  clear(): Promise<void>
}
```

Basta criar uma implementação (por exemplo, chamando uma API REST) e trocá-la em `src/storage/index.ts`.

## Testes

```bash
npm test           # testes unitários (regras da matriz, histórico, filtros, importação)
npm run test:e2e   # testes ponta a ponta no navegador (Playwright)
```

Os testes ponta a ponta cobrem: criação, exibição no painel, arraste para os quatro quadrantes, movimentação entre
quadrantes, retorno ao painel, edição, exclusão com confirmação, busca e filtros, indicadores, desfazer/refazer,
persistência após recarregar, importação de CSV, categorias e exportação para Excel/PNG/PDF.
