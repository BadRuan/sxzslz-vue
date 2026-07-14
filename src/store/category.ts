import { ref } from 'vue';
import { defineStore } from 'pinia';
import apiService from '@/utils/apiService';

export interface CategoryModel {
    id: number,
    name: string,
}

class CategoryService{
    public getCategoryArray() {
        return apiService.get('/category')
    }
}

const imageService = new CategoryService();

export const useCategoryStore = defineStore('category', () => {
  const categories = ref<CategoryModel[]>([
    {
        id: 1,
        name: '默认分类'
    }
  ])

  const fetchCategories = async () => {
    try {
      const res = await imageService.getCategoryArray()
      categories.value = res.data
    } catch (error) {
      console.error('获取分类列表失败:', error)
    }
  }

  return { categories, fetchCategories }
})
