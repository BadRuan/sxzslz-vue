import { ref, reactive, type Ref } from 'vue';
import { defineStore } from 'pinia';
import apiService from '@/utils/apiService';
import type { CategoryModel } from '@/store/base';
import { useBaseinfoStore } from '@/store/base';
import { name_category_id } from '@/utils/category';
import { CATEGORY_NAMES } from '@/utils/categoryConfig';

export interface ArticleUserModel {
    id: number,
    slug: string,
    nickname: string,
}

/** ArticleOut / ArticleDetailOut */
export interface ArticleModel {
    id: number,
    slug: string,
    cover_img_slug: string | null,
    title: string,
    /** true = 在回收站（前台不展示），后台可恢复 */
    is_deleted: boolean,
    is_recommended: boolean,
    create_at: string,
    view_count: number,
    like_count: number,
    categories: CategoryModel[],
    user: ArticleUserModel | null,
    content?: string | null,
}

/** PageResponse */
export interface PageResponse<T> {
    data: T[],
    total: number,
    page: number,
    page_size: number,
    has_next: boolean,
}

interface ArticleQuery {
    page?: number
    page_size?: number
    category_id?: number
    user_id?: number
    /** true 只返回回收站文章（后台），默认只返回未删除文章 */
    is_deleted?: boolean
}

/** POST /articles/ 请求体；作者为当前登录用户（服务端从 JWT 解析），DEFAULT_USER_ID 仅 service 层兜底 */
export interface ArticleCreateInput {
    title: string,
    content?: string | null,
    cover_img_slug?: string | null,
    is_recommended?: boolean,
    category_ids?: number[],
}

/** PATCH /articles/{slug}：只更新传入字段；可空字段显式传 null 表示清空 */
export interface ArticleUpdateInput {
    title?: string | null,
    content?: string | null,
    cover_img_slug?: string | null,
    is_recommended?: boolean | null,
    category_ids?: number[] | null,
}

/** 从 axios 错误提取后端 detail（400/401/404 为字符串，422 为数组取首条 msg） */
export const api_error_detail = (error: any, fallback: string): string => {
    const detail = error?.response?.data?.detail;
    if (Array.isArray(detail)) return detail[0]?.msg || fallback;
    return detail || fallback;
};

class ArticleService {
    public getArticles(params: ArticleQuery = {}) {
        return apiService.get<PageResponse<ArticleModel>>('/articles/', params)
    }
    public getDetail(slug: string) {
        return apiService.get<ArticleModel>('/articles/' + slug)
    }
    public create(data: ArticleCreateInput) {
        return apiService.post<ArticleModel>('/articles/', data)
    }
    public update(slug: string, data: ArticleUpdateInput) {
        return apiService.patch<ArticleModel>('/articles/' + slug, data)
    }
    public remove(slug: string) {
        return apiService.delete<void>('/articles/' + slug)
    }
    /** 恢复回收站文章（需登录）：文章重新进入正常列表 */
    public restore(slug: string) {
        return apiService.post<ArticleModel>('/articles/' + slug + '/restore')
    }
    /** 批量把多篇文章加入/移出一个二级分类（幂等，需登录） */
    public batchCategory(slugs: string[], category_id: number, mode: 'add' | 'remove') {
        return apiService.post<{ affected: number }>('/articles/batch-category', {
            slugs, category_id, mode,
        })
    }
    /** 匿名点赞：公开接口，每次 +1，返回自增后的计数 */
    public like(slug: string) {
        return apiService.post<{ like_count: number }>('/articles/' + slug + '/like')
    }
}

export const articleService = new ArticleService();

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
    notice: notice_article, // 泵站动态（原通知公告栏）
    metting: meeting_article, // 区级通知（原会议公开栏）
    finance: finance_article, // 财务通知（原财务信息栏）
    hr_job: hr_job // 人事通知（原人事动态栏）
  })

  /** 按分类名称拉取首页栏目文章；名称在分类树中缺失时跳过该栏目 */
  const fill_by_name = async (target: Ref<ArticleModel[]>, names: readonly string[], page_size: number, tree: CategoryModel[]) => {
    if (target.value.length > 0) return;
    const category_id = name_category_id(tree, [...names]);
    if (category_id === undefined) return;
    const res = await articleService.getArticles({ category_id, page: 1, page_size });
    target.value = res.data ?? [];
  }

  // in-flight 锁：首页多个栏目组件并发调用时只拉一次
  let home_inflight: Promise<void> | null = null;

  const checkHomeArticle = async () => {
    if (home_inflight) return home_inflight;
    home_inflight = doCheckHomeArticle().finally(() => { home_inflight = null; });
    return home_inflight;
  }

  const doCheckHomeArticle = async () =>{
    loading.value = true
    try {
      const baseinfo_store = useBaseinfoStore();
      await baseinfo_store.checkBaseinfo();
      const tree = baseinfo_store.categories;

      if (recommended_article.value.length == 0) {
        // 后端无独立推荐接口：取列表后按 is_recommended 过滤，失败不阻塞分类栏目
        try {
          const res = await articleService.getArticles({ page: 1, page_size: 100 });
          recommended_article.value = (res.data ?? [])
            .filter((item) => item.is_recommended)
            .slice(0, 8);
        } catch (error) {
          console.warn('获取推荐文章失败:', error)
        }
      };

      await fill_by_name(notice_article, CATEGORY_NAMES.notice, 8, tree);
      await fill_by_name(meeting_article, CATEGORY_NAMES.meeting, 6, tree);
      await fill_by_name(finance_article, CATEGORY_NAMES.finance, 6, tree);
      await fill_by_name(hr_job, CATEGORY_NAMES.hr, 6, tree);
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
// 列表接口失败标记：界面据此区分「加载失败」与「暂无文章」
const article_list_error = ref(false);

const getArticleList = async (category_id: number, page: number, page_size: number) => {
    loading.value = true
    article_list_error.value = false
    try {
      const res = await articleService.getArticles({ category_id, page, page_size })
      // 后端已过滤回收站文章，total 与展示条目一致
      article_list.value = res.data ?? []
      article_total.value = res.total
      article_page.value = res.page
      article_has_next.value = res.has_next
    } catch (error) {
      article_list_error.value = true
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

  return { article_obj, checkHomeArticle, article_list, article_total, article_page, article_has_next, article_list_error, page_number, getArticleList, article_detail, getDetail, loading }
})
