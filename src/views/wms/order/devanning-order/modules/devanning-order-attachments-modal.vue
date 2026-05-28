<script setup lang="ts">
import { computed, h, ref, watch } from 'vue';
import type { DataTableColumns, UploadFileInfo } from 'naive-ui';
import { NButton, NCollapse, NCollapseItem, NDataTable, NModal, NSpace, NTag } from 'naive-ui';
import FileUpload from '@/components/custom/file-upload.vue';
import { fetchBatchDeleteOss, fetchGetOssListByIds } from '@/service/api/system/oss';
import { fetchUpdateDevanningOrderAttachments } from '@/service/api/wms/devanning-order';
import { useDownload } from '@/hooks/business/download';
import { $t } from '@/locales';

defineOptions({
  name: 'DevanningOrderAttachmentsModal'
});

const visible = defineModel<boolean>('visible', { default: false });

const props = defineProps<{
  orderId: CommonType.IdType | null;
  coNo?: string | null;
  attachmentOssIds?: string | null;
}>();

const fileList = ref<UploadFileInfo[]>([]);
const loading = ref(false);
const uploadRef = ref<typeof FileUpload>();

const { oss: downloadOss } = useDownload();

const tableColumns = computed<DataTableColumns<UploadFileInfo>>(() => [
  {
    key: 'name',
    title: $t('common.name'),
    minWidth: 220,
    render: row => row.name || '—'
  },
  {
    key: 'status',
    title: $t('common.status'),
    width: 110,
    render: row => {
      const s = row.status;
      return s === 'finished'
        ? h(NTag, { size: 'small', type: 'success' }, { default: () => 'OK' })
        : h(NTag, { size: 'small', type: 'warning' }, { default: () => '待上传' });
    }
  },
  {
    key: 'actions',
    title: $t('common.operate'),
    width: 240,
    render: row =>
      h('div', { class: 'flex items-center gap-6px' }, [
        h(
          NButton,
          {
            size: 'tiny',
            tertiary: true,
            disabled: row.status !== 'finished',
            onClick: () => {
              const url = (row as any).url as string | undefined;
              if (url) window.open(url, '_blank');
            }
          },
          { default: () => $t('common.preview') }
        ),
        h(
          NButton,
          {
            size: 'tiny',
            tertiary: true,
            disabled: row.status !== 'finished',
            onClick: () => handleDownload(row)
          },
          { default: () => $t('common.download') }
        ),
        h(
          NButton,
          {
            size: 'tiny',
            tertiary: true,
            type: 'error',
            onClick: () => handleRemoveRow(row)
          },
          { default: () => $t('common.delete') }
        )
      ])
  }
]);

const title = computed(() => {
  const co = String(props.coNo ?? '').trim();
  return co ? `${$t('page.wms.devanningOrder.attachmentsTitle')}（${co}）` : $t('page.wms.devanningOrder.attachmentsTitle');
});

/** 名称 + 状态 + 操作列宽约 570，略放宽避免横向裁切 */
const attachmentsTableScrollX = 600;

const ATTACHMENTS_COLLAPSE_NAME = 'attachments-list';

const attachmentsCollapseTitle = computed(() =>
  $t('page.wms.devanningOrder.attachmentsCollapseTitle', { count: fileList.value.length })
);

/** 拆柜订单附件：直连 POST .../attachments/upload，multipart 字段 `file`，响应 data 与 OSS 上传一致 */
const attachmentUploadAction = computed(() => `/wms/devanning-order/${props.orderId}/attachments/upload`);

function parseOssIds(raw: string | null | undefined): CommonType.IdType[] {
  const s = String(raw ?? '').trim();
  if (!s) return [];
  return s
    .split(',')
    .map(v => v.trim())
    .filter(Boolean);
}

function getFinishedOssIds() {
  return fileList.value
    .filter(f => f.status === 'finished')
    .map(f => String(f.id ?? '').trim())
    .filter(Boolean);
}

async function loadExisting() {
  const ids = parseOssIds(props.attachmentOssIds);
  if (!ids.length) {
    fileList.value = [];
    return;
  }
  loading.value = true;
  try {
    const { data, error } = await fetchGetOssListByIds(ids);
    if (error || !Array.isArray(data)) {
      fileList.value = [];
      return;
    }
    fileList.value = data.map(o => ({
      id: String(o.ossId),
      name: o.fileName ?? o.originalName ?? String(o.ossId),
      status: 'finished',
      url: o.url ?? undefined
    }));
  } finally {
    loading.value = false;
  }
}

/** 上传走 POST .../attachments/upload 已落库；仅在删除 OSS 后需把剩余 id 写回订单 */
async function syncOrderAttachmentIds(excludeOssId?: string) {
  if (props.orderId == null) return;
  let ids = getFinishedOssIds();
  if (excludeOssId) {
    ids = ids.filter(oid => oid !== excludeOssId);
  }
  const { error } = await fetchUpdateDevanningOrderAttachments(props.orderId, ids);
  if (error) return;
}

async function submitUpload() {
  uploadRef.value?.submit?.();
}

async function handleDownload(file: UploadFileInfo) {
  if (file.status !== 'finished') return;
  const id = String(file.id ?? '').trim();
  if (!id) return;
  await downloadOss(id);
}

async function handleRemoveRow(file: UploadFileInfo) {
  // 未上传：只删前端临时行
  if (file.status !== 'finished') {
    fileList.value = fileList.value.filter(f => f !== file);
    return;
  }
  const id = String(file.id ?? '').trim();
  if (!id) return;
  const { error } = await fetchBatchDeleteOss([id]);
  if (error) return;
  fileList.value = fileList.value.filter(f => String(f.id ?? '') !== id);
  await syncOrderAttachmentIds();
  window.$message?.success($t('common.deleteSuccess'));
}

watch(
  () => [visible.value, props.orderId, props.attachmentOssIds] as const,
  ([v]) => {
    if (v) void loadExisting();
  }
);
</script>

<template>
  <NModal
    v-model:show="visible"
    preset="card"
    :title="title"
    class="attachments-modal w-[min(760px,94vw)] max-w-94%"
    :bordered="false"
    :mask-closable="false"
  >
    <div class="flex flex-col gap-12px">
      <FileUpload
        ref="uploadRef"
        v-model:file-list="fileList"
        :action="attachmentUploadAction"
        :max="10"
        :show-tip="true"
        :show-file-list="false"
        :default-upload="false"
        accept=".jpg,.jpeg,.png,.gif,.bmp,.webp,.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.zip,.rar,.7z"
        @after-oss-delete="syncOrderAttachmentIds"
      />

      <NCollapse :default-expanded-names="[ATTACHMENTS_COLLAPSE_NAME]" display-directive="show">
        <NCollapseItem :name="ATTACHMENTS_COLLAPSE_NAME" :title="attachmentsCollapseTitle">
          <!-- 原生滚动容器：弹窗内表格内部 max-height 常被父级 overflow 吃掉，外层限定高度 + overflow-auto 最稳 -->
          <div
            class="attachments-table-scroll touch-pan-y overflow-x-auto overflow-y-auto overscroll-contain rounded-6px border border-[var(--n-border-color)]"
          >
            <NDataTable
              size="small"
              :data="fileList"
              :columns="tableColumns"
              :scroll-x="attachmentsTableScrollX"
            />
          </div>
        </NCollapseItem>
      </NCollapse>
    </div>

    <template #footer>
      <NSpace justify="end" :size="12">
        <NButton :disabled="loading" @click="visible = false">{{ $t('common.close') }}</NButton>
        <NButton :disabled="loading || props.orderId == null" @click="submitUpload">
          {{ $t('page.wms.devanningOrder.attachmentsUpload') }}
        </NButton>
      </NSpace>
    </template>
  </NModal>
</template>

<style scoped>
/* 必须同时给出 height，仅靠 max-height 时部分环境下子节点不溢出 → 不出现纵向滚动 */
.attachments-table-scroll {
  height: min(42vh, 360px);
  min-height: 120px;
  -webkit-overflow-scrolling: touch;
}

/* 避免卡片 preset 默认裁剪掉内部 overflow（否则外层 div 无法滚动） */
.attachments-modal :deep(.n-card__content) {
  overflow: visible;
}
</style>

