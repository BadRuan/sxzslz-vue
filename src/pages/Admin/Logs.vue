<script setup lang="ts">
import { ref, onMounted } from 'vue';
import AppPagination from '@/components/AppPagination.vue';
import { apiService } from '@/utils/apiService';
import { api_error_detail } from '@/utils/apiError';
import dayjs from 'dayjs';
import { useBaseinfoStore } from '@/store/base';

/** 操作日志行（对接文档 §10 OperationLogOut，GET /logs/ 仅超级管理员可见） */
interface OperationLogRow {
    id: number;
    action: string;
    object_type: string;
    object_id: string;
    object_name: string | null;
    operator_id: number | null;
    operator_name: string | null;
    created_at: string;
    result: string;
    message: string | null;
    client_ip: string | null;
}

const PAGE_SIZE = 20;

// 筛选条件：空串不传参（后端 Optional[...] = None）；下拉选中文标签、提交英文原值
const filters = ref({ action: '', object_type: '', result: '', operator_id: '' });

/** 操作者下拉数据源：/base/ 公开用户列表（昵称 → id） */
const baseinfo = useBaseinfoStore();

const page = ref(1);
const total = ref(0);
const rows = ref<OperationLogRow[]>([]);
const has_next = ref(false);
const loading = ref(false);
const list_error = ref('');

const fetch_logs = async () => {
    loading.value = true;
    list_error.value = '';
    try {
        const params: Record<string, unknown> = { page: page.value, page_size: PAGE_SIZE };
        const f = filters.value;
        if (f.action.trim()) params.action = f.action.trim();
        if (f.object_type.trim()) params.object_type = f.object_type.trim();
        if (f.result) params.result = f.result;
        const operator_id = Number(f.operator_id);
        if (Number.isInteger(operator_id) && operator_id >= 1) params.operator_id = operator_id;
        const res = await apiService.get<{ data: OperationLogRow[]; total: number; has_next: boolean }>('/logs/', params);
        rows.value = res.data ?? [];
        total.value = res.total ?? 0;
        has_next.value = res.has_next ?? false;
    } catch (error) {
        rows.value = [];
        list_error.value = api_error_detail(error, '日志加载失败');
    } finally {
        loading.value = false;
    }
};

/** 查询：回第 1 页重查 */
const apply_filters = () => {
    page.value = 1;
    fetch_logs();
};

/** 重置：清空条件并回第 1 页 */
const reset_filters = () => {
    filters.value = { action: '', object_type: '', result: '', operator_id: '' };
    page.value = 1;
    fetch_logs();
};

const go_page = (target: number) => {
    if (loading.value) return; // 请求在途时忽略翻页，避免乱序响应盖掉新页数据
    page.value = target;
    fetch_logs();
};

/** 对象展示：名称优先，其次 id */
const object_text = (row: OperationLogRow) => row.object_name || row.object_id || '—';
/** 操作者展示：昵称优先，其次 id，最后 — */
const operator_text = (row: OperationLogRow) => row.operator_name || (row.operator_id ? String(row.operator_id) : '—');

/**
 * 动作中文释义（与后端 app/service 写入的 action 全集对应）。
 * 未收录的新动作回退英文原样展示，避免后端加新动作后界面空白。
 */
const ACTION_LABELS: Record<string, string> = {
    create_article: '发布文章',
    update_article: '编辑文章',
    delete_article: '删除文章',
    upload_image: '上传图片',
    delete_image: '删除图片',
    update_image_name: '修改图片名称',
    upload_document: '上传文档',
    delete_document: '删除文档',
    update_document_name: '修改文档名称',
    create_account: '创建用户',
    update_account: '修改用户',
    delete_account: '删除用户',
    dedup_hit: '命中重复文件（秒传）',
    proceed: '正常入库',
};

/** 对象类型中文释义；未收录回退英文原样 */
const OBJECT_TYPE_LABELS: Record<string, string> = {
    article: '文章',
    image: '图片',
    document: '文档',
    account: '账户',
};

const action_text = (action: string) => ACTION_LABELS[action] || action;
const object_type_text = (objectType: string) => OBJECT_TYPE_LABELS[objectType] || objectType;

/** 时间格式化到秒：日志需要 HH:mm:ss 精度（date_text 只到日期，且被其他页面共用，不动它） */
const datetime_text = (value: string) => dayjs(value).format('YYYY-MM-DD HH:mm:ss');

/** 全局序号：跨页连续编号（第 1 页 1..20，第 2 页 21..40） */
const row_index = (index: number) => (page.value - 1) * PAGE_SIZE + index + 1;

/** 结果中文释义（筛选下拉与表格徽标共用）；未收录回退英文原样 */
const RESULT_LABELS: Record<string, string> = {
    success: '成功',
    failed: '失败',
};

const result_text = (result: string) => RESULT_LABELS[result] || result;

onMounted(() => {
    fetch_logs();
    // 操作者下拉的用户列表：失败不阻塞日志加载（只剩「全部操作者」可选）
    void baseinfo.checkBaseinfo();
});
</script>

<template>
    <div class="space-y-4">
        <!-- 筛选行：空条件不传参，查询回第 1 页 -->
        <div class="rounded-box border border-base-300 bg-base-100 p-4 shadow-[var(--shadow-card)]">
            <div class="flex flex-wrap items-end gap-3">
                <label class="form-control">
                    <div class="label py-1"><span class="label-text text-xs">动作</span></div>
                    <select v-model="filters.action" class="select select-bordered select-sm w-44"
                        @change="apply_filters">
                        <option value="">全部动作</option>
                        <option v-for="(label, key) in ACTION_LABELS" :key="key" :value="key">{{ label }}</option>
                    </select>
                </label>
                <label class="form-control">
                    <div class="label py-1"><span class="label-text text-xs">对象类型</span></div>
                    <select v-model="filters.object_type" class="select select-bordered select-sm w-40"
                        @change="apply_filters">
                        <option value="">全部类型</option>
                        <option v-for="(label, key) in OBJECT_TYPE_LABELS" :key="key" :value="key">{{ label }}</option>
                    </select>
                </label>
                <label class="form-control">
                    <div class="label py-1"><span class="label-text text-xs">结果</span></div>
                    <select v-model="filters.result" class="select select-bordered select-sm w-32"
                        @change="apply_filters">
                        <option value="">全部结果</option>
                        <option value="success">成功</option>
                        <option value="failed">失败</option>
                    </select>
                </label>
                <label class="form-control">
                    <div class="label py-1"><span class="label-text text-xs">操作者</span></div>
                    <select v-model="filters.operator_id" class="select select-bordered select-sm w-44"
                        @change="apply_filters">
                        <option value="">全部操作者</option>
                        <option v-for="user in baseinfo.users" :key="user.id" :value="String(user.id)">
                            {{ user.nickname || user.slug }}
                        </option>
                    </select>
                </label>
                <div class="flex gap-2 pb-0.5">
                    <button type="button" class="btn btn-primary btn-sm" :disabled="loading" @click="apply_filters">查询</button>
                    <button type="button" class="btn btn-ghost btn-sm" :disabled="loading" @click="reset_filters">重置</button>
                </div>
            </div>
        </div>

        <!-- 日志表格 -->
        <div class="overflow-hidden rounded-box border border-base-300 bg-base-100 shadow-[var(--shadow-card)]">
            <div v-if="list_error" class="p-12 text-center">
                <p class="mb-3 text-error">{{ list_error }}</p>
                <button type="button" class="btn btn-sm btn-primary" @click="fetch_logs">重新加载</button>
            </div>
            <div v-else-if="loading && rows.length === 0" class="p-12 text-center text-sm text-base-content/55">
                <span class="loading loading-spinner loading-md align-middle"></span>
                <p class="mt-2">加载中…</p>
            </div>
            <div v-else-if="rows.length === 0" class="p-14 text-center text-sm text-base-content/55">
                暂无日志
            </div>
            <div v-else class="overflow-x-auto">
                <table class="table table-zebra">
                    <thead>
                        <tr class="text-xs text-base-content/60">
                            <th>序号</th>
                            <th>时间</th>
                            <th>动作</th>
                            <th>对象类型</th>
                            <th>对象</th>
                            <th>操作者</th>
                            <th>结果</th>
                            <th>IP</th>
                            <th>说明</th>
                        </tr>
                    </thead>
                    <tbody class="text-sm">
                        <tr v-for="(row, index) in rows" :key="row.id">
                            <td class="whitespace-nowrap text-base-content/60">{{ row_index(index) }}</td>
                            <td class="whitespace-nowrap text-base-content/70">{{ datetime_text(row.created_at) }}</td>
                            <td class="whitespace-nowrap font-medium" :title="row.action">{{ action_text(row.action) }}</td>
                            <td class="whitespace-nowrap text-base-content/70" :title="row.object_type">{{ object_type_text(row.object_type) }}</td>
                            <td class="max-w-[12em] truncate" :title="object_text(row)">{{ object_text(row) }}</td>
                            <td class="whitespace-nowrap text-base-content/70">{{ operator_text(row) }}</td>
                            <td>
                                <span class="badge badge-sm" :class="row.result === 'success' ? 'badge-success' : 'badge-error'"
                                    :title="row.result">
                                    {{ result_text(row.result) }}
                                </span>
                            </td>
                            <td class="whitespace-nowrap text-base-content/55">{{ row.client_ip || '—' }}</td>
                            <td class="max-w-[16em] truncate text-base-content/60" :title="row.message || ''">
                                {{ row.message || '—' }}
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </div>

        <AppPagination v-if="!list_error && total > 0" :page="page" :has-next="has_next"
            :total="total" unit="条" :page-size="PAGE_SIZE" @change="go_page" />
    </div>
</template>
