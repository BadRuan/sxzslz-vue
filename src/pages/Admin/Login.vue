<script setup lang="ts">
import { computed, ref, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useAuthStore, get_token } from '@/store/auth';

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
    <div class="min-h-screen bg-base-200 flex items-center justify-center px-4">
        <div class="w-full max-w-sm card rounded-box p-8">
            <div class="flex flex-col items-center mb-6">
                <img src="/icon/water-logo.svg" class="h-10 w-10 mb-3" alt="logo" />
                <h1 class="text-xl font-bold text-base-content">管理后台登录</h1>
                <p class="text-sm text-base-content/60 mt-1">芜湖市鸠江区沈巷镇水利站</p>
            </div>

            <form class="flex flex-col gap-4" @submit.prevent="submit">
                <label class="form-control w-full">
                    <span class="label-text mb-1 text-base-content/70">用户名</span>
                    <input v-model="username" autocomplete="username" placeholder="请输入用户名"
                        class="input input-bordered w-full" />
                </label>
                <label class="form-control w-full">
                    <span class="label-text mb-1 text-base-content/70">密码</span>
                    <input v-model="password" type="password" autocomplete="current-password" placeholder="请输入密码"
                        class="input input-bordered w-full" />
                </label>

                <p v-if="error_message" role="alert" class="alert alert-error text-sm">{{ error_message }}</p>

                <button type="submit" :disabled="auth_store.loading"
                    class="btn btn-main btn-primary mt-2 btn-block"
                    :class="{ 'btn-disabled': auth_store.loading }">
                    {{ auth_store.loading ? '登录中...' : '登 录' }}
                </button>
            </form>
        </div>
    </div>
</template>
