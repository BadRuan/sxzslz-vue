<script setup lang="ts">
import { computed } from 'vue';
import { storeToRefs } from 'pinia';
import { useBaseinfoStore } from '@/store/base';
import { name_category_id, to_second_level_id } from '@/utils/category';

const baseinfo_store = useBaseinfoStore();
const { categories } = storeToRefs(baseinfo_store);
// 页脚链接不随 CATEGORY_NAMES（首页栏目配置）漂移：保留原有语义，用本地名称数组。
// 名称命中一级分类时取其第一个子分类（文章只挂二级）
const finance_category_id = computed(() => to_second_level_id(categories.value, name_category_id(categories.value, ['财务信息', '财务公开'])));
const notice_category_id = computed(() => to_second_level_id(categories.value, name_category_id(categories.value, ['通知公告'])));
</script>

<template>
    <footer class="bg-slate-50 text-gray-700 border-t border-gray-200">
        <div class="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
            <div class="grid grid-cols-1 gap-8 md:grid-cols-3 lg:gap-12">

                <div>
                    <div class="flex items-center space-x-2 mb-4">
                        <img src="/icon/water-logo.svg" class="h-8 w-8" alt="logo" />
                        <span class="text-lg font-semibold tracking-tight text-gray-900">芜湖市鸠江区沈巷镇水利站</span>
                    </div>
                    <p class="text-sm leading-relaxed">
                        负责辖区内的水资源管理、防汛抗旱、灌溉排涝、<br />
                        水利工程运行与维护等职能。
                    </p>
                </div>

                <div>
                    <h3 class="text-sm font-semibold tracking-tight text-gray-900 mb-4">联系我们</h3>
                    <ul class="space-y-2 text-sm">
                        <li class="flex items-start">
                            <span class="mr-2">📍</span>
                            <span>安徽省芜湖市鸠江区沈巷镇水利站</span>
                        </li>
                        <li class="flex items-center">
                            <span class="mr-2">📞</span>
                            <span>0553-8976603</span>
                        </li>
                        <li class="flex items-center">
                            <span class="mr-2">✉️</span>
                            <span>ruanfm@qq.com</span>
                        </li>
                    </ul>
                </div>

                <div>
                    <h3 class="text-sm font-semibold tracking-tight text-gray-900 mb-4">快速链接</h3>
                    <ul class="grid grid-cols-2 gap-2 text-sm">
                        <li>
                            <RouterLink :to="{ name: 'Home' }" class="hover:text-primary link-transition">网站首页
                            </RouterLink>
                        </li>
                        <li>
                            <RouterLink :to="{ name: 'About' }" class="hover:text-primary link-transition">关于我们</RouterLink>
                        </li>
                        <li>
                            <RouterLink :to="{ name: 'ArticleList', query: { category: finance_category_id } }"
                                class="hover:text-primary link-transition">财务公开</RouterLink>
                        </li>
                        <li>
                            <RouterLink :to="{ name: 'ArticleList', query: { category: notice_category_id } }"
                                class="hover:text-primary link-transition">通知公告</RouterLink>
                        </li>
                        <li><a href="#" class="hover:text-primary link-transition">政策法规</a></li>
                    </ul>
                </div>

            </div>

            <div class="mt-10 border-t border-gray-200 pt-6 flex flex-col sm:flex-row items-center justify-between text-gray-500">

                <p class="text-xs">
                    © 2026 芜湖市鸠江区沈巷镇水利站 版权所有
                </p>

                <div class="mt-4 sm:mt-0 flex items-center space-x-4 text-xs">
                    <a href="#" class="hover:text-primary link-transition">皖ICP备20260101号</a>
                    <span>|</span>
                    <a href="#" class="hover:text-primary link-transition">网站找错</a>
                    <span>|</span>
                    <a href="#" class="hover:text-primary link-transition">隐私声明</a>
                </div>

            </div>
        </div>
    </footer>
</template>