import type { AxiosRequestConfig } from 'axios';
import service from './request';
import { url_prefix } from './baseInfo';
import { get_token, clear_token } from '@/utils/token';

/** UploadResult：POST /image/、POST /document/ 统一响应 */
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

type RequestParams = Record<string, unknown>;

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

    /** multipart 上传：字段名固定为 file（图片/文档上传接口约定） */
    upload<T = any>(url: string, file: File): Promise<T> {
        const form = new FormData();
        form.append('file', file);
        // 不要手动设置 Content-Type：浏览器才会带 boundary，手写会丢 boundary 导致后端 422
        return service.post<T, T>(url, form, { timeout: 60000 });
    },

    /** 需要登录的文件下载：axios 携带 JWT 返回 Blob（<a href> 无法带 Authorization） */
    download(url: string): Promise<Blob> {
        return service.get<Blob, Blob>(url, { responseType: 'blob' });
    },

    /**
     * 带上传进度的 multipart 上传。
     * fetch 无法读上传字节进度，按对接文档用 XMLHttpRequest + upload.onprogress；
     * 进度只反映已发送字节，到 100% 后仍需等服务端落盘返回。
     */
    uploadWithProgress<T = UploadResult>(
        url: string,
        file: File,
        onProgress?: (percent: number) => void,
    ): Promise<T> {
        return new Promise((resolve, reject) => {
            const xhr = new XMLHttpRequest();
            const base = url_prefix.api_prefix.replace(/\/$/, '');
            xhr.open('POST', base + (url.startsWith('/') ? url : `/${url}`));

            const token = get_token();
            if (token) {
                xhr.setRequestHeader('Authorization', `Bearer ${token}`);
            }

            xhr.upload.onprogress = (e) => {
                if (e.lengthComputable) {
                    onProgress?.(Math.round((e.loaded / e.total) * 100));
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

            // 不要手动设置 Content-Type，浏览器会自动带 boundary
            const form = new FormData();
            form.append('file', file);
            xhr.send(form);
        });
    },
};

export default apiService;
