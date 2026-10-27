import { ref } from 'vue';
import { defineStore } from 'pinia';
import apiService from '@/utils/apiService';


/** CategoryTree：/base/ 与文章 categories 使用的树节点（严格二级，children 恒为下级数组） */
export interface CategoryModel {
    id: number,
    name: string,
    sort: number,
    children: CategoryModel[],
}

/** UserOut */
export interface UserModel {
    id: number,
    slug: string,
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
  // in-flight 锁：多组件并发调用 checkBaseinfo 时只发一次 /base/
  let inflight: Promise<void> | null = null;

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
    if (categories.value.length > 0) return;
    if (inflight) return inflight;
    inflight = fetchBaseInfo().finally(() => { inflight = null; });
    return inflight;
  }

  return { categories, users, loading, checkBaseinfo }
})
