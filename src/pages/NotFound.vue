<script setup lang="ts">
import { useRouter } from 'vue-router';

const router = useRouter();

/** 用路由返回替代内联 onclick，避免在模板里写全局 history */
const go_back = () => {
    if (window.history.length > 1) router.back();
    else router.push({ name: 'Home' });
};
</script>

<template>
    <main class="flex min-h-screen items-center justify-center bg-base-200 px-4 py-20">
        <div class="w-full max-w-lg text-center">
            <!-- 错误码做主视觉：数字本身即是页面语言 -->
            <p class="num text-[6rem] font-bold leading-none tracking-tighter text-ink/15 sm:text-[8rem]">404</p>

            <div class="mx-auto -mt-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-ink/10 text-ink sm:-mt-8 sm:h-16 sm:w-16">
                <svg class="h-7 w-7 sm:h-8 sm:w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"
                    aria-hidden="true">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.6"
                        d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
                </svg>
            </div>

            <h1 class="mt-6 text-xl font-semibold tracking-tight text-base-content sm:text-2xl">页面走丢了</h1>
            <p class="mx-auto mt-3 max-w-sm text-sm leading-6 text-base-content/60">
                您访问的页面可能已被移除、重命名或暂时不可用。请检查网址是否正确。
            </p>

            <div class="mt-8 flex flex-wrap items-center justify-center gap-3">
                <RouterLink :to="{ name: 'Home' }" class="btn btn-primary btn-main rounded-full px-6">
                    返回首页
                </RouterLink>
                <button type="button" class="btn btn-ghost rounded-full px-6" @click="go_back">
                    返回上页
                </button>
            </div>

            <div class="mt-10 flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-xs text-base-content/50">
                <RouterLink :to="{ name: 'ArticleList' }" class="hover:text-ink">新闻资讯</RouterLink>
                <span class="h-3 w-px bg-base-300" aria-hidden="true"></span>
                <RouterLink :to="{ name: 'Station', query: { index: 0 } }" class="hover:text-ink">泵站概览</RouterLink>
                <span class="h-3 w-px bg-base-300" aria-hidden="true"></span>
                <RouterLink :to="{ name: 'About' }" class="hover:text-ink">关于我们</RouterLink>
            </div>
        </div>
    </main>
</template>
