import { createRouter, createWebHistory, type RouteRecordRaw } from 'vue-router';
import { get_token } from '@/utils/token';
import { useAuthStore } from '@/store/auth';

const routes: RouteRecordRaw[] = [
    {
        path: '/',
        component: () => import('@/MainLayout.vue'),
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
            },
            {
                path: '/profile/:id',
                name: 'Profile',
                component: () => import("@/pages/Profile/Index.vue"),
            }
        ]
    },
    {
        path: '/admin/login',
        name: 'AdminLogin',
        component: () => import('@/pages/Admin/Login.vue'),
        meta: { title: '登录' }
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
                meta: { title: '后台概览' }
            },
            {
                path: 'category',
                name: 'AdminCategory',
                component: () => import("@/pages/Admin/CategoryEdit.vue"),
                // 分类管理仅超级管理员：普通账号侧边栏不展示，直接访问也会被重定向
                meta: { title: '分类管理', requires_superuser: true }
            },
            {
                path: 'users',
                name: 'AdminUsers',
                component: () => import("@/pages/Admin/UserAdmin.vue"),
                // 账户管理仅超级管理员：普通账号侧边栏不展示，直接访问也会被重定向
                meta: { title: '账户管理', requires_superuser: true }
            },
            {
                path: 'list',
                name: 'AdminArticleList',
                component: () => import("@/pages/Admin/ArticleList.vue"),
                meta: { title: '文章管理' }
            },
            {
                path: 'photo',
                name: 'AdminPhoto',
                component: () => import('@/pages/Admin/Photo.vue'),
                meta: { title: '照片管理' }
            },
            {
                path: 'document',
                name: 'AdminDocument',
                component: () => import('@/pages/Admin/Document.vue'),
                meta: { title: '文档管理' }
            },
            {
                path: 'password',
                name: 'AdminPassword',
                component: () => import('@/pages/Admin/Password.vue'),
                meta: { title: '修改密码' }
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

/**
 * 后台路由守卫：
 * 1. 未登录 → 登录页（记录 redirect，登录后回跳）；
 * 2. 已登录但用户信息未加载 → 先拉 /auth/me 判断角色；
 * 3. requires_superuser 路由（分类管理）→ 普通账号重定向到概览并提示无权访问。
 * 注意：账号信息因网络/服务端异常拉不到时放行，由页面展示错误与重试，避免误判角色或静默登出。
 */
router.beforeEach(async (to) => {
    if (!to.path.startsWith('/admin') || to.path === '/admin/login') {
        return true
    }

    if (!get_token()) {
        return { name: 'AdminLogin', query: { redirect: to.fullPath } }
    }

    const auth_store = useAuthStore()
    const user = await auth_store.ensure_user()

    // token 无效：fetchMe 已清空本地 token，重新走登录页
    if (!get_token()) {
        return { name: 'AdminLogin', query: { redirect: to.fullPath } }
    }

    // 网络抖动/服务端异常导致角色暂不可知：放行，页面自身提示重试（不按普通账号误判）
    if (user === null) {
        return true
    }

    if (to.meta.requires_superuser && !auth_store.is_superuser) {
        return { name: 'AdminOverview', query: { denied: 'superuser' } }
    }

    return true
})

router.afterEach((to) => {
    document.title = to.meta.title ? `${to.meta.title} - 沈巷镇水利站` : '沈巷镇水利站'
})
