<script setup lang="ts">
import Hero from './Hero.vue';
import News_summary from './News_summary.vue';
import Category_news from './Category_news.vue';
import Station_info from './Station_info.vue';
import Station_picture from './Station_picture.vue';
import Freatres from './Features.vue';
</script>

<template>
    <main class="flex flex-col">
        <Hero />
        <News_summary />
        <Category_news />
        <Station_info />
        <Station_picture />
        <Freatres />

        <!-- 收尾：把值班电话做成可识别的行动点，而不是躺在页脚里 -->
        <section class="bg-neutral">
            <div class="page-container flex flex-col items-start justify-between gap-6 py-12 md:flex-row md:items-center">
                <div>
                    <p class="eyebrow !text-white/45">Flood Control Duty</p>
                    <h2 class="mt-2.5 text-xl font-semibold tracking-tight text-white sm:text-2xl">
                        汛期 24 小时值守，有事请随时联系
                    </h2>
                    <p class="mt-2 text-sm text-neutral-content/55">
                        水情、工情与险情报告，请联系值班室：<a href="tel:0553-8976603"
                            class="num font-medium text-white underline decoration-white/30 underline-offset-4 hover:decoration-white">0553-8976603</a>
                    </p>
                </div>
                <RouterLink :to="{ name: 'About' }"
                    class="btn btn-main h-11 shrink-0 rounded-full border-white/25 bg-white/5 px-7 text-white hover:border-white/50 hover:bg-white/10">
                    了解机构职能
                    <svg xmlns="http://www.w3.org/2000/svg" width="17" height="17" viewBox="0 0 24 24" fill="none"
                        aria-hidden="true">
                        <path d="M5 12h14M13 6l6 6-6 6" stroke="currentColor" stroke-width="1.8"
                            stroke-linecap="round" stroke-linejoin="round"></path>
                    </svg>
                </RouterLink>
            </div>
        </section>
    </main>
</template>
