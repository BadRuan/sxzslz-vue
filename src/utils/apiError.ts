import axios from 'axios';

/**
 * HTTP 状态码 → 用户可读兜底文案。
 * 仅在后端未返回 JSON `detail` 时使用（例如反向代理 / 网关返回 HTML、或响应体为空），
 * 正常业务错误一律优先展示后端 `detail`（对接文档 §3）。
 */
const HTTP_STATUS_MESSAGES: Record<number, string> = {
    400: '请求参数有误',
    401: '登录状态已失效，请重新登录',
    403: '没有权限执行该操作',
    404: '请求的资源不存在',
    413: '上传内容超过服务器允许的大小（HTTP 413），请压缩或分批后重试',
    422: '提交的数据格式不正确',
    429: '操作过于频繁，请稍后重试',
    500: '服务器内部错误，请稍后重试',
    502: '服务暂时不可用（网关错误），请稍后重试',
    503: '服务暂时不可用，请稍后重试',
    504: '服务响应超时，请稍后重试',
};

/** 上传 XHR / axios 错误之外的自定义错误形状（apiService 用同一套字段） */
interface ResponseLike {
    status?: number,
    data?: unknown,
}

interface ApiErrorLike {
    message?: string,
    status?: number,
    detail?: unknown,
    code?: string,
    response?: ResponseLike,
}

/** 从后端响应体提取 `detail`（对接文档 §3）：字符串直接返回，422 数组取首条 msg */
export const detail_from_payload = (payload: unknown): string | undefined => {
    if (payload === null || payload === undefined) return undefined;

    if (Array.isArray(payload)) {
        const first = payload[0] as { msg?: unknown } | undefined;
        if (typeof first?.msg === 'string' && first.msg.trim()) return first.msg;
        return undefined;
    }

    // 纯文本响应（非 HTML）：直接作为文案；HTML 错误页交给状态码兜底
    if (typeof payload === 'string') {
        const text = payload.trim();
        return text && !text.startsWith('<') ? text : undefined;
    }

    if (typeof payload !== 'object') return undefined;

    const record = payload as Record<string, unknown>;
    const detail = record.detail;
    if (typeof detail === 'string' && detail.trim()) return detail.trim();
    if (Array.isArray(detail)) return detail_from_payload(detail);
    if (detail && typeof detail === 'object') {
        const message = (detail as { msg?: unknown }).msg;
        if (typeof message === 'string' && message.trim()) return message;
    }
    if (typeof record.message === 'string' && record.message.trim()) return record.message;
    return undefined;
};

/** 状态码兜底文案：未知状态带 HTTP 码，便于用户/运维定位（如 413/502 类网关错误） */
export const http_status_message = (status: number | undefined, fallback: string): string => {
    if (status === undefined) return fallback;
    return HTTP_STATUS_MESSAGES[status] ?? `${fallback}（HTTP ${status}）`;
};

/** 统一生成最终展示文案：优先后端 detail，其次状态码兜底 */
export const api_error_message = (
    status: number | undefined,
    payload: unknown,
    fallback = '请求失败，请稍后重试',
): string => detail_from_payload(payload) ?? http_status_message(status, fallback);

const as_api_error_like = (error: unknown): ApiErrorLike | undefined =>
    typeof error === 'object' && error !== null ? (error as ApiErrorLike) : undefined;

/**
 * 从未知错误中取 HTTP 状态码；非 HTTP 错误（网络中断、代码异常）返回 undefined。
 * 同时兼容 axios 错误与 apiService 上传 XHR 构造的错误（`status` / `response.status`）。
 */
export const api_error_status = (error: unknown): number | undefined => {
    if (axios.isAxiosError(error)) return error.response?.status;
    const like = as_api_error_like(error);
    return like?.response?.status ?? like?.status;
};

/**
 * 从任意错误提取可直接展示的文案（对接文档 §3）：
 * - 后端 JSON `detail`（400/401/403/404/500 为字符串；422 取数组首条 msg）
 * - 非 JSON 响应（网关 HTML/空体）按 HTTP 状态码兜底
 * - 超时 / 取消 / 断网给出明确原因，避免「失败但无提示」
 */
export const api_error_detail = (error: unknown, fallback: string): string => {
    if (axios.isAxiosError(error)) {
        if (error.code === 'ECONNABORTED' || error.code === 'ETIMEDOUT') {
            return '请求超时，请检查网络后重试';
        }
        if (error.code === 'ERR_CANCELED') return '请求已取消';
        if (!error.response) return '网络连接失败，请检查网络后重试';
        return api_error_message(error.response.status, error.response.data, fallback);
    }

    const like = as_api_error_like(error);
    if (like) {
        const from_detail = detail_from_payload(like.detail);
        if (from_detail) return from_detail;
        if (like.response) {
            return api_error_message(like.response.status, like.response.data, fallback);
        }
        // apiService 上传错误已带最终文案（如「网络连接中断」「上传超时」）
        if (typeof like.message === 'string' && like.message.trim()) return like.message;
    }
    if (error instanceof Error && error.message) return error.message;
    return fallback;
};

/** 是否为用户主动取消（上传取消按钮 / AbortController） */
export const is_canceled_error = (error: unknown): boolean => {
    if (axios.isCancel(error)) return true;
    if (error instanceof Error && error.name === 'AbortError') return true;
    return as_api_error_like(error)?.code === 'ERR_CANCELED';
};
