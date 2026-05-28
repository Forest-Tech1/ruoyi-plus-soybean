<script setup lang="tsx">
import { computed, h, reactive, ref, watch } from 'vue';
import type { PaginationProps } from 'naive-ui';
import { storeToRefs } from 'pinia';
import dayjs from 'dayjs';
import {
  NAlert,
  NButton,
  NDataTable,
  NEmpty,
  NFormItem,
  NModal,
  NPopconfirm,
  NSelect,
  NSpace,
  NTabPane,
  NTabs,
  NTag
} from 'naive-ui';
import { useWmsExistingImportTaskStore } from '@/store/modules/wms-existing-import-task';
import { $t } from '@/locales';
import type { WmsExistingImportTaskRecord } from '@/store/modules/wms-existing-import-task';

defineOptions({
  name: 'InventoryDataExistingImportTasksModal'
});

const visible = defineModel<boolean>('visible', { default: false });

const taskStore = useWmsExistingImportTaskStore();
const { tasks, runningCount, unreadTerminalCount } = storeToRefs(taskStore);

const detailOpen = ref(false);
const detailRecord = ref<WmsExistingImportTaskRecord | null>(null);
/** 详情内处理明细：成功 / 失败 */
const detailResultTab = ref<'success' | 'failed'>('success');
/** 详情行按 Excel 库存状态筛选（null = 全部） */
const detailInventoryStatusFilter = ref<string | null>(null);

const sortedTaskRows = computed(() =>
  [...tasks.value].sort((a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime())
);

/** 任务列表：客户端分页（数据在 sessionStorage，仍做多条时分页） */
const taskPagination = reactive<PaginationProps>({
  page: 1,
  pageSize: 10,
  itemCount: 0,
  showSizePicker: true,
  pageSizes: [10, 20, 50],
  prefix: info =>
    $t('datatable.itemCount', {
      total: info.itemCount ?? 0
    }),
  onUpdatePage: (page: number) => {
    taskPagination.page = page;
  },
  onUpdatePageSize: (pageSize: number) => {
    taskPagination.pageSize = pageSize;
    taskPagination.page = 1;
  }
});

watch(
  sortedTaskRows,
  rows => {
    taskPagination.itemCount = rows.length;
    const ps = taskPagination.pageSize ?? 10;
    const maxPage = Math.max(1, Math.ceil(rows.length / ps) || 1);
    if ((taskPagination.page ?? 1) > maxPage) taskPagination.page = maxPage;
  },
  { immediate: true, deep: true }
);

function statusLabel(st: string | null | undefined): string {
  const u = String(st ?? '')
    .trim()
    .toUpperCase();
  if (!u) return $t('page.wms.inventoryData.existingImportTaskStatusUnknown');
  if (u === 'SUCCESS') return $t('page.wms.inventoryData.existingImportTaskStatusSuccess');
  if (u === 'FAILED') return $t('page.wms.inventoryData.existingImportTaskStatusFailed');
  if (u === 'CANCELLED' || u === 'CANCELED' || u === 'CANCELLED_BY_USER' || u === 'ABORTED')
    return $t('page.wms.inventoryData.existingImportTaskStatusCancelled');
  if (u === 'PENDING' || u === 'QUEUED') return $t('page.wms.inventoryData.existingImportTaskStatusPending');
  return $t('page.wms.inventoryData.existingImportTaskStatusRunning');
}

function statusTagType(
  st: string | null | undefined
): 'default' | 'success' | 'warning' | 'error' | 'info' {
  const u = String(st ?? '')
    .trim()
    .toUpperCase();
  if (u === 'SUCCESS') return 'success';
  if (u === 'FAILED') return 'error';
  if (u === 'CANCELLED' || u === 'CANCELED' || u === 'CANCELLED_BY_USER' || u === 'ABORTED')
    return 'warning';
  if (!u || u === 'PENDING' || u === 'QUEUED') return 'info';
  return 'info';
}

function isRowRunning(row: WmsExistingImportTaskRecord): boolean {
  return taskStore.isRunningStatus(row.lastStatus?.status);
}

function plannedActionLabel(row: Api.Wms.WarehouseInventoryDataExistingImportPreviewRow): string {
  const code = String(row.plannedAction ?? row.action ?? '').trim();
  if (!code) return '—';
  const map: Record<string, string> = {
    skip: $t('page.wms.inventoryData.existingImportAction.skip'),
    create_order_and_plan: $t('page.wms.inventoryData.existingImportAction.create_order_and_plan'),
    add_inbound_plan: $t('page.wms.inventoryData.existingImportAction.add_inbound_plan'),
    auto_outbound: $t('page.wms.inventoryData.existingImportAction.auto_outbound'),
    ambiguous: $t('page.wms.inventoryData.existingImportAction.ambiguous'),
    error: $t('page.wms.inventoryData.existingImportAction.error')
  };
  return map[code] ?? code;
}

function plannedActionTagType(
  row: Api.Wms.WarehouseInventoryDataExistingImportPreviewRow
): 'default' | 'info' | 'success' | 'warning' | 'error' {
  const code = String(row.plannedAction ?? row.action ?? '').trim().toLowerCase();
  if (row.errorMessage && String(row.errorMessage).trim()) return 'error';
  if (code === 'skip') return 'default';
  if (code === 'ambiguous' || code === 'error') return 'error';
  if (code === 'add_inbound_plan' || code === 'create_order_and_plan' || code === 'auto_outbound')
    return 'success';
  return 'info';
}

const resultColumns = computed(() => [
  {
    key: 'rowNum',
    title: $t('page.wms.inventoryData.existingImportColRowNum'),
    width: 64,
    align: 'center' as const,
    render: (row: Api.Wms.WarehouseInventoryDataExistingImportPreviewRow) =>
      row.rowNum != null ? String(row.rowNum) : '—'
  },
  {
    key: 'inventoryStatus',
    title: $t('page.wms.inventoryData.existingImportColInventoryStatus'),
    width: 110,
    ellipsis: { tooltip: true },
    render: (row: Api.Wms.WarehouseInventoryDataExistingImportPreviewRow) =>
      row.inventoryStatus?.trim() ? row.inventoryStatus : '—'
  },
  { key: 'coNo', title: $t('page.wms.inventoryData.coNo'), width: 120, ellipsis: { tooltip: true } },
  {
    key: 'jobNo',
    title: $t('page.wms.inventoryData.existingImportColJobNo'),
    minWidth: 140,
    ellipsis: { tooltip: true },
    render: (row: Api.Wms.WarehouseInventoryDataExistingImportPreviewRow) =>
      row.jobNoRaw ?? row.jobNo ?? '—'
  },
  {
    key: 'plannedAction',
    title: $t('page.wms.inventoryData.existingImportColAction'),
    width: 140,
    render: (row: Api.Wms.WarehouseInventoryDataExistingImportPreviewRow) =>
      h(NTag, { type: plannedActionTagType(row), size: 'small' }, { default: () => plannedActionLabel(row) })
  },
  {
    key: 'rowResultMessage',
    title: $t('page.wms.inventoryData.existingImportColRowResultMessage'),
    minWidth: 180,
    ellipsis: { tooltip: true },
    render: (row: Api.Wms.WarehouseInventoryDataExistingImportPreviewRow) =>
      row.rowResultMessage?.trim() ? row.rowResultMessage : '—'
  },
  {
    key: 'errorMessage',
    title: $t('page.wms.inventoryData.existingImportColError'),
    minWidth: 160,
    ellipsis: { tooltip: true },
    render: (row: Api.Wms.WarehouseInventoryDataExistingImportPreviewRow) => {
      const msg = (row.errorMessage ?? row.message)?.trim();
      if (!msg) return '—';
      return h(NTag, { type: 'error', size: 'small' }, { default: () => msg });
    }
  }
]);

const resultScrollX = computed(() =>
  resultColumns.value.reduce(
    (acc: number, c: { width?: number; minWidth?: number }) => acc + Number(c.width ?? c.minWidth ?? 100),
    0
  )
);

const resultRowsForDetail = computed((): Api.Wms.WarehouseInventoryDataExistingImportPreviewRow[] => {
  const s = detailRecord.value?.lastStatus;
  if (!s) return [];
  const raw = s.resultRows ?? s.rows;
  return Array.isArray(raw) ? raw : [];
});

/** 本任务明细中出现过的库存状态（用于筛选下拉，取自全量行） */
const detailInventoryStatusOptions = computed(() => {
  const set = new Set<string>();
  for (const r of resultRowsForDetail.value) {
    const v = r.inventoryStatus?.trim();
    if (v) set.add(v);
  }
  return [...set].sort().map(label => ({ label, value: label }));
});

const resultRowsAfterStatusFilter = computed(() => {
  const rows = resultRowsForDetail.value;
  const f = detailInventoryStatusFilter.value?.trim();
  if (!f) return rows;
  return rows.filter(r => String(r.inventoryStatus ?? '').trim() === f);
});

function isDetailResultRowFailed(row: Api.Wms.WarehouseInventoryDataExistingImportPreviewRow): boolean {
  if (String(row.errorMessage ?? row.message ?? '').trim()) return true;
  const code = String(row.plannedAction ?? row.action ?? '').trim().toLowerCase();
  return code === 'error' || code === 'ambiguous';
}

const detailResultSuccessRows = computed(() =>
  resultRowsAfterStatusFilter.value.filter(r => !isDetailResultRowFailed(r))
);

const detailResultFailedRows = computed(() =>
  resultRowsAfterStatusFilter.value.filter(r => isDetailResultRowFailed(r))
);

/** 成功行 / 失败行各一套分页（Naive 客户端分页） */
const detailSuccessPagination = reactive<PaginationProps>({
  page: 1,
  pageSize: 20,
  itemCount: 0,
  showSizePicker: true,
  pageSizes: [10, 20, 50, 100],
  prefix: info =>
    $t('datatable.itemCount', {
      total: info.itemCount ?? 0
    }),
  onUpdatePage: (page: number) => {
    detailSuccessPagination.page = page;
  },
  onUpdatePageSize: (pageSize: number) => {
    detailSuccessPagination.pageSize = pageSize;
    detailSuccessPagination.page = 1;
  }
});

const detailFailedPagination = reactive<PaginationProps>({
  page: 1,
  pageSize: 20,
  itemCount: 0,
  showSizePicker: true,
  pageSizes: [10, 20, 50, 100],
  prefix: info =>
    $t('datatable.itemCount', {
      total: info.itemCount ?? 0
    }),
  onUpdatePage: (page: number) => {
    detailFailedPagination.page = page;
  },
  onUpdatePageSize: (pageSize: number) => {
    detailFailedPagination.pageSize = pageSize;
    detailFailedPagination.page = 1;
  }
});

watch(
  detailResultSuccessRows,
  rows => {
    detailSuccessPagination.itemCount = rows.length;
    detailSuccessPagination.page = 1;
  },
  { deep: true }
);

watch(
  detailResultFailedRows,
  rows => {
    detailFailedPagination.itemCount = rows.length;
    detailFailedPagination.page = 1;
  },
  { deep: true }
);

watch(detailInventoryStatusFilter, () => {
  detailSuccessPagination.page = 1;
  detailFailedPagination.page = 1;
});

async function openDetail(row: WmsExistingImportTaskRecord) {
  detailInventoryStatusFilter.value = null;
  detailSuccessPagination.page = 1;
  detailFailedPagination.page = 1;
  detailResultTab.value = 'success';
  detailRecord.value = row;
  detailOpen.value = true;
  await taskStore.refreshTask(row.taskId);
  taskStore.markRead(row.taskId);
  const latest = taskStore.tasks.find(t => String(t.taskId) === String(row.taskId));
  if (latest) detailRecord.value = latest;
  if (detailResultSuccessRows.value.length === 0 && detailResultFailedRows.value.length > 0) {
    detailResultTab.value = 'failed';
  }
}

function closeDetail() {
  detailOpen.value = false;
  detailRecord.value = null;
}

async function requestInterrupt(row: WmsExistingImportTaskRecord) {
  const ok = await taskStore.requestCancel(row.taskId);
  if (ok) window.$message?.success($t('page.wms.inventoryData.existingImportTaskCancelSuccess'));
}

const columns = computed(() => [
  {
    key: 'taskId',
    title: $t('page.wms.inventoryData.existingImportTaskId'),
    minWidth: 120,
    ellipsis: { tooltip: true },
    render: (row: WmsExistingImportTaskRecord) => String(row.taskId)
  },
  {
    key: 'status',
    title: $t('page.wms.inventoryData.existingImportTaskStatus'),
    width: 120,
    render: (row: WmsExistingImportTaskRecord) =>
      h(
        NTag,
        { type: statusTagType(row.lastStatus?.status), size: 'small' },
        { default: () => statusLabel(row.lastStatus?.status) }
      )
  },
  {
    key: 'submittedAt',
    title: $t('page.wms.inventoryData.existingImportTaskSubmittedAt'),
    width: 176,
    render: (row: WmsExistingImportTaskRecord) =>
      row.submittedAt ? dayjs(row.submittedAt).format('YYYY-MM-DD HH:mm:ss') : '—'
  },
  {
    key: 'counts',
    title: $t('page.wms.inventoryData.existingImportTaskCounts'),
    width: 160,
    ellipsis: { tooltip: true },
    render: (row: WmsExistingImportTaskRecord) => {
      const s = row.lastStatus;
      if (!s) return '—';
      const t = s.totalRows;
      const ok = s.successCount;
      const fail = s.failCount;
      const parts: string[] = [];
      if (t != null) parts.push(`${$t('page.wms.inventoryData.existingImportTaskTotal')}:${t}`);
      if (ok != null) parts.push(`${$t('page.wms.inventoryData.existingImportTaskOk')}:${ok}`);
      if (fail != null) parts.push(`${$t('page.wms.inventoryData.existingImportTaskFail')}:${fail}`);
      return parts.length ? parts.join(' / ') : '—';
    }
  },
  {
    key: 'actions',
    title: $t('common.action'),
    width: 220,
    fixed: 'right' as const,
    render: (row: WmsExistingImportTaskRecord) =>
      h(NSpace, { size: 8 }, {
        default: () => [
          h(
            NButton,
            {
              size: 'small',
              onClick: () => void openDetail(row)
            },
            { default: () => $t('page.wms.inventoryData.existingImportTaskView') }
          ),
          h(
            NPopconfirm,
            {
              onPositiveClick: () => void requestInterrupt(row)
            },
            {
              trigger: () =>
                h(
                  NButton,
                  {
                    size: 'small',
                    type: 'warning',
                    quaternary: true,
                    disabled: !isRowRunning(row)
                  },
                  { default: () => $t('page.wms.inventoryData.existingImportTaskInterrupt') }
                ),
              default: () => $t('page.wms.inventoryData.existingImportTaskInterruptConfirm')
            }
          )
        ]
      })
  }
]);

const scrollX = computed(() =>
  columns.value.reduce(
    (acc: number, c: { width?: number; minWidth?: number }) => acc + Number(c.width ?? c.minWidth ?? 100),
    0
  )
);

watch(visible, v => {
  if (v) {
    taskPagination.page = 1;
    taskStore.resumePollingIfNeeded();
  }
});
</script>

<template>
  <NModal
    v-model:show="visible"
    preset="card"
    :title="$t('page.wms.inventoryData.existingImportTasksModalTitle')"
    :bordered="false"
    display-directive="if"
    class="max-w-[min(1100px,96vw)] w-[min(1100px,96vw)]"
    :content-style="{ maxHeight: 'min(88vh, 720px)' }"
  >
    <div class="mb-12px flex flex-wrap items-center gap-12px text-13px text-gray-600 dark:text-gray-400">
      <span>{{ $t('page.wms.inventoryData.existingImportTasksHint') }}</span>
      <NButton quaternary size="tiny" type="primary" @click="taskStore.markAllTerminalRead()">
        {{ $t('page.wms.inventoryData.existingImportTaskMarkAllRead') }}
      </NButton>
      <NTag v-if="runningCount > 0" size="small" type="info" round>
        {{ $t('page.wms.inventoryData.existingImportTaskRunningTag') }} × {{ runningCount }}
      </NTag>
      <NTag v-if="unreadTerminalCount > 0" size="small" type="error" round>
        {{ $t('page.wms.inventoryData.existingImportTaskUnread') }} × {{ unreadTerminalCount }}
      </NTag>
    </div>

    <NDataTable
      size="small"
      :columns="columns"
      :data="sortedTaskRows"
      :row-key="r => String(r.taskId)"
      :scroll-x="scrollX"
      :max-height="420"
      striped
      :pagination="taskPagination"
    />

    <NModal
      v-model:show="detailOpen"
      preset="card"
      :title="$t('page.wms.inventoryData.existingImportTaskDetailTitle')"
      :bordered="false"
      class="max-w-[min(1200px,96vw)] w-[min(1200px,96vw)]"
      display-directive="if"
      @close="closeDetail"
    >
      <template v-if="detailRecord?.lastStatus">
        <NAlert
          v-if="String(detailRecord.lastStatus.status ?? '').toUpperCase() === 'FAILED'"
          type="error"
          class="mb-12px"
          :title="$t('common.importFail')"
        >
          {{
            detailRecord.lastStatus.errorMessage?.trim() ||
              $t('page.wms.inventoryData.existingImportTaskNoErrorDetail')
          }}
        </NAlert>

        <div class="mb-8px text-13px leading-relaxed">
          <span class="mr-12px font-600">{{ $t('page.wms.inventoryData.existingImportTaskStatus') }}：</span>
          {{ statusLabel(detailRecord.lastStatus.status) }}
        </div>
        <div
          v-if="
            detailRecord.lastStatus.summaryMessage?.trim() ||
              detailRecord.lastStatus.totalRows != null ||
              detailRecord.lastStatus.successCount != null
          "
          class="mb-12px text-13px leading-relaxed whitespace-pre-wrap"
        >
          {{
            detailRecord.lastStatus.summaryMessage?.trim() ||
              [
                detailRecord.lastStatus.totalRows != null
                  ? `${$t('page.wms.inventoryData.existingImportTaskTotal')}: ${detailRecord.lastStatus.totalRows}`
                  : '',
                detailRecord.lastStatus.successCount != null
                  ? `${$t('page.wms.inventoryData.existingImportTaskOk')}: ${detailRecord.lastStatus.successCount}`
                  : '',
                detailRecord.lastStatus.failCount != null
                  ? `${$t('page.wms.inventoryData.existingImportTaskFail')}: ${detailRecord.lastStatus.failCount}`
                  : ''
              ]
                .filter(Boolean)
                .join('；')
          }}
        </div>

        <div v-if="resultRowsForDetail.length" class="min-h-0 flex flex-col gap-8px overflow-hidden">
          <div class="flex flex-wrap items-center gap-12px">
            <span class="text-13px font-600">{{ $t('page.wms.inventoryData.existingImportTaskResultRows') }}</span>
            <NFormItem
              :label="$t('page.wms.inventoryData.existingImportTaskDetailFilterInventoryStatus')"
              label-placement="left"
              :show-feedback="false"
              class="mb-0 min-w-0"
            >
              <NSelect
                v-model:value="detailInventoryStatusFilter"
                clearable
                filterable
                :consistent-menu-width="false"
                :options="detailInventoryStatusOptions"
                :placeholder="$t('page.wms.inventoryData.existingImportTaskDetailFilterInventoryStatusPh')"
                class="min-w-200px max-w-360px"
              />
            </NFormItem>
          </div>
          <NTabs v-model:value="detailResultTab" type="line" class="min-h-0 flex flex-col">
            <NTabPane
              name="success"
              :tab="`${$t('page.wms.inventoryData.existingImportTaskTabSuccess')} (${detailResultSuccessRows.length})`"
            >
              <NDataTable
                v-if="detailResultSuccessRows.length"
                size="small"
                :columns="resultColumns"
                :data="detailResultSuccessRows"
                :scroll-x="resultScrollX"
                :max-height="360"
                striped
                :pagination="detailSuccessPagination"
              />
              <NEmpty v-else class="py-32px" :description="$t('page.wms.inventoryData.existingImportTaskTabEmpty')" />
            </NTabPane>
            <NTabPane
              name="failed"
              :tab="`${$t('page.wms.inventoryData.existingImportTaskTabFailed')} (${detailResultFailedRows.length})`"
            >
              <NDataTable
                v-if="detailResultFailedRows.length"
                size="small"
                :columns="resultColumns"
                :data="detailResultFailedRows"
                :scroll-x="resultScrollX"
                :max-height="360"
                striped
                :pagination="detailFailedPagination"
              />
              <NEmpty v-else class="py-32px" :description="$t('page.wms.inventoryData.existingImportTaskTabEmpty')" />
            </NTabPane>
          </NTabs>
        </div>
        <div v-else class="text-13px text-gray-500 dark:text-gray-400">
          {{ $t('page.wms.inventoryData.existingImportTaskNoRows') }}
        </div>
      </template>
      <template v-else>
        <div class="py-24px text-center text-13px text-gray-500">
          {{ $t('page.wms.inventoryData.existingImportTaskLoadingStatus') }}
        </div>
      </template>
      <template #footer>
        <NSpace justify="end">
          <NButton @click="closeDetail">{{ $t('common.close') }}</NButton>
        </NSpace>
      </template>
    </NModal>
  </NModal>
</template>
