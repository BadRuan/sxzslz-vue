/**
 * 统一的登录跳转工具：401/Token 失效时调用。
 * 保留当前页面作为 redirect，登录成功后由路由守卫回跳。
 * 已在登录页则不跳转，避免循环。
 */
export const redirect_to_login = (): void => {
    if (window.location.pathname.startsWith('/admin/login')) return;
    const redirect = `${window.location.pathname}${window.location.search}`;
    window.location.href = `/admin/login?redirect=${encodeURIComponent(redirect)}`;
};