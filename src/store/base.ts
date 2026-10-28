import { ref } from 'vue';
import { defineStore } from 'pinia';
import apiService from '@/utils/apiService';
import { api_error_detail } from '@/utils/apiError';

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
    is_superuser: boolean,
}

/** GET /base/ 响应：分类树 + 用户列表（均为公开数据） */
export interface BaseInfoModel {
    category: CategoryModel[],
    user: UserModel[],
}

/** 公开接口：匿名请求，避免普通账号登录后被收敛为「仅本人可见」 */
const request_base_info = () =>
    apiService.get<BaseInfoModel>('/base/', undefined, { skip_auth: true });

export const useBaseinfoStore = defineStore('baseinfo', () => {
    const categories = ref<CategoryModel[]>([]);
    const users = ref<UserModel[]>([]);
    const loading = ref(false);
    /** 基础信息加载失败原因（后端 detail）：前台页面据此提示，避免分类导航静默为空 */
    const error_message = ref('');
    // in-flight 锁：多组件并发调用 checkBaseinfo 时只发一次 /base/
    let inflight: Promise<void> | null = null;

    /**
     * 强制拉取基础信息。失败时向上抛出，让需要感知的页面（如账户管理）展示后端错误；
     * 前台等只需数据的调用方请用 checkBaseinfo（内部兜底，不抛错）。
     */
    const fetchBaseInfo = async () => {
        loading.value = true
        try {
            const res = await request_base_info();
            users.value = res.user ?? [];
            categories.value = res.category ?? [];
            error_message.value = '';
        } catch (error) {
            error_message.value = api_error_detail(error, '基础信息加载失败');
            console.error('获取基础信息失败:', error)
            throw error
        } finally {
            loading.value = false
        }
    }

    const checkBaseinfo = async () => {
        if (categories.value.length > 0) return;
        if (inflight) return inflight;
        // 前台兜底：失败不向上抛，避免各组件 unhandled rejection（页面各自按数据是否为空展示）
        inflight = fetchBaseInfo().catch(() => undefined).finally(() => { inflight = null; });
        return inflight;
    }

    /** 用户 id → 昵称（作者展示用，找不到时返回空串） */
    const user_nickname = (user_id: number | null | undefined): string => {
        if (user_id == null) return '';
        return users.value.find(item => item.id === user_id)?.nickname ?? '';
    }

    return { categories, users, loading, error_message, fetchBaseInfo, checkBaseinfo, user_nickname }
})
