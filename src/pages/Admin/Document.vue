<script setup lang="ts">
import { onMounted, ref } from 'vue';
import apiService from '@/utils/apiService';
import { api_error_detail } from '@/store/article';
import { url_prefix } from '@/utils/baseInfo';
import dayjs from 'dayjs';
import AppPagination from '@/components/AppPagination.vue';

/** 文件列表项，字段与 GET /document/ 一致 */
export interface DocumentModel {
    id: number,
    slug: string,
    raw_filename: string,
    mime_type: string,
    size_bytes: number,
    view: number,
    uploaded_at: string
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

const document_list = ref<DocumentModel[]>([]);
const total = ref(0);
const page = ref(1);
const has_next = ref(false);
const list_error = ref('');
const uploading = ref(false);
const upload_error = ref('');
const upload_success = ref('');

const ext_of = (filename: string) => filename.split('.').pop()?.toLowerCase() ?? '';

/** 后端按 MIME 精确校验；File.type 为空时无法通过，需提示用户 */
const is_allowed_doc = (file: File) =>
    file.type !== '' && DOC_MIME_WHITELIST.includes(file.type);

const fetch_list = async () => {
    list_error.value = '';
    try {
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
    }

    uploading.value = true;
    try {
        for (const file of files) {
            await apiService.upload('/document/', file);
        }
        upload_success.value = `已上传 ${files.length} 个文件`;
        page.value = 1;
        await fetch_list();
    } catch (error) {
        upload_error.value = api_error_detail(error, '上传失败，请稍后重试');
    } finally {
        uploading.value = false;
    }
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
        <div class="flex items-center justify-between mb-2">
            <h2 class="text-xl font-bold text-base-content">文档管理</h2>
            <label class="btn btn-main btn-primary cursor-pointer"
                :class="uploading ? 'opacity-60 cursor-not-allowed' : ''">
                {{ uploading ? '上传中...' : '+ 上传文档' }}
                <input type="file" multiple class="hidden"
                    accept=".txt,.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.zip"
                    :disabled="uploading" @change="pick_files" />
            </label>
        </div>
        <p class="mb-4 text-xs text-base-content/40">支持 txt / pdf / doc / docx / xls / xlsx / ppt / pptx / zip，单个 ≤ 50MB</p>

        <p v-if="upload_error" class="alert alert-error mb-4 text-sm">{{ upload_error }}</p>
        <p v-if="upload_success" class="mb-4 text-sm text-green-600">{{ upload_success }}</p>
        <p v-if="list_error" class="alert alert-error mb-4 text-sm">{{ list_error }}</p>

        <div class="bg-base-100 rounded-2xl shadow-sm overflow-x-auto">
            <table class="table text-sm">
                <thead class="border-b border-base-300 text-base-content/60">
                    <tr>
                        <th class="px-6 py-4 font-medium">文件名</th>
                        <th class="px-6 py-4 font-medium">类型</th>
                        <th class="px-6 py-4 font-medium">大小</th>
                        <th class="px-6 py-4 font-medium">浏览量</th>
                        <th class="px-6 py-4 font-medium">上传时间</th>
                        <th class="px-6 py-4 font-medium">操作</th>
                    </tr>
                </thead>
                <tbody class="divide-y divide-base-300 divide-dashed">
                    <tr v-if="!list_error && document_list.length === 0">
                        <td colspan="6" class="px-6 py-8 text-center text-base-content/40">暂无文件</td>
                    </tr>
                    <tr v-for="doc in document_list" :key="doc.id" class="hover:bg-base-300/50 link-transition">
                        <td class="px-6 py-3.5 text-base-content/80 max-w-md truncate" :title="doc.raw_filename">
                            {{ doc.raw_filename }}
                        </td>
                        <td class="px-6 py-3.5 text-base-content/60">{{ ext_of(doc.raw_filename).toUpperCase() }}</td>
                        <td class="px-6 py-3.5 text-base-content/60">{{ format_size(doc.size_bytes) }}</td>
                        <td class="px-6 py-3.5 text-base-content/60">{{ doc.view }}</td>
                        <td class="px-6 py-3.5 text-base-content/60">{{ dayjs(doc.uploaded_at).format('YYYY-MM-DD HH:mm') }}</td>
                        <td class="px-6 py-3.5">
                            <a :href="url_prefix.document_prefix + doc.slug" target="_blank" rel="noopener"
                                class="text-xs text-primary/90 hover:underline">下载</a>
                        </td>
                    </tr>
                </tbody>
            </table>

            <AppPagination class="px-6 py-4" :page="page" :has-next="has_next"
                :total="total" unit="个" @change="go_page" />
        </div>
    </main>
</template>
