<script setup lang="ts">
import { onMounted, ref } from 'vue';
import apiService, { type UploadResult } from '@/utils/apiService';
import { api_error_detail } from '@/store/article';
import { url_prefix } from '@/utils/baseInfo';
import { useAuthStore } from '@/store/auth';
import dayjs from 'dayjs';
import AppPagination from '@/components/AppPagination.vue';
import AppModal from '@/components/AppModal.vue';
import CopyButton from '@/components/CopyButton.vue';

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
};

const PAGE_SIZE = 30;
// 与后端 allow_type.document 白名单保持一致（后端按 part 的 Content-Type 精确匹配）
const DOC_MIME_WHITELIST = [
    'text/plain',
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.ms-powerpoint',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'application/zip',
];
const MAX_DOC_SIZE = 50 * 1024 * 1024;

const auth_store = useAuthStore();
const document_list = ref<DocumentModel[]>([]);
const total = ref(0);
const page = ref(1);
const has_next = ref(false);
const list_error = ref('');
const upload_error = ref('');
const upload_success = ref('');
const action_error = ref('');

/** 多文件逐个上传进度：overall 0~100 综合进度；current 正在传的文件名与单文件百分比 */
const upload_progress = ref<{
    is_active: boolean,
    current_name: string,
    current_percent: number,
    overall_percent: number,
    finished: number,
    total: number,
}>({
    is_active: false,
    current_name: '',
    current_percent: 0,
    overall_percent: 0,
    finished: 0,
    total: 0,
});

const ext_of = (filename: string) => filename.split('.').pop()?.toLowerCase() ?? '';

/** 后端按 MIME 精确校验；File.type 为空时无法通过，需提示用户 */
const is_allowed_doc = (file: File) =>
    file.type !== '' && DOC_MIME_WHITELIST.includes(file.type);

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

    upload_error.value = '';
    upload_success.value = '';
    for (const file of files) {
        if (file.type === '') {
            upload_error.value = `「${file.name}」无法识别文件类型，请改用标准扩展名的文件`;
            return;
        }
        if (!is_allowed_doc(file)) {
            upload_error.value = `「${file.name}」格式不支持，仅支持 txt/pdf/doc/docx/xls/xlsx/ppt/pptx/zip`;
            return;
        }
        if (file.size > MAX_DOC_SIZE) {
            upload_error.value = `「${file.name}」超过 50MB`;
            return;
        }
        if (file.size === 0) {
            upload_error.value = `「${file.name}」文件内容为空`;
            return;
        }
    }

    // 综合进度 = 已完成文件字节 + 当前文件已发送字节 / 总字节
    const total_bytes = files.reduce((sum, f) => sum + f.size, 0);
    let done_bytes = 0;
    upload_progress.value = {
        is_active: true,
        current_name: files[0].name,
        current_percent: 0,
        overall_percent: 0,
        finished: 0,
        total: files.length,
    };

    try {
        for (let i = 0; i < files.length; i++) {
            const file = files[i];
            upload_progress.value.current_name = file.name;
            upload_progress.value.current_percent = 0;
            upload_progress.value.finished = i;

            await apiService.uploadWithProgress<UploadResult>('/document/', file, (percent) => {
                upload_progress.value.current_percent = percent;
                const overall = total_bytes > 0
                    ? Math.floor(((done_bytes + file.size * (percent / 100)) / total_bytes) * 100)
                    : 100;
                upload_progress.value.overall_percent = Math.min(overall, 99);
            });

            done_bytes += file.size;
            upload_progress.value.finished = i + 1;
            upload_progress.value.overall_percent = Math.floor((done_bytes / total_bytes) * 100);
        }
        upload_progress.value.overall_percent = 100;
        upload_success.value = `已上传 ${files.length} 个文件`;
        page.value = 1;
        await fetch_list();
    } catch (error) {
        upload_error.value = api_error_detail(error, '上传失败，请稍后重试');
    } finally {
        upload_progress.value.is_active = false;
    }
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

const format_size = (bytes: number) => {
    if (bytes >= 1024 * 1024) return (bytes / 1024 / 1024).toFixed(1) + ' MB';
    if (bytes >= 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return bytes + ' B';
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
                    accept=".txt,.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.zip"
                    :disabled="upload_progress.is_active" @change="pick_files" />
            </label>
        </div>
        <p class="mb-4 text-xs text-base-content/40">支持 txt / pdf / doc / docx / xls / xlsx / ppt / pptx / zip，单个 ≤ 50MB</p>

        <!-- 上传进度：发送到 100% 后服务端仍在落盘，完成前保持进度条可见 -->
        <div v-if="upload_progress.is_active" class="card bg-base-100 border border-base-300 rounded-box mb-4 px-4 py-3">
            <div class="flex items-center justify-between text-sm mb-2 gap-3">
                <span class="truncate text-base-content/80" :title="upload_progress.current_name">
                    正在上传（{{ upload_progress.finished + 1 }}/{{ upload_progress.total }}）：{{ upload_progress.current_name }}
                </span>
                <span class="text-base-content/60 whitespace-nowrap">总进度 {{ upload_progress.overall_percent }}%</span>
            </div>
            <progress class="progress progress-primary w-full" :value="upload_progress.overall_percent" max="100"></progress>
            <div class="mt-1 text-xs text-base-content/40">
                当前文件 {{ upload_progress.current_percent }}%
            </div>
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
                        <!-- 1024 内容区 784px：浏览量列 xl 起显示，保证上传时间/操作列无需横滚可见 -->
                        <th class="px-4 py-4 font-medium hidden xl:table-cell">浏览量</th>
                        <th class="px-4 py-4 font-medium whitespace-nowrap">上传时间</th>
                        <th class="px-4 py-4 font-medium">操作</th>
                    </tr>
                </thead>
                <tbody class="divide-y divide-base-300 divide-dashed">
                    <tr v-if="!list_error && document_list.length === 0">
                        <td colspan="7" class="px-4 py-8 text-center text-base-content/40">暂无文件</td>
                    </tr>
                    <tr v-for="(doc, index) in document_list" :key="doc.id" class="hover:bg-base-300/50 link-transition">
                        <td class="px-4 py-3.5 text-base-content/60 whitespace-nowrap">{{ row_index(index) }}</td>
                        <!-- td 上的 max-width 在 auto 表格布局下不可靠：内层 div 限宽截断，悬停看全名 -->
                        <td class="px-4 py-3.5 text-base-content/80" :title="doc.raw_filename">
                            <div class="max-w-[16rem] truncate">{{ doc.raw_filename }}</div>
                        </td>
                        <td class="px-4 py-3.5 text-base-content/60 whitespace-nowrap">{{ ext_of(doc.raw_filename).toUpperCase() }}</td>
                        <td class="px-4 py-3.5 text-base-content/60 whitespace-nowrap">{{ format_size(doc.size_bytes) }}</td>
                        <td class="px-4 py-3.5 text-base-content/60 hidden xl:table-cell">{{ doc.view }}</td>
                        <td class="px-4 py-3.5 text-base-content/60 whitespace-nowrap">{{ dayjs(doc.uploaded_at).format('YYYY-MM-DD HH:mm') }}</td>
                        <td class="px-4 py-3.5">
                            <div class="flex flex-wrap items-center gap-x-2 gap-y-1 whitespace-nowrap">
                                <a :href="url_prefix.document_prefix + doc.slug" target="_blank" rel="noopener"
                                    class="text-xs text-primary/90 hover:underline">下载</a>
                                <!-- 详情页会把相对路径 slug 自动补成 /api/document/，MD 里只写 slug 即可生成下载链接 -->
                                <CopyButton :text="`[${doc.raw_filename}](${doc.slug})`" label="复制 md" />
                                <!-- 改名/删除仅上传者本人可操作（后端 403） -->
                                <template v-if="auth_store.user && doc.user_id === auth_store.user.id">
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
