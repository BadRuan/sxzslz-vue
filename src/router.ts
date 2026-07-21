import { createRouter, createWebHistory, type RouteRecordRaw } from 'vue-router';

const routes: RouteRecordRaw[] = [
    {
        path: '/',
        component: ()=>import('@/MainLayout.vue'),
        redirect: '/home',
        children: [
            {
                path: '/home',
                name: 'Home',
                component: () => import('@/pages/Home/Index.vue'),
                meta: { title: '首页' }
            },
            {
                path: '/about',
                name: 'About',
                component: () => import("@/pages/About/Index.vue")
            },
            {
                path: '/station',
                name: 'Station',
                component: () => import("@/pages/Station/Index.vue")
            },
            {
                path: '/article',
                name: 'Article',
                children: [
                    {
                        path: 'list',
                        name: 'ArticleList',
                        component: () => import('@/pages/Article/List.vue'),
                        meta: { title: '文章列表' }
                    },
                    {
                        path: 'detail/:slug',
                        name: 'ArticleDetail',
                        component: () => import('@/pages/Article/Detail.vue'),
                        meta: { title: '文章详情' }
                    }
                ]
            }
        ]
    },
    {
        path: '/:pathMatch(.*)*',
        name: 'NotFound',
        component: () => import('@/pages/NotFound.vue')
    }
]

export const router = createRouter({
    history: createWebHistory(),
    routes,
    scrollBehavior(to, from, savedPosition) {
        return { top: 0 }
    }
})

router.afterEach((to) => {
    document.title = to.meta.title ? `${to.meta.title} - 沈巷镇水利站` : '沈巷镇水利站'
})
