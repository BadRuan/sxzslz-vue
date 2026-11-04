/**
 * 站内搜索关键词高亮（对接文档 §7：后端只返回纯文本 + matched_terms，不返回 <mark>）。
 *
 * 这里只做「切分」，不拼接 HTML：调用方用文本节点 + <mark> 渲染分段结果，
 * 从机制上避免把后端返回的标题/正文片段当 HTML 注入（XSS）。
 */

export interface HighlightSegment {
    text: string,
    /** true = 命中关键词，渲染为 <mark>；false = 普通文本 */
    hit: boolean,
}

/** 关键词去空白、去重（大小写不敏感）、长词优先：长词先匹配，避免短词把长词切碎 */
export const normalize_terms = (terms: readonly string[]): string[] => {
    const seen = new Set<string>();
    return terms
        .map((term) => term.trim())
        .filter((term) => term.length > 0)
        .sort((a, b) => b.length - a.length)
        .filter((term) => {
            const key = term.toLowerCase();
            if (seen.has(key)) return false;
            seen.add(key);
            return true;
        });
};

/** 关键词按后端规则拆分：空白（含全角空格）分隔，词之间 AND */
export const split_keyword = (keyword: string): string[] =>
    normalize_terms(keyword.split(/[\s\u3000]+/));

const escape_reg_exp = (text: string): string => text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/** 把文本按关键词切成命中/未命中分段（大小写不敏感、多词交替匹配、长词优先） */
export const highlight_segments = (text: string, terms: readonly string[]): HighlightSegment[] => {
    if (!text) return [];
    const normalized = normalize_terms(terms);
    if (normalized.length === 0) return [{ text, hit: false }];

    const pattern = new RegExp(normalized.map(escape_reg_exp).join('|'), 'gi');
    const segments: HighlightSegment[] = [];
    let last_index = 0;
    for (const match of text.matchAll(pattern)) {
        const start = match.index ?? 0;
        if (start > last_index) segments.push({ text: text.slice(last_index, start), hit: false });
        segments.push({ text: match[0], hit: true });
        last_index = start + match[0].length;
    }
    if (last_index < text.length) segments.push({ text: text.slice(last_index), hit: false });
    return segments;
};
