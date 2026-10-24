<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { storeToRefs } from 'pinia';
import dayjs from 'dayjs';
import apiService from '@/utils/apiService';
import { useBaseinfoStore } from '@/store/base';
import { flatten_categories } from '@/utils/category';
import {
    articleService,
    api_error_detail,
    type ArticleModel,
    type ArticleCreateInput,
} from '@/store/article';
import { url_prefix } from '@/utils/baseInfo';

const PAGE_SIZE = 20;
const IMAGE_MIME_WHITELIST = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
const MAX_IMAGE_SIZE = 10 * 1024 * 1024;

/** active = 正常文章列表；trash = 回收站（is_deleted=true，可恢复） */
const view = ref<'active' | 'trash'>('active');
const article_list = ref<ArticleModel[]>([]);
const total = ref(0);
const page = ref(1);
const has_next = ref(false);
const list_error = ref('');
const action_slug = ref<string | null>(null); // 正在操作（删除/恢复/切换状态）的文章 slug

const baseinfo_store = useBaseinfoStore();
const { categories } = storeToRefs(baseinfo_store);

const fetch_list = async () => {
    list_error.value = '';
    try {
        const res = await articleService.getArticles({
            page: page.value,
            page_size: PAGE_SIZE,
            is_deleted: view.value === 'trash',
        });
        article_list.value = res.data ?? [];
        total.value = res.total;
        has_next.value = res.has_next;
    } catch (error) {
        list_error.value = api_error_detail(error, '获取文章列表失败');
        console.error('获取管理后台文章列表失败:', error)
    }
};

const switch_view = (target: 'active' | 'trash') => {
    if (view.value === target) return;
    view.value = target;
    page.value = 1;
    fetch_list();
};

const go_page = (target: number) => {
    page.value = target;
    fetch_list();
};

// —— 新增 / 编辑弹窗 ——
const show_modal = ref(false);
const modal_mode = ref<'create' | 'edit'>('create');
const modal_error = ref('');
const saving = ref(false);
const uploading_cover = ref(false);
const editing_slug = ref<string | null>(null);
const form = ref<{
    title: string,
    content: string,
    cover_img_slug: string,
    is_recommended: boolean,
    category_ids: number[],
}>({
    title: '',
    content: '',
    cover_img_slug: '',
    is_recommended: false,
    category_ids: [],
});

/** 仅二级分类可挂文章：base 信息是树形（无 parent_id），严格二级下深度 1 即二级分类 */
const second_level_options = computed(() =>
    flatten_categories(categories.value)
        .filter(({ depth }) => depth === 1)
        .map(({ node }) => ({ id: node.id, label: node.name }))
);

const open_create = () => {
    modal_mode.value = 'create';
    editing_slug.value = null;
    form.value = {
        title: '', content: '', cover_img_slug: '',
        is_recommended: false, category_ids: [],
    };
    modal_error.value = '';
    show_modal.value = true;
};

const open_edit = async (row: ArticleModel) => {
    modal_mode.value = 'edit';
    editing_slug.value = row.slug;
    modal_error.value = '';
    show_modal.value = true;
    try {
        // 列表不含 content，编辑前拉详情
        const detail = await articleService.getDetail(row.slug);
        form.value = {
            title: detail.title,
            content: detail.content ?? '',
            cover_img_slug: detail.cover_img_slug ?? '',
            is_recommended: detail.is_recommended,
            category_ids: (detail.categories ?? []).map(c => c.id),
        };
    } catch (error) {
        modal_error.value = api_error_detail(error, '获取文章详情失败');
    }
};

const pick_cover = async (event: Event) => {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    input.value = '';
    if (!file) return;
    if (!IMAGE_MIME_WHITELIST.includes(file.type)) {
        modal_error.value = '仅支持 JPG, PNG, GIF, WebP 格式的图片';
        return;
    }
    if (file.size > MAX_IMAGE_SIZE) {
        modal_error.value = '封面图不能超过 10MB';
        return;
    }
    uploading_cover.value = true;
    modal_error.value = '';
    try {
        const res = await apiService.upload<{ slug: string }>('/image/', file);
        form.value.cover_img_slug = res.slug;
    } catch (error) {
        modal_error.value = api_error_detail(error, '封面上传失败');
    } finally {
        uploading_cover.value = false;
    }
};

const toggle_category = (id: number) => {
    const ids = form.value.category_ids;
    const index = ids.indexOf(id);
    if (index >= 0) ids.splice(index, 1);
    else ids.push(id);
};

const submit_form = async () => {
    modal_error.value = '';
    if (!form.value.title.trim()) {
        modal_error.value = '标题不能为空';
        return;
    }
    saving.value = true;
    try {
        const payload: ArticleCreateInput = {
            title: form.value.title.trim(),
            content: form.value.content,
            cover_img_slug: form.value.cover_img_slug || null,
            is_recommended: form.value.is_recommended,
            category_ids: form.value.category_ids,
        };
        if (modal_mode.value === 'create') {
            await articleService.create(payload);
        } else if (editing_slug.value !== null) {
            await articleService.update(editing_slug.value, payload);
        }
        show_modal.value = false;
        await fetch_list();
    } catch (error) {
        modal_error.value = api_error_detail(error, '保存失败，请稍后重试');
    } finally {
        saving.value = false;
    }
};

// —— 行内操作 ——
const remove_article = async (row: ArticleModel) => {
    if (!window.confirm(`确认删除文章「${row.title}」吗？（移入回收站，可在回收站恢复）`)) return;
    action_slug.value = row.slug;
    try {
        await articleService.remove(row.slug);
        await fetch_list();
    } catch (error) {
        window.alert(api_error_detail(error, '删除失败，请稍后重试'));
    } finally {
        action_slug.value = null;
    }
};

const restore_article = async (row: ArticleModel) => {
    if (!window.confirm(`确认恢复文章「${row.title}」吗？（重新回到正常列表）`)) return;
    action_slug.value = row.slug;
    try {
        await articleService.restore(row.slug);
        await fetch_list();
    } catch (error) {
        window.alert(api_error_detail(error, '恢复失败，请稍后重试'));
    } finally {
        action_slug.value = null;
    }
};

const toggle_recommended = async (row: ArticleModel) => {
    action_slug.value = row.slug;
    try {
        await articleService.update(row.slug, { is_recommended: !row.is_recommended });
        await fetch_list();
    } catch (error) {
        window.alert(api_error_detail(error, '操作失败，请稍后重试'));
    } finally {
        action_slug.value = null;
    }
};

onMounted(
    async () => {
        fetch_list();
        baseinfo_store.checkBaseinfo();
    }
);
</script>

<template>
    <main class="flex-1 overflow-y-auto p-6">
        <div class="flex items-center justify-between mb-6">
            <div class="flex items-center gap-4">
                <h2 class="text-xl font-bold text-gray-900">文章管理</h2>
                <div class="flex rounded-lg bg-gray-100 p-1 text-sm">
                    <button
                        class="rounded-md px-3 py-1.5 link-transition"
                        :class="view === 'active'
                            ? 'bg-white text-gray-900 shadow-sm'
                            : 'text-gray-500 hover:text-gray-700'"
                        @click="switch_view('active')">
                        正常文章
                    </button>
                    <button
                        class="rounded-md px-3 py-1.5 link-transition"
                        :class="view === 'trash'
                            ? 'bg-white text-gray-900 shadow-sm'
                            : 'text-gray-500 hover:text-gray-700'"
                        @click="switch_view('trash')">
                        回收站
                    </button>
                </div>
            </div>
            <button
                v-if="view === 'active'"
                class="rounded-lg bg-primary-500 px-4 py-2 text-sm font-semibold text-white hover:bg-primary-600 link-transition"
                @click="open_create">
                + 新增文章
            </button>
        </div>

        <div class="bg-white rounded-2xl shadow-card overflow-x-auto">
            <table class="w-full text-sm text-left">
                <thead class="border-b border-border text-gray-500">
                    <tr class="text-center">
                        <th class="px-4 py-4 font-medium">分类</th>
                        <th class="px-4 py-4 font-medium">标题</th>
                        <th class="px-4 py-4 font-medium">作者</th>
                        <th class="px-4 py-4 font-medium">推荐</th>
                        <th class="px-4 py-4 font-medium">浏览量</th>
                        <th class="px-4 py-4 font-medium">发布时间</th>
                        <th class="px-4 py-4 font-medium">操作</th>
                    </tr>
                </thead>
                <tbody class="divide-y divide-border divide-dashed">
                    <tr v-if="list_error">
                        <td colspan="7" class="px-6 py-8 text-center text-red-600">{{ list_error }}</td>
                    </tr>
                    <tr v-else-if="article_list.length === 0">
                        <td colspan="7" class="px-6 py-8 text-center text-gray-400">
                            {{ view === 'trash' ? '回收站为空' : '暂无文章' }}
                        </td>
                    </tr>
                    <tr v-for="article in article_list" :key="article.slug" class="text-center hover:bg-gray-50 link-transition">
                        <td class="px-4 py-3.5 text-gray-600">
                            {{ article.categories?.[0]?.name || '—' }}
                        </td>
                        <td class="px-4 py-3 text-gray-700 text-left max-w-xs truncate">
                            {{ article.title }}
                        </td>
                        <td class="px-4 py-3 text-gray-600 text-left">
                            {{ article.user?.nickname ?? '—' }}
                        </td>
                        <td class="px-4 py-3">
                            <button
                                class="inline-flex items-center rounded-full px-2 py-0.5 text-xs cursor-pointer transition-colors"
                                :class="article.is_recommended
                                    ? 'bg-green-100 text-primary-700 hover:bg-yellow-100'
                                    : 'bg-gray-100 text-gray-400 hover:bg-gray-200'"
                                :disabled="action_slug === article.slug"
                                @click="toggle_recommended(article)">
                                {{ article.is_recommended ? '已推荐' : '未推荐' }}
                            </button>
                        </td>
                        <td class="px-4 py-3 text-gray-600">{{ article.view_count }}</td>
                        <td class="px-4 py-3 text-gray-500">{{ dayjs(article.create_at).format('YYYY-MM-DD HH:mm') }}</td>
                        <td class="px-4 py-3">
                            <div class="flex items-center justify-center gap-3">
                                <template v-if="view === 'active'">
                                    <button class="text-xs text-primary-700 hover:underline"
                                        @click="open_edit(article)">编辑</button>
                                    <button class="text-xs text-red-600 hover:underline"
                                        :disabled="action_slug === article.slug"
                                        @click="remove_article(article)">删除</button>
                                </template>
                                <button v-else class="text-xs text-primary-700 hover:underline"
                                    :disabled="action_slug === article.slug"
                                    @click="restore_article(article)">恢复</button>
                            </div>
                        </td>
                    </tr>
                </tbody>
            </table>

            <nav class="flex items-center justify-between border-t border-border px-6 py-4" aria-label="Pagination">
                <p class="text-sm text-gray-700">
                    共 <span class="font-medium">{{ total }}</span> 条，
                    第 <span class="font-medium">{{ page }}</span> 页
                </p>
                <div class="flex gap-2">
                    <button @click="go_page(page - 1)" :disabled="page <= 1" :class="[
                        page <= 1
                            ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                            : 'bg-white text-gray-900 hover:bg-gray-50'
                    ]" class="rounded-md px-3 py-1.5 text-sm ring-1 ring-inset ring-gray-300">
                        上一页
                    </button>
                    <button @click="go_page(page + 1)" :disabled="!has_next" :class="[
                        !has_next
                            ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                            : 'bg-primary-500 text-white hover:bg-primary-600'
                    ]" class="rounded-md px-3 py-1.5 text-sm">
                        下一页
                    </button>
                </div>
            </nav>
        </div>

        <!-- 新增/编辑弹窗 -->
        <Transition name="modal">
            <div v-if="show_modal" class="fixed inset-0 z-50 flex items-center justify-center">
                <div class="absolute inset-0 bg-black/30" @click="show_modal = false"></div>
                <div class="modal-panel relative bg-white rounded-2xl shadow-card-hover w-full max-w-3xl max-h-[90vh] overflow-y-auto p-6">
                    <h3 class="text-lg font-bold text-gray-800 mb-4">
                        {{ modal_mode === 'create' ? '新增文章' : '编辑文章' }}
                    </h3>
                    <div class="flex flex-col gap-4">
                        <label class="text-sm text-gray-600">标题
                            <input v-model="form.title"
                                class="mt-1 w-full rounded-lg border border-border px-3 py-2 text-sm text-gray-800 focus:border-primary-400 focus:ring-2 focus:ring-primary-100" />
                        </label>

                        <label class="text-sm text-gray-600">正文（Markdown）
                            <textarea v-model="form.content" rows="10"
                                class="mt-1 w-full rounded-lg border border-border px-3 py-2 text-sm text-gray-800 font-mono focus:border-primary-400 focus:ring-2 focus:ring-primary-100"></textarea>
                        </label>

                        <div class="text-sm text-gray-600">
                            封面图
                            <div class="mt-1 flex items-center gap-3">
                                <input type="file" accept="image/jpeg,image/png,image/gif,image/webp"
                                    class="text-sm text-gray-500 file:mr-3 file:rounded-lg file:border-0 file:bg-primary-50 file:px-3 file:py-1.5 file:text-sm file:font-semibold file:text-primary-700 hover:file:bg-primary-100"
                                    :disabled="uploading_cover" @change="pick_cover" />
                                <span v-if="uploading_cover" class="text-xs text-gray-400">上传中...</span>
                            </div>
                            <div class="mt-2 flex items-center gap-3">
                                <img v-if="form.cover_img_slug" :src="url_prefix.pic_prefix + form.cover_img_slug" alt="cover"
                                    class="h-16 w-24 rounded-lg object-cover ring-1 ring-border" />
                                <input v-model="form.cover_img_slug" placeholder="或直接填图片 slug"
                                    class="flex-1 rounded-lg border border-border px-3 py-2 text-sm text-gray-800 focus:border-primary-400 focus:ring-2 focus:ring-primary-100" />
                                <button v-if="form.cover_img_slug" class="text-xs text-red-600 hover:underline shrink-0"
                                    @click="form.cover_img_slug = ''">清除</button>
                            </div>
                        </div>

                        <div class="text-sm text-gray-600">
                            关联分类（仅二级，可多选）
                            <div class="mt-2 flex flex-wrap gap-2">
                                <button v-for="opt in second_level_options" :key="opt.id" type="button"
                                    class="rounded-full px-3 py-1 text-xs transition-colors" :class="form.category_ids.includes(opt.id)
                                        ? 'bg-primary-500 text-white'
                                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'"
                                    @click="toggle_category(opt.id)">
                                    {{ opt.label }}
                                </button>
                            </div>
                        </div>

                        <div class="flex flex-row gap-6 text-sm text-gray-600">
                            <label class="flex items-center gap-2">
                                <input v-model="form.is_recommended" type="checkbox" class="rounded" />
                                推荐（首页轮播候选）
                            </label>
                        </div>

                        <p v-if="modal_error" class="text-sm text-red-600">{{ modal_error }}</p>
                    </div>
                    <div class="mt-5 flex justify-end gap-3">
                        <button class="px-4 py-2 text-sm rounded-lg bg-gray-100 text-gray-600 hover:bg-gray-200 link-transition"
                            @click="show_modal = false">取消</button>
                        <button :disabled="saving" :class="saving
                            ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                            : 'bg-primary-500 text-white hover:bg-primary-600'"
                            class="px-4 py-2 text-sm rounded-lg link-transition"
                            @click="submit_form">
                            {{ saving ? '保存中...' : '保存' }}
                        </button>
                    </div>
                </div>
            </div>
        </Transition>
    </main>
</template>
