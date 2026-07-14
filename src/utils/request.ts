import axios, {type AxiosInstance,  type AxiosResponse} from 'axios';
import { api_prefix } from '@/utils/baseInfo'

const service: AxiosInstance = axios.create({
    baseURL: api_prefix,
    timeout: 10000,
    headers: { 'Content-Type': 'application/json;charset=UTF-8' }
});

service.interceptors.response.use(
    (response: AxiosResponse) => {
        // 直接返回响应数据，不做额外处理
        return response.data;
    },
    (error) => {
        console.error('请求失败:', error.message);
        return Promise.reject(error);
    }
)

export default service;
