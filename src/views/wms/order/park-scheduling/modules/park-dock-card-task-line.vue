<script setup lang="ts">
import { computed } from 'vue';
import ParkTaskStatusSelect from './park-task-status-select.vue';
import SvgIcon from '@/components/custom/svg-icon.vue';
import { readParkTaskOrderLevel } from '@/constants/wms-park';
import { $t } from '@/locales';

defineOptions({
  name: 'ParkDockCardTaskLine'
});

const props = defineProps<{
  task: Api.Wms.ParkSchedulingTask;
  showDrag?: boolean;
}>();

const orderLevelLabel = computed(() => {
  const n = readParkTaskOrderLevel(props.task);
  return n != null ? String(n) : '';
});

const emit = defineEmits<{
  statusChanged: [];
  openOrderDetail: [task: Api.Wms.ParkSchedulingTask];
}>();

function onCoDblClick(e: MouseEvent) {
  e.stopPropagation();
  emit('openOrderDetail', props.task);
}
</script>

<template>
  <div class="park-dock-card__task-line">
    <span v-if="showDrag" class="park-dock-card__drag-hint" aria-hidden="true">
      <SvgIcon icon="material-symbols:drag-indicator-rounded" class="text-14px text-[#1677ff]" />
    </span>
    <span
      class="park-dock-card__co park-dock-card__co--link"
      :title="$t('page.wms.parkScheduling.coNoOpenDetailHint')"
      @dblclick="onCoDblClick"
    >{{ task.coNo }}</span>
    <span v-if="orderLevelLabel" class="park-dock-card__level">{{ orderLevelLabel }}</span>
    <span class="park-dock-card__status">
      <ParkTaskStatusSelect
        display-mode="dockCard"
        :task-id="task.id"
        :status="task.status"
        @changed="emit('statusChanged')"
      />
    </span>
  </div>
</template>
