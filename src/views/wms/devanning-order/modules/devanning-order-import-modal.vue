<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import type { UploadFileInfo } from 'naive-ui';
import { useDownload } from '@/hooks/business/download';
import { $t } from '@/locales';
import { fetchConfirmDevanningOrderImport, fetchPreviewDevanningOrderImport } from '@/service/api/wms/devanning-order';
import DevanningOrderImportPreviewPanel from './devanning-order-import-preview-panel.vue';

defineOptions({
  name: 'DevanningOrderImportModal'
});

interface Emits {
  (e: 'submitted'): void;
}

const emit = defineEmits<Emits>();

const { download } = useDownload();

/** 单文件上限与系统导入习惯一致；总次数受 max 限制 */
const IMPORT_MAX_FILES = 20;

const visible = defineModel<boolean>('visible', {
  default: false
});

const step = ref<1 | 2>(1);
const parsing = ref(false);
const confirming = ref(false);

const updateSupport = ref(false);

const fileList = ref<UploadFileInfo[]>([]);

const previewItems = ref<Api.Wms.DevanningOrderImportPreviewItem[]>([]);
const selectedPreviewId = ref<string | null>(null);

const modalTitle = computed(() =>
  step.value === 1
    ? $t('common.import')
    : $t('page.wms.devanningOrder.importPreviewTitle', { count: previewItems.value.length })
);

const modalClass = computed(() =>
  step.value === 2
    ? 'devanning-order-import-modal max-w-[min(1100px,98vw)] w-[min(1100px,98vw)]'
    : 'devanning-order-import-modal max-w-[min(720px,94vw)] w-[min(720px,94vw)]'
);

function closeModal() {
  visible.value = false;
}

function resetState() {
  step.value = 1;
  parsing.value = false;
  confirming.value = false;
  updateSupport.value = false;
  fileList.value = [];
  previewItems.value = [];
  selectedPreviewId.value = null;
}

function normalizePreviewPayload(raw: unknown): Api.Wms.DevanningOrderImportPreviewItem[] {
  if (raw == null || typeof raw !== 'object') return [];
  const obj = raw as Record<string, unknown>;
  const items = obj.items;
  if (!Array.isArray(items)) return [];
  return items.map((row: Record<string, unknown>, index: number) => {
    const previewIdRaw = row.previewId ?? row.id;
    const previewId = typeof previewIdRaw === 'string' && previewIdRaw ? previewIdRaw : crypto.randomUUID();
    const sourceFileNameRaw = row.sourceFileName ?? row.fileName ?? row.filename;
    const sourceFileName = typeof sourceFileNameRaw === 'string' ? sourceFileNameRaw : '';
    const rawOrder = (row.order ?? row) as Record<string, unknown>;
    const plans = rawOrder.inboundPlans;
    const order = {
      ...rawOrder,
      inboundPlans: Array.isArray(plans) ? plans : []
    } as Api.Wms.DevanningOrderImportPreviewItem['order'];
    return {
      previewId,
      sourceFileName: sourceFileName || `file-${index + 1}`,
      order
    };
  });
}

async function handleParsePreview() {
  const files = fileList.value.map(f => f.file).filter((f): f is File => f != null);
  if (!files.length) {
    window.$message?.warning($t('page.wms.devanningOrder.importNeedFiles'));
    return;
  }
  parsing.value = true;
  try {
    const { data, error } = await fetchPreviewDevanningOrderImport(files, updateSupport.value);
    if (error) return;
    const items = normalizePreviewPayload(data);
    if (!items.length) {
      window.$message?.warning($t('page.wms.devanningOrder.importPreviewEmpty'));
      return;
    }
    previewItems.value = items;
    selectedPreviewId.value = items[0]?.previewId ?? null;
    step.value = 2;
  } finally {
    parsing.value = false;
  }
}

function handleBackToFiles() {
  step.value = 1;
  previewItems.value = [];
  selectedPreviewId.value = null;
}

async function handleConfirmImport() {
  if (!previewItems.value.length) {
    window.$message?.warning($t('page.wms.devanningOrder.importPreviewEmpty'));
    return;
  }
  confirming.value = true;
  try {
    const { error } = await fetchConfirmDevanningOrderImport({
      updateSupport: updateSupport.value,
      items: previewItems.value
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
    '/wms/devanning-order/importTemplate',
    {},
    `${$t('page.wms.devanningOrder.title')}_${$t('common.importTemplate')}_${Date.now()}.xlsx`
  );
}

watch(visible, v => {
  if (v) {
    resetState();
  }
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
        :max="IMPORT_MAX_FILES"
        :file-size="50"
        accept=".xls,.xlsx"
        multiple
        directory-dnd
        list-type="text"
      >
        <NUploadDragger>
          <div class="mb-12px flex-center">
            <SvgIcon icon="material-symbols:unarchive-outline" class="text-58px color-#d8d8db dark:color-#a1a1a2" />
          </div>
          <NText class="text-16px">{{ $t('common.importTip') }}</NText>
          <NP depth="3" class="mt-8px text-center">
            {{ $t('page.wms.devanningOrder.importMultiHint', { max: IMPORT_MAX_FILES }) }}
          </NP>
          <NP depth="3" class="mt-4px text-center">
            {{ $t('common.importSize') }}
            <b class="text-red-500">50MB</b>
            {{ $t('common.importFormat') }}
            <b class="text-red-500">xls/xlsx</b>
            {{ $t('common.importEnd') }}
          </NP>
        </NUploadDragger>
      </NUpload>

      <NAlert
        type="info"
        :title="$t('page.wms.devanningOrder.importExcelMappingTitle')"
        :bordered="false"
        class="min-h-0 flex flex-1 flex-col overflow-hidden"
      >
        <NScrollbar class="import-mapping-scrollbar text-13px leading-relaxed" trigger="hover">
          <div class="whitespace-pre-line pr-12px pb-8px">
            {{ $t('page.wms.devanningOrder.importExcelMappingBody') }}
          </div>
        </NScrollbar>
      </NAlert>

      <div class="flex shrink-0 justify-center pt-4px">
        <NCheckbox v-model:checked="updateSupport">{{ $t('common.updateExisting') }}</NCheckbox>
      </div>
    </div>

    <div v-show="step === 2" class="flex min-h-0 flex-1 flex-col overflow-hidden">
      <div class="mb-12px text-13px text-gray-500 leading-relaxed dark:text-gray-400">
        {{ $t('page.wms.devanningOrder.importPreviewHint') }}
      </div>
      <DevanningOrderImportPreviewPanel v-model:selected-preview-id="selectedPreviewId" :items="previewItems" />
    </div>

    <template #footer>
      <NSpace justify="space-between" :size="16" class="w-full">
        <NButton v-if="step === 1" @click="handleDownloadTemplate">{{ $t('common.downloadTemplate') }}</NButton>
        <span v-else />

        <NSpace justify="end" :size="16">
          <template v-if="step === 1">
            <NButton @click="closeModal">{{ $t('common.cancel') }}</NButton>
            <NButton type="primary" :loading="parsing" @click="handleParsePreview">
              {{ $t('page.wms.devanningOrder.importParsePreview') }}
            </NButton>
          </template>
          <template v-else>
            <NButton @click="handleBackToFiles">{{ $t('page.wms.devanningOrder.importBackToFiles') }}</NButton>
            <NButton type="primary" :loading="confirming" @click="handleConfirmImport">
              {{ $t('page.wms.devanningOrder.importConfirmSubmit') }}
            </NButton>
          </template>
        </NSpace>
      </NSpace>
    </template>
  </NModal>
</template>

<style scoped>
.import-mapping-scrollbar {
  max-height: min(44vh, 420px);
  min-height: 200px;
}
</style>
