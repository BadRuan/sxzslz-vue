import { ref, computed } from 'vue';
import { defineStore } from 'pinia';
import apiService from '@/utils/apiService';
import { api_error_detail } from '@/utils/apiError';

const TOKEN_KEY = 'access_token';

export const get_token = (): string | null => localStorage.getItem(TOKEN_KEY);

export const set_token = (token: string) => localStorage.setItem(TOKEN_KEY, token);

export const clear_token = () => localStorage.removeItem(TOKEN_KEY);

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

class AuthService {
    public login(data: { username: string, password: string }) {
        return apiService.post<TokenModel>('/auth/login', data)
    }
    public me() {
        return apiService.get<AuthUserModel>('/auth/me')
    }
    public changePassword(data: PasswordChangeInput) {
        return apiService.put<{ detail: string }>('/auth/password', data)
    }
}

const authService = new AuthService();

export const useAuthStore = defineStore('auth', () => {
  const user = ref<AuthUserModel | null>(null);
  const loading = ref(false);

  /** 是否超级管理员：控制后台差异展示（他人文章操作、作者/发布时间指定等） */
  const is_superuser = computed(() => user.value?.is_superuser === true);

  const is_logged_in = () => get_token() !== null;

  const login = async (username: string, password: string) => {
    loading.value = true
    try {
      const res = await authService.login({ username, password });
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

  const fetchMe = async () => {
    if (!is_logged_in()) return
    try {
      user.value = await authService.me()
    } catch {
      // token 无效或过期：清掉避免后续写接口持续 401
      clear_token()
      user.value = null
    }
  }

  const logout = () => {
    clear_token()
    user.value = null
  }

  /** 修改密码：400 原密码错误 / 422 新密码不足 6 位，detail 统一抛出给页面展示 */
  const changePassword = async (old_password: string, new_password: string) => {
    loading.value = true
    try {
      await authService.changePassword({ old_password, new_password })
      return true
    } catch (error: any) {
      throw new Error(api_error_detail(error, '密码修改失败，请稍后重试'))
    } finally {
      loading.value = false
    }
  }

  return { user, loading, is_superuser, is_logged_in, login, fetchMe, logout, changePassword }
})
