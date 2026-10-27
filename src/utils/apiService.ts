import service from "./request";
import { url_prefix } from './baseInfo';
import { get_token, clear_token } from '@/store/auth';

interface RequestOptions {
    [key: string]: any;
}

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

class ApiService {
    public async get<T = any> (url:string, params?: RequestOptions): Promise<T> {
        return service.get(url, { params })
    }
    public async post<T = any>(url: string, data?: RequestOptions): Promise<T> {
    return service.post(url, data);
  }

    public async patch<T = any>(url: string, data?: RequestOptions): Promise<T> {
    return service.patch(url, data);
  }

    public async put<T = any>(url: string, data?: RequestOptions): Promise<T> {
    return service.put(url, data);
  }

    public async delete<T = any>(url: string, data?: RequestOptions): Promise<T> {
    return service.delete(url, { data });
  }

    /** multipart 上传：字段名固定为 file（图片/文档上传接口约定） */
    public async upload<T = any>(url: string, file: File): Promise<T> {
        const form = new FormData();
        form.append('file', file);
        return service.post(url, form, {
            headers: { 'Content-Type': 'multipart/form-data' },
            timeout: 60000,
        });
  }

    /**
     * 带上传进度的 multipart 上传。
     * fetch 无法读上传字节进度，按对接文档用 XMLHttpRequest + upload.onprogress；
     * 进度只反映已发送字节，到 100% 后仍需等服务端落盘返回。
     */
    public uploadWithProgress<T = UploadResult>(
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
    }
}

export default new ApiService();
