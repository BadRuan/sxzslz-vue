import { ref } from 'vue';
import { defineStore } from 'pinia';
import apiService from '@/utils/apiService';

export interface CategoryModel {
    id: number,
    name: string,
}

class CategoryService{
    public getCategoryArray() {
        return apiService.get('/category/')
    }
}

const categoryService = new CategoryService();

export const useCategoryStore = defineStore('category', () => {
  const categories = ref<CategoryModel[]>([])

  const fetchCategories = async () => {
    try {
      const res = await categoryService.getCategoryArray()
      categories.value = res.data
    } catch (error) {
      console.error('获取分类列表失败:', error)
    }
  }

  return { categories, fetchCategories }
})
