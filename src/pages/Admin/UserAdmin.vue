<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { storeToRefs } from 'pinia';
import dayjs from 'dayjs';
import AppModal from '@/components/AppModal.vue';
import { useBaseinfoStore } from '@/store/base';
import { useAuthStore, DEFAULT_USER_PASSWORD } from '@/store/auth';
import { api_error_detail } from '@/utils/apiError';

const auth_store = useAuthStore();
const baseinfo_store = useBaseinfoStore();
const { users } = storeToRefs(baseinfo_store);

const list_error = ref('');
const action_error = ref('');
const action_success = ref('');
/** 正在提交（重置/删除）操作的用户 id，用于禁用按钮 */
const action_id = ref<number | null>(null);

/** 表格行序号：跨页无分页，顺序展示 */
const row_index = (index: number) => index + 1;

// —— 创建账户（POST /users/）——
const show_create_modal = ref(false);
const form = ref({ username: '', nickname: '', password: '' });
const create_error = ref('');
const creating = ref(false);

const open_create = () => {
    form.value = { username: '', nickname: '', password: '' };
    create_error.value = '';
    show_create_modal.value = true;
};

const submit_create = async () => {
    create_error.value = '';
    const username = form.value.username.trim();
    const nickname = form.value.nickname.trim();
    if (!username || !nickname) {
        create_error.value = '登录名与昵称均不能为空';
        return;
    }
    // 密码留空时由服务端取默认 abc123（≥6 位）；填了则须 ≥6 位
    const password = form.value.password.trim();
    if (password && password.length < 6) {
        create_error.value = '密码至少 6 位，或留空使用默认密码';
        return;
    }
    creating.value = true;
    try {
        const created = await auth_store.create_user({
            username,
            nickname,
            ...(password ? { password } : {}),
        });
        show_create_modal.value = false;
        // 账户已创建成功：刷新失败只影响列表滞后，不能误报成「创建失败」
        let refresh_note = '';
        try {
            await baseinfo_store.fetchBaseInfo();
        } catch {
            refresh_note = '（列表刷新失败，可刷新页面查看）';
        }
        flash_success(`已创建账户「${created.nickname}」，登录名 ${created.slug}，初始密码 ${DEFAULT_USER_PASSWORD}${refresh_note}`);
    } catch (error: any) {
        create_error.value = error?.message || '创建账户失败，请稍后重试';
    } finally {
        creating.value = false;
    }
};

// —— 自定义确认弹窗（替代 window.confirm/alert）——
const confirm_dialog = ref<{ show: boolean, title: string, message: string, on_ok: (() => void) | null }>({
    show: false, title: '', message: '', on_ok: null,
});
const ask_confirm = (title: string, message: string, on_ok: () => void) => {
    confirm_dialog.value = { show: true, title, message, on_ok };
};
const run_confirm = () => {
    const fn = confirm_dialog.value.on_ok;
    confirm_dialog.value.show = false;
    fn?.();
};

/** 成功提示的定时器：连续操作时需清掉上一个，避免旧定时器提前清掉新提示 */
let flash_timer: ReturnType<typeof setTimeout> | null = null;
const flash_success = (message: string) => {
    action_success.value = message;
    if (flash_timer) clearTimeout(flash_timer);
    flash_timer = setTimeout(() => {
        action_success.value = '';
        flash_timer = null;
    }, 5000);
};

// —— 重置密码（POST /users/{id}/reset-password）——
const reset_password = (id: number, nickname: string) => {
    ask_confirm(
        '重置密码',
        `确认将账户「${nickname}」的密码重置为 ${DEFAULT_USER_PASSWORD} 吗？重置后旧密码立即失效。`,
        async () => {
            action_id.value = id;
            action_error.value = '';
            try {
                const detail = await auth_store.reset_user_password(id);
                flash_success(detail || `已重置「${nickname}」的密码为 ${DEFAULT_USER_PASSWORD}`);
            } catch (error: any) {
                action_error.value = error?.message || '重置密码失败，请稍后重试';
            } finally {
                action_id.value = null;
            }
        },
    );
};

// —— 删除账户（DELETE /users/{id}）——
const remove_user = (id: number, nickname: string) => {
    ask_confirm(
        '删除账户',
        `确认删除账户「${nickname}」吗？删除后该账户无法登录。`
        + '注意：该账户已发布的文章、已上传的图片与文档会保留（作者显示为空），如需清理请先单独删除。',
        async () => {
            action_id.value = id;
            action_error.value = '';
            try {
                await auth_store.delete_user(id);
                // 账户已删除成功：刷新失败只影响列表滞后，不能误报成「删除失败」
                let refresh_note = '';
                try {
                    await baseinfo_store.fetchBaseInfo();
                } catch {
                    refresh_note = '（列表刷新失败，可刷新页面查看）';
                }
                flash_success(`已删除账户「${nickname}」${refresh_note}`);
            } catch (error: any) {
                action_error.value = error?.message || '删除账户失败，请稍后重试';
            } finally {
                action_id.value = null;
            }
        },
    );
};

/** 账户列表统计：普通账户数 / 超管数 */
const normal_count = computed(() => users.value.filter(u => !u.is_superuser).length);
const super_count = computed(() => users.value.filter(u => u.is_superuser).length);

const load_users = async () => {
    list_error.value = '';
    try {
        await baseinfo_store.fetchBaseInfo();
    } catch (error) {
        // 透传后端 detail（如 401 登录失效），而不是笼统的「获取账户列表失败」
        list_error.value = api_error_detail(error, '获取账户列表失败');
    }
};

onMounted(load_users);
</script>

<template>
    <main class="flex-1 overflow-y-auto p-6">
        <div class="flex items-center justify-between mb-4 gap-4">
            <div class="text-sm text-base-content/60">
                共 <span class="font-medium text-base-content/80">{{ users.length }}</span> 个账户
                <span class="mx-2 text-base-content/30">·</span>
                普通账户 <span class="font-medium text-base-content/80">{{ normal_count }}</span>
                <span class="mx-2 text-base-content/30">·</span>
                超级管理员 <span class="font-medium text-base-content/80">{{ super_count }}</span>
            </div>
            <button class="btn btn-main btn-primary" @click="open_create">
                + 新增账户
            </button>
        </div>

        <p v-if="action_error" role="alert" class="alert alert-error mb-4 text-sm">{{ action_error }}</p>
        <p v-if="action_success" role="alert" class="alert alert-success mb-4 text-sm">{{ action_success }}</p>
        <p v-if="list_error" role="alert" class="alert alert-error mb-4 text-sm">{{ list_error }}</p>

        <p class="mb-4 text-xs text-base-content/40">
            注：后端账户接口不返回登录名，此处仅展示 slug —— 旧账户的 slug 即登录名，
            通过本页新建的账户 slug 为随机标识（登录名在创建成功的提示中给出，请及时记录）。
            比对账户请以昵称为准。
        </p>

        <div class="card rounded-box overflow-x-auto">
            <table class="table text-sm">
                <thead class="border-b border-base-300 text-base-content/60">
                    <tr class="text-center">
                        <th class="px-4 py-4 font-medium">序号</th>
                        <th class="px-4 py-4 font-medium">昵称</th>
                        <!-- 后端 UserOut 不返回 username（见对接文档 §10），只能展示 slug -->
                        <th class="px-4 py-4 font-medium">slug</th>
                        <th class="px-4 py-4 font-medium">角色</th>
                        <th class="px-4 py-4 font-medium">操作</th>
                    </tr>
                </thead>
                <tbody class="divide-y divide-base-300 divide-dashed">
                    <tr v-if="!list_error && users.length === 0">
                        <td colspan="5" class="px-6 py-8 text-center text-base-content/40">暂无账户</td>
                    </tr>
                    <tr v-for="(item, index) in users" :key="item.id"
                        class="text-center hover:bg-base-200 link-transition">
                        <td class="px-4 py-3.5 text-base-content/60">{{ row_index(index) }}</td>
                        <td class="px-4 py-3 text-base-content/80">
                            <div class="max-w-[10rem] truncate mx-auto" :title="item.nickname">
                                {{ item.nickname }}
                            </div>
                        </td>
                        <td class="px-4 py-3 text-base-content/70 whitespace-nowrap">{{ item.slug }}</td>
                        <td class="px-4 py-3">
                            <span class="badge badge-sm whitespace-nowrap"
                                :class="item.is_superuser ? 'badge-primary' : 'badge-ghost'">
                                {{ item.is_superuser ? '超级管理员' : '普通账户' }}
                            </span>
                        </td>
                        <td class="px-4 py-3">
                            <div class="flex items-center justify-center gap-1">
                                <!-- 超级管理员账户受保护：后端返回 403，此处也不展示操作入口 -->
                                <template v-if="!item.is_superuser">
                                    <button class="btn btn-ghost btn-xs text-primary whitespace-nowrap"
                                        :disabled="action_id === item.id"
                                        @click="reset_password(item.id, item.nickname)">
                                        重置密码
                                    </button>
                                    <button class="btn btn-ghost btn-xs text-error whitespace-nowrap"
                                        :disabled="action_id === item.id"
                                        @click="remove_user(item.id, item.nickname)">
                                        删除
                                    </button>
                                </template>
                                <span v-else class="text-xs text-base-content/30">—</span>
                            </div>
                        </td>
                    </tr>
                </tbody>
            </table>
        </div>

        <!-- 新增账户弹窗 -->
        <AppModal v-model="show_create_modal" max-width="max-w-md" title="新增普通账户">
            <div class="flex flex-col gap-4">
                <label class="text-sm text-base-content/70">登录名
                    <input v-model="form.username" placeholder="登录用，唯一，如 zhangsan"
                        class="input input-bordered w-full mt-1" />
                </label>
                <label class="text-sm text-base-content/70">昵称
                    <input v-model="form.nickname" placeholder="展示名，唯一，如 张三"
                        class="input input-bordered w-full mt-1" />
                </label>
                <label class="text-sm text-base-content/70">密码
                    <input v-model="form.password" type="password" autocomplete="new-password"
                        placeholder="留空则使用默认密码 abc123"
                        class="input input-bordered w-full mt-1" />
                    <span class="block mt-1 text-xs text-base-content/40">
                        最少 6 位；留空使用默认密码 {{ DEFAULT_USER_PASSWORD }}
                    </span>
                </label>
                <p v-if="create_error" class="text-sm text-error">{{ create_error }}</p>
            </div>
            <template #footer>
                <button class="btn" @click="show_create_modal = false">取消</button>
                <button class="btn btn-main btn-primary" :disabled="creating"
                    :class="{ 'btn-disabled': creating }"
                    @click="submit_create">
                    {{ creating ? '创建中...' : '创建' }}
                </button>
            </template>
        </AppModal>

        <!-- 确认弹窗（重置密码 / 删除账户） -->
        <AppModal v-model="confirm_dialog.show" :title="confirm_dialog.title">
            <p class="text-sm text-base-content/70">{{ confirm_dialog.message }}</p>
            <template #footer>
                <button class="btn" @click="confirm_dialog.show = false">取消</button>
                <button class="btn btn-main btn-primary" @click="run_confirm">确认</button>
            </template>
        </AppModal>
    </main>
</template>
