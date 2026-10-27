<script setup lang="ts">
import { onMounted, ref } from 'vue';
import apiService from '@/utils/apiService';
import { api_error_detail } from '@/store/article';
import { url_prefix } from '@/utils/baseInfo';
import dayjs from 'dayjs';
import AppPagination from '@/components/AppPagination.vue';
import CopyButton from '@/components/CopyButton.vue';

/** 图片列表项，字段与 GET /image/ 一致 */
export interface ImageModel {
    id: number,
    slug: string,
    raw_filename: string,
    mime_type: string,
    size_bytes: number,
    view: number,
    uploaded_at: string
};

const PAGE_SIZE = 30;
const IMAGE_MIME_WHITELIST = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
const MAX_IMAGE_SIZE = 10 * 1024 * 1024;

const image_list = ref<ImageModel[]>([]);
const total = ref(0);
const page = ref(1);
const has_next = ref(false);
const list_error = ref('');
const uploading = ref(false);
const upload_error = ref('');
const upload_success = ref('');

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

    uploading.value = true;
    try {
        // 后端为单文件接口，逐个上传
        for (const file of files) {
            await apiService.upload('/image/', file);
        }
        upload_success.value = `已上传 ${files.length} 张图片`;
        page.value = 1;
        await getImageList();
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

onMounted(getImageList);
</script>

<template>
    <main class="flex-1 overflow-y-auto p-6">
        <div class="flex items-center justify-end mb-2">
            <label class="btn btn-main btn-primary cursor-pointer"
                :class="uploading ? 'opacity-60 cursor-not-allowed' : ''">
                {{ uploading ? '上传中...' : '+ 上传照片' }}
                <input type="file" accept="image/jpeg,image/png,image/gif,image/webp" multiple class="hidden"
                    :disabled="uploading" @change="pick_files" />
            </label>
        </div>
        <p class="mb-4 text-xs text-base-content/40">支持 JPG / PNG / GIF / WebP，单张 ≤ 10MB</p>

        <p v-if="upload_error" role="alert" class="alert alert-error mb-4 text-sm">{{ upload_error }}</p>
        <p v-if="upload_success" role="alert" class="alert alert-success mb-4 text-sm">{{ upload_success }}</p>
        <p v-if="list_error" role="alert" class="alert alert-error mb-4 text-sm">{{ list_error }}</p>

        <!-- 照片网格 -->
        <!-- 内容区=视口−侧栏，lg 下 6 列每格仅 ~110px 无法辨图，xl 起才多列 -->
        <div class="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4 sm:gap-6">
            <div v-for="image in image_list" :key="image.id"
                class="card rounded-box border border-base-300 overflow-hidden group">
                <div class="relative overflow-hidden aspect-square">
                    <img :src="url_prefix.pic_prefix + image.slug" :alt="image.raw_filename"
                        class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                </div>
                <div class="p-3">
                    <p class="text-sm my-1 font-medium text-base-content truncate" :title="image.raw_filename">{{ image.raw_filename }}</p>
                    <p class="text-xs text-base-content/60">{{ format_size(image.size_bytes) }} · 浏览 {{ image.view }}</p>
                    <p class="text-xs text-base-content/40">{{ dayjs(image.uploaded_at).format('YYYY-MM-DD HH:mm') }}</p>
                    <div class="mt-1 flex flex-wrap items-center gap-x-1 gap-y-0.5">
                        <!-- 详情页会把相对路径 slug 自动补成 /api/image/，MD 里只写 slug 即可渲染 -->
                        <CopyButton :text="`![${image.raw_filename}](${image.slug})`" label="复制 md" />
                    </div>
                </div>
            </div>
        </div>

        <p v-if="!list_error && image_list.length === 0" class="py-16 text-center text-base-content/40">暂无图片</p>

        <AppPagination class="mt-8" :page="page" :has-next="has_next"
            :total="total" unit="张" @change="go_page" />
    </main>
</template>
