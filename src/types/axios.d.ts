import 'axios';

/**
 * 自定义请求配置：`skip_auth = true` 时不携带 Authorization。
 *
 * 公开接口（文章列表/详情、/base/、分类 GET、图片本体等）必须匿名请求：
 * 后端对「普通用户 token」会把文章/图片/文档列表收敛为仅本人数据，
 * 前台携带登录态会错误地缩小公开数据范围（普通账号登录后看不到全站文章）。
 */
declare module 'axios' {
    interface AxiosRequestConfig {
        skip_auth?: boolean;
    }
}
