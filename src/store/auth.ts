import { ref, computed } from 'vue';
import { defineStore } from 'pinia';
import apiService from '@/utils/apiService';
import { api_error_detail, api_error_status } from '@/utils/apiError';
import { get_token, set_token, clear_token } from '@/utils/token';

/** TokenOut */
export interface TokenModel {
    access_token: string,
    token_type: string,
}

/** UserOut */
export interface AuthUserModel {
    id: number,
    slug: string,
    nickname: string,
    is_superuser: boolean,
}

/** PUT /auth/password 请求体：new_password 服务端要求至少 6 位 */
export interface PasswordChangeInput {
    old_password: string,
    new_password: string,
}

/** 登录是公开接口：匿名请求，避免历史失效 token 干扰登录 */
const request_login = (data: { username: string, password: string }) =>
    apiService.post<TokenModel>('/auth/login', data, { skip_auth: true });

const request_me = () => apiService.get<AuthUserModel>('/auth/me');

const request_change_password = (data: PasswordChangeInput) =>
    apiService.put<{ detail: string }>('/auth/password', data);

export const useAuthStore = defineStore('auth', () => {
    const user = ref<AuthUserModel | null>(null);
    const loading = ref(false);

    /** 是否超级管理员：控制后台差异展示（全站文章、作者/发布时间指定、分类管理） */
    const is_superuser = computed(() => user.value?.is_superuser === true);

    /** 是否普通账号（已登录且非超管）：仅本人文章与本人上传可见/可管理 */
    const is_normal_user = computed(() => user.value !== null && !user.value.is_superuser);

    const is_logged_in = () => get_token() !== null;

    const login = async (username: string, password: string) => {
        loading.value = true
        try {
            const res = await request_login({ username, password });
            set_token(res.access_token);
            // 立即拉取用户信息（含 is_superuser），避免各页面各自等待 fetchMe
            await fetchMe();
            return true
        } catch (error: any) {
            throw new Error(api_error_detail(error, '登录失败，请稍后重试'))
        } finally {
            loading.value = false
        }
    }

    /** 拉取当前用户；仅 401（token 失效）才清空登录态，网络抖动/5xx 保留缓存用户可重试 */
    const fetchMe = async (): Promise<AuthUserModel | null> => {
        if (!is_logged_in()) return null
        try {
            user.value = await request_me()
            return user.value
        } catch (error) {
            if (api_error_status(error) === 401) {
                // token 无效或过期：清掉避免后续写接口持续 401
                clear_token()
                user.value = null
                return null
            }
            // 断网/超时/服务端 5xx：不清 token、不清 user，保留已登录状态
            return user.value
        }
    }

    /** 确保用户信息已加载（路由守卫 / 权限判断前调用），无可用 token 时返回 null */
    const ensure_user = async (): Promise<AuthUserModel | null> => {
        if (user.value !== null) return user.value
        return fetchMe()
    }

    const logout = () => {
        clear_token()
        user.value = null
    }

    /** 修改密码：400 原密码错误 / 422 新密码不足 6 位，detail 统一抛出给页面展示 */
    const changePassword = async (old_password: string, new_password: string) => {
        loading.value = true
        try {
            await request_change_password({ old_password, new_password })
            return true
        } catch (error: any) {
            throw new Error(api_error_detail(error, '密码修改失败，请稍后重试'))
        } finally {
            loading.value = false
        }
    }

    return {
        user,
        loading,
        is_superuser,
        is_normal_user,
        is_logged_in,
        login,
        fetchMe,
        ensure_user,
        logout,
        changePassword,
    }
})
