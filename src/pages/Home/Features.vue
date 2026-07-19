<script setup lang="ts">
import { pic_prefix } from '@/utils/baseInfo';
</script>

<template>
    <section class="mx-auto w-7xl">
        <div class="flex items-center py-4">
            <span class="h-5 w-1 rounded bg-primary mr-3"></span>
            <div>
                <p class="text-xs text-gray-500">Station Features</p>
                <h2 class="text-lg font-semibold text-gray-900">泵站特色</h2>
            </div>
        </div>

        <div class="text-gray-600 body-font mb-8">
            <div class="container px-5 py-4 mx-auto">
                <div class="flex flex-wrap -m-4">
                    <div class="p-4 lg:w-1/3">
                        <div
                            class="h-full bg-white bg-opacity-75 rounded-lg overflow-hidden text-center relative shadow transition-transform duration-300 hover:-translate-y-2">
                            <img :src="pic_prefix + 'b4c701117a514224988b936e51aa8867.jpg'" alt="">
                            <div class="m-8">
                                <h2 class="tracking-widest text-sm title-font font-medium text-gray-400 my-4 ">
                                    运管养护</h2>
                                <h1 class="title-font sm:text-2xl text-xl font-medium text-gray-900 mb-3">
                                    坚持月度安全检制度，筑牢常态化安全防线</h1>
                                <p class="leading-relaxed mb-3">
                                    为确保排涝泵站托管工作安全高效运行，沈巷镇水利站组织技术人员对管辖崩站及防汛物资仓库等开展每月检查，全面强化监管工作，织密安全责任网。</p>
                                <RouterLink :to="{ name: 'ArticleDetail', params: { slug: '3fae1fcd32904f40' } }"
                                    class="text-red-700 inline-flex items-center hover:cursor-pointer">了解更多<svg
                                        class="w-4 h-4 ml-2" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"
                                        fill="none" stroke-linecap="round" stroke-linejoin="round">
                                        <path d="M5 12h14"></path>
                                        <path d="M12 5l7 7-7 7"></path>
                                    </svg>
                                </RouterLink>
                            </div>
                        </div>
                    </div>
                    <div class="p-4 lg:w-1/3">
                        <div
                            class="h-full bg-white bg-opacity-75 rounded-lg overflow-hidden text-center relative shadow transition-transform duration-300 hover:-translate-y-2">
                            <img :src="pic_prefix + '5a0605d992e944eab6c8b623e6465337.png'" alt="">
                            <div class="m-8">
                                <h2 class="tracking-widest text-sm title-font font-medium text-gray-400 my-4 ">
                                    安全生产</h2>
                                <h1 class="title-font sm:text-2xl text-xl font-medium text-gray-900 mb-3">
                                    泵站电气设备操作“五防”：筑牢水利枢纽的安全防线</h1>
                                <p class="leading-relaxed mb-3">
                                    在泵站的日常运行与维护中，电气设备的安全操作是保障整个水利枢纽平稳运行的核心环节。泵站内高压开关柜、变压器等电气设备密集，操作环境复杂</p>
                                <RouterLink :to="{ name: 'ArticleDetail', params: { slug: 'c2efcff95b2c48be' } }"
                                    class="text-red-700 inline-flex items-center hover:cursor-pointer">了解更多<svg
                                        class="w-4 h-4 ml-2" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"
                                        fill="none" stroke-linecap="round" stroke-linejoin="round">
                                        <path d="M5 12h14"></path>
                                        <path d="M12 5l7 7-7 7"></path>
                                    </svg>
                                </RouterLink>
                            </div>
                        </div>
                    </div>
                    <div class="p-4 lg:w-1/3">
                        <div
                            class="h-full bg-white bg-opacity-75 rounded-lg overflow-hidden text-center relative shadow transition-transform duration-300 hover:-translate-y-2">
                            <img :src="pic_prefix + '52491d5c35d04dfc91157c59da600639.JPG'" alt="">
                            <div class="m-8">
                                <h2 class="tracking-widest text-sm title-font font-medium text-gray-400 my-4 ">
                                    标准化运行</h2>
                                <h1 class="title-font sm:text-2xl text-xl font-medium text-gray-900 mb-3">
                                    泵站运行管理：从传统值守迈向智慧运维的新跨越</h1>
                                <p class="leading-relaxed mb-3">
                                    泵站作为水利枢纽与城市供水、排涝系统的“心脏”，其运行管理水平直接关系到防洪安全、供水保障以及生态环境的持续改善。
                                </p>
                                <RouterLink :to="{ name: 'ArticleDetail', params: { slug: '2b23b332f0af406a' } }"
                                    class="text-red-700 inline-flex items-center hover:cursor-pointer">了解更多<svg
                                        class="w-4 h-4 ml-2" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"
                                        fill="none" stroke-linecap="round" stroke-linejoin="round">
                                        <path d="M5 12h14"></path>
                                        <path d="M12 5l7 7-7 7"></path>
                                    </svg>
                                </RouterLink>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

        </div>
    </section>
</template>