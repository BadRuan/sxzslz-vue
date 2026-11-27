<script setup lang="ts">
import { computed, ref, watch, onMounted, onUnmounted, nextTick } from 'vue';
import { storeToRefs } from 'pinia';
import { useRoute, useRouter } from 'vue-router';
import { url_prefix } from '@/utils/baseInfo';
import TitleComponent from '@/components/TitleComponent.vue';
import AppModal from '@/components/AppModal.vue';
import EmptyState from '@/components/EmptyState.vue';
import { useStationStore } from '@/store/station';

const station_store = useStationStore();
const { station_array } = storeToRefs(station_store);
const route = useRoute();
const router = useRouter();
const length = station_array.value.length;

/** 当前站点索引：从 query 实时取值，支持站间切换不重载组件 */
const indexValue = computed(() => {
    const value = Number(route.query.index);
    return Number.isInteger(value) && value >= 0 && value < length ? value : -1;
});

watch(indexValue, (current) => {
    if (current < 0) router.replace({ name: 'Home' });
}, { immediate: true });

watch(() => route.query.index, () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
});

const station = computed(() => station_array.value[indexValue.value]);

/** 导航索引 */
const prev_index = computed(() => (indexValue.value - 1 + length) % length);
const next_index = computed(() => (indexValue.value + 1) % length);

/** 当前高亮分节（scrollspy 驱动） */
const activeSection = ref('basic');

/** 图片灯箱状态 */
const lightbox = ref<{ open: boolean; index: number; src: string; title: string }>({
    open: false, index: 0, src: '', title: ''
});

/** 侧边栏锚点导航 */
const sections = [
    { id: 'basic', label: '基本情况', icon: 'M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z' },
    { id: 'capacity', label: '规模与排涝能力', icon: 'M13 2L3 14h9l-1 8 10-12h-9l11-9 11 9h-9l-1 8 10-12H6L5 14H14L13 2z' },
    { id: 'equipment', label: '机电设备', icon: 'M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z' },
    { id: 'structure', label: '房建与压力箱', icon: 'M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z' },
    { id: 'gallery', label: '站区面貌', icon: 'M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z' },
];

const scrollToSection = (id: string) => {
    nextTick(() => {
        const el = document.getElementById(id);
        if (el) {
            el.scrollIntoView({ behavior: 'smooth', block: 'start' });
            // 更新 URL hash 但不触发导航
            history.replaceState(null, '', `#${id}`);
        }
    });
};

/** 分节 id 顺序（scrollspy 按此取首个命中项） */
const SECTION_IDS = ['basic', 'capacity', 'equipment', 'structure', 'gallery'] as const;
let spy: IntersectionObserver | null = null;

/** 打开图片灯箱 */
const openLightbox = (index: number) => {
    const list = station.value?.station_pic_list || [];
    if (list[index]) {
        lightbox.value = {
            open: true,
            index,
            src: url_prefix.pic_prefix + list[index].src,
            title: list[index].title || station.value?.station_name || ''
        };
        document.body.style.overflow = 'hidden';
    }
};

const closeLightbox = () => {
    lightbox.value.open = false;
    document.body.style.overflow = '';
};

const navigateLightbox = (dir: number) => {
    const list = station.value?.station_pic_list || [];
    let newIndex = lightbox.value.index + dir;
    if (newIndex < 0) newIndex = list.length - 1;
    if (newIndex >= list.length) newIndex = 0;
    lightbox.value.index = newIndex;
    const item = list[newIndex];
    if (!item) return;
    lightbox.value.src = url_prefix.pic_prefix + item.src;
    lightbox.value.title = item.title || station.value?.station_name || '';
};

/** 关键指标卡片数据 */
const metrics = computed(() => {
    const s = station.value;
    if (!s) return [];
    return [
        { label: '装机台数', value: s.zhuangji, unit: '台套', icon: 'M13 10V3L4 14h7v7l9-11h-7z', iconClass: 'text-primary-300', iconClassMobile: 'text-primary' },
        { label: '总装机容量', value: s.zongrongliang.toLocaleString(), unit: 'kW', icon: 'M13 10V3L4 14h7v7l9-11h-7z', iconClass: 'text-secondary-300', iconClassMobile: 'text-secondary' },
        { label: '设计流量', value: s.liuliang, unit: 'm³/s', icon: 'M5 12h14M12 5l7 7-7 7', iconClass: 'text-info-300', iconClassMobile: 'text-info' },
        { label: '受益面积', value: s.shouyimianji, unit: '万亩', icon: 'M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z', iconClass: 'text-success-300', iconClassMobile: 'text-success' },
    ];
});

/** 空值统一渲染为 —；0 是有效值原样保留 */
const dval = (v: unknown): string =>
    v === null || v === undefined || v === '' ? '—' : String(v);

/** 四大分组数据（全部分节常显，供单页全展开长页使用） */
const buildTabData = (s: NonNullable<typeof station.value>) => {
    return {
        basic: {
            title: '基本情况',
            subtitle: 'Base Information',
            icon: 'M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z',
            items: [
                { label: '泵站名称', value: s.station_name, type: 'highlight' },
                { label: '泵站地址', value: s.station_location, type: 'location' },
                { label: '建站年份', value: `${s.birth_day} 年`, type: 'date' },
                { label: '改造（建）年份', value: dval(s.gaizaonianfen), type: 'date' },
                { label: '改造类型', value: dval(s.gailaoleixing), type: 'tag', tagClass: 'badge badge-secondary' },
                { label: '泵站功能', value: dval(s.bengzhangongneng), type: 'tag', tagClass: 'badge badge-primary' },
                { label: '所在流域', value: dval(s.suozailiuyu), type: 'tag', tagClass: 'badge badge-info' },
                { label: '所在水系', value: dval(s.suozaishuixi), type: 'text' },
                { label: '所在圩口', value: dval(s.suozaiweikou), type: 'text' },
            ],
            // 固定信息放在底部
            fixedInfo: [
                { label: '主管部门', value: '鸠江区水务局' },
                { label: '管理单位', value: '芜湖市鸠江区沈巷镇水利站' },
            ]
        },
        capacity: {
            title: '规模与排涝能力',
            subtitle: 'Capacity & Drainage Capability',
            icon: 'M13 2L3 14h9l-1 8 10-12h-9l11-9 11 9h-9l-1 8 10-12H6L5 14H14L13 2z',
            items: [
                { label: '装机台数', value: `${s.zhuangji} 台套`, unit: '', type: 'number', highlight: true },
                { label: '总装机容量', value: s.zongrongliang.toLocaleString(), unit: 'kW', type: 'number', highlight: true },
                { label: '设计流量', value: s.liuliang, unit: 'm³/s', type: 'number', highlight: true },
                { label: '设计排涝扬程', value: s.shejipailaoyangchen, unit: 'm', type: 'number' },
                { label: '设计排涝水位', value: s.shejipailaoshuiwei, unit: 'm', type: 'number' },
                { label: '排涝最高出水位', value: s.pailaozuigaochushuiwei, unit: 'm', type: 'number' },
                { label: '受益范围', value: dval(s.shouyifanwei), unit: '', type: 'number' },
                { label: '受益面积', value: s.shouyimianji, unit: '万亩', type: 'number', highlight: true },
            ]
        },
        equipment: {
            title: '机电设备',
            subtitle: 'Electromechanical Equipment',
            icon: 'M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z',
            items: [
                { label: '变压器', type: 'equipment', items: [
                    { label: '类型', value: s.bianyaqi_leixing },
                    { label: '型号', value: s.bianyaqi_xinghao },
                ]},
                { label: '电机', type: 'equipment', items: [
                    { label: '类型', value: s.dianji_leixing },
                    { label: '型号', value: s.dianji_xinghao },
                ]},
                { label: '水泵', type: 'equipment', items: [
                    { label: '类型', value: s.shuibeng_leixing },
                    { label: '型号', value: s.shuibeng_xinghao },
                ]},
            ]
        },
        structure: {
            title: '房建与压力箱',
            subtitle: 'Buildings & Surge Tank',
            icon: 'M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z',
            items: [
                { label: '主机泵房', type: 'structure', items: [
                    { label: '类型', value: s.zhujifang_leixing },
                    { label: '面积', value: `${s.zhujifang_mianji} m²` },
                ]},
                { label: '管理房', type: 'structure', items: [
                    { label: '结构形式', value: s.guanlifang_leixing },
                    { label: '面积', value: `${s.guanlifang_mianji} m²` },
                ]},
                { label: '压力箱', type: 'structure', items: [
                    { label: '长度', value: `${s.yalixiang_changdu} m` },
                    { label: '口径', value: s.yalixiang_koujing },
                    { label: '结构', value: s.yalixiang_jiegou },
                ]},
            ]
        }
    };
};

/** 未加载时兜底空对象（模板有 v-if="station" 守卫，不会实际访问其属性） */
const tabData = computed(() =>
    station.value ? buildTabData(station.value) : ({} as ReturnType<typeof buildTabData>)
);

/** 格式化数值显示 */
const formatNumber = (val: number | string) => {
    const num = typeof val === 'string' ? parseFloat(val) : val;
    if (isNaN(num)) return val;
    return num.toLocaleString('zh-CN', { maximumFractionDigits: 2 });
};

/** 灯箱键盘快捷键（Esc 关闭、←→ 切换）；注册与注销成对，避免监听泄漏 */
const handleKeydown = (e: KeyboardEvent) => {
    if (!lightbox.value.open) return;
    if (e.key === 'Escape') closeLightbox();
    if (e.key === 'ArrowLeft') navigateLightbox(-1);
    if (e.key === 'ArrowRight') navigateLightbox(1);
};

onMounted(() => {
    window.addEventListener('keydown', handleKeydown);
    // scrollspy：观察 5 个分节，滚动时更新高亮；页底兜底落在最后一节
    spy = new IntersectionObserver((entries) => {
        if (window.innerHeight + window.scrollY >= document.body.offsetHeight - 2) {
            activeSection.value = 'gallery';
            return;
        }
        const hit = SECTION_IDS.find((id) =>
            entries.some((en) => en.isIntersecting && en.target.id === id)
        );
        if (hit) activeSection.value = hit;
    }, { rootMargin: '-30% 0px -60% 0px', threshold: 0 });
    void nextTick(() => {
        SECTION_IDS.forEach((id) => {
            const el = document.getElementById(id);
            if (el) spy?.observe(el);
        });
    });
});

onUnmounted(() => {
    window.removeEventListener('keydown', handleKeydown);
    spy?.disconnect();
    spy = null;
});
</script>

<template>
<main v-if="station" class="bg-base-200 min-h-screen">
    <!-- ===== Hero Section ===== -->
    <section class="relative overflow-hidden bg-neutral" aria-labelledby="station-title">
        <!-- 背景图 -->
        <div class="absolute inset-0 -z-10">
            <img :src="url_prefix.pic_prefix + station.thumb" :alt="station.station_name + '实景'"
                class="h-full w-full object-cover" loading="eager" fetchpriority="high" />
            <!-- 双层渐变遮罩：保证文字可读性 -->
            <div class="absolute inset-0 bg-gradient-to-r from-neutral/95 via-neutral/80 to-neutral/20" />
            <div class="absolute inset-0 bg-gradient-to-t from-neutral/90 via-transparent to-neutral/10" />
        </div>

        <!-- 顶部导航栏（桌面端侧边栏在右，移动端在下） -->
        <div class="page-container relative z-10 pt-6 pb-4">
            <div class="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6">
                <div class="flex-1 min-w-0">
                    <p class="eyebrow text-white/70">Pump Station · 芜湖市鸠江区沈巷镇</p>
                    <h1 id="station-title" class="mt-2 text-3xl font-bold tracking-tight text-white sm:text-4xl lg:text-5xl leading-tight">
                        {{ station.station_name }}
                    </h1>
                    <div class="mt-4 flex flex-wrap items-center gap-2.5 text-sm text-white/80">
                        <span class="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1.5 backdrop-blur-sm">
                            <svg class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true">
                                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" />
                                <circle cx="12" cy="10" r="3" />
                            </svg>
                            {{ station.station_location }}
                        </span>
                        <span class="rounded-full bg-white/10 px-3 py-1.5 backdrop-blur-sm whitespace-nowrap">{{ station.birth_day }} 年建站</span>
                        <span class="rounded-full bg-white/10 px-3 py-1.5 backdrop-blur-sm whitespace-nowrap">{{ station.suozailiuyu }}</span>
                        <span class="rounded-full bg-white/10 px-3 py-1.5 backdrop-blur-sm whitespace-nowrap">{{ station.suozaishuixi }}</span>
                        <span v-if="station.suozaiweikou" class="rounded-full bg-white/10 px-3 py-1.5 backdrop-blur-sm whitespace-nowrap">{{ station.suozaiweikou }}</span>
                    </div>
                </div>

                <!-- 桌面端右侧：关键指标迷你卡片 + 站间导航 -->
                <div class="hidden lg:flex lg:flex-col lg:items-end lg:w-64 lg:gap-4 shrink-0">
                    <!-- 关键指标：横向排列 -->
                    <div class="w-full grid grid-cols-2 gap-3">
                        <div v-for="(m, i) in metrics" :key="m.label" class="rounded-xl bg-white/10 backdrop-blur-sm p-4 border border-white/10 hover:bg-white/15 transition-all duration-300 group">
                            <div class="flex items-center gap-2 text-white/70 mb-1.5">
                                <svg class="h-5 w-5 shrink-0" :class="m.iconClass" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                                    <path :d="m.icon" />
                                </svg>
                                <span class="text-xs font-medium tracking-wide uppercase">{{ m.label }}</span>
                            </div>
                            <div class="flex items-baseline gap-1 text-white">
                                <span class="num text-2xl font-bold leading-none">{{ typeof m.value === 'number' ? m.value.toLocaleString() : m.value }}</span>
                                <span class="text-xs font-medium text-white/60">{{ m.unit }}</span>
                            </div>
                        </div>
                    </div>

                    <!-- 站间切换 -->
                    <nav class="w-full flex items-center justify-between gap-2 pt-2 border-t border-white/10" aria-label="站间导航">
                        <RouterLink :to="{ name: 'Station', query: { index: prev_index } }"
                            class="group flex-1 flex items-center justify-center gap-2 rounded-lg bg-white/5 px-3 py-2 text-sm text-white/80 hover:bg-white/10 hover:text-white transition-all duration-200 border border-white/5"
                            title="上一座：{{ station_array[prev_index]?.station_name }}">
                            <svg class="h-4 w-4 shrink-0 group-hover:-translate-x-0.5 transition-transform" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
                                <path d="M19 12H5M11 18l-6-6 6-6" stroke-linecap="round" stroke-linejoin="round" />
                            </svg>
                            <span class="truncate">{{ station_array[prev_index]?.station_name }}</span>
                        </RouterLink>
                        <RouterLink :to="{ name: 'Home' }"
                            class="shrink-0 px-3 py-2 text-xs text-white/60 hover:text-white transition-colors" title="返回全部泵站">
                            全部泵站
                        </RouterLink>
                        <RouterLink :to="{ name: 'Station', query: { index: next_index } }"
                            class="group flex-1 flex items-center justify-center gap-2 rounded-lg bg-white/5 px-3 py-2 text-sm text-white/80 hover:bg-white/10 hover:text-white transition-all duration-200 border border-white/5"
                            title="下一座：{{ station_array[next_index]?.station_name }}">
                            <span class="truncate text-end">{{ station_array[next_index]?.station_name }}</span>
                            <svg class="h-4 w-4 shrink-0 group-hover:translate-x-0.5 transition-transform" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
                                <path d="M5 12h14M13 6l6 6-6 6" stroke-linecap="round" stroke-linejoin="round" />
                            </svg>
                        </RouterLink>
                    </nav>
                </div>
            </div>
        </div>
    </section>

    <!-- ===== 主内容区 ===== -->
    <div class="page-container pb-20 lg:pb-28">
        <div class="flex flex-col lg:flex-row lg:gap-10">
            <!-- 侧边栏锚点导航（桌面端固定） -->
            <aside class="hidden lg:block lg:w-48 lg:sticky lg:top-28 lg:self-start lg:h-[calc(100vh-7rem)]">
                <nav class="space-y-1" aria-label="页面内导航">
                    <button v-for="sec in sections" :key="sec.id" type="button"
                        class="w-full flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-left text-sm text-base-content/65 hover:bg-base-200 hover:text-base-content transition-all duration-200 border-l-2 border-transparent"
                        :class="activeSection === sec.id ? 'bg-primary/5 text-primary border-primary font-medium' : ''"
                        @click="scrollToSection(sec.id)"
                        :aria-current="activeSection === sec.id ? 'location' : undefined">
                        <svg class="h-4.5 w-4.5 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true">
                            <path :d="sec.icon" stroke-linecap="round" stroke-linejoin="round" />
                        </svg>
                        <span class="truncate">{{ sec.label }}</span>
                    </button>
                </nav>
            </aside>

            <!-- 主内容 -->
            <div class="flex-1 min-w-0">
                <!-- 移动端锚点导航（只做导航，不隐藏内容） -->
                <div class="lg:hidden mb-6 overflow-x-auto pb-2 -mx-4 px-4" aria-label="页内分节导航">
                    <div class="flex gap-2 min-w-max">
                        <button v-for="sec in sections" :key="sec.id" type="button"
                            class="shrink-0 flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-medium transition-all duration-200 whitespace-nowrap"
                            :class="activeSection === sec.id ? 'bg-primary text-primary-content shadow-sm' : 'bg-base-100 text-base-content/65 hover:bg-base-200 hover:text-base-content'"
                            @click="scrollToSection(sec.id)">
                            <svg class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true">
                                <path :d="sec.icon" stroke-linecap="round" stroke-linejoin="round" />
                            </svg>
                            <span>{{ sec.label }}</span>
                        </button>
                    </div>
                </div>

                <!-- ===== 关键指标总览卡片（移动端展示，桌面端已在 Hero 右侧） ===== -->
                <div class="lg:hidden mb-8">
                    <div class="grid grid-cols-2 gap-3">
                        <div v-for="(m, i) in metrics" :key="m.label" class="card-hover rounded-xl border border-base-300 bg-base-100 p-4 shadow-[var(--shadow-card)]">
                            <div class="flex items-center gap-2 text-base-content/55 mb-1.5">
                                <svg class="h-5 w-5 shrink-0" :class="m.iconClassMobile" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                                    <path :d="m.icon" />
                                </svg>
                                <span class="text-xs font-medium tracking-wide uppercase">{{ m.label }}</span>
                            </div>
                            <div class="flex items-baseline gap-1 text-base-content">
                                <span class="num text-2xl font-bold leading-none">{{ typeof m.value === 'number' ? m.value.toLocaleString() : m.value }}</span>
                                <span class="text-xs font-medium text-base-content/50">{{ m.unit }}</span>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- ===== 内容分节（全部常显） ===== -->
                <div class="space-y-8">
                    <!-- 基本情况 -->
                    <section id="basic" class="animate-fade-in" role="section" aria-labelledby="basic-heading">
                        <TitleComponent id="basic-heading">
                            <template #first>{{ tabData.basic.title }}</template>
                            <template #second>{{ tabData.basic.subtitle }}</template>
                        </TitleComponent>

                        <div class="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                            <div v-for="item in tabData.basic.items" :key="item.label"
                                class="card-hover rounded-xl border border-base-300 bg-base-100 p-5 shadow-[var(--shadow-card)] transition-all duration-300"
                                :class="{ 'col-span-2 lg:col-span-3': item.type === 'highlight', 'col-span-1': item.type !== 'highlight' }">
                                <dt class="text-xs font-medium tracking-wide uppercase text-base-content/50 mb-1.5">{{ item.label }}</dt>
                                <dd class="text-base-content" :class="[
                                    item.type === 'highlight' ? 'text-xl font-bold' : 'text-lg font-medium',
                                    item.type === 'location' ? 'flex items-center gap-1.5' : '',
                                    item.type === 'date' ? 'font-mono tabular-nums' : '',
                                ]">
                                    <template v-if="item.type === 'location'">
                                        <svg class="h-5 w-5 shrink-0 text-primary" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true">
                                            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" />
                                            <circle cx="12" cy="10" r="3" />
                                        </svg>
                                        {{ item.value }}
                                    </template>
                                    <template v-else-if="item.type === 'tag'">
                                        <span :class="item.tagClass">
                                            {{ item.value }}
                                        </span>
                                    </template>
                                    <template v-else>{{ item.value }}</template>
                                </dd>
                            </div>
                        </div>

                        <!-- 固定信息 -->
                        <div class="mt-6 rounded-xl border border-base-300 bg-base-100/50 p-5">
                            <h4 class="text-sm font-semibold text-base-content/60 mb-3">固定归属信息</h4>
                            <dl class="grid gap-3 sm:grid-cols-2">
                                <div v-for="item in tabData.basic.fixedInfo" :key="item.label" class="flex items-center gap-3">
                                    <dt class="shrink-0 w-32 text-xs font-medium text-base-content/50">{{ item.label }}</dt>
                                    <dd class="text-sm text-base-content/80 font-mono">{{ item.value }}</dd>
                                </div>
                            </dl>
                        </div>
                    </section>

                    <!-- 规模与排涝能力 -->
                    <section id="capacity" class="animate-fade-in" role="section" aria-labelledby="capacity-heading">
                        <TitleComponent id="capacity-heading">
                            <template #first>{{ tabData.capacity.title }}</template>
                            <template #second>{{ tabData.capacity.subtitle }}</template>
                        </TitleComponent>

                        <div class="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                            <div v-for="item in tabData.capacity.items" :key="item.label"
                                class="card-hover relative rounded-xl border border-base-300 bg-base-100 p-5 shadow-[var(--shadow-card)] transition-all duration-300"
                                :class="item.highlight ? 'ring-2 ring-primary/30 bg-primary/5' : ''">
                                <dt class="text-xs font-medium tracking-wide uppercase text-base-content/50 mb-2">{{ item.label }}</dt>
                                <dd class="flex items-baseline gap-1.5">
                                    <span class="num text-2xl sm:text-3xl font-bold leading-none text-base-content">{{ formatNumber(item.value) }}</span>
                                    <span v-if="item.unit" class="text-sm font-medium text-base-content/50 self-end mb-1">{{ item.unit }}</span>
                                </dd>
                                <div v-if="item.highlight" class="absolute top-3 right-3 h-2 w-2 rounded-full bg-primary/50 animate-pulse" aria-hidden="true" title="核心指标" />
                            </div>
                        </div>
                    </section>

                    <!-- 机电设备 -->
                    <section id="equipment" class="animate-fade-in" role="section" aria-labelledby="equipment-heading">
                        <TitleComponent id="equipment-heading">
                            <template #first>{{ tabData.equipment.title }}</template>
                            <template #second>{{ tabData.equipment.subtitle }}</template>
                        </TitleComponent>

                        <div class="mt-5 space-y-4">
                            <div v-for="eq in tabData.equipment.items" :key="eq.label"
                                class="card-hover rounded-xl border border-base-300 bg-base-100 overflow-hidden shadow-[var(--shadow-card)] transition-all duration-300">
                                <div class="flex items-center gap-3 px-5 py-4 bg-base-50 border-b border-base-300">
                                    <div class="inline-flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                                        <svg class="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true">
                                            <path d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" stroke-linecap="round" stroke-linejoin="round" />
                                        </svg>
                                    </div>
                                    <span class="text-lg font-semibold text-base-content">{{ eq.label }}</span>
                                </div>
                                <dl class="p-5 grid gap-3 sm:grid-cols-2">
                                    <div v-for="(sub, si) in eq.items" :key="sub.label" class="flex items-center gap-3 p-3 rounded-lg bg-base-50/50">
                                        <dt class="shrink-0 w-24 text-xs font-medium text-base-content/50">{{ sub.label }}</dt>
                                        <dd class="text-base font-medium text-base-content/85 truncate">{{ sub.value || '—' }}</dd>
                                    </div>
                                </dl>
                            </div>
                        </div>
                    </section>

                    <!-- 房建与压力箱 -->
                    <section id="structure" class="animate-fade-in" role="section" aria-labelledby="structure-heading">
                        <TitleComponent id="structure-heading">
                            <template #first>{{ tabData.structure.title }}</template>
                            <template #second>{{ tabData.structure.subtitle }}</template>
                        </TitleComponent>

                        <div class="mt-5 space-y-4">
                            <div v-for="st in tabData.structure.items" :key="st.label"
                                class="card-hover rounded-xl border border-base-300 bg-base-100 overflow-hidden shadow-[var(--shadow-card)] transition-all duration-300">
                                <div class="flex items-center gap-3 px-5 py-4 bg-base-50 border-b border-base-300">
                                    <div class="inline-flex h-10 w-10 items-center justify-center rounded-lg bg-secondary/10 text-secondary">
                                        <svg class="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true">
                                            <path d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" stroke-linecap="round" stroke-linejoin="round" />
                                        </svg>
                                    </div>
                                    <span class="text-lg font-semibold text-base-content">{{ st.label }}</span>
                                </div>
                                <dl class="p-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                                    <div v-for="(sub, si) in st.items" :key="sub.label" class="flex items-center gap-3 p-3 rounded-lg bg-base-50/50">
                                        <dt class="shrink-0 w-28 text-xs font-medium text-base-content/50">{{ sub.label }}</dt>
                                        <dd class="text-base font-medium text-base-content/85">{{ sub.value || '—' }}</dd>
                                    </div>
                                </dl>
                            </div>
                        </div>
                    </section>

                    <!-- 站区面貌 -->
                    <section id="gallery" class="animate-fade-in" role="section" aria-labelledby="gallery-heading">
                        <TitleComponent id="gallery-heading">
                            <template #first>站区面貌</template>
                            <template #second>Station Pictures</template>
                        </TitleComponent>

                        <div v-if="station.station_pic_list?.length" class="mt-5 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                            <figure v-for="(item, i) in station.station_pic_list" :key="i"
                                class="group relative overflow-hidden rounded-xl border border-base-300 bg-base-100 shadow-[var(--shadow-card)] cursor-zoom-in"
                                @click="openLightbox(i)"
                                @keydown.enter="openLightbox(i)"
                                @keydown.space.prevent="openLightbox(i)"
                                tabindex="0"
                                role="button"
                                :aria-label="`查看大图：${item.title || station.station_name}`">
                                <div class="aspect-[4/3] overflow-hidden bg-base-200 relative">
                                    <img :src="url_prefix.pic_prefix + item.src" :alt="item.title || station.station_name"
                                        class="h-full w-full object-cover transition-all duration-700 ease-out group-hover:scale-105"
                                        loading="lazy" decoding="async" />
                                    <!-- 渐变遮罩 -->
                                    <div class="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                                    <!-- 放大图标 -->
                                    <div class="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                                        <div class="inline-flex h-12 w-12 items-center justify-center rounded-full bg-white/20 backdrop-blur-sm text-white transform group-hover:scale-110 transition-transform duration-300">
                                            <svg class="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true">
                                                <path d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                                <path d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                            </svg>
                                        </div>
                                    </div>
                                </div>
                                <figcaption class="p-4">
                                    <p class="text-sm font-medium text-base-content truncate">{{ item.title }}</p>
                                    <p class="mt-0.5 text-xs text-base-content/50">{{ station.station_name }}</p>
                                </figcaption>
                            </figure>
                        </div>
                        <EmptyState v-else class="mt-8" icon="image" title="暂无站区影像资料" />
                    </section>
                </div>
            </div>
        </div>
    </div>

    <!-- ===== 图片灯箱 ===== -->
    <Teleport to="body">
        <Transition name="fade">
            <div v-if="lightbox.open" class="fixed inset-0 z-[100] flex items-center justify-center p-4" @click="closeLightbox" role="dialog" aria-modal="true" aria-label="图片预览">
                <div class="absolute inset-0 bg-black/95 backdrop-blur-sm" />
                <div class="relative flex flex-col items-center max-h-[90vh] max-w-[90vw]">
                    <!-- 导航按钮 -->
                    <button type="button" class="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-16 h-12 w-12 rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors" @click.stop="navigateLightbox(-1)" aria-label="上一张" :disabled="!station.station_pic_list?.length">
                        <svg class="h-6 w-6 mx-auto" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
                            <path d="M19 12H5M11 18l-6-6 6-6" stroke-linecap="round" stroke-linejoin="round" />
                        </svg>
                    </button>
                    <button type="button" class="absolute right-0 top-1/2 -translate-y-1/2 translate-x-16 h-12 w-12 rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors" @click.stop="navigateLightbox(1)" aria-label="下一张" :disabled="!station.station_pic_list?.length">
                        <svg class="h-6 w-6 mx-auto" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
                            <path d="M5 12h14M13 6l6 6-6 6" stroke-linecap="round" stroke-linejoin="round" />
                        </svg>
                    </button>

                    <!-- 图片 -->
                    <img :src="lightbox.src" :alt="lightbox.title"
                        class="max-h-[80vh] max-w-[80vw] object-contain rounded-xl shadow-2xl"
                        @click.stop />

                    <!-- 标题与计数 -->
                    <div class="mt-4 text-center text-white/80">
                        <p class="text-base font-medium">{{ lightbox.title }}</p>
                        <p class="text-sm mt-1">{{ lightbox.index + 1 }} / {{ station.station_pic_list?.length || 0 }}</p>
                    </div>

                    <!-- 关闭按钮 -->
                    <button type="button" class="absolute top-4 right-4 h-12 w-12 rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors" @click="closeLightbox" aria-label="关闭预览">
                        <svg class="h-6 w-6 mx-auto" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
                            <path d="M6 6l12 12M18 6L6 18" stroke-linecap="round" />
                        </svg>
                    </button>
                </div>
            </div>
        </Transition>
    </Teleport>

</main>
</template>

<style scoped>
/* 淡入动画 */
@keyframes fade-in {
    from { opacity: 0; transform: translateY(8px); }
    to { opacity: 1; transform: translateY(0); }
}

.animate-fade-in {
    animation: fade-in 0.4s ease-out forwards;
}

/* 灯箱动画 */
.fade-enter-active,
.fade-leave-active {
    transition: opacity 0.2s ease-out;
}

.fade-enter-from,
.fade-leave-to {
    opacity: 0;
}

/* 滚动条美化 */
aside::-webkit-scrollbar { width: 6px; }
aside::-webkit-scrollbar-track { background: transparent; }
aside::-webkit-scrollbar-thumb { background: var(--color-base-300); border-radius: 3px; }
aside::-webkit-scrollbar-thumb:hover { background: color-mix(in oklab, var(--color-base-content) 30%, transparent); }

/* 焦点可见性增强 */
figure:focus-visible,
button:focus-visible,
[role="button"]:focus-visible,
[role="tab"]:focus-visible {
    outline: 2px solid var(--color-primary);
    outline-offset: 2px;
    border-radius: 0.5rem;
}

/* 打印样式 */
@media print {
    aside, nav[aria-label="站间导航"], .fixed, Teleport { display: none !important; }
    main { background: white !important; }
    section { break-inside: avoid; page-break-inside: avoid; }
    .card-hover { box-shadow: none !important; border: 1px solid #e5e7eb !important; }
}
</style>