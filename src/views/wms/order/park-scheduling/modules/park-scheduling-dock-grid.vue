<script setup lang="ts">
import { computed } from 'vue';
import { useAuth } from '@/hooks/business/auth';
import {
  parkLocationAreaLabel,
  sortParkDockBoardCardsByLayout,
  sortParkLocationAreaDictValues,
  WMS_DICT_PARK_LOCATION_AREA
} from '@/constants/wms-park';
import { useDict } from '@/hooks/business/dict';
import { $t } from '@/locales';
import ParkSchedulingDockCard from './park-scheduling-dock-card.vue';

defineOptions({
  name: 'ParkSchedulingDockGrid'
});

const props = defineProps<{
  board: Api.Wms.ParkSchedulingBoard | null;
  loading?: boolean;
  /** 在位置类型标题栏右侧展示「释放道口」 */
  showReleaseDock?: boolean;
}>();

const emit = defineEmits<{
  releaseDock: [];
  dockDblClick: [dock: Api.Wms.ParkDockBoardCard];
  taskDrop: [
    dock: Api.Wms.ParkDockBoardCard,
    taskId: CommonType.IdType,
    taskType: Api.Wms.ParkTaskType | null,
    assignIntent: Api.Wms.ParkSchedulingTaskAssignParams['assignIntent']
  ];
  statusChanged: [];
  openOrderDetail: [task: Api.Wms.ParkSchedulingTask];
}>();

const { hasAuth } = useAuth();

const { data: locationAreaDict, record: locationAreaRecord } = useDict(WMS_DICT_PARK_LOCATION_AREA, true);

const showReleaseDockBtn = computed(
  () => props.showReleaseDock !== false && hasAuth('wms:parkScheduling:list')
);

const UNASSIGNED_AREA_KEY = '__unset__';

function collectAllDocks(board: Api.Wms.ParkSchedulingBoard | null): Api.Wms.ParkDockBoardCard[] {
  if (!board) return [];
  if (board.sections?.length) {
    return board.sections.flatMap(s => s.docks ?? []);
  }
  if (board.docks?.length) return board.docks;
  return [...(board.frontDocks ?? []), ...(board.backDocks ?? [])];
}

function renderRow(docks: Api.Wms.ParkDockBoardCard[]) {
  return [sortParkDockBoardCardsByLayout([...docks])];
}

function resolveAreaLabel(dictValue: string | null | undefined) {
  if (!dictValue || dictValue === UNASSIGNED_AREA_KEY) {
    return parkLocationAreaLabel(null, locationAreaRecord.value, $t('page.wms.parkScheduling.locationAreaUnset'));
  }
  return parkLocationAreaLabel(dictValue, locationAreaRecord.value, $t('page.wms.parkScheduling.locationAreaUnset'));
}

function sortAreaKeys(keys: string[]) {
  const known = keys.filter(k => k !== UNASSIGNED_AREA_KEY);
  const sortedKnown = sortParkLocationAreaDictValues(known, locationAreaDict.value);
  const hasUnset = keys.includes(UNASSIGNED_AREA_KEY);
  return hasUnset ? [...sortedKnown, UNASSIGNED_AREA_KEY] : sortedKnown;
}

/** 看板按字典「位置类型」分区；分区顺序 = sys_dict_data.dict_sort */
const locationAreaSections = computed(() => {
  const board = props.board;
  if (!board) return [];

  if (board.sections?.length) {
    const keys = board.sections.map(s => (s.locationArea ?? '').trim() || UNASSIGNED_AREA_KEY);
    const order = sortAreaKeys([...new Set(keys)]);
    const sectionMap = new Map(
      board.sections.map(s => [(s.locationArea ?? '').trim() || UNASSIGNED_AREA_KEY, s])
    );
    return order.map(key => {
      const section = sectionMap.get(key);
      return {
        areaKey: key,
        locationArea: resolveAreaLabel(key === UNASSIGNED_AREA_KEY ? null : key),
        rows: renderRow(section?.docks ?? [])
      };
    });
  }

  const grouped = new Map<string, Api.Wms.ParkDockBoardCard[]>();
  for (const dock of collectAllDocks(board)) {
    const key = (dock.locationArea ?? '').trim() || UNASSIGNED_AREA_KEY;
    if (!grouped.has(key)) grouped.set(key, []);
    grouped.get(key)!.push(dock);
  }

  return sortAreaKeys([...grouped.keys()]).map(key => ({
    areaKey: key,
    locationArea: resolveAreaLabel(key === UNASSIGNED_AREA_KEY ? null : key),
    rows: renderRow(grouped.get(key) ?? [])
  }));
});
</script>

<template>
  <NSpin :show="loading" class="h-full min-h-320px">
    <div v-if="board && locationAreaSections.length" class="park-dock-grid">
      <div v-for="section in locationAreaSections" :key="section.areaKey" class="park-dock-grid__block">
        <div
          class="park-dock-grid__divider"
          :class="{ 'park-dock-grid__divider--with-action': showReleaseDockBtn }"
        >
          <span class="park-dock-grid__divider-title">{{ section.locationArea }}</span>
          <NButton
            v-if="showReleaseDockBtn"
            class="park-dock-grid__release-btn"
            size="small"
            type="warning"
            secondary
            @click="emit('releaseDock')"
          >
            {{ $t('page.wms.parkScheduling.releaseDockButton') }}
          </NButton>
        </div>
        <div class="park-dock-grid__section">
          <div v-for="(row, ri) in section.rows" :key="`${section.areaKey}-${ri}`" class="park-dock-grid__row">
            <ParkSchedulingDockCard
              v-for="dock in row"
              :key="String(dock.id ?? dock.slotName)"
              :dock="dock"
              @dock-dbl-click="emit('dockDblClick', $event)"
              @drop="(d, id, type, intent) => emit('taskDrop', d, id, type, intent)"
              @status-changed="emit('statusChanged')"
              @open-order-detail="t => emit('openOrderDetail', t)"
            />
          </div>
        </div>
      </div>
    </div>
    <NEmpty v-else class="py-80px" :description="$t('page.wms.parkScheduling.boardEmpty')" />
  </NSpin>
</template>

<style scoped>
.park-dock-grid {
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding: 8px 4px 16px;
}

.park-dock-grid__block {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.park-dock-grid__section {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.park-dock-grid__row {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

/* 固定宽度：末行卡片数量少时也不被 flex-grow 拉宽 */
.park-dock-grid__row :deep(.park-dock-card) {
  flex: 0 0 184px;
  width: 184px;
  max-width: 184px;
}

.park-dock-grid__divider {
  padding: 10px 16px;
  background: #f0f0f0;
  border: 1px solid #e8e8e8;
  color: #595959;
  text-align: center;
  font-size: 14px;
  font-weight: 600;
  border-radius: 6px;
}

.park-dock-grid__divider--with-action {
  display: grid;
  grid-template-columns: 1fr auto 1fr;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  text-align: left;
}

.park-dock-grid__divider--with-action .park-dock-grid__divider-title {
  grid-column: 2;
  text-align: center;
}

.park-dock-grid__divider--with-action .park-dock-grid__release-btn {
  grid-column: 3;
  justify-self: end;
}
</style>
