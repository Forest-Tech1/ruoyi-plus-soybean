<script setup lang="tsx">
import { computed, h, onMounted, ref, watch } from 'vue';
import type { DataTableRowKey } from 'naive-ui';
import {
  NBadge,
  NButton,
  NCard,
  NDataTable,
  NDropdown,
  NInput,
  NSelect,
  NSpace,
  NSpin,
  NTag,
  NTooltip
} from 'naive-ui';
import type { DropdownOption } from 'naive-ui';
import { useBoolean } from '@sa/hooks';
import {
  fetchBatchPlatformWarehouseStatus,
  fetchGetPlatformDisableCheck,
  fetchGetPlatformList,
  fetchGetPlatformWarehouseList,
  fetchUpdatePlatformStatus,
  fetchUpdatePlatformWarehouseStatus
} from '@/service/api/basic/platform-warehouse';
import { countryFlagEmoji, getCountryLabel } from '@/constants/basic-platform';
import { COUNTRY_OPTIONS } from '@/constants/basic-platform';
import { useAppStore } from '@/store/modules/app';
import { useAuth } from '@/hooks/business/auth';
import { useDownload } from '@/hooks/business/download';
import { defaultTransform, useNaivePaginatedTable } from '@/hooks/common/table';
import { $t } from '@/locales';
import SvgIcon from '@/components/custom/svg-icon.vue';
import PlatformOperateDrawer from './modules/platform-operate-drawer.vue';
import PlatformWarehouseImportModal from './modules/platform-warehouse-import-modal.vue';
import WarehouseOperateDrawer from './modules/warehouse-operate-drawer.vue';
import WarehouseDetailDrawer from './modules/warehouse-detail-drawer.vue';

defineOptions({
  name: 'BasicPlatformWarehouse'
});

const appStore = useAppStore();
const { hasAuth } = useAuth();
const { download } = useDownload();

/** 列表「详细地址」列：街道在前，其次城市，最后州/省（与业务阅读习惯一致） */
function warehouseAddressLineDisplay(row: Api.Basic.PlatformWarehouse) {
  return [row.addressLine, row.city, row.stateProvince].filter(Boolean).join(' ');
}

/** 国家展示：已知 ISO2 时只用字典国名，避免后端 countryName 出现「us United States」等与代码重复 */
function warehousePalletCbmDisplay(row: Api.Basic.PlatformWarehouse) {
  const v = row.palletCbm;
  if (v == null) return '—';
  const n = Number(v);
  if (!Number.isFinite(n)) return '—';
  return String(n);
}

function warehouseCountryDisplay(row: Api.Basic.PlatformWarehouse) {
  const raw = (row.countryCode ?? '').trim();
  const codeUpper = raw.toUpperCase();
  if (COUNTRY_OPTIONS.some(c => c.code === codeUpper)) {
    return getCountryLabel(codeUpper, appStore.locale);
  }
  const name = row.countryName?.trim();
  if (name) return name;
  if (raw) return raw;
  return '—';
}

const platforms = ref<Api.Basic.Platform[]>([]);
const selectedPlatformId = ref<CommonType.IdType | null>(null);
const platformLoading = ref(false);
/** 左侧平台列表模糊搜索（平台名称、代码，本地过滤） */
const platformSearchKeyword = ref('');

const { bool: platformDrawerVisible, setTrue: openPlatformDrawer } = useBoolean();
const platformEditRow = ref<Api.Basic.Platform | null>(null);

const { bool: warehouseDrawerVisible, setTrue: openWarehouseDrawer } = useBoolean();
const warehouseEditRow = ref<Api.Basic.PlatformWarehouse | null>(null);

const { bool: detailVisible, setTrue: openDetail } = useBoolean();

const { bool: warehouseImportVisible, setTrue: openWarehouseImport } = useBoolean();
const detailWarehouseId = ref<CommonType.IdType | null>(null);

const checkedRowKeys = ref<DataTableRowKey[]>([]);

const searchParams = ref<Api.Basic.PlatformWarehouseSearchParams>({
  platformId: 0 as unknown as CommonType.IdType,
  pageNum: 1,
  pageSize: 10,
  keyword: null,
  status: null,
  countryCodes: null
});

const selectedPlatform = computed(() => platforms.value.find(p => p.id === selectedPlatformId.value) ?? null);

function platformMatchesKeyword(p: Api.Basic.Platform, raw: string) {
  const q = raw.trim();
  if (!q) return true;
  const name = p.platformName ?? '';
  const code = (p.platformCode ?? '').toLowerCase();
  return name.includes(q) || code.includes(q.toLowerCase());
}

const filteredPlatforms = computed(() =>
  platforms.value.filter(p => platformMatchesKeyword(p, platformSearchKeyword.value))
);

/** 筛选后若当前选中不在结果中，自动选中第一条可见平台，避免左侧无高亮 */
watch([filteredPlatforms, platformSearchKeyword], () => {
  const list = filteredPlatforms.value;
  if (!list.length) return;
  const sid = selectedPlatformId.value;
  if (sid == null || !list.some(p => p.id === sid)) {
    selectedPlatformId.value = list[0]!.id;
  }
});

/** 清空表示「全部」，与 NSelect clearable 一致 */
const statusFilterOptions = computed(() => [
  { label: $t('page.basic.platformWarehouse.enabled'), value: '0' },
  { label: $t('page.basic.platformWarehouse.disabled'), value: '1' }
]);

const countryFilterOptions = computed(() =>
  COUNTRY_OPTIONS.map(c => ({
    label: appStore.locale === 'zh-CN' ? c.nameZh : c.nameEn,
    value: c.code
  }))
);

async function loadPlatforms() {
  platformLoading.value = true;
  const { data, error } = await fetchGetPlatformList();
  platformLoading.value = false;
  if (error || !data) {
    platforms.value = [];
    return;
  }
  platforms.value = data;
  if (selectedPlatformId.value == null && data.length) {
    selectedPlatformId.value = data[0]!.id;
  } else if (selectedPlatformId.value && !data.some(p => p.id === selectedPlatformId.value)) {
    selectedPlatformId.value = data[0]?.id ?? null;
  }
}

function selectPlatform(id: CommonType.IdType) {
  selectedPlatformId.value = id;
}

const { columns, data, getDataByPage, loading, mobilePagination, scrollX } = useNaivePaginatedTable({
  paginationProps: {
    pageSizes: [10, 30, 50, 100, 300, 500]
  },
  api: () => {
    if (selectedPlatformId.value == null) {
      return Promise.resolve({
        data: { rows: [], total: 0, pageNum: 1 },
        error: null
      } as unknown as Awaited<ReturnType<typeof fetchGetPlatformWarehouseList>>);
    }
    searchParams.value.platformId = selectedPlatformId.value;
    return fetchGetPlatformWarehouseList(searchParams.value);
  },
  transform: response => defaultTransform<Api.Basic.PlatformWarehouse>(response),
  onPaginationParamsChange: params => {
    searchParams.value.pageNum = params.page ?? 1;
    searchParams.value.pageSize = params.pageSize ?? 10;
  },
  columns: () => [
    { type: 'selection', width: 48, align: 'center' },
    {
      key: 'warehouseCode',
      title: $t('page.basic.platformWarehouse.warehouseCodeCol'),
      width: 120,
      align: 'left',
      render: row => (
        <NTooltip placement="top">
          {{
            trigger: () => (
              <NButton
                text
                type="primary"
                class="font-mono"
                onClick={async () => {
                  try {
                    await navigator.clipboard.writeText(row.warehouseCode);
                    window.$message?.success($t('page.basic.platformWarehouse.copied'));
                  } catch {
                    window.$message?.warning($t('page.basic.platformWarehouse.copyFail'));
                  }
                }}
              >
                {row.warehouseCode}
              </NButton>
            ),
            default: () => $t('page.basic.platformWarehouse.clickToCopy')
          }}
        </NTooltip>
      )
    },
    {
      key: 'warehouseName',
      title: $t('page.basic.platformWarehouse.warehouseName'),
      width: 180,
      align: 'left',
      ellipsis: { tooltip: true },
      render: row => (
        <NButton
          text
          type="primary"
          onClick={() => {
            detailWarehouseId.value = row.id;
            openDetail();
          }}
        >
          {row.warehouseName}
        </NButton>
      )
    },
    {
      key: 'country',
      title: $t('page.basic.platformWarehouse.country'),
      minWidth: 148,
      width: 160,
      align: 'left',
      ellipsis: { tooltip: true },
      render: row => {
        const text = warehouseCountryDisplay(row);
        return (
          <div class="flex max-w-full min-w-0 items-center gap-6px">
            <span class="shrink-0 text-16px leading-none">{countryFlagEmoji(row.countryCode)}</span>
            <span class="min-w-0 flex-1 truncate" title={text === '—' ? undefined : text}>
              {text}
            </span>
          </div>
        );
      }
    },
    {
      key: 'address',
      title: $t('page.basic.platformWarehouse.addressCol'),
      minWidth: 220,
      align: 'left',
      ellipsis: { tooltip: true },
      render: row => warehouseAddressLineDisplay(row)
    },
    {
      key: 'postalCode',
      title: $t('page.basic.platformWarehouse.postalCode'),
      width: 90,
      align: 'left'
    },
    {
      key: 'palletCbm',
      title: $t('page.basic.platformWarehouse.palletCbm'),
      width: 100,
      align: 'right',
      ellipsis: { tooltip: true },
      render: row => warehousePalletCbmDisplay(row)
    },
    {
      key: 'status',
      title: $t('page.basic.platformWarehouse.status'),
      width: 88,
      align: 'center',
      render: row => (
        <NTag type={row.status === '0' ? 'success' : 'default'} size="small" bordered={false}>
          {row.status === '0'
            ? $t('page.basic.platformWarehouse.enabled')
            : $t('page.basic.platformWarehouse.disabled')}
        </NTag>
      )
    },
    {
      key: 'createTime',
      title: $t('page.basic.platformWarehouse.createTime'),
      width: 160,
      align: 'left'
    },
    {
      key: 'operate',
      title: $t('common.operate'),
      width: 168,
      align: 'center',
      fixed: 'right',
      render: row => (
        <NSpace justify="center" size={8}>
          {hasAuth('basic:warehouse:edit') ? (
            <NButton
              size="small"
              type="primary"
              secondary
              onClick={() => {
                warehouseEditRow.value = row;
                openWarehouseDrawer();
              }}
            >
              {$t('common.edit')}
            </NButton>
          ) : null}
          {hasAuth('basic:warehouse:status') ? (
            <NButton
              size="small"
              secondary
              type={row.status === '0' ? 'warning' : 'success'}
              onClick={() => toggleWarehouseStatus(row)}
            >
              {row.status === '0' ? $t('page.basic.platformWarehouse.disable') : $t('page.basic.platformWarehouse.enable')}
            </NButton>
          ) : null}
        </NSpace>
      )
    }
  ]
});

watch(selectedPlatformId, () => {
  checkedRowKeys.value = [];
  searchParams.value.pageNum = 1;
  getDataByPage();
});

watch(
  () => [searchParams.value.keyword, searchParams.value.status, searchParams.value.countryCodes] as const,
  () => {
    searchParams.value.pageNum = 1;
    getDataByPage();
  }
);

function openAddPlatform() {
  platformEditRow.value = null;
  openPlatformDrawer();
}

function openEditPlatform(p: Api.Basic.Platform) {
  platformEditRow.value = p;
  openPlatformDrawer();
}

function platformMenuOptions(p: Api.Basic.Platform): DropdownOption[] {
  const opts: DropdownOption[] = [];
  if (hasAuth('basic:platform:edit')) {
    opts.push({
      label: $t('common.edit'),
      key: 'edit',
      icon: () => h(SvgIcon, { icon: 'material-symbols:edit-outline', class: 'text-18px' })
    });
  }
  if (hasAuth('basic:platform:status')) {
    opts.push({
      label: p.status === '0' ? $t('page.basic.platformWarehouse.disable') : $t('page.basic.platformWarehouse.enable'),
      key: 'status',
      icon: () =>
        h(SvgIcon, {
          icon: p.status === '0' ? 'material-symbols:block' : 'material-symbols:check-circle-outline',
          class: 'text-18px'
        })
    });
  }
  return opts;
}

async function onPlatformMenuSelect(key: string, p: Api.Basic.Platform) {
  if (key === 'edit') {
    openEditPlatform(p);
    return;
  }
  if (key === 'status') {
    if (p.status === '0') {
      const { data: check } = await fetchGetPlatformDisableCheck(p.id);
      const n = check?.activeWarehouseCount ?? 0;
      if (n > 0) {
        window.$dialog?.warning({
          title: $t('common.warning'),
          content: $t('page.basic.platformWarehouse.disablePlatformWarn', { count: n }),
          positiveText: $t('common.confirm'),
          negativeText: $t('common.cancel'),
          onPositiveClick: async () => {
            const { error } = await fetchUpdatePlatformStatus(p.id, '1');
            if (!error) {
              window.$message?.success($t('common.updateSuccess'));
              await loadPlatforms();
              getDataByPage();
            }
          }
        });
        return;
      }
    }
    const next = p.status === '0' ? '1' : '0';
    const { error } = await fetchUpdatePlatformStatus(p.id, next);
    if (!error) {
      window.$message?.success($t('common.updateSuccess'));
      await loadPlatforms();
      getDataByPage();
    }
  }
}

async function toggleWarehouseStatus(row: Api.Basic.PlatformWarehouse) {
  const next = row.status === '0' ? '1' : '0';
  const ok = await new Promise<boolean>(resolve => {
    window.$dialog?.warning({
      title: $t('common.warning'),
      content:
        next === '1'
          ? $t('page.basic.platformWarehouse.disableWarehouseConfirm', { code: row.warehouseCode })
          : $t('page.basic.platformWarehouse.enableWarehouseConfirm', { code: row.warehouseCode }),
      positiveText: $t('common.confirm'),
      negativeText: $t('common.cancel'),
      onPositiveClick: () => resolve(true),
      onNegativeClick: () => resolve(false)
    });
  });
  if (!ok) return;
  const { error } = await fetchUpdatePlatformWarehouseStatus(row.id, next);
  if (!error) {
    window.$message?.success($t('common.updateSuccess'));
    getDataByPage();
  }
}

async function batchWarehouseStatus(status: string) {
  if (!checkedRowKeys.value.length) return;
  const { error } = await fetchBatchPlatformWarehouseStatus(checkedRowKeys.value as CommonType.IdType[], status);
  if (!error) {
    window.$message?.success($t('common.updateSuccess'));
    checkedRowKeys.value = [];
    getDataByPage();
  }
}

function openAddWarehouse() {
  warehouseEditRow.value = null;
  openWarehouseDrawer();
}

function exportWarehouses() {
  if (selectedPlatformId.value == null) return;
  const p: Record<string, any> = {
    platformId: selectedPlatformId.value,
    pageNum: searchParams.value.pageNum,
    pageSize: searchParams.value.pageSize,
    keyword: searchParams.value.keyword ?? '',
    status: searchParams.value.status ?? ''
  };
  const cc = searchParams.value.countryCodes;
  if (cc?.length) p.countryCodes = cc.join(',');
  download(
    '/basic/platform-warehouse/export',
    p,
    `${selectedPlatform.value?.platformCode ?? 'warehouse'}_${$t('page.basic.platformWarehouse.title')}_${Date.now()}.xlsx`
  );
}

onMounted(() => {
  loadPlatforms();
});

function onPlatformSubmitted() {
  loadPlatforms();
  getDataByPage();
}

function onWarehouseSubmitted() {
  loadPlatforms();
  getDataByPage();
}

function onWarehouseImportSubmitted() {
  loadPlatforms();
  getDataByPage();
}
</script>

<template>
  <div class="h-full min-h-500px flex flex-col gap-16px overflow-hidden lt-sm:overflow-auto">
    <NCard
      :bordered="false"
      class="card-wrapper flex min-h-0 flex-1 flex-col overflow-hidden sm:flex-1-hidden"
      content-class="flex min-h-0 flex-1 flex-col overflow-hidden"
    >
      <div class="mb-16px shrink-0 flex items-center justify-between gap-12px">
        <span class="text-18px font-600">{{ $t('page.basic.platformWarehouse.title') }}</span>
        <NButton v-if="hasAuth('basic:platform:add')" type="primary" @click="openAddPlatform">
          <template #icon>
            <SvgIcon icon="material-symbols:add-rounded" class="text-18px" />
          </template>
          {{ $t('page.basic.platformWarehouse.addPlatform') }}
        </NButton>
      </div>

      <div class="flex min-h-0 flex-1 gap-16px overflow-hidden lt-md:flex-col">
        <!-- 左侧平台 -->
        <div
          class="flex min-h-0 w-300px shrink-0 flex-col gap-12px self-stretch overflow-hidden border border-gray-200 rounded-8px p-12px dark:border-gray-700 lt-md:w-full lt-md:max-h-280px lt-md:self-auto"
        >
          <div class="text-14px font-600">{{ $t('page.basic.platformWarehouse.platformList') }}</div>
          <NInput
            v-model:value="platformSearchKeyword"
            clearable
            size="small"
            :placeholder="$t('page.basic.platformWarehouse.platformSearchPlaceholder')"
          >
            <template #prefix>
              <SvgIcon icon="material-symbols:search" class="text-16px text-gray-400" />
            </template>
          </NInput>
          <NSpin :show="platformLoading" class="min-h-120px flex-1">
            <div class="max-h-full flex flex-col gap-10px overflow-y-auto">
              <div
                v-for="p in filteredPlatforms"
                :key="String(p.id)"
                class="cursor-pointer rounded-8px border-2 p-12px transition-colors"
                :class="[
                  selectedPlatformId === p.id
                    ? 'border-primary bg-primary/5'
                    : 'border-transparent bg-gray-50 dark:bg-gray-800/50',
                  p.status === '1' ? 'opacity-60' : ''
                ]"
                @click="selectPlatform(p.id)"
              >
                <div class="flex items-start justify-between gap-10px">
                  <div class="min-w-0 flex-1">
                    <div class="truncate text-15px font-600">{{ p.platformName }}</div>
                    <div class="mt-4px font-mono text-12px text-gray-500">{{ p.platformCode }}</div>
                    <div class="mt-8px flex flex-wrap items-center gap-8px">
                      <NTag size="small" :type="p.status === '0' ? 'success' : 'default'" :bordered="false">
                        {{
                          p.status === '0'
                            ? $t('page.basic.platformWarehouse.enabled')
                            : $t('page.basic.platformWarehouse.disabled')
                        }}
                      </NTag>
                      <NBadge
                        v-if="p.warehouseCount != null"
                        :value="p.warehouseCount"
                        :max="99"
                        :show-zero="false"
                      />
                    </div>
                  </div>
                  <div class="shrink-0 self-start pt-2px" @click.stop>
                    <NDropdown
                      v-if="platformMenuOptions(p).length"
                      trigger="click"
                      placement="bottom-end"
                      :options="platformMenuOptions(p)"
                      @select="k => onPlatformMenuSelect(String(k), p)"
                    >
                      <NButton quaternary circle size="tiny">
                        <SvgIcon icon="material-symbols:more-horiz" class="text-18px" />
                      </NButton>
                    </NDropdown>
                  </div>
                </div>
              </div>
              <div
                v-if="!platformLoading && platforms.length && !filteredPlatforms.length"
                class="py-24px text-center text-gray-500"
              >
                {{ $t('page.basic.platformWarehouse.platformSearchEmpty') }}
              </div>
              <div v-else-if="!platforms.length && !platformLoading" class="py-24px text-center text-gray-500">
                {{ $t('common.noData') }}
              </div>
            </div>
          </NSpin>
        </div>

        <!-- 右侧仓库 -->
        <div class="min-h-0 min-w-0 flex flex-1 flex-col overflow-hidden">
          <NSpace class="mb-12px shrink-0 flex-wrap" align="center" :size="12">
            <NInput
              v-model:value="searchParams.keyword"
              clearable
              class="min-w-200px"
              :placeholder="$t('page.basic.platformWarehouse.searchPlaceholder')"
            />
            <NSelect
              v-model:value="searchParams.status"
              class="min-w-140px"
              :options="statusFilterOptions"
              clearable
              :placeholder="$t('page.basic.platformWarehouse.statusFilter')"
            />
            <NSelect
              v-model:value="searchParams.countryCodes"
              class="min-w-200px"
              multiple
              filterable
              clearable
              max-tag-count="responsive"
              :options="countryFilterOptions"
              :placeholder="$t('page.basic.platformWarehouse.countryFilter')"
            />
            <div class="ml-auto flex flex-wrap items-center gap-8px">
              <NButton
                v-if="hasAuth('basic:warehouse:import')"
                secondary
                :disabled="!platforms.length"
                @click="openWarehouseImport"
              >
                {{ $t('page.basic.platformWarehouse.importWarehouse') }}
              </NButton>
              <NButton
                v-if="hasAuth('basic:warehouse:export')"
                secondary
                :disabled="!selectedPlatformId"
                @click="exportWarehouses"
              >
                {{ $t('page.basic.platformWarehouse.export') }}
              </NButton>
              <NButton
                v-if="hasAuth('basic:warehouse:add')"
                type="primary"
                :disabled="!platforms.length"
                @click="openAddWarehouse"
              >
                {{ $t('page.basic.platformWarehouse.addWarehouse') }}
              </NButton>
            </div>
          </NSpace>

          <NSpace v-if="checkedRowKeys.length && hasAuth('basic:warehouse:status')" class="mb-8px" :size="8">
            <NButton size="small" type="success" secondary @click="batchWarehouseStatus('0')">
              {{ $t('page.basic.platformWarehouse.batchEnable') }}
            </NButton>
            <NButton size="small" type="warning" secondary @click="batchWarehouseStatus('1')">
              {{ $t('page.basic.platformWarehouse.batchDisable') }}
            </NButton>
          </NSpace>

          <div class="flex min-h-280px flex-1 flex-col overflow-hidden sm:min-h-0">
            <NDataTable
              v-model:checked-row-keys="checkedRowKeys"
              :columns="columns"
              :data="data"
              :loading="loading"
              flex-height
              remote
              :scroll-x="scrollX"
              :row-key="row => row.id"
              :pagination="mobilePagination"
              class="min-h-0 flex-1 sm:h-full"
            />
          </div>
        </div>
      </div>
    </NCard>

    <PlatformOperateDrawer
      v-model:visible="platformDrawerVisible"
      :edit-row="platformEditRow"
      @submitted="onPlatformSubmitted"
    />
    <WarehouseOperateDrawer
      v-model:visible="warehouseDrawerVisible"
      :platforms="platforms"
      :default-platform-id="selectedPlatformId"
      :edit-row="warehouseEditRow"
      @submitted="onWarehouseSubmitted"
    />
    <WarehouseDetailDrawer v-model:visible="detailVisible" :warehouse-id="detailWarehouseId" />
    <PlatformWarehouseImportModal v-model:visible="warehouseImportVisible" @submitted="onWarehouseImportSubmitted" />
  </div>
</template>
