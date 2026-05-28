<script setup lang="tsx">
import { onMounted, ref, watch } from 'vue';
import { NButton, NTabPane, NTabs, NTag, NPagination } from 'naive-ui';
import { fetchBatchDeleteParkDock, fetchGetParkDockList } from '@/service/api/wms/park-dock';
import { WMS_DICT_PARK_LOCATION_AREA } from '@/constants/wms-park';
import { useAuth } from '@/hooks/business/auth';
import { useDict } from '@/hooks/business/dict';
import DictTag from '@/components/custom/dict-tag.vue';
import { defaultTransform, useNaivePaginatedTable, useTableOperate } from '@/hooks/common/table';
import { $t } from '@/locales';
import TableHeaderOperation from '@/components/advanced/table-header-operation.vue';
import ParkDockOperateDrawer from './modules/park-dock-operate-drawer.vue';

defineOptions({
  name: 'ParkManagement'
});

const { hasAuth } = useAuth();

useDict(WMS_DICT_PARK_LOCATION_AREA, true);

const activeTab = ref<Api.Wms.ParkSlotType>('dock');

const searchParams = ref<Api.Wms.ParkDockSearchParams>({
  pageNum: 1,
  pageSize: 100,
  slotType: 'dock',
  slotName: null,
  locationArea: null,
  status: null,
  orderByColumn: 'sortOrder',
  isAsc: 'asc'
});

const {
  columns,
  columnChecks,
  data,
  getData,
  getDataByPage,
  loading,
  scrollX,
  pagination
} = useNaivePaginatedTable({
    api: () => fetchGetParkDockList(searchParams.value),
    transform: response => defaultTransform(response),
    immediate: false,
    initialPageSize: 100,
    paginationProps: {
      pageSizes: [10, 20, 50, 100, 200]
    },
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
          (searchParams.value.pageNum! - 1) * (searchParams.value.pageSize || 100) + index + 1
      },
      {
        key: 'slotName',
        title: $t('page.wms.parkManagement.slotName'),
        align: 'center',
        minWidth: 120
      },
      {
        key: 'slotType',
        title: $t('page.wms.parkManagement.slotType'),
        align: 'center',
        width: 100,
        render: row =>
          row.slotType === 'dock'
            ? $t('page.wms.parkManagement.tabDock')
            : $t('page.wms.parkManagement.tabParking')
      },
      {
        key: 'businessType',
        title: $t('page.wms.parkManagement.businessType'),
        align: 'center',
        width: 100,
        render: row => (
          <NTag
            size="small"
            type={row.businessType === 'loading' ? 'warning' : 'info'}
            bordered={false}
          >
            {row.businessType === 'loading'
              ? $t('page.wms.parkManagement.businessTypeLoading')
              : $t('page.wms.parkManagement.businessTypeDevanning')}
          </NTag>
        )
      },
      {
        key: 'sortOrder',
        title: $t('page.wms.parkManagement.sortOrder'),
        align: 'center',
        width: 88,
        render: row => (row.sortOrder ?? 0)
      },
      {
        key: 'priority',
        title: $t('page.wms.parkManagement.priority'),
        align: 'center',
        width: 88,
        render: row =>
          row.businessType === 'devanning' && row.slotType === 'dock' ? (row.priority ?? 1) : '—'
      },
      {
        key: 'locationArea',
        title: $t('page.wms.parkManagement.locationArea'),
        align: 'center',
        minWidth: 120,
        render: row =>
          row.locationArea ? (
            <DictTag dictCode={WMS_DICT_PARK_LOCATION_AREA} value={row.locationArea} immediate />
          ) : (
            '—'
          )
      },
      {
        key: 'status',
        title: $t('page.wms.parkManagement.status'),
        align: 'center',
        width: 100,
        render: row => (
          <NTag size="small" type={row.status === 'open' ? 'success' : 'default'} bordered={false}>
            {row.status === 'open'
              ? $t('page.wms.parkManagement.statusOpen')
              : $t('page.wms.parkManagement.statusClosed')}
          </NTag>
        )
      },
      {
        key: 'operate',
        title: $t('common.operate'),
        align: 'center',
        width: 140,
        render: row => (
          <div class="flex-center gap-8px">
            {hasAuth('wms:parkDock:edit') ? (
              <NButton text type="primary" onClick={() => handleEdit(row.id)}>
                {$t('common.edit')}
              </NButton>
            ) : null}
            {hasAuth('wms:parkDock:remove') ? (
              <NButton
                text
                type="error"
                onClick={() => {
                  window.$dialog?.warning({
                    title: $t('common.warning'),
                    content: $t('common.confirmDelete'),
                    positiveText: $t('common.confirm'),
                    negativeText: $t('common.cancel'),
                    onPositiveClick: async () => {
                      const { error } = await fetchBatchDeleteParkDock([row.id]);
                      if (error) return false;
                      onDeleted();
                      return true;
                    }
                  });
                }}
              >
                {$t('common.delete')}
              </NButton>
            ) : null}
          </div>
        )
      }
    ]
  });

const { drawerVisible, operateType, editingData, handleAdd, handleEdit, onDeleted } = useTableOperate(
  data,
  'id',
  getData
);

function refreshList() {
  searchParams.value.slotType = activeTab.value;
  getDataByPage();
}

watch(activeTab, () => {
  searchParams.value.pageNum = 1;
  refreshList();
});

onMounted(() => {
  refreshList();
});
</script>

<template>
  <div class="min-h-500px flex flex-1 flex-col gap-16px overflow-hidden lt-sm:overflow-auto">
    <NCard
      :bordered="false"
      size="small"
      class="card-wrapper flex min-h-0 flex-1 flex-col overflow-hidden sm:flex-1-hidden"
      content-class="flex min-h-0 flex-1 flex-col overflow-hidden"
    >
      <div class="flex shrink-0 flex-wrap items-center justify-between gap-12px">
        <NTabs v-model:value="activeTab" type="line" animated class="flex-1">
          <NTabPane name="dock" :tab="$t('page.wms.parkManagement.tabDock')" />
          <NTabPane name="parking" :tab="$t('page.wms.parkManagement.tabParking')" />
        </NTabs>
        <NButton v-if="hasAuth('wms:parkDock:add')" type="primary" @click="handleAdd">
          {{ $t('common.add') }}
        </NButton>
      </div>

      <div class="flex min-h-0 flex-1 flex-col pt-12px">
        <TableHeaderOperation
          v-model:columns="columnChecks"
          class="shrink-0"
          :loading="loading"
          :show-add="false"
          :show-delete="false"
          @refresh="getData"
        />
        <NDataTable
          flex-height
          :columns="columns"
          :data="data"
          :loading="loading"
          :scroll-x="scrollX"
          :row-key="row => String(row.id)"
          :pagination="false"
          size="small"
          remote
          class="min-h-0 flex-1"
        />
        <div
          class="flex shrink-0 flex-wrap items-center justify-end gap-12px border-t border-[#e6f0ff] pt-10px dark:border-white/10"
        >
          <NPagination
            v-model:page="pagination.page"
            v-model:page-size="pagination.pageSize"
            size="small"
            show-size-picker
            :page-sizes="pagination.pageSizes"
            :item-count="pagination.itemCount"
            :prefix="pagination.prefix"
          />
        </div>
      </div>
    </NCard>

    <ParkDockOperateDrawer
      v-model:visible="drawerVisible"
      :operate-type="operateType"
      :row-data="editingData"
      :slot-type="activeTab"
      @submitted="getData"
    />
  </div>
</template>
