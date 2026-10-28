import { createApp } from 'vue'
import App from '@/App.vue'
import { router } from '@/router.ts'
import { createPinia } from 'pinia'
import './style.css'

const pinia = createPinia()

// 先装 pinia 再装 router：路由守卫里会通过 useAuthStore() 读取角色，需要 activePinia 已就绪
createApp(App)
    .use(pinia)
    .use(router)
    .mount('#app')
