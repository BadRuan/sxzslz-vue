<script setup lang="ts">
import { onMounted } from 'vue';
import { storeToRefs } from 'pinia';
import { useDocumentStore } from '@/store/document';
import { url_prefix } from '@/utils/baseInfo';
import { date_text } from '@/utils/formatters';

const document_store = useDocumentStore();
const { documents } = storeToRefs(document_store);

onMounted(async () => {
    if (documents.value.length == 0) {
        await document_store.checkDocument();
    }
})

</script>

<template>
    <section class="bg-background">
        <div class="w-7xl m-auto">
            <h1 class="text-center py-8 text-2xl font-bold">文件下载排行</h1>
            <ul class="grid grid-cols-3 gap-8 justify-around">
                <li class="p-4 group transition-transform duration-300 hover:-translate-y-2"
                    v-for="(file, index) in documents" :key="index">
                    <div class="flex flex-row">
                        <svg class="text-primary mr-4" xmlns="http://www.w3.org/2000/svg"
                            xmlns:xlink="http://www.w3.org/1999/xlink" width="24" height="24" viewBox="0 0 24 24"
                            fill="none">
                            <path d="M4 3L4 21L20 21L20 9L14 3L4 3Z" stroke="currentColor" stroke-width="2"
                                stroke-linejoin="round" stroke-linecap="round"></path>
                            <path d="M14 3L14 9L20 9L14 3Z" stroke="currentColor" stroke-width="2"
                                stroke-linejoin="round" stroke-linecap="round"></path>
                            <path d="M8 12L10 17L12 12L14 17L16 12" stroke="currentColor" stroke-width="2"
                                stroke-linejoin="round" stroke-linecap="round"></path>
                        </svg>
                        <div>
                            <a :href="url_prefix.document_prefix + file.slug" target="_blank"
                                class="group-hover:text-primary font-bold">{{ file.raw_filename }}</a>

                            <div class="my-4 flex gap-4 flex-row justify-between">
                                <div class="text-gray-400">上传于：<span class="text-gray-600">{{
                                    date_text(file.uploaded_at) }}</span></div>
                                <div class="text-gray-400">下载: <span class="text-gray-600">{{ file.view }} 次</span>
                                </div>
                            </div>
                        </div>
                    </div>

                </li>
            </ul>
        </div>
    </section>
</template>