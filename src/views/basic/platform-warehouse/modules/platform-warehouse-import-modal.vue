<script setup lang="ts">
import { computed, h, ref, watch } from 'vue';
import type { UploadFileInfo } from 'naive-ui';
import {
  NAlert,
  NButton,
  NCheckbox,
  NDataTable,
  NModal,
  NP,
  NSpace,
  NTag,
  NText,
  NUpload,
  NUploadDragger
} from 'naive-ui';
import { useDownload } from '@/hooks/business/download';
import {
  fetchConfirmPlatformWarehouseImport,
  fetchPreviewPlatformWarehouseImport
} from '@/service/api/basic/platform-warehouse';
import { $t } from '@/locales';
import SvgIcon from '@/components/custom/svg-icon.vue';

defineOptions({
  name: 'PlatformWarehouseImportModal'
});

const emit = defineEmits<{ submitted: [] }>();

const visible = defineModel<boolean>('visible', { default: false });

const { download } = useDownload();

const step = ref<1 | 2>(1);
const parsing = ref(false);
const confirming = ref(false);
const updateSupport = ref(false);
const fileList = ref<UploadFileInfo[]>([]);
const previewRows = ref<Api.Basic.PlatformWarehouseImportPreviewRow[]>([]);
const importBatchId = ref<string | null>(null);

const modalTitle = computed(() =>
  step.value === 1
    ? $t('page.basic.platformWarehouse.importWarehouse')
    : $t('page.basic.platformWarehouse.importPreviewTitle', { count: previewRows.value.length })
);

const validRowCount = computed(
  () => previewRows.value.filter(r => !(r.errorMessage && String(r.errorMessage).trim())).length
);

const errorRowCount = computed(() => previewRows.value.length - validRowCount.value);

function normalizePreviewPayload(raw: unknown): {
  rows: Api.Basic.PlatformWarehouseImportPreviewRow[];
  importBatchId: string | null;
} {
  const empty = { rows: [] as Api.Basic.PlatformWarehouseImportPreviewRow[], importBatchId: null as string | null };
  if (raw == null || typeof raw !== 'object') return empty;
  const o = raw as Record<string, unknown>;
  const inner =
    o.data != null && typeof o.data === 'object' && !Array.isArray(o.data) ? (o.data as Record<string, unknown>) : o;
  const rowsRaw = inner.rows ?? o.rows;
  const rows = Array.isArray(rowsRaw) ? (rowsRaw as Api.Basic.PlatformWarehouseImportPreviewRow[]) : [];
  const bid = inner.importBatchId ?? o.importBatchId;
  const importBatchIdVal =
    typeof bid === 'string' && bid.trim() ? bid : bid != null && String(bid).trim() ? String(bid) : null;
  return { rows, importBatchId: importBatchIdVal };
}

function resetState() {
  step.value = 1;
  parsing.value = false;
  confirming.value = false;
  updateSupport.value = false;
  fileList.value = [];
  previewRows.value = [];
  importBatchId.value = null;
}

function closeModal() {
  visible.value = false;
}

const previewColumns = computed(() => [
  {
    key: 'rowNum',
    title: $t('page.basic.platformWarehouse.importColRowNum'),
    width: 64,
    align: 'center' as const,
    render: (row: Api.Basic.PlatformWarehouseImportPreviewRow) => (row.rowNum != null ? String(row.rowNum) : '—')
  },
  {
    key: 'platformCode',
    title: $t('page.basic.platformWarehouse.platformCode'),
    width: 100,
    ellipsis: { tooltip: true }
  },
  {
    key: 'warehouseCode',
    title: $t('page.basic.platformWarehouse.warehouseCodeCol'),
    width: 120,
    ellipsis: { tooltip: true }
  },
  {
    key: 'warehouseName',
    title: $t('page.basic.platformWarehouse.warehouseName'),
    width: 120,
    ellipsis: { tooltip: true },
    render: (row: Api.Basic.PlatformWarehouseImportPreviewRow) => row.warehouseName || row.warehouseCode || '—'
  },
  {
    key: 'countryCode',
    title: $t('page.basic.platformWarehouse.country'),
    width: 96
  },
  {
    key: 'addressLine',
    title: $t('page.basic.platformWarehouse.addressLine'),
    minWidth: 140,
    ellipsis: { tooltip: true }
  },
  {
    key: 'city',
    title: $t('page.basic.platformWarehouse.city'),
    width: 100,
    ellipsis: { tooltip: true }
  },
  {
    key: 'stateProvince',
    title: $t('page.basic.platformWarehouse.stateProvince'),
    width: 100,
    ellipsis: { tooltip: true }
  },
  {
    key: 'postalCode',
    title: $t('page.basic.platformWarehouse.postalCode'),
    width: 88
  },
  {
    key: 'palletCbm',
    title: $t('page.basic.platformWarehouse.palletCbm'),
    width: 96,
    align: 'right' as const,
    ellipsis: { tooltip: true },
    render: (row: Api.Basic.PlatformWarehouseImportPreviewRow) => {
      const v = row.palletCbm;
      if (v == null) return '—';
      const n = Number(v);
      return Number.isFinite(n) ? String(n) : '—';
    }
  },
  {
    key: 'errorMessage',
    title: $t('page.basic.platformWarehouse.importColError'),
    minWidth: 160,
    ellipsis: { tooltip: true },
    render: (row: Api.Basic.PlatformWarehouseImportPreviewRow) => {
      const msg = row.errorMessage?.trim();
      if (!msg) return '—';
      return h(NTag, { type: 'error', size: 'small' }, { default: () => msg });
    }
  }
]);

const previewScrollX = computed(() =>
  previewColumns.value.reduce(
    (acc: number, c: { width?: number; minWidth?: number }) => acc + Number(c.width ?? c.minWidth ?? 100),
    0
  )
);

async function handleParsePreview() {
  const file = fileList.value[0]?.file;
  if (!file) {
    window.$message?.warning($t('page.basic.platformWarehouse.importNeedFile'));
    return;
  }
  parsing.value = true;
  try {
    const { data, error } = await fetchPreviewPlatformWarehouseImport(file, updateSupport.value);
    if (error) return;
    const { rows, importBatchId: bid } = normalizePreviewPayload(data);
    if (!rows.length) {
      window.$message?.warning($t('page.basic.platformWarehouse.importPreviewEmpty'));
      return;
    }
    previewRows.value = rows;
    importBatchId.value = bid;
    step.value = 2;
  } finally {
    parsing.value = false;
  }
}

function handleBackToFiles() {
  step.value = 1;
  previewRows.value = [];
  importBatchId.value = null;
}

async function handleConfirmImport() {
  if (!previewRows.value.length) {
    window.$message?.warning($t('page.basic.platformWarehouse.importPreviewEmpty'));
    return;
  }
  if (validRowCount.value === 0) {
    window.$message?.warning($t('page.basic.platformWarehouse.importNoValidRows'));
    return;
  }
  confirming.value = true;
  try {
    const { error } = await fetchConfirmPlatformWarehouseImport({
      updateSupport: updateSupport.value,
      rows: previewRows.value,
      importBatchId: importBatchId.value
    });
    if (error) return;
    window.$message?.success($t('common.importSuccess'));
    emit('submitted');
    visible.value = false;
    resetState();
  } finally {
    confirming.value = false;
  }
}

function handleDownloadTemplate() {
  download(
    '/basic/platform-warehouse/importTemplate',
    {},
    `${$t('page.basic.platformWarehouse.title')}_${$t('common.importTemplate')}_${Date.now()}.xlsx`
  );
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
    class="max-w-[min(1100px,96vw)] w-[min(1100px,96vw)]"
    :content-style="{ maxHeight: 'min(88vh, 820px)' }"
    @close="closeModal"
  >
    <div v-show="step === 1" class="flex max-h-[min(72vh,640px)] flex-col gap-16px overflow-hidden">
      <NUpload
        v-model:file-list="fileList"
        :default-upload="false"
        :max="1"
        :file-size="20"
        accept=".xls,.xlsx"
        list-type="text"
      >
        <NUploadDragger>
          <div class="mb-12px flex-center">
            <SvgIcon icon="material-symbols:unarchive-outline" class="text-58px color-#d8d8db dark:color-#a1a1a2" />
          </div>
          <NText class="text-16px">{{ $t('common.importTip') }}</NText>
          <NP depth="3" class="mt-8px text-center">
            {{ $t('page.basic.platformWarehouse.importSingleFileHint') }}
          </NP>
          <NP depth="3" class="mt-4px text-center">
            {{ $t('common.importSize') }}
            <b class="text-red-500">20MB</b>
            {{ $t('common.importFormat') }}
            <b class="text-red-500">xls/xlsx</b>
            {{ $t('common.importEnd') }}
          </NP>
        </NUploadDragger>
      </NUpload>

      <NAlert type="info" :title="$t('page.basic.platformWarehouse.importExcelColumnsTitle')" :bordered="false">
        <div class="text-13px leading-relaxed whitespace-pre-line">
          {{ $t('page.basic.platformWarehouse.importExcelColumnsBody') }}
        </div>
      </NAlert>

      <div class="flex shrink-0 justify-center">
        <NCheckbox v-model:checked="updateSupport">{{ $t('common.updateExisting') }}</NCheckbox>
      </div>
    </div>

    <div v-show="step === 2" class="flex min-h-0 flex-1 flex-col gap-12px overflow-hidden">
      <div class="text-13px text-gray-600 leading-relaxed dark:text-gray-400">
        {{ $t('page.basic.platformWarehouse.importPreviewHint') }}
        <template v-if="errorRowCount > 0">
          {{ $t('page.basic.platformWarehouse.importPreviewErrorSummary', { error: errorRowCount, valid: validRowCount }) }}
        </template>
      </div>
      <div class="min-h-280px flex-1 overflow-hidden">
        <NDataTable
          size="small"
          :columns="previewColumns"
          :data="previewRows"
          :row-key="
            (row: Api.Basic.PlatformWarehouseImportPreviewRow) =>
              `${row.rowNum ?? ''}-${row.platformCode}-${row.warehouseCode}-${row.addressLine ?? ''}`
          "
          :scroll-x="previewScrollX"
          :max-height="420"
          striped
        />
      </div>
    </div>

    <template #footer>
      <NSpace justify="space-between" :size="16" class="w-full">
        <NButton v-if="step === 1" @click="handleDownloadTemplate">{{ $t('common.downloadTemplate') }}</NButton>
        <span v-else />

        <NSpace justify="end" :size="16">
          <template v-if="step === 1">
            <NButton @click="closeModal">{{ $t('common.cancel') }}</NButton>
            <NButton type="primary" :loading="parsing" @click="handleParsePreview">
              {{ $t('page.basic.platformWarehouse.importParsePreview') }}
            </NButton>
          </template>
          <template v-else>
            <NButton @click="handleBackToFiles">{{ $t('page.basic.platformWarehouse.importBackToFiles') }}</NButton>
            <NButton type="primary" :loading="confirming" :disabled="validRowCount === 0" @click="handleConfirmImport">
              {{ $t('page.basic.platformWarehouse.importConfirmSubmit') }}
            </NButton>
          </template>
        </NSpace>
      </NSpace>
    </template>
  </NModal>
</template>
