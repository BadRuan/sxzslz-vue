<script setup lang="ts">
import { storeToRefs } from 'pinia';
import type { ArticleItem } from '@/types/article'
import { useStationrStore } from '@/store/station';

const station_store = useStationrStore()
const { url_head } = storeToRefs(station_store)

</script>
<template>
    <div class="bg-neutral-100 py-4">
        <section class="mx-auto w-7xl">
            <div class="flex items-center py-4">
                <span class="h-5 w-1 rounded bg-primary mr-3"></span>
                <div>
                    <p class="text-xs text-gray-500">Station Picture</p>
                    <h2 class="text-lg font-semibold text-gray-900">泵站风光</h2>
                </div>
            </div>

            <div class="flex py-8 flex-wrap md:-m-2 -m-1">
                <div class="flex flex-wrap w-1/2">
                    <div class="md:p-2 p-1 w-1/2">
                        <img alt="gallery"
                            class="w-full object-cover h-full object-center block rounded shadow hover:scale-102 ease-in-out transition-all duration-500"
                            :src="url_head + 'image/f4b1736834f24101bf8e57b509af9933.JPG'">
                    </div>
                    <div class="md:p-2 p-1 w-1/2">
                        <img alt="gallery"
                            class="w-full object-cover h-full object-center block rounded shadow hover:scale-102 ease-in-out transition-all duration-500"
                            :src="url_head + 'image/6809a9860845474e86516b55233c09b0.JPG'">
                    </div>
                    <div class="md:p-2 p-1 w-full">
                        <img alt="gallery"
                            class="w-full h-full object-cover object-center block rounded shadow hover:scale-102 ease-in-out transition-all duration-500"
                            :src="url_head + 'image/045f78ab69b94a5ca242ea9caf40d770.JPG'">
                    </div>
                </div>
                <div class="p-4 flex flex-wrap w-1/2">
                    <div class="md:p-2 p-1 w-full">
                        <img alt="gallery"
                            class="w-full h-full object-cover object-center block rounded shadow hover:scale-102 ease-in-out transition-all duration-500"
                            :src="url_head + 'image/7d40922d9eb1434d86b85aa39991dda5.JPG'">
                    </div>
                    <div class="md:p-2 p-1 w-1/2">
                        <img alt="gallery"
                            class="w-full object-cover h-full object-center block rounded shadow hover:scale-102 ease-in-out transition-all duration-500"
                            :src="url_head + 'image/f61c97c382244114a16bea01416a29d8.JPG'">
                    </div>
                    <div class="md:p-2 p-1 w-1/2">
                        <img alt="gallery"
                            class="w-full object-cover h-full object-center block rounded shadow hover:scale-102 ease-in-out transition-all duration-500"
                            :src="url_head + 'image/4a1efd84fbe44ed484f3a7ef83270645.JPG'">
                    </div>
                </div>
            </div>

        </section>
    </div>
</template>