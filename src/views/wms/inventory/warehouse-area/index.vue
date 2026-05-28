<script setup lang="tsx">
import { ref } from 'vue';
import { NButton, NDropdown, NTag } from 'naive-ui';
import {
  fetchBatchDeleteWarehouseArea,
  fetchGetWarehouseAreaList
} from '@/service/api/wms/warehouse-area';
import { useAppStore } from '@/store/modules/app';
import { useAuth } from '@/hooks/business/auth';
import { defaultTransform, useNaivePaginatedTable, useTableOperate } from '@/hooks/common/table';
import { useDict } from '@/hooks/business/dict';
import { $t } from '@/locales';
import DictTag from '@/components/custom/dict-tag.vue';
import TableHeaderOperation from '@/components/advanced/table-header-operation.vue';
import WarehouseAreaOperateDrawer from './modules/warehouse-area-operate-drawer.vue';
import WarehouseAreaSearch from './modules/warehouse-area-search.vue';

defineOptions({
  name: 'WarehouseAreaList'
});

useDict('wms_storage_method', true);
useDict('wms_warehouse_area_type', true);

const appStore = useAppStore();
const { hasAuth } = useAuth();

const searchParams = ref<Api.Wms.WarehouseAreaSearchParams>({
  pageNum: 1,
  pageSize: 10,
  areaName: null,
  areaType: null,
  storageMethod: null,
  orderByColumn: 'createTime',
  isAsc: 'desc'
});

const operateKey = {
  edit: 'edit',
  delete: 'delete'
} as const;

const { columns, columnChecks, data, getData, getDataByPage, loading, mobilePagination, scrollX } =
  useNaivePaginatedTable({
    api: () => fetchGetWarehouseAreaList(searchParams.value),
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
        key: 'areaName',
        title: $t('page.wms.inventory.warehouseArea.areaNameCol'),
        align: 'center',
        minWidth: 120,
        ellipsis: true
      },
      {
        key: 'storageMethod',
        title: $t('page.wms.inventory.warehouseArea.storageMethod'),
        align: 'center',
        width: 100,
        render(row) {
          return row.storageMethod ? (
            <DictTag value={row.storageMethod} dictCode="wms_storage_method" />
          ) : (
            '—'
          );
        }
      },
      {
        key: 'areaType',
        title: $t('page.wms.inventory.warehouseArea.areaType'),
        align: 'center',
        minWidth: 120,
        render(row) {
          return row.areaType ? <DictTag value={row.areaType} dictCode="wms_warehouse_area_type" /> : '—';
        }
      },
      {
        key: 'locationMixedStorage',
        title: $t('page.wms.inventory.warehouseArea.locationMixedStorage'),
        align: 'center',
        width: 120,
        render(row) {
          return (
            <NTag size="small" type={row.locationMixedStorage ? 'success' : 'default'} bordered={false}>
              {row.locationMixedStorage ? $t('common.yesOrNo.yes') : $t('common.yesOrNo.no')}
            </NTag>
          );
        }
      },
      {
        key: 'maxMixedQty',
        title: $t('page.wms.inventory.warehouseArea.maxMixedQty'),
        align: 'center',
        width: 120,
        render(row) {
          if (!row.locationMixedStorage) return '—';
          return row.maxMixedQty ?? '—';
        }
      },
      {
        key: 'createTime',
        title: $t('page.wms.inventory.warehouseArea.createTime'),
        align: 'center',
        width: 120
      },
      {
        key: 'operate',
        title: $t('common.operate'),
        align: 'center',
        width: 140,
        render: row => {
          const dropdownOptions = [];
          if (hasAuth('wms:warehouseArea:edit')) {
            dropdownOptions.push({ key: operateKey.edit, label: $t('common.edit') });
          }
          if (hasAuth('wms:warehouseArea:remove')) {
            dropdownOptions.push({ key: operateKey.delete, label: $t('common.delete') });
          }

          const moreBtn =
            dropdownOptions.length > 0 ? (
              <NDropdown
                trigger="click"
                placement="bottom-end"
                options={dropdownOptions}
                onSelect={(key: string) => {
                  if (key === operateKey.edit) {
                    editArea(row.id!);
                    return;
                  }
                  if (key === operateKey.delete) {
                    window.$dialog?.warning({
                      title: $t('common.warning'),
                      content: $t('common.confirmDelete'),
                      positiveText: $t('common.confirm'),
                      negativeText: $t('common.cancel'),
                      onPositiveClick: async () => handleDelete(row.id!)
                    });
                  }
                }}
              >
                <NButton size="small" quaternary>
                  {$t('common.more')}
                </NButton>
              </NDropdown>
            ) : null;

          return <div class="flex-center flex-wrap gap-8px">{moreBtn}</div>;
        }
      }
    ]
  });

const { drawerVisible, operateType, editingData, handleAdd, handleEdit, checkedRowKeys, onBatchDeleted, onDeleted } =
  useTableOperate(data, 'id', getData);

function editArea(id: CommonType.IdType) {
  handleEdit(id);
}

async function handleDelete(id: CommonType.IdType) {
  const { error } = await fetchBatchDeleteWarehouseArea([id]);
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
      const { error } = await fetchBatchDeleteWarehouseArea(checkedRowKeys.value);
      if (error) return;
      onBatchDeleted();
    }
  });
}
</script>

<template>
  <div class="h-full min-h-500px flex flex-col gap-16px overflow-hidden lt-sm:overflow-auto">
    <WarehouseAreaSearch
      v-model:model="searchParams"
      :can-add="hasAuth('wms:warehouseArea:add')"
      :can-batch-delete="hasAuth('wms:warehouseArea:remove')"
      :batch-disabled="checkedRowKeys.length === 0"
      @search="getDataByPage"
      @add="handleAdd"
      @batch-delete="handleBatchDelete"
    />

    <NCard
      :bordered="false"
      size="small"
      class="card-wrapper flex min-h-0 flex-1 flex-col overflow-hidden sm:flex-1-hidden"
      content-class="flex min-h-0 flex-1 flex-col overflow-hidden"
    >
      <template #header>
        <div class="flex-y-center justify-between gap-12px">
          <span class="text-16px font-medium">{{ $t('page.wms.inventory.warehouseArea.title') }}</span>
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

    <WarehouseAreaOperateDrawer
      v-model:visible="drawerVisible"
      :operate-type="operateType"
      :row-data="editingData"
      @submitted="getDataByPage"
    />
  </div>
</template>

<style scoped></style>
