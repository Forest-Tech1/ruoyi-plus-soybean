<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue';
import { useRouter } from 'vue-router';
import {
  fetchAssignParkSchedulingTask,
  fetchGetParkSchedulingBoard
} from '@/service/api/wms/park-scheduling';
import { useAuth } from '@/hooks/business/auth';
import { $t } from '@/locales';
import SvgIcon from '@/components/custom/svg-icon.vue';
import {
  applyParkBoardTaskOrderLevels,
  buildParkTaskOrderLevelLookup,
  computeParkSchedulingTaskTypeSummaries,
  countParkBoardDockInProgressTasks,
  filterParkBoardByDockBusinessType,
  resolveParkTaskDevanningOrderId
} from '@/constants/wms-park';
import DevanningOrderDetailDrawer from '@/views/wms/order/devanning-order/modules/devanning-order-detail-drawer.vue';
import ParkSchedulingDockGrid from './modules/park-scheduling-dock-grid.vue';
import ParkSchedulingTaskSidebar from './modules/park-scheduling-task-sidebar.vue';
import ParkSchedulingTaskCreateModal from './modules/park-scheduling-task-create-modal.vue';
import type { ParkCreatePresetDock } from './modules/park-scheduling-task-create-modal.vue';
import ParkSchedulingDockQueueModal from './modules/park-scheduling-dock-queue-modal.vue';
import ParkSchedulingStatsStrip from './modules/park-scheduling-stats-strip.vue';
import ParkSchedulingCabinetReportModal from './modules/park-scheduling-cabinet-report-modal.vue';
import ParkSchedulingBatchResultModal from './modules/park-scheduling-batch-result-modal.vue';
import ParkSchedulingReleaseDockModal from './modules/park-scheduling-release-dock-modal.vue';

defineOptions({
  name: 'ParkScheduling'
});

const router = useRouter();
const { hasAuth } = useAuth();

const boardLoading = ref(false);
const board = ref<Api.Wms.ParkSchedulingBoard | null>(null);
const taskReloadNonce = ref(0);
const sidebarCollapsed = ref(false);

const createModalVisible = ref(false);
const createPresetDock = ref<ParkCreatePresetDock | null>(null);
const queueModalVisible = ref(false);
const selectedDockId = ref<CommonType.IdType | null>(null);
const releaseDockVisible = ref(false);

/** 顶栏展示：有调度列表权限即可见；提交接口仍由后端鉴权 releaseDock/complete/edit */
const showReleaseDockButton = computed(() => hasAuth('wms:parkScheduling:list'));

const cabinetReportVisible = ref(false);
const batchResultVisible = ref(false);
const lastBatchResult = ref<Api.Wms.ParkSchedulingBatchUpsertResult | null>(null);

const devanningOrderDetailVisible = ref(false);
const devanningOrderDetailId = ref<CommonType.IdType | null>(null);

function openDevanningOrderDetail(task: Api.Wms.ParkSchedulingTask) {
  const orderId = resolveParkTaskDevanningOrderId(task);
  if (!orderId) {
    window.$message?.warning($t('page.wms.parkScheduling.coNoOpenDetailNoOrder'));
    return;
  }
  devanningOrderDetailId.value = orderId;
  devanningOrderDetailVisible.value = true;
}

const batchResultBadge = computed(() => {
  const r = lastBatchResult.value;
  if (!r) return '';
  return `${r.successCount}/${r.successCount + r.failCount}`;
});

function onBatchResult(result: Api.Wms.ParkSchedulingBatchUpsertResult) {
  lastBatchResult.value = result;
  if (result.failCount > 0) {
    batchResultVisible.value = true;
  }
}

function openBatchResult() {
  if (!lastBatchResult.value) {
    window.$message?.info($t('page.wms.parkScheduling.batchResultEmpty'));
    return;
  }
  batchResultVisible.value = true;
}

const sidebarRef = ref<InstanceType<typeof ParkSchedulingTaskSidebar> | null>(null);

/** 顶部 / 侧栏共用：Dock 业务类型（拆柜道口 vs 装车道口），默认拆柜 */
const pageDockBusinessType = ref<Api.Wms.ParkTaskType>('devanning');

const filteredBoard = computed(() =>
  filterParkBoardByDockBusinessType(board.value, pageDockBusinessType.value)
);

const statsLoading = ref(false);
const stats = ref({
  total: 0,
  pending: 0,
  completed: 0,
  dockInProgress: 0
});

async function loadTaskStats() {
  const tt = pageDockBusinessType.value;
  statsLoading.value = true;
  try {
    const sum = await computeParkSchedulingTaskTypeSummaries({
      taskType: tt,
      coNo: null,
      expectedDevanningTimeBegin: null,
      expectedDevanningTimeEnd: null
    });
    stats.value = {
      pending: sum.pendingPoolCount,
      completed: sum.completedTotal,
      total: sum.pendingPoolCount + sum.inProgressOnlyCount + sum.completedTotal + sum.notArrivedTotal,
      dockInProgress: countParkBoardDockInProgressTasks(filteredBoard.value, tt)
    };
  } finally {
    statsLoading.value = false;
  }
}

async function loadBoard() {
  boardLoading.value = true;
  try {
    const taskType = pageDockBusinessType.value;
    const [boardRes, levelLookup] = await Promise.all([
      fetchGetParkSchedulingBoard(),
      taskType === 'devanning' ? buildParkTaskOrderLevelLookup('devanning') : Promise.resolve(null)
    ]);
    if (boardRes.error) return;
    let next = boardRes.data ?? null;
    if (next && levelLookup) {
      next = applyParkBoardTaskOrderLevels(next, levelLookup);
    }
    board.value = next;
  } finally {
    boardLoading.value = false;
  }
}

async function refreshAll() {
  await loadBoard();
  await loadTaskStats();
  taskReloadNonce.value += 1;
  sidebarRef.value?.reload();
}

async function handleTaskDrop(
  dock: Api.Wms.ParkDockBoardCard,
  taskId: CommonType.IdType,
  taskType?: Api.Wms.ParkTaskType | null,
  assignIntent: Api.Wms.ParkSchedulingTaskAssignParams['assignIntent'] = 'queued'
) {
  if (dock.id == null || dock.placeholder) return;
  if (taskType && dock.businessType && taskType !== dock.businessType) {
    window.$message?.warning($t('page.wms.parkScheduling.assignBusinessTypeMismatch'));
    return;
  }
  const { error } = await fetchAssignParkSchedulingTask({
    taskId,
    dockId: dock.id,
    /** 待作业拖入 → `queued`；未到仓 Tab 改派 → `not_arrived`（见 docs §4.3） */
    assignIntent: assignIntent ?? 'queued'
  });
  if (error) return;
  window.$message?.success($t('page.wms.parkScheduling.assignSuccess'));
  void refreshAll();
}

function handleDockDblClick(dock: Api.Wms.ParkDockBoardCard) {
  if (dock.id == null) return;
  selectedDockId.value = dock.id;
  queueModalVisible.value = true;
}

function openCreateTaskToolbar() {
  createPresetDock.value = null;
  createModalVisible.value = true;
}

watch(pageDockBusinessType, () => {
  void loadTaskStats();
});

watch(createModalVisible, v => {
  if (!v) createPresetDock.value = null;
});

function goParkManagement() {
  router.push({ name: 'wms_order_park-management' });
}

function toggleSidebar() {
  sidebarCollapsed.value = !sidebarCollapsed.value;
}

onMounted(() => {
  void refreshAll();
});
</script>

<template>
  <div class="park-scheduling-page h-full min-h-0 flex flex-col gap-8px overflow-hidden lt-sm:overflow-auto">
    <NCard :bordered="false" size="small" class="park-scheduling-toolbar card-wrapper shrink-0">
      <NCollapse class="park-scheduling-toolbar__collapse">
        <NCollapseItem :title="$t('page.wms.parkScheduling.toolbarCollapseTitle')" name="park-scheduling-toolbar">
          <div class="flex flex-wrap items-center gap-12px lt-md:flex-col lt-md:items-stretch">
            <NButton quaternary circle :title="$t('common.refresh')" class="shrink-0" @click="refreshAll">
              <template #icon>
                <SvgIcon icon="material-symbols:refresh-rounded" class="text-18px" />
              </template>
            </NButton>
            <div class="flex shrink-0 flex-wrap items-center">
              <NRadioGroup v-model:value="pageDockBusinessType" size="small">
                <NRadioButton value="devanning">{{ $t('page.wms.parkScheduling.taskTypeDevanning') }}</NRadioButton>
                <NRadioButton value="loading">{{ $t('page.wms.parkScheduling.taskTypeLoading') }}</NRadioButton>
              </NRadioGroup>
            </div>
            <ParkSchedulingStatsStrip
              class="min-w-0 flex-1"
              :loading="statsLoading"
              :total="stats.total"
              :pending="stats.pending"
              :completed="stats.completed"
              :dock-in-progress="stats.dockInProgress"
            />
            <NSpace :size="12" class="shrink-0">
              <NButton
                v-if="hasAuth('wms:parkScheduling:list')"
                secondary
                @click="cabinetReportVisible = true"
              >
                {{ $t('page.wms.parkScheduling.cabinetReportExportButton') }}
              </NButton>
              <NButton
                v-if="lastBatchResult"
                secondary
                @click="openBatchResult"
              >
                {{ $t('page.wms.parkScheduling.batchResultButton') }}
                <template v-if="batchResultBadge">
                  （{{ batchResultBadge }}）
                </template>
              </NButton>
              <NButton v-if="hasAuth('wms:parkScheduling:add')" type="primary" @click="openCreateTaskToolbar">
                {{ $t('page.wms.parkScheduling.createTask') }}
              </NButton>
              <NButton @click="goParkManagement">{{ $t('page.wms.parkScheduling.parkManagement') }}</NButton>
            </NSpace>
          </div>
        </NCollapseItem>
      </NCollapse>
    </NCard>

    <NCard
      :bordered="false"
      size="small"
      content-class="flex min-h-0 flex-1 flex-col overflow-hidden"
      class="park-scheduling-main card-wrapper flex flex-1 flex-col min-h-0 overflow-hidden sm:flex-1-hidden"
    >
      <div class="park-scheduling-layout flex h-full min-h-0 flex-1 gap-0 overflow-hidden">
        <aside
          class="park-sidebar-shell"
          :class="{ 'park-sidebar-shell--collapsed': sidebarCollapsed }"
        >
          <button
            type="button"
            class="park-sidebar-shell__toggle"
            :title="
              sidebarCollapsed
                ? $t('page.wms.parkScheduling.expandTaskPanel')
                : $t('page.wms.parkScheduling.collapseTaskPanel')
            "
            @click="toggleSidebar"
          >
            <SvgIcon
              :icon="
                sidebarCollapsed
                  ? 'material-symbols:chevron-right-rounded'
                  : 'material-symbols:chevron-left-rounded'
              "
              class="text-18px"
            />
          </button>

          <div v-if="sidebarCollapsed" class="park-sidebar-shell__rail" @click="toggleSidebar">
            <span class="park-sidebar-shell__rail-text">{{ $t('page.wms.parkScheduling.taskPanel') }}</span>
          </div>

          <div v-show="!sidebarCollapsed" class="park-sidebar-shell__body">
            <ParkSchedulingTaskSidebar
              ref="sidebarRef"
              v-model:task-type="pageDockBusinessType"
              :reload-nonce="taskReloadNonce"
              @status-changed="refreshAll"
              @open-order-detail="openDevanningOrderDetail"
            />
          </div>
        </aside>

        <div class="park-dock-panel min-h-0 min-w-0 flex flex-1 flex-col overflow-auto">
          <ParkSchedulingDockGrid
            :board="filteredBoard"
            :loading="boardLoading"
            :show-release-dock="showReleaseDockButton"
            @release-dock="releaseDockVisible = true"
            @dock-dbl-click="handleDockDblClick"
            @task-drop="(d, id, type, intent) => handleTaskDrop(d, id, type, intent)"
            @status-changed="refreshAll"
            @open-order-detail="openDevanningOrderDetail"
          />
        </div>
      </div>
    </NCard>

    <ParkSchedulingTaskCreateModal
      v-model:visible="createModalVisible"
      :preset-dock="createPresetDock"
      :board="filteredBoard"
      @submitted="refreshAll"
      @batch-result="onBatchResult"
    />

    <ParkSchedulingBatchResultModal v-model:visible="batchResultVisible" :result="lastBatchResult" />

    <ParkSchedulingReleaseDockModal
      v-model:visible="releaseDockVisible"
      :board="filteredBoard"
      :task-type="pageDockBusinessType"
      @released="refreshAll"
    />

    <ParkSchedulingDockQueueModal
      v-model:visible="queueModalVisible"
      :dock-id="selectedDockId"
      @status-changed="refreshAll"
      @open-order-detail="openDevanningOrderDetail"
    />

    <DevanningOrderDetailDrawer
      v-model:visible="devanningOrderDetailVisible"
      :order-id="devanningOrderDetailId"
    />

    <ParkSchedulingCabinetReportModal
      v-model:visible="cabinetReportVisible"
      :board="filteredBoard"
      :task-type="pageDockBusinessType"
    />
  </div>
</template>

<style scoped>
.park-scheduling-toolbar {
  background: linear-gradient(180deg, #f5faff 0%, #fff 100%);
  border: 1px solid #e6f0ff;
}

.park-scheduling-toolbar :deep(.n-card__content) {
  padding: 0 4px;
}

.park-scheduling-toolbar__collapse :deep(.n-collapse-item) {
  --n-title-font-size: 11px;
}

.park-scheduling-toolbar__collapse :deep(.n-collapse-item__header) {
  padding: 0;
  font-size: 11px;
  line-height: 1.25;
  min-height: 0;
}

.park-scheduling-toolbar__collapse :deep(.n-collapse-item__header-main) {
  line-height: 1.25;
}

.park-scheduling-toolbar__collapse :deep(.n-collapse-item-arrow) {
  margin-right: 2px;
  font-size: 14px;
}

.park-scheduling-toolbar__collapse :deep(.n-collapse-item__content-inner) {
  padding-top: 6px;
}

.park-scheduling-main :deep(.n-card__content) {
  display: flex;
  flex: 1;
  flex-direction: column;
  min-height: 0;
  padding: 8px;
}

.park-sidebar-shell {
  position: relative;
  display: flex;
  flex-direction: column;
  flex-shrink: 0;
  align-self: stretch;
  width: 400px;
  max-width: 40vw;
  min-height: 0;
  transition: width 0.22s ease, max-width 0.22s ease;
  border-right: 1px solid #d6eaff;
  background: #f5faff;
}

.park-sidebar-shell--collapsed {
  width: 40px;
  max-width: 40px;
}

.park-sidebar-shell__body {
  display: flex;
  flex: 1;
  flex-direction: column;
  min-width: 0;
  min-height: 0;
  overflow: hidden;
}

.park-sidebar-shell__toggle {
  position: absolute;
  right: -13px;
  left: auto;
  top: 50%;
  z-index: 2;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 26px;
  height: 52px;
  padding: 0;
  border: 1px solid #91caff;
  border-left: none;
  border-radius: 0 8px 8px 0;
  background: #e6f4ff;
  color: #1890ff;
  cursor: pointer;
  transform: translateY(-50%);
  transition: background 0.15s ease;
}

.park-sidebar-shell__toggle:hover {
  background: #bae0ff;
}

.park-sidebar-shell__rail {
  display: flex;
  flex: 1;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  user-select: none;
}

.park-sidebar-shell__rail-text {
  writing-mode: vertical-rl;
  font-size: 13px;
  font-weight: 600;
  letter-spacing: 2px;
  color: #1890ff;
}

@media (max-width: 960px) {
  .park-scheduling-layout {
    flex-direction: column;
    height: auto !important;
    min-height: auto;
  }

  .park-sidebar-shell {
    width: 100%;
    max-width: none;
    min-height: 360px;
    border-right: none;
    border-bottom: 1px solid #d6eaff;
  }

  .park-sidebar-shell--collapsed {
    width: 100%;
    max-width: none;
    min-height: 48px;
  }

  .park-sidebar-shell__toggle {
    top: 12px;
    right: 8px;
    left: auto;
    transform: none;
    border-left: 1px solid #91caff;
    border-radius: 8px;
  }

  .park-sidebar-shell__rail {
    padding-right: 40px;
  }

  .park-sidebar-shell__rail-text {
    writing-mode: horizontal-tb;
    letter-spacing: 0;
  }
}
</style>
