import axios from 'axios';

/**
 * 从未知错误中取 HTTP 状态码；非 axios 错误（网络中断、代码异常）返回 undefined。
 * 用于区分「token 失效（401，需清登录态）」与「网络抖动/5xx（保留登录态，可重试）」。
 */
export const api_error_status = (error: unknown): number | undefined => {
    if (axios.isAxiosError(error)) return error.response?.status;
    return undefined;
};

/**
 * 从 axios 错误提取后端 detail（对接文档 §3）：
 * 400/401/403/404/500 的 detail 为字符串；422 为数组取首条 msg。
 */
export const api_error_detail = (error: unknown, fallback: string): string => {
    if (axios.isAxiosError(error)) {
        const detail = error.response?.data?.detail;
        if (Array.isArray(detail)) return detail[0]?.msg || fallback;
        if (typeof detail === 'string' && detail) return detail;
        if (!error.response) return '网络连接失败，请检查网络后重试';
        return fallback;
    }
    if (error instanceof Error && error.message) return error.message;
    return fallback;
};
