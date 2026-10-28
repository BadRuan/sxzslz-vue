interface URL_Prefix {
    pic_prefix: string
    document_prefix: string
    api_prefix: string
}

/**
 * 接口前缀：默认 `/api/`（开发经 vite 代理、生产经 nginx 反代到后端）。
 * 需要直连后端时用环境变量 `VITE_API_BASE` 覆盖（如 http://100.123.19.58:8088/）。
 */
const api_base = (import.meta.env.VITE_API_BASE as string | undefined) ?? '/api/';

const with_trailing_slash = (base: string): string => (base.endsWith('/') ? base : `${base}/`);

/** 由接口前缀派生图片 / 文档 / 接口三套地址前缀，避免各自拼接出错 */
const create_prefixes = (base: string): URL_Prefix => {
    const normalized = with_trailing_slash(base);
    return {
        pic_prefix: `${normalized}image/`,
        document_prefix: `${normalized}document/`,
        api_prefix: normalized,
    };
};

export const url_prefix: URL_Prefix = create_prefixes(api_base);
