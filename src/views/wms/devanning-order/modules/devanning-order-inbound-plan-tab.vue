<script setup lang="tsx">
import { computed, h, reactive, ref, watch } from 'vue';
import { NButton, NDropdown, NInput, NInputNumber, NModal, NSpace } from 'naive-ui';
import { useWindowSize } from '@vueuse/core';
import {
  fetchBatchDeleteDevanningInboundPlan,
  fetchGetDevanningInboundPlanList,
  fetchUpdateDevanningInboundPlan
} from '@/service/api/wms/devanning-order';
import { useAuth } from '@/hooks/business/auth';
import { $t } from '@/locales';
import SvgIcon from '@/components/custom/svg-icon.vue';

defineOptions({
  name: 'DevanningOrderInboundPlanTab'
});

const props = defineProps<{
  orderId: CommonType.IdType | null;
  coNo?: string | null;
}>();

const { hasAuth } = useAuth();

function canEditInboundPlan() {
  return hasAuth('wms:devanningOrder:inboundPlan:edit') || hasAuth('wms:devanningOrder:add');
}

function canRemoveInboundPlan() {
  return hasAuth('wms:devanningOrder:inboundPlan:remove') || hasAuth('wms:devanningOrder:remove');
}

const loading = ref(false);
const tableData = ref<Api.Wms.DevanningInboundPlan[]>([]);
const checkedRowKeys = ref<Array<string | number>>([]);
const summary = ref<{ totalPieces?: number; totalCbm?: number | string }>({});

const pagination = reactive({
  page: 1,
  pageSize: 10,
  itemCount: 0,
  showSizePicker: true,
  pageSizes: [10, 20, 50],
  prefix: (p: { itemCount?: number }) => $t('datatable.itemCount', { total: p.itemCount ?? 0 }),
  onUpdatePage: (page: number) => {
    pagination.page = page;
    loadList();
  },
  onUpdatePageSize: (pageSize: number) => {
    pagination.pageSize = pageSize;
    pagination.page = 1;
    loadList();
  }
});

const editVisible = ref(false);
const editModel = ref<Api.Wms.DevanningInboundPlanOperateParams>({});

/** 与新建规则一致：预计打板数 = ceil(体积CBM / 2)，体积无效时为 0 */
const editPalletPreview = computed(() => {
  const v = editModel.value.volumeCbm;
  if (v == null || Number.isNaN(Number(v)) || Number(v) <= 0) return 0;
  return Math.ceil(Number(v) / 2);
});

/** 兼容 TableDataInfo 顶层 rows 与嵌套 data.rows、或 data 为数组等返回形态 */
function normalizeInboundPlanListPayload(raw: unknown): {
  rows: Api.Wms.DevanningInboundPlan[];
  total: number;
  summary: { totalPieces?: number; totalCbm?: number | string };
} {
  const empty = {
    rows: [] as Api.Wms.DevanningInboundPlan[],
    total: 0,
    summary: {} as { totalPieces?: number; totalCbm?: number | string }
  };
  if (raw == null || typeof raw !== 'object') return empty;
  const o = raw as Record<string, unknown>;

  function pick(obj: Record<string, unknown>) {
    const rows = obj.rows;
    const total = obj.total;
    const summaryInner = obj.summary;
    if (Array.isArray(rows)) {
      return {
        rows: rows as Api.Wms.DevanningInboundPlan[],
        total: Number(total) || 0,
        summary: (summaryInner && typeof summaryInner === 'object'
          ? (summaryInner as { totalPieces?: number; totalCbm?: number | string })
          : {}) as { totalPieces?: number; totalCbm?: number | string }
      };
    }
    return null;
  }

  const top = pick(o);
  if (top) return top;

  const nested = o.data;
  if (nested != null && typeof nested === 'object' && !Array.isArray(nested)) {
    const inner = pick(nested as Record<string, unknown>);
    if (inner) return inner;
  }
  if (Array.isArray(nested)) {
    return {
      rows: nested as Api.Wms.DevanningInboundPlan[],
      total: Number(o.total) || nested.length,
      summary: {}
    };
  }

  return empty;
}

async function loadList() {
  if (props.orderId == null) {
    tableData.value = [];
    summary.value = {};
    pagination.itemCount = 0;
    return;
  }
  loading.value = true;
  try {
    const { data, error } = await fetchGetDevanningInboundPlanList(props.orderId, {
      pageNum: pagination.page,
      pageSize: pagination.pageSize
    });
    if (error) {
      tableData.value = [];
      pagination.itemCount = 0;
      summary.value = {};
      return;
    }
    const { rows, total, summary: sum } = normalizeInboundPlanListPayload(data);
    tableData.value = rows;
    pagination.itemCount = total;
    summary.value = sum ?? {};
  } finally {
    loading.value = false;
  }
}

watch(
  () => props.orderId,
  () => {
    pagination.page = 1;
    checkedRowKeys.value = [];
    loadList();
  },
  { immediate: true }
);

function openEdit(row: Api.Wms.DevanningInboundPlan) {
  editModel.value = {
    id: row.id,
    orderId: props.orderId ?? undefined,
    systemPreLocation: row.systemPreLocation,
    systemSoNo: row.systemSoNo,
    shipmentCode: row.shipmentCode,
    platform: row.platform,
    warehouseCode: row.warehouseCode,
    addressType: row.addressType,
    deliveryMethod: row.deliveryMethod,
    totalPieces: row.totalPieces,
    weight: row.weight,
    volumeCbm: row.volumeCbm,
    estimatedPalletCount: row.estimatedPalletCount,
    remark: row.remark
  };
  editVisible.value = true;
}

async function submitEdit() {
  if (!editModel.value.id) return;
  editModel.value.estimatedPalletCount = editPalletPreview.value;
  const { error } = await fetchUpdateDevanningInboundPlan({
    ...editModel.value,
    orderId: props.orderId ?? undefined
  });
  if (error) return;
  window.$message?.success($t('common.updateSuccess'));
  editVisible.value = false;
  await loadList();
}

async function handleDelete(id: CommonType.IdType) {
  const { error } = await fetchBatchDeleteDevanningInboundPlan([id]);
  if (error) return;
  window.$message?.success($t('common.deleteSuccess'));
  checkedRowKeys.value = checkedRowKeys.value.filter(k => k !== id);
  await loadList();
}

function handleRowMenuSelect(key: string | number, row: Api.Wms.DevanningInboundPlan) {
  const k = String(key);
  if (k === 'edit') openEdit(row);
  if (k === 'delete') {
    window.$dialog?.warning({
      title: $t('common.warning'),
      content: $t('common.confirmDelete'),
      positiveText: $t('common.confirm'),
      negativeText: $t('common.cancel'),
      onPositiveClick: async () => {
        await handleDelete(row.id);
      }
    });
  }
}

function buildRowDropdownOptions(): import('naive-ui').DropdownOption[] {
  const opts: import('naive-ui').DropdownOption[] = [];
  if (canEditInboundPlan()) {
    opts.push({
      label: $t('common.edit'),
      key: 'edit',
      icon: () => h(SvgIcon, { icon: 'material-symbols:edit-outline', class: 'text-18px' })
    });
  }
  if (canRemoveInboundPlan()) {
    opts.push({
      label: $t('common.delete'),
      key: 'delete',
      icon: () => h(SvgIcon, { icon: 'material-symbols:delete-outline', class: 'text-18px text-error' })
    });
  }
  return opts;
}

const columns = [
  { type: 'selection' as const },
  {
    key: 'systemPreLocation',
    title: $t('page.wms.devanningOrder.inboundPlan.systemPreLocation'),
    minWidth: 120,
    ellipsis: { tooltip: true }
  },
  {
    key: 'systemSoNo',
    title: $t('page.wms.devanningOrder.inboundPlan.systemSoNo'),
    minWidth: 120,
    ellipsis: { tooltip: true }
  },
  {
    key: 'shipmentCode',
    title: $t('page.wms.devanningOrder.inboundPlan.shipmentCode'),
    minWidth: 120,
    ellipsis: { tooltip: true }
  },
  {
    key: 'platform',
    title: $t('page.wms.devanningOrder.inboundPlan.platform'),
    width: 100
  },
  {
    key: 'warehouseCode',
    title: $t('page.wms.devanningOrder.inboundPlan.warehouseCode'),
    width: 110
  },
  {
    key: 'addressType',
    title: $t('page.wms.devanningOrder.inboundPlan.addressType'),
    width: 110
  },
  {
    key: 'deliveryMethod',
    title: $t('page.wms.devanningOrder.inboundPlan.deliveryMethod'),
    width: 110
  },
  {
    key: 'totalPieces',
    title: $t('page.wms.devanningOrder.inboundPlan.totalPieces'),
    width: 90
  },
  {
    key: 'weight',
    title: $t('page.wms.devanningOrder.inboundPlan.weight'),
    width: 90
  },
  {
    key: 'volumeCbm',
    title: $t('page.wms.devanningOrder.inboundPlan.volumeCbm'),
    width: 90
  },
  {
    key: 'remark',
    title: $t('page.wms.devanningOrder.inboundPlan.lineRemark'),
    minWidth: 120,
    ellipsis: { tooltip: true }
  },
  {
    key: 'estimatedPalletCount',
    title: $t('page.wms.devanningOrder.inboundPlan.estimatedPalletCount'),
    width: 110
  },
  {
    key: 'operate',
    title: $t('common.operate'),
    width: 100,
    fixed: 'right' as const,
    render: (row: Api.Wms.DevanningInboundPlan) => {
      const options = buildRowDropdownOptions();
      if (!options.length) return null;
      return (
        <div class="flex justify-start">
          <NDropdown
            trigger="click"
            placement="bottom-end"
            options={options}
            onSelect={key => handleRowMenuSelect(key, row)}
          >
            <NButton size="small" type="primary" secondary class="min-w-72px">
              <span class="inline-flex items-center justify-center gap-4px">
                {h(SvgIcon, { icon: 'material-symbols:expand-more', class: 'text-16px' })}
                <span>{$t('page.wms.devanningOrder.more')}</span>
              </span>
            </NButton>
          </NDropdown>
        </div>
      );
    }
  }
];

const scrollX = columns.reduce((acc, c: any) => acc + Number(c.width ?? c.minWidth ?? 120), 0);

const { width: winW } = useWindowSize();
const tableMaxHeight = computed(() => Math.min(480, Math.max(240, Math.floor(winW.value * 0.35))));
</script>

<template>
  <div class="flex min-h-0 flex-1 flex-col gap-12px">
    <div class="flex flex-wrap items-center gap-16px rd-4px bg-gray-100 px-16px py-12px dark:bg-white/5">
      <div class="text-14px">
        <span class="text-gray-500">{{ $t('page.wms.devanningOrder.coNo') }}：</span>
        <span class="font-500">{{ props.coNo || '—' }}</span>
      </div>
      <div class="text-14px">
        <span class="text-gray-500">{{ $t('page.wms.devanningOrder.inboundPlan.summaryTotalPieces') }}：</span>
        <span class="font-500">{{ summary.totalPieces ?? '—' }}</span>
      </div>
      <div class="text-14px">
        <span class="text-gray-500">{{ $t('page.wms.devanningOrder.inboundPlan.summaryTotalCbm') }}：</span>
        <span class="font-500">{{ summary.totalCbm ?? '—' }}</span>
      </div>
    </div>

    <!-- 抽屉 + Tab 内勿用 flex-height：父级高度未约束时表体常为 0，表现为「有数据但不显示」 -->
    <div class="min-h-400px overflow-x-auto overflow-y-hidden">
      <DataTable
        v-model:checked-row-keys="checkedRowKeys"
        :columns="columns"
        :data="tableData"
        :loading="loading"
        :scroll-x="scrollX"
        :max-height="tableMaxHeight"
        :row-key="row => row.id"
        :pagination="pagination"
        remote
      />
    </div>

    <NModal
      v-model:show="editVisible"
      preset="card"
      :title="$t('page.wms.devanningOrder.inboundPlan.editTitle')"
      class="w-640px max-w-92%"
      :bordered="false"
    >
      <div v-if="editModel.id" class="flex flex-col gap-12px">
        <NFormItem :label="$t('page.wms.devanningOrder.inboundPlan.systemPreLocation')">
          <NInput
            :value="editModel.systemPreLocation ?? ''"
            disabled
            :placeholder="$t('page.wms.devanningOrder.systemPreLocationPending')"
          />
        </NFormItem>
        <NInput
          v-model:value="editModel.systemSoNo"
          :placeholder="$t('page.wms.devanningOrder.inboundPlan.systemSoNo')"
        />
        <NInput
          v-model:value="editModel.shipmentCode"
          :placeholder="$t('page.wms.devanningOrder.inboundPlan.shipmentCode')"
        />
        <NInput v-model:value="editModel.platform" :placeholder="$t('page.wms.devanningOrder.inboundPlan.platform')" />
        <NInput
          v-model:value="editModel.warehouseCode"
          :placeholder="$t('page.wms.devanningOrder.inboundPlan.warehouseCode')"
        />
        <NInput
          v-model:value="editModel.addressType"
          :placeholder="$t('page.wms.devanningOrder.inboundPlan.addressType')"
        />
        <NInput
          v-model:value="editModel.deliveryMethod"
          :placeholder="$t('page.wms.devanningOrder.inboundPlan.deliveryMethod')"
        />
        <NInputNumber
          v-model:value="editModel.totalPieces"
          class="w-full"
          :placeholder="$t('page.wms.devanningOrder.inboundPlan.totalPieces')"
        />
        <NInputNumber
          v-model:value="editModel.weight"
          class="w-full"
          :placeholder="$t('page.wms.devanningOrder.inboundPlan.weight')"
        />
        <NInputNumber
          v-model:value="editModel.volumeCbm"
          class="w-full"
          :placeholder="$t('page.wms.devanningOrder.inboundPlan.volumeCbm')"
        />
        <NInput
          v-model:value="editModel.remark"
          type="textarea"
          :rows="3"
          :placeholder="$t('page.wms.devanningOrder.inboundPlan.lineRemark')"
        />
        <NFormItem :label="$t('page.wms.devanningOrder.inboundPlan.estimatedPalletCount')">
          <NInputNumber :value="editPalletPreview" disabled class="w-full" />
          <template #feedback>
            <span class="text-12px text-gray-400">{{ $t('page.wms.devanningOrder.estimatedPalletAutoHint') }}</span>
          </template>
        </NFormItem>
        <NSpace justify="end">
          <NButton @click="editVisible = false">{{ $t('common.cancel') }}</NButton>
          <NButton type="primary" @click="submitEdit">{{ $t('common.confirm') }}</NButton>
        </NSpace>
      </div>
    </NModal>
  </div>
</template>

<style scoped></style>
