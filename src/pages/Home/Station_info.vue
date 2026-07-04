<script setup lang="ts">
import { storeToRefs } from 'pinia';
import { useStationrStore } from '@/store/station';

const station_store = useStationrStore()
const { station_array, url_head } = storeToRefs(station_store)
</script>

<template>
    <div class="mx-auto my-4 w-7xl">
        <div class="flex items-center py-4">
            <span class="h-5 w-1 rounded bg-primary mr-3"></span>
            <div>
                <p class="text-xs text-gray-500">Station Info</p>
                <h2 class="text-lg font-semibold text-gray-900">泵站信息</h2>
            </div>
        </div>

        <div class=" grid grid-cols-4 gap-4">
            <div v-for="(station, index) in station_array" :key="index"
                class="bg-white rounded-lg shadow-xs shadow-slate-200 ring-1 ring-border flex flex-col overflow-hidden transition-transform duration-300 hover:-translate-y-2">
                <div class="overflow-hidden h-52">
                    <img class="w-full h-full" :src="url_head + 'image/' + station.thumb" alt="pic">
                </div>
                <div class="p-4 flex flex-col gap-2">
                    <div class="flex items-center">
                        <div class="h-4 w-0.5 bg-primary mr-3 rounded"></div>
                        <div class="font-bold text-red-800">{{
                            station.station_name }}
                        </div>
                    </div>

                    <div class="flex flex-row justify-around my-4">
                        <div class="text-center">
                            <div class="text-sm text-gray-500"><span class="text-gray-800 text-lg">{{
                                station.zhuangji
                                    }}</span> 台
                            </div>
                            <div class="text-gray-500 text-sm">机组</div>
                        </div>

                        <div class="text-center">
                            <div class="text-sm text-gray-500"><span class="text-gray-800 text-lg">{{
                                station.zongrongliang
                                    }}</span> kw
                            </div>
                            <div class="text-gray-500 text-sm">容量</div>
                        </div>

                        <div class="text-center">
                            <div class="text-sm text-gray-500"><span class="text-gray-800 text-lg">{{
                                station.liuliang
                                    }}</span>
                                m<sup>3</sup>/s
                            </div>
                            <div class="text-gray-500 text-sm">流量</div>
                        </div>
                    </div>

                    <RouterLink :to="{ name: 'Station', query: { index: index } }"
                        class="text-red-700 text-sm text-right px-4 flex justify-end">查看详情
                        <svg class="w-4 h-4 ml-2" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" fill="none"
                            stroke-linecap="round" stroke-linejoin="round">
                            <path d="M5 12h14"></path>
                            <path d="M12 5l7 7-7 7"></path>
                        </svg>
                    </RouterLink>
                </div>
            </div>
        </div>
    </div>
</template>