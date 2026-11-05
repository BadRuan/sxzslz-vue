import MarkdownIt from 'markdown-it';
import linkAttributes from 'markdown-it-link-attributes';
import mark from 'markdown-it-mark';
import DOMPurify from 'dompurify';
import { url_prefix } from '@/utils/baseInfo';
import { doc_icon_for, is_doc_extension } from '@/utils/docIcon';

/**
 * 正文 Markdown 渲染管线（文章详情页与后台编辑器实时预览共用）：
 * 1. 相对路径图片补 `/api/image/` 前缀（后台「复制 md」只写 slug）
 * 2. 相对路径附件补 `/api/document/` 前缀
 * 3. markdown-it 渲染（禁用原始 HTML + 链接新窗口打开 + ==高亮==）
 * 4. 图片外层套一个指向原图的链接：点图即在新窗口打开原图
 * 5. 文档类链接在文件名前插入类型图标，并标记 doc-link（详情页据此接管点击做预览）
 * 6. DOMPurify 消毒，防 XSS
 */
const md = new MarkdownIt({
    html: false,
    breaks: true,
    linkify: true,
    typographer: true
}).use(linkAttributes, {
    attrs: {
        target: '_blank',
        rel: 'noopener noreferrer'
    }
}).use(mark);

/** 相对地址（非 http://、//、/ 开头）视为站内资源，补全对应前缀 */
const with_prefix = (src: string, prefix: string): string =>
    (src.startsWith('http') || src.startsWith('//') || src.startsWith('/')) ? src : `${prefix}${src}`;

/** markdown-it 默认图片渲染（保留 title/alt/尺寸属性），此处只做一层包装复用 */
const default_image_rule = md.renderer.rules.image
    ?? ((tokens, index, options, _env, self) => self.renderToken(tokens, index, options));

/**
 * 站内图片的「原图地址」：`/image/{slug}` 默认返回 WebP 预览图（省流量），
 * 原图要带 `?file_type=raw`（后端同时接受简写 `?raw=1`）。这里用后者之前先看是否已有该参数，
 * 外链图片不做任何改写。
 */
const original_image_url = (src: string): string => {
    if (!src.includes('/image/')) return src;
    if (/[?&](?:raw|file_type)=/.test(src)) return src;
    const [pathname, query] = src.split('?');
    return query ? `${pathname}?${query}&file_type=raw` : `${pathname}?file_type=raw`;
};

md.renderer.rules.image = (tokens, index, options, env, self) => {
    const image_html = default_image_rule(tokens, index, options, env, self);
    const src = tokens[index]?.attrGet('src') ?? '';
    if (!src) return image_html;
    // 图片本体仍是预览图（加载快），链接指向原图（点击后看大图）
    const original = original_image_url(src);
    return `<a class="md-image-link" href="${md.utils.escapeHtml(original)}" target="_blank"`
        + ` rel="noopener noreferrer" title="点击查看原图" aria-label="查看原图">${image_html}</a>`;
};

export function render_markdown(content: string): string {
    let source = content ?? '';

    source = source.replace(
        /!\[([^\]]*)\]\(([^)]+)\)/g,
        (_match, alt, src) => `![${alt}](${with_prefix(src, url_prefix.pic_prefix)})`,
    );

    source = source.replace(
        /(?<!!)\[([^\]]+)\]\(([^)]+)\)/g,
        (_match, text, href) => `[${text}](${with_prefix(href, url_prefix.document_prefix)})`,
    );

    let html = md.render(source);

    // 文档类链接（doc/xls/ppt/pdf…）在文件名前插入类型图标，并标记 doc-link 供预览接管
    html = html.replace(
        /<a([^>]*href="([^"]+)"[^>]*)>([^<]*)<\/a>/g,
        (match, attrs, href, text) => {
            if (!is_doc_extension(href)) return match;
            return `<a${attrs} class="doc-link"><img src="${doc_icon_for(href)}" class="doc-icon inline-block w-4 h-4 mr-1 align-middle" alt="" />${text}</a>`;
        },
    );

    return DOMPurify.sanitize(html, {
        ADD_ATTR: ['target', 'rel', 'class', 'title', 'aria-label'],
        ADD_TAGS: ['span'],
    });
}
