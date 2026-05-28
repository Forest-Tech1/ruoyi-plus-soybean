<script setup lang="tsx">
import { computed, h, onMounted, onUnmounted, reactive, ref, watch } from 'vue';
import type { SelectOption } from 'naive-ui';
import { NButton, NCheckbox, NDropdown, NInput, NInputNumber, NModal, NSelect, NSpace, NTag } from 'naive-ui';
import { useWindowSize } from '@vueuse/core';
import {
  fetchBatchDeleteDevanningInboundPlan,
  fetchGetDevanningInboundPlanGlobalList,
  fetchGetDevanningInboundPlanList,
  fetchUpdateDevanningInboundPlan
} from '@/service/api/wms/devanning-order';
import {
  getSystemPreLocationDisplayRows,
  parseSystemPreLocationAllocations
} from '@/utils/wms-devanning-pre-location';
import DevanningOrderInboundPreLocationModal from './devanning-order-inbound-pre-location-modal.vue';
import { WMS_DICT_DELIVERY_TYPE } from '@/constants/wms-devanning';
import {
  useDevanningInboundPlanFields,
  WMS_INBOUND_ADDRESS_TYPE_COMMERCIAL,
  WMS_INBOUND_ADDRESS_TYPE_PRIVATE
} from '@/hooks/business/use-devanning-inbound-plan-fields';
import DictSelect from '@/components/custom/dict-select.vue';
import DictTag from '@/components/custom/dict-tag.vue';
import { useAuth } from '@/hooks/business/auth';
import { useDict } from '@/hooks/business/dict';
import { $t } from '@/locales';
import SvgIcon from '@/components/custom/svg-icon.vue';

defineOptions({
  name: 'DevanningOrderInboundPlanTab'
});

const props = defineProps<{
  orderId: CommonType.IdType | null;
  coNo?: string | null;
  /** 列表页导出拆柜单成功后递增，用于刷新本 Tab 数据 */
  inboundReloadNonce?: number;
  /**
   * 跨拆柜订单入库计划（货物订单页）；为 true 时走 `fetchGetDevanningInboundPlanGlobalList`，
   * 行内 `orderId` 以接口返回为准，用于更新/预库位分配。
   */
  globalMode?: boolean;
  /** 与 `globalMode` 配套；不含分页字段时由组件内 `pagination` 补充 */
  globalFilters?: Api.Wms.DevanningInboundPlanGlobalSearchParams | null;
}>();

const { hasAuth } = useAuth();

const {
  platforms,
  loadPlatforms,
  platformSelectOptions,
  findPlatformByCodeOrName,
  platformResolvedByCode,
  warehouseOptionsForPlatformCode
} = useDevanningInboundPlanFields();

const { data: deliveryTypeDictData } = useDict(WMS_DICT_DELIVERY_TYPE, true);

function platformOptionsWithFallback(raw: string | null | undefined): SelectOption[] {
  const base = platformSelectOptions();
  const v = (raw ?? '').trim();
  if (!v) return base;
  if (base.some(o => String(o.value).toUpperCase() === v.toUpperCase())) return base;
  return [
    {
      label: `${v}（${$t('page.wms.devanningOrder.inboundPlan.platformUnmatched')}）`,
      value: v
    },
    ...base
  ];
}

const addressTypeOptions = computed<SelectOption[]>(() => [
  { value: WMS_INBOUND_ADDRESS_TYPE_COMMERCIAL, label: $t('page.wms.devanningOrder.inboundPlan.addressTypeCommercial') },
  { value: WMS_INBOUND_ADDRESS_TYPE_PRIVATE, label: $t('page.wms.devanningOrder.inboundPlan.addressTypePrivate') }
]);

function labelAddressType(raw: string | null | undefined) {
  const s = (raw ?? '').trim();
  if (s === WMS_INBOUND_ADDRESS_TYPE_COMMERCIAL) return $t('page.wms.devanningOrder.inboundPlan.addressTypeCommercial');
  if (s === WMS_INBOUND_ADDRESS_TYPE_PRIVATE) return $t('page.wms.devanningOrder.inboundPlan.addressTypePrivate');
  return s || '—';
}

const warehouseInlineOptions = ref<SelectOption[]>([]);

const warehouseModalOptions = ref<SelectOption[]>([]);

/** 按 dictValue 查找字典行（避免仅 `value` 匹配时取不到标签） */
function findDeliveryTypeEntry(code: string): Api.System.DictData | undefined {
  const c = code.trim();
  if (!c) return undefined;
  return deliveryTypeDictData.value.find(d => String(d.dictValue ?? '').trim() === c);
}

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
  pageSize: 50,
  itemCount: 0,
  showSizePicker: true,
  pageSizes: [10, 20, 50, 100],
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

/** 列表接口若返回 snake_case，与导入预览（camelCase）对齐，便于同一套派送方式渲染逻辑 */
function mapInboundPlanListRow(raw: Api.Wms.DevanningInboundPlan): Api.Wms.DevanningInboundPlan {
  const r = raw as Record<string, unknown>;
  const dm = r.deliveryMethod ?? r.delivery_method;
  const dml = r.deliveryMethodLabel ?? r.delivery_method_label;
  const os = r.outboundStatus ?? r.outbound_status;
  return {
    ...raw,
    deliveryMethod: dm != null && dm !== '' ? String(dm) : raw.deliveryMethod,
    deliveryMethodLabel: dml != null && dml !== '' ? String(dml) : raw.deliveryMethodLabel,
    outboundStatus:
      os === 'outbound_done' || os === 'pending_outbound'
        ? (os as Api.Wms.DevanningInboundPlanOutboundStatus)
        : raw.outboundStatus
  };
}

function resolveRowOrderId(row: Api.Wms.DevanningInboundPlan): CommonType.IdType | undefined {
  return row.orderId ?? props.orderId ?? undefined;
}

async function loadList() {
  if (props.globalMode) {
    loading.value = true;
    try {
      const filters = props.globalFilters ?? {};
      const { data, error } = await fetchGetDevanningInboundPlanGlobalList({
        ...filters,
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
      tableData.value = rows.map(mapInboundPlanListRow);
      pagination.itemCount = total;
      summary.value = sum ?? {};
    } finally {
      loading.value = false;
    }
    return;
  }

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
    tableData.value = rows.map(mapInboundPlanListRow);
    pagination.itemCount = total;
    summary.value = sum ?? {};
  } finally {
    loading.value = false;
  }
}

watch(
  () => [props.orderId, props.globalMode, props.globalFilters] as const,
  () => {
    pagination.page = 1;
    checkedRowKeys.value = [];
    loadList();
  },
  { deep: true, immediate: true }
);

watch(
  () => props.inboundReloadNonce,
  (n, o) => {
    if (!props.globalMode && props.orderId == null) return;
    if (typeof n !== 'number' || n <= 0 || n === o) return;
    loadList();
  }
);

const preLocationVisible = ref(false);
const preLocationPlan = ref<Api.Wms.DevanningInboundPlan | null>(null);

function openPreLocationEdit(row: Api.Wms.DevanningInboundPlan) {
  preLocationPlan.value = row;
  preLocationVisible.value = true;
}

const editCell = ref<string | null>(null);

const editableCellReadonlyCls =
  'flex min-h-30px max-w-full min-w-0 cursor-text items-center justify-start rd-4px px-2px op-transition hover:bg-[var(--n-merged-hover-color)]';

function inboundCellKey(rowId: CommonType.IdType | string | number, field: string) {
  return `${rowId}__${field}`;
}

function isInboundInlineOverlayTarget(t: EventTarget | null) {
  if (!(t instanceof Element)) return false;
  return !!(t.closest('[data-inbound-inline-edit="1"]') || t.closest('.n-base-select-menu'));
}

function closeInboundEditFromOutside(ev: MouseEvent) {
  if (!editCell.value) return;
  if (isInboundInlineOverlayTarget(ev.target)) return;
  editCell.value = null;
}

onMounted(() => {
  document.addEventListener('mousedown', closeInboundEditFromOutside);
  void loadPlatforms();
});
onUnmounted(() => document.removeEventListener('mousedown', closeInboundEditFromOutside));

function palletPreviewFromVolume(volumeCbm: unknown) {
  const v = volumeCbm == null ? NaN : Number(volumeCbm);
  if (!Number.isFinite(v) || v <= 0) return 0;
  return Math.ceil(v / 2);
}

function rowToOperateBody(row: Api.Wms.DevanningInboundPlan): Api.Wms.DevanningInboundPlanOperateParams {
  return {
    id: row.id,
    orderId: resolveRowOrderId(row),
    systemPreLocation: row.systemPreLocation,
    systemSoNo: row.systemSoNo,
    shipmentCode: row.shipmentCode,
    platform: row.platform,
    warehouseCode: row.warehouseCode,
    addressType: row.addressType,
    deliveryMethod: row.deliveryMethod,
    hold: row.hold ?? null,
    totalPieces: row.totalPieces,
    weight: row.weight,
    volumeCbm: row.volumeCbm,
    estimatedPalletCount: row.estimatedPalletCount,
    remark: row.remark ?? null
  };
}

async function patchInboundPlanRow(row: Api.Wms.DevanningInboundPlan, patch: Partial<Api.Wms.DevanningInboundPlanOperateParams>) {
  if (!canEditInboundPlan()) return;
  const prevPlatform = row.platform;
  const merged = { ...rowToOperateBody(row), ...patch };
  if (Object.prototype.hasOwnProperty.call(patch, 'platform')) {
    const changed =
      String(patch.platform ?? '').trim() !== String(prevPlatform ?? '').trim();
    if (changed) merged.warehouseCode = null;
  }
  if (patch.hold === true) merged.deliveryMethod = 'hold';
  if (patch.hold === false && merged.deliveryMethod === 'hold') merged.deliveryMethod = null;
  if (Object.prototype.hasOwnProperty.call(patch, 'deliveryMethod')) {
    const dm = patch.deliveryMethod != null ? String(patch.deliveryMethod).trim() : '';
    if (dm === 'hold') merged.hold = true;
    else if (dm) merged.hold = false;
  }
  merged.estimatedPalletCount = palletPreviewFromVolume(merged.volumeCbm);
  const { error } = await fetchUpdateDevanningInboundPlan(merged);
  if (error) return;
  window.$message?.success($t('common.updateSuccess'));
  editCell.value = null;
  await loadList();
}

function platformDisplayLabel(raw: string | null | undefined) {
  const p = findPlatformByCodeOrName(raw);
  if (p) return `${p.platformName}（${p.platformCode}）`;
  const s = (raw ?? '').trim();
  return s || '—';
}

watch(editCell, async k => {
  await loadPlatforms();
  if (!k?.endsWith('__warehouseCode')) {
    warehouseInlineOptions.value = [];
    return;
  }
  const idPart = k.slice(0, -'__warehouseCode'.length);
  const row = tableData.value.find(r => String(r.id) === idPart);
  warehouseInlineOptions.value = row ? await warehouseOptionsForPlatformCode(row.platform) : [];
});

async function refreshModalWarehouseOptions() {
  await loadPlatforms();
  warehouseModalOptions.value = await warehouseOptionsForPlatformCode(editModel.value.platform);
}

function onModalPlatformUpdate(v: string | null) {
  const prev = editModel.value.platform;
  editModel.value.platform = v ?? undefined;
  if (String(prev ?? '').trim() !== String(v ?? '').trim()) {
    editModel.value.warehouseCode = undefined;
  }
  void refreshModalWarehouseOptions();
}

watch(editVisible, async vis => {
  if (!vis) return;
  await refreshModalWarehouseOptions();
});

const editModalTitle = computed(() =>
  editModel.value.id != null && String(editModel.value.id).trim() !== ''
    ? $t('page.wms.devanningOrder.inboundPlan.editTitle')
    : $t('page.wms.devanningOrder.addInboundPlanRow')
);

function openAddInboundPlan() {
  if (props.globalMode || props.orderId == null) return;
  editModel.value = {
    orderId: props.orderId,
    systemPreLocation: undefined,
    systemSoNo: undefined,
    shipmentCode: undefined,
    platform: undefined,
    warehouseCode: undefined,
    addressType: undefined,
    deliveryMethod: undefined,
    hold: null,
    totalPieces: undefined,
    weight: undefined,
    volumeCbm: undefined,
    estimatedPalletCount: undefined,
    remark: undefined
  };
  editVisible.value = true;
}

function openEdit(row: Api.Wms.DevanningInboundPlan) {
  editModel.value = {
    id: row.id,
    orderId: resolveRowOrderId(row),
    systemPreLocation: row.systemPreLocation,
    systemSoNo: row.systemSoNo,
    shipmentCode: row.shipmentCode,
    platform: row.platform,
    warehouseCode: row.warehouseCode,
    addressType: row.addressType,
    deliveryMethod: row.deliveryMethod,
    hold: row.hold ?? null,
    totalPieces: row.totalPieces,
    weight: row.weight,
    volumeCbm: row.volumeCbm,
    estimatedPalletCount: row.estimatedPalletCount,
    remark: row.remark
  };
  editVisible.value = true;
}

async function submitEdit() {
  const ident = editModel.value.systemSoNo?.trim();
  const ship = editModel.value.shipmentCode?.trim();
  if (!ident && !ship) {
    window.$message?.warning($t('page.wms.devanningOrder.inboundPlanRowNeedIdentifier', { index: 1 }));
    return;
  }

  const estimated = editPalletPreview.value;
  const orderId = props.globalMode ? editModel.value.orderId ?? undefined : props.orderId ?? undefined;

  const merged: Api.Wms.DevanningInboundPlanOperateParams = {
    ...editModel.value,
    orderId,
    systemSoNo: ident || null,
    shipmentCode: ship || null,
    estimatedPalletCount: estimated
  };

  const dm = merged.deliveryMethod != null ? String(merged.deliveryMethod).trim() : '';
  if (dm === 'hold') merged.hold = true;
  else if (dm) merged.hold = false;

  const isCreate = merged.id == null;

  /** 新建行不传 id（后端按 PUT  SaveOrUpdate 插入） */
  const payload: Api.Wms.DevanningInboundPlanOperateParams = isCreate
    ? (({ id: _omitId, ...rest }) => rest)(merged)
    : merged;

  const { error } = await fetchUpdateDevanningInboundPlan(payload);
  if (error) return;
  window.$message?.success(isCreate ? $t('common.addSuccess') : $t('common.updateSuccess'));
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
  if (k === 'editPreLocation') openPreLocationEdit(row);
  if (k === 'edit') openEdit(row);
  if (k === 'holdToggle') {
    const nextHold = !row.hold;
    const nextDeliveryMethod = nextHold ? 'hold' : row.deliveryMethod === 'hold' ? null : row.deliveryMethod;
    window.$dialog?.warning({
      title: $t('common.warning'),
      content: nextHold ? $t('page.wms.devanningOrder.inboundPlan.holdOn') : $t('page.wms.devanningOrder.inboundPlan.holdOff'),
      positiveText: $t('common.confirm'),
      negativeText: $t('common.cancel'),
      onPositiveClick: async () => {
        const { error } = await fetchUpdateDevanningInboundPlan({
          id: row.id,
          orderId: resolveRowOrderId(row),
          systemPreLocation: row.systemPreLocation,
          systemSoNo: row.systemSoNo,
          shipmentCode: row.shipmentCode,
          platform: row.platform,
          warehouseCode: row.warehouseCode,
          addressType: row.addressType,
          deliveryMethod: nextDeliveryMethod,
          hold: nextHold,
          totalPieces: row.totalPieces,
          weight: row.weight,
          volumeCbm: row.volumeCbm,
          estimatedPalletCount: row.estimatedPalletCount,
          remark: row.remark ?? null
        });
        if (error) return;
        window.$message?.success($t('common.updateSuccess'));
        await loadList();
      }
    });
  }
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

function buildRowDropdownOptions(row?: Api.Wms.DevanningInboundPlan): import('naive-ui').DropdownOption[] {
  const opts: import('naive-ui').DropdownOption[] = [];
  if (canEditInboundPlan()) {
    opts.push({
      label: row?.hold
        ? $t('page.wms.devanningOrder.inboundPlan.holdOff')
        : $t('page.wms.devanningOrder.inboundPlan.holdOn'),
      key: 'holdToggle',
      icon: () => h(SvgIcon, { icon: 'material-symbols:pause-circle-outline', class: 'text-18px text-warning' })
    });
    opts.push({
      label: $t('common.edit'),
      key: 'edit',
      icon: () => h(SvgIcon, { icon: 'material-symbols:edit-outline', class: 'text-18px' })
    });
    opts.push({
      label: $t('page.wms.devanningOrder.inboundPlan.editSystemPreLocation'),
      key: 'editPreLocation',
      icon: () => h(SvgIcon, { icon: 'material-symbols:warehouse', class: 'text-18px' })
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

const columns = computed(() => {
  void deliveryTypeDictData.value.length;
  void editCell.value;
  void addressTypeOptions.value;
  void warehouseInlineOptions.value;
  void platforms.value;
  void props.globalMode;
  return [
  ...(props.globalMode
    ? [
        {
          key: 'coNo',
          title: $t('page.wms.devanningOrder.coNo'),
          width: 120,
          ellipsis: { tooltip: true },
          render: (row: Api.Wms.DevanningInboundPlan) => row.coNo?.trim() || '—'
        }
      ]
    : []),
  { type: 'selection' as const },
  {
    key: 'systemPreLocation',
    title: $t('page.wms.devanningOrder.inboundPlan.systemPreLocation'),
    minWidth: 168,
    render: (row: Api.Wms.DevanningInboundPlan) => {
      const alloc = parseSystemPreLocationAllocations(row.systemPreLocation);
      if (!alloc.length) {
        return h('span', { class: 'text-gray-400' }, $t('page.wms.devanningOrder.systemPreLocationPending'));
      }
      const rowsText = getSystemPreLocationDisplayRows(
        alloc,
        p => $t('page.wms.devanningOrder.inboundPlan.preLocationLine', p),
        $t('page.wms.devanningOrder.inboundPlan.preLocationMore')
      );
      const tip = alloc
        .map(
          (l, i) =>
            $t('page.wms.devanningOrder.inboundPlan.preLocationLine', {
              index: i + 1,
              location: l.locationCode,
              pallets: l.palletCount
            })
        )
        .join('\n');
      return h(
        'div',
        {
          class: 'text-12px leading-snug whitespace-pre-line',
          title: tip
        },
        rowsText.join('\n')
      );
    }
  },
  {
    key: 'estimatedPalletCount',
    title: $t('page.wms.devanningOrder.inboundPlan.estimatedPalletCount'),
    width: 110
  },
  {
    key: 'outboundStatus',
    title: $t('page.wms.devanningOrder.inboundPlan.outboundStatus'),
    width: 100,
    render: (row: Api.Wms.DevanningInboundPlan) => {
      const s = row.outboundStatus ?? 'pending_outbound';
      const done = s === 'outbound_done';
      const label = done
        ? $t('page.wms.devanningOrder.inboundPlan.outboundStatusDone')
        : $t('page.wms.devanningOrder.inboundPlan.outboundStatusPending');
      return h(NTag, { size: 'small', type: done ? 'success' : 'default' }, { default: () => label });
    }
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
    width: 148,
    render: (row: Api.Wms.DevanningInboundPlan) => {
      const k = inboundCellKey(row.id, 'platform');
      const editing = editCell.value === k && canEditInboundPlan();
      if (editing) {
        return (
          <div data-inbound-inline-edit="1" class="min-w-160px max-w-full" onMousedown={(e: MouseEvent) => e.stopPropagation()}>
            <NSelect
              size="small"
              filterable
              clearable
              class="w-full"
              placeholder={$t('page.wms.devanningOrder.inboundPlan.platform')}
              options={platformOptionsWithFallback(row.platform)}
              value={row.platform ?? null}
              onUpdate:value={(v: string | null) => {
                row.platform = v ?? undefined;
                void patchInboundPlanRow(row, { platform: v ?? null });
              }}
            />
          </div>
        );
      }
      const ro = (
        <div
          class={editableCellReadonlyCls}
          title={$t('page.wms.devanningOrder.doubleClickToEdit')}
          onDblclick={(e: MouseEvent) => {
            e.stopPropagation();
            if (!canEditInboundPlan()) return;
            editCell.value = k;
          }}
        >
          <span class="truncate text-13px">{platformDisplayLabel(row.platform)}</span>
        </div>
      );
      return canEditInboundPlan() ? ro : <span class="text-13px">{platformDisplayLabel(row.platform)}</span>;
    }
  },
  {
    key: 'warehouseCode',
    title: $t('page.wms.devanningOrder.inboundPlan.warehouseCode'),
    width: 128,
    render: (row: Api.Wms.DevanningInboundPlan) => {
      const k = inboundCellKey(row.id, 'warehouseCode');
      const editing = editCell.value === k && canEditInboundPlan();
      const useWarehouseSelect = platformResolvedByCode(row.platform);
      if (editing) {
        if (useWarehouseSelect) {
          return (
            <div data-inbound-inline-edit="1" class="min-w-160px max-w-full" onMousedown={(e: MouseEvent) => e.stopPropagation()}>
              <NSelect
                size="small"
                filterable
                clearable
                class="w-full font-mono"
                placeholder={$t('page.wms.devanningOrder.inboundPlan.warehouseCode')}
                options={warehouseInlineOptions.value}
                value={row.warehouseCode ?? null}
                onUpdate:value={(v: string | null) =>
                  void patchInboundPlanRow(row, { warehouseCode: v ?? null })
                }
              />
            </div>
          );
        }
        return (
          <div data-inbound-inline-edit="1" class="min-w-88px" onMousedown={(e: MouseEvent) => e.stopPropagation()}>
            <NInput
              size="small"
              class="w-full font-mono"
              value={row.warehouseCode ?? ''}
              onUpdateValue={(v: string) => {
                row.warehouseCode = v.trim() ? v : undefined;
              }}
              onBlur={() => void patchInboundPlanRow(row, { warehouseCode: row.warehouseCode })}
            />
          </div>
        );
      }
      const ro = (
        <div
          class={editableCellReadonlyCls}
          title={$t('page.wms.devanningOrder.doubleClickToEdit')}
          onDblclick={(e: MouseEvent) => {
            e.stopPropagation();
            if (!canEditInboundPlan()) return;
            editCell.value = k;
          }}
        >
          <span class="truncate text-13px font-mono">{row.warehouseCode?.trim() ? row.warehouseCode : '—'}</span>
        </div>
      );
      return canEditInboundPlan() ? ro : <span class="font-mono text-13px">{row.warehouseCode?.trim() ? row.warehouseCode : '—'}</span>;
    }
  },
  {
    key: 'addressType',
    title: $t('page.wms.devanningOrder.inboundPlan.addressType'),
    width: 120,
    render: (row: Api.Wms.DevanningInboundPlan) => {
      const k = inboundCellKey(row.id, 'addressType');
      const editing = editCell.value === k && canEditInboundPlan();
      if (editing) {
        return (
          <div data-inbound-inline-edit="1" class="min-w-140px max-w-full" onMousedown={(e: MouseEvent) => e.stopPropagation()}>
            <NSelect
              size="small"
              clearable
              class="w-full"
              placeholder={$t('page.wms.devanningOrder.inboundPlan.addressType')}
              options={addressTypeOptions.value}
              value={row.addressType ?? null}
              onUpdate:value={(v: string | null) =>
                void patchInboundPlanRow(row, { addressType: v ?? null })
              }
            />
          </div>
        );
      }
      const ro = (
        <div
          class={editableCellReadonlyCls}
          title={$t('page.wms.devanningOrder.doubleClickToEdit')}
          onDblclick={(e: MouseEvent) => {
            e.stopPropagation();
            if (!canEditInboundPlan()) return;
            editCell.value = k;
          }}
        >
          <span class="truncate text-13px">{labelAddressType(row.addressType)}</span>
        </div>
      );
      return canEditInboundPlan() ? ro : <span class="text-13px">{labelAddressType(row.addressType)}</span>;
    }
  },
  {
    key: 'deliveryMethod',
    title: $t('page.wms.devanningOrder.inboundPlan.deliveryMethod'),
    width: 130,
    render: (row: Api.Wms.DevanningInboundPlan) => {
      const k = inboundCellKey(row.id, 'deliveryMethod');
      const editing = editCell.value === k && canEditInboundPlan();
      if (editing) {
        return (
          <div
            data-inbound-inline-edit="1"
            class="min-w-108px max-w-full"
            onMousedown={(e: MouseEvent) => e.stopPropagation()}
          >
            <DictSelect
              dictCode={WMS_DICT_DELIVERY_TYPE}
              immediate={true}
              clearable={true}
              size="small"
              class="w-full"
              placeholder={$t('page.wms.devanningOrder.inboundPlan.deliveryMethod')}
              value={row.deliveryMethod ?? null}
              onUpdate:value={(v: string | string[] | null | undefined) => {
                const raw = Array.isArray(v) ? v[0] : v;
                void patchInboundPlanRow(row, {
                  deliveryMethod:
                    raw != null && String(raw).trim() !== '' ? String(raw) : null
                });
              }}
            />
          </div>
        );
      }
      const code = String(row.deliveryMethod ?? '').trim();
      const inner =
        !code ? (
          '—'
        ) : (() => {
            const entry = findDeliveryTypeEntry(code);
            if (entry) {
              return h(DictTag, { dictData: entry, dictCode: WMS_DICT_DELIVERY_TYPE, immediate: true });
            }
            const lbl = String(row.deliveryMethodLabel ?? '').trim();
            if (lbl) {
              return h('span', { title: code }, [h(NTag, { size: 'small', type: 'default' }, { default: () => lbl })]);
            }
            return h('span', { title: code }, [h(NTag, { size: 'small', type: 'default' }, { default: () => code })]);
          })();
      if (!canEditInboundPlan()) {
        return inner;
      }
      return (
        <div
          class={editableCellReadonlyCls}
          title={$t('page.wms.devanningOrder.doubleClickToEdit')}
          onDblclick={(e: MouseEvent) => {
            e.stopPropagation();
            editCell.value = k;
          }}
        >
          {inner}
        </div>
      );
    }
  },
  {
    key: 'hold',
    title: 'HOLD',
    width: 88,
    render: (row: Api.Wms.DevanningInboundPlan) => {
      const k = inboundCellKey(row.id, 'hold');
      const editing = editCell.value === k && canEditInboundPlan();
      if (editing) {
        return (
          <div data-inbound-inline-edit="1" onMousedown={(e: MouseEvent) => e.stopPropagation()}>
            <NCheckbox
              checked={Boolean(row.hold)}
              onUpdate:checked={(v: boolean) => void patchInboundPlanRow(row, { hold: v })}
            >
              HOLD
            </NCheckbox>
          </div>
        );
      }
      const tag = row.hold ? <NTag size="small" type="warning">HOLD</NTag> : '—';
      if (!canEditInboundPlan()) return tag;
      return (
        <div
          class={editableCellReadonlyCls}
          title={$t('page.wms.devanningOrder.doubleClickToEdit')}
          onDblclick={(e: MouseEvent) => {
            e.stopPropagation();
            editCell.value = k;
          }}
        >
          {tag}
        </div>
      );
    }
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
    key: 'operate',
    title: $t('common.operate'),
    width: 100,
    fixed: 'right' as const,
    render: (row: Api.Wms.DevanningInboundPlan) => {
      const options = buildRowDropdownOptions(row);
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
});

const scrollX = computed(() =>
  columns.value.reduce((acc, c: any) => acc + Number(c.width ?? c.minWidth ?? 120), 0)
);

const { width: winW } = useWindowSize();
/** 抽屉内 Tab 限制高度；独立「货物订单」页由外层 flex 撑满，不限制 max-height */
const tableMaxHeight = computed(() =>
  props.globalMode ? undefined : Math.min(480, Math.max(240, Math.floor(winW.value * 0.35)))
);
</script>

<template>
  <div class="flex min-h-0 flex-1 flex-col gap-12px" :class="props.globalMode ? 'min-h-0 overflow-hidden' : ''">
    <div class="flex flex-wrap items-center gap-16px rd-4px bg-gray-100 px-16px py-12px dark:bg-white/5">
      <div v-if="!props.globalMode" class="text-14px">
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
    <div class="mb-8px flex flex-wrap items-center justify-between gap-12px">
      <span class="text-12px text-gray-500 dark:text-gray-400">
        {{ $t('page.wms.devanningOrder.inboundEditableFieldsHint') }}
      </span>
      <NButton
        v-if="canEditInboundPlan() && !props.globalMode"
        size="small"
        type="primary"
        secondary
        @click="openAddInboundPlan"
      >
        <template #icon>
          <icon-material-symbols-add-rounded class="text-icon" />
        </template>
        {{ $t('page.wms.devanningOrder.addInboundPlanRow') }}
      </NButton>
    </div>
    <div
      class="overflow-x-auto overflow-y-hidden"
      :class="props.globalMode ? 'min-h-0 flex flex-1 flex-col' : 'min-h-400px'"
    >
      <DataTable
        v-model:checked-row-keys="checkedRowKeys"
        :columns="columns"
        :data="tableData"
        :loading="loading"
        :scroll-x="scrollX"
        :max-height="tableMaxHeight"
        :flex-height="Boolean(props.globalMode)"
        :row-key="row => row.id"
        :pagination="pagination"
        remote
        :class="props.globalMode ? 'min-h-0 flex-1' : ''"
      />
    </div>

    <NModal
      v-model:show="editVisible"
      preset="card"
      :title="editModalTitle"
      class="w-640px max-w-92%"
      :bordered="false"
    >
      <div v-if="editVisible" class="flex flex-col gap-12px">
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
        <NSelect
          filterable
          clearable
          class="w-full"
          :value="editModel.platform ?? null"
          :options="platformOptionsWithFallback(editModel.platform)"
          :placeholder="$t('page.wms.devanningOrder.inboundPlan.platform')"
          @update:value="onModalPlatformUpdate"
        />
        <NSelect
          v-if="platformResolvedByCode(editModel.platform)"
          filterable
          clearable
          class="w-full font-mono"
          :value="editModel.warehouseCode ?? null"
          :options="warehouseModalOptions"
          :placeholder="$t('page.wms.devanningOrder.inboundPlan.warehouseCode')"
          @update:value="v => { editModel.warehouseCode = v ?? undefined; }"
        />
        <NInput
          v-else
          v-model:value="editModel.warehouseCode"
          class="font-mono"
          :placeholder="$t('page.wms.devanningOrder.inboundPlan.warehouseCode')"
        />
        <NSelect
          clearable
          class="w-full"
          :value="editModel.addressType ?? null"
          :options="addressTypeOptions"
          :placeholder="$t('page.wms.devanningOrder.inboundPlan.addressType')"
          @update:value="v => { editModel.addressType = v ?? undefined; }"
        />
        <DictSelect
          v-model:value="editModel.deliveryMethod"
          :dict-code="WMS_DICT_DELIVERY_TYPE"
          :immediate="true"
          :placeholder="$t('page.wms.devanningOrder.inboundPlan.deliveryMethod')"
          clearable
          class="w-full"
        />
        <NFormItem label="HOLD">
          <NCheckbox
            :checked="Boolean(editModel.hold)"
            @update:checked="(v: boolean) => {
              editModel.hold = v;
              if (v) editModel.deliveryMethod = 'hold';
              else if (editModel.deliveryMethod === 'hold') editModel.deliveryMethod = null;
            }"
          >
            HOLD
          </NCheckbox>
        </NFormItem>
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

    <DevanningOrderInboundPreLocationModal
      v-model:visible="preLocationVisible"
      :order-id="preLocationPlan?.orderId ?? orderId"
      :plan="preLocationPlan"
      @saved="loadList"
    />
  </div>
</template>

<style scoped></style>
