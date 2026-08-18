import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  base: process.env.GITHUB_PAGES === 'true' ? '/rogerlike/' : '/',
  plugins: [vue()],
  server: {
    port: 5173,
    strictPort: true,
  },
})
