import dayjs from 'dayjs';
import type { CategoryModel } from '@/store/base';
import { find_category } from '@/utils/category';

/**
 * 格式化日期为 YYYY-MM-DD 格式
 */
export const date_text = (date_value: string): string => {
    return dayjs(date_value).format('YYYY-MM-DD')
};

export const easy_date_text = (date_value: string): string => {
    return dayjs(date_value).format('MM/DD')
};

/**
 * 根据分类ID获取分类名称
 */
export const category_text = (category_id: number | undefined, categories: CategoryModel[]): string => {
    if (!category_id) {
        return '';
    }
    return find_category(categories, category_id)?.name ?? '';
};