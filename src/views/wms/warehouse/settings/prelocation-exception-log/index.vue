<script setup lang="tsx">
import { ref } from 'vue';
import { fetchGetPrelocationAllocationExceptionLogList } from '@/service/api/wms/prelocation-allocation-exception-log';
import { useAppStore } from '@/store/modules/app';
import { useDict } from '@/hooks/business/dict';
import { defaultTransform, useNaivePaginatedTable } from '@/hooks/common/table';
import { $t } from '@/locales';
import DictTag from '@/components/custom/dict-tag.vue';
import TableHeaderOperation from '@/components/advanced/table-header-operation.vue';
import PrelocationExceptionLogSearch from './modules/prelocation-exception-log-search.vue';

defineOptions({
  name: 'PrelocationExceptionLog'
});

useDict('wms_prelocation_allocation_exception_type', true);

const appStore = useAppStore();

const searchParams = ref<Api.Wms.PrelocationAllocationExceptionLogSearchParams>({
  pageNum: 1,
  pageSize: 10,
  orderNo: null,
  coNo: null,
  shipmentCode: null,
  exceptionType: null,
  exceptionReasonKeyword: null,
  orderByColumn: 'createTime',
  isAsc: 'desc',
  params: {}
});

function cellText(v: string | number | null | undefined) {
  if (v === null || v === undefined) return '—';
  const s = String(v).trim();
  return s.length ? s : '—';
}

const { columns, columnChecks, data, getData, getDataByPage, loading, mobilePagination, scrollX } =
  useNaivePaginatedTable({
    api: () => fetchGetPrelocationAllocationExceptionLogList(searchParams.value),
    transform: response => defaultTransform(response),
    onPaginationParamsChange: params => {
      searchParams.value.pageNum = params.page;
      searchParams.value.pageSize = params.pageSize;
    },
    columns: () => [
      {
        key: 'index',
        title: $t('common.index'),
        align: 'center',
        width: 64,
        render: (_row, index) =>
          (searchParams.value.pageNum! - 1) * (searchParams.value.pageSize || 10) + index + 1
      },
      {
        key: 'orderNo',
        title: $t('page.wms.prelocationExceptionLog.orderNo'),
        align: 'center',
        minWidth: 120,
        ellipsis: { tooltip: true },
        render: row => cellText(row.orderNo)
      },
      {
        key: 'coNo',
        title: $t('page.wms.prelocationExceptionLog.coNo'),
        align: 'center',
        minWidth: 100,
        ellipsis: { tooltip: true },
        render: row => cellText(row.coNo)
      },
      {
        key: 'shipmentCode',
        title: $t('page.wms.prelocationExceptionLog.shipmentCode'),
        align: 'center',
        minWidth: 120,
        ellipsis: { tooltip: true },
        render: row => cellText(row.shipmentCode)
      },
      {
        key: 'estimatedPalletCount',
        title: $t('page.wms.prelocationExceptionLog.estimatedPalletCount'),
        align: 'center',
        width: 110,
        render: row => cellText(row.estimatedPalletCount)
      },
      {
        key: 'exceptionType',
        title: $t('page.wms.prelocationExceptionLog.exceptionType'),
        align: 'center',
        minWidth: 120,
        render(row) {
          return row.exceptionType ? (
            <DictTag value={row.exceptionType} dictCode="wms_prelocation_allocation_exception_type" />
          ) : (
            '—'
          );
        }
      },
      {
        key: 'exceptionReason',
        title: $t('page.wms.prelocationExceptionLog.exceptionReason'),
        align: 'left',
        minWidth: 200,
        ellipsis: { tooltip: true },
        render: row => cellText(row.exceptionReason)
      },
      {
        key: 'createTime',
        title: $t('page.wms.prelocationExceptionLog.logTime'),
        align: 'center',
        width: 172,
        ellipsis: { tooltip: true },
        render: row => cellText(row.createTime)
      }
    ]
  });
</script>

<template>
  <div class="h-full min-h-500px flex flex-col gap-16px overflow-hidden lt-sm:overflow-auto">
    <PrelocationExceptionLogSearch v-model:model="searchParams" @search="getDataByPage" />

    <NCard
      :bordered="false"
      size="small"
      class="card-wrapper flex min-h-0 flex-1 flex-col overflow-hidden sm:flex-1-hidden"
      content-class="flex min-h-0 flex-1 flex-col overflow-hidden"
    >
      <template #header>
        <div class="flex-y-center justify-between gap-12px">
          <span class="text-16px font-medium">{{ $t('page.wms.prelocationExceptionLog.title') }}</span>
          <TableHeaderOperation
            v-model:columns="columnChecks"
            :loading="loading"
            :show-add="false"
            :show-delete="false"
            @refresh="getData"
          />
        </div>
      </template>
      <div class="flex min-h-0 flex-1 flex-col overflow-hidden">
        <DataTable
          :columns="columns"
          :data="data"
          :flex-height="!appStore.isMobile"
          :scroll-x="scrollX"
          :loading="loading"
          remote
          :row-key="row => row.id"
          :pagination="mobilePagination"
          class="min-h-280px flex-1 sm:min-h-0"
        />
      </div>
    </NCard>
  </div>
</template>
