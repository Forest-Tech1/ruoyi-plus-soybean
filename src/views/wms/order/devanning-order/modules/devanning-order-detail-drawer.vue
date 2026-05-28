<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { useWindowSize } from '@vueuse/core';
import { fetchGetDevanningOrderDetail } from '@/service/api/wms/devanning-order';
import { useDevanningOrderExport } from '@/hooks/business/use-devanning-order-export';
import { $t } from '@/locales';
import SvgIcon from '@/components/custom/svg-icon.vue';
import DevanningOrderAttachmentsModal from './devanning-order-attachments-modal.vue';
import { getDevanningOrderAttachmentCount } from './devanning-order-attachment-utils';
import DevanningOrderDetailBasicTab from './devanning-order-detail-basic-tab.vue';
import DevanningOrderInboundPlanTab from './devanning-order-inbound-plan-tab.vue';

defineOptions({
  name: 'DevanningOrderDetailDrawer'
});

const visible = defineModel<boolean>('visible', { default: false });

const props = defineProps<{
  orderId: CommonType.IdType | null;
  /** 拆柜单导出成功后由列表页递增，用于刷新入库计划 Tab */
  inboundReloadNonce?: number;
}>();

const emit = defineEmits<{
  /** 拆柜单或卡板贴 Word 导出成功（与列表「更多」一致，便于父页刷新列表/入库计划） */
  exported: [];
  /** 基础信息字段保存成功 */
  updated: [];
}>();

const { width } = useWindowSize();
const drawerWidth = computed(() => Math.max(360, Math.floor((width.value * 2) / 3)));

const {
  canExportSheet,
  canExportPalletLabelWord,
  exportDevanningSheet,
  exportPalletLabelWord
} = useDevanningOrderExport();

const activeTab = ref<'basic' | 'inbound'>('basic');

const loading = ref(false);
const detail = ref<Api.Wms.DevanningOrder | null>(null);
const exportLoading = ref<'sheet' | 'pallet' | null>(null);

const attachmentsVisible = ref(false);

const detailLabelTag = computed(() => (detail.value?.labelTag ?? '').trim());
const showDetailTags = computed(() => Boolean(detail.value?.hasHold) || Boolean(detailLabelTag.value));
const attachmentCount = computed(() =>
  detail.value ? getDevanningOrderAttachmentCount(detail.value) : 0
);
const attachmentButtonLabel = computed(() =>
  attachmentCount.value > 0
    ? $t('page.wms.devanningOrder.attachmentsHas', { count: attachmentCount.value })
    : $t('page.wms.devanningOrder.attachmentsUpload')
);

async function loadDetail() {
  if (!props.orderId) {
    detail.value = null;
    return;
  }
  loading.value = true;
  try {
    const { data, error } = await fetchGetDevanningOrderDetail(props.orderId);
    if (!error) {
      detail.value = data;
    }
  } finally {
    loading.value = false;
  }
}

async function handleExportSheetClick() {
  if (!detail.value) return;
  exportLoading.value = 'sheet';
  try {
    const ok = await exportDevanningSheet(detail.value);
    if (!ok) return;
    emit('exported');
    await loadDetail();
  } finally {
    exportLoading.value = null;
  }
}

async function handleExportPalletWordClick() {
  if (!detail.value) return;
  exportLoading.value = 'pallet';
  try {
    const ok = await exportPalletLabelWord(detail.value);
    if (!ok) return;
    emit('exported');
    await loadDetail();
  } finally {
    exportLoading.value = null;
  }
}

async function onBasicUpdated() {
  await loadDetail();
  emit('updated');
}

watch(attachmentsVisible, v => {
  if (!v && visible.value && props.orderId) {
    void loadDetail();
    emit('updated');
  }
});

watch(visible, v => {
  if (v && props.orderId) {
    activeTab.value = 'basic';
    loadDetail();
  }
  if (!v) {
    activeTab.value = 'basic';
    exportLoading.value = null;
    attachmentsVisible.value = false;
  }
});
</script>

<template>
  <NDrawer v-model:show="visible" :width="drawerWidth" display-directive="show" class="max-w-full">
    <NDrawerContent :title="$t('page.wms.devanningOrder.detailTitle')" closable>
      <div
        v-if="detail"
        class="devanning-order-detail-drawer__toolbar mb-12px flex flex-wrap items-center gap-8px"
      >
        <div v-if="showDetailTags" class="inline-flex flex-wrap items-center gap-6px">
          <NTag v-if="detail.hasHold" size="small" type="warning">HOLD</NTag>
          <NTag v-if="detailLabelTag" size="small">{{ detailLabelTag }}</NTag>
        </div>
        <NButton
          v-if="canExportSheet"
          size="small"
          type="primary"
          secondary
          :loading="exportLoading === 'sheet'"
          :disabled="exportLoading === 'pallet'"
          @click="handleExportSheetClick"
        >
          {{ $t('page.wms.devanningOrder.exportSheet') }}
        </NButton>
        <NButton
          v-if="canExportPalletLabelWord"
          size="small"
          type="primary"
          secondary
          :loading="exportLoading === 'pallet'"
          :disabled="exportLoading === 'sheet'"
          @click="handleExportPalletWordClick"
        >
          {{ $t('page.wms.devanningOrder.palletLabelWord') }}
        </NButton>
        <NButton
          size="small"
          secondary
          :type="attachmentCount > 0 ? 'success' : 'primary'"
          @click="attachmentsVisible = true"
        >
          <span class="inline-flex items-center gap-4px">
            <SvgIcon icon="material-symbols:attach-file" class="text-16px" />
            <span>{{ attachmentButtonLabel }}</span>
          </span>
        </NButton>
      </div>
      <NSpin :show="loading" class="min-h-0 flex min-h-400px flex-1 flex-col">
        <NTabs v-model:value="activeTab" type="line" class="min-h-0 flex-1">
          <NTabPane name="basic" :tab="$t('page.wms.devanningOrder.detailTabBasic')">
            <DevanningOrderDetailBasicTab
              v-if="detail"
              :order="detail"
              @updated="onBasicUpdated"
              @open-attachments="attachmentsVisible = true"
            />
          </NTabPane>
          <NTabPane name="inbound" :tab="$t('page.wms.devanningOrder.detailTabInbound')">
            <div class="min-h-320px">
              <DevanningOrderInboundPlanTab
                v-if="activeTab === 'inbound' && props.orderId"
                :order-id="props.orderId"
                :co-no="detail?.coNo"
                :inbound-reload-nonce="inboundReloadNonce"
              />
            </div>
          </NTabPane>
        </NTabs>
      </NSpin>
    </NDrawerContent>
    <DevanningOrderAttachmentsModal
      v-model:visible="attachmentsVisible"
      :order-id="detail?.id ?? props.orderId"
      :co-no="detail?.coNo ?? null"
      :attachment-oss-ids="detail?.attachmentOssIds ?? null"
    />
  </NDrawer>
</template>

<style scoped></style>
