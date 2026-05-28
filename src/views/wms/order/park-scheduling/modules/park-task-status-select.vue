<script setup lang="ts">
import { computed, ref } from 'vue';
import type { DropdownOption } from 'naive-ui';
import { fetchUpdateParkSchedulingTaskStatus } from '@/service/api/wms/park-scheduling';
import { toParkTaskManualStatus, type ParkTaskManualStatus } from '@/constants/wms-park';
import { useAuth } from '@/hooks/business/auth';
import { $t } from '@/locales';

defineOptions({
  name: 'ParkTaskStatusSelect'
});

const props = defineProps<{
  taskId: CommonType.IdType;
  status: Api.Wms.ParkTaskStatus | null | undefined;
  /** `dockCard`：看板 Dock 卡片内嵌，与侧栏/弹窗同一套状态选项（需 `wms:parkScheduling:edit`）。 */
  displayMode?: 'default' | 'dockCard';
}>();

const emit = defineEmits<{
  changed: [];
}>();

const { hasAuth } = useAuth();
const updating = ref(false);

const isDockCard = computed(() => props.displayMode === 'dockCard');

const selectSize = computed(() => (isDockCard.value ? 'tiny' : 'small'));

/** Dock 卡片：无编辑权限时仅展示文案 */
const dockCardReadonly = computed(() => isDockCard.value && !hasAuth('wms:parkScheduling:edit'));

const manualStatus = computed(() => toParkTaskManualStatus(props.status));

const isCompleted = computed(() => props.status === 'completed');

const options = computed(() => {
  if (isCompleted.value) {
    return [{ label: $t('page.wms.parkScheduling.statusPending'), value: 'pending' as ParkTaskManualStatus }];
  }
  if (props.status === 'queued') {
    return [
      { label: $t('page.wms.parkScheduling.statusQueued'), value: 'queued' as ParkTaskManualStatus },
      { label: $t('page.wms.parkScheduling.statusInProgress'), value: 'in_progress' as ParkTaskManualStatus },
      { label: $t('page.wms.parkScheduling.statusNotArrived'), value: 'not_arrived' as ParkTaskManualStatus },
      { label: $t('page.wms.parkScheduling.statusPending'), value: 'pending' as ParkTaskManualStatus },
      { label: $t('page.wms.parkScheduling.statusCompleted'), value: 'completed' as ParkTaskManualStatus }
    ];
  }
  if (props.status === 'not_arrived') {
    return [
      { label: $t('page.wms.parkScheduling.statusNotArrived'), value: 'not_arrived' as ParkTaskManualStatus },
      { label: $t('page.wms.parkScheduling.statusArrivedToQueue'), value: 'queued' as ParkTaskManualStatus },
      { label: $t('page.wms.parkScheduling.statusInProgress'), value: 'in_progress' as ParkTaskManualStatus },
      { label: $t('page.wms.parkScheduling.statusPending'), value: 'pending' as ParkTaskManualStatus },
      { label: $t('page.wms.parkScheduling.statusCompleted'), value: 'completed' as ParkTaskManualStatus }
    ];
  }
  if (props.status === 'in_progress') {
    return [
      { label: $t('page.wms.parkScheduling.statusInProgress'), value: 'in_progress' as ParkTaskManualStatus },
      { label: $t('page.wms.parkScheduling.statusQueued'), value: 'queued' as ParkTaskManualStatus },
      { label: $t('page.wms.parkScheduling.statusNotArrived'), value: 'not_arrived' as ParkTaskManualStatus },
      { label: $t('page.wms.parkScheduling.statusPending'), value: 'pending' as ParkTaskManualStatus },
      { label: $t('page.wms.parkScheduling.statusCompleted'), value: 'completed' as ParkTaskManualStatus }
    ];
  }
  return [
    { label: $t('page.wms.parkScheduling.statusPending'), value: 'pending' as ParkTaskManualStatus },
    { label: $t('page.wms.parkScheduling.statusNotArrived'), value: 'not_arrived' as ParkTaskManualStatus },
    { label: $t('page.wms.parkScheduling.statusInProgress'), value: 'in_progress' as ParkTaskManualStatus },
    { label: $t('page.wms.parkScheduling.statusCompleted'), value: 'completed' as ParkTaskManualStatus }
  ];
});

const dockDropdownOptions = computed<DropdownOption[]>(() =>
  options.value.map(o => ({
    label: String(o.label),
    key: o.value as string
  }))
);

/** 文案按真实 `status` 区分 queued / in_progress（不用 manual 折叠） */
const statusLabel = computed(() => {
  const s = props.status;
  if (s === 'completed') return $t('page.wms.parkScheduling.statusCompleted');
  if (s === 'in_progress') return $t('page.wms.parkScheduling.statusInProgress');
  if (s === 'queued') return $t('page.wms.parkScheduling.statusQueued');
  if (s === 'not_arrived') return $t('page.wms.parkScheduling.statusNotArrived');
  if (s === 'pending') return $t('page.wms.parkScheduling.statusPending');
  return '—';
});

const dockPillClass = computed(() => ({
  'park-task-status-pill park-task-status-pill--in-progress': props.status === 'in_progress',
  'park-task-status-pill park-task-status-pill--not-arrived': props.status === 'not_arrived',
  'park-task-status-pill park-task-status-pill--pending-like':
    props.status === 'queued' || props.status === 'pending',
  'park-task-status-dock-trigger--editable': !dockCardReadonly.value
}));

async function handleUpdate(value: ParkTaskManualStatus) {
  if (value === manualStatus.value || updating.value) return;
  updating.value = true;
  try {
    const { error } = await fetchUpdateParkSchedulingTaskStatus({
      taskId: props.taskId,
      status: value as Api.Wms.ParkTaskStatus
    });
    if (error) return;
    window.$message?.success($t('page.wms.parkScheduling.statusUpdateSuccess'));
    emit('changed');
  } finally {
    updating.value = false;
  }
}

function handleDockDropdownSelect(key: string) {
  void handleUpdate(key as ParkTaskManualStatus);
}
</script>

<template>
  <template v-if="isDockCard">
    <span
      v-if="dockCardReadonly"
      class="park-task-status-dock-trigger park-task-status-dock-readonly"
      :class="dockPillClass"
    >{{ statusLabel }}</span>
    <span
      v-else-if="isCompleted"
      class="park-task-status-dock-trigger park-task-status-dock-completed"
      @dblclick.stop
      @click.stop
    >
      <span class="park-task-status-dock-readonly" :class="dockPillClass">{{ statusLabel }}</span>
      <NButton text type="primary" size="tiny" :loading="updating" @click="handleUpdate('pending')">
        {{ $t('page.wms.parkScheduling.revertCompletedToPending') }}
      </NButton>
    </span>
    <NDropdown
      v-else
      trigger="click"
      placement="bottom"
      :options="dockDropdownOptions"
      @select="handleDockDropdownSelect"
    >
      <span
        class="park-task-status-dock-trigger park-task-status-dock-readonly"
        :class="dockPillClass"
        :title="statusLabel"
        @dblclick.stop
        @click.stop
      >{{ statusLabel }}</span>
    </NDropdown>
  </template>
  <template v-else-if="hasAuth('wms:parkScheduling:edit')">
    <div v-if="isCompleted" class="flex flex-wrap items-center gap-4px">
      <span class="text-12px">{{ statusLabel }}</span>
      <NButton text type="primary" size="tiny" :loading="updating" @click="handleUpdate('pending')">
        {{ $t('page.wms.parkScheduling.revertCompletedToPending') }}
      </NButton>
    </div>
    <NSelect
      v-else
      :value="manualStatus"
      :options="options"
      :size="selectSize"
      :loading="updating"
      :consistent-menu-width="false"
      :class="[
        'park-task-status-select',
        { 'park-task-status-select--in-progress': status === 'in_progress' }
      ]"
      @update:value="handleUpdate"
    />
  </template>
  <span
    v-else
    class="text-12px"
    :class="{
      'park-task-status-pill park-task-status-pill--in-progress': status === 'in_progress',
      'park-task-status-pill park-task-status-pill--not-arrived': status === 'not_arrived'
    }"
  >{{ statusLabel }}</span>
</template>

<style scoped>
.park-task-status-select {
  min-width: 88px;
}

.park-task-status-dock-trigger {
  display: inline-flex;
  vertical-align: middle;
  margin-left: 3px;
  max-width: 100%;
}

.park-task-status-dock-trigger--editable {
  cursor: pointer;
}

.park-task-status-dock-readonly {
  font-size: 10px;
  font-weight: 600;
  line-height: 1.25;
  opacity: 1;
}

.park-task-status-dock-completed {
  display: inline-flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 2px;
  margin-left: 3px;
  vertical-align: middle;
}

/* 真实状态为「作业中」时：状态块蓝底白字（非整张 Dock 卡片） */
.park-task-status-pill--in-progress {
  display: inline-block;
  padding: 0 4px;
  border-radius: 3px;
  background: #1677ff;
  color: #fff !important;
  font-weight: 600;
  line-height: 1.35;
  white-space: nowrap;
}

.park-task-status-pill--not-arrived {
  display: inline-block;
  padding: 0 4px;
  border-radius: 3px;
  background: #fff7e6;
  border: 1px solid #ffd591;
  color: #ad6800 !important;
  font-weight: 600;
  line-height: 1.35;
  white-space: nowrap;
}

.park-task-status-pill--pending-like {
  display: inline-block;
  padding: 0 4px;
  border-radius: 3px;
  background: #fafafa;
  border: 1px solid #d9d9d9;
  color: #595959 !important;
  font-weight: 600;
  line-height: 1.35;
  white-space: nowrap;
}

.park-task-status-select--in-progress :deep(.n-base-selection) {
  --n-text-color: #fff !important;
  --n-placeholder-color: rgb(255 255 255 / 55%) !important;
  --n-border: 1px solid #4096ff !important;
  --n-border-hover: 1px solid #69b1ff !important;
  --n-border-focus: 1px solid #bae0ff !important;
  --n-box-shadow-focus: 0 0 0 2px rgb(64 150 255 / 35%) !important;
  --n-color: #1677ff !important;
  --n-color-active: #1677ff !important;
}

.park-task-status-select--in-progress :deep(.n-base-selection-label),
.park-task-status-select--in-progress :deep(.n-base-selection-input) {
  color: #fff !important;
}
</style>
