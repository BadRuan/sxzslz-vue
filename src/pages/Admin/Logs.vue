<script setup lang="ts">
import { ref, onMounted } from 'vue';
import AppPagination from '@/components/AppPagination.vue';
import { apiService } from '@/utils/apiService';
import { api_error_detail } from '@/utils/apiError';
import { date_text } from '@/utils/formatters';

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

// 筛选条件：空串不传参（后端 Optional[...] = None）
const filters = ref({ action: '', object_type: '', result: '', operator_id: '' });

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

onMounted(() => {
    fetch_logs();
});
</script>

<template>
    <div class="space-y-4">
        <!-- 筛选行：空条件不传参，查询回第 1 页 -->
        <div class="rounded-box border border-base-300 bg-base-100 p-4 shadow-[var(--shadow-card)]">
            <div class="flex flex-wrap items-end gap-3">
                <label class="form-control">
                    <div class="label py-1"><span class="label-text text-xs">动作</span></div>
                    <input v-model="filters.action" type="text" placeholder="如 create_article"
                        class="input input-bordered input-sm w-44" @keyup.enter="apply_filters" />
                </label>
                <label class="form-control">
                    <div class="label py-1"><span class="label-text text-xs">对象类型</span></div>
                    <input v-model="filters.object_type" type="text" placeholder="article/image/document/account"
                        class="input input-bordered input-sm w-48" @keyup.enter="apply_filters" />
                </label>
                <label class="form-control">
                    <div class="label py-1"><span class="label-text text-xs">结果</span></div>
                    <select v-model="filters.result" class="select select-bordered select-sm w-32">
                        <option value="">全部</option>
                        <option value="success">success</option>
                        <option value="failed">failed</option>
                    </select>
                </label>
                <label class="form-control">
                    <div class="label py-1"><span class="label-text text-xs">操作者 ID</span></div>
                    <input v-model="filters.operator_id" type="number" min="1" placeholder="≥1"
                        class="input input-bordered input-sm w-28" @keyup.enter="apply_filters" />
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
                        <tr v-for="row in rows" :key="row.id">
                            <td class="whitespace-nowrap text-base-content/70">{{ date_text(row.created_at) }}</td>
                            <td class="whitespace-nowrap font-medium">{{ row.action }}</td>
                            <td class="whitespace-nowrap text-base-content/70">{{ row.object_type }}</td>
                            <td class="max-w-[12em] truncate" :title="object_text(row)">{{ object_text(row) }}</td>
                            <td class="whitespace-nowrap text-base-content/70">{{ operator_text(row) }}</td>
                            <td>
                                <span class="badge badge-sm" :class="row.result === 'success' ? 'badge-success' : 'badge-error'">
                                    {{ row.result }}
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
