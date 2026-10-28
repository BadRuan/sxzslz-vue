import axios from 'axios';

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
