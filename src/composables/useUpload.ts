import { ref } from 'vue';
import apiService, { type UploadPhase, type UploadResult } from '@/utils/apiService';
import { api_error_detail, is_canceled_error } from '@/utils/apiError';

/** 上传进度模型：is_active 控制进度卡片显隐，phase 区分「发送中 / 服务端处理中」 */
export interface UploadProgressModel {
    is_active: boolean,
    label: string,
    percent: number,
    phase: UploadPhase,
}

export interface UploadRunOptions {
    /** 待上传文件（1 个走单文件接口，多个走批量接口） */
    files: File[],
    single_url: string,
    batch_url: string,
    single_label: string,
    batch_label: string,
    /** 字节发完、等待服务端处理时的提示（图片=生成预览，文档=落盘写库） */
    processing_label: string,
    success_text: string,
}

/**
 * 上传流程组合式函数（Photo / Document 共用，避免两处重复进度与错误处理）：
 * - 进度条：XHR 已发送字节百分比；发完切到「服务端处理中」，避免误以为卡死
 * - 超时：整请求 5 分钟看门狗，连接异常时给出明确提示而不是永远「上传中」
 * - 取消：AbortController 断开连接（服务端会清理半成品，对接文档 §8）
 * - 错误：统一走 api_error_detail，后端的 detail 原样展示，非 JSON 响应按 HTTP 状态兜底
 */
export const useUpload = () => {
    const progress = ref<UploadProgressModel>({
        is_active: false,
        label: '',
        percent: 0,
        phase: 'uploading',
    });
    const error_message = ref('');
    const success_message = ref('');
    let controller: AbortController | null = null;

    /** 用户点击「取消上传」：中断请求，catch 中按取消处理 */
    const cancel = () => controller?.abort();

    const run = async (options: UploadRunOptions): Promise<boolean> => {
        error_message.value = '';
        success_message.value = '';
        const files = options.files;
        if (files.length === 0) return false;

        const is_batch = files.length > 1;
        controller = new AbortController();
        progress.value = {
            is_active: true,
            label: is_batch ? options.batch_label : options.single_label,
            percent: 0,
            phase: 'uploading',
        };

        const shared_options = {
            on_progress: (percent: number) => {
                progress.value.percent = Math.min(percent, 99);
            },
            on_phase: (phase: UploadPhase) => {
                progress.value.phase = phase;
                if (phase === 'processing') {
                    progress.value.label = options.processing_label;
                    progress.value.percent = 99;
                }
            },
            signal: controller.signal,
        };

        try {
            if (is_batch) {
                await apiService.uploadBatchWithProgress<UploadResult[]>(
                    options.batch_url, files, shared_options);
            } else {
                await apiService.uploadWithProgress<UploadResult>(
                    options.single_url, files[0] as File, shared_options);
            }
            progress.value.percent = 100;
            success_message.value = options.success_text;
            return true;
        } catch (error) {
            error_message.value = is_canceled_error(error)
                ? '已取消上传'
                : api_error_detail(error, '上传失败，请稍后重试');
            return false;
        } finally {
            progress.value.is_active = false;
            controller = null;
        }
    };

    return { progress, error_message, success_message, run, cancel };
};
