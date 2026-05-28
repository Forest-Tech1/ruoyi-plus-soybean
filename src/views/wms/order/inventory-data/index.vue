<script setup lang="tsx">
import { computed, h, onMounted, reactive, ref, watch } from 'vue';
import {
  NBadge,
  NButton,
  NCard,
  NCollapse,
  NCollapseItem,
  NDataTable,
  NDatePicker,
  NForm,
  NFormItem,
  NFormItemGi,
  NGrid,
  NInput,
  NInputNumber,
  NModal,
  NSpace,
  NTag,
  NTooltip
} from 'naive-ui';
import { defaultTransform, useNaivePaginatedTable } from '@/hooks/common/table';
import { fetchGetWarehouseInventoryDataList, fetchUpdateWarehouseInventoryData } from '@/service/api/wms/inventory-data';
import { fetchUpdateDevanningInboundPlanSystemPreLocation } from '@/service/api/wms/devanning-order';
import { useDict } from '@/hooks/business/dict';
import { WMS_DICT_DELIVERY_TYPE } from '@/constants/wms-devanning';
import DictSelect from '@/components/custom/dict-select.vue';
import DictTag from '@/components/custom/dict-tag.vue';
import { $t } from '@/locales';
import ButtonIcon from '@/components/custom/button-icon.vue';
import SvgIcon from '@/components/custom/svg-icon.vue';
import DevanningOrderPreLocationMapPickerModal from '@/views/wms/order/devanning-order/modules/devanning-order-pre-location-map-picker-modal.vue';
import {
  mergePreLocationAfterInventoryLocationChange,
  setPalletCountInPreLocationForLocation,
  type WmsPreLocationAllocation
} from '@/utils/wms-devanning-pre-location';
import InventoryDataOutstockModal from './modules/inventory-data-outstock-modal.vue';
import InventoryDataManualOutstockModal from './modules/inventory-data-manual-outstock-modal.vue';
import InventoryDataExistingImportModal from './modules/inventory-data-existing-import-modal.vue';
import InventoryDataExistingImportTasksModal from './modules/inventory-data-existing-import-tasks-modal.vue';
import { useWmsExistingImportTaskStore } from '@/store/modules/wms-existing-import-task';
import { storeToRefs } from 'pinia';

defineOptions({
  name: 'WarehouseInventoryData'
});

useDict(WMS_DICT_DELIVERY_TYPE, true);

const searchParams = ref<Api.Wms.WarehouseInventoryDataSearchParams>({
  pageNum: 1,
  pageSize: 10,
  orderTimeBegin: null,
  orderTimeEnd: null,
  devanningCompleteBegin: null,
  devanningCompleteEnd: null,
  systemSoNo: null,
  coNo: null,
  shipmentCode: null,
  zoneCode: null,
  locationCode: null,
  deliveryAddress: null,
  platform: null,
  deliveryMethod: null,
  orderByColumn: 'createTime',
  isAsc: 'desc'
});

const orderTimeRange = ref<[string, string] | null>(null);
const devanningCompleteTimeRange = ref<[string, string] | null>(null);

const outstockVisible = ref(false);
const manualOutstockVisible = ref(false);
const manualOutstockRow = ref<Api.Wms.WarehouseInventoryDataLine | null>(null);
const existingImportVisible = ref(false);
const existingImportTasksVisible = ref(false);

const existingImportTaskStore = useWmsExistingImportTaskStore();
const { runningCount, unreadTerminalCount } = storeToRefs(existingImportTaskStore);

onMounted(() => {
  existingImportTaskStore.resumePollingIfNeeded();
});

const editVisible = ref(false);
const editLoading = ref(false);
const editingRow = ref<Api.Wms.WarehouseInventoryDataLine | null>(null);

const editModel = reactive<Api.Wms.WarehouseInventoryDataUpdateBody>({
  inventoryDetailId: 0 as unknown as CommonType.IdType,
  palletCount: null,
  deliveryAddress: null,
  platform: null,
  deliveryMethod: null
});

const getDataRef = ref<(() => Promise<void>) | null>(null);
const editCell = ref<string | null>(null);
const palletDraft = reactive<Record<string, number>>({});
const locationMapVisible = ref(false);
const locationMapRow = ref<Api.Wms.WarehouseInventoryDataLine | null>(null);

const editableCellReadonlyCls =
  'flex min-h-30px max-w-full min-w-0 cursor-text items-center justify-start rd-4px px-2px op-transition hover:bg-[var(--n-merged-hover-color)]';

function editableColumnTitleWithHint(labelKey: App.I18n.I18nKey, hintKey: App.I18n.I18nKey) {
  return () => (
    <div class="inline-flex max-w-full items-center justify-start gap-4px whitespace-nowrap leading-none">
      <span class="text-13px font-600 whitespace-nowrap">{$t(labelKey)}</span>
      <NTooltip placement="top">
        {{
          default: () => $t(hintKey),
          trigger: () => (
            <span class="inline-flex shrink-0 cursor-default text-primary op-80 hover-op-100">
              {h(SvgIcon, { icon: 'material-symbols:edit-square-outline', class: 'text-15px' })}
            </span>
          )
        }}
      </NTooltip>
    </div>
  );
}

const locationMapPlanSlice = computed((): Api.Wms.DevanningInboundPlan | null => {
  const r = locationMapRow.value;
  if (!r?.inboundPlanId) return null;
  return {
    id: r.inboundPlanId,
    orderId: r.orderId,
    coNo: r.coNo ?? undefined,
    systemSoNo: r.systemSoNo ?? undefined,
    shipmentCode: r.shipmentCode ?? undefined,
    platform: r.platform ?? undefined,
    warehouseCode: r.warehouseCode ?? undefined,
    deliveryMethod: r.deliveryMethod ?? undefined,
    estimatedPalletCount: r.palletCount ?? undefined
  } as Api.Wms.DevanningInboundPlan;
});

const locationMapInventoryBanner = computed(() => {
  const r = locationMapRow.value;
  if (!r) return null;
  return {
    orderNo: String(r.systemSoNo ?? '').trim() || '—',
    currentLocation: String(r.locationCode ?? '').trim() || '—',
    palletCount: r.palletCount != null ? String(r.palletCount) : '—'
  };
});

const locationMapPickInitial = computed(() => {
  const r = locationMapRow.value;
  if (r?.palletCount == null || Number.isNaN(Number(r.palletCount))) return 1;
  return Math.max(0, Math.floor(Number(r.palletCount)));
});

async function trySyncInboundPlanPreLocationPallet(row: Api.Wms.WarehouseInventoryDataLine, newPalletCount: number) {
  if (row.inboundPlanId == null || row.orderId == null) return true;
  const json = setPalletCountInPreLocationForLocation(row.systemPreLocation, row.locationCode, newPalletCount);
  if (json == null) return true;
  const { error } = await fetchUpdateDevanningInboundPlanSystemPreLocation({
    id: row.inboundPlanId,
    orderId: row.orderId,
    systemPreLocation: json
  });
  return !error;
}

function openLocationMap(row: Api.Wms.WarehouseInventoryDataLine) {
  if (row.inventoryDetailId == null) {
    window.$message?.warning($t('page.wms.inventoryData.missingInventoryDetailId'));
    return;
  }
  locationMapRow.value = row;
  locationMapVisible.value = true;
}

async function onLocationMapConfirm(rows: WmsPreLocationAllocation[]) {
  const row = locationMapRow.value;
  if (!row?.inventoryDetailId) return;
  if (rows.length !== 1) {
    window.$message?.warning($t('page.wms.inventoryData.preLocationPickNeedExactlyOne'));
    return;
  }
  const pick = rows[0]!;
  const newCode = String(pick.locationCode ?? '').trim();
  const n = Math.max(0, Math.floor(Number(pick.palletCount) || 0));
  if (!newCode) return;
  const z = pick.zoneCode != null ? String(pick.zoneCode).trim() : '';
  const { error } = await fetchUpdateWarehouseInventoryData({
    inventoryDetailId: row.inventoryDetailId,
    locationCode: newCode,
    zoneCode: z.length ? z : null,
    palletCount: n,
    deliveryAddress: row.deliveryAddress ?? null,
    platform: row.platform ?? null,
    deliveryMethod: row.deliveryMethod ?? null
  });
  if (error) return;
  let preOk = true;
  if (row.inboundPlanId != null && row.orderId != null) {
    const json = mergePreLocationAfterInventoryLocationChange(
      row.systemPreLocation,
      row.locationCode,
      newCode,
      n
    );
    const { error: e2 } = await fetchUpdateDevanningInboundPlanSystemPreLocation({
      id: row.inboundPlanId,
      orderId: row.orderId,
      systemPreLocation: json
    });
    preOk = !e2;
  }
  locationMapVisible.value = false;
  locationMapRow.value = null;
  if (preOk) {
    window.$message?.success($t('common.updateSuccess'));
  } else {
    window.$message?.warning($t('page.wms.inventoryData.preLocationSyncFailed'));
  }
  await getDataRef.value?.();
}

async function submitPalletInline(row: Api.Wms.WarehouseInventoryDataLine) {
  const id = row.inventoryDetailId;
  if (id == null) return;
  const sid = String(id);
  const draft = palletDraft[sid];
  const n = draft == null || Number.isNaN(Number(draft)) ? 0 : Math.max(0, Math.floor(Number(draft)));
  const cur = Math.max(0, Math.floor(Number(row.palletCount) || 0));
  if (n === cur) {
    editCell.value = null;
    return;
  }
  const { error } = await fetchUpdateWarehouseInventoryData({
    inventoryDetailId: id,
    palletCount: n,
    locationCode: row.locationCode ?? null,
    zoneCode: row.zoneCode ?? null,
    deliveryAddress: row.deliveryAddress ?? null,
    platform: row.platform ?? null,
    deliveryMethod: row.deliveryMethod ?? null
  });
  if (error) return;
  const synced = await trySyncInboundPlanPreLocationPallet(row, n);
  editCell.value = null;
  if (synced) {
    window.$message?.success($t('common.updateSuccess'));
  } else {
    window.$message?.warning($t('page.wms.inventoryData.preLocationSyncFailed'));
  }
  await getDataRef.value?.();
}

function onOrderTimeRange(value: [string, string] | null) {
  if (value?.length === 2) {
    searchParams.value.orderTimeBegin = value[0];
    searchParams.value.orderTimeEnd = value[1];
  } else {
    searchParams.value.orderTimeBegin = null;
    searchParams.value.orderTimeEnd = null;
  }
}

function onDevanningCompleteTimeRange(value: [string, string] | null) {
  if (value?.length === 2) {
    searchParams.value.devanningCompleteBegin = value[0];
    searchParams.value.devanningCompleteEnd = value[1];
  } else {
    searchParams.value.devanningCompleteBegin = null;
    searchParams.value.devanningCompleteEnd = null;
  }
}

const {
  columns,
  columnChecks,
  data,
  getData,
  getDataByPage,
  loading,
  mobilePagination,
  scrollX
} = useNaivePaginatedTable({
  paginationProps: {
    pageSizes: [10, 20, 50, 100]
  },
  api: () => fetchGetWarehouseInventoryDataList(searchParams.value),
  transform: response => defaultTransform(response),
  onPaginationParamsChange: params => {
    searchParams.value.pageNum = params.page ?? 1;
    searchParams.value.pageSize = params.pageSize ?? 10;
  },
  columns: () => [
    {
      key: 'orderTime',
      title: $t('page.wms.inventoryData.orderTime'),
      width: 176,
      ellipsis: { tooltip: true }
    },
    {
      key: 'devanningCompleteTime',
      title: $t('page.wms.inventoryData.devanningCompleteTime'),
      width: 176,
      ellipsis: { tooltip: true }
    },
    {
      key: 'systemSoNo',
      title: $t('page.wms.inventoryData.orderNo'),
      minWidth: 140,
      ellipsis: { tooltip: true }
    },
    { key: 'coNo', title: $t('page.wms.inventoryData.coNo'), width: 120, ellipsis: { tooltip: true } },
    {
      key: 'shipmentCode',
      title: $t('page.wms.inventoryData.shipmentCode'),
      minWidth: 140,
      ellipsis: { tooltip: true }
    },
    { key: 'zoneCode', title: $t('page.wms.inventoryData.zoneCode'), width: 120, ellipsis: { tooltip: true } },
    {
      key: 'locationCode',
      title: editableColumnTitleWithHint(
        'page.wms.inventoryData.locationCode',
        'page.wms.inventoryData.doubleClickToEditLocation'
      ),
      width: 132,
      ellipsis: { tooltip: true },
      render: (row: Api.Wms.WarehouseInventoryDataLine) => {
        const text = row.locationCode?.trim() ? row.locationCode : '—';
        return (
          <div
            class={editableCellReadonlyCls}
            title={$t('page.wms.inventoryData.doubleClickToEditLocation')}
            onDblclick={(e: MouseEvent) => {
              e.stopPropagation();
              openLocationMap(row);
            }}
          >
            <span class="truncate">{text}</span>
          </div>
        );
      }
    },
    {
      key: 'palletCount',
      title: editableColumnTitleWithHint(
        'page.wms.inventoryData.palletCount',
        'page.wms.inventoryData.doubleClickToEditPallet'
      ),
      width: 108,
      render: (row: Api.Wms.WarehouseInventoryDataLine) => {
        const id = row.inventoryDetailId;
        const sid = id != null ? String(id) : '';
        const k = sid ? `${sid}__pallet` : '';
        const editing = editCell.value === k;
        if (id == null) return <span class="text-13px text-gray-400">—</span>;
        if (editing) {
          return (
            <div
              class="flex w-full justify-start"
              onMousedown={(e: MouseEvent) => e.stopPropagation()}
            >
              <NInputNumber
                size="small"
                class="min-w-88px max-w-full"
                value={palletDraft[sid] ?? row.palletCount ?? 0}
                min={0}
                precision={0}
                onUpdate:value={(v: number | null) => {
                  palletDraft[sid] = v == null || Number.isNaN(Number(v)) ? 0 : Math.max(0, Math.floor(Number(v)));
                }}
                onBlur={() => {
                  void submitPalletInline(row);
                }}
              />
            </div>
          );
        }
        return (
          <div
            class={editableCellReadonlyCls}
            title={$t('page.wms.inventoryData.doubleClickToEditPallet')}
            onDblclick={(e: MouseEvent) => {
              e.stopPropagation();
              editCell.value = k;
              palletDraft[sid] = Math.max(0, Math.floor(Number(row.palletCount) || 0));
            }}
          >
            <span class="whitespace-nowrap text-13px">{row.palletCount ?? '—'}</span>
          </div>
        );
      }
    },
    {
      key: 'deliveryAddress',
      title: $t('page.wms.inventoryData.deliveryAddress'),
      minWidth: 180,
      ellipsis: { tooltip: true }
    },
    { key: 'platform', title: $t('page.wms.inventoryData.platform'), width: 100, ellipsis: { tooltip: true } },
    {
      key: 'deliveryMethod',
      title: $t('page.wms.inventoryData.deliveryMethod'),
      width: 120,
      render: (row: Api.Wms.WarehouseInventoryDataLine) => {
        const v = String(row.deliveryMethod ?? '').trim();
        return v ? h(DictTag, { value: v, dictCode: WMS_DICT_DELIVERY_TYPE, immediate: true }) : '—';
      }
    },
    { key: 'weight', title: $t('page.wms.inventoryData.weight'), width: 90 },
    { key: 'volumeCbm', title: $t('page.wms.inventoryData.volumeCbm'), width: 96 },
    { key: 'totalPieces', title: $t('page.wms.inventoryData.totalPieces'), width: 90 },
    { key: 'remark', title: $t('page.wms.inventoryData.remark'), minWidth: 160, ellipsis: { tooltip: true } },
    {
      key: 'operate',
      title: $t('common.operate'),
      width: 104,
      fixed: 'right' as const,
      render: (row: Api.Wms.WarehouseInventoryDataLine) => (
        <div class="flex-center flex-wrap gap-4px">
          <ButtonIcon
            text
            type="primary"
            icon="material-symbols:edit-outline"
            tooltipContent={$t('common.edit')}
            onClick={() => openEdit(row)}
          />
          <ButtonIcon
            text
            type="warning"
            icon="material-symbols:outbox-outline"
            tooltipContent={$t('page.wms.inventoryData.manualOutstockTooltip')}
            onClick={() => openManualOutstock(row)}
          />
        </div>
      )
    }
  ]
});

getDataRef.value = getData;

watch(editCell, () => {
  columnChecks.value = columnChecks.value.slice();
});

function openManualOutstock(row: Api.Wms.WarehouseInventoryDataLine) {
  const id = row.inventoryDetailId;
  if (id == null) {
    window.$message?.warning($t('page.wms.inventoryData.missingInventoryDetailId'));
    return;
  }
  manualOutstockRow.value = row;
  manualOutstockVisible.value = true;
}

function openEdit(row: Api.Wms.WarehouseInventoryDataLine) {
  const id = row.inventoryDetailId;
  if (id == null) {
    window.$message?.warning($t('page.wms.inventoryData.missingInventoryDetailId'));
    return;
  }
  editingRow.value = row;
  editModel.inventoryDetailId = id;
  editModel.palletCount = row.palletCount ?? null;
  editModel.deliveryAddress = row.deliveryAddress ?? null;
  editModel.platform = row.platform ?? null;
  editModel.deliveryMethod = row.deliveryMethod ?? null;
  editVisible.value = true;
}

async function submitEdit() {
  editLoading.value = true;
  try {
    const prev = editingRow.value;
    const { error } = await fetchUpdateWarehouseInventoryData({ ...editModel });
    if (error) return;
    const newPc = editModel.palletCount;
    const oldPc = prev?.palletCount ?? null;
    const palletChanged =
      (newPc == null && oldPc != null) ||
      (newPc != null && (oldPc == null || Math.floor(Number(newPc)) !== Math.floor(Number(oldPc))));
    if (prev && palletChanged) {
      const synced = await trySyncInboundPlanPreLocationPallet(prev, Math.max(0, Math.floor(Number(newPc ?? 0))));
      if (!synced) {
        window.$message?.warning($t('page.wms.inventoryData.preLocationSyncFailed'));
      } else {
        window.$message?.success($t('common.updateSuccess'));
      }
    } else {
      window.$message?.success($t('common.updateSuccess'));
    }
    editVisible.value = false;
    await getData();
  } finally {
    editLoading.value = false;
  }
}

function reset() {
  orderTimeRange.value = null;
  devanningCompleteTimeRange.value = null;
  onOrderTimeRange(null);
  onDevanningCompleteTimeRange(null);
  searchParams.value.systemSoNo = null;
  searchParams.value.coNo = null;
  searchParams.value.shipmentCode = null;
  searchParams.value.zoneCode = null;
  searchParams.value.locationCode = null;
  searchParams.value.deliveryAddress = null;
  searchParams.value.platform = null;
  searchParams.value.deliveryMethod = null;
  searchParams.value.pageNum = 1;
  void getDataByPage();
}

function search() {
  searchParams.value.pageNum = 1;
  void getDataByPage();
}

watch(manualOutstockVisible, v => {
  if (!v) manualOutstockRow.value = null;
});

watch(locationMapVisible, v => {
  if (!v) locationMapRow.value = null;
});
</script>

<template>
  <div class="h-full min-h-500px flex flex-col gap-16px overflow-hidden lt-sm:overflow-auto">
    <NCard
      :bordered="false"
      size="small"
      class="card-wrapper flex min-h-0 flex-1 flex-col overflow-hidden"
      content-class="flex min-h-0 flex-1 flex-col overflow-hidden"
    >
      <template #header>
        <div class="flex-y-center justify-between gap-12px">
          <span class="text-16px font-medium">{{ $t('page.wms.inventoryData.title') }}</span>
          <TableHeaderOperation
            v-model:columns="columnChecks"
            :loading="loading"
            :show-add="false"
            :show-delete="false"
            :show-export="false"
            @refresh="getData"
          />
        </div>
      </template>

      <div class="min-h-0 flex flex-1 flex-col gap-12px overflow-hidden">
        <NCard :bordered="false" size="small" class="table-search card-wrapper shrink-0">
          <!-- 结构与拆柜订单 modules/devanning-order-search.vue 一致 -->
          <NCollapse>
            <NCollapseItem :title="$t('common.search')" name="inventory-data-search">
              <template #header-extra>
                <NSpace @click.stop>
                  <NButton size="small" secondary @click="existingImportVisible = true">
                    <template #icon>
                      <SvgIcon icon="material-symbols:unarchive-outline" class="text-icon" />
                    </template>
                    {{ $t('page.wms.inventoryData.existingImportTitle') }}
                  </NButton>
                  <NButton size="small" secondary @click="existingImportTasksVisible = true">
                    <NBadge
                      :value="unreadTerminalCount"
                      :max="99"
                      :show-zero="false"
                      :offset="[2, -2]"
                      type="error"
                    >
                      <span class="inline-flex items-center gap-6px">
                        <SvgIcon icon="material-symbols:task-outline" class="text-icon" />
                        <span>{{ $t('page.wms.inventoryData.existingImportTaskButton') }}</span>
                        <NTag
                          v-if="runningCount > 0"
                          size="tiny"
                          type="info"
                          round
                          class="shrink-0"
                        >
                          {{ $t('page.wms.inventoryData.existingImportTaskRunningTag') }}
                        </NTag>
                      </span>
                    </NBadge>
                  </NButton>
                  <NButton size="small" type="primary" @click="outstockVisible = true">
                    <template #icon>
                      <icon-material-symbols-upload-rounded class="text-icon" />
                    </template>
                    {{ $t('page.wms.inventoryData.outstock') }}
                  </NButton>
                </NSpace>
              </template>
              <NForm :model="searchParams" label-placement="left" label-width="auto">
                <NGrid responsive="screen" item-responsive :cols="24" :x-gap="8" :y-gap="8">
                  <NFormItemGi span="24 m:12 l:8" :label="$t('page.wms.devanningOrder.orderTimeRange')">
                    <NDatePicker
                      v-model:formatted-value="orderTimeRange"
                      type="datetimerange"
                      value-format="yyyy-MM-dd HH:mm:ss"
                      clearable
                      class="w-full"
                      @update:formatted-value="onOrderTimeRange"
                    />
                  </NFormItemGi>
                  <NFormItemGi span="24 m:12 l:8" :label="$t('page.wms.devanningOrder.devanningCompleteTimeRange')">
                    <NDatePicker
                      v-model:formatted-value="devanningCompleteTimeRange"
                      type="datetimerange"
                      value-format="yyyy-MM-dd HH:mm:ss"
                      clearable
                      class="w-full"
                      @update:formatted-value="onDevanningCompleteTimeRange"
                    />
                  </NFormItemGi>
                  <NFormItemGi span="24 m:12 l:8" :label="$t('page.wms.inventoryData.orderNo')">
                    <NInput
                      v-model:value="searchParams.systemSoNo"
                      size="small"
                      clearable
                      :placeholder="$t('page.wms.inventoryData.orderNo')"
                    />
                  </NFormItemGi>
                  <NFormItemGi span="24 m:12 l:8" :label="$t('page.wms.inventoryData.coNo')">
                    <NInput
                      v-model:value="searchParams.coNo"
                      size="small"
                      clearable
                      :placeholder="$t('page.wms.inventoryData.coNo')"
                    />
                  </NFormItemGi>
                  <NFormItemGi span="24 m:12 l:8" :label="$t('page.wms.inventoryData.shipmentCode')">
                    <NInput
                      v-model:value="searchParams.shipmentCode"
                      size="small"
                      clearable
                      :placeholder="$t('page.wms.inventoryData.shipmentCode')"
                    />
                  </NFormItemGi>
                  <NFormItemGi span="24 m:12 l:8" :label="$t('page.wms.inventoryData.zoneCode')">
                    <NInput
                      v-model:value="searchParams.zoneCode"
                      size="small"
                      clearable
                      :placeholder="$t('page.wms.inventoryData.zoneCode')"
                    />
                  </NFormItemGi>
                  <NFormItemGi span="24 m:12 l:8" :label="$t('page.wms.inventoryData.locationCode')">
                    <NInput
                      v-model:value="searchParams.locationCode"
                      size="small"
                      clearable
                      :placeholder="$t('page.wms.inventoryData.locationCode')"
                    />
                  </NFormItemGi>
                  <NFormItemGi span="24 m:12 l:8" :label="$t('page.wms.inventoryData.deliveryAddress')">
                    <NInput
                      v-model:value="searchParams.deliveryAddress"
                      size="small"
                      clearable
                      :placeholder="$t('page.wms.inventoryData.deliveryAddress')"
                    />
                  </NFormItemGi>
                  <NFormItemGi span="24 m:12 l:8" :label="$t('page.wms.inventoryData.platform')">
                    <NInput
                      v-model:value="searchParams.platform"
                      size="small"
                      clearable
                      :placeholder="$t('page.wms.inventoryData.platform')"
                    />
                  </NFormItemGi>
                  <NFormItemGi span="24 m:12 l:8" :label="$t('page.wms.inventoryData.deliveryMethod')">
                    <DictSelect
                      v-model:value="searchParams.deliveryMethod"
                      dict-code="delivery_type"
                      clearable
                      class="w-full"
                      :placeholder="$t('page.wms.inventoryData.deliveryMethod')"
                    />
                  </NFormItemGi>

                  <NFormItemGi span="24" :show-feedback="false">
                    <div class="w-full flex justify-end gap-10px">
                      <NButton size="small" @click="reset">
                        <template #icon>
                          <icon-ic-round-refresh class="text-icon" />
                        </template>
                        {{ $t('common.reset') }}
                      </NButton>
                      <NButton size="small" type="primary" ghost :loading="loading" @click="search">
                        <template #icon>
                          <icon-ic-round-search class="text-icon" />
                        </template>
                        {{ $t('common.search') }}
                      </NButton>
                    </div>
                  </NFormItemGi>
                </NGrid>
              </NForm>
            </NCollapseItem>
          </NCollapse>
        </NCard>

        <NDataTable
          size="small"
          remote
          :columns="columns"
          :data="data"
          :loading="loading"
          :pagination="mobilePagination"
          :scroll-x="scrollX"
          flex-height
          class="min-h-0 flex-1"
        />
      </div>
    </NCard>

    <NModal
      v-model:show="editVisible"
      :title="$t('page.wms.inventoryData.editTitle')"
      preset="card"
      :bordered="false"
      display-directive="show"
      class="max-w-90% w-640px"
    >
      <NForm :model="editModel" label-placement="left" label-width="auto">
        <NFormItem :label="$t('page.wms.inventoryData.palletCount')">
          <NInputNumber v-model:value="editModel.palletCount" class="w-full" :min="0" :precision="0" clearable />
        </NFormItem>
        <NFormItem :label="$t('page.wms.inventoryData.deliveryAddress')">
          <NInput v-model:value="editModel.deliveryAddress" clearable />
        </NFormItem>
        <NFormItem :label="$t('page.wms.inventoryData.platform')">
          <NInput v-model:value="editModel.platform" clearable />
        </NFormItem>
        <NFormItem :label="$t('page.wms.inventoryData.deliveryMethod')">
          <DictSelect
            v-model:value="editModel.deliveryMethod"
            dict-code="delivery_type"
            clearable
            class="w-full"
            :placeholder="$t('page.wms.inventoryData.deliveryMethod')"
          />
        </NFormItem>
      </NForm>
      <template #footer>
        <NSpace justify="end" :size="12">
          <NButton @click="editVisible = false">{{ $t('common.cancel') }}</NButton>
          <NButton type="primary" :loading="editLoading" @click="submitEdit">{{ $t('common.confirm') }}</NButton>
        </NSpace>
      </template>
    </NModal>

    <DevanningOrderPreLocationMapPickerModal
      v-model:visible="locationMapVisible"
      :plan="locationMapPlanSlice"
      :single-pre-location-pick="true"
      :pick-pallet-initial-count="locationMapPickInitial"
      :inventory-context-banner="locationMapInventoryBanner"
      @confirm="onLocationMapConfirm"
    />

    <InventoryDataOutstockModal v-model:visible="outstockVisible" @submitted="getData" />
    <InventoryDataManualOutstockModal
      v-model:visible="manualOutstockVisible"
      :row="manualOutstockRow"
      @submitted="getData"
    />
    <InventoryDataExistingImportModal v-model:visible="existingImportVisible" @submitted="getData" />
    <InventoryDataExistingImportTasksModal v-model:visible="existingImportTasksVisible" />
  </div>
</template>

