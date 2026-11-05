<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue';
import { storeToRefs } from 'pinia';
import { useRoute, useRouter } from 'vue-router';
import { useBaseinfoStore } from '@/store/base';
import { name_category_id, to_second_level_id } from '@/utils/category';
import { CATEGORY_NAMES } from '@/utils/categoryConfig';

const baseinfo_store = useBaseinfoStore();
const { categories } = storeToRefs(baseinfo_store);
// 文章只挂二级分类：名称命中一级分类（如"新闻动态"）时取其第一个子分类，否则列表页会按一级 id 查不到文章
const news_category_id = computed(() =>
    to_second_level_id(categories.value, name_category_id(categories.value, CATEGORY_NAMES.news)));

// —— 导航栏快捷搜索：只负责跳转到站内搜索页，具体检索与高亮在 Search 页 ——
const router = useRouter();
const route = useRoute();
const search_keyword = ref('');
const mobile_open = ref(false);
const scrolled = ref(false);

const submit_search = () => {
    const keyword = search_keyword.value.trim();
    // 空关键词也进入搜索页（由页面给出输入引导），按钮始终可用，避免灰态被误认为不可用
    router.push({ name: 'Search', query: keyword ? { keyword } : {} });
    mobile_open.value = false;
};

// 移动端抽屉：切换路由后自动收起，避免遮住新页面
watch(() => route.fullPath, () => { mobile_open.value = false; });

// 滚动后给导航条加一层描边阴影，让“吸顶”状态有明确边界
const handle_scroll = () => { scrolled.value = window.scrollY > 8; };

onMounted(() => {
    // 导航栏在所有前台页面常驻，由此统一拉取分类树（store 内部有空缓存判断，不会重复请求）
    baseinfo_store.checkBaseinfo();
    handle_scroll();
    window.addEventListener('scroll', handle_scroll, { passive: true });
});

onBeforeUnmount(() => {
    window.removeEventListener('scroll', handle_scroll);
});
</script>

<template>
    <header class="sticky top-0 z-40">
        <!-- 顶部条：单位归属与快捷入口，给门户一个“抬头” -->
        <div class="hidden border-b border-white/10 bg-neutral text-neutral-content lg:block">
            <div class="page-container flex h-9 items-center justify-between text-xs">
                <p class="flex items-center gap-2 text-neutral-content/70">
                    <span class="inline-block size-1.5 rounded-full bg-accent"></span>
                    芜湖市鸠江区沈巷镇水利站 · 防汛抗旱 · 灌溉排涝
                </p>
                <div class="flex items-center gap-5 text-neutral-content/70">
                    <RouterLink :to="{ name: 'Search' }" class="link-transition hover:text-white">站内搜索</RouterLink>
                    <span class="h-3 w-px bg-white/15" aria-hidden="true"></span>
                    <RouterLink :to="{ name: 'AdminLogin' }" class="link-transition hover:text-white">管理入口</RouterLink>
                </div>
            </div>
        </div>

        <!-- 主导航 -->
        <div class="border-b bg-base-100/85 backdrop-blur-md transition-shadow duration-300"
            :class="scrolled ? 'border-base-300 shadow-[0_8px_24px_-18px_rgba(15,27,42,0.45)]' : 'border-transparent'">
            <div class="page-container flex h-16 items-center justify-between gap-6 lg:h-[4.5rem]">
                <!-- 品牌区 -->
                <RouterLink :to="{ name: 'Home' }" class="group flex shrink-0 items-center gap-3"
                    aria-label="返回首页">
                    <img src="/icon/water-logo.svg" class="h-9 w-auto transition-transform duration-300 group-hover:scale-105"
                        alt="沈巷镇水利站标识" />
                    <img src="/icon/logo-text.svg" class="hidden h-[1.35rem] w-auto sm:block" alt="沈巷镇水利站" />
                    <span class="text-[0.95rem] font-semibold tracking-tight text-base-content sm:hidden">沈巷镇水利站</span>
                </RouterLink>

                <!-- 桌面导航 -->
                <nav class="hidden items-center md:flex" aria-label="主导航">
                    <ul class="flex items-center gap-1">
                        <li>
                            <RouterLink :to="{ name: 'Home' }" class="nav-link">
                                网站首页
                            </RouterLink>
                        </li>
                        <li>
                            <RouterLink :to="{ name: 'ArticleList', query: { category: news_category_id, page: 1 } }"
                                class="nav-link">
                                新闻列表
                            </RouterLink>
                        </li>
                        <li>
                            <RouterLink :to="{ name: 'About' }" class="nav-link">
                                关于我们
                            </RouterLink>
                        </li>
                    </ul>
                </nav>

                <!-- 右侧操作区 -->
                <div class="flex items-center gap-2">
                    <form role="search" class="hidden items-center xl:flex" @submit.prevent="submit_search">
                        <label
                            class="flex h-9 w-56 items-center gap-2 rounded-full border border-base-300 bg-base-200/70 px-3 text-sm link-transition focus-within:border-primary/40 focus-within:bg-base-100 focus-within:shadow-[0_0_0_3px_rgba(18,94,143,0.10)]">
                            <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none"
                                class="shrink-0 text-base-content/55" aria-hidden="true">
                                <circle cx="10.5" cy="10.5" r="6.5" stroke="currentColor" stroke-width="1.8"></circle>
                                <path d="M15.5 15.5L21 21" stroke="currentColor" stroke-width="1.8"
                                    stroke-linecap="round"></path>
                            </svg>
                            <input v-model="search_keyword" type="search" class="min-w-0 grow bg-transparent text-[0.8125rem]"
                                maxlength="50" autocomplete="off" placeholder="搜索标题 / 正文"
                                aria-label="站内搜索关键词" />
                        </label>
                    </form>

                    <RouterLink :to="{ name: 'Search' }"
                        class="btn btn-ghost btn-sm btn-circle hidden text-base-content/70 hover:text-primary lg:inline-flex xl:hidden"
                        aria-label="站内搜索" title="站内搜索">
                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none"
                            aria-hidden="true">
                            <circle cx="10.5" cy="10.5" r="6.5" stroke="currentColor" stroke-width="1.8"></circle>
                            <path d="M15.5 15.5L21 21" stroke="currentColor" stroke-width="1.8"
                                stroke-linecap="round"></path>
                        </svg>
                    </RouterLink>

                    <!-- 移动端菜单开关 -->
                    <button type="button" class="btn btn-ghost btn-sm btn-circle md:hidden" aria-label="打开导航菜单"
                        :aria-expanded="mobile_open" aria-controls="mobile-nav" @click="mobile_open = !mobile_open">
                        <svg v-if="!mobile_open" xmlns="http://www.w3.org/2000/svg" width="20" height="20"
                            viewBox="0 0 24 24" fill="none" aria-hidden="true">
                            <path d="M4 7h16M4 12h16M4 17h16" stroke="currentColor" stroke-width="1.8"
                                stroke-linecap="round"></path>
                        </svg>
                        <svg v-else xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24"
                            fill="none" aria-hidden="true">
                            <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" stroke-width="1.8"
                                stroke-linecap="round"></path>
                        </svg>
                    </button>
                </div>
            </div>

            <!-- 移动端抽屉 -->
            <Transition name="fade">
                <div v-show="mobile_open" id="mobile-nav" class="border-t border-base-300 bg-base-100 md:hidden">
                    <div class="page-container py-4">
                        <form role="search" class="mb-3 flex items-center gap-2" @submit.prevent="submit_search">
                            <label class="input input-sm flex grow items-center gap-2 border-base-300 bg-base-200/60">
                                <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24"
                                    fill="none" class="shrink-0 text-base-content/55" aria-hidden="true">
                                    <circle cx="10.5" cy="10.5" r="6.5" stroke="currentColor" stroke-width="1.8"></circle>
                                    <path d="M15.5 15.5L21 21" stroke="currentColor" stroke-width="1.8"
                                        stroke-linecap="round"></path>
                                </svg>
                                <input v-model="search_keyword" type="search" class="grow bg-transparent" maxlength="50"
                                    autocomplete="off" placeholder="搜索标题 / 正文" aria-label="站内搜索关键词" />
                            </label>
                            <button type="submit" class="btn btn-primary btn-sm shrink-0">搜索</button>
                        </form>
                        <nav aria-label="移动端导航">
                            <ul class="divide-y divide-base-300">
                                <li>
                                    <RouterLink :to="{ name: 'Home' }" class="mobile-link">
                                        <span>网站首页</span>
                                        <span class="text-xs text-base-content/50">Home</span>
                                    </RouterLink>
                                </li>
                                <li>
                                    <RouterLink
                                        :to="{ name: 'ArticleList', query: { category: news_category_id, page: 1 } }"
                                        class="mobile-link">
                                        <span>新闻列表</span>
                                        <span class="text-xs text-base-content/50">News</span>
                                    </RouterLink>
                                </li>
                                <li>
                                    <RouterLink :to="{ name: 'About' }" class="mobile-link">
                                        <span>关于我们</span>
                                        <span class="text-xs text-base-content/50">About</span>
                                    </RouterLink>
                                </li>
                            </ul>
                        </nav>
                    </div>
                </div>
            </Transition>
        </div>
    </header>
</template>

<style scoped>
/* 导航项：hover 时底部出现细线，当前页常亮；比给每个 <li> 加背景更轻 */
.nav-link {
    position: relative;
    display: inline-flex;
    align-items: center;
    padding: 0.5rem 0.875rem;
    font-size: 0.9375rem;
    color: color-mix(in oklab, var(--color-base-content) 68%, transparent);
}

.nav-link::after {
    content: '';
    position: absolute;
    left: 0.875rem;
    right: 0.875rem;
    bottom: 0.15rem;
    height: 2px;
    border-radius: 999px;
    background-color: var(--color-primary);
    transform: scaleX(0);
    transform-origin: center;
    transition: transform 240ms cubic-bezier(0.22, 1, 0.36, 1);
}

.nav-link:hover {
    color: var(--color-primary);
}

.nav-link:hover::after,
.nav-link[aria-current='page']::after {
    transform: scaleX(1);
}

.nav-link[aria-current='page'] {
    color: var(--color-primary);
    font-weight: 600;
}

.mobile-link {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0.85rem 0.15rem;
    font-size: 0.9375rem;
    color: var(--color-base-content);
}

.mobile-link[aria-current='page'] {
    color: var(--color-primary);
    font-weight: 600;
}
</style>
