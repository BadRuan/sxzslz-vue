import { ref } from 'vue';
import { defineStore } from 'pinia';
import apiService from '@/utils/apiService';
import {type ArticleModel} from '@/store/article';


export interface CountModel {
    total_article: number,
    month_article: number,
    image_count: number,
    attachment_count: number,
    user_count: number,
    article_view: number,
    image_view: number,
    download_count: number
}

export interface ImageModel {
  id: number,
  size: number,
  view: number,
  slug: string,
  mime_type: string,
  raw_filename: string,
  upload_at: string
}

class AdminService{
    public getCountinfo() {
      return apiService.get('/admin/')
    }

    public getLatestArticle(limit: number) {
      return apiService.get('/admin/latest/', { limit })
    }

    public getImageList() {
      return apiService.get('/image/')
    }
}

const adminService = new AdminService();

export const useAdminStore = defineStore('admin', () => {
  const count_info = ref<CountModel>({
    total_article: 0,
    month_article: 0,
    image_count: 0,
    attachment_count: 0,
    user_count: 0,
    article_view: 0,
    image_view: 0,
    download_count: 0
  });
  const latest_article = ref<ArticleModel[]>();
  const image_list = ref<ImageModel[]>([]);

  const fetchCountInfo = async () => {
    try {
      const res = await adminService.getCountinfo();
      count_info.value = res;
    } catch (error) {
      console.error('获取管理后台统计信息失败:', error)
    }
  }

  const getAdminLatestArticle = async () => {
    try {
      const res = await adminService.getLatestArticle(30);
      latest_article.value = res;
    } catch (error) {
      console.error('获取管理后台最新文章失败:', error)
    }
  }

  const getImageList = async () => {
    try {
      const res = await adminService.getImageList();
      image_list.value = res['data'];
    } catch (error) {
      console.error('获取管理后台图片列表失败:', error)
    }
  }
  

  return { count_info, latest_article, image_list, fetchCountInfo, getAdminLatestArticle, getImageList }
})
