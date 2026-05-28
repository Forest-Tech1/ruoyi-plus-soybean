<script setup lang="ts">
import SvgIcon from '@/components/custom/svg-icon.vue';
import { $t } from '@/locales';

defineOptions({
  name: 'ParkSchedulingStatsStrip'
});

defineProps<{
  loading?: boolean;
  total: number;
  pending: number;
  completed: number;
  dockInProgress: number;
}>();
</script>

<template>
  <div class="park-stats-strip">
    <NSpin :show="loading" size="small" class="park-stats-strip__spin">
      <div class="park-stats-strip__inner">
        <div class="park-stats-strip__item">
          <div class="park-stats-strip__icon park-stats-strip__icon--blue">
            <SvgIcon icon="material-symbols:folder-rounded" class="text-22px" />
          </div>
          <div class="park-stats-strip__text">
            <span class="park-stats-strip__value">{{ total }}</span>
            <span class="park-stats-strip__label">{{ $t('page.wms.parkScheduling.statsTotalTasks') }}</span>
          </div>
        </div>
        <div class="park-stats-strip__item">
          <div class="park-stats-strip__icon park-stats-strip__icon--orange">
            <SvgIcon icon="material-symbols:schedule-rounded" class="text-22px" />
          </div>
          <div class="park-stats-strip__text">
            <span class="park-stats-strip__value">{{ pending }}</span>
            <span class="park-stats-strip__label">{{ $t('page.wms.parkScheduling.statsPendingTasks') }}</span>
          </div>
        </div>
        <div class="park-stats-strip__item">
          <div class="park-stats-strip__icon park-stats-strip__icon--green">
            <SvgIcon icon="material-symbols:check-circle-rounded" class="text-22px" />
          </div>
          <div class="park-stats-strip__text">
            <span class="park-stats-strip__value">{{ completed }}</span>
            <span class="park-stats-strip__label">{{ $t('page.wms.parkScheduling.statsCompletedTasks') }}</span>
          </div>
        </div>
        <div class="park-stats-strip__item">
          <div class="park-stats-strip__icon park-stats-strip__icon--rose">
            <SvgIcon icon="material-symbols:precision-manufacturing-rounded" class="text-22px" />
          </div>
          <div class="park-stats-strip__text">
            <span class="park-stats-strip__value">{{ dockInProgress }}</span>
            <span class="park-stats-strip__label">{{ $t('page.wms.parkScheduling.statsDockInProgress') }}</span>
          </div>
        </div>
      </div>
    </NSpin>
  </div>
</template>

<style scoped>
.park-stats-strip {
  min-width: 0;
  flex: 1;
}

.park-stats-strip__spin :deep(.n-spin-content) {
  min-height: 0;
}

.park-stats-strip__inner {
  display: flex;
  flex-wrap: wrap;
  align-items: stretch;
  justify-content: space-around;
  gap: 12px 16px;
  padding: 10px 12px;
  border-radius: 10px;
  background: #fff;
  border: 1px solid #e8e8e8;
  box-shadow: 0 1px 4px rgb(0 0 0 / 6%);
}

.dark .park-stats-strip__inner {
  border-color: rgb(255 255 255 / 12%);
  background: rgb(255 255 255 / 4%);
  box-shadow: none;
}

.park-stats-strip__item {
  display: flex;
  min-width: 0;
  flex: 1 1 120px;
  max-width: 200px;
  align-items: center;
  gap: 10px;
}

.park-stats-strip__icon {
  display: flex;
  width: 40px;
  height: 40px;
  flex-shrink: 0;
  align-items: center;
  justify-content: center;
  border-radius: 8px;
}

.park-stats-strip__icon--blue {
  background: #e6f4ff;
  color: #1890ff;
}

.park-stats-strip__icon--orange {
  background: #fff7e6;
  color: #fa8c16;
}

.park-stats-strip__icon--green {
  background: #f6ffed;
  color: #52c41a;
}

.park-stats-strip__icon--rose {
  background: #fff1f0;
  color: #f5222d;
}

.park-stats-strip__text {
  display: flex;
  min-width: 0;
  flex-direction: column;
  gap: 2px;
}

.park-stats-strip__value {
  font-size: 20px;
  font-weight: 600;
  line-height: 1.2;
  color: rgb(0 0 0 / 88%);
}

.dark .park-stats-strip__value {
  color: rgb(255 255 255 / 88%);
}

.park-stats-strip__label {
  font-size: 12px;
  line-height: 1.2;
  color: rgb(0 0 0 / 45%);
}

.dark .park-stats-strip__label {
  color: rgb(255 255 255 / 45%);
}
</style>
