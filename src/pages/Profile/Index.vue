<script setup lang="ts">
import { onMounted, ref } from 'vue';
import apiService from '@/utils/apiService';
import { storeToRefs } from 'pinia';
import { useRoute } from 'vue-router';
import { useBaseinfoStore } from '@/store/base';
import { date_text, category_text } from '@/utils/formatters';
import { type ArticleModel } from '@/store/article';
import { url_prefix } from '@/utils/baseInfo';

const route = useRoute();
const user_id = Number(route.params.id);
console.log(user_id);
const head_img = '192878a6502947989a25d49d55f39266.jpg';
interface ProfileModel {
    post_count: Number
    view_count: Number
    latest_article: ArticleModel[]
};
const profile_data = ref<ProfileModel>();
const getProfileData = async (user_id: Number) => {
    try {
        const res = await apiService.get('/profile/' + user_id + '/');
        profile_data.value = res;
    } catch (error) {
        console.error('获取失败:', error)
    }
}
const baseinfo_store = useBaseinfoStore();
const { categories, users } = storeToRefs(baseinfo_store);

const nickname_text = (user_id: number | undefined) => {
    if (!user_id) {
        return '';
    } else {
        for (let item of users.value) {
            if (user_id == item.id) {
                return item.nickname
            }
        }
        return ''
    }
}


onMounted(
    async () => {
        getProfileData(user_id);
        baseinfo_store.checkBaseinfo();
    }
);
</script>

<template>
    <main class="bg-background flex flex-col gap-8 py-4">
        <div class="bg-white m-auto w-7xl rounded shadow flex flex-row justify-between p-8">
            <div class="flex flex-row gap-8">
                <div class="w-24 h-24 rounded-2xl">
                    <img :src="url_prefix.pic_prefix + head_img" alt="head_img">
                </div>
                <div class="flex flex-col">
                    <div class="flex flex-row items-center">
                        <span class="text-2xl font-bold text-gray-800">{{ nickname_text(user_id) }}</span><img
                            class="h-6 w-6 mx-4" src="/icon/v.png" alt="v">
                    </div>
                    <span class="py-4 text-gray-700">暂无简介及其他补充信息</span>
                </div>
            </div>
            <div class="flex flex-row p-4 gap-12">
                <div class="flex flex-col items-center">
                    <span class="text-gray-500">发布文章</span>
                    <span class="text-gray-800 text-2xl">{{ profile_data?.post_count }}</span>
                </div>
                <div class="flex flex-col items-center">
                    <span class="text-gray-500">文章累计阅读量</span>
                    <span class="text-gray-800 text-2xl">{{ profile_data?.view_count }}</span>
                </div>
            </div>
        </div>

        <div class="bg-white w-7xl m-auto py-4 px-8 rounded shadow">
            <div class="font-bold mx-2">文章动态</div>
            <ul class="divide-y divide-border divide-dashed">
                <li v-for="(article, index) in profile_data?.latest_article" :key="index"
                    class="px-5 py-3 flex items-center justify-between">
                    <div class="flex flex-row items-center">
                        <div class="bg-gray-400 w-1 h-1 rounded-xl"></div>
                        <div class="px-4 py-2 mr-4 text-sm font-bold rounded-2xl text-gray-700">{{
                            category_text(article.category_id, categories) }}</div>
                        <RouterLink :to="{ name: 'ArticleDetail', params: { slug: article.slug } }"
                            class="text-base text-gray-500 hover:text-primary-400 truncate">
                            <span class="font-bold">{{ article.title }}</span>
                        </RouterLink>
                    </div>
                    <time class="ml-4 shrink-0 text-xs text-gray-400">{{ date_text(article.create_at) }}</time>
                </li>
            </ul>
        </div>
    </main>
</template>