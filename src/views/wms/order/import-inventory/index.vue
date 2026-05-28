<script setup lang="tsx">
import { ref } from 'vue';
import { useAppStore } from '@/store/modules/app';
import { useAuth } from '@/hooks/business/auth';
import { defaultTransform, useNaivePaginatedTable } from '@/hooks/common/table';
import { fetchGetDevanningImportInventoryList } from '@/service/api/wms/devanning-order';
import { $t } from '@/locales';

defineOptions({
  name: 'DevanningImportInventoryList'
});

const appStore = useAppStore();
const { hasAuth } = useAuth();

const searchParams = ref<Api.Wms.DevanningImportInventorySearchParams>({
  pageNum: 1,
  pageSize: 10,
  coNo: null,
  blNo: null,
  warehouseCode: null,
  orderByColumn: 'createTime',
  isAsc: 'desc'
});

const { columns, columnChecks, data, getData, getDataByPage, loading, mobilePagination, scrollX } =
  useNaivePaginatedTable({
    paginationProps: {
      pageSizes: [10, 30, 50, 100]
    },
    api: () => fetchGetDevanningImportInventoryList(searchParams.value),
    transform: response => defaultTransform(response),
    onPaginationParamsChange: params => {
      searchParams.value.pageNum = params.page;
      searchParams.value.pageSize = params.pageSize;
    },
    columns: () => [
      {
        key: 'coNo',
        title: $t('page.wms.devanningImportInventory.coNo'),
        align: 'left',
        minWidth: 120,
        ellipsis: { tooltip: true }
      },
      {
        key: 'blNo',
        title: $t('page.wms.devanningImportInventory.blNo'),
        align: 'left',
        minWidth: 120,
        ellipsis: { tooltip: true }
      },
      {
        key: 'warehouseCode',
        title: $t('page.wms.devanningImportInventory.warehouseCode'),
        align: 'left',
        width: 120,
        ellipsis: { tooltip: true }
      },
      {
        key: 'systemSoNo',
        title: $t('page.wms.devanningImportInventory.systemSoNo'),
        align: 'left',
        minWidth: 120,
        ellipsis: { tooltip: true }
      },
      {
        key: 'shipmentCode',
        title: $t('page.wms.devanningImportInventory.shipmentCode'),
        align: 'left',
        minWidth: 140,
        ellipsis: { tooltip: true }
      },
      {
        key: 'systemPreLocation',
        title: $t('page.wms.devanningImportInventory.preLocationCode'),
        align: 'left',
        minWidth: 140,
        ellipsis: { tooltip: true }
      },
      {
        key: 'sourceFileName',
        title: $t('page.wms.devanningImportInventory.sourceFileName'),
        align: 'left',
        minWidth: 160,
        ellipsis: { tooltip: true }
      },
      {
        key: 'createTime',
        title: $t('page.wms.devanningImportInventory.importTime'),
        align: 'left',
        width: 176
      }
    ]
  });
</script>

<template>
  <div class="h-full min-h-500px flex flex-col gap-16px overflow-hidden lt-sm:overflow-auto">
    <NCard
      :bordered="false"
      size="small"
      class="card-wrapper flex min-h-0 flex-1 flex-col overflow-hidden sm:flex-1-hidden"
      content-class="flex min-h-0 flex-1 flex-col overflow-hidden"
    >
      <template #header>
        <div class="flex-y-center justify-between gap-12px">
          <span class="text-16px font-medium">{{ $t('page.wms.devanningImportInventory.title') }}</span>
          <TableHeaderOperation
            v-if="hasAuth('wms:devanningOrder:list')"
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
        <NForm :model="searchParams" label-placement="left" class="shrink-0">
          <NGrid responsive="screen" item-responsive cols="1 s:1 m:24" :x-gap="12" :y-gap="8">
            <NFormItemGi span="24 m:6" :label="$t('page.wms.devanningImportInventory.coNo')" label-width="auto">
              <NInput v-model:value="searchParams.coNo" clearable :placeholder="$t('common.keywordSearch')" />
            </NFormItemGi>
            <NFormItemGi span="24 m:6" :label="$t('page.wms.devanningImportInventory.blNo')" label-width="auto">
              <NInput v-model:value="searchParams.blNo" clearable :placeholder="$t('common.keywordSearch')" />
            </NFormItemGi>
            <NFormItemGi span="24 m:6" :label="$t('page.wms.devanningImportInventory.warehouseCode')" label-width="auto">
              <NInput v-model:value="searchParams.warehouseCode" clearable :placeholder="$t('common.keywordSearch')" />
            </NFormItemGi>
            <NFormItemGi span="24 m:6" class="flex justify-end">
              <NSpace>
                <NButton type="primary" @click="() => getDataByPage()">{{ $t('common.search') }}</NButton>
                <NButton
                  @click="
                    () => {
                      searchParams.coNo = null;
                      searchParams.blNo = null;
                      searchParams.warehouseCode = null;
                      getDataByPage();
                    }
                  "
                >
                  {{ $t('common.reset') }}
                </NButton>
              </NSpace>
            </NFormItemGi>
          </NGrid>
        </NForm>
        <div class="min-h-0 flex flex-1 flex-col overflow-hidden">
          <DataTable
            :columns="columns"
            :data="data"
            :flex-height="!appStore.isMobile"
            :scroll-x="scrollX"
            :loading="loading"
            remote
            :row-key="row => row.id"
            :pagination="mobilePagination"
            class="h-full min-h-280px sm:min-h-0"
          />
        </div>
      </div>
    </NCard>
  </div>
</template>

<style scoped></style>
