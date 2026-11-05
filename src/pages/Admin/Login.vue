<script setup lang="ts">
import { computed, ref, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useAuthStore } from '@/store/auth';
import { get_token } from '@/utils/token';

const route = useRoute();
const router = useRouter();
const auth_store = useAuthStore();

const username = ref('');
const password = ref('');
const error_message = ref('');

/**
 * 登录后回跳地址：仅接受后台内部路径（防开放重定向），默认后台概览。
 */
const redirect_target = computed(() => {
    const redirect = route.query.redirect;
    return typeof redirect === 'string' && redirect.startsWith('/admin') && !redirect.startsWith('/admin/login')
        ? redirect
        : '/admin/overview';
});

onMounted(() => {
    // 已登录再进登录页：直接回后台
    if (get_token()) {
        router.replace(redirect_target.value);
    }
});

const submit = async () => {
    error_message.value = '';
    if (!username.value || !password.value) {
        error_message.value = '请输入用户名和密码';
        return;
    }
    try {
        await auth_store.login(username.value, password.value);
        router.replace(redirect_target.value);
    } catch (error: any) {
        error_message.value = error?.message || '登录失败，请稍后重试';
    }
};
</script>

<template>
    <div class="flex min-h-screen bg-base-100">
        <!-- 品牌侧：宽屏独占左半屏，交代「这是谁的后台」，与前台同一视觉语言 -->
        <section
            class="relative hidden w-[52%] flex-col justify-between overflow-hidden bg-neutral p-12 text-neutral-content lg:flex">
            <div class="absolute inset-0 bg-gradient-to-br from-primary/45 via-transparent to-secondary/25" aria-hidden="true"></div>
            <div class="relative flex items-center gap-3">
                <img src="/icon/water-logo.svg" class="h-10 w-10" alt="logo" />
                <span class="text-sm font-medium tracking-wide text-white/90">沈巷镇水利站</span>
            </div>

            <div class="relative max-w-md">
                <p class="text-[0.6875rem] font-medium tracking-[0.18em] text-white/55">CONTENT MANAGEMENT</p>
                <h1 class="mt-5 text-[2rem] font-bold leading-tight tracking-tight text-white">
                    管理后台<br />内容与数据的一站式中枢
                </h1>
                <p class="mt-5 text-sm leading-7 text-white/70">
                    在这里维护新闻公告、站点档案、影像资料与账号权限。所有改动即时发布到门户前台。
                </p>
            </div>

            <ul class="relative flex flex-wrap gap-x-6 gap-y-2 text-xs text-white/55">
                <li>文章与回收站</li>
                <li>分类与账户</li>
                <li>图片与附件</li>
            </ul>
        </section>

        <!-- 表单侧 -->
        <section class="flex flex-1 items-center justify-center px-5 py-12 sm:px-10">
            <div class="w-full max-w-[22rem]">
                <div class="mb-8 flex items-center gap-3 lg:hidden">
                    <img src="/icon/water-logo.svg" class="h-9 w-9" alt="logo" />
                    <span class="text-sm font-medium text-base-content/70">沈巷镇水利站</span>
                </div>

                <h2 class="text-2xl font-bold tracking-tight text-base-content">管理后台登录</h2>
                <p class="mt-2 text-sm text-base-content/60">请使用管理员账号登录，继续管理站点内容。</p>

                <form class="mt-8 flex flex-col gap-5" @submit.prevent="submit">
                    <label class="form-control w-full">
                        <span class="label-text mb-2 text-xs font-medium text-base-content/55">用户名</span>
                        <input v-model="username" autocomplete="username" placeholder="请输入用户名"
                            class="input input-bordered h-11 w-full rounded-lg" />
                    </label>
                    <label class="form-control w-full">
                        <span class="label-text mb-2 text-xs font-medium text-base-content/55">密码</span>
                        <input v-model="password" type="password" autocomplete="current-password" placeholder="请输入密码"
                            class="input input-bordered h-11 w-full rounded-lg" />
                    </label>

                    <p v-if="error_message" role="alert" class="alert alert-error rounded-lg py-2 text-sm">
                        {{ error_message }}
                    </p>

                    <button type="submit" :disabled="auth_store.loading"
                        class="btn btn-primary btn-main mt-1 h-11 rounded-lg"
                        :class="{ 'btn-disabled': auth_store.loading }">
                        {{ auth_store.loading ? '登录中…' : '登 录' }}
                    </button>
                </form>

                <div class="mt-8 flex items-center justify-between border-t border-base-300 pt-5 text-xs text-base-content/50">
                    <RouterLink :to="{ name: 'Home' }" class="hover:text-ink">← 返回门户首页</RouterLink>
                    <span>© 2026 沈巷镇水利站</span>
                </div>
            </div>
        </section>
    </div>
</template>
