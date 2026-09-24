import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import { viteSingleFile } from 'vite-plugin-singlefile'

/**
 * Build offline: gera um único arquivo HTML com todo o código, estilos, fontes e
 * bibliotecas (PDF, Excel, imagem) embutidos. Basta abrir o arquivo no navegador,
 * sem servidor e sem internet.
 */
export default defineConfig({
  plugins: [react(), viteSingleFile({ removeViteModuleLoader: true })],
  publicDir: false,
  build: {
    outDir: 'offline',
    emptyOutDir: true,
    assetsInlineLimit: Number.MAX_SAFE_INTEGER,
    rollupOptions: { output: { entryFileNames: 'app.js' } },
  },
})
