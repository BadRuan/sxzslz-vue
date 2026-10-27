import { ref } from 'vue';
import { defineStore } from 'pinia';
import apiService from '@/utils/apiService';

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

  const is_logged_in = () => get_token() !== null;

  const login = async (username: string, password: string) => {
    loading.value = true
    try {
      const res = await authService.login({ username, password });
      set_token(res.access_token);
      return true
    } catch (error: any) {
      // 401/400 的 detail 为字符串；422 的 detail 为数组取 [0].msg
      const detail = error?.response?.data?.detail;
      const message = Array.isArray(detail) ? detail[0]?.msg : detail;
      throw new Error(message || '登录失败，请稍后重试')
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
      const detail = error?.response?.data?.detail;
      const message = Array.isArray(detail) ? detail[0]?.msg : detail;
      throw new Error(message || '密码修改失败，请稍后重试')
    } finally {
      loading.value = false
    }
  }

  return { user, loading, is_logged_in, login, fetchMe, logout, changePassword }
})
