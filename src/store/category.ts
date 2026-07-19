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
  const loading = ref(false)

  const fetchCategories = async () => {
    loading.value = true
    try {
      const res = await categoryService.getCategoryArray()
      categories.value = res.data
    } catch (error) {
      console.error('获取分类列表失败:', error)
    } finally {
      loading.value = false
    }
  }
  
  const checkCategory = async () => {
    if (categories.value.length == 0){
      await fetchCategories();
    }
  }

  return { categories, checkCategory, loading }
})
