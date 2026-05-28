<script setup lang="tsx">
import { computed, ref, watch } from 'vue';
import { VueDraggable } from 'vue-draggable-plus';
import {
  fetchGetParkDockQueueDetail
} from '@/service/api/wms/park-scheduling';
import { useAuth } from '@/hooks/business/auth';
import { WMS_DICT_DEVANNING_ROUND } from '@/constants/wms-devanning';
import { useDict } from '@/hooks/business/dict';
import { $t } from '@/locales';
import DictTag from '@/components/custom/dict-tag.vue';
import SvgIcon from '@/components/custom/svg-icon.vue';
import ParkTaskStatusSelect from './park-task-status-select.vue';
import { countLeadingDevanningRoundSlots, persistParkDockQueuedOrder, sortParkDockQueuedTasks } from './park-dock-queue-reorder';

defineOptions({
  name: 'ParkSchedulingDockQueueModal'
});

const visible = defineModel<boolean>('visible', { default: false });

const props = defineProps<{
  dockId: CommonType.IdType | null;
}>();

const emit = defineEmits<{
  statusChanged: [];
  openOrderDetail: [task: Api.Wms.ParkSchedulingTask];
}>();

function renderCoNoCell(row: Api.Wms.ParkSchedulingTask) {
  return (
    <span
      class="cursor-pointer font-600"
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

const { hasAuth } = useAuth();
const { data: devanningRoundDictList } = useDict(WMS_DICT_DEVANNING_ROUND, true);

const loading = ref(false);
/** 拖拽松手后正在提交排序，避免连拖重复请求 */
const reordering = ref(false);
const detail = ref<Api.Wms.ParkDockQueueDetail | null>(null);
/** 可编辑排序时的排队副本（与 `detail.queuedTasks` 同步后由拖拽修改） */
const orderedQueue = ref<Api.Wms.ParkSchedulingTask[]>([]);
/** 最近一次服务端排队 id 顺序，用于判断松手后顺序是否变化 */
const initialQueueIdsSig = ref('');

const canReorder = computed(() => hasAuth('wms:parkScheduling:edit'));

const queueColumnsReadonly = [
  {
    title: () => $t('page.wms.parkScheduling.workSortOrder'),
    key: 'queuePosition',
    width: 88,
    render: (row: Api.Wms.ParkSchedulingTask) =>
      row.queuePosition != null && row.queuePosition > 0 ? row.queuePosition : '—'
  },
  { title: () => $t('page.wms.parkScheduling.taskNo'), key: 'taskNo', minWidth: 100 },
  {
    title: () => $t('page.wms.parkScheduling.coNo'),
    key: 'coNo',
    minWidth: 100,
    render: (row: Api.Wms.ParkSchedulingTask) => renderCoNoCell(row)
  },
  {
    title: () => $t('page.wms.parkScheduling.devanningRound'),
    key: 'devanningRound',
    width: 90,
    render: (row: Api.Wms.ParkSchedulingTask) =>
      row.devanningRound ? <DictTag dictCode={WMS_DICT_DEVANNING_ROUND} value={row.devanningRound} /> : '—'
  },
  {
    title: () => $t('page.wms.parkScheduling.status'),
    key: 'status',
    width: 110,
    render: (row: Api.Wms.ParkSchedulingTask) => (
      <ParkTaskStatusSelect taskId={row.id} status={row.status} onChanged={() => handleStatusChanged()} />
    )
  }
];

const notArrivedFromDetail = computed(() => {
  const d = detail.value;
  if (!d) return [];
  const curId = d.currentTask?.id;
  const raw =
    d.notArrivedTasks && d.notArrivedTasks.length > 0
      ? d.notArrivedTasks
      : (d.queuedTasks ?? []).filter(t => t.status === 'not_arrived');
  return raw.filter(t => curId == null || t.id !== curId);
});

function syncQueueFromDetail() {
  const q = sortParkDockQueuedTasks(detail.value?.queuedTasks);
  orderedQueue.value = q.map(t => ({ ...t }));
  initialQueueIdsSig.value = q.map(t => String(t.id)).join(',');
}

async function loadDetail() {
  if (props.dockId == null) return;
  loading.value = true;
  try {
    const { data, error } = await fetchGetParkDockQueueDetail(props.dockId);
    if (error) return;
    detail.value = data ?? null;
    syncQueueFromDetail();
  } finally {
    loading.value = false;
  }
}

function handleStatusChanged() {
  void loadDetail();
  emit('statusChanged');
}

async function persistQueueOrderAfterDrag() {
  if (props.dockId == null || reordering.value) return;
  const sig = orderedQueue.value.map(t => String(t.id)).join(',');
  if (sig === initialQueueIdsSig.value) return;

  reordering.value = true;
  try {
    const ok = await persistParkDockQueuedOrder(
      props.dockId,
      orderedQueue.value,
      devanningRoundDictList.value,
      { leadingDevanningSlots: countLeadingDevanningRoundSlots(detail.value?.currentTask) }
    );
    if (!ok) {
      await loadDetail();
      return;
    }
    window.$message?.success($t('page.wms.parkScheduling.queueReorderSuccess'));
    await loadDetail();
    emit('statusChanged');
  } finally {
    reordering.value = false;
  }
}

watch(
  () => [visible.value, props.dockId] as const,
  ([v]) => {
    if (v) void loadDetail();
    else {
      detail.value = null;
      orderedQueue.value = [];
      initialQueueIdsSig.value = '';
    }
  }
);

function taskTypeLabel(type?: Api.Wms.ParkTaskType) {
  if (type === 'loading') return $t('page.wms.parkScheduling.taskTypeLoading');
  if (type === 'devanning') return $t('page.wms.parkScheduling.taskTypeDevanning');
  return '—';
}
</script>

<template>
  <NModal
    v-model:show="visible"
    preset="card"
    :title="$t('page.wms.parkScheduling.dockQueueTitle', { name: detail?.dockName ?? '—' })"
    class="w-680px max-w-[94vw]"
    :bordered="false"
  >
    <NSpin :show="loading || reordering">
      <div class="flex flex-col gap-16px">
        <div>
          <div class="mb-8px text-14px font-600">{{ $t('page.wms.parkScheduling.currentTask') }}</div>
          <NDescriptions v-if="detail?.currentTask" bordered :column="1" size="small">
            <NDescriptionsItem :label="$t('page.wms.parkScheduling.workSortOrder')">
              {{ $t('page.wms.parkScheduling.workSortCurrent') }}
            </NDescriptionsItem>
            <NDescriptionsItem :label="$t('page.wms.parkScheduling.taskNo')">
              {{ detail.currentTask.taskNo }}
            </NDescriptionsItem>
            <NDescriptionsItem :label="$t('page.wms.parkScheduling.coNo')">
              <span
                class="cursor-pointer"
                :title="$t('page.wms.parkScheduling.coNoOpenDetailHint')"
                @dblclick="emit('openOrderDetail', detail.currentTask)"
              >{{ detail.currentTask.coNo }}</span>
            </NDescriptionsItem>
            <NDescriptionsItem :label="$t('page.wms.parkScheduling.taskType')">
              {{ taskTypeLabel(detail.currentTask.taskType) }}
            </NDescriptionsItem>
            <NDescriptionsItem :label="$t('page.wms.parkScheduling.status')">
              <ParkTaskStatusSelect
                :task-id="detail.currentTask.id"
                :status="detail.currentTask.status"
                @changed="handleStatusChanged"
              />
            </NDescriptionsItem>
          </NDescriptions>
          <NEmpty v-else size="small" :description="$t('page.wms.parkScheduling.noCurrentTask')" />
        </div>

        <div>
          <div class="mb-8px text-14px font-600">{{ $t('page.wms.parkScheduling.queuedTasks') }}</div>
          <p v-if="canReorder && orderedQueue.length > 0" class="mb-8px text-12px text-gray-500 leading-snug">
            {{ $t('page.wms.parkScheduling.dockQueueDragHint') }}
          </p>

          <template v-if="orderedQueue.length">
            <VueDraggable
              v-if="canReorder"
              v-model="orderedQueue"
              tag="div"
              direction="vertical"
              :animation="180"
              :disabled="reordering"
              :force-fallback="true"
              :fallback-on-body="true"
              :fallback-tolerance="4"
              filter=".park-queue-row__status"
              class="park-queue-drag-list flex flex-col gap-6px"
              @end="persistQueueOrderAfterDrag"
            >
              <div
                v-for="(row, idx) in orderedQueue"
                :key="String(row.id)"
                class="park-queue-drag-row flex cursor-grab items-center gap-10px rounded-6px px-10px py-8px active:cursor-grabbing"
              >
                <span
                  class="park-queue-drag-hint flex shrink-0 text-[#1677ff] select-none"
                  aria-hidden="true"
                  :title="$t('page.wms.parkScheduling.dragToReorder')"
                >
                  <SvgIcon icon="material-symbols:drag-indicator-rounded" class="text-22px" />
                </span>
                <span
                  class="w-36px shrink-0 text-center text-13px font-600 text-[#1677ff]"
                  :title="$t('page.wms.parkScheduling.workSortOrder')"
                >
                  {{ idx + 1 }}
                </span>
                <div class="min-w-0 flex flex-1 flex-wrap items-center gap-x-12px gap-y-4px text-13px">
                  <span class="text-gray-500">{{ $t('page.wms.parkScheduling.taskNo') }}:</span>
                  <span class="font-mono">{{ row.taskNo }}</span>
                  <span class="text-gray-500">{{ $t('page.wms.parkScheduling.coNo') }}:</span>
                  <span
                    class="font-600 cursor-pointer"
                    :title="$t('page.wms.parkScheduling.coNoOpenDetailHint')"
                    @dblclick="emit('openOrderDetail', row)"
                  >{{ row.coNo }}</span>
                  <span class="text-gray-500">{{ $t('page.wms.parkScheduling.devanningRound') }}:</span>
                  <DictTag
                    v-if="row.devanningRound"
                    :dict-code="WMS_DICT_DEVANNING_ROUND"
                    :value="row.devanningRound"
                  />
                  <span v-else class="text-gray-400">—</span>
                </div>
                <div class="park-queue-row__status shrink-0">
                  <ParkTaskStatusSelect
                    :task-id="row.id"
                    :status="row.status"
                    @changed="handleStatusChanged"
                  />
                </div>
              </div>
            </VueDraggable>
            <NDataTable
              v-else
              size="small"
              :columns="queueColumnsReadonly"
              :data="orderedQueue"
              :pagination="false"
            />
          </template>
          <NEmpty v-else size="small" :description="$t('page.wms.parkScheduling.noQueuedTasks')" />
        </div>

        <div>
          <div class="mb-8px text-14px font-600">{{ $t('page.wms.parkScheduling.notArrivedTasks') }}</div>
          <NDataTable
            v-if="notArrivedFromDetail.length"
            size="small"
            :columns="queueColumnsReadonly"
            :data="notArrivedFromDetail"
            :pagination="false"
          />
          <NEmpty v-else size="small" :description="$t('page.wms.parkScheduling.noNotArrivedTasks')" />
        </div>
      </div>
    </NSpin>
  </NModal>
</template>

<style scoped>
.park-queue-drag-list {
  max-height: min(52vh, 420px);
  overflow: auto;
}

.park-queue-drag-row {
  border: 1px solid #d9ecff;
  background: #fafcff;
}

.park-queue-drag-hint {
  pointer-events: none;
}
</style>
