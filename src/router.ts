import { createRouter, createWebHistory, type RouteRecordRaw } from 'vue-router'
import { useUserStore } from '@/store/user'

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
                path: 'list',
                name: 'ArticleList',
                component: () => import('@/pages/Article/List.vue'),
                meta: { title: '文章列表' }
            },
            {
                path: 'detail',
                name: 'ArticleDetail',
                component: () => import('@/pages/Article/Detail.vue'),
                meta: { title: '文章详情' }
            }
        ]
    },
    {
        path: '/login',
        name: 'Login',
        component: () => import("@/pages/Login.vue")
    },
    {
        path: '/admin',
        name: 'Admin',
        component: () => import("@/pages/Admin/Layout.vue"),
        redirect: '/admin/overview',
        children: [
            {
                path: 'overview',
                name: 'AdminOverview',
                component: () => import("@/pages/Admin/Overview.vue"),
                meta : { title: '后台概览' }
            },
            {
                path: 'category',
                name: 'AdminCategory',
                component: () => import("@/pages/Admin/CategoryEdit.vue"),
                meta: { title: '分类管理' }
            },
            {
                path: 'list',
                name: 'AdminArticleList',
                component: () => import("@/pages/Admin/ArticleList.vue"),
                meta: { title: '新闻列表' }
            },
            {
                path: 'photo',
                name: 'AdminPhoto',
                component: () => import('@/pages/Admin/Photo.vue'),
                meta: { title: '照片管理' }
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

router.beforeEach((to) => {
    const userStore = useUserStore()

    // admin 路由需要登录
    if (to.path.startsWith('/admin') && !userStore.is_logged_in) {
        return { name: 'Login' }
    }

    // 已登录用户访问登录页则跳转后台
    if (to.name === 'Login' && userStore.is_logged_in) {
        return { name: 'AdminOverview' }
    }
})