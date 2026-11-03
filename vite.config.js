import { defineConfig } from 'vite'
export default defineConfig({ build: { rollupOptions: { input: { main: 'index.html', en: 'en/index.html', legal: 'mentions-legales/index.html', legalEn: 'en/legal/index.html' } } } })
