import type { AxiosRequestConfig } from 'axios';
import service from './request';
import { url_prefix } from './baseInfo';
import { get_token, clear_token } from '@/utils/token';

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

/** 批量上传单次上限（对接文档 MAX_BATCH_FILES，超出后端 400） */
export const MAX_BATCH_FILES = 20;

type RequestParams = Record<string, unknown>;

/**
 * multipart 请求核心：XHR 上传 + upload.onprogress 读取进度（fetch 无法读上传字节进度）。
 * 进度只反映已发送字节，到 100% 后仍需等服务端落盘返回。
 * 注意不要手动设置 Content-Type：浏览器才会带 boundary，手写会丢 boundary 导致 422。
 * timeout=0 表示不限时（大批量上传用），有限值用于单文件，避免挂起无反馈。
 */
const post_multipart_with_progress = <T>(
    url: string,
    form: FormData,
    on_progress?: (percent: number) => void,
    timeout_ms = 0,
): Promise<T> => new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    const base = url_prefix.api_prefix.replace(/\/$/, '');
    xhr.open('POST', base + (url.startsWith('/') ? url : `/${url}`));
    xhr.timeout = timeout_ms;

    const token = get_token();
    if (token) {
        xhr.setRequestHeader('Authorization', `Bearer ${token}`);
    }

    xhr.upload.onprogress = (e) => {
        if (e.lengthComputable) {
            on_progress?.(Math.round((e.loaded / e.total) * 100));
        }
    };

    xhr.onload = () => {
        let body: any = null;
        try {
            body = JSON.parse(xhr.responseText);
        } catch { /* 非 JSON 响应体 */ }

        if (xhr.status >= 200 && xhr.status < 300) {
            resolve(body as T);
            return;
        }

        // 与 axios 拦截器一致：401 清 token 回登录页（登录页本身不跳转）
        if (xhr.status === 401) {
            clear_token();
            if (!window.location.pathname.startsWith('/admin/login')) {
                window.location.href = '/admin/login';
            }
        }

        const detail = body?.detail;
        const message = Array.isArray(detail) ? detail[0]?.msg : detail;
        const error: any = new Error(message || '上传失败');
        error.response = { status: xhr.status, data: body };
        reject(error);
    };

    xhr.onerror = () => reject(new Error('网络错误，上传失败'));
    xhr.ontimeout = () => reject(new Error('上传超时，请重试'));

    xhr.send(form);
});

/**
 * 统一 API 封装（函数式对象，无类实例）：
 * 所有方法末位可选 `config`，传 `{ skip_auth: true }` 即匿名请求（公开接口专用）。
 */
export const apiService = {
    get<T = any>(url: string, params?: RequestParams, config?: AxiosRequestConfig): Promise<T> {
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

    /** multipart 上传：字段名固定为 file（单文件上传接口约定） */
    upload<T = any>(url: string, file: File): Promise<T> {
        const form = new FormData();
        form.append('file', file);
        return service.post<T, T>(url, form, { timeout: 60000 });
    },

    /** 需要登录的文件下载：axios 携带 JWT 返回 Blob（<a href> 无法带 Authorization） */
    download(url: string): Promise<Blob> {
        return service.get<Blob, Blob>(url, { responseType: 'blob' });
    },

    /**
     * 带上传进度的单文件上传（对接文档 POST /image/、POST /document/）。
     * 进度只反映已发送字节，到 100% 后仍需等服务端落盘返回。
     */
    uploadWithProgress<T = UploadResult>(
        url: string,
        file: File,
        on_progress?: (percent: number) => void,
    ): Promise<T> {
        const form = new FormData();
        form.append('file', file);
        return post_multipart_with_progress<T>(url, form, on_progress, 120000);
    },

    /**
     * 带上传进度的批量上传（对接文档 POST /image/batch/、POST /document/batch/）。
     * 字段名固定为 files（同名重复出现）；单次不超过 MAX_BATCH_FILES 个。
     * 服务端整批原子：任一文件失败整批不生效，故返回的 UploadResult[] 顺序与传入一致。
     * 未带任何文件时由调用方先拦截（后端会返回 422）。
     */
    uploadBatchWithProgress<T = UploadResult[]>(
        url: string,
        files: File[],
        on_progress?: (percent: number) => void,
    ): Promise<T> {
        const form = new FormData();
        // 逐个以同名 part 追加，浏览器自动带 boundary（文档要求多 part 同名 files）
        for (const file of files) {
            form.append('files', file);
        }
        return post_multipart_with_progress<T>(url, form, on_progress);
    },
};

export default apiService;
