import dayjs from 'dayjs';
import type { CategoryModel } from '@/store/category';

/**
 * 格式化日期为 YYYY-MM-DD 格式
 */
export const date_text = (date_value: string): string => {
    return dayjs(date_value).format('YYYY-MM-DD')
};

/**
 * 根据分类ID获取分类名称
 */
export const category_text = (category_id: number | undefined, categories: CategoryModel[]): string => {
    if (!category_id) {
        return '';
    }
    // 使用宽松比较处理可能的类型不匹配（string vs number）
    const category = categories.find(item => item.id == category_id);
    return category ? category.name : '';
};