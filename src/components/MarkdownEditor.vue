<script setup lang="ts">
import { computed, nextTick, ref } from 'vue';
import apiService from '@/utils/apiService';
import { api_error_detail } from '@/utils/apiError';
import { render_markdown } from '@/utils/markdown';
import { doc_icon_for } from '@/utils/docIcon';
import { url_prefix } from '@/utils/baseInfo';
import {
    IMAGE_ACCEPT,
    DOCUMENT_ACCEPT,
    DOCUMENT_LIMIT_HINT,
    validate_images,
    validate_documents,
    format_bytes,
} from '@/utils/upload';

/**
 * Markdown 编辑器（新增/编辑文章共用）：
 * - 左侧编辑、右侧实时预览（预览走 src/utils/markdown.ts，与文章详情页同一条渲染管线，
 *   站内相对路径图片/附件会自动补前缀，已上传图片可直接显示）
 * - 工具栏：加粗/斜体/标题/列表/引用/链接包裹选区
 * - 图片库：选择站内已上传图片或直接上传，插入 ![原文件名](slug)
 * - 附件库：选择站内已上传文档或直接上传，插入 [原文件名](slug)（详情页会带类型图标）
 */
const props = defineProps<{
    /** v-model：Markdown 原文 */
    modelValue: string;
}>();
const emit = defineEmits<{
    'update:modelValue': [value: string];
}>();

/** edit = 只看编辑；split = 左右分栏（默认）；preview = 只看预览 */
const mode = ref<'edit' | 'split' | 'preview'>('split');
const textarea = ref<HTMLTextAreaElement | null>(null);

const content = computed({
    get: () => props.modelValue,
    set: (value: string) => emit('update:modelValue', value),
});

/** 实时预览：与文章详情页同一渲染管线（含文档类型图标与 XSS 消毒） */
const preview_html = computed(() => render_markdown(content.value));

// —— 光标处插入 / 包裹选区 ——
const focus_editor = (start: number, end: number = start) => {
    const el = textarea.value;
    if (!el) return;
    el.focus();
    el.setSelectionRange(start, end);
};

const insert_text = (text: string) => {
    const el = textarea.value;
    if (!el) {
        content.value += text;
        return;
    }
    const start = el.selectionStart;
    const end = el.selectionEnd;
    content.value = content.value.slice(0, start) + text + content.value.slice(end);
    nextTick(() => focus_editor(start + text.length));
};

/** 用 before/after 包裹选区；无选区时插入 placeholder 并选中它 */
const wrap_selection = (before: string, after: string, placeholder: string) => {
    const el = textarea.value;
    if (!el) {
        content.value += before + placeholder + after;
        return;
    }
    const start = el.selectionStart;
    const end = el.selectionEnd;
    const selected = content.value.slice(start, end) || placeholder;
    content.value = content.value.slice(0, start) + before + selected + after + content.value.slice(end);
    nextTick(() => focus_editor(start + before.length, start + before.length + selected.length));
};

/** 给光标所在行加前缀（标题/列表/引用） */
const prefix_line = (prefix: string) => {
    const el = textarea.value;
    if (!el) {
        content.value = prefix + content.value;
        return;
    }
    const caret = el.selectionStart;
    const line_start = content.value.lastIndexOf('\n', caret - 1) + 1;
    content.value = content.value.slice(0, line_start) + prefix + content.value.slice(line_start);
    nextTick(() => focus_editor(caret + prefix.length));
};

// —— 素材面板：图片库 / 附件库（同一面板，按类型切换）——
const panel_kind = ref<'image' | 'document' | null>(null);

const image_list = ref<{ slug: string, raw_filename: string }[]>([]);
const image_loading = ref(false);
const image_uploading = ref(false);

const document_list = ref<{ slug: string, raw_filename: string, size_bytes?: number }[]>([]);
const document_loading = ref(false);
const document_uploading = ref(false);

const panel_error = ref('');
let list_seq = 0;

const is_image = computed(() => panel_kind.value === 'image');

const toggle_panel = (kind: 'image' | 'document') => {
    panel_kind.value = panel_kind.value === kind ? null : kind;
    panel_error.value = '';
    if (panel_kind.value === 'image' && image_list.value.length === 0) fetch_list();
    if (panel_kind.value === 'document' && document_list.value.length === 0) fetch_list();
};

/** 按当前面板类型拉取素材列表（GET /image/ 或 /document/，均为上传时间倒序） */
const fetch_list = async () => {
    const kind = panel_kind.value;
    if (!kind) return;
    const request_seq = ++list_seq;
    panel_error.value = '';
    if (kind === 'image') image_loading.value = true;
    else document_loading.value = true;
    try {
        const res = await apiService.get(kind === 'image' ? '/image/' : '/document/', { page: 1, page_size: 48 });
        if (request_seq !== list_seq || panel_kind.value !== kind) return;
        if (kind === 'image') image_list.value = res.data ?? [];
        else document_list.value = res.data ?? [];
    } catch (error) {
        if (request_seq !== list_seq || panel_kind.value !== kind) return;
        panel_error.value = api_error_detail(error, kind === 'image' ? '获取图库失败' : '获取附件列表失败');
    } finally {
        if (request_seq === list_seq) {
            if (kind === 'image') image_loading.value = false;
            else document_loading.value = false;
        }
    }
};

/** 插入 `![原文件名](slug)`：预览与详情页都会补成 /api/image/slug 直接显示 */
const insert_image = (image: { slug: string, raw_filename: string }) => {
    insert_text(`![${image.raw_filename}](${image.slug})`);
};

/** 插入 `[原文件名](slug)`：预览与详情页补成 /api/document/slug，详情页自动带类型图标 */
const insert_document = (doc: { slug: string, raw_filename: string }) => {
    insert_text(`[${doc.raw_filename}](${doc.slug})`);
};

/** 面板内上传：图片与文档走各自接口，成功后插入并刷新列表 */
const pick_upload = async (event: Event) => {
    const kind = panel_kind.value;
    if (!kind) return;
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    input.value = '';
    if (!file) return;

    const validation_error = kind === 'image' ? validate_images([file]) : validate_documents([file]);
    if (validation_error) {
        panel_error.value = validation_error;
        return;
    }

    if (kind === 'image') image_uploading.value = true;
    else document_uploading.value = true;
    panel_error.value = '';
    try {
        const url = kind === 'image' ? '/image/' : '/document/';
        const res = await apiService.uploadWithProgress(url, file, {});
        if (kind === 'image') insert_image({ slug: res.slug, raw_filename: file.name });
        else insert_document({ slug: res.slug, raw_filename: file.name });
        await fetch_list();
    } catch (error) {
        panel_error.value = api_error_detail(error, kind === 'image' ? '图片上传失败' : '文档上传失败');
    } finally {
        if (kind === 'image') image_uploading.value = false;
        else document_uploading.value = false;
    }
};
</script>

<template>
    <div class="flex flex-col gap-3">
        <!-- 工具栏：编辑/分栏/预览 切换 + 快捷操作 + 素材入口 -->
        <div class="flex flex-wrap items-center gap-2">
            <div class="join">
                <button type="button" class="btn btn-xs join-item"
                    :class="mode === 'edit' ? 'btn-primary' : 'btn-outline'"
                    @click="mode = 'edit'">编辑</button>
                <button type="button" class="btn btn-xs join-item"
                    :class="mode === 'split' ? 'btn-primary' : 'btn-outline'"
                    @click="mode = 'split'">分栏</button>
                <button type="button" class="btn btn-xs join-item"
                    :class="mode === 'preview' ? 'btn-primary' : 'btn-outline'"
                    @click="mode = 'preview'">预览</button>
            </div>

            <div class="divider divider-horizontal m-0"></div>

            <button type="button" class="btn btn-ghost btn-xs font-bold"
                title="加粗" @click="wrap_selection('**', '**', '加粗文本')">B</button>
            <button type="button" class="btn btn-ghost btn-xs italic"
                title="斜体" @click="wrap_selection('_', '_', '斜体文本')">I</button>
            <button type="button" class="btn btn-ghost btn-xs" title="二级标题"
                @click="prefix_line('## ')">H2</button>
            <button type="button" class="btn btn-ghost btn-xs" title="无序列表"
                @click="prefix_line('- ')">列表</button>
            <button type="button" class="btn btn-ghost btn-xs" title="引用"
                @click="prefix_line('> ')">引用</button>
            <button type="button" class="btn btn-ghost btn-xs" title="链接"
                @click="wrap_selection('[', '](https://)', '链接文字')">链接</button>

            <div class="divider divider-horizontal m-0"></div>

            <button type="button" class="btn btn-ghost btn-xs"
                :class="panel_kind === 'image' ? 'btn-primary btn-soft' : ''"
                title="从本站图库插入图片，或直接上传" @click="toggle_panel('image')">图片</button>
            <button type="button" class="btn btn-ghost btn-xs"
                :class="panel_kind === 'document' ? 'btn-primary btn-soft' : ''"
                title="从本站附件库插入文档，或直接上传" @click="toggle_panel('document')">文档</button>

            <span class="ml-auto text-xs text-base-content/40">
                {{ content.length }} 字符 · Markdown
            </span>
        </div>

        <!-- 素材面板：点击条目插入到光标处，或直接上传新素材 -->
        <div v-if="panel_kind" class="rounded-lg border border-base-300 bg-base-200/40 p-3">
            <div class="flex flex-wrap items-center justify-between gap-2 mb-2">
                <span class="text-xs text-base-content/60">
                    {{ is_image
                        ? '点击图片插入到光标处（已上传图片，预览与详情页均可直接显示）'
                        : '点击附件插入到光标处（详情页文件名前自动显示类型图标）' }}
                </span>
                <div class="flex items-center gap-2">
                    <label class="btn btn-xs"
                        :class="(is_image ? image_uploading : document_uploading) ? 'btn-disabled opacity-60' : 'btn-outline'">
                        {{ (is_image ? image_uploading : document_uploading) ? '上传中...' : (is_image ? '上传图片' : '上传文档') }}
                        <input type="file" class="hidden"
                            :accept="is_image ? IMAGE_ACCEPT : DOCUMENT_ACCEPT"
                            :disabled="is_image ? image_uploading : document_uploading"
                            @change="pick_upload" />
                    </label>
                    <button type="button" class="btn btn-ghost btn-xs" @click="fetch_list">刷新</button>
                    <button type="button" class="btn btn-ghost btn-xs" @click="panel_kind = null">收起</button>
                </div>
            </div>

            <p v-if="panel_error" class="text-xs text-error mb-2">{{ panel_error }}</p>
            <p v-if="!is_image" class="text-[11px] text-base-content/40 mb-2">{{ DOCUMENT_LIMIT_HINT }}</p>

            <div v-if="is_image ? image_loading : document_loading"
                class="flex items-center gap-2 text-xs text-base-content/60 py-4">
                <span class="loading loading-spinner loading-xs"></span> 加载中...
            </div>

            <!-- 图片库：缩略图网格 -->
            <template v-else-if="is_image">
                <p v-if="image_list.length === 0" class="text-xs text-base-content/40 py-4 text-center">
                    暂无已上传图片，可点右上角「上传图片」。
                </p>
                <div v-else class="grid grid-cols-6 sm:grid-cols-8 gap-2 max-h-48 overflow-y-auto pr-1">
                    <button v-for="image in image_list" :key="image.slug" type="button"
                        class="group relative aspect-square overflow-hidden rounded-md border border-base-300 bg-base-200"
                        :title="image.raw_filename" @click="insert_image(image)">
                        <img :src="url_prefix.pic_prefix + image.slug" alt="" loading="lazy" decoding="async"
                            class="h-full w-full object-cover transition-all duration-200 ease-out group-hover:scale-110" />
                        <span class="pointer-events-none absolute inset-x-0 bottom-0 truncate bg-black/50 px-1 py-0.5 text-[10px] text-white opacity-0 transition-opacity duration-200 group-hover:opacity-100">
                            {{ image.raw_filename }}
                        </span>
                    </button>
                </div>
            </template>

            <!-- 附件库：文件条目列表（图标 + 文件名 + 大小） -->
            <template v-else>
                <p v-if="document_list.length === 0" class="text-xs text-base-content/40 py-4 text-center">
                    暂无已上传文档，可点右上角「上传文档」。
                </p>
                <ul v-else class="max-h-48 overflow-y-auto pr-1 divide-y divide-base-300/60">
                    <li v-for="doc in document_list" :key="doc.slug">
                        <button type="button"
                            class="flex w-full items-center gap-2 rounded-md px-2 py-2 text-left link-transition hover:bg-base-300/40"
                            :title="`插入 ${doc.raw_filename}`" @click="insert_document(doc)">
                            <img :src="doc_icon_for(doc.raw_filename)" alt="" class="h-4 w-4 shrink-0" />
                            <span class="truncate text-sm text-base-content/80">{{ doc.raw_filename }}</span>
                            <span v-if="typeof doc.size_bytes === 'number'"
                                class="ml-auto shrink-0 text-xs text-base-content/40">
                                {{ format_bytes(doc.size_bytes) }}
                            </span>
                            <span class="shrink-0 text-xs text-primary/80">插入</span>
                        </button>
                    </li>
                </ul>
            </template>
        </div>

        <!-- 编辑 / 预览区 -->
        <div class="grid gap-3" :class="mode === 'split' ? 'md:grid-cols-2' : 'grid-cols-1'">
            <textarea v-show="mode !== 'preview'" ref="textarea" v-model="content" rows="14"
                placeholder="在此输入 Markdown 正文，右侧实时预览；相对路径图片/附件会自动补全为站内地址"
                class="textarea textarea-bordered w-full font-mono text-sm leading-6 resize-y"></textarea>

            <div v-show="mode !== 'edit'"
                class="h-[360px] overflow-y-auto rounded-lg border border-base-300 bg-base-100 px-4 py-3">
                <p v-if="!content.trim()" class="text-sm text-base-content/40">暂无内容，输入 Markdown 后此处实时预览。</p>
                <div v-else class="prose prose-sm max-w-none
                        prose-headings:font-bold prose-headings:mt-5 prose-headings:mb-2
                        prose-h2:text-xl prose-h3:text-base
                        prose-p:leading-relaxed prose-p:my-2
                        prose-a:text-primary prose-a:underline prose-a:underline-offset-2
                        prose-img:max-w-full prose-img:rounded-sm prose-img:my-3
                        prose-blockquote:border-l-primary prose-blockquote:bg-base-200 prose-blockquote:px-3 prose-blockquote:py-1 prose-blockquote:rounded-lg
                        prose-ul:list-disc prose-ol:list-decimal"
                    v-html="preview_html"></div>
            </div>
        </div>
    </div>
</template>

<style scoped>
/* 预览里的文档类型图标：prose-img 会把 img 压成块级，这里强制行内贴合文件名 */
:deep(.prose img.doc-icon) {
    display: inline-block;
    width: 1.125rem;
    height: 1.125rem;
    margin: 0 0.25rem 0 0;
    vertical-align: -0.15em;
    border: none;
    border-radius: 0.25rem;
}
</style>
