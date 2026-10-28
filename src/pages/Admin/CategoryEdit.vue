<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import apiService from '@/utils/apiService';
import { api_error_detail } from '@/utils/apiError';
import AppModal from '@/components/AppModal.vue';
import {
    type CategoryFlat,
    type CategoryTreeNode,
    build_category_tree,
    flatten_tree,
} from '@/utils/category';

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
    form.value = { name: '', parent_id, sort: 0 };
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

onMounted(queryCategoryInfo);
</script>

<template>
    <main class="flex-1 overflow-y-auto p-6">
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
                        <td colspan="4" class="px-6 py-8 text-center text-base-content/40">暂无分类</td>
                    </tr>
                    <tr v-for="{ node, depth } in tree_rows" :key="node.id" class="hover:bg-base-200 link-transition">
                        <td class="px-6 py-3.5 text-base-content/80 text-left"
                            :style="{ paddingLeft: `${1.25 + depth * 1.5}rem` }">
                            {{ node.name }}
                        </td>
                        <td class="px-6 py-3.5 text-base-content/60">{{ depth + 1 }}</td>
                        <td class="px-6 py-3.5 text-base-content/60">{{ node.sort }}</td>
                        <td class="px-6 py-3.5">
                            <div class="flex items-center justify-center gap-1">
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
                        class="input input-bordered w-full mt-1" />
                </label>
                <label class="text-sm text-base-content/70">父分类
                    <select v-model.number="form.parent_id" :disabled="editing_is_first_level"
                        class="select select-bordered w-full mt-1 disabled:opacity-60">
                        <option :value="0">一级分类</option>
                        <option v-for="opt in parent_options" :key="opt.id" :value="opt.id">{{ opt.label }}</option>
                    </select>
                    <span class="block mt-1 text-xs text-base-content/40">
                        {{ editing_is_first_level
                            ? '一级分类不可调整父级'
                            : '分类仅支持二级：子分类只能挂在一级分类下' }}
                    </span>
                </label>
                <label class="text-sm text-base-content/70">排序
                    <input v-model.number="form.sort" type="number"
                        class="input input-bordered w-full mt-1" />
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
    </main>
</template>
