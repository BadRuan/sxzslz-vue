<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { storeToRefs } from 'pinia';
import dayjs from 'dayjs';
import AppPagination from '@/components/AppPagination.vue';
import AppModal from '@/components/AppModal.vue';
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
    clear_selection();
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
        if (selected.value.has(row.slug)) {
            const next = new Set(selected.value);
            next.delete(row.slug);
            selected.value = next;
        }
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

// —— 批量分类（正常文章视图；勾选跨页保留，切视图清空） ——
const selected = ref<Set<string>>(new Set());
const all_on_page_selected = computed(() =>
    article_list.value.length > 0 && article_list.value.every(a => selected.value.has(a.slug)));

const toggle_select_all = () => {
    const next = new Set(selected.value);
    if (all_on_page_selected.value) article_list.value.forEach(a => next.delete(a.slug));
    else article_list.value.forEach(a => next.add(a.slug));
    selected.value = next;
};

const toggle_select = (slug: string) => {
    const next = new Set(selected.value);
    if (next.has(slug)) next.delete(slug);
    else next.add(slug);
    selected.value = next;
};

const clear_selection = () => { selected.value = new Set(); };

const show_batch_modal = ref(false);
const batch_mode = ref<'add' | 'remove'>('add');
const batch_category_id = ref<number | null>(null);
const batch_error = ref('');
const batch_saving = ref(false);

const open_batch = (mode: 'add' | 'remove') => {
    batch_mode.value = mode;
    batch_category_id.value = null;
    batch_error.value = '';
    show_batch_modal.value = true;
};

const submit_batch = async () => {
    if (!batch_category_id.value) {
        batch_error.value = '请选择目标分类';
        return;
    }
    batch_saving.value = true;
    batch_error.value = '';
    try {
        const res = await articleService.batchCategory(
            [...selected.value], batch_category_id.value, batch_mode.value);
        show_batch_modal.value = false;
        clear_selection();
        window.alert(`已${batch_mode.value === 'add' ? '加入' : '移出'}分类，共处理 ${res.affected} 篇文章`);
        await fetch_list();
    } catch (error) {
        batch_error.value = api_error_detail(error, '批量操作失败，请稍后重试');
    } finally {
        batch_saving.value = false;
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
                <h2 class="text-xl font-bold text-base-content">文章管理</h2>
                <div role="tablist" class="tabs tabs-box tabs-sm">
                    <button role="tab" class="tab" :class="{ 'tab-active': view === 'active' }"
                        @click="switch_view('active')">
                        正常文章
                    </button>
                    <button role="tab" class="tab" :class="{ 'tab-active': view === 'trash' }"
                        @click="switch_view('trash')">
                        回收站
                    </button>
                </div>
            </div>
            <button
                v-if="view === 'active'"
                class="btn btn-main btn-primary"
                @click="open_create">
                + 新增文章
            </button>
        </div>

        <div v-if="view === 'active' && selected.size > 0" role="alert"
            class="alert alert-info mb-4 text-sm">
            <span>已选 <b>{{ selected.size }}</b> 篇</span>
            <button class="btn btn-primary btn-xs whitespace-nowrap" @click="open_batch('add')">
                加入分类
            </button>
            <button class="btn btn-xs whitespace-nowrap" @click="open_batch('remove')">
                从分类移除
            </button>
            <button class="btn btn-ghost btn-xs" @click="clear_selection">清空选择</button>
        </div>

        <div class="card rounded-box overflow-x-auto">
            <table class="table text-sm">
                <thead class="border-b border-base-300 text-base-content/60">
                    <tr class="text-center">
                        <th v-if="view === 'active'" class="px-3 py-4 font-medium">
                            <input type="checkbox" class="checkbox checkbox-primary checkbox-sm"
                                :checked="all_on_page_selected" @change="toggle_select_all" />
                        </th>
                        <th class="px-4 py-4 font-medium">分类</th>
                        <th class="px-4 py-4 font-medium">标题</th>
                        <th class="px-4 py-4 font-medium">作者</th>
                        <th class="px-4 py-4 font-medium">推荐</th>
                        <th class="px-4 py-4 font-medium">浏览量</th>
                        <th class="px-4 py-4 font-medium">发布时间</th>
                        <th class="px-4 py-4 font-medium">操作</th>
                    </tr>
                </thead>
                <tbody class="divide-y divide-base-300 divide-dashed">
                    <tr v-if="list_error">
                        <td :colspan="view === 'active' ? 8 : 7" class="px-6 py-8 text-center text-error">{{ list_error }}</td>
                    </tr>
                    <tr v-else-if="article_list.length === 0">
                        <td :colspan="view === 'active' ? 8 : 7" class="px-6 py-8 text-center text-base-content/40">
                            {{ view === 'trash' ? '回收站为空' : '暂无文章' }}
                        </td>
                    </tr>
                    <tr v-for="article in article_list" :key="article.slug" class="text-center hover:bg-base-300/50 link-transition">
                        <td v-if="view === 'active'" class="px-3 py-3.5">
                            <input type="checkbox" class="checkbox checkbox-primary checkbox-sm"
                                :checked="selected.has(article.slug)" @change="toggle_select(article.slug)" />
                        </td>
                        <td class="px-4 py-3.5 text-base-content/70">
                            {{ article.categories?.[0]?.name || '—' }}
                        </td>
                        <td class="px-4 py-3 text-base-content/80 text-left max-w-xs truncate">
                            <RouterLink :to="{ name: 'ArticleDetail', params: { slug: article.slug } }"
                                target="_blank" rel="noopener" class="link link-hover"
                                :title="'预览：' + article.title">
                                {{ article.title }}
                            </RouterLink>
                        </td>
                        <td class="px-4 py-3 text-base-content/70 text-left">
                            {{ article.user?.nickname ?? '—' }}
                        </td>
                        <td class="px-4 py-3">
                            <button class="btn btn-xs whitespace-nowrap"
                                :class="article.is_recommended ? 'btn-primary btn-soft' : 'btn-ghost'"
                                :disabled="action_slug === article.slug"
                                @click="toggle_recommended(article)">
                                {{ article.is_recommended ? '已推荐' : '未推荐' }}
                            </button>
                        </td>
                        <td class="px-4 py-3 text-base-content/70">{{ article.view_count }}</td>
                        <td class="px-4 py-3 text-base-content/60">{{ dayjs(article.create_at).format('YYYY-MM-DD HH:mm') }}</td>
                        <td class="px-4 py-3">
                            <div class="flex items-center justify-center gap-1">
                                <template v-if="view === 'active'">
                                    <button class="btn btn-ghost btn-xs text-primary whitespace-nowrap"
                                        @click="open_edit(article)">编辑</button>
                                    <button class="btn btn-ghost btn-xs text-error whitespace-nowrap"
                                        :disabled="action_slug === article.slug"
                                        @click="remove_article(article)">删除</button>
                                </template>
                                <button v-else class="btn btn-ghost btn-xs text-primary whitespace-nowrap"
                                    :disabled="action_slug === article.slug"
                                    @click="restore_article(article)">恢复</button>
                            </div>
                        </td>
                    </tr>
                </tbody>
            </table>

                    <AppPagination class="px-6 py-4" :page="page" :has-next="has_next"
                        :total="total" unit="条" @change="go_page" />
                </div>

        <!-- 新增/编辑弹窗 -->
        <AppModal v-model="show_modal" max-width="max-w-3xl"
            :title="modal_mode === 'create' ? '新增文章' : '编辑文章'">
                    <div class="flex flex-col gap-4">
                        <label class="text-sm text-base-content/70">标题
                            <input v-model="form.title"
                                class="input input-bordered w-full mt-1" />
                        </label>

                        <label class="text-sm text-base-content/70">正文（Markdown）
                            <textarea v-model="form.content" rows="10"
                                class="textarea textarea-bordered w-full mt-1 font-mono"></textarea>
                        </label>

                        <div class="text-sm text-base-content/70">
                            封面图
                            <div class="mt-1 flex items-center gap-3">
                                <input type="file" accept="image/jpeg,image/png,image/gif,image/webp"
                                    class="text-sm text-base-content/60 file:mr-3 file:rounded-lg file:border-0 file:bg-primary/10 file:px-3 file:py-1.5 file:text-sm file:font-semibold file:text-primary/90 hover:file:bg-primary/20"
                                    :disabled="uploading_cover" @change="pick_cover" />
                                <span v-if="uploading_cover" class="text-xs text-base-content/40">上传中...</span>
                            </div>
                            <div class="mt-2 flex items-center gap-3">
                                <img v-if="form.cover_img_slug" :src="url_prefix.pic_prefix + form.cover_img_slug" alt="cover"
                                    class="h-16 w-24 rounded-lg object-cover ring-1 ring-base-300" />
                                <input v-model="form.cover_img_slug" placeholder="或直接填图片 slug"
                                    class="input input-bordered flex-1 mt-1" />
                                <button v-if="form.cover_img_slug" class="btn btn-ghost btn-xs text-error shrink-0"
                                    @click="form.cover_img_slug = ''">清除</button>
                            </div>
                        </div>

                        <div class="text-sm text-base-content/70">
                            关联分类（仅二级，可多选）
                            <div class="mt-2 flex flex-wrap gap-2">
                                <button v-for="opt in second_level_options" :key="opt.id" type="button"
                                    class="badge cursor-pointer" :class="form.category_ids.includes(opt.id)
                                        ? 'badge-primary'
                                        : 'badge-outline'"
                                    @click="toggle_category(opt.id)">
                                    {{ opt.label }}
                                </button>
                            </div>
                        </div>

                        <div class="flex flex-row gap-6 text-sm text-base-content/70">
                            <label class="flex items-center gap-2">
                                <input v-model="form.is_recommended" type="checkbox" class="checkbox checkbox-primary" />
                                推荐（首页轮播候选）
                            </label>
                        </div>

                <p v-if="modal_error" class="text-sm text-error">{{ modal_error }}</p>
            </div>
            <template #footer>
                <button class="btn" @click="show_modal = false">取消</button>
                <button class="btn btn-main btn-primary" :disabled="saving"
                    :class="{ 'btn-disabled': saving }"
                    @click="submit_form">
                    {{ saving ? '保存中...' : '保存' }}
                </button>
            </template>
        </AppModal>

        <!-- 批量分类弹窗 -->
        <AppModal v-model="show_batch_modal" max-width="max-w-lg"
            :title="batch_mode === 'add' ? '批量加入分类' : '批量从分类移除'">
            <p class="text-sm text-base-content/60 mb-4">
                已选 {{ selected.size }} 篇文章，选择目标分类（仅二级）：
            </p>
            <div class="flex flex-wrap gap-2">
                <button v-for="opt in second_level_options" :key="opt.id" type="button"
                    class="badge cursor-pointer"
                    :class="batch_category_id === opt.id ? 'badge-primary' : 'badge-outline'"
                    @click="batch_category_id = opt.id">
                    {{ opt.label }}
                </button>
            </div>
            <p v-if="batch_error" class="mt-3 text-sm text-error">{{ batch_error }}</p>
            <template #footer>
                <button class="btn" @click="show_batch_modal = false">取消</button>
                <button class="btn btn-main btn-primary" :disabled="batch_saving"
                    :class="{ 'btn-disabled': batch_saving }"
                    @click="submit_batch">
                    {{ batch_saving ? '提交中...' : '确认' }}
                </button>
            </template>
        </AppModal>
    </main>
</template>
