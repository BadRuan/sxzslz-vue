<script setup lang="ts">
import TitleComponent from '@/components/TitleComponent.vue';
import { storeToRefs } from 'pinia';
import { useStationStore } from '@/store/station';
import { url_prefix } from '@/utils/baseInfo';
const station_store = useStationStore();
const { station_array } = storeToRefs(station_store);
</script>

<template>
    <div class="mx-auto section-y w-7xl">
        <TitleComponent>
            <template #first>泵站信息</template>
            <template #second>Station Info</template>
        </TitleComponent>

        <div class="grid grid-cols-4 gap-6 mt-6">
            <RouterLink v-for="(station, index) in station_array" :key="index"
                :to="{ name: 'Station', query: { index: index } }"
                class="card rounded-box card-hover group flex flex-col overflow-hidden hover:-translate-y-1 hover:shadow-md">
                <div class="overflow-hidden h-52">
                    <img class="w-full h-full transition-transform duration-500 ease-out-soft group-hover:scale-105"
                        :src="url_prefix.pic_prefix + station.thumb" alt="pic">
                </div>
                <div class="p-5 flex flex-col gap-2">

                    <div class="flex items-center">
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none"
                            class="text-primary mx-2">
                            <path fill="currentColor"
                                d="M18.9932 7.46811L15.4924 7.40095Q15.1059 7.39353 14.7711 7.20026Q14.4364 7.00699 14.2367 6.676L12.4281 3.67778C12.2337 3.35546 11.7663 3.35546 11.5719 3.67778L9.76328 6.676Q9.56363 7.00699 9.22887 7.20026Q8.89411 7.39353 8.50764 7.40095L5.00681 7.46811C4.63046 7.47533 4.39675 7.88013 4.57867 8.20967L6.27092 11.2751Q6.45774 11.6135 6.45774 12Q6.45774 12.3865 6.27092 12.7249L4.57867 15.7903C4.39675 16.1199 4.63046 16.5247 5.00681 16.5319L8.50764 16.5991Q8.89411 16.6065 9.22887 16.7997Q9.56363 16.993 9.76328 17.324L11.5719 20.3222C11.7663 20.6445 12.2337 20.6445 12.4281 20.3222L14.2367 17.324Q14.4364 16.993 14.7711 16.7997Q15.1059 16.6065 15.4924 16.5991L18.9932 16.5319C19.3695 16.5247 19.6032 16.1199 19.4213 15.7903L17.7291 12.7249Q17.5423 12.3865 17.5423 12Q17.5423 11.6135 17.7291 11.2751L19.4213 8.20967C19.6032 7.88013 19.3695 7.47533 18.9932 7.46811ZM19.0124 6.46829C20.1414 6.48995 20.8426 7.70434 20.2968 8.69296L18.6045 11.7584Q18.4711 12 18.6045 12.2416L20.2968 15.307C20.8426 16.2957 20.1414 17.51 19.0124 17.5317L15.5115 17.5989Q15.2356 17.6042 15.093 17.8405L13.2844 20.8387C12.7011 21.8057 11.2989 21.8057 10.7156 20.8387L8.90701 17.8405Q8.76443 17.6042 8.48846 17.5989L4.98763 17.5317C3.85857 17.51 3.15745 16.2957 3.70322 15.307L5.39547 12.2416Q5.52887 12 5.39547 11.7584L3.70322 8.69296C3.15745 7.70434 3.85857 6.48995 4.98763 6.46829L8.48846 6.40113Q8.76443 6.39584 8.90701 6.15948L10.7156 3.16126C11.2989 2.19429 12.7011 2.19429 13.2844 3.16126L15.093 6.15948Q15.2356 6.39584 15.5115 6.40113L19.0124 6.46829Z">
                            </path>
                            <circle cx="12" cy="12" r="2" stroke="currentColor" stroke-width="1"></circle>
                        </svg>
                        <div class="font-bold text-base-content/80">{{
                            station.station_name }}
                        </div>
                    </div>

                    <div class="flex flex-row justify-around my-4">
                        <div class="text-center">
                            <div class="text-sm text-base-content/60"><span class="text-base-content/90 text-lg">{{
                                station.zhuangji
                                    }}</span> 台
                            </div>
                            <div class="text-base-content/60 text-sm">机组</div>
                        </div>

                        <div class="text-center">
                            <div class="text-sm text-base-content/60"><span class="text-base-content/90 text-lg">{{
                                station.zongrongliang
                                    }}</span> kw
                            </div>
                            <div class="text-base-content/60 text-sm">容量</div>
                        </div>

                        <div class="text-center">
                            <div class="text-sm text-base-content/60"><span class="text-base-content/90 text-lg">{{
                                station.liuliang
                                    }}</span>
                                m<sup>3</sup>/s
                            </div>
                            <div class="text-base-content/60 text-sm">流量</div>
                        </div>
                    </div>
                </div>
            </RouterLink>
        </div>
    </div>
</template>