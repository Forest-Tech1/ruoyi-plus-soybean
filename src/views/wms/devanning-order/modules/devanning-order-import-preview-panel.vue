<script setup lang="ts">
import { computed } from 'vue';
import { NDataTable, NDescriptions, NDescriptionsItem, NScrollbar } from 'naive-ui';
import { WMS_DICT_DEVANNING_ROUND, WMS_DICT_ORDER_LEVEL } from '@/constants/wms-devanning';
import DictTag from '@/components/custom/dict-tag.vue';
import { $t } from '@/locales';

defineOptions({
  name: 'DevanningOrderImportPreviewPanel'
});

const props = defineProps<{
  items: Api.Wms.DevanningOrderImportPreviewItem[];
}>();

const selectedPreviewId = defineModel<string | null>('selectedPreviewId', { default: null });

const selected = computed(() => props.items.find(i => i.previewId === selectedPreviewId.value) ?? null);

type PlanRow = Api.Wms.DevanningInboundPlanPreviewLine;

const inboundColumns = computed(() => [
  {
    key: 'systemSoNo',
    title: $t('page.wms.devanningOrder.inboundPlan.systemSoNo'),
    minWidth: 110,
    ellipsis: { tooltip: true }
  },
  {
    key: 'shipmentCode',
    title: $t('page.wms.devanningOrder.inboundPlan.shipmentCode'),
    minWidth: 110,
    ellipsis: { tooltip: true }
  },
  {
    key: 'platform',
    title: $t('page.wms.devanningOrder.inboundPlan.platform'),
    width: 88
  },
  {
    key: 'warehouseCode',
    title: $t('page.wms.devanningOrder.inboundPlan.warehouseCode'),
    width: 100
  },
  {
    key: 'addressType',
    title: $t('page.wms.devanningOrder.inboundPlan.addressType'),
    width: 96
  },
  {
    key: 'deliveryMethod',
    title: $t('page.wms.devanningOrder.inboundPlan.deliveryMethod'),
    width: 100
  },
  {
    key: 'totalPieces',
    title: $t('page.wms.devanningOrder.inboundPlan.totalPieces'),
    width: 80
  },
  {
    key: 'weight',
    title: $t('page.wms.devanningOrder.inboundPlan.weight'),
    width: 72
  },
  {
    key: 'volumeCbm',
    title: $t('page.wms.devanningOrder.inboundPlan.volumeCbm'),
    width: 88
  },
  {
    key: 'estimatedPalletCount',
    title: $t('page.wms.devanningOrder.inboundPlan.estimatedPalletCount'),
    width: 96,
    render: (row: PlanRow) => {
      const v = row.estimatedPalletCount;
      return v != null && !Number.isNaN(Number(v)) ? String(v) : '—';
    }
  },
  {
    key: 'remark',
    title: $t('page.wms.devanningOrder.inboundPlan.lineRemark'),
    minWidth: 96,
    ellipsis: { tooltip: true }
  }
]);

const scrollX = computed(() =>
  inboundColumns.value.reduce(
    (acc, c: { width?: number; minWidth?: number }) => acc + Number(c.width ?? c.minWidth ?? 100),
    0
  )
);

/** 带稳定行键，满足 DataTable row-key 仅接收行对象 */
const inboundRowsForTable = computed(() => {
  const pid = selected.value?.previewId ?? 'p';
  return (selected.value?.order.inboundPlans ?? []).map((r, i) => ({
    ...r,
    __importPreviewRowKey: `${pid}-${i}`
  }));
});

function inboundRowKey(row: PlanRow & { __importPreviewRowKey?: string }) {
  return row.__importPreviewRowKey ?? `${selected.value?.previewId ?? 'p'}-0`;
}
</script>

<template>
  <div class="flex min-h-[min(62vh,560px)] gap-16px overflow-hidden">
    <!-- 左侧：基础 + 入库计划（按需求：点击右侧柜号后此处展示） -->
    <div
      class="flex min-h-[min(62vh,560px)] min-w-0 flex-1 flex-col overflow-hidden border border-[var(--n-border-color)] rd-8px"
    >
      <template v-if="selected">
        <NScrollbar class="h-full max-h-[min(62vh,560px)]" trigger="hover">
          <div class="p-16px">
            <div class="mb-12px text-14px font-600">
              {{ $t('page.wms.devanningOrder.detailTabBasic') }}
            </div>
            <NDescriptions label-placement="left" :column="1" bordered size="small" class="preview-basic-desc">
              <NDescriptionsItem :label="$t('page.wms.devanningOrder.coNo')">
                {{ selected.order.coNo || '—' }}
              </NDescriptionsItem>
              <NDescriptionsItem :label="$t('page.wms.devanningOrder.blNo')">
                {{ selected.order.blNo || '—' }}
              </NDescriptionsItem>
              <NDescriptionsItem :label="$t('page.wms.devanningOrder.orderDate')">
                {{ selected.order.orderDate || '—' }}
              </NDescriptionsItem>
              <NDescriptionsItem :label="$t('page.wms.devanningOrder.expectedDevanningTime')">
                {{
                  selected.order.expectedDevanningTime ? String(selected.order.expectedDevanningTime).slice(0, 10) : '—'
                }}
              </NDescriptionsItem>
              <NDescriptionsItem :label="$t('page.wms.devanningOrder.devanningRound')">
                <DictTag
                  v-if="selected.order.devanningRound"
                  :dict-code="WMS_DICT_DEVANNING_ROUND"
                  :value="selected.order.devanningRound"
                  immediate
                />
                <template v-else>—</template>
              </NDescriptionsItem>
              <NDescriptionsItem :label="$t('page.wms.devanningOrder.orderLevel')">
                <DictTag
                  v-if="selected.order.orderLevel"
                  :dict-code="WMS_DICT_ORDER_LEVEL"
                  :value="selected.order.orderLevel"
                  immediate
                />
                <template v-else>—</template>
              </NDescriptionsItem>
              <NDescriptionsItem :label="$t('page.wms.devanningOrder.inboundWarehouse')">
                {{ selected.order.inboundWarehouse || '—' }}
              </NDescriptionsItem>
              <NDescriptionsItem :label="$t('page.wms.devanningOrder.devanningDock')">
                {{ selected.order.devanningDock || '—' }}
              </NDescriptionsItem>
              <NDescriptionsItem :label="$t('page.wms.devanningOrder.cargoQty')">
                {{ selected.order.cargoQty ?? '—' }}
              </NDescriptionsItem>
              <NDescriptionsItem :label="$t('page.wms.devanningOrder.cargoWeight')">
                {{ selected.order.cargoWeight ?? '—' }}
              </NDescriptionsItem>
              <NDescriptionsItem :label="$t('page.wms.devanningOrder.remarkColumn')">
                {{ selected.order.remark || '—' }}
              </NDescriptionsItem>
            </NDescriptions>

            <div class="mb-12px mt-20px text-14px font-600">
              {{ $t('page.wms.devanningOrder.detailTabInbound') }}
            </div>
            <NDataTable
              size="small"
              :columns="inboundColumns"
              :data="inboundRowsForTable"
              :row-key="inboundRowKey"
              :scroll-x="scrollX"
              :max-height="280"
              striped
            />
          </div>
        </NScrollbar>
      </template>
      <div
        v-else
        class="flex min-h-[200px] flex-1 items-center justify-center text-13px text-gray-400 dark:text-gray-500"
      >
        {{ $t('page.wms.devanningOrder.importPreviewPickCoNo') }}
      </div>
    </div>

    <!-- 右侧：柜号 / 来源文件 -->
    <div
      class="flex w-248px shrink-0 flex-col overflow-hidden border border-[var(--n-border-color)] rd-8px bg-gray-50/80 dark:bg-white/5"
    >
      <div
        class="shrink-0 border-b border-[var(--n-border-color)] px-12px py-10px text-13px font-600 text-gray-700 dark:text-gray-200"
      >
        {{ $t('page.wms.devanningOrder.importPreviewCoList') }}
      </div>
      <NScrollbar class="min-h-0 flex-1" trigger="hover">
        <div class="flex flex-col gap-6px p-10px">
          <button
            v-for="item in items"
            :key="item.previewId"
            type="button"
            class="w-full cursor-pointer border-0 bg-transparent text-left rd-6px px-10px py-10px transition-colors"
            :class="
              selectedPreviewId === item.previewId
                ? 'bg-primary/14 text-primary font-500 ring-1 ring-primary/35'
                : 'hover:bg-black/5 dark:hover:bg-white/10'
            "
            @click="selectedPreviewId = item.previewId"
          >
            <div class="truncate text-14px leading-tight">
              {{ item.order.coNo || $t('page.wms.devanningOrder.importPreviewNoCoNo') }}
            </div>
            <div class="mt-4px truncate text-12px text-gray-500 dark:text-gray-400" :title="item.sourceFileName">
              {{ item.sourceFileName || '—' }}
            </div>
          </button>
        </div>
      </NScrollbar>
    </div>
  </div>
</template>

<style scoped>
.preview-basic-desc :deep(.n-descriptions-table-content__content) {
  word-break: break-word;
}
</style>
