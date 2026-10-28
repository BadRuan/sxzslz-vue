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
    // in-flight 锁：多组件并发调用 checkBaseinfo 时只发一次 /base/
    let inflight: Promise<void> | null = null;

    const fetchBaseInfo = async () => {
        loading.value = true
        try {
            const res = await request_base_info();
            users.value = res.user ?? [];
            categories.value = res.category ?? [];
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

    /** 用户 id → 昵称（作者展示用，找不到时返回空串） */
    const user_nickname = (user_id: number | null | undefined): string => {
        if (user_id == null) return '';
        return users.value.find(item => item.id === user_id)?.nickname ?? '';
    }

    return { categories, users, loading, fetchBaseInfo, checkBaseinfo, user_nickname }
})
