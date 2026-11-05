<script setup lang="ts">
import { url_prefix } from '@/utils/baseInfo';
import TitleComponent from '@/components/TitleComponent.vue';

// 机构职能：原有六条职责原文保留，仅做展示结构化的数据化
const duties = [
    '宣传、贯彻党和国家有关水利方针、政策等法律法规',
    '负责沈巷镇水利规划',
    '负责沈巷镇小型农田水利工程设计、施工等',
    '负责沈巷镇水利基本建设技术业务工作',
    '负责水政和水资源管理工作',
    '负责管扬水站的维修养护和管理工作',
];
</script>

<template>
    <section>
        <!-- 页头主视觉：横幅图 + 标题，替代原先「图片紧贴内容」的平铺观感 -->
        <div class="relative overflow-hidden bg-neutral">
            <div class="h-[20rem] w-full sm:h-[24rem]">
                <img class="h-full w-full object-cover opacity-85"
                    :src="url_prefix.pic_prefix + 'b8dc37b949384f73a03e7e515df58038.png'"
                    alt="沈巷镇水利站">
            </div>
            <div class="pointer-events-none absolute inset-0 bg-gradient-to-t from-neutral/95 via-neutral/45 to-neutral/10"></div>
            <div class="page-container absolute inset-x-0 bottom-0 pb-8 sm:pb-10">
                <p class="eyebrow text-white/65">About Us</p>
                <h1 class="mt-2.5 text-2xl font-bold tracking-tight text-white sm:text-[2rem]">
                    走进沈巷镇水利站
                </h1>
                <p class="mt-3 max-w-2xl text-sm leading-6 text-white/70">
                    负责全镇水利规划、小型农田水利工程建设与泵站运行管护，守护一方安澜。
                </p>
            </div>
        </div>

        <div class="bg-base-100 section-y">
            <div class="page-container">
                <TitleComponent>
                    <template #first>机构职能</template>
                    <template #second>Organizational Functions</template>
                    <template #action>
                        <span class="text-sm text-base-content/55">六项主要职责</span>
                    </template>
                </TitleComponent>

                <div class="mt-8 grid gap-4 sm:grid-cols-2 lg:gap-5">
                    <div v-for="(duty, index) in duties" :key="duty"
                        class="group flex items-start gap-4 rounded-box border border-base-300 bg-base-100 p-5 transition-colors duration-200 hover:border-primary/30 sm:p-6">
                        <!-- 序号 + 勾选图标：让职责清单有节奏，长文案也能对齐阅读 -->
                        <span class="num mt-0.5 shrink-0 text-xs font-medium tracking-widest text-primary/35">
                            0{{ index + 1 }}
                        </span>
                        <span class="min-w-0 flex-1 text-sm leading-6 text-base-content/75">{{ duty }}</span>
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24"
                            fill="none" class="mt-1 shrink-0 text-primary/30 transition-colors duration-200 group-hover:text-primary/70"
                            aria-hidden="true">
                            <path d="M20 6 9 17l-5-5" stroke="currentColor" stroke-width="2.2"
                                stroke-linecap="round" stroke-linejoin="round"></path>
                        </svg>
                    </div>
                </div>
            </div>
        </div>
    </section>
</template>
