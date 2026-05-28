<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import type { UploadFileInfo } from 'naive-ui';
import type { DataTableColumns } from 'naive-ui';
import { $t } from '@/locales';
import { fetchUploadOutstockPdf } from '@/service/api/wms/inventory-data';
import { normalizeWarehouseInventoryOutstockResult } from '@/utils/wms-inventory-data-outstock';
import SvgIcon from '@/components/custom/svg-icon.vue';

defineOptions({
  name: 'InventoryDataOutstockModal'
});

interface Emits {
  (e: 'submitted'): void;
}

const emit = defineEmits<Emits>();

const visible = defineModel<boolean>('visible', {
  default: false
});

const step = ref<1 | 2>(1);
const uploading = ref(false);
const fileList = ref<UploadFileInfo[]>([]);

const resultSummary = ref<string | null>(null);
const resultRows = ref<Api.Wms.WarehouseInventoryOutstockResultItem[]>([]);

function rowStatus(row: Api.Wms.WarehouseInventoryOutstockResultItem) {
  const v = row.outstockStatus ?? row.status;
  return v != null && String(v).trim() !== '' ? String(v) : '—';
}

function rowMessage(row: Api.Wms.WarehouseInventoryOutstockResultItem) {
  const v = row.message ?? row.remark ?? row.errorMsg;
  return v != null && String(v).trim() !== '' ? String(v) : '—';
}

const resultColumns = computed<DataTableColumns<Api.Wms.WarehouseInventoryOutstockResultItem>>(() => [
  {
    key: 'systemSoNo',
    title: $t('page.wms.inventoryData.orderNo'),
    width: 132,
    ellipsis: { tooltip: true },
    render: row => row.systemSoNo ?? '—'
  },
  {
    key: 'coNo',
    title: $t('page.wms.inventoryData.coNo'),
    width: 112,
    ellipsis: { tooltip: true },
    render: row => row.coNo ?? '—'
  },
  {
    key: 'shipmentCode',
    title: $t('page.wms.inventoryData.shipmentCode'),
    minWidth: 128,
    ellipsis: { tooltip: true },
    render: row => row.shipmentCode ?? '—'
  },
  {
    key: 'zoneCode',
    title: $t('page.wms.inventoryData.zoneCode'),
    width: 112,
    ellipsis: { tooltip: true },
    render: row => row.zoneCode ?? '—'
  },
  {
    key: 'locationCode',
    title: $t('page.wms.inventoryData.locationCode'),
    width: 112,
    ellipsis: { tooltip: true },
    render: row => row.locationCode ?? '—'
  },
  {
    key: 'palletCount',
    title: $t('page.wms.inventoryData.palletCount'),
    width: 88,
    render: row => (row.palletCount != null ? String(row.palletCount) : '—')
  },
  {
    key: 'outstockStatus',
    title: $t('page.wms.inventoryData.outstockResultStatus'),
    width: 112,
    ellipsis: { tooltip: true },
    render: row => rowStatus(row)
  },
  {
    key: 'message',
    title: $t('page.wms.inventoryData.outstockResultMessage'),
    minWidth: 160,
    ellipsis: { tooltip: true },
    render: row => rowMessage(row)
  }
]);

const resultScrollX = computed(() =>
  resultColumns.value.reduce((acc, c) => acc + Number((c as { width?: number }).width ?? 120), 0)
);

const modalTitle = computed(() =>
  step.value === 1
    ? $t('page.wms.inventoryData.outstockModalTitle')
    : $t('page.wms.inventoryData.outstockResultTitle')
);

const modalClass = computed(() =>
  step.value === 2
    ? 'inventory-data-outstock-modal max-w-[min(1100px,98vw)] w-[min(1100px,98vw)]'
    : 'inventory-data-outstock-modal max-w-[min(720px,94vw)] w-[min(720px,94vw)]'
);

function closeModal() {
  if (step.value === 2) {
    emit('submitted');
  }
  visible.value = false;
}

function resetState() {
  uploading.value = false;
  fileList.value = [];
  step.value = 1;
  resultSummary.value = null;
  resultRows.value = [];
}

function handleFinishResult() {
  emit('submitted');
  visible.value = false;
  resetState();
}

function handleBackToUpload() {
  step.value = 1;
  fileList.value = [];
  resultSummary.value = null;
  resultRows.value = [];
}

async function handleSubmit() {
  const file = fileList.value.map(f => f.file).find((f): f is File => f != null);
  if (!file) {
    window.$message?.warning($t('page.wms.inventoryData.outstockNeedFile'));
    return;
  }
  uploading.value = true;
  try {
    const { data, error } = await fetchUploadOutstockPdf(file);
    if (error) return;
    window.$message?.success($t('page.wms.inventoryData.outstockUploadSuccess'));
    const normalized = normalizeWarehouseInventoryOutstockResult(data);
    resultSummary.value = normalized.summary;
    resultRows.value = normalized.rows;
    step.value = 2;
  } finally {
    uploading.value = false;
  }
}

watch(visible, v => {
  if (v) resetState();
});
</script>

<template>
  <NModal
    v-model:show="visible"
    :title="modalTitle"
    preset="card"
    :bordered="false"
    display-directive="show"
    :class="modalClass"
    :content-style="{ maxHeight: 'min(90vh, 880px)' }"
    @close="closeModal"
  >
    <div v-show="step === 1" class="flex max-h-[min(72vh,680px)] flex-col gap-16px overflow-hidden">
      <NUpload
        v-model:file-list="fileList"
        :default-upload="false"
        :max="1"
        :file-size="50"
        accept=".pdf,application/pdf"
        :multiple="false"
        directory-dnd
        list-type="text"
      >
        <NUploadDragger>
          <div class="mb-12px flex-center">
            <SvgIcon icon="material-symbols:unarchive-outline" class="text-58px color-#d8d8db dark:color-#a1a1a2" />
          </div>
          <NText class="text-16px">{{ $t('page.wms.inventoryData.outstockModalTip') }}</NText>
          <NP depth="3" class="mt-8px text-center">
            {{ $t('common.importSize') }}
            <b class="text-red-500">50MB</b>
            {{ $t('common.importFormat') }}
            <b class="text-red-500">PDF</b>
            {{ $t('common.importEnd') }}
          </NP>
        </NUploadDragger>
      </NUpload>

      <NAlert type="info" :title="$t('page.wms.inventoryData.outstockModalNoticeTitle')" :bordered="false">
        <div class="text-13px leading-relaxed">
          {{ $t('page.wms.inventoryData.outstockModalNoticeBody') }}
        </div>
      </NAlert>
    </div>

    <div v-show="step === 2" class="flex min-h-0 flex-1 flex-col gap-12px overflow-hidden">
      <NAlert v-if="resultSummary" type="success" :bordered="false">
        {{ resultSummary }}
      </NAlert>
      <NAlert v-else-if="!resultRows.length" type="info" :bordered="false">
        {{ $t('page.wms.inventoryData.outstockResultNoDetail') }}
      </NAlert>

      <div v-if="resultRows.length" class="min-h-120px flex min-h-0 flex-1 flex-col overflow-hidden">
        <NDataTable
          size="small"
          :columns="resultColumns"
          :data="resultRows"
          :scroll-x="resultScrollX"
          :bordered="false"
          flex-height
          class="min-h-200px flex-1"
          style="height: min(52vh, 420px)"
        />
      </div>
    </div>

    <template #footer>
      <NSpace v-if="step === 1" justify="end" :size="16" class="w-full">
        <NButton @click="closeModal">{{ $t('common.cancel') }}</NButton>
        <NButton type="primary" :loading="uploading" @click="handleSubmit">
          {{ $t('page.wms.inventoryData.outstockSubmit') }}
        </NButton>
      </NSpace>
      <NSpace v-else justify="space-between" :size="16" class="w-full">
        <NButton @click="handleBackToUpload">{{ $t('page.wms.inventoryData.outstockBackToUpload') }}</NButton>
        <NButton type="primary" @click="handleFinishResult">{{ $t('page.wms.inventoryData.outstockResultDone') }}</NButton>
      </NSpace>
    </template>
  </NModal>
</template>
