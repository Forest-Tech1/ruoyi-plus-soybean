<script setup lang="tsx">
import { computed, ref, watch } from 'vue';
import type { DataTableColumns } from 'naive-ui';
import { NDataTable, NDrawer, NDrawerContent } from 'naive-ui';
import { useWindowSize } from '@vueuse/core';
import { fetchGetOutstockExceptionDetails } from '@/service/api/wms/outstock-exception';
import { $t } from '@/locales';

defineOptions({
  name: 'OutstockExceptionDetailDrawer'
});

const visible = defineModel<boolean>('visible', { default: false });

const props = defineProps<{
  batch: Api.Wms.OutstockExceptionBatchLine | null;
}>();

const loading = ref(false);
const detailRows = ref<Api.Wms.OutstockExceptionDetailLine[]>([]);

const { width } = useWindowSize();
const drawerWidth = computed(() => Math.min(1100, Math.max(720, Math.floor((width.value * 4) / 5))));

function normalizeDetailPayload(raw: unknown): Api.Wms.OutstockExceptionDetailLine[] {
  if (raw == null) return [];
  if (Array.isArray(raw)) return raw as Api.Wms.OutstockExceptionDetailLine[];
  if (typeof raw === 'object') {
    const r = raw as Record<string, unknown>;
    const arr = r.rows ?? r.list ?? r.items;
    if (Array.isArray(arr)) return arr as Api.Wms.OutstockExceptionDetailLine[];
  }
  return [];
}

async function loadDetails() {
  const batchId = props.batch?.outstockBatchId;
  if (batchId == null) {
    detailRows.value = [];
    return;
  }
  loading.value = true;
  try {
    const { data, error } = await fetchGetOutstockExceptionDetails(batchId);
    if (error) {
      detailRows.value = [];
      return;
    }
    detailRows.value = normalizeDetailPayload(data);
  } finally {
    loading.value = false;
  }
}

const columns = computed<DataTableColumns<Api.Wms.OutstockExceptionDetailLine>>(() => [
  {
    key: 'systemSoNo',
    title: $t('page.wms.outstockException.detailOrderNo'),
    minWidth: 132,
    ellipsis: { tooltip: true },
    render: row => row.systemSoNo ?? '—'
  },
  {
    key: 'coNo',
    title: $t('page.wms.outstockException.detailCoNo'),
    width: 120,
    ellipsis: { tooltip: true },
    render: row => row.coNo ?? '—'
  },
  {
    key: 'loadingSequenceNo',
    title: $t('page.wms.outstockException.loadingSequenceNo'),
    width: 112,
    ellipsis: { tooltip: true },
    render: row =>
      row.loadingSequenceNo != null && String(row.loadingSequenceNo).trim() !== ''
        ? String(row.loadingSequenceNo)
        : '—'
  },
  {
    key: 'shipmentCode',
    title: $t('page.wms.outstockException.detailFbacode'),
    minWidth: 140,
    ellipsis: { tooltip: true },
    render: row => row.shipmentCode ?? '—'
  },
  {
    key: 'exceptionType',
    title: $t('page.wms.outstockException.exceptionType'),
    width: 140,
    ellipsis: { tooltip: true },
    render: row => row.exceptionType ?? '—'
  },
  {
    key: 'exceptionMessage',
    title: $t('page.wms.outstockException.exceptionMessage'),
    minWidth: 220,
    ellipsis: { tooltip: true },
    render: row =>
      row.exceptionMessage ?? row.message ?? row.remark ?? '—'
  },
  {
    key: 'createTime',
    title: $t('page.wms.outstockException.detailTime'),
    width: 176,
    ellipsis: { tooltip: true },
    render: row => row.createTime ?? '—'
  }
]);

const scrollX = computed(() =>
  columns.value.reduce((acc, c) => acc + Number((c as { width?: number; minWidth?: number }).width ?? (c as { minWidth?: number }).minWidth ?? 120), 0)
);

watch(
  () => [visible.value, props.batch?.outstockBatchId] as const,
  ([v]) => {
    if (v) {
      void loadDetails();
    } else {
      detailRows.value = [];
    }
  }
);
</script>

<template>
  <NDrawer v-model:show="visible" :width="drawerWidth" placement="right" display-directive="show">
    <NDrawerContent
      :title="
        batch?.outstockBatchNo
          ? $t('page.wms.outstockException.detailTitle', { batch: batch.outstockBatchNo })
          : $t('page.wms.outstockException.detailTitleFallback')
      "
      closable
    >
      <NDataTable
        size="small"
        :columns="columns"
        :data="detailRows"
        :loading="loading"
        :scroll-x="scrollX"
        :bordered="false"
      />
    </NDrawerContent>
  </NDrawer>
</template>
