<script setup lang="tsx">
import { ref } from 'vue';
import {
  NButton,
  NCard,
  NCollapse,
  NCollapseItem,
  NDataTable,
  NForm,
  NFormItemGi,
  NGrid,
  NInput
} from 'naive-ui';
import { defaultTransform, useNaivePaginatedTable } from '@/hooks/common/table';
import { fetchGetOutstockExceptionBatchList } from '@/service/api/wms/outstock-exception';
import { $t } from '@/locales';
import ButtonIcon from '@/components/custom/button-icon.vue';
import OutstockExceptionDetailDrawer from './modules/outstock-exception-detail-drawer.vue';

defineOptions({
  name: 'WmsOutstockException'
});

const searchParams = ref<Api.Wms.OutstockExceptionBatchSearchParams>({
  pageNum: 1,
  pageSize: 10,
  outstockBatchNo: null,
  loadingSequenceNo: null,
  coNo: null,
  systemSoNo: null,
  orderByColumn: 'createTime',
  isAsc: 'desc'
});

const detailVisible = ref(false);
const selectedBatch = ref<Api.Wms.OutstockExceptionBatchLine | null>(null);

function openDetail(row: Api.Wms.OutstockExceptionBatchLine) {
  selectedBatch.value = row;
  detailVisible.value = true;
}

const { columns, columnChecks, data, getData, getDataByPage, loading, mobilePagination, scrollX } =
  useNaivePaginatedTable({
    paginationProps: {
      pageSizes: [10, 20, 50, 100]
    },
    api: () => fetchGetOutstockExceptionBatchList(searchParams.value),
    transform: response => defaultTransform(response),
    onPaginationParamsChange: params => {
      searchParams.value.pageNum = params.page ?? 1;
      searchParams.value.pageSize = params.pageSize ?? 10;
    },
    columns: () => [
      {
        key: 'outstockBatchNo',
        title: $t('page.wms.outstockException.outstockBatchNo'),
        minWidth: 160,
        ellipsis: { tooltip: true }
      },
      {
        key: 'loadingSequenceNo',
        title: $t('page.wms.outstockException.loadingSequenceNo'),
        width: 112,
        ellipsis: { tooltip: true },
        render: (row: Api.Wms.OutstockExceptionBatchLine) =>
          row.loadingSequenceNo != null && String(row.loadingSequenceNo).trim() !== ''
            ? String(row.loadingSequenceNo)
            : '—'
      },
      {
        key: 'exceptionCount',
        title: $t('page.wms.outstockException.exceptionCount'),
        width: 100,
        render: (row: Api.Wms.OutstockExceptionBatchLine) =>
          row.exceptionCount != null ? row.exceptionCount : '—'
      },
      {
        key: 'lastExceptionTime',
        title: $t('page.wms.outstockException.lastExceptionTime'),
        width: 176,
        ellipsis: { tooltip: true }
      },
      {
        key: 'createTime',
        title: $t('page.wms.outstockException.createTime'),
        width: 176,
        ellipsis: { tooltip: true }
      },
      {
        key: 'operate',
        title: $t('common.operate'),
        width: 96,
        fixed: 'right' as const,
        render: (row: Api.Wms.OutstockExceptionBatchLine) => (
          <ButtonIcon
            text
            type="primary"
            icon="material-symbols:visibility-outline"
            tooltipContent={$t('page.wms.outstockException.viewDetail')}
            onClick={() => openDetail(row)}
          />
        )
      }
    ]
  });

function resetSearch() {
  searchParams.value.outstockBatchNo = null;
  searchParams.value.loadingSequenceNo = null;
  searchParams.value.coNo = null;
  searchParams.value.systemSoNo = null;
  searchParams.value.pageNum = 1;
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
          <span class="text-16px font-medium">{{ $t('page.wms.outstockException.title') }}</span>
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
            <NCollapseItem :title="$t('common.search')" name="outstock-exception-search">
              <NForm :model="searchParams" label-placement="left" label-width="auto">
                <NGrid responsive="screen" item-responsive :cols="24" :x-gap="8" :y-gap="8">
                  <NFormItemGi span="24 m:12 l:8" :label="$t('page.wms.outstockException.outstockBatchNo')">
                    <NInput
                      v-model:value="searchParams.outstockBatchNo"
                      size="small"
                      clearable
                      :placeholder="$t('page.wms.outstockException.outstockBatchNo')"
                    />
                  </NFormItemGi>
                  <NFormItemGi span="24 m:12 l:8" :label="$t('page.wms.outstockException.loadingSequenceNo')">
                    <NInput
                      v-model:value="searchParams.loadingSequenceNo"
                      size="small"
                      clearable
                      :placeholder="$t('page.wms.outstockException.loadingSequenceNo')"
                    />
                  </NFormItemGi>
                  <NFormItemGi span="24 m:12 l:8" :label="$t('page.wms.outstockException.coNo')">
                    <NInput
                      v-model:value="searchParams.coNo"
                      size="small"
                      clearable
                      :placeholder="$t('page.wms.outstockException.coNo')"
                    />
                  </NFormItemGi>
                  <NFormItemGi span="24 m:12 l:8" :label="$t('page.wms.outstockException.orderNo')">
                    <NInput
                      v-model:value="searchParams.systemSoNo"
                      size="small"
                      clearable
                      :placeholder="$t('page.wms.outstockException.orderNo')"
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

    <OutstockExceptionDetailDrawer v-model:visible="detailVisible" :batch="selectedBatch" />
  </div>
</template>
