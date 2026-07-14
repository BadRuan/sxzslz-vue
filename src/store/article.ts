import { ref } from 'vue';
import { defineStore } from 'pinia';
import apiService from '@/utils/apiService';

export interface ArticleModel {
    id: number,
    slug: string,
    cover_img: string,
    title: string,
    view_count: number
    content: string
    category_id: number
    user_id: number
    create_at: string
    is_public: boolean
    is_recommended: boolean
}

class ArticleService{
    public getLatest() {
        return apiService.get('/article/latest/')
    }
    public getRecommended() {
        return apiService.get('/article/recommended?limit=3')
    }
    public getDetail(slug: string) {
        return apiService.get('/article/detail/' + slug)
    }
}

const articleService = new ArticleService();

export const useArticleStore = defineStore('article', () => {
  const latest_article = ref<ArticleModel[]>([])
  const recommended_article = ref<ArticleModel[]>([])
  const article_detail = ref<ArticleModel>()

  const getLatest = async () => {
    try {
      const res = await articleService.getLatest()
      latest_article.value = res.data
    } catch (error) {
      console.error('获取最新文章列表失败:', error)
    }
  }

  const getRecommended = async () => {
    try {
      const res = await articleService.getRecommended()
      recommended_article.value = res.data
    } catch (error) {
      console.error('获取推荐文章列表失败:', error)
    }
  }

  const getDetail = async (slug: string) => {
    try {
      const res = await articleService.getDetail(slug)
      return article_detail.value = res
    } catch (error) {
      return undefined
    }
  }

  return { latest_article, getLatest, recommended_article, getRecommended, article_detail, getDetail }
})
