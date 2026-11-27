/**
 * 上传限制与预检（与后端 `app/settings.py` 保持一致）：
 * - 图片：单文件 ≤ 30MB（MAX_IMAGE_SIZE_MB），MIME 白名单见后端 `allow_type.image`
 * - 文档：单文件 ≤ 50MB（MAX_DOCUMENT_SIZE_MB），MIME 白名单见后端 `allow_type.document`
 * - 批量：单次 ≤ 20 个文件（MAX_BATCH_FILES）
 *
 * 后端按 multipart part 的 `Content-Type` 校验，因此前端白名单必须逐项对齐；
 * 浏览器 `File.type` 由系统 MIME 表查得、并不可靠（部分国产浏览器对 doc/docx/xls/xlsx
 * 报 application/octet-stream 或空串），文档另有扩展名兜底集合（对齐后端
 * `DOCUMENT_EXTENSIONS`）：MIME 或扩展名任一命中即通过。预检在选择文件后立即进行，
 * 避免大文件白传（后端超限会返回 400，往返耗时且无意义）。
 */

/** 图片 MIME 白名单（对接文档 §8） */
export const IMAGE_MIME_WHITELIST: readonly string[] = [
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/webp',
    'image/bmp',
    'image/x-ms-bmp',
    'image/tiff',
    'image/x-icon',
    'image/vnd.microsoft.icon',
];

/** 文档 MIME 白名单（对接文档 §9） */
export const DOCUMENT_MIME_WHITELIST: readonly string[] = [
    // 文本 / 数据
    'text/plain',
    'text/csv',
    'text/markdown',
    'application/csv',
    'application/rtf',
    'text/rtf',
    // PDF
    'application/pdf',
    // Word
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-word.document.macroEnabled.12',
    // Excel
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.ms-excel.sheet.macroEnabled.12',
    // PPT
    'application/vnd.ms-powerpoint',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'application/vnd.ms-powerpoint.presentation.macroEnabled.12',
    // OpenDocument
    'application/vnd.oasis.opendocument.text',
    'application/vnd.oasis.opendocument.spreadsheet',
    'application/vnd.oasis.opendocument.presentation',
    // 压缩包
    'application/zip',
    'application/x-zip-compressed',
    'application/x-7z-compressed',
    'application/vnd.rar',
    'application/x-rar-compressed',
    'application/gzip',
    'application/x-gzip',
    'application/x-tar',
    // 电子书
    'application/epub+zip',
];

export const MAX_IMAGE_SIZE_BYTES = 30 * 1024 * 1024;
export const MAX_DOCUMENT_SIZE_BYTES = 50 * 1024 * 1024;

/**
 * 文档扩展名兜底白名单（对齐后端 `DOCUMENT_EXTENSIONS`，同步维护）。
 * 浏览器 MIME 映射不可靠时按扩展名放行；扩展名与 Content-Type 同为客户端提供，
 * 兜底不降低现有信任级别。
 */
export const DOCUMENT_EXTENSIONS: readonly string[] = [
    'txt', 'csv', 'md', 'rtf', 'pdf',
    'doc', 'docx', 'docm', 'xls', 'xlsx', 'xlsm',
    'ppt', 'pptx', 'pptm',
    'odt', 'ods', 'odp',
    'zip', '7z', 'rar', 'gz', 'tgz', 'tar', 'epub',
];
/** 批量上传单次上限（对接文档 MAX_BATCH_FILES，超出后端 400） */
export const MAX_BATCH_FILES = 20;

export const MAX_IMAGE_SIZE_TEXT = '30MB';
export const MAX_DOCUMENT_SIZE_TEXT = '50MB';

/** `<input type="file" accept>`：给系统选择器做初次过滤，真正的白名单校验仍走 validate_* */
export const IMAGE_ACCEPT = 'image/jpeg,image/png,image/gif,image/webp,image/bmp,image/tiff,.ico';
export const DOCUMENT_ACCEPT =
    '.txt,.csv,.md,.rtf,.pdf,.doc,.docx,.docm,.xls,.xlsx,.xlsm,.ppt,.pptx,.pptm,.odt,.ods,.odp,.zip,.7z,.rar,.gz,.tgz,.tar,.epub';

export const IMAGE_FORMAT_HINT = '仅支持 JPG/PNG/GIF/WebP/BMP/TIFF/ICO';
export const DOCUMENT_FORMAT_HINT =
    '仅支持 txt/csv/md/rtf/pdf/doc/docx/docm/xls/xlsx/xlsm/ppt/pptx/pptm/odt/ods/odp/zip/7z/rar/gz/tar/epub';

export const IMAGE_LIMIT_HINT = `支持 JPG / PNG / GIF / WebP / BMP / TIFF / ICO，单张 ≤ ${MAX_IMAGE_SIZE_TEXT}，一次最多选 ${MAX_BATCH_FILES} 张（多张时批量上传，整批同时生效）`;
export const DOCUMENT_LIMIT_HINT = `支持 txt / csv / md / rtf / pdf / doc / docx / docm / xls / xlsx / xlsm / ppt / pptx / pptm / odt / ods / odp / zip / 7z / rar / gz / tar / epub，单个 ≤ ${MAX_DOCUMENT_SIZE_TEXT}，一次最多选 ${MAX_BATCH_FILES} 个（多份时批量上传，整批同时生效）`;

/** 字节数 → 人类可读体积（列表与上传提示共用） */
export const format_bytes = (bytes: number): string => {
    if (bytes >= 1024 * 1024) return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
    if (bytes >= 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${bytes} B`;
};

/** 批量上限校验：超出返回错误文案，未超出返回 null */
const validate_batch_count = (files: File[], unit: string): string | null =>
    files.length > MAX_BATCH_FILES
        ? `一次最多上传 ${MAX_BATCH_FILES} ${unit}，请分批上传`
        : null;

/**
 * 图片选择预检：MIME 白名单 → 单张大小 → 批量数量。
 * 返回首条可展示的错误文案（带原始文件名），全部合法返回 null。
 */
export const validate_images = (files: File[]): string | null => {
    for (const file of files) {
        if (!IMAGE_MIME_WHITELIST.includes(file.type)) {
            return `「${file.name}」格式不支持，${IMAGE_FORMAT_HINT}`;
        }
        if (file.size > MAX_IMAGE_SIZE_BYTES) {
            return `「${file.name}」超过 ${MAX_IMAGE_SIZE_TEXT}（当前 ${format_bytes(file.size)}）`;
        }
        if (file.size === 0) {
            return `「${file.name}」文件内容为空`;
        }
    }
    return validate_batch_count(files, '张图片');
};

/** 取文件扩展名（小写、不含点）；无扩展名返回 '' */
const file_extension = (name: string): string => {
    const dot = name.lastIndexOf('.');
    return dot >= 0 ? name.slice(dot + 1).toLowerCase() : '';
};

/**
 * 文档选择预检：MIME 白名单或扩展名兜底 → 单文件大小 → 空文件 → 批量数量。
 * 返回首条可展示的错误文案（带原始文件名与浏览器识别的 MIME，便于诊断），全部合法返回 null。
 */
export const validate_documents = (files: File[]): string | null => {
    for (const file of files) {
        const ext_ok = DOCUMENT_EXTENSIONS.includes(file_extension(file.name));
        if (!DOCUMENT_MIME_WHITELIST.includes(file.type) && !ext_ok) {
            if (file.type === '') {
                return `「${file.name}」无法识别文件类型，请改用标准扩展名的文件`;
            }
            return `「${file.name}」格式不支持（浏览器识别类型：${file.type}），${DOCUMENT_FORMAT_HINT}`;
        }
        if (file.size > MAX_DOCUMENT_SIZE_BYTES) {
            return `「${file.name}」超过 ${MAX_DOCUMENT_SIZE_TEXT}（当前 ${format_bytes(file.size)}）`;
        }
        if (file.size === 0) {
            return `「${file.name}」文件内容为空`;
        }
    }
    return validate_batch_count(files, '个文件');
};
