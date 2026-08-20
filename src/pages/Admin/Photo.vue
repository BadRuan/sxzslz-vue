<script setup lang="ts">
import { onMounted, ref } from 'vue';
import apiService from '@/utils/apiService';
import { url_prefix } from '@/utils/baseInfo';

export interface ImageModel {
    id: number,
    size: number,
    view: number,
    slug: string,
    mime_type: string,
    raw_filename: string,
    upload_at: string
};
const image_list = ref<ImageModel[]>([]);

const getImageList = async () => {
    try {
        const res = await apiService.get('/image/');
        image_list.value = res['data'];
    } catch (error) {
        console.error('获取管理后台图片列表失败:', error)
    }
}
onMounted(
    async () => {
        getImageList();
    }
)
</script>
<template>
    <main class="flex-1 overflow-y-auto p-6">
        <div class="flex items-center justify-between mb-6">
            <h2 class="text-xl font-bold text-gray-900">照片管理</h2>
            <button id="uploadBtn"
                class="rounded-md bg-primary-500 px-4 py-2 text-sm font-semibold text-white hover:bg-primary-400 transition">
                + 上传照片
            </button>
        </div>


        <!-- 照片网格 -->
        <div class="grid grid-cols-6 gap-6">
            <div v-for="(image, index) in image_list" :key="index"
                class="bg-white rounded-lg shadow-xs ring-1 ring-border overflow-hidden group">
                <div class="relative overflow-hidden">
                    <img :src="url_prefix.pic_prefix + image.slug" :alt="image.raw_filename"
                        class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                </div>
                <div class="p-4">
                    <p class="text-sm my-2 font-medium text-gray-900 truncate">{{ image.raw_filename }}</p>
                    <p class="text-xs text-gray-500 mt-0.5">浏览量：{{ image.view }}</p>
                </div>
            </div>
        </div>
    </main>
</template>