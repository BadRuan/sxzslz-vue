/**
 * 登录 token 的本地存取（独立工具模块）。
 *
 * 单独抽出而非放在 store/auth：request.ts / apiService.ts 只需要读写 token，
 * 不该依赖整个 Pinia store，可避免 request → store/auth → apiService → request 的循环依赖。
 */
const TOKEN_KEY = 'access_token';

export const get_token = (): string | null => localStorage.getItem(TOKEN_KEY);

export const set_token = (token: string): void => localStorage.setItem(TOKEN_KEY, token);

export const clear_token = (): void => localStorage.removeItem(TOKEN_KEY);
