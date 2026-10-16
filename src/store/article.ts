import { ref, reactive } from 'vue';
import { defineStore } from 'pinia';
import apiService from '@/utils/apiService';
import type { CategoryModel } from '@/store/base';

export interface ArticleUserModel {
    id: number,
    slug: string,
    nickname: string,
}

export interface ArticleModel {
    id: number,
    slug: string,
    cover_img_slug: string | null,
    title: string,
    is_hidden: boolean,
    is_recommended: boolean,
    create_at: string,
    view_count: number,
    like_count: number,
    categories: CategoryModel[],
    user: ArticleUserModel | null,
    content?: string | null,
}

class ArticleService{
    public getArticleByCategoryId(category_id: number = 1, page: number = 1, page_size: number = 30) {
        return apiService.get('/articles/', { category_id, page, page_size })
    }
    public getRecommended(limit: number) {
        return apiService.get('/articles/recommended', { limit })
    }
    public getDetail(slug: string) {
        return apiService.get('/articles/detail/' + slug)
    }
}

const articleService = new ArticleService();

export const useArticleStore = defineStore('article', () => {
  const loading = ref(false);
  const page_number = ref<number>(1);
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
        // 推荐位接口后端暂未提供：独立容错，失败不得阻塞下方分类资讯（spec §2.2）
        try {
          const res = await articleService.getRecommended(8)
          recommended_article.value = res
        } catch (error) {
          console.warn('推荐文章接口暂不可用:', error)
        }
      };
      if (notice_article.value.length == 0){
        const res = await articleService.getArticleByCategoryId(4, 1, 8);
        notice_article.value = res.data;
      };
      if (meeting_article.value.length == 0) {
        const res = await articleService.getArticleByCategoryId(5, 1, 6)
        meeting_article.value = res.data;
      };
      if (finance_article.value.length == 0) {
        const res = await articleService.getArticleByCategoryId(8, 1, 6)
        finance_article.value = res.data;
      };
      if (hr_job.value.length == 0) {
        const res = await articleService.getArticleByCategoryId(7, 1, 6)
        hr_job.value = res.data;
      }
    } catch (error) {
      console.error('获取最新文章列表失败:', error)
    } finally {
      loading.value = false
    }
  }


const article_list = ref<ArticleModel[]>([]);
const article_total = ref<number>(0);
const article_page = ref<number>(1);
const article_has_next = ref<boolean>(false);

const getArticleList = async (category_id: number, page: number, page_size: number) => {
    loading.value = true
    try {
      const res = await articleService.getArticleByCategoryId(category_id, page, page_size)
      article_list.value = res.data
      article_total.value = res.total
      article_page.value = res.page
      article_has_next.value = res.has_next
    } catch (error) {
      console.error('获取文章分类列表失败:', error)
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

  return { article_obj, checkHomeArticle, article_list, article_total, article_page, article_has_next, page_number, getArticleList, article_detail, getDetail, loading }
})
