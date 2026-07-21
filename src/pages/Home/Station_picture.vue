<script setup lang="ts">
import { url_prefix } from '@/utils/baseInfo';
import TitleComponent from '@/components/TitleComponent.vue';
</script>
<template>
    <div class="bg-neutral-100 py-4">
        <section class="mx-auto w-7xl">
            <TitleComponent>
                <template #first>泵站风光</template>
                <template #second>Station Picture</template>
            </TitleComponent>

            <div class="flex py-8 flex-wrap md:-m-2 -m-1">
                <div class="flex flex-wrap w-1/2">
                    <div class="md:p-2 p-1 w-1/2">
                        <img alt="gallery"
                            class="w-full object-cover h-full object-center block rounded shadow hover:scale-102 ease-in-out transition-all duration-500"
                            :src="url_prefix.pic_prefix + 'f4b1736834f24101bf8e57b509af9933.JPG'">
                    </div>
                    <div class="md:p-2 p-1 w-1/2">
                        <img alt="gallery"
                            class="w-full object-cover h-full object-center block rounded shadow hover:scale-102 ease-in-out transition-all duration-500"
                            :src="url_prefix.pic_prefix + '6809a9860845474e86516b55233c09b0.JPG'">
                    </div>
                    <div class="md:p-2 p-1 w-full">
                        <img alt="gallery"
                            class="w-full h-full object-cover object-center block rounded shadow hover:scale-102 ease-in-out transition-all duration-500"
                            :src="url_prefix.pic_prefix + '045f78ab69b94a5ca242ea9caf40d770.JPG'">
                    </div>
                </div>
                <div class="p-4 flex flex-wrap w-1/2">
                    <div class="md:p-2 p-1 w-full">
                        <img alt="gallery"
                            class="w-full h-full object-cover object-center block rounded shadow hover:scale-102 ease-in-out transition-all duration-500"
                            :src="url_prefix.pic_prefix + '7d40922d9eb1434d86b85aa39991dda5.JPG'">
                    </div>
                    <div class="md:p-2 p-1 w-1/2">
                        <img alt="gallery"
                            class="w-full object-cover h-full object-center block rounded shadow hover:scale-102 ease-in-out transition-all duration-500"
                            :src="url_prefix.pic_prefix + 'f61c97c382244114a16bea01416a29d8.JPG'">
                    </div>
                    <div class="md:p-2 p-1 w-1/2">
                        <img alt="gallery"
                            class="w-full object-cover h-full object-center block rounded shadow hover:scale-102 ease-in-out transition-all duration-500"
                            :src="url_prefix.pic_prefix + '4a1efd84fbe44ed484f3a7ef83270645.JPG'">
                    </div>
                </div>
            </div>

        </section>
    </div>
</template>