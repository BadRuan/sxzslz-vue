/**
 * 全站分类 slug 集中配置（替代原硬编码 id：news=3, notice=4, meeting=5, hr=7, finance=8）。
 * ⚠️ 以下为占位 slug，实施时（Task 8 Step 2）与用户核对实际数据库分类后替换。
 */
export const CATEGORY_SLUGS = {
    news: 'news',       // 新闻列表导航 & 文章列表页默认分类
    notice: 'notice',   // 通知公告
    meeting: 'meeting', // 会议公开
    hr: 'hr',           // 人事动态
    finance: 'finance', // 财务信息 / 财务公开
} as const;
