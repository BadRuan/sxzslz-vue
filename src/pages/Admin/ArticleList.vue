<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue';
import { storeToRefs } from 'pinia';
import dayjs from 'dayjs';
import AppPagination from '@/components/AppPagination.vue';
import AppModal from '@/components/AppModal.vue';
import apiService, { type UploadPhase } from '@/utils/apiService';
import { useBaseinfoStore } from '@/store/base';
import { usePermissions } from '@/composables/usePermissions';
import { flatten_categories } from '@/utils/category';
import { api_error_detail } from '@/utils/apiError';
import {
    articleService,
    type ArticleModel,
    type ArticleUpsertInput,
} from '@/store/article';
import { url_prefix } from '@/utils/baseInfo';
import { IMAGE_ACCEPT, validate_images } from '@/utils/upload';

const PAGE_SIZE = 20;

const { is_superuser, is_normal_user, can_manage_categories, can_manage_article } = usePermissions();

/** active = 正常文章列表；trash = 回收站（is_deleted=true，可恢复） */
const view = ref<'active' | 'trash'>('active');
const article_list = ref<ArticleModel[]>([]);
const total = ref(0);
const page = ref(1);
const has_next = ref(false);
const list_error = ref('');
const action_error = ref('');
const action_success = ref('');
const action_slug = ref<string | null>(null); // 正在操作（删除/恢复/切换状态）的文章 slug

/** 作者筛选：仅超管可用（服务端仅对超管生效 user_id；普通账号被强制收敛为本人） */
const filter_user_id = ref<number | ''>('');

// —— 自定义确认弹窗（替代 window.confirm/alert，与 daisyUI 体系一致）——
const confirm_dialog = ref<{ show: boolean, title: string, message: string, on_ok: (() => void) | null }>({
    show: false, title: '', message: '', on_ok: null,
});
const ask_confirm = (title: string, message: string, on_ok: () => void) => {
    confirm_dialog.value = { show: true, title, message, on_ok };
};
const run_confirm = () => {
    const fn = confirm_dialog.value.on_ok;
    confirm_dialog.value.show = false;
    fn?.();
};

const baseinfo_store = useBaseinfoStore();
const { categories, users } = storeToRefs(baseinfo_store);

const fetch_list = async () => {
    list_error.value = '';
    try {
        const res = await articleService.getArticles({
            page: page.value,
            page_size: PAGE_SIZE,
            is_deleted: view.value === 'trash',
            // 普通账号不传 user_id：服务端固定只返回本人文章
            ...(is_superuser.value && filter_user_id.value !== ''
                ? { user_id: filter_user_id.value }
                : {}),
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
const cover_progress = ref(0);
const cover_phase = ref<UploadPhase>('uploading');
const editing_slug = ref<string | null>(null);
/** 编辑时的原始发布时间（截到分钟）：未修改则不提交，避免每次保存把秒/微秒截断 */
const original_create_at = ref('');
/** 编辑详情请求序号：连续点击不同文章时丢弃乱序返回，避免上一篇表单覆盖当前文章 */
let edit_request_seq = 0;
const form = ref<{
    title: string,
    content: string,
    cover_img_slug: string,
    is_recommended: boolean,
    category_ids: number[],
    /** 仅超管：指定发布主体（空 = 保持/默认当前登录用户） */
    user_id: number | '',
    /** 仅超管：发布时间，datetime-local 值（空 = 保持/默认服务器当前时间） */
    create_at: string,
}>({
    title: '',
    content: '',
    cover_img_slug: '',
    is_recommended: false,
    category_ids: [],
    user_id: '',
    create_at: '',
});

/** 仅二级分类可挂文章：base 信息是树形（无 parent_id），严格二级下深度 1 即二级分类 */
const second_level_options = computed(() =>
    flatten_categories(categories.value)
        .filter(({ depth }) => depth === 1)
        .map(({ node }) => ({ id: node.id, label: node.name }))
);

/**
 * 分类字段是否可编辑：
 * - 超管：可任意调整文章分类；
 * - 普通账号：仅新建文章时可选择初始分类，编辑已有文章时分类只读（禁止修改文章分类）。
 */
const can_edit_categories = computed(() => is_superuser.value || modal_mode.value === 'create');

const open_create = () => {
    edit_request_seq++;
    modal_mode.value = 'create';
    editing_slug.value = null;
    original_create_at.value = '';
    // 公开列表均按分类过滤：未分类文章前台不可见，新建时默认选中第一个二级分类（可再调整）
    const default_category = second_level_options.value[0];
    form.value = {
        title: '', content: '', cover_img_slug: '',
        is_recommended: false,
        category_ids: default_category ? [default_category.id] : [],
        user_id: '', create_at: '',
    };
    modal_error.value = '';
    show_modal.value = true;
};

const open_edit = async (row: ArticleModel) => {
    // 先拉详情再开窗：失败/乱序时不展示上一条文章的表单内容（避免误保存覆盖他人文章）
    const request_seq = ++edit_request_seq;
    modal_error.value = '';
    action_error.value = '';
    try {
        // 列表不含 content，编辑前拉详情
        const detail = await articleService.getDetail(row.slug);
        if (request_seq !== edit_request_seq) return;
        modal_mode.value = 'edit';
        editing_slug.value = row.slug;
        original_create_at.value = dayjs(detail.create_at).format('YYYY-MM-DDTHH:mm');
        form.value = {
            title: detail.title,
            content: detail.content ?? '',
            cover_img_slug: detail.cover_img_slug ?? '',
            is_recommended: detail.is_recommended,
            category_ids: (detail.categories ?? []).map(c => c.id),
            user_id: is_superuser.value ? detail.user_id : '',
            // 服务端时间为无时区本地时间，datetime-local 同形，直接截到分钟
            create_at: is_superuser.value ? original_create_at.value : '',
        };
        show_modal.value = true;
    } catch (error) {
        if (request_seq !== edit_request_seq) return;
        action_error.value = api_error_detail(error, '获取文章详情失败，请重试');
    }
};

const pick_cover = async (event: Event) => {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    input.value = '';
    if (!file) return;
    // 预检与 Photo 页共用同一套白名单/大小限制（图片 ≤ 10MB）
    const validation_error = validate_images([file]);
    if (validation_error) {
        modal_error.value = validation_error;
        return;
    }
    uploading_cover.value = true;
    cover_progress.value = 0;
    cover_phase.value = 'uploading';
    modal_error.value = '';
    try {
        const res = await apiService.uploadWithProgress('/image/', file, {
            on_progress: (percent) => { cover_progress.value = Math.min(percent, 99); },
            on_phase: (phase) => {
                cover_phase.value = phase;
                if (phase === 'processing') cover_progress.value = 99;
            },
        });
        form.value.cover_img_slug = res.slug;
    } catch (error) {
        modal_error.value = api_error_detail(error, '封面上传失败');
    } finally {
        uploading_cover.value = false;
    }
};

const toggle_category = (id: number) => {
    if (!can_edit_categories.value) return;
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
        const payload: ArticleUpsertInput = {
            title: form.value.title.trim(),
            content: form.value.content,
            cover_img_slug: form.value.cover_img_slug || null,
            is_recommended: form.value.is_recommended,
        };
        // 普通账号编辑已有文章时不提交分类（保持原分类不变）
        if (can_edit_categories.value) {
            payload.category_ids = form.value.category_ids;
        }
        // user_id / create_at 仅超管提交；普通用户传了也会被服务端忽略。
        // create_at 仅在用户实际改动时提交，避免把后端秒/微秒精度截断成 :00。
        if (is_superuser.value) {
            if (form.value.user_id !== '') payload.user_id = form.value.user_id;
            if (form.value.create_at && form.value.create_at !== original_create_at.value) {
                payload.create_at = form.value.create_at;
            }
        }
        if (modal_mode.value === 'create') {
            await articleService.create(payload);
        } else if (editing_slug.value !== null) {
            await articleService.update(editing_slug.value, payload);
        }
        show_modal.value = false;
        await fetch_list();
        action_success.value = modal_mode.value === 'create' ? '文章已创建' : '文章已保存';
        setTimeout(() => { action_success.value = ''; }, 3000);
    } catch (error) {
        modal_error.value = api_error_detail(error, '保存失败，请稍后重试');
    } finally {
        saving.value = false;
    }
};

// —— 行内操作 ——
const remove_article = (row: ArticleModel) => {
    ask_confirm('删除文章', `确认删除文章「${row.title}」吗？（移入回收站，可在回收站恢复）`, async () => {
        action_slug.value = row.slug;
        action_error.value = '';
        try {
            await articleService.remove(row.slug);
            if (selected.value.has(row.slug)) {
                const next = new Set(selected.value);
                next.delete(row.slug);
                selected.value = next;
            }
            await fetch_list();
        } catch (error) {
            action_error.value = api_error_detail(error, '删除失败，请稍后重试');
        } finally {
            action_slug.value = null;
        }
    });
};

const restore_article = (row: ArticleModel) => {
    ask_confirm('恢复文章', `确认恢复文章「${row.title}」吗？（重新回到正常列表）`, async () => {
        action_slug.value = row.slug;
        action_error.value = '';
        try {
            await articleService.restore(row.slug);
            await fetch_list();
        } catch (error) {
            action_error.value = api_error_detail(error, '恢复失败，请稍后重试');
        } finally {
            action_slug.value = null;
        }
    });
};

const toggle_recommended = async (row: ArticleModel) => {
    action_slug.value = row.slug;
    action_error.value = '';
    try {
        await articleService.update(row.slug, { is_recommended: !row.is_recommended });
        await fetch_list();
    } catch (error) {
        action_error.value = api_error_detail(error, '操作失败，请稍后重试');
    } finally {
        action_slug.value = null;
    }
};

// —— 批量分类（仅超管；后端对普通账号返回 403） ——
const selected = ref<Set<string>>(new Set());
const all_on_page_selected = computed(() =>
    article_list.value.length > 0 && article_list.value.every(a => selected.value.has(a.slug)));

const toggle_select_all = () => {
    if (!can_manage_categories.value) return;
    const next = new Set(selected.value);
    if (all_on_page_selected.value) article_list.value.forEach(a => next.delete(a.slug));
    else article_list.value.forEach(a => next.add(a.slug));
    selected.value = next;
};

const toggle_select = (slug: string) => {
    if (!can_manage_categories.value) return;
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
    if (!can_manage_categories.value) return;
    batch_mode.value = mode;
    batch_category_id.value = null;
    batch_error.value = '';
    show_batch_modal.value = true;
};

const submit_batch = async () => {
    if (!can_manage_categories.value) {
        batch_error.value = '仅超级管理员可管理文章分类';
        return;
    }
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
        action_success.value = `已${batch_mode.value === 'add' ? '加入' : '移出'}分类，共处理 ${res.affected} 篇文章`;
        setTimeout(() => { action_success.value = ''; }, 4000);
        await fetch_list();
    } catch (error) {
        batch_error.value = api_error_detail(error, '批量操作失败，请稍后重试');
    } finally {
        batch_saving.value = false;
    }
};

// 超管切换作者筛选：回到第一页并清空选择
watch(filter_user_id, () => {
    if (!is_superuser.value) return;
    page.value = 1;
    clear_selection();
    fetch_list();
});

/** 表格列数随「是否显示勾选列」变化 */
const column_count = computed(() => (is_superuser.value && view.value === 'active' ? 8 : 7));

onMounted(
    async () => {
        fetch_list();
        baseinfo_store.checkBaseinfo();
    }
);
</script>

<template>
    <main class="flex-1 overflow-y-auto p-6">
        <div class="flex items-center justify-between mb-4">
            <div class="flex items-center gap-4">
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
            <div class="flex items-center gap-3">
                <!-- 超管：按发布主体筛选（普通账号由后端固定收敛为本人，无需筛选） -->
                <select v-if="is_superuser" v-model="filter_user_id"
                    class="select select-bordered select-sm w-48">
                    <option :value="''">全部作者</option>
                    <option v-for="u in users" :key="u.id" :value="u.id">{{ u.nickname }}</option>
                </select>
                <button
                    v-if="view === 'active'"
                    class="btn btn-main btn-primary"
                    @click="open_create">
                    + 新增文章
                </button>
            </div>
        </div>

        <!-- 普通账号权限说明：仅本人文章，分类不可改 -->
        <div v-if="is_normal_user" role="status" class="alert alert-info mb-4 text-sm py-2">
            <span>
                当前为普通账号：仅显示并管理本人文章；文章分类由管理员维护，普通账号不可修改。
            </span>
        </div>

        <p v-if="action_error" role="alert" class="alert alert-error mb-4 text-sm">{{ action_error }}</p>
        <p v-if="action_success" role="alert" class="alert alert-success mb-4 text-sm">{{ action_success }}</p>

        <div v-if="is_superuser && view === 'active' && selected.size > 0" role="alert"
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
                        <th v-if="is_superuser && view === 'active'" class="px-3 py-4 font-medium">
                            <input type="checkbox" class="checkbox checkbox-primary checkbox-sm"
                                :checked="all_on_page_selected" @change="toggle_select_all" />
                        </th>
                        <th class="px-4 py-4 font-medium">分类</th>
                        <th class="px-4 py-4 font-medium">标题</th>
                        <!-- 1024 内容区仅 784px，作者+浏览量两列 xl 起显示，保证操作列无需横滚可见 -->
                        <th class="px-4 py-4 font-medium hidden xl:table-cell">作者</th>
                        <th class="px-4 py-4 font-medium">推荐</th>
                        <th class="px-4 py-4 font-medium hidden xl:table-cell">浏览量</th>
                        <th class="px-4 py-4 font-medium whitespace-nowrap">发布时间</th>
                        <th class="px-4 py-4 font-medium">操作</th>
                    </tr>
                </thead>
                <tbody class="divide-y divide-base-300 divide-dashed">
                    <tr v-if="list_error">
                        <td :colspan="column_count" class="px-6 py-8 text-center text-error">{{ list_error }}</td>
                    </tr>
                    <tr v-else-if="article_list.length === 0">
                        <td :colspan="column_count" class="px-6 py-8 text-center text-base-content/40">
                            {{ view === 'trash' ? '回收站为空' : (is_normal_user ? '暂无我的文章' : '暂无文章') }}
                        </td>
                    </tr>
                    <tr v-for="article in article_list" :key="article.slug" class="text-center hover:bg-base-200 link-transition">
                        <td v-if="is_superuser && view === 'active'" class="px-3 py-3.5">
                            <input type="checkbox" class="checkbox checkbox-primary checkbox-sm"
                                :checked="selected.has(article.slug)" @change="toggle_select(article.slug)" />
                        </td>
                        <td class="px-4 py-3.5 text-base-content/70 whitespace-nowrap">
                            {{ article.categories?.[0]?.name || '—' }}
                        </td>
                        <td class="px-4 py-3 text-base-content/80 text-left max-w-xs truncate">
                            <RouterLink :to="{ name: 'ArticleDetail', params: { slug: article.slug } }"
                                target="_blank" rel="noopener" class="link link-hover"
                                :title="'预览：' + article.title">
                                {{ article.title }}
                            </RouterLink>
                        </td>
                        <!-- 长机构名不逐字换行：td 上的 max-width 在 auto 表格布局下不可靠，用内层 div 限宽 -->
                        <td class="px-4 py-3 text-base-content/70 text-left hidden xl:table-cell"
                            :title="article.user?.nickname ?? ''">
                            <div class="max-w-[7rem] truncate">{{ article.user?.nickname ?? '—' }}</div>
                        </td>
                        <td class="px-4 py-3">
                            <button v-if="can_manage_article(article.user_id)" class="btn btn-xs whitespace-nowrap"
                                :class="article.is_recommended ? 'btn-primary btn-soft' : 'btn-ghost'"
                                :disabled="action_slug === article.slug"
                                @click="toggle_recommended(article)">
                                {{ article.is_recommended ? '已推荐' : '未推荐' }}
                            </button>
                            <span v-else class="text-xs text-base-content/30">{{ article.is_recommended ? '已推荐' : '未推荐' }}</span>
                        </td>
                        <td class="px-4 py-3 text-base-content/70 hidden xl:table-cell">{{ article.view_count }}</td>
                        <td class="px-4 py-3 text-base-content/60 whitespace-nowrap">
                            {{ dayjs(article.create_at).format('YYYY-MM-DD HH:mm') }}
                        </td>
                        <td class="px-4 py-3">
                            <div class="flex items-center justify-center gap-1">
                                <template v-if="view === 'active'">
                                    <!-- 超管可操作全部；普通用户仅本人文章（他人操作后端 403） -->
                                    <template v-if="can_manage_article(article.user_id)">
                                        <button class="btn btn-ghost btn-xs text-primary whitespace-nowrap"
                                            @click="open_edit(article)">编辑</button>
                                        <button class="btn btn-ghost btn-xs text-error whitespace-nowrap"
                                            :disabled="action_slug === article.slug"
                                            @click="remove_article(article)">删除</button>
                                    </template>
                                    <span v-else class="text-xs text-base-content/30">—</span>
                                </template>
                                <button v-else-if="can_manage_article(article.user_id)" class="btn btn-ghost btn-xs text-primary whitespace-nowrap"
                                    :disabled="action_slug === article.slug"
                                    @click="restore_article(article)">恢复</button>
                                <span v-else class="text-xs text-base-content/30">—</span>
                            </div>
                        </td>
                    </tr>
                </tbody>
            </table>
        </div>

        <!-- 分页放横滚容器外：表格溢出时翻页按钮不被卷入横向滚动 -->
        <AppPagination class="mt-4" :page="page" :has-next="has_next"
            :total="total" unit="条" @change="go_page" />

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
                                <input type="file" :accept="IMAGE_ACCEPT"
                                    class="text-sm text-base-content/60 file:mr-3 file:rounded-lg file:border-0 file:bg-primary/10 file:px-3 file:py-1.5 file:text-sm file:font-semibold file:text-primary/90 hover:file:bg-primary/20"
                                    :disabled="uploading_cover" @change="pick_cover" />
                                <span v-if="uploading_cover" class="text-xs text-base-content/60 whitespace-nowrap">
                                    {{ cover_phase === 'processing' ? '服务器处理中...' : `上传中 ${cover_progress}%` }}
                                </span>
                            </div>
                            <progress v-if="uploading_cover" class="progress progress-primary w-full mt-2"
                                :value="cover_progress" max="100"></progress>
                            <div class="mt-2 flex items-center gap-3">
                                <img v-if="form.cover_img_slug" :src="url_prefix.pic_prefix + form.cover_img_slug" alt="cover"
                                    loading="lazy" decoding="async"
                                    class="h-16 w-24 rounded-lg object-cover ring-1 ring-base-300" />
                                <input v-model="form.cover_img_slug" placeholder="或直接填图片 slug"
                                    class="input input-bordered flex-1 mt-1" />
                                <button v-if="form.cover_img_slug" class="btn btn-ghost btn-xs text-error shrink-0"
                                    @click="form.cover_img_slug = ''">清除</button>
                            </div>
                        </div>

                        <!-- 超管专属：指定发布主体与发布时间（普通用户由服务端从 JWT / 当前时间取值） -->
                        <template v-if="is_superuser">
                            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm text-base-content/70">
                                <label>发布主体（作者）
                                    <select v-model="form.user_id" class="select select-bordered w-full mt-1">
                                        <option :value="''">默认：当前登录用户</option>
                                        <option v-for="u in users" :key="u.id" :value="u.id">{{ u.nickname }}</option>
                                    </select>
                                </label>
                                <label>发布时间
                                    <input v-model="form.create_at" type="datetime-local"
                                        class="input input-bordered w-full mt-1" />
                                    <span class="block mt-1 text-xs text-base-content/40">留空则新增时用服务器当前时间，编辑时保持不变</span>
                                </label>
                            </div>
                        </template>

                        <div class="text-sm text-base-content/70">
                            关联分类（仅二级，可多选）
                            <div class="mt-2 flex flex-wrap gap-2">
                                <button v-for="opt in second_level_options" :key="opt.id" type="button"
                                    class="badge"
                                    :class="[
                                        form.category_ids.includes(opt.id) ? 'badge-primary' : 'badge-outline',
                                        can_edit_categories ? 'cursor-pointer' : 'opacity-70 cursor-not-allowed',
                                    ]"
                                    :disabled="!can_edit_categories"
                                    @click="toggle_category(opt.id)">
                                    {{ opt.label }}
                                </button>
                            </div>
                            <span v-if="!can_edit_categories" class="mt-2 block text-xs text-base-content/40">
                                普通账号不可修改已有文章的分类，如需调整请联系管理员。
                            </span>
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

        <!-- 批量分类弹窗（仅超管渲染） -->
        <AppModal v-if="is_superuser" v-model="show_batch_modal" max-width="max-w-lg"
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

        <!-- 删除/恢复确认弹窗 -->
        <AppModal v-model="confirm_dialog.show" :title="confirm_dialog.title">
            <p class="text-sm text-base-content/70">{{ confirm_dialog.message }}</p>
            <template #footer>
                <button class="btn" @click="confirm_dialog.show = false">取消</button>
                <button class="btn btn-main btn-primary" @click="run_confirm">确认</button>
            </template>
        </AppModal>
    </main>
</template>
