import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  base: process.env.GITHUB_PAGES === 'true' ? '/rogerlike/' : '/',
  plugins: [vue()],
  server: {
    port: 5173,
    strictPort: true,
    watch: {
      // 忽略编辑工具产生的临时目录/临时文件，避免 watch 踩到 EBUSY 而崩溃。
      ignored: ['**/.*.tmpdir/**', '**/*.tmp', '**/*~', '**/.#*'],
    },
  },
})
