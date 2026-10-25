import type { CategoryModel } from '@/store/base';

/** GET /categories/ 返回的扁平分类（CategoryOut），含 parent_id */
export interface CategoryFlat {
    id: number
    name: string
    parent_id: number
    sort: number
}

/** 扁平分类建树后的节点（管理页用，保留 parent_id 便于表单回填） */
export interface CategoryTreeNode extends CategoryFlat {
    children: CategoryTreeNode[]
}

export interface FlatCategory {
    node: CategoryModel
    depth: number
}

/** 扁平列表建树；父分类缺失的孤儿子分类提升为顶级，避免静默丢数据 */
export const build_category_tree = (list: CategoryFlat[]): CategoryTreeNode[] => {
    const map = new Map<number, CategoryTreeNode>();
    list.forEach(item => map.set(item.id, { ...item, children: [] }));
    const roots: CategoryTreeNode[] = [];
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

/** 先序遍历展开为平表，depth 表示在树中的深度（0 = 一级分类） */
export const flatten_categories = (tree: CategoryModel[]): FlatCategory[] => {
    const result: FlatCategory[] = [];
    const walk = (nodes: CategoryModel[], depth: number) => {
        for (const node of nodes) {
            result.push({ node, depth });
            walk(node.children, depth + 1);
        }
    };
    walk(tree, 0);
    return result;
};

/** 先序展开 CategoryTreeNode */
export const flatten_tree = (nodes: CategoryTreeNode[], depth = 0): { node: CategoryTreeNode; depth: number }[] =>
    nodes.flatMap(n => [{ node: n, depth }, ...flatten_tree(n.children, depth + 1)]);

export const find_category = (tree: CategoryModel[], id: number): CategoryModel | undefined => {
    for (const node of tree) {
        if (node.id === id) return node;
        const found = find_category(node.children, id);
        if (found) return found;
    }
    return undefined;
};

/**
 * 文章仅支持二级分类：给定分类 id 若为一级分类则退化为其第一个子分类。
 * id 缺失、或一级分类无子分类时返回 undefined；二级 / 未知 id 原样保留。
 */
export const to_second_level_id = (
    tree: CategoryModel[],
    id: number | undefined
): number | undefined => {
    if (id === undefined) return undefined;
    if (!tree.some(root => root.id === id)) return id;
    return find_category(tree, id)?.children[0]?.id;
};

/** 按名称在树中查找分类（支持多个候选名，命中第一个） */
export const find_by_name = (tree: CategoryModel[], names: string | string[]): CategoryModel | undefined => {
    const candidates = Array.isArray(names) ? names : [names];
    for (const name of candidates) {
        for (const { node } of flatten_categories(tree)) {
            if (node.name === name) return node;
        }
    }
    return undefined;
};

const warned_names = new Set<string>();

/** 分类名 → 分类 id。树非空却找不到时告警一次并返回 undefined，供调用方容错 */
export const name_category_id = (tree: CategoryModel[], names: string | string[]): number | undefined => {
    const found = find_by_name(tree, names);
    if (!found && tree.length > 0) {
        const key = Array.isArray(names) ? names.join('/') : names;
        if (!warned_names.has(key)) {
            warned_names.add(key);
            console.warn(`分类名未找到: ${key}`);
        }
    }
    return found?.id;
};

/**
 * 文章关联分类展示文本：只取分类自身名称（文章仅挂二级分类，无需拼接一级前缀；
 * 分类名允许重名，列表场景展示首个匹配的分类名即可），多个分类用顿号连接。
 */
export const categories_label = (
    categories: Pick<CategoryModel, 'id' | 'name'>[] | undefined
): string =>
    (categories ?? []).map(c => c.name).join('、');

/**
 * 列表卡片用的紧凑分类展示：只展示一个二级分类名称（优先当前浏览的分类，否则第一个），
 * 其余折叠为数量。label 为展示文本，extra 为未展示个数，title 为全部分类名（悬停提示）。
 */
export const categories_compact = (
    categories: Pick<CategoryModel, 'id' | 'name'>[] | undefined,
    active_id?: number
): { label: string; extra: number; title: string } => {
    const list = categories ?? [];
    if (list.length === 0) return { label: '', extra: 0, title: '' };
    const shown = list.find(c => c.id === active_id) ?? list[0];
    return { label: shown?.name ?? '', extra: list.length - 1, title: categories_label(list) };
};
