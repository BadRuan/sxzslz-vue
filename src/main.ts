import { createApp } from 'vue'
import App from '@/App.vue'
import { router } from '@/router.ts'
import { createPinia } from 'pinia'
import './style.css'
import 'github-markdown-css/github-markdown.css'

const pinia = createPinia()

createApp(App)
.use(router)
.use(pinia)
.mount('#app')
