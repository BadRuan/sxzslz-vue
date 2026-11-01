/** 文档类型图标（public/icon/doc-*.svg）：按文件扩展名映射，未知类型回退通用图标 */
const DOC_ICON_MAP: Record<string, string> = {
    doc: '/icon/doc-word.svg', docx: '/icon/doc-word.svg',
    xls: '/icon/doc-excel.svg', xlsx: '/icon/doc-excel.svg',
    ppt: '/icon/doc-ppt.svg', pptx: '/icon/doc-ppt.svg',
    pdf: '/icon/doc-pdf.svg',
    txt: '/icon/doc-generic.svg', zip: '/icon/doc-generic.svg', rar: '/icon/doc-generic.svg',
    default: '/icon/doc-generic.svg',
};

/** 文档类扩展名（详情页据此判断是否给链接加图标） */
export const DOC_EXTENSIONS = ['doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx', 'pdf', 'txt', 'zip', 'rar'];

/** 从文件名 / 链接取扩展名（忽略 query 参数） */
export const ext_of_filename = (name: string): string =>
    (name.split('?')[0] ?? '').split('.').pop()?.toLowerCase() ?? '';

/** 是否为需要展示图标的文档类型 */
export const is_doc_extension = (name: string): boolean => DOC_EXTENSIONS.includes(ext_of_filename(name));

/** 由文件名 / 链接得到图标地址 */
export const doc_icon_for = (name: string): string =>
    (DOC_ICON_MAP as Record<string, string>)[ext_of_filename(name)] ?? DOC_ICON_MAP.default ?? '/icon/doc-generic.svg';
