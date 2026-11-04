<script setup lang="ts">
import { url_prefix } from '@/utils/baseInfo';
import TitleComponent from '@/components/TitleComponent.vue';

const default_author = url_prefix.pic_prefix + '192878a6502947989a25d49d55f39266.jpg';
const leader_author = url_prefix.pic_prefix + '4cefbb90ab8448e78322cf878423db0e.jpg';

// 团队信息原为模板重复三段，改为数据驱动，便于后续增补人员
const leaders = [
    { name: '余庆斌', role: '书记兼站长', duty: '主持局全面工作；负责党建、党风廉政建设、意识形态、审计工作。' },
    { name: '刘桂胜', role: '副站长', duty: '协助站长分管党建、党风廉政建设、意识形态工作。' },
    { name: '王健', role: '副站长', duty: '协助站长分管财务、机组维修、工程建设等。' },
];

const station_leaders = [
    { name: '周道清', station: '童子圩站' },
    { name: '张兵', station: '河南汤站' },
    { name: '俞仁虎', station: '大桥站' },
    { name: '奚敏', station: '姚郭站' },
    { name: '黄宏志', station: '臧墩一站' },
    { name: '张和友', station: '雍镇站' },
    { name: '蔡荣君', station: '老坝站、新坝站' },
];
</script>

<template>
    <div class="bg-base-200 section-y">
        <div class="page-container">
            <!-- 管理团队：照片 + 职责，三列在 xl 展开 -->
            <TitleComponent>
                <template #first>管理团队</template>
                <template #second>Leader Team</template>
            </TitleComponent>

            <div class="mt-8 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
                <article v-for="leader in leaders" :key="leader.name"
                    class="flex flex-col gap-5 rounded-box border border-base-300 bg-base-100 p-6 card-hover hover:-translate-y-0.5 hover:border-primary/25 hover:shadow-[var(--shadow-card)] sm:flex-row sm:items-start">
                    <img :alt="leader.name + '照片'"
                        class="h-28 w-28 shrink-0 rounded-xl object-cover object-center"
                        :src="leader_author" loading="lazy">
                    <div class="min-w-0 flex-1">
                        <div class="flex flex-wrap items-center gap-2">
                            <h2 class="text-lg font-semibold tracking-tight text-base-content">{{ leader.name }}</h2>
                            <span class="rounded-full bg-primary/10 px-2.5 py-0.5 text-[0.6875rem] font-medium text-primary">
                                {{ leader.role }}
                            </span>
                        </div>
                        <p class="mt-3 text-sm leading-6 text-base-content/55">{{ leader.duty }}</p>
                    </div>
                </article>
            </div>

            <!-- 分站负责人：名录式排列，姓名与站点对齐更易扫读 -->
            <TitleComponent class="mt-14 sm:mt-16">
                <template #first>分站负责人</template>
                <template #second>Station Leader</template>
                <template #action>
                    <span class="text-sm text-base-content/40">{{ station_leaders.length }} 个站点</span>
                </template>
            </TitleComponent>

            <div class="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                <div v-for="person in station_leaders" :key="person.name"
                    class="flex items-center gap-3.5 rounded-box border border-base-300 bg-base-100 px-4 py-3.5 transition-colors duration-200 hover:border-primary/30">
                    <img :alt="person.name + '照片'"
                        class="h-11 w-11 shrink-0 rounded-full bg-base-200 object-cover object-center"
                        :src="default_author" loading="lazy">
                    <div class="min-w-0">
                        <h3 class="truncate text-sm font-semibold text-base-content">{{ person.name }}</h3>
                        <p class="truncate text-xs text-base-content/45">{{ person.station }}</p>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>
