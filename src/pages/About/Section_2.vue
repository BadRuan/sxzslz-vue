<script setup lang="ts">
import { url_prefix } from '@/utils/baseInfo';
import TitleComponent from '@/components/TitleComponent.vue';
const default_author = url_prefix.pic_prefix + '192878a6502947989a25d49d55f39266.jpg'
const leader_author = url_prefix.pic_prefix + '4cefbb90ab8448e78322cf878423db0e.jpg'

</script>
<template>
    <section class="page-container">
        <div class="text-base-content/70 body-font">
            <div class="container px-5 py-8 mx-auto">
                <TitleComponent>
                    <template #first>管理团队</template>
                    <template #second>Leader Team</template>
                </TitleComponent>

                <div class="flex flex-wrap -m-4 py-8">
                    <!-- 1024 下三列图文横排会把文字挤成逐字竖排：两列(md)起、头像同步缩小，xl 起三列 -->
                    <div class="p-4 md:w-1/2 xl:w-1/3">
                        <div
                            class="h-full flex sm:flex-row flex-col items-center sm:justify-start justify-center text-center sm:text-left">
                            <img alt="team"
                                class="flex-shrink-0 rounded-lg w-32 h-32 xl:w-36 xl:h-36 object-cover object-center sm:mb-0 mb-4"
                                :src="leader_author">
                            <div class="flex-grow sm:pl-8">
                                <h2 class="title-font font-medium text-lg text-base-content">余庆斌</h2>
                                <h3 class="text-base-content/60 mb-3">书记兼站长</h3>
                                <p class="mb-4">主持局全面工作；负责党建、党风廉政建设、意识形态、审计工作。</p>

                            </div>
                        </div>
                    </div>
                    <div class="p-4 md:w-1/2 xl:w-1/3">
                        <div
                            class="h-full flex sm:flex-row flex-col items-center sm:justify-start justify-center text-center sm:text-left">
                            <img alt="team"
                                class="flex-shrink-0 rounded-lg w-32 h-32 xl:w-36 xl:h-36 object-cover object-center sm:mb-0 mb-4"
                                :src="leader_author">
                            <div class="flex-grow sm:pl-8">
                                <h2 class="title-font font-medium text-lg text-base-content">刘桂胜</h2>
                                <h3 class="text-base-content/60 mb-3">副站长</h3>
                                <p class="mb-4">协助站长分管党建、党风廉政建设、意识形态工作</p>
                            </div>
                        </div>
                    </div>
                    <div class="p-4 md:w-1/2 xl:w-1/3">
                        <div
                            class="h-full flex sm:flex-row flex-col items-center sm:justify-start justify-center text-center sm:text-left">
                            <img alt="team"
                                class="flex-shrink-0 rounded-lg w-32 h-32 xl:w-36 xl:h-36 object-cover object-center sm:mb-0 mb-4"
                                :src="leader_author">
                            <div class="flex-grow sm:pl-8">
                                <h2 class="title-font font-medium text-lg text-base-content">王健</h2>
                                <h3 class="text-base-content/60 mb-3">副站长</h3>
                                <p class="mb-4">协助站长分管财务、机组维修、工程建设等</p>
                            </div>
                        </div>
                    </div>
                </div>

                <TitleComponent>
                    <template #first>分站负责人</template>
                    <template #second>Station Leader</template>
                </TitleComponent>

                <div class="flex flex-wrap -m-2 py-8">
                    <div class="p-2 lg:w-1/3 md:w-1/2 w-full">
                        <div class="h-full flex items-center border-base-300 border p-4 rounded-lg">
                            <img alt="team"
                                class="w-16 h-16 bg-base-200 object-cover object-center flex-shrink-0 rounded-full mr-4"
                                :src="default_author">
                            <div class="flex-grow">
                                <h2 class="text-base-content title-font font-medium">周道清</h2>
                                <p class="text-base-content/60">童子圩站</p>
                            </div>
                        </div>
                    </div>
                    <div class="p-2 lg:w-1/3 md:w-1/2 w-full">
                        <div class="h-full flex items-center border-base-300 border p-4 rounded-lg">
                            <img alt="team"
                                class="w-16 h-16 bg-base-200 object-cover object-center flex-shrink-0 rounded-full mr-4"
                                :src="default_author">
                            <div class="flex-grow">
                                <h2 class="text-base-content title-font font-medium">张兵</h2>
                                <p class="text-base-content/60">河南汤站</p>
                            </div>
                        </div>
                    </div>
                    <div class="p-2 lg:w-1/3 md:w-1/2 w-full">
                        <div class="h-full flex items-center border-base-300 border p-4 rounded-lg">
                            <img alt="team"
                                class="w-16 h-16 bg-base-200 object-cover object-center flex-shrink-0 rounded-full mr-4"
                                :src="default_author">
                            <div class="flex-grow">
                                <h2 class="text-base-content title-font font-medium">俞仁虎</h2>
                                <p class="text-base-content/60">大桥站</p>
                            </div>
                        </div>
                    </div>
                    <div class="p-2 lg:w-1/3 md:w-1/2 w-full">
                        <div class="h-full flex items-center border-base-300 border p-4 rounded-lg">
                            <img alt="team"
                                class="w-16 h-16 bg-base-200 object-cover object-center flex-shrink-0 rounded-full mr-4"
                                :src="default_author">
                            <div class="flex-grow">
                                <h2 class="text-base-content title-font font-medium">奚敏</h2>
                                <p class="text-base-content/60">姚郭站</p>
                            </div>
                        </div>
                    </div>
                    <div class="p-2 lg:w-1/3 md:w-1/2 w-full">
                        <div class="h-full flex items-center border-base-300 border p-4 rounded-lg">
                            <img alt="team"
                                class="w-16 h-16 bg-base-200 object-cover object-center flex-shrink-0 rounded-full mr-4"
                                :src="default_author">
                            <div class="flex-grow">
                                <h2 class="text-base-content title-font font-medium">黄宏志</h2>
                                <p class="text-base-content/60">臧墩一站</p>
                            </div>
                        </div>
                    </div>
                    <div class="p-2 lg:w-1/3 md:w-1/2 w-full">
                        <div class="h-full flex items-center border-base-300 border p-4 rounded-lg">
                            <img alt="team"
                                class="w-16 h-16 bg-base-200 object-cover object-center flex-shrink-0 rounded-full mr-4"
                                :src="default_author">
                            <div class="flex-grow">
                                <h2 class="text-base-content title-font font-medium">张和友</h2>
                                <p class="text-base-content/60">雍镇站</p>
                            </div>
                        </div>
                    </div>
                    <div class="p-2 lg:w-1/3 md:w-1/2 w-full">
                        <div class="h-full flex items-center border-base-300 border p-4 rounded-lg">
                            <img alt="team"
                                class="w-16 h-16 bg-base-200 object-cover object-center flex-shrink-0 rounded-full mr-4"
                                :src="default_author">
                            <div class="flex-grow">
                                <h2 class="text-base-content title-font font-medium">蔡荣君</h2>
                                <p class="text-base-content/60">老坝站、新坝站</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </section>
</template>