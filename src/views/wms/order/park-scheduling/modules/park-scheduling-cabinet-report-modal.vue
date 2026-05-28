<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import dayjs from 'dayjs';
import { NButton, NDatePicker, NModal } from 'naive-ui';
import { useDict } from '@/hooks/business/dict';
import { WMS_DICT_DEVANNING_ROUND } from '@/constants/wms-devanning';
import { $t } from '@/locales';
import { buildParkCabinetReportSrcdoc } from './park-scheduling-cabinet-report';

defineOptions({
  name: 'ParkSchedulingCabinetReportModal'
});

const visible = defineModel<boolean>('visible', { default: false });

const props = defineProps<{
  board: Api.Wms.ParkSchedulingBoard | null;
  taskType: Api.Wms.ParkTaskType;
}>();

const { record: devanningRoundRecord } = useDict(WMS_DICT_DEVANNING_ROUND, true);

/** 报表日期（仅影响表头展示，数据仍来自当前看板） */
const reportDateMs = ref<number | null>(dayjs().startOf('day').valueOf());

const iframeRef = ref<HTMLIFrameElement | null>(null);

const reportDateText = computed(() =>
  reportDateMs.value != null ? dayjs(reportDateMs.value).format('YYYY-MM-DD') : dayjs().format('YYYY-MM-DD')
);

const taskTypeLine = computed(() =>
  props.taskType === 'loading'
    ? $t('page.wms.parkScheduling.taskTypeLoading')
    : $t('page.wms.parkScheduling.taskTypeDevanning')
);

const srcdoc = computed(() =>
  buildParkCabinetReportSrcdoc({
    board: props.board,
    taskType: props.taskType,
    reportDateText: reportDateText.value,
    reportTitle: $t('page.wms.parkScheduling.cabinetReportTitle'),
    warehouseLine: props.board?.warehouseName ?? null,
    taskTypeLine: taskTypeLine.value,
    tableLabels: {
      coNo: $t('page.wms.parkScheduling.coNo'),
      devanningRound: $t('page.wms.parkScheduling.devanningRound'),
      status: $t('page.wms.parkScheduling.status'),
      warehouseInWarehouse: $t('page.wms.parkScheduling.cabinetReportWarehouseIn'),
      warehouseNotArrived: $t('page.wms.parkScheduling.cabinetReportWarehouseNotArrived'),
      dock: $t('page.wms.parkScheduling.cabinetReportDockSection'),
      emptyRow: $t('page.wms.parkScheduling.cabinetReportEmptyDock')
    },
    devanningRoundLabels: devanningRoundRecord.value
  })
);

function handlePrint() {
  const w = iframeRef.value?.contentWindow;
  if (!w) {
    window.$message?.warning($t('page.wms.parkScheduling.cabinetReportPrintFailed'));
    return;
  }
  w.focus();
  w.print();
}

watch(visible, v => {
  if (v) reportDateMs.value = dayjs().startOf('day').valueOf();
});
</script>

<template>
  <NModal
    v-model:show="visible"
    preset="card"
    :title="$t('page.wms.parkScheduling.cabinetReportModalTitle')"
    class="w-900px max-w-[96vw]"
    :bordered="false"
    :segmented="{ footer: 'soft' }"
  >
    <div class="flex flex-col gap-12px">
      <div class="flex flex-wrap items-center gap-12px">
        <span class="text-13px text-gray-600">{{ $t('page.wms.parkScheduling.cabinetReportDateLabel') }}</span>
        <NDatePicker v-model:value="reportDateMs" type="date" size="small" clearable class="w-200px" />
        <span class="text-12px text-gray-400">{{ $t('page.wms.parkScheduling.cabinetReportDateHint') }}</span>
      </div>
      <div class="cabinet-report-frame-wrap rounded-8px border border-gray-200 bg-white">
        <iframe
          ref="iframeRef"
          class="cabinet-report-iframe"
          :srcdoc="srcdoc"
          title="cabinet-report"
        />
      </div>
    </div>
    <template #footer>
      <div class="flex flex-wrap justify-end gap-10px">
        <NButton @click="visible = false">{{ $t('common.close') }}</NButton>
        <NButton type="primary" @click="handlePrint">
          {{ $t('page.wms.parkScheduling.cabinetReportPrintPdf') }}
        </NButton>
      </div>
    </template>
  </NModal>
</template>

<style scoped>
.cabinet-report-frame-wrap {
  height: min(62vh, 520px);
  min-height: 280px;
  overflow: hidden;
}

.cabinet-report-iframe {
  display: block;
  width: 100%;
  height: 100%;
  min-height: 260px;
  border: none;
}
</style>
