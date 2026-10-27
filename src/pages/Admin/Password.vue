<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '@/store/auth';

const router = useRouter();
const auth_store = useAuthStore();

const old_password = ref('');
const new_password = ref('');
const confirm_password = ref('');
const error_message = ref('');
const success_message = ref('');
const is_submitting = ref(false);

const MIN_PASSWORD_LENGTH = 6;

const can_submit = computed(() =>
    !is_submitting.value
    && old_password.value
    && new_password.value
    && confirm_password.value,
);

onMounted(() => {
    auth_store.fetchMe();
});

const reset_form = () => {
    old_password.value = '';
    new_password.value = '';
    confirm_password.value = '';
};

const submit = async () => {
    error_message.value = '';
    success_message.value = '';

    if (!old_password.value || !new_password.value || !confirm_password.value) {
        error_message.value = '请填写全部字段';
        return;
    }
    if (new_password.value.length < MIN_PASSWORD_LENGTH) {
        error_message.value = `新密码至少 ${MIN_PASSWORD_LENGTH} 位`;
        return;
    }
    if (new_password.value !== confirm_password.value) {
        error_message.value = '两次输入的新密码不一致';
        return;
    }
    if (new_password.value === old_password.value) {
        error_message.value = '新密码不能与当前密码相同';
        return;
    }

    is_submitting.value = true;
    try {
        await auth_store.changePassword(old_password.value, new_password.value);
        success_message.value = '密码修改成功，请用新密码重新登录';
        reset_form();
    } catch (error: any) {
        // 400 原密码错误 / 422 参数校验：detail 由 store 统一解析
        error_message.value = error?.message || '密码修改失败，请稍后重试';
    } finally {
        is_submitting.value = false;
    }
};

/** 修改成功后旧 token 过期前仍有效；引导用新密码重新登录 */
const go_relogin = () => {
    auth_store.logout();
    router.replace({ name: 'AdminLogin' });
};
</script>

<template>
    <div class="flex-1 overflow-y-auto p-6">
        <div class="max-w-lg mx-auto">
            <div class="card bg-base-100 rounded-box shadow-sm">
                <div class="card-body">
                    <h2 class="card-title mb-1">修改密码</h2>
                    <p class="text-sm text-base-content/60 mb-4">
                        当前账户：{{ auth_store.user?.nickname ?? '...' }}，新密码至少 6 位
                    </p>

                    <form class="flex flex-col gap-4" @submit.prevent="submit">
                        <label class="form-control w-full">
                            <span class="label-text mb-1 text-base-content/70">当前密码</span>
                            <input v-model="old_password" type="password" autocomplete="current-password"
                                placeholder="请输入当前密码" class="input input-bordered w-full" />
                        </label>
                        <label class="form-control w-full">
                            <span class="label-text mb-1 text-base-content/70">新密码</span>
                            <input v-model="new_password" type="password" autocomplete="new-password"
                                placeholder="请输入新密码（至少 6 位）" class="input input-bordered w-full" />
                        </label>
                        <label class="form-control w-full">
                            <span class="label-text mb-1 text-base-content/70">确认新密码</span>
                            <input v-model="confirm_password" type="password" autocomplete="new-password"
                                placeholder="请再次输入新密码" class="input input-bordered w-full" />
                        </label>

                        <p v-if="error_message" role="alert" class="alert alert-error text-sm">
                            {{ error_message }}
                        </p>
                        <p v-if="success_message" role="alert" class="alert alert-success text-sm">
                            {{ success_message }}
                        </p>

                        <div class="flex gap-3 mt-2">
                            <button type="submit" :disabled="!can_submit" class="btn btn-primary flex-1"
                                :class="{ 'btn-disabled': !can_submit }">
                                {{ is_submitting ? '提交中...' : '确认修改' }}
                            </button>
                            <button v-if="success_message" type="button" class="btn btn-outline flex-1"
                                @click="go_relogin">
                                重新登录
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    </div>
</template>
