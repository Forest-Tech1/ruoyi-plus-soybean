<script setup lang="tsx">
import { h, ref } from 'vue';
import {
  NButton,
  NCard,
  NCollapse,
  NCollapseItem,
  NDataTable,
  NDatePicker,
  NForm,
  NFormItemGi,
  NGrid,
  NInput
} from 'naive-ui';
import { getDefaultOutstockDataCreateTimeRange } from '@/constants/wms-outstock-data';
import { defaultTransform, useNaivePaginatedTable } from '@/hooks/common/table';
import { fetchCancelOutstockData, fetchGetOutstockDataList } from '@/service/api/wms/outstock-data';
import { useDict } from '@/hooks/business/dict';
import { useAuth } from '@/hooks/business/auth';
import { WMS_DICT_DELIVERY_TYPE } from '@/constants/wms-devanning';
import DictSelect from '@/components/custom/dict-select.vue';
import DictTag from '@/components/custom/dict-tag.vue';
import { $t } from '@/locales';
import ButtonIcon from '@/components/custom/button-icon.vue';

defineOptions({
  name: 'WmsOutstockData'
});

useDict(WMS_DICT_DELIVERY_TYPE, true);

const { hasAuth } = useAuth();

function buildDefaultOutstockDataSearch(): Api.Wms.OutstockDataSearchParams {
  const { createTimeBegin, createTimeEnd } = getDefaultOutstockDataCreateTimeRange();
  return {
    pageNum: 1,
    pageSize: 10,
    createTimeBegin,
    createTimeEnd,
    outstockBatchNo: null,
    coNo: null,
    systemSoNo: null,
    shipmentCode: null,
    deliveryAddress: null,
    platform: null,
    deliveryMethod: null,
    zoneCode: null,
    locationCode: null,
    loadingSequenceNo: null,
    orderByColumn: 'createTime',
    isAsc: 'desc'
  };
}

const searchParams = ref(buildDefaultOutstockDataSearch());

const createTimeRange = ref<[string, string] | null>([
  searchParams.value.createTimeBegin!,
  searchParams.value.createTimeEnd!
]);

function onCreateTimeRange(value: [string, string] | null) {
  if (value?.length === 2) {
    searchParams.value.createTimeBegin = value[0];
    searchParams.value.createTimeEnd = value[1];
  } else {
    searchParams.value.createTimeBegin = null;
    searchParams.value.createTimeEnd = null;
  }
}

const { columns, columnChecks, data, getData, getDataByPage, loading, mobilePagination, scrollX } =
  useNaivePaginatedTable({
    paginationProps: {
      pageSizes: [10, 20, 50, 100]
    },
    api: () => fetchGetOutstockDataList(searchParams.value),
    transform: response => defaultTransform(response),
    onPaginationParamsChange: params => {
      searchParams.value.pageNum = params.page ?? 1;
      searchParams.value.pageSize = params.pageSize ?? 10;
    },
    columns: () => [
      {
        key: 'outstockBatchNo',
        title: $t('page.wms.outstockData.outstockBatchNo'),
        minWidth: 140,
        ellipsis: { tooltip: true }
      },
      {
        key: 'loadingSequenceNo',
        title: $t('page.wms.outstockData.loadingSequenceNo'),
        width: 112,
        ellipsis: { tooltip: true },
        render: (row: Api.Wms.OutstockDataLine) =>
          row.loadingSequenceNo != null && String(row.loadingSequenceNo).trim() !== ''
            ? String(row.loadingSequenceNo)
            : '—'
      },
      { key: 'coNo', title: $t('page.wms.outstockData.coNo'), width: 120, ellipsis: { tooltip: true } },
      {
        key: 'systemSoNo',
        title: $t('page.wms.outstockData.orderNo'),
        minWidth: 132,
        ellipsis: { tooltip: true }
      },
      {
        key: 'shipmentCode',
        title: $t('page.wms.outstockData.shipmentCode'),
        minWidth: 132,
        ellipsis: { tooltip: true }
      },
      {
        key: 'deliveryAddress',
        title: $t('page.wms.outstockData.deliveryAddress'),
        minWidth: 160,
        ellipsis: { tooltip: true }
      },
      { key: 'platform', title: $t('page.wms.outstockData.platform'), width: 100, ellipsis: { tooltip: true } },
      {
        key: 'deliveryMethod',
        title: $t('page.wms.outstockData.deliveryMethod'),
        width: 120,
        render: (row: Api.Wms.OutstockDataLine) => {
          const v = String(row.deliveryMethod ?? '').trim();
          return v ? h(DictTag, { value: v, dictCode: WMS_DICT_DELIVERY_TYPE, immediate: true }) : '—';
        }
      },
      {
        key: 'palletCount',
        title: $t('page.wms.outstockData.palletCount'),
        width: 88,
        render: (row: Api.Wms.OutstockDataLine) => (row.palletCount != null ? row.palletCount : '—')
      },
      { key: 'zoneCode', title: $t('page.wms.outstockData.zoneCode'), width: 112, ellipsis: { tooltip: true } },
      {
        key: 'locationCode',
        title: $t('page.wms.outstockData.locationCode'),
        width: 112,
        ellipsis: { tooltip: true }
      },
      {
        key: 'weight',
        title: $t('page.wms.outstockData.weight'),
        width: 90,
        render: (row: Api.Wms.OutstockDataLine) => (row.weight != null ? String(row.weight) : '—')
      },
      {
        key: 'volumeCbm',
        title: $t('page.wms.outstockData.volumeCbm'),
        width: 88,
        render: (row: Api.Wms.OutstockDataLine) => (row.volumeCbm != null ? String(row.volumeCbm) : '—')
      },
      {
        key: 'totalPieces',
        title: $t('page.wms.outstockData.totalPieces'),
        width: 90,
        render: (row: Api.Wms.OutstockDataLine) => (row.totalPieces != null ? row.totalPieces : '—')
      },
      {
        key: 'createTime',
        title: $t('page.common.createTime'),
        width: 172,
        ellipsis: { tooltip: true },
        render: (row: Api.Wms.OutstockDataLine) =>
          row.createTime != null && String(row.createTime).trim() !== '' ? String(row.createTime) : '—'
      },
      {
        key: 'operate',
        title: $t('common.operate'),
        width: 112,
        fixed: 'right' as const,
        render: (row: Api.Wms.OutstockDataLine) =>
          hasAuth('wms:outstockData:cancel') ? (
            <ButtonIcon
              text
              type="error"
              icon="material-symbols:undo-rounded"
              tooltipContent={$t('page.wms.outstockData.cancelOutstock')}
              popconfirmContent={$t('page.wms.outstockData.cancelConfirm')}
              onPositiveClick={() => handleCancelOutstock(row)}
            />
          ) : null
      }
    ]
  });

async function handleCancelOutstock(row: Api.Wms.OutstockDataLine) {
  const { error } = await fetchCancelOutstockData(row.id);
  if (!error) {
    window.$message?.success($t('page.wms.outstockData.cancelSuccess'));
    await getData();
  }
}

function resetSearch() {
  const ps = searchParams.value.pageSize ?? 10;
  const next = buildDefaultOutstockDataSearch();
  next.pageSize = ps;
  searchParams.value = next;
  createTimeRange.value = [next.createTimeBegin!, next.createTimeEnd!];
  void getDataByPage();
}

function search() {
  searchParams.value.pageNum = 1;
  void getDataByPage();
}
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
          <span class="text-16px font-medium">{{ $t('page.wms.outstockData.title') }}</span>
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
          <NCollapse>
            <NCollapseItem :title="$t('common.search')" name="outstock-data-search">
              <NForm :model="searchParams" label-placement="left" label-width="auto">
                <NGrid responsive="screen" item-responsive :cols="24" :x-gap="8" :y-gap="8">
                  <NFormItemGi span="24 m:12 l:8" :label="$t('page.wms.outstockData.createTimeRange')">
                    <NDatePicker
                      v-model:formatted-value="createTimeRange"
                      type="datetimerange"
                      value-format="yyyy-MM-dd HH:mm:ss"
                      clearable
                      class="w-full"
                      @update:formatted-value="onCreateTimeRange"
                    />
                  </NFormItemGi>
                  <NFormItemGi span="24 m:12 l:8" :label="$t('page.wms.outstockData.outstockBatchNo')">
                    <NInput
                      v-model:value="searchParams.outstockBatchNo"
                      size="small"
                      clearable
                      :placeholder="$t('page.wms.outstockData.outstockBatchNo')"
                    />
                  </NFormItemGi>
                  <NFormItemGi span="24 m:12 l:8" :label="$t('page.wms.outstockData.loadingSequenceNo')">
                    <NInput
                      v-model:value="searchParams.loadingSequenceNo"
                      size="small"
                      clearable
                      :placeholder="$t('page.wms.outstockData.loadingSequenceNo')"
                    />
                  </NFormItemGi>
                  <NFormItemGi span="24 m:12 l:8" :label="$t('page.wms.outstockData.coNo')">
                    <NInput
                      v-model:value="searchParams.coNo"
                      size="small"
                      clearable
                      :placeholder="$t('page.wms.outstockData.coNo')"
                    />
                  </NFormItemGi>
                  <NFormItemGi span="24 m:12 l:8" :label="$t('page.wms.outstockData.orderNo')">
                    <NInput
                      v-model:value="searchParams.systemSoNo"
                      size="small"
                      clearable
                      :placeholder="$t('page.wms.outstockData.orderNo')"
                    />
                  </NFormItemGi>
                  <NFormItemGi span="24 m:12 l:8" :label="$t('page.wms.outstockData.shipmentCode')">
                    <NInput
                      v-model:value="searchParams.shipmentCode"
                      size="small"
                      clearable
                      :placeholder="$t('page.wms.outstockData.shipmentCode')"
                    />
                  </NFormItemGi>
                  <NFormItemGi span="24 m:12 l:8" :label="$t('page.wms.outstockData.deliveryAddress')">
                    <NInput
                      v-model:value="searchParams.deliveryAddress"
                      size="small"
                      clearable
                      :placeholder="$t('page.wms.outstockData.deliveryAddress')"
                    />
                  </NFormItemGi>
                  <NFormItemGi span="24 m:12 l:8" :label="$t('page.wms.outstockData.platform')">
                    <NInput
                      v-model:value="searchParams.platform"
                      size="small"
                      clearable
                      :placeholder="$t('page.wms.outstockData.platform')"
                    />
                  </NFormItemGi>
                  <NFormItemGi span="24 m:12 l:8" :label="$t('page.wms.outstockData.deliveryMethod')">
                    <DictSelect
                      v-model:value="searchParams.deliveryMethod"
                      dict-code="delivery_type"
                      clearable
                      class="w-full"
                      :placeholder="$t('page.wms.outstockData.deliveryMethod')"
                    />
                  </NFormItemGi>
                  <NFormItemGi span="24 m:12 l:8" :label="$t('page.wms.outstockData.zoneCode')">
                    <NInput
                      v-model:value="searchParams.zoneCode"
                      size="small"
                      clearable
                      :placeholder="$t('page.wms.outstockData.zoneCode')"
                    />
                  </NFormItemGi>
                  <NFormItemGi span="24 m:12 l:8" :label="$t('page.wms.outstockData.locationCode')">
                    <NInput
                      v-model:value="searchParams.locationCode"
                      size="small"
                      clearable
                      :placeholder="$t('page.wms.outstockData.locationCode')"
                    />
                  </NFormItemGi>

                  <NFormItemGi span="24" :show-feedback="false">
                    <div class="w-full flex justify-end gap-10px">
                      <NButton size="small" @click="resetSearch">
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
  </div>
</template>
