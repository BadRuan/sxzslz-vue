<script setup lang="ts">
import TitleComponent from '@/components/TitleComponent.vue';
import { storeToRefs } from 'pinia';
import { useStationStore } from '@/store/station';
import { url_prefix } from '@/utils/baseInfo';
const station_store = useStationStore();
const { station_array } = storeToRefs(station_store);
</script>

<template>
    <div class="mx-auto py-4 w-7xl">
        <TitleComponent>
            <template #first>泵站信息</template>
            <template #second>Station Info</template>
        </TitleComponent>

        <div class="grid grid-cols-4 gap-4">
            <RouterLink v-for="(station, index) in station_array" :key="index"
                :to="{ name: 'Station', query: { index: index } }"
                class="bg-white rounded shadow-xs shadow-slate-200 group flex flex-col overflow-hidden transition-transform duration-300 hover:-translate-y-2">
                <div class="overflow-hidden h-52">
                    <img class="w-full h-full" :src="url_prefix.pic_prefix + station.thumb" alt="pic">
                </div>
                <div class="p-4 flex flex-col gap-2">
                    <div class="flex flex-row justify-between items-center">
                        <div class="flex items-center">
                            <div class="h-4 w-1 bg-secondary mr-3 rounded"></div>
                            <div class="font-bold text-foreground">{{
                                station.station_name }}
                            </div>
                        </div>
                        <div class="text-gray-500 pr-4">{{ station.suozailiuyu }}</div>
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
                </div>
            </RouterLink>
        </div>
    </div>
</template>