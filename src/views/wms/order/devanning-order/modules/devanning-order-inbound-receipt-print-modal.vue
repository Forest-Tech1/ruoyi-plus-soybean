<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import dayjs from 'dayjs';
import QRCode from 'qrcode';
import { NButton, NModal, NSpin } from 'naive-ui';
import {
  fetchGetDevanningInboundPlanList,
  fetchGetDevanningInboundReceiptPrintData,
  fetchMarkDevanningInboundReceiptPrinted
} from '@/service/api/wms/devanning-order';
import {
  buildInboundReceiptPrintModelFromPlans,
  buildInboundReceiptPrintSrcdoc,
  type WmsInboundReceiptPrintModel
} from '@/utils/wms-inbound-receipt-print';
import { $t } from '@/locales';

defineOptions({
  name: 'DevanningOrderInboundReceiptPrintModal'
});

const visible = defineModel<boolean>('visible', { default: false });

const props = defineProps<{
  orderId: CommonType.IdType | null;
  coNo?: string | null;
}>();

const emit = defineEmits<{
  printed: [];
}>();

const loading = ref(false);
const printModel = ref<WmsInboundReceiptPrintModel | null>(null);
const qrDataUrl = ref('');
const iframeRef = ref<HTMLIFrameElement | null>(null);

const tableLabels = computed(() => ({
  warehouseCode: $t('page.wms.devanningOrder.inboundReceipt.warehouseCode'),
  recommendedLocation: $t('page.wms.devanningOrder.inboundReceipt.recommendedLocation'),
  actualLocation: $t('page.wms.devanningOrder.inboundReceipt.actualLocation'),
  boxCount: $t('page.wms.devanningOrder.inboundReceipt.boxCount'),
  title: $t('page.wms.devanningOrder.inboundReceipt.title'),
  emptyRow: $t('page.wms.devanningOrder.inboundReceipt.emptyRow')
}));

const srcdoc = computed(() => {
  if (!printModel.value || !qrDataUrl.value) return '';
  return buildInboundReceiptPrintSrcdoc({
    model: printModel.value,
    qrDataUrl: qrDataUrl.value,
    tableLabels: tableLabels.value
  });
});

function normalizeApiPrintData(data: Api.Wms.DevanningInboundReceiptPrintData): WmsInboundReceiptPrintModel {
  const rows = (data.rows ?? []).map(r => ({
    inboundPlanId: r.inboundPlanId,
    systemSoNo: r.systemSoNo ?? null,
    palletSeq: r.palletSeq,
    warehouseCodeLabel: String(r.warehouseCodeLabel ?? ''),
    recommendedLocation: r.recommendedLocation ?? null,
    actualLocation: null,
    boxCount: null
  }));
  return {
    orderId: data.orderId,
    coNo: String(data.coNo ?? ''),
    printDate: String(data.printDate ?? dayjs().format('MM/DD/YYYY')),
    qrContent: String(data.qrContent ?? data.coNo ?? ''),
    rows,
    totalPalletCount: data.totalPalletCount ?? rows.length
  };
}

async function loadPrintModel(): Promise<WmsInboundReceiptPrintModel | null> {
  const orderId = props.orderId;
  if (orderId == null) return null;

  const printDate = dayjs().format('MM/DD/YYYY');

  const { data, error } = await fetchGetDevanningInboundReceiptPrintData(orderId);
  if (data && !error) {
    return normalizeApiPrintData(data);
  }

  const { data: planPage, error: planError } = await fetchGetDevanningInboundPlanList(orderId, {
    pageNum: 1,
    pageSize: 9999
  });
  if (planError || !planPage?.rows?.length) {
    return buildInboundReceiptPrintModelFromPlans(orderId, props.coNo ?? '', printDate, []);
  }

  return buildInboundReceiptPrintModelFromPlans(orderId, props.coNo ?? '', printDate, planPage.rows);
}

async function preparePrint() {
  if (props.orderId == null) return;

  loading.value = true;
  printModel.value = null;
  qrDataUrl.value = '';

  try {
    const model = await loadPrintModel();
    if (!model) {
      window.$message?.error($t('page.wms.devanningOrder.inboundReceipt.loadFailed'));
      visible.value = false;
      return;
    }
    if (model.totalPalletCount === 0) {
      window.$message?.warning($t('page.wms.devanningOrder.inboundReceipt.noPallets'));
      visible.value = false;
      return;
    }

    const qr = await QRCode.toDataURL(model.qrContent || model.coNo, {
      width: 192,
      margin: 1,
      errorCorrectionLevel: 'M'
    });

    printModel.value = model;
    qrDataUrl.value = qr;
  } catch {
    window.$message?.error($t('page.wms.devanningOrder.inboundReceipt.loadFailed'));
    visible.value = false;
  } finally {
    loading.value = false;
  }
}

async function markPrintedIfNeeded() {
  const orderId = props.orderId;
  if (orderId == null) return;
  const { error } = await fetchMarkDevanningInboundReceiptPrinted(orderId);
  if (!error) {
    emit('printed');
  }
}

function handlePrint() {
  const w = iframeRef.value?.contentWindow;
  if (!w) {
    window.$message?.warning($t('page.wms.devanningOrder.inboundReceipt.printFailed'));
    return;
  }

  const onAfterPrint = () => {
    void markPrintedIfNeeded();
  };

  try {
    w.addEventListener('afterprint', onAfterPrint, { once: true });
  } catch {
    // ignore
  }

  w.focus();
  w.print();
}

watch(visible, v => {
  if (v) {
    void preparePrint();
  } else {
    printModel.value = null;
    qrDataUrl.value = '';
  }
});
</script>

<template>
  <NModal
    v-model:show="visible"
    preset="card"
    :title="$t('page.wms.devanningOrder.inboundReceipt.modalTitle')"
    class="w-900px max-w-[96vw]"
    :bordered="false"
    :mask-closable="!loading"
    :closable="!loading"
  >
    <NSpin :show="loading">
      <div class="min-h-360px">
        <iframe
          v-if="srcdoc"
          ref="iframeRef"
          class="h-480px w-full border border-gray-200 rd-4px bg-white"
          :srcdoc="srcdoc"
          title="inbound-receipt-print-preview"
        />
        <div v-else-if="!loading" class="flex h-360px items-center justify-center text-gray-400">
          {{ $t('page.wms.devanningOrder.inboundReceipt.emptyPreview') }}
        </div>
      </div>
    </NSpin>
    <template #footer>
      <div class="flex justify-end gap-12px">
        <NButton @click="visible = false">{{ $t('common.cancel') }}</NButton>
        <NButton type="primary" :disabled="loading || !srcdoc" @click="handlePrint">
          {{ $t('page.wms.devanningOrder.inboundReceipt.print') }}
        </NButton>
      </div>
    </template>
  </NModal>
</template>
