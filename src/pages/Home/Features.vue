<script setup lang="ts">
import { url_prefix } from '@/utils/baseInfo';
import TitleComponent from '@/components/TitleComponent.vue';

// 三篇专题为固定策划内容（slug 与配图随文章一起维护），此处仅做数据化以免模板重复
const features = [
    {
        slug: '3fae1fcd32904f40',
        image: 'b4c701117a514224988b936e51aa8867.jpg',
        label: '运管养护',
        title: '坚持月度安全检查制度，筑牢常态化安全防线',
        excerpt: '为确保排涝泵站托管工作安全高效运行，沈巷镇水利站组织技术人员对管辖泵站及防汛物资仓库等开展每月检查，全面强化监管工作，织密安全责任网。',
    },
    {
        slug: 'c2efcff95b2c48be',
        image: '5a0605d992e944eab6c8b623e6465337.png',
        label: '安全生产',
        title: '泵站电气设备操作“五防”：筑牢水利枢纽的安全防线',
        excerpt: '在泵站的日常运行与维护中，电气设备的安全操作是保障整个水利枢纽平稳运行的核心环节。泵站内高压开关柜、变压器等电气设备密集，操作环境复杂。',
    },
    {
        slug: '2b23b332f0af406a',
        image: '52491d5c35d04dfc91157c59da600639.JPG',
        label: '标准化运行',
        title: '泵站运行管理：从传统值守迈向智慧运维的新跨越',
        excerpt: '泵站作为水利枢纽与城市供水、排涝系统的“心脏”，其运行管理水平直接关系到防洪安全、供水保障以及生态环境的持续改善。',
    },
];
</script>

<template>
    <section class="bg-base-100 section-y">
        <div class="page-container">
            <TitleComponent>
                <template #first>泵站特色</template>
                <template #second>Station Features</template>
            </TitleComponent>

            <div class="mt-8 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                <RouterLink v-for="feature in features" :key="feature.slug"
                    :to="{ name: 'ArticleDetail', params: { slug: feature.slug } }"
                    class="group flex flex-col overflow-hidden rounded-box border border-base-300 bg-base-100 card-hover hover:-translate-y-1 hover:border-primary/25 hover:shadow-[var(--shadow-lift)]">
                    <div class="relative aspect-[16/10] overflow-hidden bg-base-300">
                        <img :src="url_prefix.pic_prefix + feature.image" :alt="feature.title"
                            loading="lazy" decoding="async"
                            class="h-full w-full object-cover transition-transform duration-500 ease-out group-hover:scale-[1.04]" />
                    </div>

                    <div class="flex flex-1 flex-col p-6 sm:p-7">
                        <p class="eyebrow text-primary/70">{{ feature.label }}</p>
                        <h3 class="mt-2.5 text-[1.05rem] font-semibold leading-snug tracking-tight text-base-content transition-colors duration-200 group-hover:text-primary">
                            {{ feature.title }}
                        </h3>
                        <p class="mt-3 line-clamp-3 flex-1 text-sm leading-6 text-base-content/55">{{ feature.excerpt }}</p>
                        <span
                            class="mt-5 inline-flex items-center gap-1.5 text-xs font-medium text-primary/80 transition-transform duration-200 group-hover:translate-x-0.5">
                            阅读全文
                            <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24"
                                fill="none" aria-hidden="true">
                                <path d="M5 12h14M13 6l6 6-6 6" stroke="currentColor" stroke-width="2"
                                    stroke-linecap="round" stroke-linejoin="round"></path>
                            </svg>
                        </span>
                    </div>
                </RouterLink>
            </div>
        </div>
    </section>
</template>
