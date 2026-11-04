<script setup lang="ts">
import { computed } from 'vue';
import { storeToRefs } from 'pinia';
import { useStationStore } from '@/store/station';
import { url_prefix } from '@/utils/baseInfo';
import { name_category_id, to_second_level_id } from '@/utils/category';
import { useBaseinfoStore } from '@/store/base';
import { CATEGORY_NAMES } from '@/utils/categoryConfig';

const station_store = useStationStore();
const { station_array } = storeToRefs(station_store);

// 导航里的新闻入口与首页栏目共用同一套分类解析，避免两处 id 漂移
const baseinfo_store = useBaseinfoStore();
const { categories } = storeToRefs(baseinfo_store);
const news_category_id = computed(() =>
    to_second_level_id(categories.value, name_category_id(categories.value, CATEGORY_NAMES.news)));

/** 首屏主视觉用站区实景（首次进入泵站数据是本地静态 seed，可直接取） */
const hero_image = computed(() => {
    const thumb = station_array.value[0]?.thumb;
    return thumb ? url_prefix.pic_prefix + thumb : `${url_prefix.pic_prefix}f4b1736834f24101bf8e57b509af9933.JPG`;
});

const sum_of = (pick: (item: (typeof station_array.value)[number]) => unknown) =>
    station_array.value.reduce((total, item) => total + (Number(pick(item)) || 0), 0);

const stats = computed(() => {
    const flow = sum_of((s) => s.liuliang);
    return [
        { label: '在册泵站', value: station_array.value.length, unit: '座' },
        { label: '机组总数', value: sum_of((s) => s.zhuangji), unit: '台' },
        { label: '装机容量', value: sum_of((s) => s.zongrongliang), unit: 'kW' },
        { label: '排涝流量', value: Math.round(flow * 10) / 10, unit: 'm³/s' },
    ];
});

const format_value = (value: number) =>
    Number.isInteger(value) ? value.toLocaleString('zh-CN') : value.toFixed(1);
</script>

<template>
    <section class="relative isolate overflow-hidden bg-neutral">
        <img :src="hero_image" alt="沈巷镇水利站站区实景"
            class="absolute inset-0 -z-20 h-full w-full object-cover object-center" />
        <!-- 双层遮罩：横向保证左侧文字对比度，纵向压暗天地留出呼吸 -->
        <div class="absolute inset-0 -z-10 bg-gradient-to-r from-neutral via-neutral/85 to-neutral/25"></div>
        <div class="absolute inset-0 -z-10 bg-gradient-to-t from-neutral via-transparent to-neutral/45"></div>

        <div class="page-container relative flex min-h-[32rem] flex-col justify-center py-16 lg:min-h-[38rem] lg:py-24">
            <p class="eyebrow !text-white/60">
                <span class="inline-block size-1.5 rounded-full bg-accent" aria-hidden="true"></span>
                Shenxiang Water Station · 芜湖市鸠江区
            </p>

            <h1 class="mt-6 max-w-3xl text-[2.1rem] font-bold leading-[1.25] tracking-tight text-white sm:text-[2.75rem] lg:text-[3.25rem]">
                守一泓清水
                <span class="block text-white/95">护一方安澜</span>
            </h1>

            <p class="mt-6 max-w-xl text-[0.9375rem] leading-8 text-white/70 sm:text-base">
                沈巷镇水利站负责全镇水资源管理、防汛抗旱、灌溉排涝与水利工程运行维护，
                以泵站为节点织密区域水网，守好每一季汛期的安全底线。
            </p>

            <div class="mt-9 flex flex-wrap items-center gap-3">
                <RouterLink :to="{ name: 'About' }"
                    class="btn btn-main h-11 rounded-full border-0 bg-white px-7 text-neutral hover:bg-white/90">
                    走进水利站
                    <svg xmlns="http://www.w3.org/2000/svg" width="17" height="17" viewBox="0 0 24 24" fill="none"
                        aria-hidden="true">
                        <path d="M5 12h14M13 6l6 6-6 6" stroke="currentColor" stroke-width="1.8"
                            stroke-linecap="round" stroke-linejoin="round"></path>
                    </svg>
                </RouterLink>
                <RouterLink :to="{ name: 'ArticleList', query: { category: news_category_id } }"
                    class="btn btn-main h-11 rounded-full border-white/25 bg-white/5 px-7 text-white hover:border-white/50 hover:bg-white/10">
                    查看水利动态
                </RouterLink>
            </div>

            <!-- 关键数据：把“有多少站、多少机组”直接放到首屏，比任何形容词都可信 -->
            <dl class="mt-12 grid max-w-3xl grid-cols-2 gap-y-7 border-t border-white/15 pt-8 sm:grid-cols-4 sm:gap-0">
                <div v-for="(item, index) in stats" :key="item.label"
                    class="sm:border-l sm:border-white/10 sm:pl-6"
                    :class="index === 0 ? 'sm:!border-l-0 sm:!pl-0' : ''">
                    <dd class="flex items-baseline gap-1.5 text-white">
                        <span class="num text-[1.75rem] font-semibold leading-none sm:text-[2rem]">{{ format_value(item.value) }}</span>
                        <span class="text-xs font-medium text-white/50">{{ item.unit }}</span>
                    </dd>
                    <dt class="mt-2 text-xs tracking-wide text-white/55">{{ item.label }}</dt>
                </div>
            </dl>
        </div>
    </section>
</template>
