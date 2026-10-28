import type { AxiosRequestConfig } from 'axios';
import service from './request';
import { url_prefix } from './baseInfo';
import { get_token, clear_token } from '@/utils/token';
import { api_error_message } from '@/utils/apiError';
import { MAX_BATCH_FILES } from '@/utils/upload';

export { MAX_BATCH_FILES };

/** UploadResult：POST /image/、POST /document/ 及其 batch 接口的统一响应（batch 返回数组） */
export interface UploadResult {
    filename: string,
    slug: string,
    content_type: string,
    size_bytes: number,
    /** 相对地址：图片=预览图，文件=下载地址 */
    url: string,
    /** 仅图片有值（原图 ?file_type=raw）；文档为 null */
    raw_url: string | null,
}

/** 上传阶段：字节发送中 → 服务端处理中（生成 WebP 预览 / 落盘写库） */
export type UploadPhase = 'uploading' | 'processing';

export interface UploadOptions {
    /** 已发送字节百分比（0~100）；到 100 仅代表发完，仍需等待服务端返回 */
    on_progress?: (percent: number) => void,
    /** 阶段切换：`processing` = 字节已发完，等待服务端处理结果 */
    on_phase?: (phase: UploadPhase) => void,
    /** 取消上传（AbortController）：断开连接，服务端清理半成品 */
    signal?: AbortSignal,
    /** 整请求超时（含服务端处理等待），默认 5 分钟，避免连接异常时永远无反馈 */
    timeout_ms?: number,
}

/**
 * 上传错误：`status` / `detail` 与 axios 错误保持同一套读取方式，
 * 页面统一交给 api_error_detail 解析（400 后端 detail 优先，非 JSON 响应按状态码兜底）。
 */
export interface UploadRequestError extends Error {
    status?: number,
    detail?: unknown,
    response?: { status: number, data: unknown },
}

/** 上传整请求超时：覆盖「字节发完 → 服务端处理」的等待，防止挂起后无任何提示 */
const DEFAULT_UPLOAD_TIMEOUT_MS = 5 * 60 * 1000;

const create_upload_error = (message: string, status?: number, body?: unknown): UploadRequestError => {
    const error = new Error(message) as UploadRequestError;
    error.status = status;
    error.detail = (body as { detail?: unknown } | null)?.detail ?? body;
    if (status !== undefined) error.response = { status, data: body };
    return error;
};

const create_canceled_error = (): UploadRequestError => {
    const error = create_upload_error('上传已取消');
    error.name = 'AbortError';
    return error;
};

const parse_json = (text: string): unknown => {
    if (!text) return null;
    try {
        return JSON.parse(text);
    } catch {
        return null; // 网关 HTML 错误页 / 空响应体：交由状态码文案兜底
    }
};

/**
 * multipart 请求核心：XHR 上传 + upload.onprogress 读取进度（fetch 无法读上传字节进度）。
 * 注意不要手动设置 Content-Type：浏览器才会带 boundary，手写会丢 boundary 导致 422。
 * 超时限制整个请求（发送 + 等待服务端处理），网络异常或服务端长时间无响应时给出明确提示。
 */
const post_multipart_with_progress = <T>(
    url: string,
    form: FormData,
    options: UploadOptions = {},
): Promise<T> => new Promise((resolve, reject) => {
    const { on_progress, on_phase, signal, timeout_ms = DEFAULT_UPLOAD_TIMEOUT_MS } = options;
    const xhr = new XMLHttpRequest();
    const base = url_prefix.api_prefix.replace(/\/$/, '');
    xhr.open('POST', base + (url.startsWith('/') ? url : `/${url}`));
    xhr.timeout = timeout_ms;

    const token = get_token();
    if (token) {
        xhr.setRequestHeader('Authorization', `Bearer ${token}`);
    }

    // 只结算一次：避免 abort/error/load 竞争时重复 reject 或 resolve
    let settled = false;
    const settle = (action: () => void) => {
        if (settled) return;
        settled = true;
        signal?.removeEventListener('abort', handle_signal_abort);
        action();
    };

    const handle_signal_abort = () => xhr.abort();

    if (signal?.aborted) {
        reject(create_canceled_error());
        return;
    }
    signal?.addEventListener('abort', handle_signal_abort, { once: true });

    on_phase?.('uploading');

    xhr.upload.onprogress = (event) => {
        if (event.lengthComputable) {
            on_progress?.(Math.round((event.loaded / event.total) * 100));
        }
    };
    // 字节已全部发出：之后是服务端处理（图片生成 WebP 预览 / 文档落盘写库），切阶段避免误以为卡死
    xhr.upload.onload = () => {
        on_phase?.('processing');
        on_progress?.(100);
    };

    xhr.onload = () => {
        const body = parse_json(xhr.responseText);

        if (xhr.status >= 200 && xhr.status < 300) {
            settle(() => resolve(body as T));
            return;
        }

        // 与 axios 拦截器一致：401 清 token 回登录页（登录页本身不跳转）
        if (xhr.status === 401) {
            clear_token();
            if (!window.location.pathname.startsWith('/admin/login')) {
                window.location.href = '/admin/login';
            }
        }

        const message = api_error_message(xhr.status, body, '上传失败，请稍后重试');
        settle(() => reject(create_upload_error(message, xhr.status, body)));
    };

    xhr.onerror = () => settle(() => reject(create_upload_error('网络连接中断，上传失败，请检查网络后重试')));
    xhr.ontimeout = () => settle(() => reject(create_upload_error(
        `上传超时（等待服务器响应超过 ${Math.round(timeout_ms / 1000)} 秒），请检查网络后重试`,
    )));
    xhr.onabort = () => settle(() => reject(create_canceled_error()));

    xhr.send(form);
});

/**
 * 统一 API 封装（函数式对象，无类实例）：
 * 所有方法末位可选 `config`，传 `{ skip_auth: true }` 即匿名请求（公开接口专用）。
 */
export const apiService = {
    get<T = any>(url: string, params?: Record<string, unknown>, config?: AxiosRequestConfig): Promise<T> {
        return service.get<T, T>(url, { params, ...config });
    },

    post<T = any>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<T> {
        return service.post<T, T>(url, data, config);
    },

    patch<T = any>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<T> {
        return service.patch<T, T>(url, data, config);
    },

    put<T = any>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<T> {
        return service.put<T, T>(url, data, config);
    },

    delete<T = any>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<T> {
        return service.delete<T, T>(url, { data, ...config });
    },

    /** 需要登录的文件下载：axios 携带 JWT 返回 Blob（<a href> 无法带 Authorization） */
    download(url: string): Promise<Blob> {
        // 文档最大 50MB：默认 10s 全局超时偏短，单独放宽到 2 分钟
        return service.get<Blob, Blob>(url, { responseType: 'blob', timeout: 120000 });
    },

    /**
     * 带上传进度 / 阶段 / 取消的单文件上传（对接文档 POST /image/、POST /document/）。
     * 字段名固定为 file。
     */
    uploadWithProgress<T = UploadResult>(
        url: string,
        file: File,
        options: UploadOptions = {},
    ): Promise<T> {
        const form = new FormData();
        form.append('file', file);
        return post_multipart_with_progress<T>(url, form, options);
    },

    /**
     * 带上传进度 / 阶段 / 取消的批量上传（对接文档 POST /image/batch/、POST /document/batch/）。
     * 字段名固定为 files（同名重复出现）；单次不超过 MAX_BATCH_FILES 个。
     * 服务端整批原子：任一文件失败整批不生效，故返回的 UploadResult[] 顺序与传入一致。
     * 未带任何文件时由调用方先拦截（后端会返回 422）。
     */
    uploadBatchWithProgress<T = UploadResult[]>(
        url: string,
        files: File[],
        options: UploadOptions = {},
    ): Promise<T> {
        const form = new FormData();
        // 逐个以同名 part 追加，浏览器自动带 boundary（文档要求多 part 同名 files）
        for (const file of files) {
            form.append('files', file);
        }
        return post_multipart_with_progress<T>(url, form, options);
    },
};

export default apiService;
