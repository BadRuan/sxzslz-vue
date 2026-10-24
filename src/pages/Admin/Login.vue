<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore, get_token } from '@/store/auth';

const router = useRouter();
const auth_store = useAuthStore();

const username = ref('');
const password = ref('');
const error_message = ref('');

onMounted(() => {
    // 已登录再进登录页：直接回后台
    if (get_token()) {
        router.replace({ name: 'AdminOverview' });
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
        router.replace({ name: 'AdminOverview' });
    } catch (error: any) {
        error_message.value = error?.message || '登录失败，请稍后重试';
    }
};
</script>

<template>
    <div class="min-h-screen bg-background flex items-center justify-center px-4">
        <div class="w-full max-w-sm bg-white rounded-2xl shadow-card p-8">
            <div class="flex flex-col items-center mb-6">
                <img src="/icon/water-logo.svg" class="h-10 w-10 mb-3" alt="logo" />
                <h1 class="text-xl font-bold text-gray-900">管理后台登录</h1>
                <p class="text-sm text-gray-500 mt-1">芜湖市鸠江区沈巷镇水利站</p>
            </div>

            <form class="flex flex-col gap-4" @submit.prevent="submit">
                <label class="text-sm text-gray-600">用户名
                    <input v-model="username" autocomplete="username"
                        class="mt-1 w-full rounded-lg border border-border px-3 py-2 text-sm text-gray-800 focus:border-primary-400 focus:ring-2 focus:ring-primary-100" />
                </label>
                <label class="text-sm text-gray-600">密码
                    <input v-model="password" type="password" autocomplete="current-password"
                        class="mt-1 w-full rounded-lg border border-border px-3 py-2 text-sm text-gray-800 focus:border-primary-400 focus:ring-2 focus:ring-primary-100" />
                </label>

                <p v-if="error_message" class="text-sm text-red-600">{{ error_message }}</p>

                <button type="submit" :disabled="auth_store.loading" :class="auth_store.loading
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    : 'bg-primary-500 text-white hover:bg-primary-600'"
                    class="mt-2 w-full rounded-lg px-4 py-2 text-sm font-semibold link-transition">
                    {{ auth_store.loading ? '登录中...' : '登 录' }}
                </button>
            </form>
        </div>
    </div>
</template>
