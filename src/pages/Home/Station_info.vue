<script setup lang="ts">
import TitleComponent from '@/components/TitleComponent.vue';
import { storeToRefs } from 'pinia';
import { useStationStore } from '@/store/station';
import { url_prefix } from '@/utils/baseInfo';
const station_store = useStationStore();
const { station_array } = storeToRefs(station_store);
</script>

<template>
    <section class="bg-base-100 section-y">
        <div class="page-container">
            <TitleComponent>
                <template #first>泵站信息</template>
                <template #second>Station Info</template>
                <template #action>
                    <span class="text-sm text-base-content/55">
                        共 <span class="num font-semibold text-base-content/70">{{ station_array.length }}</span> 座在册泵站
                    </span>
                </template>
            </TitleComponent>

            <div class="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-4">
                <RouterLink v-for="(station, index) in station_array" :key="index"
                    :to="{ name: 'Station', query: { index: index } }"
                    class="group flex flex-col overflow-hidden rounded-box border border-base-300 bg-base-100 card-hover hover:-translate-y-1 hover:border-ink/25 hover:shadow-[var(--shadow-lift)]">

                    <!-- 站区实景：站名压在图上，图文一体 -->
                    <div class="relative aspect-[4/3] overflow-hidden bg-base-300">
                        <img class="h-full w-full object-cover transition-transform duration-500 ease-out group-hover:scale-[1.04]"
                            :src="url_prefix.pic_prefix + station.thumb" :alt="station.station_name + '实景'">
                        <div class="pointer-events-none absolute inset-0 bg-gradient-to-t from-neutral/75 via-neutral/15 to-transparent">
                        </div>
                        <span
                            class="absolute right-3 top-3 rounded-full bg-white/15 px-2.5 py-1 text-[0.6875rem] text-white backdrop-blur-sm">
                            {{ station.birth_day }} 年建
                        </span>
                        <h3 class="absolute inset-x-0 bottom-0 px-5 pb-4 text-[1.05rem] font-semibold tracking-tight text-white"
                            :title="station.station_name">
                            {{ station.station_name }}
                        </h3>
                    </div>

                    <div class="flex flex-1 flex-col p-5">
                        <p class="flex items-start gap-1.5 text-xs leading-5 text-base-content/60">
                            <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24"
                                fill="none" class="mt-0.5 shrink-0" aria-hidden="true">
                                <path d="M12 21s7-5.686 7-11a7 7 0 1 0-14 0c0 5.314 7 11 7 11Z" stroke="currentColor"
                                    stroke-width="1.7" stroke-linejoin="round"></path>
                                <circle cx="12" cy="10" r="2.4" stroke="currentColor" stroke-width="1.7"></circle>
                            </svg>
                            <span class="truncate" :title="station.station_location">{{ station.station_location }}</span>
                        </p>

                        <dl class="mt-4 grid grid-cols-3 gap-2 border-t border-base-300 pt-4">
                            <div>
                                <dd class="num text-lg font-semibold leading-none text-base-content">
                                    {{ station.zhuangji }}<span class="ml-0.5 text-[0.6875rem] font-normal text-base-content/55">台</span>
                                </dd>
                                <dt class="mt-1.5 text-[0.6875rem] tracking-wide text-base-content/55">机组</dt>
                            </div>
                            <div class="border-l border-base-300 pl-3">
                                <dd class="num text-lg font-semibold leading-none text-base-content">
                                    {{ station.zongrongliang }}<span class="ml-0.5 text-[0.6875rem] font-normal text-base-content/55">kW</span>
                                </dd>
                                <dt class="mt-1.5 text-[0.6875rem] tracking-wide text-base-content/55">容量</dt>
                            </div>
                            <div class="border-l border-base-300 pl-3">
                                <dd class="num text-lg font-semibold leading-none text-base-content">
                                    {{ station.liuliang }}<span class="ml-0.5 text-[0.6875rem] font-normal text-base-content/55">m³/s</span>
                                </dd>
                                <dt class="mt-1.5 text-[0.6875rem] tracking-wide text-base-content/55">流量</dt>
                            </div>
                        </dl>

                        <span
                            class="mt-4 inline-flex items-center gap-1 text-xs font-medium text-ink/80 transition-transform duration-200 group-hover:translate-x-0.5">
                            查看详情
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
