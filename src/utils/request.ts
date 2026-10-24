import axios, {type AxiosInstance,  type AxiosResponse} from 'axios';
import { url_prefix } from '@/utils/baseInfo'
import { get_token, clear_token } from '@/store/auth'

const service: AxiosInstance = axios.create({
    baseURL: url_prefix.api_prefix,
    timeout: 10000,
    headers: { 'Content-Type': 'application/json;charset=UTF-8' }
});

service.interceptors.request.use((config) => {
    const token = get_token();
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

service.interceptors.response.use(
    (response: AxiosResponse) => {
        // 直接返回响应数据，不做额外处理
        return response.data;
    },
    (error) => {
        // token 过期/无效：清除本地 token 并跳转登录页（文档约定：捕获 401 → 清 token → 登录页）
        if (error.response?.status === 401) {
            clear_token();
            if (!window.location.pathname.startsWith('/admin/login')) {
                window.location.href = '/admin/login';
            }
        }
        console.error('请求失败:', error.message);
        return Promise.reject(error);
    }
)

export default service;
