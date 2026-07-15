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
    public getArticleByCategoryId(category_id: number = 1, page_size: number = 4) {
        return apiService.get('/article/latest/?category_id=' + category_id + '&page_size=' + page_size)
    }
    public getRecommended(limit: number) {
        return apiService.get('/article/recommended?limit=' + limit)
    }
    public getDetail(slug: string) {
        return apiService.get('/article/detail/' + slug)
    }
}

const articleService = new ArticleService();

export const useArticleStore = defineStore('article', () => {
  const latest_article = ref<ArticleModel[]>([]);
  const recommended_article = ref<ArticleModel[]>([]);
  const notice_article = ref<ArticleModel[]>([]);
  const metting_article = ref<ArticleModel[]>([]);
  const finance_article = ref<ArticleModel[]>([]);
  const article_detail = ref<ArticleModel>();

  const getLatest = async (category_id: number) => {
    try {
      const res = await articleService.getArticleByCategoryId(category_id, 30)
      latest_article.value = res.data
    } catch (error) {
      console.error('获取最新文章列表失败:', error)
    }
  }

  const getCategoryArticle = async () =>{
    try {
      const res1 = await articleService.getArticleByCategoryId(2, 4)
      notice_article.value = res1.data
      const res2 = await articleService.getArticleByCategoryId(4, 4)
      metting_article.value = res2.data
      const res3 = await articleService.getArticleByCategoryId(5, 4)
      finance_article.value = res3.data
    } catch (error) {
      console.error('获取最新文章列表失败:', error)
    }
  }

  const getRecommended = async () => {
    try {
      const res = await articleService.getRecommended(4)
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



  return { latest_article, notice_article, metting_article, finance_article, getLatest, recommended_article, getRecommended, getCategoryArticle, article_detail, getDetail } 
})
