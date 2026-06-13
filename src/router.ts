import { createRouter, createWebHistory } from 'vue-router'

const routes = [
    {
        path: '/',
        component: ()=>import('@/MainLayout.vue'),
        redirect: '/home',
        children: [
            {
                path: '/home',
                name: 'Home',
                component: () => import('@/pages/Home.vue'),
                meta: { title: '首页' }
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
    }
]

export const router = createRouter(
    {
        history: createWebHistory(),
        routes,
    }
)