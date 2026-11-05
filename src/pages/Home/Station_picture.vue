<script setup lang="ts">
import { storeToRefs } from 'pinia';
import { useStationStore } from '@/store/station';
import { url_prefix } from '@/utils/baseInfo';
import TitleComponent from '@/components/TitleComponent.vue';

const station_store = useStationStore();
const { station_array } = storeToRefs(station_store);

/**
 * 影像取自带标题的站区图集（数据里本来就有 title，不另造文案）：
 * 把所有泵站的图集汇成一池，每次加载洗牌后取 6 张，首图固定占两格作为版面锚点。
 */
const gallery = (() => {
    const pictures = station_array.value
        .flatMap((station) => (station.station_pic_list ?? []).map((pic) => ({
            ...pic,
            station_name: station.station_name,
        })))
        .filter((pic) => Boolean(pic.src));
    const pool = [...pictures];
    const shuffled: typeof pictures = [];
    while (shuffled.length < 6 && pool.length) {
        const [picked] = pool.splice(Math.floor(Math.random() * pool.length), 1);
        if (picked) {
            shuffled.push(picked);
        }
    }
    return shuffled;
})();
</script>

<template>
    <section class="bg-neutral py-16 sm:py-20">
        <div class="page-container">
            <TitleComponent invert>
                <template #first>泵站风光</template>
                <template #second>Station Picture</template>
                <template #action>
                    <span class="text-sm text-white/55">站区实景影像</span>
                </template>
            </TitleComponent>

            <div v-if="gallery.length" class="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4">
                <figure v-for="(pic, index) in gallery" :key="`${pic.src}-${index}`"
                    class="group relative overflow-hidden rounded-xl bg-white/5"
                    :class="index === 0 ? 'col-span-2 aspect-[16/10] sm:col-span-2' : 'aspect-[4/3]'">
                    <img :src="url_prefix.pic_prefix + pic.src" :alt="pic.title"
                        loading="lazy" decoding="async"
                        class="h-full w-full object-cover opacity-90 transition duration-500 ease-out group-hover:scale-[1.04] group-hover:opacity-100" />
                    <!-- 底部渐隐 + 标题：静态时干净，悬浮时给出图注 -->
                    <div class="pointer-events-none absolute inset-0 bg-gradient-to-t from-neutral/75 via-transparent to-transparent opacity-90">
                    </div>
                    <figcaption class="absolute inset-x-0 bottom-0 flex items-end justify-between gap-3 p-4">
                        <span class="text-sm font-medium text-white">{{ pic.title }}</span>
                        <span class="hidden text-[0.6875rem] text-white/60 sm:block">{{ pic.station_name }}</span>
                    </figcaption>
                </figure>
            </div>

            <p v-else class="mt-8 text-sm text-white/55">暂无站区影像</p>
        </div>
    </section>
</template>
