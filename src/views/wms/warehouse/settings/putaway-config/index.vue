<script setup lang="tsx">
import { ref } from 'vue';
import { NButton } from 'naive-ui';
import {
  fetchDeletePutawayRule,
  fetchGetPutawayRuleList
} from '@/service/api/wms/putaway-rule';
import { useAppStore } from '@/store/modules/app';
import { useAuth } from '@/hooks/business/auth';
import { defaultTransform, useNaivePaginatedTable } from '@/hooks/common/table';
import { useDict } from '@/hooks/business/dict';
import { $t } from '@/locales';
import DictTag from '@/components/custom/dict-tag.vue';
import TableHeaderOperation from '@/components/advanced/table-header-operation.vue';
import PutawayConfigSearch from './modules/putaway-config-search.vue';
import PutawayFallbackAllocationModal from './modules/putaway-fallback-allocation-modal.vue';
import PutawayRuleOperateModal from './modules/putaway-rule-operate-modal.vue';

defineOptions({
  name: 'PutawayConfig'
});

useDict('wms_storage_method', true);
useDict('wms_warehouse_area_type', true);
useDict('delivery_type', true);

const appStore = useAppStore();
const { hasAuth } = useAuth();

const searchParams = ref<Api.Wms.PutawayRuleSearchParams>({
  pageNum: 1,
  pageSize: 10,
  areaName: null,
  locationCode: null,
  areaType: null,
  storageMethod: null,
  dispatchMethod: null,
  platformId: null,
  platformWarehouseCode: null,
  orderByColumn: 'createTime',
  isAsc: 'desc'
});

const ruleModalVisible = ref(false);
const editingRuleId = ref<CommonType.IdType | null>(null);
const editingPayload = ref<string | null>(null);

const fallbackModalVisible = ref(false);

function openAdd() {
  editingRuleId.value = null;
  editingPayload.value = null;
  ruleModalVisible.value = true;
}

function openEdit(row: Api.Wms.PutawayRule) {
  editingRuleId.value = row.id ?? null;
  editingPayload.value = row.rulePayload ?? null;
  ruleModalVisible.value = true;
}

function openFallbackAllocation() {
  fallbackModalVisible.value = true;
}

function cellText(v: string | null | undefined) {
  const t = v?.trim();
  return t ? t : '—';
}

const { columns, columnChecks, data, getData, getDataByPage, loading, mobilePagination, scrollX } =
  useNaivePaginatedTable({
    paginationProps: {
      pageSizes: [10, 30, 50, 100, 300, 500]
    },
    api: () => fetchGetPutawayRuleList(searchParams.value),
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
        key: 'areaName',
        title: $t('page.wms.inventory.warehouseArea.areaNameCol'),
        align: 'center',
        minWidth: 100,
        ellipsis: { tooltip: true },
        render: row => cellText(row.areaName)
      },
      {
        key: 'locationCode',
        title: $t('page.wms.inventory.location.location'),
        align: 'center',
        minWidth: 100,
        ellipsis: { tooltip: true },
        render: row => cellText(row.locationCode)
      },
      {
        key: 'areaType',
        title: $t('page.wms.inventory.warehouseArea.areaType'),
        align: 'center',
        minWidth: 100,
        render(row) {
          return row.areaType ? <DictTag value={row.areaType} dictCode="wms_warehouse_area_type" /> : '—';
        }
      },
      {
        key: 'storageMethod',
        title: $t('page.wms.inventory.warehouseArea.storageMethod'),
        align: 'center',
        minWidth: 100,
        render(row) {
          return row.storageMethod ? <DictTag value={row.storageMethod} dictCode="wms_storage_method" /> : '—';
        }
      },
      {
        key: 'priorityDisplay',
        title: $t('page.wms.inventory.warehouseArea.putawayPriority'),
        align: 'center',
        width: 88,
        ellipsis: { tooltip: true },
        render: row => cellText(row.priorityDisplay)
      },
      {
        key: 'dispatchMethodDisplay',
        title: $t('page.wms.inventory.warehouseArea.putawayDispatchMethod'),
        align: 'center',
        minWidth: 100,
        ellipsis: { tooltip: true },
        render: row => cellText(row.dispatchMethodDisplay)
      },
      {
        key: 'platformDisplay',
        title: $t('page.wms.inventory.warehouseArea.putawayPlatform'),
        align: 'center',
        minWidth: 120,
        ellipsis: { tooltip: true },
        render: row => cellText(row.platformDisplay)
      },
      {
        key: 'platformCodesDisplay',
        title: $t('page.wms.inventory.warehouseArea.putawayPlatformCodes'),
        align: 'center',
        minWidth: 120,
        ellipsis: { tooltip: true },
        render: row => cellText(row.platformCodesDisplay)
      },
      {
        key: 'operate',
        title: $t('common.operate'),
        align: 'center',
        width: 160,
        fixed: 'right',
        render: row => (
          <div class="flex-center flex-wrap gap-8px">
            {hasAuth('wms:putawayRule:edit') ? (
              <NButton size="small" type="primary" secondary onClick={() => openEdit(row)}>
                {$t('common.edit')}
              </NButton>
            ) : null}
            {hasAuth('wms:putawayRule:remove') ? (
              <NButton
                size="small"
                type="error"
                secondary
                onClick={() => {
                  window.$dialog?.warning({
                    title: $t('common.warning'),
                    content: $t('common.confirmDelete'),
                    positiveText: $t('common.confirm'),
                    negativeText: $t('common.cancel'),
                    onPositiveClick: async () => {
                      if (row.id == null) return;
                      const { error } = await fetchDeletePutawayRule(row.id);
                      if (error) return;
                      window.$message?.success($t('common.deleteSuccess'));
                      await getDataByPage();
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
</script>

<template>
  <div class="h-full min-h-500px flex flex-col gap-16px overflow-hidden lt-sm:overflow-auto">
    <PutawayConfigSearch
      v-model:model="searchParams"
      @search="getDataByPage"
      @add-rule="openAdd"
      @fallback-allocation="openFallbackAllocation"
    />

    <NCard
      :bordered="false"
      size="small"
      class="card-wrapper flex min-h-0 flex-1 flex-col overflow-hidden sm:flex-1-hidden"
      content-class="flex min-h-0 flex-1 flex-col overflow-hidden"
    >
      <template #header>
        <div class="flex-y-center justify-between gap-12px">
          <span class="text-16px font-medium">{{ $t('page.wms.putawayRule.title') }}</span>
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

    <PutawayRuleOperateModal
      :key="String(editingRuleId ?? 'new')"
      v-model:visible="ruleModalVisible"
      :rule-id="editingRuleId"
      :initial-payload="editingPayload"
      @submitted="getDataByPage"
    />

    <PutawayFallbackAllocationModal v-model:visible="fallbackModalVisible" />
  </div>
</template>
