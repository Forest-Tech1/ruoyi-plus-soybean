<script setup lang="tsx">
import { computed, h, reactive, ref, watch } from 'vue';
import { NDescriptions, NDescriptionsItem, NDrawer, NDrawerContent, NTag } from 'naive-ui';
import { useWindowSize } from '@vueuse/core';
import {
  fetchGetWarehouseLocationDetail,
  fetchGetWarehouseLocationInventoryDetailList
} from '@/service/api/wms/location';
import { fetchUpdateDevanningInboundPlanSystemPreLocation } from '@/service/api/wms/devanning-order';
import { WMS_DICT_DELIVERY_TYPE } from '@/constants/wms-devanning';
import DictTag from '@/components/custom/dict-tag.vue';
import { useDict } from '@/hooks/business/dict';
import { $t } from '@/locales';
import ButtonIcon from '@/components/custom/button-icon.vue';
import {
  getSystemPreLocationDisplayRows,
  parseSystemPreLocationAllocations,
  serializeSystemPreLocationAllocations
} from '@/utils/wms-devanning-pre-location';
import DevanningOrderInboundPreLocationModal from '@/views/wms/order/devanning-order/modules/devanning-order-inbound-pre-location-modal.vue';

defineOptions({
  name: 'WarehouseLocationDetailDrawer'
});

const visible = defineModel<boolean>('visible', { default: false });

const props = defineProps<{
  locationId: CommonType.IdType | null;
}>();

const emit = defineEmits<{
  updated: [];
}>();

useDict(WMS_DICT_DELIVERY_TYPE, true);

const { width } = useWindowSize();
const drawerWidth = computed(() => Math.max(720, Math.floor((width.value * 4) / 5)));

const loading = ref(false);
const detail = ref<Api.Wms.WarehouseLocation | null>(null);

const tableLoading = ref(false);
const tableData = ref<Api.Wms.WarehouseLocationInventoryDetailLine[]>([]);
const pagination = reactive({
  page: 1,
  pageSize: 10,
  itemCount: 0,
  showSizePicker: true,
  pageSizes: [10, 20, 50],
  prefix: (p: { itemCount?: number }) => $t('datatable.itemCount', { total: p.itemCount ?? 0 }),
  onUpdatePage: (page: number) => {
    pagination.page = page;
    loadTable();
  },
  onUpdatePageSize: (pageSize: number) => {
    pagination.pageSize = pageSize;
    pagination.page = 1;
    loadTable();
  }
});

function renderSystemPreLocation(row: Api.Wms.WarehouseLocationInventoryDetailLine) {
  const alloc = parseSystemPreLocationAllocations(row.systemPreLocation ?? undefined);
  if (!alloc.length) return <span class="text-gray-400">—</span>;
  const rowsText = getSystemPreLocationDisplayRows(
    alloc,
    p => $t('page.wms.devanningOrder.inboundPlan.preLocationLine', p),
    $t('page.wms.devanningOrder.inboundPlan.preLocationMore')
  );
  const tip = alloc
    .map((l, i) =>
      $t('page.wms.devanningOrder.inboundPlan.preLocationLine', {
        index: i + 1,
        location: l.locationCode,
        pallets: l.palletCount
      })
    )
    .join('\n');
  return (
    <div class="text-12px leading-snug whitespace-pre-line" title={tip}>
      {rowsText.join('\n')}
    </div>
  );
}

const columns = computed(() => [
  {
    key: 'systemPreLocation',
    title: $t('page.wms.devanningOrder.inboundPlan.systemPreLocation'),
    minWidth: 168,
    render: (row: Api.Wms.WarehouseLocationInventoryDetailLine) => renderSystemPreLocation(row)
  },
  {
    key: 'palletCount',
    title: $t('page.wms.inventory.location.currentStock'),
    width: 90,
    render: (row: Api.Wms.WarehouseLocationInventoryDetailLine) => row.palletCount ?? '—'
  },
  {
    key: 'totalPalletCount',
    title: $t('page.wms.inventory.location.totalPalletCount'),
    width: 110,
    render: (row: Api.Wms.WarehouseLocationInventoryDetailLine) => row.totalPalletCount ?? '—'
  },
  { key: 'coNo', title: $t('page.wms.devanningOrder.coNo'), width: 130, ellipsis: { tooltip: true } },
  {
    key: 'systemSoNo',
    title: $t('page.wms.devanningOrder.inboundPlan.systemSoNo'),
    width: 140,
    ellipsis: { tooltip: true }
  },
  {
    key: 'shipmentCode',
    title: $t('page.wms.devanningOrder.inboundPlan.shipmentCode'),
    width: 140,
    ellipsis: { tooltip: true }
  },
  { key: 'platform', title: $t('page.wms.devanningOrder.inboundPlan.platform'), width: 100, ellipsis: { tooltip: true } },
  {
    key: 'warehouseCode',
    title: $t('page.wms.devanningOrder.inboundPlan.warehouseCode'),
    width: 120,
    ellipsis: { tooltip: true }
  },
  {
    key: 'addressType',
    title: $t('page.wms.devanningOrder.inboundPlan.addressType'),
    width: 110,
    ellipsis: { tooltip: true }
  },
  {
    key: 'deliveryMethod',
    title: $t('page.wms.devanningOrder.inboundPlan.deliveryMethod'),
    width: 120,
    render: (row: Api.Wms.WarehouseLocationInventoryDetailLine) => {
      const v = String(row.deliveryMethod ?? '').trim();
      return v ? h(DictTag, { value: v, dictCode: WMS_DICT_DELIVERY_TYPE, immediate: true }) : '—';
    }
  },
  {
    key: 'hold',
    title: 'HOLD',
    width: 72,
    render: (row: Api.Wms.WarehouseLocationInventoryDetailLine) => {
      return row.hold ? <NTag size="small" type="warning">HOLD</NTag> : '—';
    }
  },
  { key: 'totalPieces', title: $t('page.wms.devanningOrder.inboundPlan.totalPieces'), width: 90 },
  { key: 'weight', title: $t('page.wms.devanningOrder.inboundPlan.weight'), width: 90 },
  { key: 'volumeCbm', title: $t('page.wms.devanningOrder.inboundPlan.volumeCbm'), width: 96 },
  { key: 'remark', title: $t('page.wms.devanningOrder.inboundPlan.lineRemark'), minWidth: 140, ellipsis: { tooltip: true } },
  { key: 'createTime', title: $t('page.wms.inventory.warehouseArea.createTime'), width: 160, ellipsis: { tooltip: true } },
  {
    key: 'operate',
    title: $t('common.operate'),
    width: 96,
    fixed: 'right' as const,
    render: (row: Api.Wms.WarehouseLocationInventoryDetailLine) => (
      <div class="flex-center flex-wrap gap-8px">
        <ButtonIcon
          text
          type="primary"
          icon="material-symbols:edit-outline"
          tooltipContent={$t('common.edit')}
          onClick={() => openPreLocationEdit(row)}
        />
        <ButtonIcon
          text
          type="error"
          icon="material-symbols:delete-outline"
          tooltipContent={$t('common.delete')}
          popconfirmContent={$t('common.confirmDelete')}
          onPositiveClick={() => handleDeleteAllocation(row)}
        />
      </div>
    )
  }
]);

const scrollX = computed(() => columns.value.reduce((acc, c: any) => acc + Number(c.width ?? c.minWidth ?? 120), 0));

async function loadDetail() {
  if (!props.locationId) {
    detail.value = null;
    return;
  }
  loading.value = true;
  try {
    const { data, error } = await fetchGetWarehouseLocationDetail(props.locationId);
    if (!error) detail.value = data;
  } finally {
    loading.value = false;
  }
}

async function loadTable() {
  if (!props.locationId) {
    tableData.value = [];
    pagination.itemCount = 0;
    return;
  }
  tableLoading.value = true;
  try {
    const { data, error } = await fetchGetWarehouseLocationInventoryDetailList(props.locationId, {
      pageNum: pagination.page,
      pageSize: pagination.pageSize
    });
    if (error) {
      tableData.value = [];
      pagination.itemCount = 0;
      return;
    }
    tableData.value = data?.rows ?? [];
    pagination.itemCount = Number(data?.total) || 0;
    if (data?.location && detail.value) {
      detail.value = { ...detail.value, ...data.location };
    }
  } finally {
    tableLoading.value = false;
  }
}

watch(
  () => visible.value,
  v => {
    if (v) {
      pagination.page = 1;
      void loadDetail();
      void loadTable();
    }
  }
);

watch(
  () => props.locationId,
  () => {
    if (visible.value) {
      pagination.page = 1;
      void loadDetail();
      void loadTable();
    }
  }
);

const preLocationVisible = ref(false);
const preLocationOrderId = ref<CommonType.IdType | null>(null);
const preLocationPlan = ref<Api.Wms.DevanningInboundPlan | null>(null);

function openPreLocationEdit(row: Api.Wms.WarehouseLocationInventoryDetailLine) {
  preLocationOrderId.value = row.orderId;
  preLocationPlan.value = {
    id: row.inboundPlanId,
    orderId: row.orderId,
    coNo: row.coNo ?? undefined,
    systemSoNo: row.systemSoNo ?? undefined,
    shipmentCode: row.shipmentCode ?? undefined,
    platform: row.platform ?? undefined,
    warehouseCode: row.warehouseCode ?? undefined,
    deliveryMethod: row.deliveryMethod ?? undefined,
    systemPreLocation: row.systemPreLocation ?? undefined
  } as Api.Wms.DevanningInboundPlan;
  preLocationVisible.value = true;
}

async function handleDeleteAllocation(row: Api.Wms.WarehouseLocationInventoryDetailLine) {
  const loc = String(detail.value?.locationCode ?? '').trim();
  const target = loc;
  if (!target) {
    window.$message?.warning($t('common.failed'));
    return;
  }

  const alloc = parseSystemPreLocationAllocations(row.systemPreLocation ?? undefined);
  const next = alloc.filter(a => a.locationCode !== target);
  const payload = serializeSystemPreLocationAllocations(next);

  const { error } = await fetchUpdateDevanningInboundPlanSystemPreLocation({
    id: row.inboundPlanId,
    orderId: row.orderId,
    systemPreLocation: payload
  });
  if (error) return;
  window.$message?.success($t('common.updateSuccess'));
  await loadDetail();
  await loadTable();
  emit('updated');
}

function onPreLocationSaved() {
  void loadDetail();
  void loadTable();
  emit('updated');
}
</script>

<template>
  <NDrawer v-model:show="visible" :width="drawerWidth" display-directive="show" class="max-w-full">
    <NDrawerContent :title="$t('page.wms.inventory.location.detailTitle')" closable>
      <NSpin :show="loading" class="min-h-0 flex min-h-400px flex-1 flex-col">
        <div class="flex flex-col gap-12px">
          <NDescriptions v-if="detail" label-placement="left" bordered :column="1" size="small">
            <NDescriptionsItem :label="$t('page.wms.inventory.location.location')">
              {{ detail.locationCode || '—' }}
            </NDescriptionsItem>
            <NDescriptionsItem :label="$t('page.wms.inventory.location.rowRank')">
              {{ detail.rowRank ?? '—' }}
            </NDescriptionsItem>
            <NDescriptionsItem :label="$t('page.wms.inventory.location.columnRank')">
              {{ detail.columnRank ?? '—' }}
            </NDescriptionsItem>
            <NDescriptionsItem :label="$t('page.wms.inventory.location.capacity')">
              {{ detail.capacity ?? '—' }}
            </NDescriptionsItem>
            <NDescriptionsItem :label="$t('page.wms.inventory.location.currentStock')">
              {{ detail.currentStock ?? '—' }}
            </NDescriptionsItem>
            <NDescriptionsItem :label="$t('page.wms.inventory.location.remainingCapacity')">
              {{ detail.remainingCapacity ?? '—' }}
            </NDescriptionsItem>
          </NDescriptions>

          <div class="min-h-320px overflow-x-auto overflow-y-hidden">
            <DataTable
              :columns="columns"
              :data="tableData"
              :loading="tableLoading"
              :scroll-x="scrollX"
              :pagination="pagination"
              remote
              class="min-h-280px"
            />
          </div>
        </div>
      </NSpin>

      <DevanningOrderInboundPreLocationModal
        v-model:visible="preLocationVisible"
        :order-id="preLocationOrderId"
        :plan="preLocationPlan"
        @saved="onPreLocationSaved"
      />
    </NDrawerContent>
  </NDrawer>
</template>

<style scoped></style>

