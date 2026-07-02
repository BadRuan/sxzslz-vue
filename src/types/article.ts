/** 文章基础信息（列表/卡片场景） */
export interface ArticleBasic {
    title: string
    category: string
    author: string
    created: string
}

/** 文章列表项（含状态字段） */
export interface ArticleItem extends ArticleBasic {
    is_public: boolean
    is_recommended: boolean
    views: number
}

/** 文章详情 */
export interface ArticleDetail extends ArticleBasic {
    slug: string
    content: string
    views: number
}

/** 文章摘要（前台列表） */
export interface ArticleSummary {
    title: string
    summary: string
    date: string
}
