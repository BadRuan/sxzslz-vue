import type { CategoryModel } from '@/store/base';

export interface FlatCategory {
    node: CategoryModel
    depth: number
}

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

export const find_category = (tree: CategoryModel[], id: number): CategoryModel | undefined => {
    for (const node of tree) {
        if (node.id === id) return node;
        const found = find_category(node.children, id);
        if (found) return found;
    }
    return undefined;
};

export const find_by_slug = (tree: CategoryModel[], slug: string): CategoryModel | undefined => {
    for (const node of tree) {
        if (node.slug === slug) return node;
        const found = find_by_slug(node.children, slug);
        if (found) return found;
    }
    return undefined;
};

const warned_slugs = new Set<string>();

/** slug → 分类 id。树非空却找不到时告警一次并返回 undefined，供调用方容错（spec §3.5/§6） */
export const slug_category_id = (tree: CategoryModel[], slug: string): number | undefined => {
    const found = find_by_slug(tree, slug);
    if (!found && tree.length > 0 && !warned_slugs.has(slug)) {
        warned_slugs.add(slug);
        console.warn(`分类 slug 未找到: ${slug}`);
    }
    return found?.id;
};
