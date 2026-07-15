<script setup lang="ts">
import News_summary from './News_summary.vue';
import Category_news from './category_news.vue';
import Station_info from './Station_info.vue';
import Station_picture from './Station_picture.vue';
import Freatres from './Features.vue';
</script>

<template>
    <main class="bg-background flex flex-col">
        <News_summary />
        <Category_news />
        <Station_info />
        <Station_picture />
        <Freatres />
    </main>
</template>