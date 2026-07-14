import service from "./request";

interface RequestOptions {
    [key: string]: any;
}

class ApiService {
    public async get<T = any> (url:string, params?: RequestOptions): Promise<T> {
        return service.get(url, { params })
    }
    public async post<T = any>(url: string, data?: RequestOptions): Promise<T> {
    return service.post(url, data);
  }

    public async put<T = any>(url: string, data?: RequestOptions): Promise<T> {
    return service.put(url, data);
  }

    public async delete<T = any>(url: string, data?: RequestOptions): Promise<T> {
    return service.delete(url, { data });
  }
}

export default new ApiService();