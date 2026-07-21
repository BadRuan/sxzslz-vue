<script setup lang="ts">
import { url_prefix } from '@/utils/baseInfo';
import TitleComponent from '@/components/TitleComponent.vue';
const default_author = url_prefix.pic_prefix + '192878a6502947989a25d49d55f39266.jpg'
const leader_author = url_prefix.pic_prefix + '4cefbb90ab8448e78322cf878423db0e.jpg'

</script>
<template>
    <section class="m-auto w-7xl">
        <div class="text-gray-600 body-font">
            <div class="container px-5 py-8 mx-auto">
                <TitleComponent>
                    <template #first>管理团队</template>
                    <template #second>Leader Team</template>
                </TitleComponent>

                <div class="flex  -m-4 py-8">
                    <div class="p-4 lg:w-1/3">
                        <div
                            class="h-full flex sm:flex-row flex-col items-center sm:justify-start justify-center text-center sm:text-left">
                            <img alt="team"
                                class="flex-shrink-0 rounded-lg w-48 h-48 object-cover object-center sm:mb-0 mb-4"
                                :src="leader_author">
                            <div class="flex-grow sm:pl-8">
                                <h2 class="title-font font-medium text-lg text-gray-900">余庆斌</h2>
                                <h3 class="text-gray-500 mb-3">书记兼站长</h3>
                                <p class="mb-4">主持局全面工作；负责党建、党风廉政建设、意识形态、审计工作。</p>

                            </div>
                        </div>
                    </div>
                    <div class="p-4 lg:w-1/3">
                        <div
                            class="h-full flex sm:flex-row flex-col items-center sm:justify-start justify-center text-center sm:text-left">
                            <img alt="team"
                                class="flex-shrink-0 rounded-lg w-48 h-48 object-cover object-center sm:mb-0 mb-4"
                                :src="leader_author">
                            <div class="flex-grow sm:pl-8">
                                <h2 class="title-font font-medium text-lg text-gray-900">刘桂胜</h2>
                                <h3 class="text-gray-500 mb-3">副站长</h3>
                                <p class="mb-4">协助站长分管党建、党风廉政建设、意识形态工作</p>
                            </div>
                        </div>
                    </div>
                    <div class="p-4 lg:w-1/3">
                        <div
                            class="h-full flex sm:flex-row flex-col items-center sm:justify-start justify-center text-center sm:text-left">
                            <img alt="team"
                                class="flex-shrink-0 rounded-lg w-48 h-48 object-cover object-center sm:mb-0 mb-4"
                                :src="leader_author">
                            <div class="flex-grow sm:pl-8">
                                <h2 class="title-font font-medium text-lg text-gray-900">王健</h2>
                                <h3 class="text-gray-500 mb-3">副站长</h3>
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
                        <div class="h-full flex items-center border-gray-200 border p-4 rounded-lg">
                            <img alt="team"
                                class="w-16 h-16 bg-gray-100 object-cover object-center flex-shrink-0 rounded-full mr-4"
                                :src="default_author">
                            <div class="flex-grow">
                                <h2 class="text-gray-900 title-font font-medium">周道清</h2>
                                <p class="text-gray-500">童子圩站</p>
                            </div>
                        </div>
                    </div>
                    <div class="p-2 lg:w-1/3 md:w-1/2 w-full">
                        <div class="h-full flex items-center border-gray-200 border p-4 rounded-lg">
                            <img alt="team"
                                class="w-16 h-16 bg-gray-100 object-cover object-center flex-shrink-0 rounded-full mr-4"
                                :src="default_author">
                            <div class="flex-grow">
                                <h2 class="text-gray-900 title-font font-medium">张兵</h2>
                                <p class="text-gray-500">河南汤站</p>
                            </div>
                        </div>
                    </div>
                    <div class="p-2 lg:w-1/3 md:w-1/2 w-full">
                        <div class="h-full flex items-center border-gray-200 border p-4 rounded-lg">
                            <img alt="team"
                                class="w-16 h-16 bg-gray-100 object-cover object-center flex-shrink-0 rounded-full mr-4"
                                :src="default_author">
                            <div class="flex-grow">
                                <h2 class="text-gray-900 title-font font-medium">俞仁虎</h2>
                                <p class="text-gray-500">大桥站</p>
                            </div>
                        </div>
                    </div>
                    <div class="p-2 lg:w-1/3 md:w-1/2 w-full">
                        <div class="h-full flex items-center border-gray-200 border p-4 rounded-lg">
                            <img alt="team"
                                class="w-16 h-16 bg-gray-100 object-cover object-center flex-shrink-0 rounded-full mr-4"
                                :src="default_author">
                            <div class="flex-grow">
                                <h2 class="text-gray-900 title-font font-medium">奚敏</h2>
                                <p class="text-gray-500">姚郭站</p>
                            </div>
                        </div>
                    </div>
                    <div class="p-2 lg:w-1/3 md:w-1/2 w-full">
                        <div class="h-full flex items-center border-gray-200 border p-4 rounded-lg">
                            <img alt="team"
                                class="w-16 h-16 bg-gray-100 object-cover object-center flex-shrink-0 rounded-full mr-4"
                                :src="default_author">
                            <div class="flex-grow">
                                <h2 class="text-gray-900 title-font font-medium">黄宏志</h2>
                                <p class="text-gray-500">臧墩一站</p>
                            </div>
                        </div>
                    </div>
                    <div class="p-2 lg:w-1/3 md:w-1/2 w-full">
                        <div class="h-full flex items-center border-gray-200 border p-4 rounded-lg">
                            <img alt="team"
                                class="w-16 h-16 bg-gray-100 object-cover object-center flex-shrink-0 rounded-full mr-4"
                                :src="default_author">
                            <div class="flex-grow">
                                <h2 class="text-gray-900 title-font font-medium">张和友</h2>
                                <p class="text-gray-500">雍镇站</p>
                            </div>
                        </div>
                    </div>
                    <div class="p-2 lg:w-1/3 md:w-1/2 w-full">
                        <div class="h-full flex items-center border-gray-200 border p-4 rounded-lg">
                            <img alt="team"
                                class="w-16 h-16 bg-gray-100 object-cover object-center flex-shrink-0 rounded-full mr-4"
                                :src="default_author">
                            <div class="flex-grow">
                                <h2 class="text-gray-900 title-font font-medium">蔡荣君</h2>
                                <p class="text-gray-500">老坝站、新坝站</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </section>
</template>