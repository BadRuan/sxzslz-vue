import { fileURLToPath, URL } from 'node:url'
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueDevTools from 'vite-plugin-vue-devtools'
import tailwindcss from '@tailwindcss/vite'

/** 第三方依赖按用途拆包：首屏只加载必要 chunk，Markdown/轮播等按需并行加载 */
const vendor_chunks: { test: RegExp, name: string }[] = [
  { test: /[\\/]node_modules[\\/](vue|@vue|vue-router|pinia|vue-demi)[\\/]/, name: 'vue-core' },
  { test: /[\\/]node_modules[\\/](markdown-it|markdown-it-link-attributes|markdown-it-mark|dompurify|github-markdown-css)[\\/]/, name: 'markdown' },
  { test: /[\\/]node_modules[\\/]axios[\\/]/, name: 'http' },
  { test: /[\\/]node_modules[\\/]dayjs[\\/]/, name: 'date' },
  { test: /[\\/]node_modules[\\/](@splidejs|splide)[\\/]/, name: 'carousel' },
  { test: /[\\/]node_modules[\\/]gsap[\\/]/, name: 'animation' },
]

const resolve_manual_chunk = (id: string): string | undefined => {
  for (const { test, name } of vendor_chunks) {
    if (test.test(id)) return name
  }
  if (id.includes('node_modules')) return 'vendor'
  return undefined
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    vue(),
    ...(process.env.NODE_ENV !== 'production' ? [vueDevTools()] : []),
    tailwindcss(),
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    },
  },
  server: {
    // 监听 0.0.0.0：局域网设备可直接用本机 IP 访问开发服务
    host: true,
    port: 5173,
    proxy: {
      '/api/': {
        target: 'http://100.123.19.58:8088/',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, ''),
      },
    },
  },
  preview: {
    host: true,
    port: 4173,
  },
  build: {
    target: 'es2020',
    // 依赖拆包后单 chunk 体积可控，放宽告警阈值避免噪音
    chunkSizeWarningLimit: 900,
    rollupOptions: {
      output: {
        // 分块策略：框架核心 / Markdown 渲染 / 请求库 / 日期 / 轮播 / 动画 独立缓存
        manualChunks: (id) => resolve_manual_chunk(id),
      },
    },
  },
})
