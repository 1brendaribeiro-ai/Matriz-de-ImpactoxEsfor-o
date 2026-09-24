# Matriz de Priorização de Melhorias — Impacto x Esforço

Aplicação web para cadastrar oportunidades de melhoria e priorizá-las visualmente, arrastando cada uma para a
**Matriz de Impacto x Esforço**.

**Cadastrar → Arrastar → Posicionar → Analisar**

## Uso offline (recomendado)

O arquivo **`offline/matriz-impacto-esforco.html`** é a aplicação completa em um único arquivo: código,
estilos, fontes e bibliotecas de exportação (PDF, Excel e PNG) estão embutidos. Não depende de internet,
servidor ou CDN.

1. Copie o arquivo para o computador (ex.: Área de Trabalho).
2. Dê dois cliques para abrir no navegador (Chrome ou Edge recomendados).
3. Use normalmente. Os dados ficam gravados no próprio dispositivo e continuam lá ao reabrir o arquivo.

Os dados ficam associados ao navegador e ao local do arquivo: abra sempre o mesmo arquivo, no mesmo navegador.
Para levar os dados a outro computador, use **Configurações → Exportar backup (JSON)** e **Restaurar backup**.

Para gerar novamente o arquivo offline a partir do código:

```bash
npm install
npm run build:offline   # gera offline/matriz-impacto-esforco.html e confere que não há recursos externos
```

## Desenvolvimento

```bash
npm run dev        # http://localhost:5173
npm run build      # versão para servidor web em dist/
```

## Funcionalidades

- **Cadastro** com os campos Nome da melhoria, Descrição, Processo, Categoria e Observações
- **Categorias em lista fechada**: Modelo de Gestão e Organização; Fluxo de atividades, informações e
  documentação; Recursos humanos; Recursos Tecnológicos; Outros
- **Painel lateral** com as seções recolhíveis *Melhorias não classificadas* e *Melhorias classificadas*
  (nome, processo e categoria em cada card)
- **Arrastar e soltar** do painel para a matriz, entre quadrantes, dentro do mesmo quadrante e de volta ao painel.
  A área sob o ponteiro fica destacada com **“Soltar aqui”** e uma pré-visualização mostra onde o card vai ficar
- **Matriz neutra**: quatro quadrantes sem títulos; apenas os eixos Impacto (Baixo → Alto) e Esforço (Baixo → Alto).
  A posição do card define impacto e esforço (o terço central de cada eixo corresponde a “Médio”)
- **Detalhes, edição e exclusão** (com confirmação)
- **Busca** por nome, processo e categoria e **filtros** por processo, categoria e situação
- **Indicadores**: total, não classificadas e classificadas (clicar filtra)
- **Desfazer/Refazer** (Ctrl+Z / Ctrl+Y) e **salvamento automático**; Ctrl+S salva na hora
- **Importação** de CSV ou Excel `.xlsx` (colunas Melhoria, Descrição, Processo, Categoria, Observações).
  Categorias fora da lista entram como “Outros”, e o texto original vai para Observações
- **Exportação** para PDF (matriz + relação das melhorias), Excel e PNG, gerada localmente

## Armazenamento

Os dados ficam no dispositivo, no **IndexedDB** do navegador, com uma cópia de segurança em `localStorage`
(garante a gravação ao fechar a janela). Dados salvos por versões anteriores são migrados automaticamente:
o campo Responsável é descartado e as categorias antigas são convertidas para a nova lista.

## Arquitetura

```
src/
  domain/        tipos, regras dos quadrantes, filtros, dados de exemplo
  state/         reducer das ações + histórico (desfazer/refazer) e hook com autosave
  storage/       persistência: interface MatrixRepository, IndexedDB (principal) e migração de dados
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

### Trocando o armazenamento

A aplicação depende apenas da interface `MatrixRepository` (`src/storage/repository.ts`). Para usar outro
mecanismo, crie uma implementação e troque-a em `src/storage/index.ts`.

## Testes

```bash
npm test           # testes unitários (regras da matriz, histórico, filtros, importação)
npm run test:e2e   # testes ponta a ponta no navegador (Playwright)
```

Os testes ponta a ponta cobrem cadastro (sem Responsável, categorias fechadas), matriz sem nomes de quadrantes,
arraste para os quatro quadrantes, movimentação, edição, exclusão, busca, filtros, indicadores,
desfazer/refazer, persistência em IndexedDB, migração de dados antigos, importação e exportação. Um teste
específico abre o arquivo offline **com a rede desligada**: cria, edita, move, exclui, salva, fecha o navegador,
reabre, confere os dados e exporta PDF, Excel e PNG, verificando que nenhuma requisição externa foi feita.
