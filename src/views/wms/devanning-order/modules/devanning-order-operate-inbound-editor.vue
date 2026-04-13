<script setup lang="tsx">
import { computed } from 'vue';
import { NButton, NInput, NInputNumber } from 'naive-ui';
import { useWindowSize } from '@vueuse/core';
import { $t } from '@/locales';
import ButtonIcon from '@/components/custom/button-icon.vue';

defineOptions({
  name: 'DevanningOrderOperateInboundEditor'
});

type DraftRow = Api.Wms.DevanningInboundPlanCreateLine & { _key: string };

const lines = defineModel<DraftRow[]>('lines', { default: () => [] });

const { width } = useWindowSize();
const tableMaxHeight = computed(() => Math.min(420, Math.max(240, Math.floor(width.value * 0.32))));

function estimatedPalletFromVolume(volumeCbm: number | null | undefined) {
  if (volumeCbm == null || Number.isNaN(volumeCbm) || volumeCbm <= 0) return '—';
  return String(Math.ceil(volumeCbm / 2));
}

function addRow() {
  lines.value = [
    ...lines.value,
    {
      _key: crypto.randomUUID(),
      systemSoNo: null,
      shipmentCode: null,
      platform: null,
      warehouseCode: null,
      addressType: null,
      deliveryMethod: null,
      totalPieces: null,
      weight: null,
      volumeCbm: null,
      remark: null
    }
  ];
}

function removeRow(key: string) {
  lines.value = lines.value.filter(r => r._key !== key);
}

const columns = [
  {
    key: 'systemSoNo',
    title: $t('page.wms.devanningOrder.inboundPlan.systemSoNo'),
    minWidth: 120,
    render: (row: DraftRow) => (
      <NInput
        size="small"
        value={row.systemSoNo ?? ''}
        placeholder={$t('page.wms.devanningOrder.inboundPlan.systemSoNo')}
        onUpdateValue={v => (row.systemSoNo = v || null)}
      />
    )
  },
  {
    key: 'shipmentCode',
    title: $t('page.wms.devanningOrder.inboundPlan.shipmentCode'),
    minWidth: 120,
    render: (row: DraftRow) => (
      <NInput
        size="small"
        value={row.shipmentCode ?? ''}
        placeholder={$t('page.wms.devanningOrder.inboundPlan.shipmentCode')}
        onUpdateValue={v => (row.shipmentCode = v || null)}
      />
    )
  },
  {
    key: 'platform',
    title: $t('page.wms.devanningOrder.inboundPlan.platform'),
    width: 100,
    render: (row: DraftRow) => (
      <NInput
        size="small"
        value={row.platform ?? ''}
        placeholder={$t('page.wms.devanningOrder.inboundPlan.platform')}
        onUpdateValue={v => (row.platform = v || null)}
      />
    )
  },
  {
    key: 'warehouseCode',
    title: $t('page.wms.devanningOrder.inboundPlan.warehouseCode'),
    width: 110,
    render: (row: DraftRow) => (
      <NInput
        size="small"
        value={row.warehouseCode ?? ''}
        placeholder={$t('page.wms.devanningOrder.inboundPlan.warehouseCode')}
        onUpdateValue={v => (row.warehouseCode = v || null)}
      />
    )
  },
  {
    key: 'addressType',
    title: $t('page.wms.devanningOrder.inboundPlan.addressType'),
    width: 100,
    render: (row: DraftRow) => (
      <NInput
        size="small"
        value={row.addressType ?? ''}
        placeholder={$t('page.wms.devanningOrder.inboundPlan.addressType')}
        onUpdateValue={v => (row.addressType = v || null)}
      />
    )
  },
  {
    key: 'deliveryMethod',
    title: $t('page.wms.devanningOrder.inboundPlan.deliveryMethod'),
    width: 100,
    render: (row: DraftRow) => (
      <NInput
        size="small"
        value={row.deliveryMethod ?? ''}
        placeholder={$t('page.wms.devanningOrder.inboundPlan.deliveryMethod')}
        onUpdateValue={v => (row.deliveryMethod = v || null)}
      />
    )
  },
  {
    key: 'totalPieces',
    title: $t('page.wms.devanningOrder.inboundPlan.totalPieces'),
    width: 96,
    render: (row: DraftRow) => (
      <NInputNumber
        class="w-full"
        size="small"
        min={0}
        value={row.totalPieces ?? null}
        onUpdateValue={v => (row.totalPieces = v ?? null)}
      />
    )
  },
  {
    key: 'weight',
    title: $t('page.wms.devanningOrder.inboundPlan.weight'),
    width: 96,
    render: (row: DraftRow) => (
      <NInputNumber class="w-full" size="small" min={0} value={row.weight ?? null} onUpdateValue={v => (row.weight = v ?? null)} />
    )
  },
  {
    key: 'volumeCbm',
    title: $t('page.wms.devanningOrder.inboundPlan.volumeCbm'),
    width: 96,
    render: (row: DraftRow) => (
      <NInputNumber
        class="w-full"
        size="small"
        min={0}
        value={row.volumeCbm ?? null}
        onUpdateValue={v => (row.volumeCbm = v ?? null)}
      />
    )
  },
  {
    key: 'remark',
    title: $t('page.wms.devanningOrder.inboundPlan.lineRemark'),
    minWidth: 120,
    render: (row: DraftRow) => (
      <NInput
        type="textarea"
        size="small"
        rows={2}
        value={row.remark ?? ''}
        placeholder={$t('page.wms.devanningOrder.inboundPlan.lineRemark')}
        onUpdateValue={v => (row.remark = v || null)}
      />
    )
  },
  {
    key: 'estimatedPalletCount',
    title: $t('page.wms.devanningOrder.inboundPlan.estimatedPalletCount'),
    width: 100,
    render: (row: DraftRow) => (
      <span class="text-13px text-gray-600 dark:text-gray-400">{estimatedPalletFromVolume(row.volumeCbm)}</span>
    )
  },
  {
    key: 'operate',
    title: $t('common.operate'),
    width: 64,
    fixed: 'right' as const,
    render: (row: DraftRow) => (
      <ButtonIcon
        text
        type="error"
        icon="material-symbols:delete-outline"
        tooltipContent={$t('common.delete')}
        onClick={() => removeRow(row._key)}
      />
    )
  }
];

const scrollX = columns.reduce((acc, c: { width?: number; minWidth?: number }) => acc + Number(c.width ?? c.minWidth ?? 120), 0);

const summaryPieces = computed(() =>
  lines.value.reduce((s, r) => s + (typeof r.totalPieces === 'number' ? r.totalPieces : 0), 0)
);
const summaryCbm = computed(() =>
  lines.value.reduce((s, r) => s + (typeof r.volumeCbm === 'number' ? r.volumeCbm : 0), 0)
);
</script>

<template>
  <div class="flex flex-col gap-12px">
    <div class="text-13px text-gray-500 leading-relaxed dark:text-gray-400">
      {{ $t('page.wms.devanningOrder.createInboundHint') }}
    </div>
    <div class="flex flex-wrap items-center gap-12px rd-4px bg-gray-100 px-12px py-10px dark:bg-white/5">
      <div class="text-13px">
        <span class="text-gray-500">{{ $t('page.wms.devanningOrder.inboundPlan.summaryTotalPieces') }}：</span>
        <span class="font-500">{{ summaryPieces || '—' }}</span>
      </div>
      <div class="text-13px">
        <span class="text-gray-500">{{ $t('page.wms.devanningOrder.inboundPlan.summaryTotalCbm') }}：</span>
        <span class="font-500">{{ summaryCbm ? summaryCbm.toFixed(3) : '—' }}</span>
      </div>
      <NButton size="small" type="primary" secondary @click="addRow">
        <template #icon>
          <icon-material-symbols-add-rounded class="text-icon" />
        </template>
        {{ $t('page.wms.devanningOrder.addInboundPlanRow') }}
      </NButton>
    </div>
    <div class="min-h-240px overflow-x-auto">
      <DataTable
        :columns="columns"
        :data="lines"
        :row-key="row => row._key"
        :scroll-x="scrollX"
        :max-height="tableMaxHeight"
      />
    </div>
    <div class="text-12px text-gray-400 dark:text-gray-500">
      {{ $t('page.wms.devanningOrder.estimatedPalletAutoHint') }}
    </div>
  </div>
</template>
