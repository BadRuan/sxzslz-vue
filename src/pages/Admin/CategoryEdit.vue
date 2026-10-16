<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import apiService from '@/utils/apiService';

interface FlatCategory {
    id: number
    name: string
    slug: string
    parent_id: number
    path: string
    level: number
    sort: number
}

interface TreeNode extends FlatCategory {
    children: TreeNode[]
}

const categories = ref<FlatCategory[]>([]);

// 扁平列表建树；父分类已（软）删除的孤儿子分类提升为顶级，避免管理列表静默丢数据
const build_tree = (list: FlatCategory[]): TreeNode[] => {
    const map = new Map<number, TreeNode>();
    list.forEach(item => map.set(item.id, { ...item, children: [] }));
    const roots: TreeNode[] = [];
    list.forEach(item => {
        const node = map.get(item.id)!;
        const parent = item.parent_id !== 0 ? map.get(item.parent_id) : undefined;
        if (parent) {
            parent.children.push(node);
        } else {
            roots.push(node);
        }
    });
    return roots;
};

// 先序展开，表格逐行渲染
const flatten_tree = (nodes: TreeNode[], depth = 0): { node: TreeNode; depth: number }[] =>
    nodes.flatMap(n => [{ node: n, depth }, ...flatten_tree(n.children, depth + 1)]);

const tree_rows = computed(() => flatten_tree(build_tree(categories.value)));

const queryCategoryInfo = async () => {
    try {
        const res = await apiService.get('/categories/');
        categories.value = res;
    } catch (error) {
        console.error('获取分类详细信息失败:', error)
    }
};

// —— 弹窗表单 ——
const show_modal = ref(false);
const modal_mode = ref<'create' | 'edit'>('create');
const form = ref({ name: '', slug: '', parent_id: 0, sort: 0 });
const editing_id = ref<number | null>(null);
const modal_error = ref('');

// 父分类下拉：编辑时排除自身（选其他节点由后端校验防环并回 400）
const parent_options = computed(() =>
    categories.value.filter(c => c.id !== editing_id.value)
);

const open_create = (parent_id = 0) => {
    modal_mode.value = 'create';
    editing_id.value = null;
    form.value = { name: '', slug: '', parent_id, sort: 0 };
    modal_error.value = '';
    show_modal.value = true;
};

const open_edit = (row: FlatCategory) => {
    modal_mode.value = 'edit';
    editing_id.value = row.id;
    form.value = { name: row.name, slug: row.slug, parent_id: row.parent_id, sort: row.sort };
    modal_error.value = '';
    show_modal.value = true;
};

const error_detail = (error: any, fallback: string): string =>
    error?.response?.data?.detail || fallback;

const submit_form = async () => {
    modal_error.value = '';
    try {
        if (modal_mode.value === 'create') {
            await apiService.post('/categories/', form.value);
        } else if (editing_id.value !== null) {
            await apiService.patch('/categories/' + editing_id.value, form.value);
        }
        show_modal.value = false;
        await queryCategoryInfo();
    } catch (error: any) {
        modal_error.value = error_detail(error, '保存失败，请稍后重试');
    }
};

const remove_category = async (row: TreeNode) => {
    if (!window.confirm(`确认删除分类「${row.name}」吗？`)) {
        return;
    }
    try {
        await apiService.delete('/categories/' + row.id);
        await queryCategoryInfo();
    } catch (error: any) {
        window.alert(error_detail(error, '删除失败，请稍后重试'));
    }
};

onMounted(queryCategoryInfo);
</script>

<template>
    <main class="flex-1 overflow-y-auto p-6">
        <div class="flex items-center justify-between mb-6">
            <h2 class="text-xl font-bold text-gray-800">分类管理</h2>
            <button class="rounded-md bg-primary-500 px-4 py-2 text-sm font-semibold text-white hover:bg-primary-400"
                @click="open_create()">
                + 新增分类
            </button>
        </div>

        <div class="bg-white rounded-lg shadow-xs ring-1 ring-border overflow-x-auto">
            <table class="w-full text-sm text-center">
                <thead class="border-b border-border text-gray-500">
                    <tr>
                        <th class="px-5 py-3 font-medium">分类名称</th>
                        <th class="px-5 py-3 font-medium">Slug</th>
                        <th class="px-5 py-3 font-medium">层级</th>
                        <th class="px-5 py-3 font-medium">排序</th>
                        <th class="px-5 py-3 font-medium">操作</th>
                    </tr>
                </thead>
                <tbody class="divide-y divide-border divide-dashed">
                    <tr v-for="{ node, depth } in tree_rows" :key="node.id" class="hover:bg-gray-50">
                        <td class="px-5 py-3 text-gray-700 text-left"
                            :style="{ paddingLeft: `${1.25 + depth * 1.5}rem` }">
                            {{ node.name }}
                        </td>
                        <td class="px-5 py-3 text-gray-500">{{ node.slug }}</td>
                        <td class="px-5 py-3 text-gray-500">{{ node.level }}</td>
                        <td class="px-5 py-3 text-gray-500">{{ node.sort }}</td>
                        <td class="px-5 py-3">
                            <div class="flex items-center justify-center gap-3">
                                <button class="text-xs text-primary-700 hover:underline"
                                    @click="open_create(node.id)">添加子分类</button>
                                <button class="text-xs text-primary-700 hover:underline"
                                    @click="open_edit(node)">编辑</button>
                                <button class="text-xs text-red-600 hover:underline"
                                    @click="remove_category(node)">删除</button>
                            </div>
                        </td>
                    </tr>
                </tbody>
            </table>
        </div>

        <!-- 新增/编辑弹窗 -->
        <div v-if="show_modal" class="fixed inset-0 z-50 flex items-center justify-center">
            <div class="absolute inset-0 bg-black/30" @click="show_modal = false"></div>
            <div class="relative bg-white rounded-lg shadow-xl w-96 p-6">
                <h3 class="text-lg font-bold text-gray-800 mb-4">
                    {{ modal_mode === 'create' ? '新增分类' : '编辑分类' }}
                </h3>
                <div class="flex flex-col gap-3">
                    <label class="text-sm text-gray-600">名称
                        <input v-model="form.name"
                            class="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-800" />
                    </label>
                    <label class="text-sm text-gray-600">Slug
                        <input v-model="form.slug"
                            class="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-800" />
                    </label>
                    <label class="text-sm text-gray-600">父分类
                        <select v-model.number="form.parent_id"
                            class="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-800">
                            <option :value="0">顶级分类</option>
                            <option v-for="c in parent_options" :key="c.id" :value="c.id">{{ c.name }}</option>
                        </select>
                    </label>
                    <label class="text-sm text-gray-600">排序
                        <input v-model.number="form.sort" type="number"
                            class="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-800" />
                    </label>
                    <p v-if="modal_error" class="text-sm text-red-600">{{ modal_error }}</p>
                </div>
                <div class="mt-5 flex justify-end gap-3">
                    <button class="px-4 py-2 text-sm rounded-md bg-gray-100 text-gray-600 hover:bg-gray-200"
                        @click="show_modal = false">取消</button>
                    <button class="px-4 py-2 text-sm rounded-md bg-primary-500 text-white hover:bg-primary-400"
                        @click="submit_form">保存</button>
                </div>
            </div>
        </div>
    </main>
</template>
