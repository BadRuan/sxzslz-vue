<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import apiService from '@/utils/apiService';
import { api_error_detail } from '@/utils/apiError';
import { useAuthStore } from '@/store/auth';
import { get_token } from '@/utils/token';
import AppModal from '@/components/AppModal.vue';
import {
    type CategoryFlat,
    type CategoryTreeNode,
    build_category_tree,
    flatten_tree,
} from '@/utils/category';

const auth_store = useAuthStore();

// 路由守卫已拦截普通账号；此处再做一次兜底，避免角色变化/直接调用时误操作
const is_forbidden = ref(false);
/** 账号信息拉取失败（网络/服务端异常）且 token 仍有效：提示重试，而非误判为无权限 */
const is_unavailable = ref(false);
const is_loading = ref(true);

const categories = ref<CategoryFlat[]>([]);
const action_error = ref('');
const list_error = ref('');

// 自定义确认弹窗（替代 window.confirm/alert）
const confirm_dialog = ref<{ show: boolean, message: string, on_ok: (() => void) | null }>({
    show: false, message: '', on_ok: null,
});
const run_confirm = () => {
    const fn = confirm_dialog.value.on_ok;
    confirm_dialog.value.show = false;
    fn?.();
};

const tree_rows = computed(() => flatten_tree(build_category_tree(categories.value)));

// —— 同级排序（拖拽为主 + ↑↓ 按钮兜底，共用同一持久化核心）——
const reordering = ref(false);
const drag_id = ref<number | null>(null);
const drop_hint = ref<{ id: number; pos: 'before' | 'after' } | null>(null);

/** 每行的同级位置：按 parent_id 分组，组内顺序即当前展示顺序（基于先序 tree_rows） */
const sibling_info = computed(() => {
    const groups = new Map<number, number[]>();
    for (const { node } of tree_rows.value) {
        const g = groups.get(node.parent_id) ?? [];
        g.push(node.id);
        groups.set(node.parent_id, g);
    }
    const info = new Map<number, { parent_id: number; index: number; length: number }>();
    for (const [parent_id, ids] of groups) {
        ids.forEach((id, index) => info.set(id, { parent_id, index, length: ids.length }));
    }
    return info;
});

/** 同级是否可向 dir 方向移动一位 */
const can_move = (row: CategoryFlat, dir: -1 | 1) => {
    const i = sibling_info.value.get(row.id);
    if (!i || i.length < 2) return false;
    const t = i.index + dir;
    return t >= 0 && t < i.length;
};

/** 按当前展示顺序取同级 id 列表 */
const sibling_ids = (parent_id: number) =>
    tree_rows.value.filter(n => n.node.parent_id === parent_id).map(n => n.node.id);

/**
 * 同级重排持久化：乐观本地换位 → 仅对 sort 变化行串行 PATCH → 一律刷新回服务端真实顺序。
 * 任一请求失败即停止后续请求、记 action_error，由刷新兜底回滚显示。
 */
const apply_reorder = async (parent_id: number, ordered_ids: number[]) => {
    if (reordering.value) return;
    reordering.value = true;
    action_error.value = '';
    const old_sorts = new Map(categories.value.map(c => [c.id, c.sort]));
    // 乐观更新：同级项在原数组槽位内换位（build_category_tree 只认数组顺序）
    const slots: number[] = [];
    categories.value.forEach((c, idx) => { if (c.parent_id === parent_id) slots.push(idx); });
    const by_id = new Map(categories.value.map(c => [c.id, c]));
    slots.forEach((slot, k) => {
        const id = ordered_ids[k];
        const item = id === undefined ? undefined : by_id.get(id);
        if (item) { categories.value[slot] = item; item.sort = k; }
    });
    try {
        for (const [sort, id] of ordered_ids.entries()) {
            if (old_sorts.get(id) !== sort) {
                await apiService.patch('/categories/' + id, { sort });
            }
        }
    } catch (error: any) {
        action_error.value = api_error_detail(error, '排序保存失败，请稍后重试');
    } finally {
        await queryCategoryInfo();
        reordering.value = false;
    }
};

/** ↑↓ 按钮：与同级相邻项交换 */
const move_sibling = (row: CategoryFlat, dir: -1 | 1) => {
    if (reordering.value || !can_move(row, dir)) return;
    const ids = sibling_ids(row.parent_id);
    const info = sibling_info.value.get(row.id)!;
    const target = info.index + dir;
    const from_id = ids[info.index]!;
    const to_id = ids[target]!;
    ids[info.index] = to_id;
    ids[target] = from_id;
    void apply_reorder(row.parent_id, ids);
};

// —— 拖拽（原生 HTML5，仅限同级）——
const on_drag_start = (row: CategoryFlat, e: DragEvent) => {
    // 按钮不可拖，浏览器会把拖源归到最近的可拖 tr，故用起点命中元素判断是否从操作列按钮发起；
    // 同级不足 2 个无处可拖
    const hit = document.elementFromPoint(e.clientX, e.clientY);
    if (reordering.value || hit?.closest('.btn')
        || !can_move(row, -1) && !can_move(row, 1)) {
        e.preventDefault();
        return;
    }
    drag_id.value = row.id;
    e.dataTransfer?.setData('text/plain', String(row.id));
    if (e.dataTransfer) e.dataTransfer.effectAllowed = 'move';
};

const on_drag_over = (row: CategoryFlat, e: DragEvent) => {
    const dragged = drag_id.value;
    if (dragged === null) return;
    const from = categories.value.find(c => c.id === dragged);
    // 跨级（parent_id 不同）不接受落点，同时清掉残留指示线
    if (!from || from.parent_id !== row.parent_id || row.id === dragged) {
        drop_hint.value = null;
        return;
    }
    e.preventDefault();
    if (e.dataTransfer) e.dataTransfer.dropEffect = 'move';
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const pos = e.clientY < rect.top + rect.height / 2 ? 'before' : 'after';
    drop_hint.value = { id: row.id, pos };
};

const on_drop = (row: CategoryFlat, e: DragEvent) => {
    e.preventDefault();
    const dragged = drag_id.value;
    const hint = drop_hint.value;
    drag_id.value = null;
    drop_hint.value = null;
    if (dragged === null || !hint || hint.id !== row.id) return;
    const ids = sibling_ids(row.parent_id);
    const from = ids.indexOf(dragged);
    if (from === -1) return;
    const rest = ids.filter(id => id !== dragged);
    const at = rest.indexOf(hint.id) + (hint.pos === 'after' ? 1 : 0);
    const ordered = [...rest.slice(0, at), dragged, ...rest.slice(at)];
    void apply_reorder(row.parent_id, ordered);
};

const on_drag_end = () => {
    drag_id.value = null;
    drop_hint.value = null;
};

const queryCategoryInfo = async () => {
    list_error.value = '';
    try {
        const res = await apiService.get<CategoryFlat[]>('/categories/');
        categories.value = res;
    } catch (error) {
        list_error.value = api_error_detail(error, '获取分类列表失败');
        console.error('获取分类详细信息失败:', error)
    }
};

// —— 弹窗表单 ——
const show_modal = ref(false);
const modal_mode = ref<'create' | 'edit'>('create');
const form = ref({ name: '', parent_id: 0, sort: 0 });
const editing_id = ref<number | null>(null);
const original_parent_id = ref<number>(0);
const modal_error = ref('');
const saving = ref(false);

/** 编辑一级分类时锁定父级（后端：一级分类不支持调整父级） */
const editing_is_first_level = computed(() =>
    modal_mode.value === 'edit' && original_parent_id.value === 0
);

/** 父分类下拉：严格二级，只允许挂到一级分类下；编辑时排除自身及子孙（防环） */
const parent_options = computed(() => {
    const excluded = new Set<number>();
    if (editing_id.value !== null) {
        const find_and_walk = (nodes: CategoryTreeNode[]): boolean => {
            for (const node of nodes) {
                if (node.id === editing_id.value) {
                    flatten_tree([node]).forEach(({ node: n }) => excluded.add(n.id));
                    return true;
                }
                if (find_and_walk(node.children)) return true;
            }
            return false;
        };
        find_and_walk(build_category_tree(categories.value));
    }
    return build_category_tree(categories.value)
        .filter(node => !excluded.has(node.id))
        .map(node => ({ id: node.id, label: node.name }));
});

const open_create = (parent_id = 0) => {
    modal_mode.value = 'create';
    editing_id.value = null;
    original_parent_id.value = 0;
    // 默认取同级末位的排序 +1（同级按 sort,id 升序，最大 sort 即末位；无同级则 0）
    const siblings = categories.value.filter(c => c.parent_id === parent_id);
    const last_sort = siblings.length ? Math.max(...siblings.map(c => c.sort)) + 1 : 0;
    form.value = { name: '', parent_id, sort: last_sort };
    modal_error.value = '';
    show_modal.value = true;
};

const open_edit = (row: CategoryFlat) => {
    modal_mode.value = 'edit';
    editing_id.value = row.id;
    original_parent_id.value = row.parent_id;
    form.value = { name: row.name, parent_id: row.parent_id, sort: row.sort };
    modal_error.value = '';
    show_modal.value = true;
};

const submit_form = async () => {
    modal_error.value = '';
    if (!form.value.name.trim()) {
        modal_error.value = '名称不能为空';
        return;
    }
    saving.value = true;
    try {
        if (modal_mode.value === 'create') {
            await apiService.post('/categories/', {
                name: form.value.name.trim(),
                parent_id: form.value.parent_id,
                sort: form.value.sort,
            });
        } else if (editing_id.value !== null) {
            const payload: Record<string, unknown> = {
                name: form.value.name.trim(),
                sort: form.value.sort,
            };
            // 父级未变不传，避免误触后端「一级不调父级 / 不能降为一级」校验
            if (!editing_is_first_level.value && form.value.parent_id !== original_parent_id.value) {
                payload.parent_id = form.value.parent_id;
            }
            await apiService.patch('/categories/' + editing_id.value, payload);
        }
        show_modal.value = false;
        await queryCategoryInfo();
    } catch (error: any) {
        modal_error.value = api_error_detail(error, '保存失败，请稍后重试');
    } finally {
        saving.value = false;
    }
};

const remove_category = (row: CategoryTreeNode) => {
    const child_count = flatten_tree([row]).length - 1;
    const message = child_count > 0
        ? `确认删除分类「${row.name}」吗？其下 ${child_count} 个子分类将一并删除，关联文章的分类会被清空。`
        : `确认删除分类「${row.name}」吗？关联文章的分类会被清空。`;
    confirm_dialog.value = {
        show: true,
        message,
        on_ok: async () => {
            action_error.value = '';
            try {
                await apiService.delete('/categories/' + row.id);
                await queryCategoryInfo();
            } catch (error: any) {
                action_error.value = api_error_detail(error, '删除失败，请稍后重试');
            }
        },
    };
};

const load_category_page = async () => {
    is_loading.value = true;
    is_forbidden.value = false;
    is_unavailable.value = false;
    const user = await auth_store.ensure_user();
    if (user === null) {
        is_unavailable.value = get_token() !== null;
        is_loading.value = false;
        return;
    }
    if (!user.is_superuser) {
        is_forbidden.value = true;
        is_loading.value = false;
        return;
    }
    await queryCategoryInfo();
    is_loading.value = false;
};

const retry_load = async () => {
    is_loading.value = true;
    is_unavailable.value = false;
    // 强制重新拉取账号信息（ensure_user 在缓存存在时直接返回）
    await auth_store.fetchMe();
    await load_category_page();
};

onMounted(load_category_page);
</script>

<template>
    <main class="flex-1 overflow-y-auto p-6">
        <div v-if="is_loading" class="card rounded-box p-12 text-center text-base-content/60">
            <span class="loading loading-spinner loading-md mx-auto mb-4 block"></span>
            <p>加载中...</p>
        </div>

        <div v-else-if="is_forbidden" role="alert" class="alert alert-warning text-sm">
            仅超级管理员可管理文章分类，当前账号无此权限。
        </div>

        <div v-else-if="is_unavailable" role="alert" class="alert alert-error text-sm">
            <span>账号信息加载失败，请检查网络后重试。</span>
            <button type="button" class="btn btn-xs" @click="retry_load">重试</button>
        </div>

        <template v-else>
            <div class="flex items-center justify-end mb-6">
                <button class="btn btn-main btn-primary" @click="open_create()">
                    + 新增分类
                </button>
            </div>

            <p v-if="action_error" role="alert" class="alert alert-error mb-4 text-sm">{{ action_error }}</p>
            <p v-if="list_error" role="alert" class="alert alert-error mb-4 text-sm">{{ list_error }}</p>

            <div class="card rounded-box overflow-x-auto">
                <table class="table text-sm text-center">
                    <thead class="border-b border-base-300 text-base-content/60">
                        <tr>
                            <th class="px-6 py-4 font-medium">分类名称</th>
                            <th class="px-6 py-4 font-medium">层级</th>
                            <th class="px-6 py-4 font-medium">排序</th>
                            <th class="px-6 py-4 font-medium">操作</th>
                        </tr>
                    </thead>
                    <tbody class="divide-y divide-base-300 divide-dashed">
                        <tr v-if="!list_error && tree_rows.length === 0">
                            <td colspan="4" class="px-6 py-8 text-center text-base-content/55">暂无分类</td>
                        </tr>
                        <tr v-for="{ node, depth } in tree_rows" :key="node.id"
                            class="hover:bg-base-200 link-transition"
                            :draggable="reordering ? 'false' : 'true'"
                            :class="{
                                'cursor-grab': can_move(node, -1) || can_move(node, 1),
                                'dragging': drag_id === node.id,
                                'drag-line-before': drop_hint?.id === node.id && drop_hint.pos === 'before',
                                'drag-line-after': drop_hint?.id === node.id && drop_hint.pos === 'after',
                            }"
                            @dragstart="on_drag_start(node, $event)"
                            @dragover="on_drag_over(node, $event)"
                            @drop="on_drop(node, $event)"
                            @dragend="on_drag_end()">
                            <td class="px-6 py-3.5 text-base-content/80 text-left"
                                :style="{ paddingLeft: `${1.25 + depth * 1.5}rem` }">
                                {{ node.name }}
                            </td>
                            <td class="px-6 py-3.5 text-base-content/60">{{ depth + 1 }}</td>
                            <td class="px-6 py-3.5 text-base-content/60">{{ node.sort }}</td>
                            <td class="px-6 py-3.5">
                                <div class="flex items-center justify-center gap-1">
                                    <!-- 同级排序：↑↓ 按钮兜底（拖拽为主） -->
                                    <button class="btn btn-ghost btn-xs" title="上移（同级内）"
                                        :disabled="reordering || !can_move(node, -1)"
                                        @click="move_sibling(node, -1)">↑</button>
                                    <button class="btn btn-ghost btn-xs" title="下移（同级内）"
                                        :disabled="reordering || !can_move(node, 1)"
                                        @click="move_sibling(node, 1)">↓</button>
                                    <!-- 仅一级分类可添加子分类（严格二级） -->
                                    <button v-if="depth === 0" class="btn btn-ghost btn-xs text-primary whitespace-nowrap"
                                        @click="open_create(node.id)">添加子分类</button>
                                    <button class="btn btn-ghost btn-xs text-primary whitespace-nowrap" @click="open_edit(node)">编辑</button>
                                    <button class="btn btn-ghost btn-xs text-error whitespace-nowrap" @click="remove_category(node)">删除</button>
                                </div>
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>

            <!-- 新增/编辑弹窗 -->
            <AppModal v-model="show_modal" max-width="max-w-sm"
                :title="modal_mode === 'create' ? '新增分类' : '编辑分类'">
                <div class="flex flex-col gap-3">
                    <label class="text-sm text-base-content/70">名称
                        <input v-model="form.name"
                            class="input w-full mt-1" />
                    </label>
                    <label class="text-sm text-base-content/70">父分类
                        <select v-model.number="form.parent_id" :disabled="editing_is_first_level"
                            class="select w-full mt-1 disabled:opacity-60">
                            <option :value="0">一级分类</option>
                            <option v-for="opt in parent_options" :key="opt.id" :value="opt.id">{{ opt.label }}</option>
                        </select>
                        <span class="block mt-1 text-xs text-base-content/55">
                            {{ editing_is_first_level
                                ? '一级分类不可调整父级'
                                : '分类仅支持二级：子分类只能挂在一级分类下' }}
                        </span>
                    </label>
                    <label class="text-sm text-base-content/70">排序
                        <input v-model.number="form.sort" type="number"
                            class="input w-full mt-1" />
                    </label>
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

            <!-- 删除确认弹窗 -->
            <AppModal v-model="confirm_dialog.show" title="删除分类">
                <p class="text-sm text-base-content/70">{{ confirm_dialog.message }}</p>
                <template #footer>
                    <button class="btn" @click="confirm_dialog.show = false">取消</button>
                    <button class="btn btn-main btn-error" @click="run_confirm">确认删除</button>
                </template>
            </AppModal>
        </template>
    </main>
</template>

<style scoped>
/* 拖拽排序视觉反馈（daisyUI 无对应 API，属自建补充） */
.dragging {
    opacity: 0.4;
}

.drag-line-before {
    box-shadow: inset 0 2px 0 0 var(--color-primary);
}

.drag-line-after {
    box-shadow: inset 0 -2px 0 0 var(--color-primary);
}
</style>
