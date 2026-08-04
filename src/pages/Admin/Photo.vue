<script setup lang="ts">
import { onMounted } from 'vue';
import { storeToRefs } from 'pinia';
import { useAdminStore } from '@/store/admin';
import { url_prefix } from '@/utils/baseInfo';

const admin_store = useAdminStore();
const { image_list } = storeToRefs(admin_store);

onMounted(
    async () => {
        admin_store.getImageList();
    }
)
</script>
<template>
    <main class="flex-1 overflow-y-auto p-6">
        <div class="flex items-center justify-between mb-6">
            <h2 class="text-xl font-bold text-gray-900">照片管理</h2>
            <button id="uploadBtn"
                class="rounded-md bg-primary px-4 py-2 text-sm font-semibold text-white hover:bg-primary-dark transition">
                + 上传照片
            </button>
        </div>

        <!-- 筛选栏 -->
        <div class="flex items-center gap-3 mb-4">
            <select
                class="rounded-md border border-border px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40">
                <option value="">全部分组</option>
                <option value="station">站点照片</option>
                <option value="work">工作风采</option>
                <option value="activity">活动记录</option>
                <option value="other">其他</option>
            </select>
            <span class="text-sm text-gray-500">共 4 张照片</span>
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