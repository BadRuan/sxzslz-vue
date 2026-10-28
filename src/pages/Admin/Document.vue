<script setup lang="ts">
import { onMounted, ref } from 'vue';
import apiService from '@/utils/apiService';
import { api_error_detail } from '@/utils/apiError';
import { useAuthStore } from '@/store/auth';
import dayjs from 'dayjs';
import AppPagination from '@/components/AppPagination.vue';
import AppModal from '@/components/AppModal.vue';
import CopyButton from '@/components/CopyButton.vue';
import { useUpload } from '@/composables/useUpload';
import {
    DOCUMENT_ACCEPT,
    DOCUMENT_LIMIT_HINT,
    format_bytes,
    validate_documents,
} from '@/utils/upload';

/** 文件列表项，字段与 GET /document/ 一致 */
export interface DocumentModel {
    id: number,
    slug: string,
    raw_filename: string,
    mime_type: string,
    size_bytes: number,
    user_id: number,
    view: number,
    uploaded_at: string,
    user: { id: number, slug: string, nickname: string, is_superuser: boolean } | null,
};

const PAGE_SIZE = 30;

const auth_store = useAuthStore();
const document_list = ref<DocumentModel[]>([]);
const total = ref(0);
const page = ref(1);
const has_next = ref(false);
const list_error = ref('');
const action_error = ref('');

/** 上传进度 / 错误 / 取消：与照片管理共用同一套组合式逻辑 */
const {
    progress: upload_progress,
    error_message: upload_error,
    success_message: upload_success,
    run: run_upload,
    cancel: cancel_upload,
} = useUpload();

const ext_of = (filename: string) => filename.split('.').pop()?.toLowerCase() ?? '';

/** 改名/删除权限：上传者本人或超管（对接文档 §1 权限边界） */
const can_manage = (doc: DocumentModel) =>
    auth_store.is_superuser
    || (auth_store.user !== null && doc.user_id === auth_store.user.id);

/** 表格行序号：跨页连续编号 */
const row_index = (index: number) => (page.value - 1) * PAGE_SIZE + index + 1;

const fetch_list = async () => {
    list_error.value = '';
    try {
        // 后端默认即为上传时间倒序（sort=uploaded_at）
        const res = await apiService.get('/document/', { page: page.value, page_size: PAGE_SIZE });
        document_list.value = res.data ?? [];
        total.value = res.total;
        has_next.value = res.has_next;
    } catch (error) {
        list_error.value = api_error_detail(error, '获取文件列表失败');
        console.error('获取管理后台文件列表失败:', error)
    }
}

const go_page = (target: number) => {
    page.value = target;
    fetch_list();
};

const pick_files = async (event: Event) => {
    const input = event.target as HTMLInputElement;
    const files = Array.from(input.files ?? []);
    input.value = '';
    if (files.length === 0) return;

    // 预检：MIME 白名单 → 单文件 ≤ 50MB → 空文件 → 批量 ≤ 20 个（与后端限制一致，避免白传）
    const validation_error = validate_documents(files);
    if (validation_error) {
        upload_error.value = validation_error;
        upload_success.value = '';
        return;
    }

    const is_uploaded = await run_upload({
        files,
        single_url: '/document/',
        batch_url: '/document/batch/',
        single_label: `正在上传：${files[0]?.name ?? ''}`,
        batch_label: `正在上传 ${files.length} 个文件...`,
        processing_label: '已发送，服务器正在保存文件...',
        success_text: `已上传 ${files.length} 个文件`,
    });
    if (!is_uploaded) return;

    page.value = 1;
    await fetch_list();
};

// —— 改名（PATCH /document/{slug}，仅上传者本人）——
const show_rename_modal = ref(false);
const rename_slug = ref('');
const rename_original = ref('');
const rename_value = ref('');
const rename_error = ref('');
const rename_saving = ref(false);

const open_rename = (doc: DocumentModel) => {
    rename_slug.value = doc.slug;
    rename_original.value = doc.raw_filename;
    rename_value.value = doc.raw_filename;
    rename_error.value = '';
    show_rename_modal.value = true;
};

const submit_rename = async () => {
    rename_error.value = '';
    const name = rename_value.value.trim();
    if (!name) {
        rename_error.value = '文件名不能为空';
        return;
    }
    rename_saving.value = true;
    try {
        await apiService.patch(`/document/${rename_slug.value}`, { raw_filename: name });
        show_rename_modal.value = false;
        await fetch_list();
    } catch (error) {
        rename_error.value = api_error_detail(error, '重命名失败');
    } finally {
        rename_saving.value = false;
    }
};

// —— 删除（DELETE /document/{slug}，仅上传者本人，不可恢复）——
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

const remove_document = (doc: DocumentModel) => {
    ask_confirm(
        '删除文档',
        `确定删除「${doc.raw_filename}」吗？将同时删除磁盘文件，不可恢复。`,
        async () => {
            action_error.value = '';
            try {
                await apiService.delete(`/document/${doc.slug}`);
                await fetch_list();
            } catch (error) {
                action_error.value = api_error_detail(error, '删除失败');
            }
        },
    );
};

/**
 * 下载需登录（仅上传者本人或超管），`<a href>` 无法携带 Authorization 会 401，
 * 因此用 axios 取 Blob 后再触发浏览器下载。
 */
const download_document = async (doc: DocumentModel) => {
    action_error.value = '';
    try {
        const blob = await apiService.download(`/document/${doc.slug}`);
        const object_url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = object_url;
        link.download = doc.raw_filename || doc.slug;
        document.body.appendChild(link);
        link.click();
        link.remove();
        URL.revokeObjectURL(object_url);
    } catch (error) {
        action_error.value = api_error_detail(error, '下载失败，请稍后重试');
    }
};

onMounted(fetch_list);
</script>

<template>
    <main class="flex-1 overflow-y-auto p-6">
        <div class="flex items-center justify-end mb-2">
            <label class="btn btn-main btn-primary cursor-pointer"
                :class="upload_progress.is_active ? 'opacity-60 cursor-not-allowed' : ''">
                {{ upload_progress.is_active ? '上传中...' : '+ 上传文档' }}
                <input type="file" multiple class="hidden"
                    :accept="DOCUMENT_ACCEPT"
                    :disabled="upload_progress.is_active" @change="pick_files" />
            </label>
        </div>
        <p class="mb-4 text-xs text-base-content/40">{{ DOCUMENT_LIMIT_HINT }}</p>

        <!-- 上传进度：字节发完后切「服务器处理中」，并给出取消入口，避免大文件长时间无反馈 -->
        <div v-if="upload_progress.is_active" class="card bg-base-100 border border-base-300 rounded-box mb-4 px-4 py-3">
            <div class="flex items-center justify-between text-sm mb-2 gap-3">
                <span class="flex items-center gap-2 min-w-0 text-base-content/80" :title="upload_progress.label">
                    <span v-if="upload_progress.phase === 'processing'"
                        class="loading loading-spinner loading-xs shrink-0"></span>
                    <span class="truncate">{{ upload_progress.label }}</span>
                </span>
                <span class="flex items-center gap-2 whitespace-nowrap">
                    <span class="text-base-content/60">{{ upload_progress.percent }}%</span>
                    <button type="button" class="btn btn-ghost btn-xs" @click="cancel_upload">取消</button>
                </span>
            </div>
            <progress class="progress progress-primary w-full" :value="upload_progress.percent" max="100"></progress>
        </div>

        <p v-if="upload_error" role="alert" class="alert alert-error mb-4 text-sm">{{ upload_error }}</p>
        <p v-if="upload_success" role="alert" class="alert alert-success mb-4 text-sm">{{ upload_success }}</p>
        <p v-if="action_error" role="alert" class="alert alert-error mb-4 text-sm">{{ action_error }}</p>
        <p v-if="list_error" role="alert" class="alert alert-error mb-4 text-sm">{{ list_error }}</p>

        <div class="card rounded-box overflow-x-auto">
            <table class="table text-sm">
                <thead class="border-b border-base-300 text-base-content/60">
                    <tr>
                        <th class="px-4 py-4 font-medium whitespace-nowrap">序号</th>
                        <th class="px-4 py-4 font-medium">文件名</th>
                        <th class="px-4 py-4 font-medium whitespace-nowrap">类型</th>
                        <th class="px-4 py-4 font-medium whitespace-nowrap">大小</th>
                        <th v-if="auth_store.is_superuser" class="px-4 py-4 font-medium whitespace-nowrap">上传者</th>
                        <!-- 1024 内容区 784px：浏览量列 xl 起显示，保证上传时间/操作列无需横滚可见 -->
                        <th class="px-4 py-4 font-medium hidden xl:table-cell">浏览量</th>
                        <th class="px-4 py-4 font-medium whitespace-nowrap">上传时间</th>
                        <th class="px-4 py-4 font-medium">操作</th>
                    </tr>
                </thead>
                <tbody class="divide-y divide-base-300 divide-dashed">
                    <tr v-if="!list_error && document_list.length === 0">
                        <td :colspan="auth_store.is_superuser ? 8 : 7" class="px-4 py-8 text-center text-base-content/40">暂无文件</td>
                    </tr>
                    <tr v-for="(doc, index) in document_list" :key="doc.id" class="hover:bg-base-200 link-transition">
                        <td class="px-4 py-3.5 text-base-content/60 whitespace-nowrap">{{ row_index(index) }}</td>
                        <!-- td 上的 max-width 在 auto 表格布局下不可靠：内层 div 限宽截断，悬停看全名 -->
                        <td class="px-4 py-3.5 text-base-content/80" :title="doc.raw_filename">
                            <div class="max-w-[16rem] truncate">{{ doc.raw_filename }}</div>
                        </td>
                        <td class="px-4 py-3.5 text-base-content/60 whitespace-nowrap">{{ ext_of(doc.raw_filename).toUpperCase() }}</td>
                        <td class="px-4 py-3.5 text-base-content/60 whitespace-nowrap">{{ format_bytes(doc.size_bytes) }}</td>
                        <!-- 超管可见上传者（普通用户列表本身只含自己的文件） -->
                        <td v-if="auth_store.is_superuser" class="px-4 py-3.5 text-base-content/60 max-w-[8rem] truncate"
                            :title="doc.user?.nickname ?? ''">{{ doc.user?.nickname ?? '—' }}</td>
                        <td class="px-4 py-3.5 text-base-content/60 hidden xl:table-cell">{{ doc.view }}</td>
                        <td class="px-4 py-3.5 text-base-content/60 whitespace-nowrap">{{ dayjs(doc.uploaded_at).format('YYYY-MM-DD HH:mm') }}</td>
                        <td class="px-4 py-3.5">
                            <div class="flex flex-wrap items-center gap-x-2 gap-y-1 whitespace-nowrap">
                                <button type="button"
                                    class="text-xs text-primary/90 hover:underline"
                                    @click="download_document(doc)">下载</button>
                                <!-- 详情页会把相对路径 slug 自动补成 /api/document/，MD 里只写 slug 即可生成下载链接 -->
                                <CopyButton :text="`[${doc.raw_filename}](${doc.slug})`" label="复制 md" />
                                <!-- 改名/删除：上传者本人或超管（后端 403 其他人） -->
                                <template v-if="can_manage(doc)">
                                    <button type="button" class="text-xs text-primary/90 hover:underline"
                                        @click="open_rename(doc)">改名</button>
                                    <button type="button" class="text-xs text-error/90 hover:underline"
                                        @click="remove_document(doc)">删除</button>
                                </template>
                            </div>
                        </td>
                    </tr>
                </tbody>
            </table>
        </div>

        <!-- 分页放横滚容器外，避免表格溢出时翻页按钮被卷入横向滚动 -->
        <AppPagination class="mt-4" :page="page" :has-next="has_next"
            :total="total" unit="个" @change="go_page" />

        <AppModal v-model="show_rename_modal" title="重命名文档" max-width="max-w-md">
            <label class="form-control w-full">
                <span class="label-text mb-1 text-base-content/70">展示名（下载时的文件名）</span>
                <input v-model="rename_value" class="input input-bordered w-full" maxlength="255"
                    placeholder="请输入新文件名" @keyup.enter="submit_rename" />
            </label>
            <p v-if="rename_error" role="alert" class="alert alert-error text-sm mt-3">{{ rename_error }}</p>
            <template #footer>
                <button type="button" class="btn btn-ghost" @click="show_rename_modal = false">取消</button>
                <button type="button" class="btn btn-primary" :disabled="rename_saving" @click="submit_rename">
                    {{ rename_saving ? '保存中...' : '保存' }}
                </button>
            </template>
        </AppModal>

        <AppModal v-model="confirm_dialog.show" :title="confirm_dialog.title" max-width="max-w-md">
            <p class="text-sm text-base-content/80">{{ confirm_dialog.message }}</p>
            <template #footer>
                <button type="button" class="btn btn-ghost" @click="confirm_dialog.show = false">取消</button>
                <button type="button" class="btn btn-error" @click="run_confirm">确定删除</button>
            </template>
        </AppModal>
    </main>
</template>
