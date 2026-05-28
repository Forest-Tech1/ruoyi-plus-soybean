<script setup lang="tsx">
import { ref } from 'vue';
import { useBoolean } from '@sa/hooks';
import {
  fetchBatchDeleteWarehouseLocation,
  fetchBatchUpdateWarehouseLocationStatus,
  fetchGetWarehouseLocationList
} from '@/service/api/wms/location';
import { useAppStore } from '@/store/modules/app';
import { useAuth } from '@/hooks/business/auth';
import { defaultTransform, useNaivePaginatedTable, useTableOperate } from '@/hooks/common/table';
import { useDict } from '@/hooks/business/dict';
import { $t } from '@/locales';
import ButtonIcon from '@/components/custom/button-icon.vue';
import DictTag from '@/components/custom/dict-tag.vue';
import TableHeaderOperation from '@/components/advanced/table-header-operation.vue';
import LocationOperateDrawer from './modules/location-operate-drawer.vue';
import LocationImportModal from './modules/location-import-modal.vue';
import LocationSearch from './modules/location-search.vue';

defineOptions({
  name: 'WarehouseLocationList'
});

useDict('sys_normal_disable', true);

const appStore = useAppStore();
const { hasAuth } = useAuth();

const { bool: importVisible, setTrue: openImport, setFalse: closeImport } = useBoolean();

const searchParams = ref<Api.Wms.WarehouseLocationSearchParams>({
  pageNum: 1,
  pageSize: 10,
  zoneCode: null,
  locationKeyword: null,
  keyword: null,
  status: null,
  orderByColumn: 'createTime',
  isAsc: 'desc'
});

const { columns, columnChecks, data, getData, getDataByPage, loading, mobilePagination, scrollX } =
  useNaivePaginatedTable({
    api: () => fetchGetWarehouseLocationList(searchParams.value),
    transform: response => defaultTransform(response),
    onPaginationParamsChange: params => {
      searchParams.value.pageNum = params.page;
      searchParams.value.pageSize = params.pageSize;
    },
    columns: () => [
      {
        type: 'selection',
        align: 'center',
        width: 48
      },
      {
        key: 'index',
        title: $t('common.index'),
        align: 'center',
        width: 64,
        render: (_row, index) =>
          (searchParams.value.pageNum! - 1) * (searchParams.value.pageSize || 10) + index + 1
      },
      {
        key: 'zoneCode',
        title: $t('page.wms.inventory.location.zone'),
        align: 'center',
        width: 88,
        ellipsis: true
      },
      {
        key: 'locationCode',
        title: $t('page.wms.inventory.location.location'),
        align: 'center',
        minWidth: 100,
        ellipsis: true
      },
      {
        key: 'rowRank',
        title: $t('page.wms.inventory.location.rowRank'),
        align: 'center',
        width: 72,
        render(row) {
          return row.rowRank != null ? row.rowRank : '—';
        }
      },
      {
        key: 'columnRank',
        title: $t('page.wms.inventory.location.columnRank'),
        align: 'center',
        width: 72,
        render(row) {
          return row.columnRank != null ? row.columnRank : '—';
        }
      },
      {
        key: 'capacity',
        title: $t('page.wms.inventory.location.capacity'),
        align: 'center',
        width: 100
      },
      {
        key: 'status',
        title: $t('page.wms.inventory.location.status'),
        align: 'center',
        width: 100,
        render(row) {
          return row.status != null ? <DictTag value={row.status} dictCode="sys_normal_disable" /> : '—';
        }
      },
      {
        key: 'operate',
        title: $t('common.operate'),
        align: 'center',
        width: 140,
        render: row => {
          const editBtn = () =>
            hasAuth('wms:location:edit') ? (
              <ButtonIcon
                text
                type="primary"
                icon="material-symbols:drive-file-rename-outline-outline"
                tooltipContent={$t('common.edit')}
                onClick={() => editLocation(row.id!)}
              />
            ) : null;

          const deleteBtn = () =>
            hasAuth('wms:location:remove') ? (
              <ButtonIcon
                text
                type="error"
                icon="material-symbols:delete-outline"
                tooltipContent={$t('common.delete')}
                popconfirmContent={$t('common.confirmDelete')}
                onPositiveClick={() => handleDelete(row.id!)}
              />
            ) : null;

          const nodes = [editBtn(), deleteBtn()].filter(Boolean);
          return <div class="flex-center flex-wrap gap-8px">{nodes}</div>;
        }
      }
    ]
  });

const { drawerVisible, operateType, editingData, handleAdd, handleEdit, checkedRowKeys, onBatchDeleted, onDeleted } =
  useTableOperate(data, 'id', getData);

function editLocation(id: CommonType.IdType) {
  handleEdit(id);
}

async function handleDelete(id: CommonType.IdType) {
  const { error } = await fetchBatchDeleteWarehouseLocation([id]);
  if (error) return;
  onDeleted();
}

async function handleBatchDelete() {
  if (!checkedRowKeys.value.length) {
    window.$message?.warning($t('common.noSelectRecord'));
    return;
  }
  window.$dialog?.warning({
    title: $t('common.warning'),
    content: $t('common.confirmDelete'),
    positiveText: $t('common.confirm'),
    negativeText: $t('common.cancel'),
    onPositiveClick: async () => {
      const { error } = await fetchBatchDeleteWarehouseLocation(checkedRowKeys.value);
      if (error) return;
      onBatchDeleted();
    }
  });
}

async function handleBatchStatus(status: Api.Common.EnableStatus) {
  if (!checkedRowKeys.value.length) {
    window.$message?.warning($t('common.noSelectRecord'));
    return;
  }
  const { error } = await fetchBatchUpdateWarehouseLocationStatus({
    ids: checkedRowKeys.value,
    status
  });
  if (error) return;
  window.$message?.success($t('common.modifySuccess'));
  checkedRowKeys.value = [];
  await getData();
}

function onImportSubmitted() {
  closeImport();
  getDataByPage();
}
</script>

<template>
  <div class="h-full min-h-500px flex flex-col gap-16px overflow-hidden lt-sm:overflow-auto">
    <LocationSearch
      v-model:model="searchParams"
      :can-add="hasAuth('wms:location:add')"
      :can-import="hasAuth('wms:location:import')"
      :can-batch-delete="hasAuth('wms:location:remove')"
      :can-batch-status="hasAuth('wms:location:status')"
      :batch-disabled="checkedRowKeys.length === 0"
      @search="getDataByPage"
      @add="handleAdd"
      @import="openImport"
      @batch-delete="handleBatchDelete"
      @batch-status="handleBatchStatus"
    />

    <NCard
      :bordered="false"
      size="small"
      class="card-wrapper flex min-h-0 flex-1 flex-col overflow-hidden sm:flex-1-hidden"
      content-class="flex min-h-0 flex-1 flex-col overflow-hidden"
    >
      <template #header>
        <div class="flex-y-center justify-between gap-12px">
          <span class="text-16px font-medium">{{ $t('page.wms.inventory.location.title') }}</span>
          <TableHeaderOperation
            v-model:columns="columnChecks"
            :loading="loading"
            :show-add="false"
            :show-delete="false"
            @refresh="getData"
          />
        </div>
      </template>
      <div class="min-h-0 flex flex-1 flex-col overflow-hidden">
        <DataTable
          v-model:checked-row-keys="checkedRowKeys"
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
    </NCard>

    <LocationOperateDrawer
      v-model:visible="drawerVisible"
      :operate-type="operateType"
      :row-data="editingData"
      @submitted="getDataByPage"
    />
    <LocationImportModal v-model:visible="importVisible" @submitted="onImportSubmitted" />
  </div>
</template>

<style scoped></style>
