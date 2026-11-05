<script setup lang="ts">
import { computed, watch } from 'vue';
import { storeToRefs } from 'pinia';
import { useStationStore } from '@/store/station';
import { useRoute, useRouter } from 'vue-router';
import { url_prefix } from '@/utils/baseInfo';
import TitleComponent from '@/components/TitleComponent.vue';

const station_store = useStationStore();
const { station_array } = storeToRefs(station_store);
const route = useRoute();
const router = useRouter();
const length = station_array.value.length;

/**
 * 站点序号必须从 query 实时取值：
 * 站间切换只改 query 不换路径，MainLayout 以 route.path 为 key 复用本组件，
 * 原先在 setup 里取一次快照（const indexValue = Number(route.query.index)）会导致切站后内容不变。
 */
const indexValue = computed(() => {
    const value = Number(route.query.index);
    return Number.isInteger(value) && value >= 0 && value < length ? value : -1;
});

// 越界/非法序号维持原行为：回首页（immediate 覆盖首次进入）
watch(indexValue, (current) => {
    if (current < 0) router.replace({ name: 'Home' });
}, { immediate: true });

// 换站后回到页首，避免停在上一站的内页滚动位置
watch(() => route.query.index, () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
});

const station = computed(() => station_array.value[indexValue.value]);

/** 上一座 / 下一座：站间切换仍走原路由 query，不引入新数据依赖 */
const prev_index = computed(() => (indexValue.value - 1 + length) % length);
const next_index = computed(() => (indexValue.value + 1) % length);

/**
 * 27 项参数按工程语义分组展示（原为三列平铺，长标签与数值混排难扫读）。
 * 数值统一带单位，避免「容量/流量」看不出量纲。
 */
const groups = computed(() => {
    const s = station.value;
    if (!s) return [];
    return [
        {
            id: 'basic',
            title: '基本情况',
            subtitle: 'Base Information',
            items: [
                { label: '主管部门', value: '鸠江区水务局' },
                { label: '管理单位', value: '芜湖市鸠江区沈巷镇水利站' },
                { label: '泵站名称', value: s.station_name },
                { label: '泵站地址', value: s.station_location },
                { label: '建站年份', value: `${s.birth_day} 年` },
                { label: '改造（建）年份', value: `${s.gaizaonianfen}` },
                { label: '改造类型', value: s.gailaoleixing },
                { label: '泵站功能', value: s.bengzhangongneng },
                { label: '所在流域', value: s.suozailiuyu },
                { label: '所在水系', value: s.suozaishuixi },
                { label: '所在圩口', value: s.suozaiweikou },
            ],
        },
        {
            id: 'capacity',
            title: '规模与排涝能力',
            subtitle: 'Capacity',
            items: [
                { label: '装机', value: `${s.zhuangji} 台套` },
                { label: '总容量', value: `${s.zongrongliang} kW` },
                { label: '流量', value: `${s.liuliang} m³/s` },
                { label: '设计排涝扬程', value: `${s.shejipailaoyangchen} m` },
                { label: '设计排涝水位', value: `${s.shejipailaoshuiwei} m` },
                { label: '排涝最高出水位', value: `${s.pailaozuigaochushuiwei} m` },
                { label: '受益范围', value: `${s.shouyimianji} km²` },
                { label: '受益面积', value: `${s.shouyimianji} 万亩` },
            ],
        },
        {
            id: 'equipment',
            title: '机电设备',
            subtitle: 'Equipment',
            items: [
                { label: '变压器类型', value: s.bianyaqi_leixing },
                { label: '变压器型号', value: s.bianyaqi_xinghao },
                { label: '电机类型', value: s.dianji_leixing },
                { label: '电机型号', value: s.dianji_xinghao },
                { label: '水泵类型', value: s.shuibeng_leixing },
                { label: '水泵型号', value: s.shuibeng_xinghao },
            ],
        },
        {
            id: 'structure',
            title: '房建与压力箱',
            subtitle: 'Structure',
            items: [
                { label: '主机泵房类型', value: s.zhujifang_leixing },
                { label: '主机房面积', value: `${s.zhujifang_mianji} m²` },
                { label: '管理房结构形式', value: s.guanlifang_leixing },
                { label: '管理房面积', value: `${s.guanlifang_mianji} m²` },
                { label: '压力箱长度', value: `${s.yalixiang_changdu} m` },
                { label: '压力箱口径', value: s.yalixiang_koujing },
                { label: '压力箱结构', value: s.yalixiang_jiegou },
            ],
        },
    ];
});

/** 关键指标：详情页首屏先给规模数字，再展开 27 项参数 */
const metrics = computed(() => {
    const s = station.value;
    if (!s) return [];
    return [
        { label: '装机', value: s.zhuangji, unit: '台套' },
        { label: '总容量', value: s.zongrongliang, unit: 'kW' },
        { label: '设计流量', value: s.liuliang, unit: 'm³/s' },
        { label: '受益面积', value: s.shouyimianji, unit: '万亩' },
    ];
});
</script>

<template>
    <main v-if="station" class="bg-base-200">
        <!-- 站区头图：站名与属地信息压在图上，进入详情第一眼即可确认「这是哪一站」 -->
        <section class="relative overflow-hidden bg-neutral">
            <div class="h-[20rem] w-full sm:h-[24rem]">
                <img class="h-full w-full object-cover opacity-80" :src="url_prefix.pic_prefix + station.thumb"
                    :alt="station.station_name + '实景'">
            </div>
            <div
                class="pointer-events-none absolute inset-0 bg-gradient-to-t from-neutral/95 via-neutral/50 to-transparent">
            </div>

            <div class="page-container absolute inset-x-0 bottom-0 pb-8 sm:pb-10">
                <p class="eyebrow text-white/65">Pump Station</p>
                <h1 class="mt-2.5 text-2xl font-bold tracking-tight text-white sm:text-[2rem]">
                    {{ station.station_name }}
                </h1>
                <div class="mt-4 flex flex-wrap items-center gap-2 text-xs text-white/70">
                    <span class="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1 backdrop-blur-sm">
                        <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none"
                            aria-hidden="true">
                            <path d="M12 21s7-5.686 7-11a7 7 0 1 0-14 0c0 5.314 7 11 7 11Z" stroke="currentColor"
                                stroke-width="1.7" stroke-linejoin="round"></path>
                            <circle cx="12" cy="10" r="2.4" stroke="currentColor" stroke-width="1.7"></circle>
                        </svg>
                        {{ station.station_location }}
                    </span>
                    <span class="rounded-full bg-white/10 px-3 py-1 backdrop-blur-sm">{{ station.birth_day }} 年建站</span>
                    <span class="rounded-full bg-white/10 px-3 py-1 backdrop-blur-sm">{{ station.suozailiuyu }}</span>
                    <span class="rounded-full bg-white/10 px-3 py-1 backdrop-blur-sm">{{ station.suozaishuixi }}</span>
                </div>
            </div>
        </section>

        <div class="page-container pb-16">
            <!-- 关键指标条：与头图叠压，形成信息层次 -->
            <dl
                class="relative -mt-6 grid grid-cols-2 overflow-hidden rounded-box border border-base-300 bg-base-100 shadow-[var(--shadow-card)] sm:-mt-8 sm:grid-cols-4">
                <div v-for="(metric, index) in metrics" :key="metric.label" class="border-base-300 px-5 py-5 sm:px-6"
                    :class="[
                        index % 2 === 1 ? 'border-l' : '',
                        index > 1 ? 'border-t sm:border-t-0' : '',
                        index > 0 ? 'sm:border-l' : '',
                    ]">
                    <dd class="num text-xl font-semibold leading-none text-base-content sm:text-2xl">
                        {{ metric.value }}
                        <span class="ml-1 text-[0.6875rem] font-normal text-base-content/55">{{ metric.unit }}</span>
                    </dd>
                    <dt class="mt-2 text-[0.6875rem] tracking-wide text-base-content/55">{{ metric.label }}</dt>
                </div>
            </dl>

            <!-- 参数分组：每组一张卡，卡内用发丝线网格，长标签也不挤在一起 -->
            <section v-for="(group, group_index) in groups" :key="group.id" class="mt-10 sm:mt-12">
                <TitleComponent>
                    <template #first>{{ group.title }}</template>
                    <template #second>{{ group.subtitle }}</template>
                    <template #action>
                        <span class="num text-xs text-base-content/50">0{{ group_index + 1 }}</span>
                    </template>
                </TitleComponent>

                <div class="mt-5 overflow-hidden rounded-box border border-base-300 bg-base-100">
                    <dl class="grid gap-px bg-base-300 sm:grid-cols-2 lg:grid-cols-3">
                        <div v-for="item in group.items" :key="item.label" class="bg-base-100 px-5 py-4">
                            <dt class="text-xs text-base-content/55">{{ item.label }}</dt>
                            <dd class="mt-1.5 text-sm font-medium leading-6 text-base-content">{{ item.value || '—' }}
                            </dd>
                        </div>
                    </dl>
                </div>
            </section>

            <!-- 站区面貌 -->
            <section class="mt-10 sm:mt-12">
                <TitleComponent>
                    <template #first>站区面貌</template>
                    <template #second>Station Pictures</template>
                </TitleComponent>

                <div v-if="station.station_pic_list?.length" class="mt-5 grid gap-6 sm:grid-cols-2">
                    <figure v-for="(item, i) in station.station_pic_list" :key="i"
                        class="group overflow-hidden rounded-box border border-base-300 bg-base-100">
                        <div class="aspect-[16/10] overflow-hidden bg-base-300">
                            <img :alt="item.title || station.station_name"
                                class="h-full w-full object-cover object-center transition-transform duration-500 ease-out group-hover:scale-[1.03]"
                                :src="url_prefix.pic_prefix + item.src" loading="lazy">
                        </div>
                        <figcaption class="flex items-center justify-between gap-3 px-5 py-3.5">
                            <span class="text-sm font-medium text-base-content">{{ item.title }}</span>
                            <span class="text-xs text-base-content/50">{{ station.station_name }}</span>
                        </figcaption>
                    </figure>
                </div>
                <p v-else
                    class="mt-5 rounded-box border border-dashed border-base-300 px-6 py-12 text-center text-sm text-base-content/55">
                    暂无站区影像
                </p>
            </section>

            <!-- 站间切换：看完一座站可直接翻到下一座 -->
            <nav class="mt-12 flex items-center justify-between gap-4 border-t border-base-300 pt-6">
                <RouterLink :to="{ name: 'Station', query: { index: prev_index } }"
                    class="group inline-flex items-center gap-2 text-sm text-base-content/65 hover:text-primary">
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none"
                        class="transition-transform duration-200 group-hover:-translate-x-0.5" aria-hidden="true">
                        <path d="M19 12H5M11 18l-6-6 6-6" stroke="currentColor" stroke-width="2" stroke-linecap="round"
                            stroke-linejoin="round"></path>
                    </svg>
                    {{ station_array[prev_index]?.station_name }}
                </RouterLink>
                <RouterLink :to="{ name: 'Home' }" class="text-xs text-base-content/50 hover:text-primary">
                    全部泵站
                </RouterLink>
                <RouterLink :to="{ name: 'Station', query: { index: next_index } }"
                    class="group inline-flex items-center gap-2 text-sm text-base-content/65 hover:text-primary">
                    {{ station_array[next_index]?.station_name }}
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none"
                        class="transition-transform duration-200 group-hover:translate-x-0.5" aria-hidden="true">
                        <path d="M5 12h14M13 6l6 6-6 6" stroke="currentColor" stroke-width="2" stroke-linecap="round"
                            stroke-linejoin="round"></path>
                    </svg>
                </RouterLink>
            </nav>
        </div>
    </main>
</template>
