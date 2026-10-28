<script setup lang="ts">
import { onMounted, ref } from 'vue';
import apiService, { type UploadResult } from '@/utils/apiService';
import { api_error_detail } from '@/utils/apiError';
import { url_prefix } from '@/utils/baseInfo';
import { useAuthStore } from '@/store/auth';
import dayjs from 'dayjs';
import AppPagination from '@/components/AppPagination.vue';
import AppModal from '@/components/AppModal.vue';
import CopyButton from '@/components/CopyButton.vue';

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
const IMAGE_MIME_WHITELIST = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
const MAX_IMAGE_SIZE = 10 * 1024 * 1024;

const auth_store = useAuthStore();
const image_list = ref<ImageModel[]>([]);
const total = ref(0);
const page = ref(1);
const has_next = ref(false);
const list_error = ref('');
const upload_error = ref('');
const upload_success = ref('');
const action_error = ref('');

/** 多图逐个上传进度：overall 综合进度；current 正在传的文件名与单文件百分比 */
const upload_progress = ref({
    is_active: false,
    current_name: '',
    current_percent: 0,
    overall_percent: 0,
    finished: 0,
    total: 0,
});

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

    upload_error.value = '';
    upload_success.value = '';
    // 前端自行限制：图片 ≤ 10MB，格式白名单同后端
    for (const file of files) {
        if (!IMAGE_MIME_WHITELIST.includes(file.type)) {
            upload_error.value = `「${file.name}」格式不支持，仅支持 JPG/PNG/GIF/WebP`;
            return;
        }
        if (file.size > MAX_IMAGE_SIZE) {
            upload_error.value = `「${file.name}」超过 10MB`;
            return;
        }
    }

    // 综合进度 = 已完成文件字节 + 当前文件已发送字节 / 总字节
    const total_bytes = files.reduce((sum, f) => sum + f.size, 0);
    let done_bytes = 0;
    upload_progress.value = {
        is_active: true,
        current_name: files[0]?.name ?? '',
        current_percent: 0,
        overall_percent: 0,
        finished: 0,
        total: files.length,
    };

    try {
        // 后端为单文件接口，逐个上传
        for (let i = 0; i < files.length; i++) {
            const file = files[i];
            if (!file) continue;
            upload_progress.value.current_name = file.name;
            upload_progress.value.current_percent = 0;
            upload_progress.value.finished = i;

            await apiService.uploadWithProgress<UploadResult>('/image/', file, (percent) => {
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
        upload_success.value = `已上传 ${files.length} 张图片`;
        page.value = 1;
        await getImageList();
    } catch (error) {
        upload_error.value = api_error_detail(error, '上传失败，请稍后重试');
    } finally {
        upload_progress.value.is_active = false;
    }
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

const format_size = (bytes: number) => {
    if (bytes >= 1024 * 1024) return (bytes / 1024 / 1024).toFixed(1) + ' MB';
    if (bytes >= 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return bytes + ' B';
};

onMounted(getImageList);
</script>

<template>
    <main class="flex-1 overflow-y-auto p-6">
        <div class="flex items-center justify-end mb-2">
            <label class="btn btn-main btn-primary cursor-pointer"
                :class="upload_progress.is_active ? 'opacity-60 cursor-not-allowed' : ''">
                {{ upload_progress.is_active ? '上传中...' : '+ 上传照片' }}
                <input type="file" accept="image/jpeg,image/png,image/gif,image/webp" multiple class="hidden"
                    :disabled="upload_progress.is_active" @change="pick_files" />
            </label>
        </div>
        <p class="mb-4 text-xs text-base-content/40">支持 JPG / PNG / GIF / WebP，单张 ≤ 10MB</p>

        <!-- 上传进度：发送到 100% 后服务端仍在生成 WebP 预览，完成前保持进度条可见 -->
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
                    <p class="text-xs text-base-content/60">{{ format_size(image.size_bytes) }} · 浏览 {{ image.view }}</p>
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
