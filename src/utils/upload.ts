/**
 * 上传限制与预检（与后端 `app/settings.py` 保持一致）：
 * - 图片：单文件 ≤ 10MB（MAX_IMAGE_SIZE_MB），MIME 白名单见后端 `allow_type.image`
 * - 文档：单文件 ≤ 50MB（MAX_DOCUMENT_SIZE_MB），MIME 白名单见后端 `allow_type.document`
 * - 批量：单次 ≤ 20 个文件（MAX_BATCH_FILES）
 *
 * 后端按 multipart part 的 `Content-Type` 精确校验，因此前端白名单必须逐项对齐；
 * 选择文件后先在这里预检，避免大文件白传（后端超限会返回 400，往返耗时且无意义）。
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

export const MAX_IMAGE_SIZE_BYTES = 10 * 1024 * 1024;
export const MAX_DOCUMENT_SIZE_BYTES = 50 * 1024 * 1024;
/** 批量上传单次上限（对接文档 MAX_BATCH_FILES，超出后端 400） */
export const MAX_BATCH_FILES = 20;

export const MAX_IMAGE_SIZE_TEXT = '10MB';
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

/**
 * 文档选择预检：MIME 为空/不在白名单 → 单文件大小 → 空文件 → 批量数量。
 * 返回首条可展示的错误文案（带原始文件名），全部合法返回 null。
 */
export const validate_documents = (files: File[]): string | null => {
    for (const file of files) {
        if (file.type === '') {
            return `「${file.name}」无法识别文件类型，请改用标准扩展名的文件`;
        }
        if (!DOCUMENT_MIME_WHITELIST.includes(file.type)) {
            return `「${file.name}」格式不支持，${DOCUMENT_FORMAT_HINT}`;
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
