import { ref, reactive } from 'vue';
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
        return apiService.get('/article/latest/', { category_id, page_size })
    }
    public getRecommended(limit: number) {
        return apiService.get('/article/recommended', { limit })
    }
    public getDetail(slug: string) {
        return apiService.get('/article/detail/' + slug)
    }
}

const articleService = new ArticleService();

export const useArticleStore = defineStore('article', () => {
  const loading = ref(false);

  const recommended_article = ref<ArticleModel[]>([]);
  const notice_article = ref<ArticleModel[]>([]);
  const meeting_article = ref<ArticleModel[]>([]);
  const finance_article = ref<ArticleModel[]>([]);
  const hr_job = ref<ArticleModel[]>([]);
  const article_obj = reactive({
    recommended: recommended_article, // 首页封面图
    notice: notice_article, // 通知公告
    metting: meeting_article, // 会议公开
    finance: finance_article, // 财务信息
    hr_job: hr_job // 人事动态
  })
  const checkHomeArticle = async () =>{
    loading.value = true
    try {
      if (recommended_article.value.length == 0) {
        const res = await articleService.getRecommended(6)
        recommended_article.value = res.data
      };
      if (notice_article.value.length == 0){
        const res = await articleService.getArticleByCategoryId(4, 6);
        notice_article.value = res.data;
      };
      if (meeting_article.value.length == 0) {
        const res = await articleService.getArticleByCategoryId(5, 4)
        meeting_article.value = res.data;
      };
      if (finance_article.value.length == 0) {
        const res = await articleService.getArticleByCategoryId(8, 4)
        finance_article.value = res.data;
      };
      if (hr_job.value.length == 0) {
        const res = await articleService.getArticleByCategoryId(7, 4)
        hr_job.value = res.data;
      }
    } catch (error) {
      console.error('获取最新文章列表失败:', error)
    } finally {
      loading.value = false
    }
  }


const article_list = ref<ArticleModel[]>([]);
const getArticleList = async (category_id: number) => {
    loading.value = true
    try {
      const res = await articleService.getArticleByCategoryId(category_id, 30)
      article_list.value = res.data
    } catch (error) {
      console.error('获取最新文章列表失败:', error)
    } finally {
      loading.value = false
    }
  }

  const article_detail = ref<ArticleModel>();
  const getDetail = async (slug: string) => {
    loading.value = true
    try {
      const res = await articleService.getDetail(slug)
      return article_detail.value = res
    } catch (error) {
      return undefined
    } finally {
      loading.value = false
    }
  }

  return { article_obj, checkHomeArticle, article_list, getArticleList, article_detail, getDetail, loading }
})
