<script setup lang="tsx">
import { h, onMounted, ref } from 'vue';
import { watchDebounced } from '@vueuse/core';
import { NButton, NDropdown, NInput, NPagination, NSpin } from 'naive-ui';
import type { DropdownOption } from 'naive-ui';
import { useBoolean } from '@sa/hooks';
import {
  fetchBatchDeleteWarehouseLocation,
  fetchBatchUpdateWarehouseLocationStatus,
  fetchGetWarehouseLocationList
} from '@/service/api/wms/location';
import { fetchGetWarehouseAreaList } from '@/service/api/wms/warehouse-area';
import { useAppStore } from '@/store/modules/app';
import { useAuth } from '@/hooks/business/auth';
import { defaultTransform, useNaivePaginatedTable, useTableOperate } from '@/hooks/common/table';
import { useDict } from '@/hooks/business/dict';
import { $t } from '@/locales';
import ButtonIcon from '@/components/custom/button-icon.vue';
import DictTag from '@/components/custom/dict-tag.vue';
import TableHeaderOperation from '@/components/advanced/table-header-operation.vue';
import SvgIcon from '@/components/custom/svg-icon.vue';
import LocationOperateDrawer from './modules/location-operate-drawer.vue';
import LocationDetailDrawer from './modules/location-detail-drawer.vue';
import LocationImportModal from './modules/location-import-modal.vue';
import LocationTopCollapseSearch from './modules/location-top-collapse-search.vue';

defineOptions({
  name: 'WarehouseLocationList'
});

useDict('sys_normal_disable', true);
useDict('wms_storage_method', true);
useDict('wms_warehouse_area_type', true);

const appStore = useAppStore();
const { hasAuth } = useAuth();

const { bool: importVisible, setTrue: openImport, setFalse: closeImport } = useBoolean();

const searchExpanded = ref(true);

const detailVisible = ref(false);
const detailLocationId = ref<CommonType.IdType | null>(null);

function openDetail(id: CommonType.IdType) {
  detailLocationId.value = id;
  detailVisible.value = true;
}

const searchParams = ref<Api.Wms.WarehouseLocationSearchParams>({
  pageNum: 1,
  pageSize: 10,
  zoneCode: null,
  locationKeyword: null,
  keyword: null,
  status: null,
  orderByColumn: 'locationCode',
  isAsc: 'asc'
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
        key: 'currentStock',
        title: $t('page.wms.inventory.location.currentStock'),
        align: 'center',
        width: 100
      },
      {
        key: 'remainingCapacity',
        title: $t('page.wms.inventory.location.remainingCapacity'),
        align: 'center',
        width: 110
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
        width: 180,
        render: row => {
          const detailBtn = () => (
            <ButtonIcon
              text
              type="primary"
              icon="material-symbols:info-outline"
              tooltipContent={$t('common.detail')}
              onClick={() => openDetail(row.id!)}
            />
          );
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

          const nodes = [detailBtn(), editBtn(), deleteBtn()].filter(Boolean);
          return <div class="flex-center flex-wrap gap-8px">{nodes}</div>;
        }
      }
    ]
  });

/** 库区列表（左侧，服务端分页；须在 getDataByPage 初始化之后，供 selectArea 使用） */
const areas = ref<Api.Wms.WarehouseArea[]>([]);
const areaLoading = ref(false);
const areaSearchKeyword = ref('');
const areaPageNum = ref(1);
const areaPageSize = ref(12);
const areaTotal = ref(0);

/** 选中库区：id 用于当前页高亮；zoneCode 单独保存，避免分页切换当前页后找不到行导致筛选丢失 */
const selectedAreaId = ref<CommonType.IdType | null>(null);
const selectedZoneCode = ref<string | null>(null);

async function loadAreas() {
  areaLoading.value = true;
  const { data, error } = await fetchGetWarehouseAreaList({
    pageNum: areaPageNum.value,
    pageSize: areaPageSize.value,
    areaName: areaSearchKeyword.value?.trim() || undefined,
    orderByColumn: 'areaName',
    isAsc: 'asc'
  });
  areaLoading.value = false;
  if (error || !data?.rows) {
    areas.value = [];
    areaTotal.value = 0;
    return;
  }
  areas.value = data.rows;
  areaTotal.value = Number(data.total) || 0;
}

function syncZoneFromSelection() {
  searchParams.value.zoneCode = selectedZoneCode.value;
}

function selectArea(id: CommonType.IdType | null, zoneName?: string | null) {
  selectedAreaId.value = id;
  selectedZoneCode.value = id == null ? null : (zoneName ?? null);
  searchParams.value.pageNum = 1;
  syncZoneFromSelection();
  getDataByPage();
}

function onAreaPageChange() {
  void loadAreas();
}

function onAreaPageSizeChange() {
  areaPageNum.value = 1;
  void loadAreas();
}

watchDebounced(
  areaSearchKeyword,
  () => {
    areaPageNum.value = 1;
    void loadAreas();
  },
  { debounce: 400 }
);

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

const statusBatchOptions: DropdownOption[] = [
  {
    label: () => $t('page.wms.inventory.location.statusEnable'),
    key: '0',
    icon: () => h(SvgIcon, { icon: 'material-symbols:check-circle-outline', class: 'text-18px' }),
    disabled: !hasAuth('wms:location:status')
  },
  {
    label: () => $t('page.wms.inventory.location.statusDisable'),
    key: '1',
    icon: () => h(SvgIcon, { icon: 'material-symbols:block', class: 'text-18px' }),
    disabled: !hasAuth('wms:location:status')
  }
];

function handleStatusBatchSelect(key: string | number) {
  handleBatchStatus(String(key) as Api.Common.EnableStatus);
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
  void loadAreas();
  getDataByPage();
}

onMounted(() => {
  void loadAreas();
});
</script>

<template>
  <div class="h-full min-h-500px flex flex-col gap-16px overflow-hidden lt-sm:overflow-auto">
    <LocationTopCollapseSearch v-model:expanded="searchExpanded" v-model:model="searchParams" @search="getDataByPage" />

    <NCard
      :bordered="false"
      class="card-wrapper flex min-h-0 flex-1 flex-col overflow-hidden sm:flex-1-hidden"
      content-class="flex min-h-0 flex-1 flex-col overflow-hidden"
    >
      <div class="mb-16px shrink-0 flex flex-wrap items-center justify-between gap-12px">
        <span class="text-18px font-600">{{ $t('page.wms.inventory.location.title') }}</span>
      </div>

      <div class="flex min-h-0 flex-1 gap-16px overflow-hidden lt-md:flex-col">
        <!-- 左侧库区：栏宽正常，单元格卡片做扁（减少纵向占用） -->
        <div
          class="flex min-h-0 w-[260px] shrink-0 flex-col gap-8px self-stretch overflow-hidden border border-gray-200 rounded-8px p-10px dark:border-gray-700 lt-md:w-full lt-md:max-h-[min(42vh,320px)] lt-md:self-auto"
        >
          <div class="flex items-center justify-between gap-8px">
            <span class="truncate text-14px font-600">{{ $t('page.wms.inventory.location.areaList') }}</span>
            <span class="shrink-0 whitespace-nowrap text-12px text-gray-500 tabular-nums dark:text-gray-400">
              {{ $t('datatable.itemCount', { total: areaTotal }) }}
            </span>
          </div>
          <NInput
            v-model:value="areaSearchKeyword"
            clearable
            size="small"
            :placeholder="$t('page.wms.inventory.location.areaSearchPlaceholder')"
          >
            <template #prefix>
              <SvgIcon icon="material-symbols:search" class="text-16px text-gray-400" />
            </template>
          </NInput>
          <!-- flex 链 + min-h-0 + 单独 overflow-y，保证列表可纵向滚动（NSpin 不参与撑高） -->
          <div class="relative min-h-[100px] flex flex-1 flex-col overflow-hidden">
            <div class="area-card-list min-h-0 flex-1 overflow-y-auto overscroll-contain py-2px">
              <div class="flex flex-col gap-4px">
                <div
                  class="area-card cursor-pointer rounded-4px border px-8px py-6px transition-colors"
                  :class="
                    selectedAreaId === null
                      ? 'border-primary bg-primary/5'
                      : 'border-gray-200 bg-gray-50 dark:border-gray-600 dark:bg-gray-800/50'
                  "
                  @click="selectArea(null)"
                >
                  <div class="truncate text-13px font-600 leading-tight">{{ $t('page.wms.inventory.location.allLocations') }}</div>
                  <div class="mt-2px truncate text-10px text-gray-500 leading-none">
                    {{ $t('page.wms.inventory.location.allLocationsHint') }}
                  </div>
                </div>

                <div
                  v-for="a in areas"
                  :key="String(a.id)"
                  class="area-card cursor-pointer rounded-4px border px-8px py-6px transition-colors"
                  :class="
                    selectedAreaId === a.id
                      ? 'border-primary bg-primary/5'
                      : 'border-gray-200 bg-gray-50 dark:border-gray-600 dark:bg-gray-800/50'
                  "
                  @click="selectArea(a.id, a.areaName)"
                >
                  <div class="truncate text-12px font-600 leading-tight" :title="a.areaName">{{ a.areaName }}</div>
                  <div class="mt-4px flex flex-wrap items-center gap-4px">
                    <DictTag
                      v-if="a.areaType"
                      :value="a.areaType"
                      dict-code="wms_warehouse_area_type"
                      :immediate="true"
                      size="small"
                    />
                    <DictTag
                      v-if="a.storageMethod"
                      :value="a.storageMethod"
                      dict-code="wms_storage_method"
                      :immediate="true"
                      size="small"
                    />
                    <span v-if="!a.areaType && !a.storageMethod" class="text-10px text-gray-400 leading-none">—</span>
                  </div>
                </div>

                <div v-if="!areaLoading && !areas.length" class="py-12px text-center text-12px text-gray-500">
                  {{ $t('common.noData') }}
                </div>
              </div>
            </div>
            <div
              v-show="areaLoading"
              class="pointer-events-none absolute inset-0 z-[1] flex items-center justify-center rounded-6px bg-white/70 backdrop-blur-[1px] dark:bg-black/35"
            >
              <NSpin size="small" />
            </div>
          </div>
          <NPagination
            v-model:page="areaPageNum"
            v-model:page-size="areaPageSize"
            class="area-pagination shrink-0 justify-center pb-2px pt-4px"
            size="small"
            :page-sizes="[8, 12, 16, 24]"
            :item-count="areaTotal"
            show-size-picker
            @update:page="onAreaPageChange"
            @update:page-size="onAreaPageSizeChange"
          />
        </div>

        <!-- 右侧库位 -->
        <div class="min-h-0 min-w-0 flex flex-1 flex-col overflow-hidden">
          <div class="mb-12px flex flex-wrap items-center justify-between gap-12px">
            <NSpace wrap :size="8">
              <NButton :disabled="!hasAuth('wms:location:remove') || checkedRowKeys.length === 0" @click="handleBatchDelete">
                <template #icon>
                  <icon-material-symbols-delete-outline class="text-icon" />
                </template>
                {{ $t('common.batchDelete') }}
              </NButton>
              <NDropdown
                :options="statusBatchOptions"
                :disabled="!hasAuth('wms:location:status') || checkedRowKeys.length === 0"
                @select="handleStatusBatchSelect"
              >
                <NButton :disabled="!hasAuth('wms:location:status')">
                  {{ $t('page.wms.inventory.location.changeStatus') }}
                  <template #icon>
                    <icon-material-symbols-keyboard-arrow-down-rounded class="text-icon" />
                  </template>
                </NButton>
              </NDropdown>
              <NButton type="primary" :disabled="!hasAuth('wms:location:add')" @click="handleAdd">
                <template #icon>
                  <icon-material-symbols-add-rounded class="text-icon" />
                </template>
                {{ $t('page.wms.inventory.location.addLocation') }}
              </NButton>
              <NButton :disabled="!hasAuth('wms:location:import')" @click="openImport">
                <template #icon>
                  <icon-material-symbols-upload-rounded class="text-icon" />
                </template>
                {{ $t('page.wms.inventory.location.importLocation') }}
              </NButton>
            </NSpace>
            <TableHeaderOperation
              v-model:columns="columnChecks"
              :loading="loading"
              :show-add="false"
              :show-delete="false"
              @refresh="getData"
            />
          </div>

          <div class="min-h-280px flex min-h-0 flex-1 flex-col overflow-hidden sm:min-h-0">
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
        </div>
      </div>
    </NCard>

    <LocationOperateDrawer
      v-model:visible="drawerVisible"
      :operate-type="operateType"
      :row-data="editingData"
      @submitted="getDataByPage"
    />
    <LocationImportModal v-model:visible="importVisible" @submitted="onImportSubmitted" />

    <LocationDetailDrawer
      v-model:visible="detailVisible"
      :location-id="detailLocationId"
      @updated="getDataByPage"
    />
  </div>
</template>

<style scoped>
.area-card-list {
  scrollbar-gutter: stable;
}
.area-pagination :deep(.n-pagination) {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  row-gap: 6px;
  font-size: 12px;
}
</style>
