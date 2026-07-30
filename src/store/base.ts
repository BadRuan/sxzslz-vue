import { ref } from 'vue';
import { defineStore } from 'pinia';
import apiService from '@/utils/apiService';


export interface CategoryModel {
    id: number,
    name: string,
}

export interface UserModel {
    id: number,
    nickname: string,
}

class BaseinfoService{
    public getBaseinfo() {
        return apiService.get('/base/')
    }
}

const baseinfoService = new BaseinfoService();

export const useBaseinfoStore = defineStore('baseinfo', () => {
  const categories = ref<CategoryModel[]>([]);
  const users = ref<UserModel[]>([]);
  const loading = ref(false);

  const fetchBaseInfo = async () => {
    loading.value = true
    try {
      const res = await baseinfoService.getBaseinfo();
      users.value = res["user"];
      categories.value = res["category"]; 
    } catch (error) {
      console.error('获取基础信息失败:', error)
    } finally {
      loading.value = false
    }
  }
  
  const checkBaseinfo = async () => {
    if (categories.value.length == 0){
      await fetchBaseInfo();
    }
  }

  return { categories, users, loading, checkBaseinfo }
})
