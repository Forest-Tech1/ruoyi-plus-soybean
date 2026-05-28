<script setup lang="ts">
import { computed, nextTick, onMounted, ref, watch } from 'vue';
import type { SortableEvent } from 'sortablejs';
import { VueDraggable } from 'vue-draggable-plus';
import ParkDockCardTaskLine from './park-dock-card-task-line.vue';
import { $t } from '@/locales';
import { useAuth } from '@/hooks/business/auth';
import { useDict } from '@/hooks/business/dict';
import { WMS_DICT_DEVANNING_ROUND } from '@/constants/wms-devanning';
import {
  fetchAssignParkSchedulingTask,
  fetchTransferParkQueuedTaskBetweenDocks
} from '@/service/api/wms/park-scheduling';
import {
  countLeadingDevanningRoundSlots,
  persistParkDockQueuedOrder,
  sortParkDockQueuedTasks
} from './park-dock-queue-reorder';

defineOptions({
  name: 'ParkSchedulingDockCard'
});

const props = defineProps<{
  dock: Api.Wms.ParkDockBoardCard;
}>();

const emit = defineEmits<{
  dockDblClick: [dock: Api.Wms.ParkDockBoardCard];
  drop: [
    dock: Api.Wms.ParkDockBoardCard,
    taskId: CommonType.IdType,
    taskType: Api.Wms.ParkTaskType | null,
    assignIntent: Api.Wms.ParkSchedulingTaskAssignParams['assignIntent']
  ];
  statusChanged: [];
  openOrderDetail: [task: Api.Wms.ParkSchedulingTask];
}>();

const { hasAuth } = useAuth();
const { data: devanningRoundDictList } = useDict(WMS_DICT_DEVANNING_ROUND, true);

const isPlaceholder = computed(() => Boolean(props.dock.placeholder));

const currentTaskRow = computed(() => props.dock.currentTask ?? null);

const sortedQueuedTasks = computed(() => sortParkDockQueuedTasks(props.dock.queuedTasks));

/** 未到仓：优先 `notArrivedTasks`；兼容旧接口混在 `queuedTasks` 内 */
const notArrivedTasks = computed(() => {
  const curId = props.dock.currentTask?.id;
  const raw =
    props.dock.notArrivedTasks && props.dock.notArrivedTasks.length > 0
      ? props.dock.notArrivedTasks
      : (props.dock.queuedTasks ?? []).filter(t => t.status === 'not_arrived');
  return raw.filter(t => curId == null || t.id !== curId);
});

const dockHasAnyVisibleTask = computed(() => {
  if (props.dock.currentTask) return true;
  if (notArrivedTasks.value.length > 0) return true;
  return sortedQueuedTasks.value.length > 0;
});

/** 可接收排队任务拖入（含空 Dock）；与侧栏 HTML5 拖放互补 */
const canAcceptDockQueueDrag = computed(
  () => !isPlaceholder.value && hasAuth('wms:parkScheduling:edit') && props.dock.id != null
);

const localQueued = ref<Api.Wms.ParkSchedulingTask[]>([]);
const reordering = ref(false);
const dragStartSig = ref('');
const queuedDraggableRootRef = ref<InstanceType<typeof VueDraggable> | null>(null);

const QUEUED_DRAG_GROUP = { name: 'parkDockQueuedBoard', pull: true, put: true };

function syncQueuedSortableDockDataset() {
  nextTick(() => {
    const inst = queuedDraggableRootRef.value as unknown as { $el?: HTMLElement } | null;
    const el = inst?.$el;
    if (el instanceof HTMLElement && props.dock.id != null && !isPlaceholder.value) {
      el.setAttribute('data-dock-id', String(props.dock.id));
    }
  });
}

onMounted(syncQueuedSortableDockDataset);
watch(
  () => [props.dock.id, canAcceptDockQueueDrag.value, sortedQueuedTasks.value.length] as const,
  () => {
    syncQueuedSortableDockDataset();
  },
  { flush: 'post' }
);

function syncLocalQueuedFromDock() {
  localQueued.value = sortedQueuedTasks.value.map(t => ({ ...t }));
}

watch(
  () =>
    `${props.dock.id ?? ''}|${props.dock.currentTask?.id ?? ''}|${notArrivedTasks.value
      .map(t => `${t.id}:${t.status}`)
      .join(';')}|${sortedQueuedTasks.value
      .map(t => `${t.id}:${t.queuePosition ?? ''}:${t.status}:${t.devanningRound ?? ''}`)
      .join(';')}`,
  () => {
    if (reordering.value) return;
    syncLocalQueuedFromDock();
  },
  { immediate: true }
);

const cardClass = computed(() => {
  if (isPlaceholder.value) return 'park-dock-card park-dock-card--placeholder';

  const status = props.dock.cardStatus;
  if (status === 'empty' || status === 'completed') return 'park-dock-card park-dock-card--empty';

  const taskType = props.dock.currentTask?.taskType ?? props.dock.businessType;
  if (taskType === 'loading') return 'park-dock-card park-dock-card--loading';
  return 'park-dock-card park-dock-card--devanning';
});

function onDragOver(e: DragEvent) {
  if (isPlaceholder.value) return;
  e.preventDefault();
  if (e.dataTransfer) e.dataTransfer.dropEffect = 'move';
}

function onDrop(e: DragEvent) {
  if (isPlaceholder.value) return;
  e.preventDefault();
  const taskId = e.dataTransfer?.getData('application/x-park-task-id');
  if (!taskId) return;
  const taskTypeRaw = e.dataTransfer?.getData('application/x-park-task-type');
  const taskType =
    taskTypeRaw === 'devanning' || taskTypeRaw === 'loading' ? taskTypeRaw : null;
  const intentRaw = e.dataTransfer?.getData('application/x-park-assign-intent');
  const assignIntent =
    intentRaw === 'not_arrived' || intentRaw === 'queued' ? intentRaw : 'queued';
  emit('drop', props.dock, taskId, taskType, assignIntent);
}

/** 看板 Dock「未到仓」区拖出改派（与侧栏 `assignIntent=not_arrived` 一致） */
function onNotArrivedDragStart(e: DragEvent, task: Api.Wms.ParkSchedulingTask) {
  if (!canAcceptDockQueueDrag.value) return;
  e.dataTransfer?.setData('application/x-park-task-id', String(task.id));
  e.dataTransfer?.setData(
    'application/x-park-task-type',
    task.taskType === 'loading' ? 'loading' : 'devanning'
  );
  e.dataTransfer?.setData('application/x-park-assign-intent', 'not_arrived');
  if (e.dataTransfer) e.dataTransfer.effectAllowed = 'move';
}

function onDockDblClick() {
  if (isPlaceholder.value) return;
  emit('dockDblClick', props.dock);
}

function onQueuedDragStart() {
  dragStartSig.value = localQueued.value.map(t => String(t.id)).join(',');
}

function confirmQueuedCrossDockTransfer(payload: { coNo: string; toDockName: string }): Promise<boolean> {
  return new Promise(resolve => {
    const d = window.$dialog;
    if (!d) {
      resolve(false);
      return;
    }
    let settled = false;
    const finish = (v: boolean) => {
      if (settled) return;
      settled = true;
      resolve(v);
    };
    d.warning({
      title: $t('common.warning'),
      content: $t('page.wms.parkScheduling.queueCrossDockConfirm', payload),
      positiveText: $t('common.confirm'),
      negativeText: $t('common.cancel'),
      onPositiveClick: () => {
        finish(true);
      },
      onNegativeClick: () => {
        finish(false);
      },
      onClose: () => {
        finish(false);
      }
    });
  });
}

async function onQueuedCrossAdd(evt: SortableEvent) {
  if (!(evt.from instanceof HTMLElement) || !(evt.to instanceof HTMLElement)) return;
  if (evt.from === evt.to) return;
  const fromDockId = evt.from.dataset?.dockId;
  if (!fromDockId || props.dock.id == null || String(fromDockId) === String(props.dock.id)) return;

  const taskIdRaw = (evt.item as HTMLElement).dataset?.taskId;
  if (!taskIdRaw) return;

  await nextTick();

  const idx = localQueued.value.findIndex(t => String(t.id) === taskIdRaw);
  const insertBeforeTaskId =
    idx >= 0 && idx + 1 < localQueued.value.length ? localQueued.value[idx + 1]!.id : null;
  const movedTask = localQueued.value[idx];
  const coNo = (movedTask?.coNo ?? '').trim() || String(taskIdRaw);

  reordering.value = true;
  try {
    const confirmed = await confirmQueuedCrossDockTransfer({
      coNo,
      toDockName: (props.dock.slotName ?? '').trim() || String(props.dock.id)
    });
    if (!confirmed) {
      syncLocalQueuedFromDock();
      emit('statusChanged');
      return;
    }

    const assignIntent =
      movedTask?.status === 'not_arrived' ? ('not_arrived' as const) : undefined;
    const { error } = assignIntent
      ? await fetchAssignParkSchedulingTask({
          taskId: taskIdRaw as CommonType.IdType,
          dockId: props.dock.id,
          assignIntent
        })
      : await fetchTransferParkQueuedTaskBetweenDocks({
          taskId: taskIdRaw as CommonType.IdType,
          fromDockId: fromDockId as CommonType.IdType,
          toDockId: props.dock.id,
          insertBeforeTaskId
        });
    if (error) {
      syncLocalQueuedFromDock();
      emit('statusChanged');
      return;
    }
    window.$message?.success($t('page.wms.parkScheduling.queueCrossDockTransferSuccess'));
    emit('statusChanged');
  } finally {
    reordering.value = false;
  }
}

async function onQueuedDragEnd(evt?: SortableEvent) {
  if (props.dock.id == null || reordering.value) return;
  if (evt && evt.from !== evt.to) return;

  const endSig = localQueued.value.map(t => String(t.id)).join(',');
  if (endSig === dragStartSig.value) return;

  reordering.value = true;
  try {
    const ok = await persistParkDockQueuedOrder(
      props.dock.id,
      localQueued.value,
      devanningRoundDictList.value,
      { leadingDevanningSlots: countLeadingDevanningRoundSlots(props.dock.currentTask) }
    );
    if (!ok) {
      syncLocalQueuedFromDock();
      return;
    }
    window.$message?.success($t('page.wms.parkScheduling.queueReorderSuccess'));
    emit('statusChanged');
  } finally {
    reordering.value = false;
  }
}
</script>

<template>
  <div
    :class="cardClass"
    :draggable="false"
    @dragover="onDragOver"
    @drop="onDrop"
    @dblclick="onDockDblClick"
  >
    <template v-if="isPlaceholder">
      <span class="park-dock-card__placeholder-num">{{ dock.slotName }}</span>
    </template>
    <template v-else>
      <div class="park-dock-card__head">{{ dock.slotName }}</div>
      <div class="park-dock-card__tasks">
        <template v-if="canAcceptDockQueueDrag">
          <div
            v-if="currentTaskRow"
            :key="`cur-${String(currentTaskRow.id)}`"
            class="park-dock-card__task park-dock-card__task--current"
          >
            <ParkDockCardTaskLine
              :task="currentTaskRow"
              @status-changed="emit('statusChanged')"
              @open-order-detail="t => emit('openOrderDetail', t)"
            />
          </div>
          <VueDraggable
            ref="queuedDraggableRootRef"
            v-model="localQueued"
            tag="div"
            class="park-dock-card__queued-drag"
            :class="{ 'park-dock-card__queued-drag--empty': localQueued.length === 0 && !currentTaskRow }"
            direction="vertical"
            :animation="160"
            :disabled="reordering"
            :force-fallback="true"
            :fallback-on-body="true"
            :fallback-tolerance="4"
            :empty-insert-threshold="56"
            :group="QUEUED_DRAG_GROUP"
            filter=".park-task-status-dock-trigger"
            @start="onQueuedDragStart"
            @add="onQueuedCrossAdd"
            @end="onQueuedDragEnd"
          >
            <div
              v-for="t in localQueued"
              :key="String(t.id)"
              class="park-dock-card__task park-dock-card__task--queued"
              :data-task-id="String(t.id)"
            >
              <ParkDockCardTaskLine
                :task="t"
                show-drag
                @status-changed="emit('statusChanged')"
                @open-order-detail="task => emit('openOrderDetail', task)"
              />
            </div>
          </VueDraggable>
          <div
            v-if="!dockHasAnyVisibleTask"
            class="park-dock-card__empty-drop-hint"
          >
            {{ $t('page.wms.parkScheduling.slotEmpty') }}
          </div>
          <div v-if="notArrivedTasks.length" class="park-dock-card__not-arrived-block">
            <div class="park-dock-card__section-title">{{ $t('page.wms.parkScheduling.statusNotArrived') }}</div>
            <div
              v-for="t in notArrivedTasks"
              :key="`na-${String(t.id)}`"
              class="park-dock-card__task park-dock-card__task--not-arrived"
              :draggable="canAcceptDockQueueDrag"
              @dragstart="(e: DragEvent) => onNotArrivedDragStart(e, t)"
            >
              <ParkDockCardTaskLine
                :task="t"
                :show-drag="canAcceptDockQueueDrag"
                @status-changed="emit('statusChanged')"
                @open-order-detail="task => emit('openOrderDetail', task)"
              />
            </div>
          </div>
        </template>
        <template v-else-if="dockHasAnyVisibleTask">
          <div
            v-if="currentTaskRow"
            :key="`cur-ro-${String(currentTaskRow.id)}`"
            class="park-dock-card__task park-dock-card__task--current"
          >
            <ParkDockCardTaskLine
              :task="currentTaskRow"
              @status-changed="emit('statusChanged')"
              @open-order-detail="t => emit('openOrderDetail', t)"
            />
          </div>
          <div
            v-for="t in sortedQueuedTasks"
            :key="`qro-${String(t.id)}`"
            class="park-dock-card__task"
            :class="{ 'park-dock-card__task--current': currentTaskRow?.id === t.id }"
          >
            <ParkDockCardTaskLine
              :task="t"
              @status-changed="emit('statusChanged')"
              @open-order-detail="task => emit('openOrderDetail', task)"
            />
          </div>
          <div v-if="notArrivedTasks.length" class="park-dock-card__not-arrived-block">
            <div class="park-dock-card__section-title">{{ $t('page.wms.parkScheduling.statusNotArrived') }}</div>
            <div
              v-for="t in notArrivedTasks"
              :key="`nar-${String(t.id)}`"
              class="park-dock-card__task park-dock-card__task--not-arrived"
              :draggable="canAcceptDockQueueDrag"
              @dragstart="(e: DragEvent) => onNotArrivedDragStart(e, t)"
            >
              <ParkDockCardTaskLine
                :task="t"
                :show-drag="canAcceptDockQueueDrag"
                @status-changed="emit('statusChanged')"
                @open-order-detail="task => emit('openOrderDetail', task)"
              />
            </div>
          </div>
        </template>
        <div v-else class="park-dock-card__empty-co">{{ $t('page.wms.parkScheduling.slotEmpty') }}</div>
      </div>
    </template>
  </div>
</template>

<style scoped>
.park-dock-card {
  position: relative;
  min-height: 88px;
  border: 1px solid;
  border-radius: 8px;
  padding: 6px 4px 4px;
  text-align: left;
  cursor: default;
  transition: box-shadow 0.15s ease;
  user-select: none;
}

.park-dock-card:hover:not(.park-dock-card--placeholder) {
  box-shadow: 0 2px 6px rgb(0 0 0 / 8%);
}

/* 空位 — 淡蓝 */
.park-dock-card--empty {
  background: #e6f4ff;
  border-color: #91caff;
  color: #1890ff;
}

/* 装车 — 淡橙 */
.park-dock-card--loading {
  background: #fff7e6;
  border-color: #ffd591;
  color: #d48806;
}

/* 拆柜/卸货 — 淡粉 */
.park-dock-card--devanning {
  background: #fff1f0;
  border-color: #ffa39e;
  color: #cf1322;
}

/* 占位格 — 虚线灰 */
.park-dock-card--placeholder {
  background: #fafafa;
  border-style: dashed;
  border-color: #d9d9d9;
  color: #8c8c8c;
  cursor: default;
  min-height: 88px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.park-dock-card__head {
  font-size: 14px;
  font-weight: 600;
  line-height: 1.2;
  text-align: center;
  color: #000;
}

.park-dock-card__empty-co {
  margin-top: 6px;
  font-size: 12px;
  text-align: center;
}

.park-dock-card__tasks {
  margin: 6px 0 0;
  padding: 0 4px;
}

.park-dock-card__not-arrived-block {
  margin-top: 6px;
  padding: 4px 4px 2px;
  border-radius: 6px;
  background: rgb(255 247 230 / 0.75);
  border: 1px dashed #ffd591;
}

.park-dock-card__section-title {
  margin-bottom: 4px;
  padding-left: 2px;
  font-size: 10px;
  font-weight: 600;
  line-height: 1.2;
  text-align: left;
  color: #ad6800;
}

.park-dock-card__queued-drag {
  display: flex;
  flex-direction: column;
  gap: 0;
}

.park-dock-card__queued-drag--empty {
  min-height: 44px;
}

.park-dock-card__empty-drop-hint {
  margin-top: 4px;
  font-size: 11px;
  line-height: 1.3;
  text-align: center;
  color: #8c8c8c;
  pointer-events: none;
}

.park-dock-card__task {
  margin-top: 4px;
  padding-top: 4px;
  border-top: 1px solid rgb(0 0 0 / 8%);
}

.park-dock-card__task:first-child {
  margin-top: 2px;
  padding-top: 0;
  border-top: none;
}

.park-dock-card__queued-drag .park-dock-card__task:first-child {
  margin-top: 4px;
  padding-top: 4px;
  border-top: 1px solid rgb(0 0 0 / 8%);
}

.park-dock-card :deep(.park-dock-card__task-line) {
  display: flex;
  align-items: center;
  gap: 4px;
  width: 100%;
  min-width: 0;
}

.park-dock-card__task--queued :deep(.park-dock-card__task-line) {
  cursor: grab;
}

.park-dock-card__task--queued:active :deep(.park-dock-card__task-line) {
  cursor: grabbing;
}

.park-dock-card__task--not-arrived[draggable='true'] :deep(.park-dock-card__task-line) {
  cursor: grab;
}

.park-dock-card__task--not-arrived[draggable='true']:active :deep(.park-dock-card__task-line) {
  cursor: grabbing;
}

.park-dock-card :deep(.park-dock-card__drag-hint) {
  flex: 0 0 14px;
  width: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
  pointer-events: none;
  opacity: 0.85;
}

.park-dock-card :deep(.park-dock-card__co) {
  flex: 1 1 0;
  min-width: 0;
  font-size: 11px;
  font-weight: 600;
  line-height: 1.3;
  text-align: left;
  color: #000;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.park-dock-card :deep(.park-dock-card__co--link) {
  cursor: pointer;
}

.park-dock-card :deep(.park-dock-card__co--link:hover) {
  color: #1677ff;
}

.park-dock-card :deep(.park-dock-card__level) {
  flex: 0 0 auto;
  padding: 0 2px;
  font-size: 11px;
  font-weight: 700;
  line-height: 1.3;
  color: #389e0d;
}

.park-dock-card :deep(.park-dock-card__status) {
  flex: 0 0 auto;
  display: flex;
  justify-content: flex-end;
  align-items: center;
  max-width: 48%;
}

.park-dock-card :deep(.park-dock-card__status .park-task-status-dock-trigger),
.park-dock-card :deep(.park-dock-card__status .park-task-status-dock-completed) {
  margin-left: 0;
}

.park-dock-card__placeholder-num {
  font-size: 18px;
  font-weight: 600;
  color: #000;
}
</style>
