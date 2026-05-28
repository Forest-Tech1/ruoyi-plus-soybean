<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import type { UploadFileInfo } from 'naive-ui';
import { useDownload } from '@/hooks/business/download';
import { $t } from '@/locales';
import {
  fetchConfirmDevanningOrderImport,
  fetchPreviewDevanningOrderImport,
  fetchPreviewDevanningOrderImportRawOrder,
  fetchPreviewDevanningOrderImportV2
} from '@/service/api/wms/devanning-order';
import DevanningOrderImportPreviewPanel from './devanning-order-import-preview-panel.vue';

defineOptions({
  name: 'DevanningOrderImportModal'
});

interface Props {
  /**
   * 标准派送：`import-preview`、`importTemplate`；
   * **导入订单（Sheet2）**：`import-preview/v2`、`importTemplate/v2`（V2 表头）；
   * 原始订单：`import-preview/raw-order`。
   */
  variant?: 'standard' | 'rawOrder' | 'rawOrderSheet2';
}

const props = withDefaults(defineProps<Props>(), {
  variant: 'standard'
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

/** 线上若搜不到控制台字符串：部分环境会折叠 Warning / 未发新版 JS；可在控制台执行 `window.__DEVANNING_IMPORT_LOG__` 查看（与 console 同步写入）。 */
const DEVANNING_IMPORT_LOG_MAX = 48;

function logImport(stage: string, extra?: Record<string, unknown>) {
  const row = { at: new Date().toISOString(), stage, ...extra };
  if (typeof window !== 'undefined') {
    const w = window as Window & {
      __DEVANNING_IMPORT_LOG__?: Array<Record<string, unknown>>;
    };
    if (!Array.isArray(w.__DEVANNING_IMPORT_LOG__)) {
      w.__DEVANNING_IMPORT_LOG__ = [];
    }
    w.__DEVANNING_IMPORT_LOG__!.push(row);
    while (w.__DEVANNING_IMPORT_LOG__!.length > DEVANNING_IMPORT_LOG_MAX) {
      w.__DEVANNING_IMPORT_LOG__!.shift();
    }
  }
   
  console.warn('[DevanningImport]', row);
}

function safePreviewId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return `pv-${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;
}

/** 原始订单（首 Sheet）：徽标、无系统模板下载 */
const isRawOrderOnly = computed(() => props.variant === 'rawOrder');

/** 第一步是否展示「下载模板」（标准派送 + 导入订单 Sheet2 均为系统模板，后者为 V2） */
const showTemplateDownload = computed(
  () => props.variant === 'standard' || props.variant === 'rawOrderSheet2'
);

const modalTitle = computed(() =>
  step.value === 1
    ? $t('common.import')
    : $t('page.wms.devanningOrder.importPreviewTitle', { count: previewItems.value.length })
);

const modalClass = computed(() =>
  step.value === 2
    ? 'devanning-order-import-modal max-w-[min(1360px,98vw)] w-[min(1360px,98vw)]'
    : 'devanning-order-import-modal max-w-[min(720px,94vw)] w-[min(720px,94vw)]'
);

const mappingAlertTitle = computed(() => {
  switch (props.variant) {
    case 'rawOrderSheet2':
      return $t('page.wms.devanningOrder.importExcelMappingTitleV2');
    case 'rawOrder':
      return $t('page.wms.devanningOrder.importRawOrderMappingTitle');
    case 'standard':
    default:
      return $t('page.wms.devanningOrder.importExcelMappingTitle');
  }
});

const mappingAlertBody = computed(() => {
  switch (props.variant) {
    case 'rawOrderSheet2':
      return `${$t('page.wms.devanningOrder.importRawOrderSheet2MappingBody')}\n\n${$t('page.wms.devanningOrder.importExcelMappingBodyV2')}`;
    case 'rawOrder':
      return $t('page.wms.devanningOrder.importRawOrderMappingBody');
    case 'standard':
    default:
      return $t('page.wms.devanningOrder.importExcelMappingBody');
  }
});

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
    const previewId = typeof previewIdRaw === 'string' && previewIdRaw ? previewIdRaw : safePreviewId();
    const sourceFileNameRaw = row.sourceFileName ?? row.fileName ?? row.filename;
    const sourceFileName = typeof sourceFileNameRaw === 'string' ? sourceFileNameRaw : '';
    const rawOrder = (row.order ?? row) as Record<string, unknown>;
    /** 部分后端 JSON 为 snake_case，仅读 camelCase 会导致入库计划丢失、预览表无行 */
    const plansRaw = rawOrder.inboundPlans ?? rawOrder.inbound_plans;
    const plans = Array.isArray(plansRaw) ? plansRaw : [];
    const order = {
      ...rawOrder,
      inboundPlans: plans
    } as Api.Wms.DevanningOrderImportPreviewItem['order'];
    return {
      previewId,
      sourceFileName: sourceFileName || `file-${index + 1}`,
      order
    };
  });
}

function applyPreviewRootFields(raw: unknown) {
  if (raw == null || typeof raw !== 'object') return;
  const obj = raw as Record<string, unknown>;
  if (Object.prototype.hasOwnProperty.call(obj, 'updateSupport')) {
    updateSupport.value = Boolean(obj.updateSupport);
  }
}

async function handleParsePreview() {
  /** 仅第一步允许预览；若页脚未随 step 刷新仍绑在解析按钮上，此处避免误发 import-preview */
  if (step.value !== 1) return;

  const files = fileList.value.map(f => f.file).filter((f): f is File => f != null);
  if (!files.length) {
    window.$message?.warning($t('page.wms.devanningOrder.importNeedFiles'));
    return;
  }
  parsing.value = true;
  try {
    const previewFn =
      props.variant === 'standard'
        ? fetchPreviewDevanningOrderImport
        : props.variant === 'rawOrderSheet2'
          ? fetchPreviewDevanningOrderImportV2
          : fetchPreviewDevanningOrderImportRawOrder;
    const { data, error } = await previewFn(files, updateSupport.value);
    if (error) return;
    applyPreviewRootFields(data);
    const items = normalizePreviewPayload(data);
    if (!items.length) {
      window.$message?.warning($t('page.wms.devanningOrder.importPreviewEmpty'));
      return;
    }
    previewItems.value = items;
    selectedPreviewId.value = items[0]?.previewId ?? null;
    confirming.value = false;
    step.value = 2;
    logImport('preview_step2', { itemCount: items.length });
  } finally {
    parsing.value = false;
  }
}

function handleBackToFiles() {
  parsing.value = false;
  confirming.value = false;
  step.value = 1;
  previewItems.value = [];
  selectedPreviewId.value = null;
}

/** 与「导入现有库存」弹窗一致：页脚只保留一个主按钮实例，按 step 分发，避免线上复用节点仍绑 preview */
function handleFooterSecondaryClick() {
  if (step.value === 1) {
    closeModal();
  } else {
    handleBackToFiles();
  }
}

async function handleFooterPrimaryClick() {
  if (step.value === 1) {
    await handleParsePreview();
    return;
  }
  await handleConfirmImport();
}

/**
 * 转为可 JSON 序列化的纯对象，避免 Vue Proxy / 异常属性导致请求拦截器里 `JSON.stringify(data)` 抛错 → 网络层无任何请求。
 */
function buildPlainConfirmPayload(): Api.Wms.DevanningOrderImportConfirmParams | null {
  try {
    const raw = {
      updateSupport: updateSupport.value,
      items: previewItems.value
    };
    const json = JSON.stringify(raw);
    logImport('confirm_payload_serialized', {
      bytes: json.length,
      itemCount: raw.items.length
    });
    return JSON.parse(json) as Api.Wms.DevanningOrderImportConfirmParams;
  } catch (e) {
    logImport('confirm_payload_serialize_error', {
      message: e instanceof Error ? e.message : String(e)
    });
     
    console.error('[DevanningImport] JSON.stringify failed', e);
    window.$message?.error($t('page.wms.devanningOrder.importConfirmSerializeError'));
    return null;
  }
}

async function handleConfirmImport() {
  if (step.value !== 2) return;

  logImport('confirm_click', {
    step: step.value,
    previewCount: previewItems.value.length,
    selectedPreviewId: selectedPreviewId.value
  });

  if (!previewItems.value.length) {
    window.$message?.warning($t('page.wms.devanningOrder.importPreviewEmpty'));
    return;
  }

  const payload = buildPlainConfirmPayload();
  if (!payload) return;

  confirming.value = true;
  try {
    logImport('confirm_request_start', {
      url: '/wms/devanning-order/import-confirm',
      method: 'POST',
      updateSupport: payload.updateSupport,
      items: payload.items.length
    });

    const { error } = await fetchConfirmDevanningOrderImport(payload);

    logImport('confirm_request_done', { hasError: Boolean(error) });

    if (error) return;
    window.$message?.success($t('common.importSuccess'));
    emit('submitted');
    visible.value = false;
    resetState();
  } catch (e) {
    logImport('confirm_throw', {
      message: e instanceof Error ? e.message : String(e),
      name: e instanceof Error ? e.name : typeof e
    });
     
    console.error('[DevanningImport] confirm import threw', e);
    const msg =
      e instanceof Error
        ? e.message
        : typeof e === 'string'
          ? e
          : $t('page.wms.devanningOrder.importConfirmUnknownError');
    window.$message?.error(msg);
  } finally {
    confirming.value = false;
  }
}

function handleDownloadTemplate() {
  const url =
    props.variant === 'rawOrderSheet2'
      ? '/wms/devanning-order/importTemplate/v2'
      : '/wms/devanning-order/importTemplate';
  download(
    url,
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
    display-directive="if"
    :class="modalClass"
    :content-style="{
      maxHeight: 'min(92vh, 960px)',
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden'
    }"
    @close="closeModal"
  >
    <div v-if="step === 1" class="flex max-h-[min(72vh,680px)] min-h-0 flex-col gap-16px overflow-hidden">
      <div v-if="variant === 'rawOrder' || variant === 'rawOrderSheet2'" class="shrink-0">
        <NTag v-if="variant === 'rawOrderSheet2'" size="small" type="warning" round>
          {{ $t('page.wms.devanningOrder.importRawOrderSheet2Badge') }}
        </NTag>
        <NTag v-else size="small" type="warning" round>
          {{ $t('page.wms.devanningOrder.importRawOrderBadge') }}
        </NTag>
      </div>

      <NUpload
        v-model:file-list="fileList"
        class="devanning-import-upload"
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
        :title="mappingAlertTitle"
        :bordered="false"
        class="min-h-0 flex flex-1 flex-col overflow-hidden"
      >
        <NScrollbar class="import-mapping-scrollbar text-13px leading-relaxed" trigger="hover">
          <div class="whitespace-pre-line pr-12px pb-8px">
            {{ mappingAlertBody }}
          </div>
        </NScrollbar>
      </NAlert>

      <div class="flex shrink-0 justify-center pt-4px">
        <NCheckbox v-model:checked="updateSupport">{{ $t('common.updateExisting') }}</NCheckbox>
      </div>
    </div>

    <!-- 第二步：保证最小高度，避免 NModal 内容区无高度 → 表格 flex-height 表体为 0 -->
    <div
      v-else
      class="import-modal-step2 flex min-h-[min(72vh,820px)] flex-1 flex-col gap-8px overflow-hidden"
    >
      <div class="shrink-0 text-12px text-gray-500 leading-snug dark:text-gray-400">
        {{ $t('page.wms.devanningOrder.importPreviewHint') }}
      </div>
      <div class="flex min-h-[54vh] flex-1 flex-col overflow-hidden">
        <DevanningOrderImportPreviewPanel v-model:selected-preview-id="selectedPreviewId" :items="previewItems" />
      </div>
    </div>

    <template #footer>
      <NSpace justify="space-between" :size="16" class="w-full">
        <NButton v-if="step === 1 && showTemplateDownload" @click="handleDownloadTemplate">
          {{ $t('common.downloadTemplate') }}
        </NButton>
        <span v-else-if="step === 1 && isRawOrderOnly" class="text-12px text-gray-500 dark:text-gray-400">
          {{ $t('page.wms.devanningOrder.importRawOrderNoTemplateHint') }}
        </span>
        <span v-else />

        <NSpace justify="end" :size="16">
          <NButton @click="handleFooterSecondaryClick">
            {{
              step === 1 ? $t('common.cancel') : $t('page.wms.devanningOrder.importBackToFiles')
            }}
          </NButton>
          <NButton
            type="primary"
            :loading="step === 1 ? parsing : confirming"
            @click="handleFooterPrimaryClick"
          >
            {{
              step === 1
                ? $t('page.wms.devanningOrder.importParsePreview')
                : $t('page.wms.devanningOrder.importConfirmSubmit')
            }}
          </NButton>
        </NSpace>
      </NSpace>
    </template>
  </NModal>
</template>

<style scoped>
/* 多文件时限制已选文件列表高度，避免顶掉下方映射说明与页脚按钮 */
.devanning-import-upload :deep(.n-upload-file-list) {
  max-height: min(42vh, 400px);
  overflow-y: auto;
  overscroll-behavior: contain;
}

.import-mapping-scrollbar {
  max-height: min(44vh, 420px);
  min-height: 200px;
}
</style>
