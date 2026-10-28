<script setup lang="ts">
import { onMounted, ref } from 'vue';
import apiService from '@/utils/apiService';
import { api_error_detail } from '@/utils/apiError';
import { url_prefix } from '@/utils/baseInfo';
import { useAuthStore } from '@/store/auth';
import dayjs from 'dayjs';
import AppPagination from '@/components/AppPagination.vue';
import AppModal from '@/components/AppModal.vue';
import CopyButton from '@/components/CopyButton.vue';
import { useUpload } from '@/composables/useUpload';
import {
    IMAGE_ACCEPT,
    IMAGE_LIMIT_HINT,
    format_bytes,
    validate_images,
} from '@/utils/upload';

/** 图片列表项，字段与 GET /image/ 一致 */
export interface ImageModel {
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
const image_list = ref<ImageModel[]>([]);
const total = ref(0);
const page = ref(1);
const has_next = ref(false);
const list_error = ref('');
const action_error = ref('');

/** 上传进度 / 错误 / 取消：与文档管理共用同一套组合式逻辑 */
const {
    progress: upload_progress,
    error_message: upload_error,
    success_message: upload_success,
    run: run_upload,
    cancel: cancel_upload,
} = useUpload();

/** 改名/删除权限：上传者本人或超管（对接文档 §1 权限边界） */
const can_manage = (image: ImageModel) =>
    auth_store.is_superuser
    || (auth_store.user !== null && image.user_id === auth_store.user.id);

const getImageList = async () => {
    list_error.value = '';
    try {
        const res = await apiService.get('/image/', { page: page.value, page_size: PAGE_SIZE });
        image_list.value = res.data ?? [];
        total.value = res.total;
        has_next.value = res.has_next;
    } catch (error) {
        list_error.value = api_error_detail(error, '获取图片列表失败');
        console.error('获取管理后台图片列表失败:', error)
    }
}

const go_page = (target: number) => {
    page.value = target;
    getImageList();
};

const pick_files = async (event: Event) => {
    const input = event.target as HTMLInputElement;
    const files = Array.from(input.files ?? []);
    input.value = '';
    if (files.length === 0) return;

    // 预检：格式白名单 → 单张 ≤ 10MB → 空文件 → 批量 ≤ 20 张（与后端限制一致，避免白传）
    const validation_error = validate_images(files);
    if (validation_error) {
        upload_error.value = validation_error;
        upload_success.value = '';
        return;
    }

    const is_uploaded = await run_upload({
        files,
        single_url: '/image/',
        batch_url: '/image/batch/',
        single_label: `正在上传：${files[0]?.name ?? ''}`,
        batch_label: `正在上传 ${files.length} 张图片...`,
        processing_label: '已发送，服务器正在生成 WebP 预览图...',
        success_text: `已上传 ${files.length} 张图片`,
    });
    if (!is_uploaded) return;

    page.value = 1;
    await getImageList();
};

// —— 改名（PATCH /image/{slug}，本人或超管）——
const show_rename_modal = ref(false);
const rename_slug = ref('');
const rename_value = ref('');
const rename_error = ref('');
const rename_saving = ref(false);

const open_rename = (image: ImageModel) => {
    rename_slug.value = image.slug;
    rename_value.value = image.raw_filename;
    rename_error.value = '';
    show_rename_modal.value = true;
};

const submit_rename = async () => {
    rename_error.value = '';
    const name = rename_value.value.trim();
    if (!name) {
        rename_error.value = '图片名不能为空';
        return;
    }
    rename_saving.value = true;
    try {
        await apiService.patch(`/image/${rename_slug.value}`, { raw_filename: name });
        show_rename_modal.value = false;
        await getImageList();
    } catch (error) {
        rename_error.value = api_error_detail(error, '重命名失败');
    } finally {
        rename_saving.value = false;
    }
};

// —— 删除（DELETE /image/{slug}，本人或超管，不可恢复）——
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

const remove_image = (image: ImageModel) => {
    ask_confirm(
        '删除图片',
        `确定删除「${image.raw_filename}」吗？将同时删除原图与预览图，不可恢复。`,
        async () => {
            action_error.value = '';
            try {
                await apiService.delete(`/image/${image.slug}`);
                await getImageList();
            } catch (error) {
                action_error.value = api_error_detail(error, '删除失败');
            }
        },
    );
};

onMounted(getImageList);
</script>

<template>
    <main class="flex-1 overflow-y-auto p-6">
        <div class="flex items-center justify-end mb-2">
            <label class="btn btn-main btn-primary cursor-pointer"
                :class="upload_progress.is_active ? 'opacity-60 cursor-not-allowed' : ''">
                {{ upload_progress.is_active ? '上传中...' : '+ 上传照片' }}
                <input type="file" :accept="IMAGE_ACCEPT" multiple class="hidden"
                    :disabled="upload_progress.is_active" @change="pick_files" />
            </label>
        </div>
        <p class="mb-4 text-xs text-base-content/40">{{ IMAGE_LIMIT_HINT }}</p>

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

        <!-- 照片网格 -->
        <!-- 内容区=视口−侧栏，lg 下 6 列每格仅 ~110px 无法辨图，xl 起才多列 -->
        <div class="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4 sm:gap-6">
            <div v-for="image in image_list" :key="image.id"
                class="card rounded-box border border-base-300 overflow-hidden group">
                <div class="relative overflow-hidden aspect-square">
                    <img :src="url_prefix.pic_prefix + image.slug" :alt="image.raw_filename"
                        class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200 ease-out" />
                </div>
                <div class="p-3">
                    <p class="text-sm my-1 font-medium text-base-content truncate" :title="image.raw_filename">{{ image.raw_filename }}</p>
                    <p class="text-xs text-base-content/60">{{ format_bytes(image.size_bytes) }} · 浏览 {{ image.view }}</p>
                    <!-- 超管可见上传者（普通用户列表本身只含自己的图片） -->
                    <p v-if="auth_store.is_superuser" class="text-xs text-base-content/40 truncate"
                        :title="image.user?.nickname ?? ''">上传者：{{ image.user?.nickname ?? '—' }}</p>
                    <p class="text-xs text-base-content/40">{{ dayjs(image.uploaded_at).format('YYYY-MM-DD HH:mm') }}</p>
                    <div class="mt-1 flex flex-wrap items-center gap-x-1 gap-y-0.5">
                        <!-- 详情页会把相对路径 slug 自动补成 /api/image/，MD 里只写 slug 即可渲染 -->
                        <CopyButton :text="`![${image.raw_filename}](${image.slug})`" label="复制 md" />
                        <!-- 改名/删除：上传者本人或超管（后端 403 其他人） -->
                        <template v-if="can_manage(image)">
                            <button type="button" class="text-xs text-primary/90 hover:underline"
                                @click="open_rename(image)">改名</button>
                            <button type="button" class="text-xs text-error/90 hover:underline"
                                @click="remove_image(image)">删除</button>
                        </template>
                    </div>
                </div>
            </div>
        </div>

        <p v-if="!list_error && image_list.length === 0" class="py-16 text-center text-base-content/40">暂无图片</p>

        <AppPagination class="mt-8" :page="page" :has-next="has_next"
            :total="total" unit="张" @change="go_page" />

        <AppModal v-model="show_rename_modal" title="重命名图片" max-width="max-w-md">
            <label class="form-control w-full">
                <span class="label-text mb-1 text-base-content/70">展示名</span>
                <input v-model="rename_value" class="input input-bordered w-full" maxlength="255"
                    placeholder="请输入新图片名" @keyup.enter="submit_rename" />
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
