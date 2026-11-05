<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, ref, watch } from 'vue';
import DOMPurify from 'dompurify';
import type { WorkBook, WorkSheet } from 'xlsx';
import { doc_icon_for, ext_of_filename } from '@/utils/docIcon';

/**
 * 正文附件预览器：
 * · PDF 走浏览器内置阅读器（fetch 成 blob 后用 iframe，避开后端 attachment 头强制下载）
 * · Word（docx）与 Excel（xls/xlsx）在本地解析渲染，文件不出浏览器
 * · txt/csv/md 直接按文本展示
 * · ppt / zip / rar 等浏览器无力渲染的类型，退回「下载 / 新窗口打开」两条路
 * 重解析依赖按需动态加载，不进首屏包。
 */
const props = defineProps<{
    modelValue: boolean;
    url: string;
    filename?: string;
}>();

const emit = defineEmits<{
    'update:modelValue': [value: boolean];
}>();

const PDF_EXTS = ['pdf'];
const DOCX_EXTS = ['docx'];
const SHEET_EXTS = ['xls', 'xlsx'];
const TEXT_EXTS = ['txt', 'csv', 'md', 'json', 'log'];

/** 浏览器端确实解析不了的格式：给一句能指导下一步的说明，而不是「解析失败」 */
const FALLBACK_HINTS: Record<string, string> = {
    doc: '旧版 Word（.doc）是二进制格式，浏览器无法解析；请下载后用 Word 打开，或另存为 .docx 再上传',
    ppt: 'PPT 暂不支持在线预览，请下载后查看',
    pptx: 'PPT 暂不支持在线预览，请下载后查看',
    wps: 'WPS 专有格式暂不支持在线预览，请下载后查看',
};

const extension = computed(() => ext_of_filename(props.filename || props.url || ''));
const display_name = computed(() => {
    if (props.filename) return props.filename;
    const tail = (props.url || '').split('/').pop() ?? '附件';
    try {
        return decodeURIComponent(tail) || '附件';
    } catch {
        return tail;
    }
});

const loading = ref(false);
const error_message = ref('');
const fallback_hint = computed(
    () => error_message.value || FALLBACK_HINTS[extension.value] || `浏览器无法直接渲染 ${extension.value || '此'} 文件，可下载后本地打开`,
);
const fallback_title = computed(() => {
    if (error_message.value) return '文件解析失败';
    return FALLBACK_HINTS[extension.value] ? '该格式需下载后查看' : '该类型暂不支持在线预览';
});
const view_kind = ref<'pdf' | 'docx' | 'sheet' | 'text' | 'unsupported'>('unsupported');
const text_content = ref('');
const sheet_html = ref('');
const sheet_names = ref<string[]>([]);
const active_sheet = ref(0);

const docx_container = ref<HTMLElement | null>(null);
let workbook: WorkBook | null = null;
let object_url = '';

/** sheet_to_html 只按单元格取值，仍需消毒防恶意公式/超链接注入 */
const render_sheet = async (index: number) => {
    if (!workbook) return;
    const XLSX = await import('xlsx');
    const name = workbook.SheetNames[index];
    const sheet: WorkSheet | undefined = name ? workbook.Sheets[name] : undefined;
    if (!sheet) {
        sheet_html.value = '';
        return;
    }
    const raw = XLSX.utils.sheet_to_html(sheet, { id: 'preview-sheet' });
    sheet_html.value = DOMPurify.sanitize(raw, { ADD_ATTR: ['colspan', 'rowspan'] });
};

const switch_sheet = async (index: number) => {
    active_sheet.value = index;
    await render_sheet(index);
};

const revoke_object_url = () => {
    if (object_url) {
        URL.revokeObjectURL(object_url);
        object_url = '';
    }
};

const load = async () => {
    revoke_object_url();
    error_message.value = '';
    text_content.value = '';
    sheet_html.value = '';
    sheet_names.value = [];
    active_sheet.value = 0;
    workbook = null;
    if (docx_container.value) docx_container.value.innerHTML = '';

    if (!props.url) {
        view_kind.value = 'unsupported';
        return;
    }

    const ext = extension.value;

    if (TEXT_EXTS.includes(ext)) {
        view_kind.value = 'text';
        loading.value = true;
        try {
            const response = await fetch(props.url);
            if (!response.ok) throw new Error(`HTTP ${response.status}`);
            text_content.value = await response.text();
        } catch (error) {
            view_kind.value = 'unsupported';
            error_message.value = error instanceof Error ? error.message : '读取失败';
        } finally {
            loading.value = false;
        }
        return;
    }

    if (!PDF_EXTS.includes(ext) && !DOCX_EXTS.includes(ext) && !SHEET_EXTS.includes(ext)) {
        view_kind.value = 'unsupported';
        return;
    }

    loading.value = true;
    try {
        const response = await fetch(props.url);
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const buffer = await response.arrayBuffer();

        if (PDF_EXTS.includes(ext)) {
            const blob = new Blob([buffer], { type: 'application/pdf' });
            object_url = URL.createObjectURL(blob);
            view_kind.value = 'pdf';
        } else if (DOCX_EXTS.includes(ext)) {
            const { renderAsync } = await import('docx-preview');
            view_kind.value = 'docx';
            // 关键：docx-preview 要往真实 DOM 节点里写，必须先撤掉 loading 让容器渲染出来，
            // 否则 nextTick 时节点还不存在（就是之前「预览空白」的原因）
            loading.value = false;
            await nextTick();
            if (docx_container.value) {
                await renderAsync(buffer, docx_container.value, undefined, {
                    className: 'docx',
                    inWrapper: true,
                    breakPages: true,
                    ignoreLastRenderedPageBreak: true,
                });
            }
        } else {
            const XLSX = await import('xlsx');
            workbook = XLSX.read(buffer, { type: 'array' });
            sheet_names.value = workbook?.SheetNames ?? [];
            view_kind.value = 'sheet';
            await render_sheet(0);
        }
    } catch (error) {
        view_kind.value = 'unsupported';
        error_message.value = error instanceof Error ? error.message : '文件解析失败';
    } finally {
        loading.value = false;
    }
};

const close = () => emit('update:modelValue', false);

const download = () => {
    const anchor = document.createElement('a');
    anchor.href = props.url;
    anchor.download = display_name.value;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
};

const open_in_window = () => {
    window.open(object_url || props.url, '_blank', 'noopener,noreferrer');
};

const on_keydown = (event: KeyboardEvent) => {
    if (event.key === 'Escape') close();
};

watch(
    () => [props.modelValue, props.url] as const,
    async ([open]) => {
        if (!open) {
            revoke_object_url();
            document.body.style.overflow = '';
            window.removeEventListener('keydown', on_keydown);
            return;
        }
        document.body.style.overflow = 'hidden';
        window.addEventListener('keydown', on_keydown);
        await load();
    },
    { immediate: true },
);

onBeforeUnmount(() => {
    revoke_object_url();
    document.body.style.overflow = '';
    window.removeEventListener('keydown', on_keydown);
});
</script>

<template>
    <Teleport to="body">
        <Transition name="modal">
            <div v-if="modelValue" class="fixed inset-0 z-[60] flex items-center justify-center p-3 sm:p-6">
                <div class="absolute inset-0 bg-neutral/70 backdrop-blur-sm" @click="close"></div>

                <div
                    class="relative flex h-full max-h-[92vh] w-full max-w-6xl flex-col overflow-hidden rounded-2xl border border-base-300 bg-base-100 shadow-lift">
                    <!-- 工具条：文件名 + 操作 -->
                    <header class="flex shrink-0 items-center gap-3 border-b border-base-300 px-4 py-3 sm:px-5">
                        <img :src="doc_icon_for(display_name)" alt="" class="h-5 w-5 shrink-0" />
                        <div class="min-w-0 flex-1">
                            <p class="truncate text-sm font-semibold text-base-content" :title="display_name">
                                {{ display_name }}
                            </p>
                            <p class="mt-0.5 text-[0.6875rem] uppercase tracking-[0.14em] text-base-content/45">
                                {{ extension || 'file' }} · 文件预览
                            </p>
                        </div>
                        <div class="flex shrink-0 items-center gap-2">
                            <button type="button" class="btn btn-sm btn-ghost gap-1.5" @click="open_in_window">
                                <svg viewBox="0 0 24 24" class="h-4 w-4" fill="none" stroke="currentColor" stroke-width="1.8">
                                    <path d="M14 4h6v6M20 4l-8 8" stroke-linecap="round" stroke-linejoin="round" />
                                    <path d="M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5" stroke-linecap="round" />
                                </svg>
                                新窗口
                            </button>
                            <button type="button" class="btn btn-sm btn-primary gap-1.5" @click="download">
                                <svg viewBox="0 0 24 24" class="h-4 w-4" fill="none" stroke="currentColor" stroke-width="1.8">
                                    <path d="M12 4v10m0 0 4-4m-4 4-4-4" stroke-linecap="round" stroke-linejoin="round" />
                                    <path d="M5 18h14" stroke-linecap="round" />
                                </svg>
                                下载
                            </button>
                            <button type="button" class="btn btn-sm btn-ghost btn-circle" aria-label="关闭预览" @click="close">
                                <svg viewBox="0 0 24 24" class="h-5 w-5" fill="none" stroke="currentColor" stroke-width="1.8">
                                    <path d="M6 6l12 12M18 6L6 18" stroke-linecap="round" />
                                </svg>
                            </button>
                        </div>
                    </header>

                    <!-- 内容区 -->
                    <div class="relative min-h-0 flex-1 overflow-auto bg-base-200/60">
                        <div v-if="loading" class="flex h-full items-center justify-center gap-3 text-sm text-base-content/60">
                            <span class="loading loading-spinner loading-md"></span>
                            正在解析文件…
                        </div>

                        <template v-else-if="view_kind === 'pdf'">
                            <iframe :src="object_url" class="h-full w-full border-0" title="PDF 预览"></iframe>
                        </template>

                        <div v-else-if="view_kind === 'docx'" class="mx-auto max-w-4xl bg-base-100 p-4 sm:p-8">
                            <div ref="docx_container" class="docx-preview"></div>
                        </div>

                        <div v-else-if="view_kind === 'sheet'" class="p-3 sm:p-5">
                            <div v-if="sheet_names.length > 1" class="mb-3 flex flex-wrap gap-1.5">
                                <button v-for="(name, index) in sheet_names" :key="name" type="button"
                                    class="rounded-full px-3 py-1 text-xs transition"
                                    :class="index === active_sheet
                                        ? 'bg-primary font-semibold text-primary-content'
                                        : 'bg-base-100 text-base-content/65 hover:text-primary'"
                                    @click="switch_sheet(index)">
                                    {{ name }}
                                </button>
                            </div>
                            <div class="preview-sheet overflow-auto rounded-xl border border-base-300 bg-base-100"
                                v-html="sheet_html"></div>
                        </div>

                        <pre v-else-if="view_kind === 'text'"
                            class="h-full overflow-auto whitespace-pre-wrap break-words p-5 text-[0.8125rem] leading-relaxed text-base-content/80">{{ text_content }}</pre>

                        <div v-else class="flex h-full flex-col items-center justify-center gap-4 px-6 text-center">
                            <img :src="doc_icon_for(display_name)" alt="" class="h-14 w-14 opacity-80" />
                            <div>
                                <p class="text-sm font-medium text-base-content">{{ fallback_title }}</p>
                                <p class="mt-1.5 max-w-md text-xs leading-5 text-base-content/55">{{ fallback_hint }}</p>
                            </div>
                            <div class="flex gap-3">
                                <button type="button" class="btn btn-sm btn-primary" @click="download">下载文件</button>
                                <button type="button" class="btn btn-sm btn-outline" @click="open_in_window">新窗口打开</button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </Transition>
    </Teleport>
</template>

<style scoped>
.docx-preview :deep(.docx-wrapper) {
    background: transparent;
    padding: 0;
}

.docx-preview :deep(.docx-wrapper > section.docx) {
    margin: 0 auto 1rem;
    box-shadow: none;
    border: 1px solid var(--color-base-300);
    border-radius: 0.5rem;
}

/* 解析出来的表格按站点风格收一下：细边、表头浅底、单元格可读 */
.preview-sheet :deep(table) {
    border-collapse: collapse;
    font-size: 0.8125rem;
    color: var(--color-base-content);
}

.preview-sheet :deep(td),
.preview-sheet :deep(th) {
    border: 1px solid var(--color-base-300);
    padding: 0.375rem 0.625rem;
    vertical-align: top;
}

.preview-sheet :deep(tr:first-child td) {
    background: var(--color-base-200);
    font-weight: 600;
}
</style>
