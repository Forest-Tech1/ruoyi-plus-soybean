<script setup lang="tsx">
import { computed, ref, shallowRef, watch } from 'vue';
import type { DataTableColumns, SelectOption } from 'naive-ui';
import { NButton, NDatePicker, NInput } from 'naive-ui';
import dayjs from 'dayjs';
import { fetchGetParkSchedulingTaskList } from '@/service/api/wms/park-scheduling';
import {
  computeParkSchedulingTaskTypeSummaries,
  extractPaginatedRows,
  extractPaginatedTotal,
  fetchParkSchedulingAllTasks,
  fetchParkSchedulingInProgressOnlyTasks,
  fetchParkSchedulingPendingPoolTasks,
  type ParkSchedulingTaskListScanBase
} from '@/constants/wms-park';
import { WMS_DICT_DEVANNING_ROUND } from '@/constants/wms-devanning';
import { useDict } from '@/hooks/business/dict';
import { $t } from '@/locales';
import ParkTaskStatusSelect from './park-task-status-select.vue';
import ParkTaskSidebarInlineField from './park-task-sidebar-inline-field.vue';

defineOptions({
  name: 'ParkSchedulingTaskSidebar'
});

const props = defineProps<{
  reloadNonce?: number;
}>();

const emit = defineEmits<{
  statusChanged: [];
  openOrderDetail: [task: Api.Wms.ParkSchedulingTask];
}>();

function renderCoNoCell(row: Api.Wms.ParkSchedulingTask) {
  return (
    <span
      class="park-task-sidebar__co-link cursor-pointer"
      title={$t('page.wms.parkScheduling.coNoOpenDetailHint')}
      onDblclick={(e: MouseEvent) => {
        e.stopPropagation();
        emit('openOrderDetail', row);
      }}
    >
      {row.coNo ?? '—'}
    </span>
  );
}

const { data: devanningDictList, record: devanningRoundRecord } = useDict(WMS_DICT_DEVANNING_ROUND, true);

/** 侧栏作业状态 Tab（`all` 仅前端合并展示，不传 `workStatus`） */
type SidebarWorkTab = Api.Wms.ParkSchedulingWorkStatus | 'all';

const workTab = ref<SidebarWorkTab>('pending');
/** 拆柜 / 装车，与页面顶部筛选同步（`v-model:task-type`） */
const taskTypeTab = defineModel<Api.Wms.ParkTaskType>('taskType', { default: 'devanning' });

const loading = ref(false);
const tasks = ref<Api.Wms.ParkSchedulingTask[]>([]);
/** 待作业时间筛选；默认当日 0:00～23:59（清空则不限日期，由后端决定） */
function defaultPlannedWorkDayRange(): [number, number] {
  const d = dayjs();
  return [d.startOf('day').valueOf(), d.endOf('day').valueOf()];
}

const plannedWorkTimeRange = ref<[number, number] | null>(defaultPlannedWorkDayRange());

const coNoKeyword = ref('');

const pageNum = ref(1);
const pageSize = ref(20);
const total = ref(0);

const workTabCounts = ref({
  all: 0,
  pending: 0,
  in_progress: 0,
  completed: 0,
  not_arrived: 0
});

function buildSidebarTaskScanBase(): ParkSchedulingTaskListScanBase {
  const coNo = coNoKeyword.value.trim() || undefined;
  let expectedDevanningTimeBegin: string | null = null;
  let expectedDevanningTimeEnd: string | null = null;
  const range = plannedWorkTimeRange.value;
  if (range && range.length === 2 && range[0] != null && range[1] != null) {
    expectedDevanningTimeBegin = dayjs(range[0]).startOf('day').format('YYYY-MM-DD HH:mm:ss');
    expectedDevanningTimeEnd = dayjs(range[1]).endOf('day').format('YYYY-MM-DD HH:mm:ss');
  }
  return {
    taskType: taskTypeTab.value,
    coNo: coNo ?? null,
    expectedDevanningTimeBegin,
    expectedDevanningTimeEnd
  };
}

async function loadWorkTabCounts() {
  const sum = await computeParkSchedulingTaskTypeSummaries(buildSidebarTaskScanBase());
  workTabCounts.value = {
    all:
      sum.pendingPoolCount +
      sum.inProgressOnlyCount +
      sum.completedTotal +
      sum.notArrivedTotal,
    pending: sum.pendingPoolCount,
    in_progress: sum.inProgressOnlyCount,
    completed: sum.completedTotal,
    not_arrived: sum.notArrivedTotal
  };
}

const workTabNavItems = computed(() => [
  { name: 'all' as const, label: $t('page.wms.parkScheduling.tabAllWork'), count: workTabCounts.value.all },
  {
    name: 'not_arrived' as const,
    label: $t('page.wms.parkScheduling.tabNotArrivedWork'),
    count: workTabCounts.value.not_arrived
  },
  { name: 'pending' as const, label: $t('page.wms.parkScheduling.tabPendingWork'), count: workTabCounts.value.pending },
  {
    name: 'in_progress' as const,
    label: $t('page.wms.parkScheduling.tabInProgressWork'),
    count: workTabCounts.value.in_progress
  },
  {
    name: 'completed' as const,
    label: $t('page.wms.parkScheduling.tabCompletedWork'),
    count: workTabCounts.value.completed
  }
]);

function selectWorkTab(name: SidebarWorkTab) {
  workTab.value = name;
}

function reloadSidebarData() {
  void Promise.all([loadTasks(), loadWorkTabCounts()]);
}

/** 「待作业 / 作业中」Tab 合并列表缓存（换筛选或 Tab 时失效） */
const pendingPoolMerged = shallowRef<Api.Wms.ParkSchedulingTask[] | null>(null);
const pendingPoolMergeKey = ref('');
const inProgressMerged = shallowRef<Api.Wms.ParkSchedulingTask[] | null>(null);
const inProgressMergeKey = ref('');
const allMerged = shallowRef<Api.Wms.ParkSchedulingTask[] | null>(null);
const allMergeKey = ref('');

function buildSidebarListMergeKey(): string {
  const range = plannedWorkTimeRange.value;
  const begin =
    range && range.length >= 2 && range[0] != null
      ? dayjs(range[0]).startOf('day').format('YYYY-MM-DD HH:mm:ss')
      : '';
  const end =
    range && range.length >= 2 && range[1] != null
      ? dayjs(range[1]).endOf('day').format('YYYY-MM-DD HH:mm:ss')
      : '';
  return [taskTypeTab.value, coNoKeyword.value.trim(), begin, end].join('|');
}

function invalidateSidebarMergedCaches() {
  pendingPoolMerged.value = null;
  pendingPoolMergeKey.value = '';
  inProgressMerged.value = null;
  inProgressMergeKey.value = '';
  allMerged.value = null;
  allMergeKey.value = '';
}

const roundSelectOptions = computed<SelectOption[]>(() =>
  devanningDictList.value.map(d => ({ label: d.dictLabel!, value: String(d.dictValue) }))
);

const columns = computed<DataTableColumns<Api.Wms.ParkSchedulingTask>>(() => {
  const coNoCol = {
    title: $t('page.wms.parkScheduling.coNo'),
    key: 'coNo',
    minWidth: 120,
    ellipsis: { tooltip: true },
    render: (row: Api.Wms.ParkSchedulingTask) => renderCoNoCell(row)
  } as const;

  const orderLevelCol = {
    title: () => (
      <span title={$t('page.wms.parkScheduling.tableDoubleClickEditHint')}>
        {$t('page.wms.parkScheduling.orderLevel')}
      </span>
    ),
    key: 'orderLevel',
    width: 56,
    align: 'center' as const,
    titleAlign: 'center' as const,
    render: (row: Api.Wms.ParkSchedulingTask) => (
      <ParkTaskSidebarInlineField
        kind="orderLevel"
        task={row}
        onPatched={() => handleStatusChanged()}
      />
    )
  };

  const statusCol = {
    title: $t('page.wms.parkScheduling.status'),
    key: 'status',
    width: 100,
    align: 'right' as const,
    titleAlign: 'right' as const,
    render: (row: Api.Wms.ParkSchedulingTask) => (
      <div class="park-task-sidebar__status-wrap">
        <ParkTaskStatusSelect taskId={row.id} status={row.status} onChanged={() => handleStatusChanged()} />
      </div>
    )
  };

  const dockNameCol = {
    title: $t('page.wms.parkScheduling.columnDock'),
    key: 'dockName',
    width: 72,
    align: 'center' as const,
    titleAlign: 'center' as const,
    ellipsis: { tooltip: true },
    render: (row: Api.Wms.ParkSchedulingTask) =>
      (row.devanningDock ?? row.dockName ?? '').trim() || '—'
  };

  const roundCol = {
    title: () => (
      <span title={$t('page.wms.parkScheduling.tableDoubleClickEditHint')}>
        {$t('page.wms.parkScheduling.devanningRound')}
      </span>
    ),
    key: 'devanningRound',
    width: 72,
    align: 'center' as const,
    titleAlign: 'center' as const,
    render: (row: Api.Wms.ParkSchedulingTask) => (
      <ParkTaskSidebarInlineField
        kind="devanningRound"
        task={row}
        dictRecord={devanningRoundRecord.value}
        roundOptions={roundSelectOptions.value}
        onPatched={() => handleStatusChanged()}
      />
    )
  };

  if (workTab.value === 'not_arrived') {
    return [coNoCol, orderLevelCol, statusCol];
  }

  if (workTab.value === 'pending') {
    return [coNoCol, orderLevelCol, roundCol, statusCol];
  }

  if (workTab.value === 'all') {
    return [coNoCol, orderLevelCol, dockNameCol, roundCol, statusCol];
  }

  return [coNoCol, dockNameCol, roundCol, statusCol];
});

async function loadTasks() {
  loading.value = true;
  try {
    const base = buildSidebarTaskScanBase();

    if (workTab.value === 'pending') {
      const mk = buildSidebarListMergeKey();
      if (pendingPoolMerged.value == null || pendingPoolMergeKey.value !== mk) {
        pendingPoolMerged.value = await fetchParkSchedulingPendingPoolTasks(base);
        pendingPoolMergeKey.value = mk;
      }
      const merged = pendingPoolMerged.value ?? [];
      total.value = merged.length;
      const start = (pageNum.value - 1) * pageSize.value;
      tasks.value = merged.slice(start, start + pageSize.value);
      return;
    }

    if (workTab.value === 'in_progress') {
      const mk = buildSidebarListMergeKey();
      if (inProgressMerged.value == null || inProgressMergeKey.value !== mk) {
        inProgressMerged.value = await fetchParkSchedulingInProgressOnlyTasks(base);
        inProgressMergeKey.value = mk;
      }
      const merged = inProgressMerged.value ?? [];
      total.value = merged.length;
      const start = (pageNum.value - 1) * pageSize.value;
      tasks.value = merged.slice(start, start + pageSize.value);
      return;
    }

    if (workTab.value === 'all') {
      const mk = buildSidebarListMergeKey();
      if (allMerged.value == null || allMergeKey.value !== mk) {
        allMerged.value = await fetchParkSchedulingAllTasks(base);
        allMergeKey.value = mk;
      }
      const merged = allMerged.value ?? [];
      total.value = merged.length;
      const start = (pageNum.value - 1) * pageSize.value;
      tasks.value = merged.slice(start, start + pageSize.value);
      return;
    }

    const { data, error } = await fetchGetParkSchedulingTaskList({
      pageNum: pageNum.value,
      pageSize: pageSize.value,
      ...base,
      workStatus: workTab.value
    });
    if (error) return;
    total.value = extractPaginatedTotal(data);
    tasks.value = extractPaginatedRows<Api.Wms.ParkSchedulingTask>(data);
  } finally {
    loading.value = false;
  }
}

function runSearchFromFirstPage() {
  pageNum.value = 1;
  invalidateSidebarMergedCaches();
  reloadSidebarData();
}

function onPageSizeChange() {
  pageNum.value = 1;
  invalidateSidebarMergedCaches();
  reloadSidebarData();
}

function handleStatusChanged() {
  invalidateSidebarMergedCaches();
  reloadSidebarData();
  emit('statusChanged');
}

/** 「待作业」仅拖 `pending`；「未到仓」Tab 拖 `not_arrived` 改派 Dock */
function onDragStart(e: DragEvent, task: Api.Wms.ParkSchedulingTask) {
  const fromPending =
    (workTab.value === 'pending' || workTab.value === 'all') && task.status === 'pending';
  const fromNotArrived =
    (workTab.value === 'not_arrived' || workTab.value === 'all') && task.status === 'not_arrived';
  if (!fromPending && !fromNotArrived) return;
  e.dataTransfer?.setData('application/x-park-task-id', String(task.id));
  e.dataTransfer?.setData('application/x-park-task-type', task.taskType);
  e.dataTransfer?.setData(
    'application/x-park-assign-intent',
    fromNotArrived ? 'not_arrived' : 'queued'
  );
  if (e.dataTransfer) e.dataTransfer.effectAllowed = 'move';
}

watch(
  () => [workTab.value, taskTypeTab.value] as const,
  (next, prev) => {
    pageNum.value = 1;
    invalidateSidebarMergedCaches();
    if (prev != null && next[1] !== prev[1]) {
      plannedWorkTimeRange.value = defaultPlannedWorkDayRange();
    }
    reloadSidebarData();
  },
  { immediate: true }
);

watch(
  () => props.reloadNonce,
  () => {
    invalidateSidebarMergedCaches();
    reloadSidebarData();
  }
);

defineExpose({ reload: reloadSidebarData });
</script>

<template>
  <div class="park-task-sidebar flex flex-col h-full min-h-0">
    <div class="park-task-sidebar__header shrink-0">
      <div class="park-work-tabs-nav" role="tablist">
        <button
          v-for="item in workTabNavItems"
          :key="item.name"
          type="button"
          role="tab"
          class="park-work-tabs-nav__btn"
          :class="{ 'park-work-tabs-nav__btn--active': workTab === item.name }"
          :aria-selected="workTab === item.name"
          @click="selectWorkTab(item.name)"
        >
          <span class="park-work-tab">
            {{ item.label }}
            <span class="park-work-tab__badge">{{ item.count }}</span>
          </span>
        </button>
      </div>
    </div>

    <div class="park-task-sidebar__filters shrink-0">
      <div class="park-task-sidebar__filter-row">
        <NInput
          v-model:value="coNoKeyword"
          size="small"
          clearable
          :placeholder="$t('page.wms.parkScheduling.coNoSearchPlaceholder')"
          @keyup.enter="runSearchFromFirstPage"
          @clear="runSearchFromFirstPage"
        />
        <NButton size="small" type="primary" secondary @click="runSearchFromFirstPage">
          {{ $t('common.search') }}
        </NButton>
      </div>
      <div class="park-task-sidebar__filter-row park-task-sidebar__filter-row--date">
        <span class="park-task-sidebar__date-label">{{ $t('page.wms.parkScheduling.plannedWorkTimeFilter') }}</span>
        <NDatePicker
          v-model:value="plannedWorkTimeRange"
          type="daterange"
          size="small"
          clearable
          class="park-task-sidebar__date-picker"
          :default-time="['00:00:00', '23:59:59']"
          :placeholder="$t('page.wms.parkScheduling.plannedWorkTimeRangePlaceholder')"
          @clear="runSearchFromFirstPage"
          @update:value="runSearchFromFirstPage"
        />
      </div>
    </div>

    <div class="park-task-sidebar__table min-h-0 flex flex-1 flex-col overflow-hidden">
      <div class="park-task-sidebar__table-scroll min-h-0 flex flex-1 flex-col overflow-hidden">
        <NSpin :show="loading" class="flex min-h-0 flex-1 flex-col" content-class="flex min-h-0 flex-1 flex-col">
          <NDataTable
            flex-height
            size="small"
            :columns="columns"
            :data="tasks"
            :pagination="false"
            class="park-task-sidebar__data-table h-full min-h-0"
            :row-key="row => String(row.id)"
            :row-props="
              row =>
                ((workTab === 'pending' || workTab === 'all') && row.status === 'pending') ||
                ((workTab === 'not_arrived' || workTab === 'all') && row.status === 'not_arrived')
                  ? {
                      draggable: true,
                      style: 'cursor: grab',
                      onDragstart: (e: DragEvent) => onDragStart(e, row)
                    }
                  : {}
            "
          />
        </NSpin>
      </div>
      <NPagination
        v-model:page="pageNum"
        v-model:page-size="pageSize"
        class="park-task-sidebar__pagination shrink-0"
        size="small"
        :item-count="total"
        :page-sizes="[10, 20, 40]"
        show-size-picker
        :disabled="loading"
        @update:page="loadTasks"
        @update:page-size="onPageSizeChange"
      />
    </div>
  </div>
</template>

<style scoped>
.park-task-sidebar {
  width: 100%;
  min-width: 0;
  height: 100%;
  min-height: 0;
}

.park-task-sidebar__header {
  padding: 8px 12px 0;
  border-bottom: 1px solid #e6f0ff;
  background: #f5faff;
}

.park-task-sidebar__filters {
  padding: 8px 12px;
  background: #fff;
  border-bottom: 1px solid #e6f0ff;
}

.park-task-sidebar__filter-row {
  display: flex;
  gap: 8px;
  align-items: center;
}

.park-task-sidebar__filter-row + .park-task-sidebar__filter-row {
  margin-top: 8px;
}

.park-task-sidebar__filter-row--date {
  flex-wrap: wrap;
}

.park-task-sidebar__date-label {
  flex: 0 0 auto;
  font-size: 12px;
  color: #595959;
}

.park-task-sidebar__date-picker {
  flex: 1 1 160px;
  min-width: 0;
}

.park-task-sidebar__filter-row :deep(.n-input) {
  flex: 1;
  min-width: 0;
}

.park-task-sidebar__table {
  flex: 1 1 0;
  min-height: 0;
  min-width: 0;
  padding: 8px;
  background: #fff;
}

.park-task-sidebar__pagination {
  display: flex;
  flex-wrap: wrap;
  justify-content: flex-end;
  gap: 8px;
  padding: 8px 0 0;
  margin-top: 2px;
  border-top: 1px solid #f0f0f0;
}

.park-work-tabs-nav {
  display: flex;
  flex-wrap: nowrap;
  align-items: stretch;
  border-bottom: 1px solid #e6f0ff;
}

.park-work-tabs-nav__btn {
  flex: 0 0 auto;
  margin: 0;
  padding: 6px 8px;
  border: none;
  border-bottom: 2px solid transparent;
  margin-bottom: -1px;
  background: transparent;
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
  line-height: 1.35;
  color: var(--n-text-color, rgb(51, 54, 57));
  transition: color 0.2s, border-color 0.2s;
}

.park-work-tabs-nav__btn:hover {
  color: #1890ff;
}

.park-work-tabs-nav__btn--active {
  color: #1890ff;
  border-bottom-color: #1890ff;
}

.park-work-tab {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  white-space: nowrap;
  pointer-events: none;
}

.park-work-tab__badge {
  flex-shrink: 0;
  min-width: 16px;
  height: 16px;
  padding: 0 4px;
  font-size: 10px;
  font-weight: 600;
  line-height: 16px;
  text-align: center;
  color: #fff;
  background: #1677ff;
  border-radius: 999px;
  box-sizing: border-box;
}

.park-work-tabs-nav__btn--active .park-work-tab__badge {
  background: #0958d9;
}

.park-task-sidebar__data-table :deep(.n-data-table-th) {
  background: #f5faff !important;
  color: #595959;
  font-weight: 600;
}

.park-task-sidebar__status-wrap {
  display: flex;
  justify-content: flex-end;
  width: 100%;
  min-width: 0;
}

.park-task-sidebar__status-wrap :deep(.park-task-status-select) {
  min-width: 0;
  width: auto;
  max-width: 100%;
}

.park-task-sidebar__data-table :deep(.n-data-table-tr:hover .n-data-table-td) {
  background: #f0f7ff !important;
}
</style>
