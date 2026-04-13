<script setup lang="tsx">
import { h, onMounted, onUnmounted, reactive, ref, watch } from 'vue';
import type { DataTableSortState, DropdownOption } from 'naive-ui';
import { NButton, NDatePicker, NDropdown, NInput, NSelect, NTag, NTooltip } from 'naive-ui';
import { useBoolean } from '@sa/hooks';
import {
  fetchBatchDeleteDevanningOrder,
  fetchCancelAbnormalDevanningOrder,
  fetchCancelCompleteDevanningOrder,
  fetchCompleteDevanningOrder,
  fetchGetDevanningOrderList,
  fetchMarkAbnormalDevanningOrder,
  fetchUpdateDevanningOrder
} from '@/service/api/wms/devanning-order';
import { WMS_DICT_DEVANNING_ROUND, WMS_DICT_ORDER_LEVEL } from '@/constants/wms-devanning';
import DictTag from '@/components/custom/dict-tag.vue';
import { useAppStore } from '@/store/modules/app';
import { useAuth } from '@/hooks/business/auth';
import { useDownload } from '@/hooks/business/download';
import { useDict } from '@/hooks/business/dict';
import { defaultTransform, useNaivePaginatedTable } from '@/hooks/common/table';
import { $t } from '@/locales';
import SvgIcon from '@/components/custom/svg-icon.vue';
import DevanningOrderDetailDrawer from './modules/devanning-order-detail-drawer.vue';
import DevanningOrderImportModal from './modules/devanning-order-import-modal.vue';
import DevanningOrderRemarkModal from './modules/devanning-order-remark-modal.vue';
import DevanningOrderOperateDrawer from './modules/devanning-order-operate-drawer.vue';
import DevanningOrderSearch from './modules/devanning-order-search.vue';

defineOptions({
  name: 'DevanningOrderList'
});

const appStore = useAppStore();
const { zip } = useDownload();
const { hasAuth } = useAuth();

const {
  bool: importVisible,
  setTrue: openImport,
  setFalse: closeImport
} = useBoolean();
const {
  bool: createVisible,
  setTrue: openCreate,
  setFalse: closeCreate
} = useBoolean();
const detailVisible = ref(false);
const detailOrderId = ref<CommonType.IdType | null>(null);

const remarkModalVisible = ref(false);
const remarkOrderId = ref<CommonType.IdType | null>(null);
const remarkInitial = ref<string | null>(null);

type Status = Api.Wms.DevanningOrderStatus | null;

const statusTabs: { key: Status; label: App.I18n.I18nKey }[] = [
  { key: null, label: 'page.wms.devanningOrder.statusAll' },
  { key: 'pending_schedule', label: 'page.wms.devanningOrder.statusEnum.pending_schedule' },
  { key: 'pending_devanning', label: 'page.wms.devanningOrder.statusEnum.pending_devanning' },
  { key: 'completed', label: 'page.wms.devanningOrder.statusEnum.completed' },
  { key: 'abnormal', label: 'page.wms.devanningOrder.statusEnum.abnormal' }
];

const searchParams = ref<Api.Wms.DevanningOrderSearchParams>({
  pageNum: 1,
  pageSize: 10,
  coNo: null,
  blNo: null,
  status: null,
  devanningRound: null,
  orderLevel: null,
  /** 默认：下单日期降序（与表头默认排序一致；后端未传排序时也应按此默认） */
  orderByColumn: 'orderDate',
  isAsc: 'desc',
  params: {
    orderTimeBegin: undefined,
    orderTimeEnd: undefined,
    devanningCompleteBegin: undefined,
    devanningCompleteEnd: undefined,
    expectedDevanningBegin: undefined,
    expectedDevanningEnd: undefined
  }
});

function statusTagType(s: Api.Wms.DevanningOrderStatus): 'default' | 'warning' | 'success' | 'error' {
  const map = {
    pending_schedule: 'default',
    pending_devanning: 'warning',
    completed: 'success',
    abnormal: 'error'
  } as const;
  return map[s];
}

function statusLabel(s: Api.Wms.DevanningOrderStatus) {
  const map: Record<Api.Wms.DevanningOrderStatus, string> = {
    pending_schedule: $t('page.wms.devanningOrder.statusEnum.pending_schedule'),
    pending_devanning: $t('page.wms.devanningOrder.statusEnum.pending_devanning'),
    completed: $t('page.wms.devanningOrder.statusEnum.completed'),
    abnormal: $t('page.wms.devanningOrder.statusEnum.abnormal')
  };
  return map[s];
}

const { options: roundDictOptions } = useDict(WMS_DICT_DEVANNING_ROUND, true);
const { options: orderLevelDictOptions } = useDict(WMS_DICT_ORDER_LEVEL, true);

const getDataRef = ref<(() => Promise<void>) | null>(null);

/** 预计拆柜日期展示/提交：仅 yyyy-MM-dd */
function formatExpectedDateOnly(s: string | null | undefined) {
  if (s == null || !String(s).trim()) return null;
  return String(s).slice(0, 10);
}

function canEditDevanningRow(row: Api.Wms.DevanningOrder) {
  return (
    (hasAuth('wms:devanningOrder:edit') || hasAuth('wms:devanningOrder:add')) &&
    (row.status === 'pending_schedule' || row.status === 'pending_devanning')
  );
}

const editCell = ref<string | null>(null);

function devanningCellKey(rowId: CommonType.IdType, field: 'round' | 'expected' | 'level' | 'dock') {
  return `${rowId}__${field}`;
}

/** 行内 PATCH 必带当前行主数据，避免后端整单 @NotBlank 校验缺字段（柜号/提单号/下单日期等） */
async function patchDevanningOrderRow(
  row: Api.Wms.DevanningOrder,
  patch: Partial<Api.Wms.DevanningOrderOperateParams>
) {
  const body: Api.Wms.DevanningOrderOperateParams = {
    id: row.id,
    coNo: row.coNo ?? '',
    blNo: row.blNo ?? '',
    orderDate: row.orderDate ?? '',
    ...patch
  };
  if (Object.prototype.hasOwnProperty.call(patch, 'expectedDevanningTime')) {
    const d = patch.expectedDevanningTime;
    const has = Boolean(d && String(d).trim());
    body.status = has ? 'pending_schedule' : 'pending_devanning';
  }
  const { error } = await fetchUpdateDevanningOrder(body);
  if (error) return;
  editCell.value = null;
  window.$message?.success($t('common.updateSuccess'));
  await getDataRef.value?.();
}

/** 可编辑列：单行标题 + 提示图标（悬停说明双击编辑）；列宽由 minWidth 保证，标题不对文案截断 */
function editableColumnTitle(labelKey: App.I18n.I18nKey) {
  return () => (
    <div class="inline-flex max-w-full items-center justify-start gap-4px whitespace-nowrap leading-none">
      <span class="text-13px font-600 whitespace-nowrap">{$t(labelKey)}</span>
      <NTooltip placement="top">
        {{
          default: () => $t('page.wms.devanningOrder.doubleClickToEdit'),
          trigger: () => (
            <span class="inline-flex shrink-0 cursor-default text-primary op-80 hover-op-100">
              {h(SvgIcon, { icon: 'material-symbols:edit-square-outline', class: 'text-15px' })}
            </span>
          )
        }}
      </NTooltip>
    </div>
  );
}

/** 只读态可编辑单元格：左对齐、单行、收紧 DictTag 外边距 */
const editableCellReadonlyCls =
  'flex min-h-30px max-w-full min-w-0 cursor-text items-center justify-start rd-4px px-2px op-transition hover:bg-[var(--n-merged-hover-color)] [&_.n-tag]:m-0';

function buildRowDropdownOptions(row: Api.Wms.DevanningOrder): DropdownOption[] {
  const opts: DropdownOption[] = [
    {
      label: $t('page.wms.devanningOrder.detail'),
      key: 'detail',
      icon: () => h(SvgIcon, { icon: 'material-symbols:info-outline', class: 'text-18px' })
    }
  ];
  if (hasAuth('wms:devanningOrder:remark')) {
    opts.push({
      label: $t('page.wms.devanningOrder.fillRemark'),
      key: 'remark',
      icon: () => h(SvgIcon, { icon: 'material-symbols:edit-note-outline', class: 'text-18px' })
    });
  }
  if (hasAuth('wms:devanningOrder:cancelComplete') && row.status === 'completed') {
    opts.push({
      label: $t('page.wms.devanningOrder.cancelComplete'),
      key: 'cancelComplete',
      icon: () => h(SvgIcon, { icon: 'material-symbols:undo-rounded', class: 'text-18px' })
    });
  }
  if (hasAuth('wms:devanningOrder:markAbnormal') && row.status !== 'abnormal') {
    opts.push({
      label: $t('page.wms.devanningOrder.markAbnormal'),
      key: 'markAbnormal',
      icon: () => h(SvgIcon, { icon: 'material-symbols:error-outline', class: 'text-18px text-warning' })
    });
  }
  if (hasAuth('wms:devanningOrder:cancelAbnormal') && row.status === 'abnormal') {
    opts.push({
      label: $t('page.wms.devanningOrder.cancelAbnormal'),
      key: 'cancelAbnormal',
      icon: () => h(SvgIcon, { icon: 'material-symbols:task-alt-outline', class: 'text-18px' })
    });
  }
  if (hasAuth('wms:devanningOrder:export')) {
    opts.push({
      label: $t('page.wms.devanningOrder.exportSheet'),
      key: 'export',
      icon: () => h(SvgIcon, { icon: 'material-symbols:download-rounded', class: 'text-18px' })
    });
  }
  if (hasAuth('wms:devanningOrder:complete') && row.status !== 'completed') {
    opts.push({
      label: $t('page.wms.devanningOrder.completeDevanning'),
      key: 'complete',
      icon: () => h(SvgIcon, { icon: 'material-symbols:check-circle-outline', class: 'text-18px' })
    });
  }
  if (hasAuth('wms:devanningOrder:remove')) {
    opts.push({
      type: 'divider',
      key: 'd1'
    });
    opts.push({
      label: $t('page.wms.devanningOrder.deleteOrder'),
      key: 'delete',
      icon: () => h(SvgIcon, { icon: 'material-symbols:delete-outline', class: 'text-18px text-error' })
    });
  }
  return opts;
}

const dockDraft = reactive<Record<string, string>>({});

const {
  columns,
  columnChecks,
  data,
  getData,
  getDataByPage,
  loading,
  mobilePagination,
  scrollX
} = useNaivePaginatedTable({
    api: () => fetchGetDevanningOrderList(searchParams.value),
    transform: response => defaultTransform(response),
    onPaginationParamsChange: params => {
      searchParams.value.pageNum = params.page;
      searchParams.value.pageSize = params.pageSize;
    },
    columns: () => [
      {
        key: 'coNo',
        title: $t('page.wms.devanningOrder.coNo'),
        align: 'left',
        minWidth: 120,
        ellipsis: true
      },
      {
        key: 'orderDate',
        title: $t('page.wms.devanningOrder.orderDate'),
        align: 'left',
        width: 128,
        sorter: true,
        defaultSortOrder: 'descend'
      },
      {
        key: 'blNo',
        title: $t('page.wms.devanningOrder.blNo'),
        align: 'left',
        minWidth: 140,
        ellipsis: true
      },
      {
        key: 'devanningRound',
        title: editableColumnTitle('page.wms.devanningOrder.devanningRound'),
        align: 'left',
        minWidth: 140,
        render: row => {
          const k = devanningCellKey(row.id, 'round');
          const editing = editCell.value === k;
          if (!canEditDevanningRow(row)) {
            return (
              <div class={editableCellReadonlyCls}>
                {row.devanningRound ? (
                  <DictTag dictCode={WMS_DICT_DEVANNING_ROUND} value={row.devanningRound} immediate />
                ) : (
                  '—'
                )}
              </div>
            );
          }
          if (editing) {
            return (
              <div
                data-devanning-inline-edit="1"
                class="flex w-full justify-start"
                onMousedown={(e: MouseEvent) => e.stopPropagation()}
              >
                <NSelect
                  size="small"
                  class="max-w-full min-w-108px w-full text-left"
                  value={row.devanningRound ?? null}
                  options={roundDictOptions.value}
                  clearable
                  onUpdate:value={(v: string | null) => {
                    void patchDevanningOrderRow(row, { devanningRound: v });
                  }}
                />
              </div>
            );
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
              {row.devanningRound ? (
                <DictTag dictCode={WMS_DICT_DEVANNING_ROUND} value={row.devanningRound} immediate />
              ) : (
                <span class="whitespace-nowrap text-13px text-gray-400">—</span>
              )}
            </div>
          );
        }
      },
      {
        key: 'status',
        title: $t('page.wms.devanningOrder.statusColumn'),
        align: 'left',
        width: 120,
        render: row => (
          <div class="flex justify-start">
            <NTag
              type={statusTagType(row.status)}
              bordered
              class="status-pill"
              style={
                {
                  '--n-font-size': '16px',
                  '--n-height': '26px',
                  '--n-padding': '0 10px'
                } as any
              }
            >
              {statusLabel(row.status)}
            </NTag>
          </div>
        )
      },
      {
        key: 'devanningCompleteTime',
        title: $t('page.wms.devanningOrder.devanningCompleteTime'),
        align: 'left',
        minWidth: 196,
        sorter: true
      },
      {
        key: 'expectedDevanningTime',
        title: editableColumnTitle('page.wms.devanningOrder.expectedDevanningTime'),
        align: 'left',
        minWidth: 212,
        sorter: true,
        render: row => {
          const k = devanningCellKey(row.id, 'expected');
          const editing = editCell.value === k;
          const dateText = formatExpectedDateOnly(row.expectedDevanningTime) ?? '—';
          if (!canEditDevanningRow(row)) return <span class="whitespace-nowrap text-13px">{dateText}</span>;
          if (editing) {
            return (
              <div
                data-devanning-inline-edit="1"
                class="devanning-expected-picker flex w-full max-w-full justify-start px-1px py-2px"
                onMousedown={(e: MouseEvent) => e.stopPropagation()}
              >
                <NDatePicker
                  size="small"
                  class="!w-full max-w-full min-w-108px"
                  type="date"
                  formattedValue={formatExpectedDateOnly(row.expectedDevanningTime)}
                  valueFormat="yyyy-MM-dd"
                  clearable
                  placement="bottom-start"
                  onUpdateFormattedValue={(v: string | null) => {
                    void patchDevanningOrderRow(row, { expectedDevanningTime: v });
                  }}
                />
              </div>
            );
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
              <span class="whitespace-nowrap text-13px">{dateText}</span>
            </div>
          );
        }
      },
      {
        key: 'inboundWarehouse',
        title: $t('page.wms.devanningOrder.inboundWarehouse'),
        align: 'left',
        minWidth: 120,
        ellipsis: true
      },
      {
        key: 'orderLevel',
        title: editableColumnTitle('page.wms.devanningOrder.orderLevel'),
        align: 'left',
        minWidth: 128,
        render: row => {
          const k = devanningCellKey(row.id, 'level');
          const editing = editCell.value === k;
          if (!canEditDevanningRow(row)) {
            return (
              <div class={editableCellReadonlyCls}>
                {row.orderLevel ? (
                  <DictTag dictCode={WMS_DICT_ORDER_LEVEL} value={row.orderLevel} immediate />
                ) : (
                  '—'
                )}
              </div>
            );
          }
          if (editing) {
            return (
              <div
                data-devanning-inline-edit="1"
                class="flex w-full justify-start"
                onMousedown={(e: MouseEvent) => e.stopPropagation()}
              >
                <NSelect
                  size="small"
                  class="max-w-full min-w-108px w-full text-left"
                  value={row.orderLevel ?? null}
                  options={orderLevelDictOptions.value}
                  clearable
                  onUpdate:value={(v: string | null) => {
                    void patchDevanningOrderRow(row, { orderLevel: v });
                  }}
                />
              </div>
            );
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
              {row.orderLevel ? (
                <DictTag dictCode={WMS_DICT_ORDER_LEVEL} value={row.orderLevel} immediate />
              ) : (
                <span class="whitespace-nowrap text-13px text-gray-400">—</span>
              )}
            </div>
          );
        }
      },
      {
        key: 'devanningDock',
        title: editableColumnTitle('page.wms.devanningOrder.devanningDock'),
        align: 'left',
        minWidth: 120,
        render: row => {
          const k = devanningCellKey(row.id, 'dock');
          const editing = editCell.value === k;
          if (!canEditDevanningRow(row))
            return <span class="whitespace-nowrap text-13px">{row.devanningDock ?? '—'}</span>;
          if (editing) {
            return (
              <div
                data-devanning-inline-edit="1"
                class="flex w-full justify-start"
                onMousedown={(e: MouseEvent) => e.stopPropagation()}
              >
                <NInput
                  size="small"
                  class="max-w-full min-w-[88px] w-full"
                  value={dockDraft[String(row.id)] ?? row.devanningDock ?? ''}
                  onUpdateValue={nv => {
                    dockDraft[String(row.id)] = nv;
                  }}
                  onBlur={() => {
                    const v = (dockDraft[String(row.id)] ?? '').trim();
                    const cur = (row.devanningDock ?? '').trim();
                    if (v === cur) {
                      editCell.value = null;
                      columnChecks.value = columnChecks.value.slice();
                      return;
                    }
                    void patchDevanningOrderRow(row, { devanningDock: v || null });
                  }}
                />
              </div>
            );
          }
          return (
            <div
              class={editableCellReadonlyCls}
              title={$t('page.wms.devanningOrder.doubleClickToEdit')}
              onDblclick={(e: MouseEvent) => {
                e.stopPropagation();
                dockDraft[String(row.id)] = row.devanningDock ?? '';
                editCell.value = k;
              }}
            >
              <span class="whitespace-nowrap text-13px">{row.devanningDock?.trim() ? row.devanningDock : '—'}</span>
            </div>
          );
        }
      },
      {
        key: 'cargoQty',
        title: $t('page.wms.devanningOrder.cargoQty'),
        align: 'left',
        width: 100
      },
      {
        key: 'cargoWeight',
        title: $t('page.wms.devanningOrder.cargoWeight'),
        align: 'left',
        width: 110
      },
      {
        key: 'remark',
        title: $t('page.wms.devanningOrder.remarkColumn'),
        align: 'left',
        minWidth: 120,
        ellipsis: {
          tooltip: true
        }
      },
      {
        key: 'operate',
        title: $t('common.operate'),
        align: 'left',
        fixed: 'right',
        width: 108,
        render: row => {
          const options = buildRowDropdownOptions(row);
          return (
            <div class="flex justify-start">
              <NDropdown
                trigger="click"
                placement="bottom-end"
                options={options}
                onSelect={key => handleRowMenuSelect(key, row)}
              >
                <NButton size="small" type="primary" secondary class="min-w-88px">
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
    ]
  });

getDataRef.value = getData;

/** Naive 下拉/日期等挂到 body，点击浮层不能当作「点外部」关闭 */
function isInlineEditOverlayTarget(t: EventTarget | null) {
  if (!(t instanceof Element)) return false;
  return !!(
    t.closest('[data-devanning-inline-edit="1"]') ||
    t.closest('.n-base-select-menu') ||
    t.closest('.n-base-selection-overlay') ||
    t.closest('.v-binder-follower-content') ||
    t.closest('.n-popover-shared') ||
    t.closest('.n-date-panel') ||
    t.closest('.n-dropdown-menu') ||
    t.closest('.n-modal') ||
    t.closest('.n-drawer')
  );
}

/** 点击表格外或表格内其它区域：取消行内编辑（拆柜口未触发的修改丢弃） */
function closeInlineEditFromOutside(target: EventTarget | null) {
  if (!editCell.value) return;
  if (isInlineEditOverlayTarget(target)) return;
  const k = editCell.value;
  if (k.endsWith('__dock')) {
    const rowId = k.slice(0, -'__dock'.length);
    const row = data.value.find(r => String(r.id) === rowId);
    if (row) dockDraft[String(row.id)] = row.devanningDock ?? '';
  }
  editCell.value = null;
}

function onDocumentMouseDown(ev: MouseEvent) {
  closeInlineEditFromOutside(ev.target);
}

onMounted(() => {
  document.addEventListener('mousedown', onDocumentMouseDown);
});
onUnmounted(() => {
  document.removeEventListener('mousedown', onDocumentMouseDown);
});

watch(
  () => data.value,
  rows => {
    for (const r of rows) {
      dockDraft[String(r.id)] = r.devanningDock ?? '';
    }
  },
  { deep: true, immediate: true }
);

/** 触发表格列算子重跑以读取最新 editCell，避免用 reloadColumns 重置列显隐 */
watch(editCell, () => {
  columnChecks.value = columnChecks.value.slice();
});

function handleUpdateSorter(sorter: DataTableSortState) {
  if (!sorter.order) {
    searchParams.value.orderByColumn = 'orderDate';
    searchParams.value.isAsc = 'desc';
  } else {
    searchParams.value.orderByColumn = String(sorter.columnKey);
    searchParams.value.isAsc = sorter.order === 'ascend' ? 'asc' : 'desc';
  }
  getDataByPage();
}

function setStatusFilter(s: Status) {
  searchParams.value.status = s;
  searchParams.value.pageNum = 1;
  getDataByPage();
}

async function handleDelete(id: CommonType.IdType) {
  const { error } = await fetchBatchDeleteDevanningOrder([id]);
  if (error) return;
  window.$message?.success($t('common.deleteSuccess'));
  await getData();
}

function openDetail(id: CommonType.IdType) {
  detailOrderId.value = id;
  detailVisible.value = true;
}

function handleExportRow(row: Api.Wms.DevanningOrder) {
  const name = `${$t('page.wms.devanningOrder.exportSheet')}_${row.coNo || row.id}_${Date.now()}.xlsx`;
  zip(`/wms/devanning-order/export/${row.id}`, name);
}

async function handleComplete(id: CommonType.IdType) {
  const { error } = await fetchCompleteDevanningOrder(id);
  if (error) return;
  window.$message?.success($t('page.wms.devanningOrder.completeSuccess'));
  await getData();
}

function openRemarkModal(row: Api.Wms.DevanningOrder) {
  remarkOrderId.value = row.id;
  remarkInitial.value = row.remark ?? null;
  remarkModalVisible.value = true;
}

async function handleCancelComplete(id: CommonType.IdType) {
  const { error } = await fetchCancelCompleteDevanningOrder(id);
  if (error) return;
  window.$message?.success($t('common.updateSuccess'));
  await getData();
}

async function handleMarkAbnormal(id: CommonType.IdType) {
  const { error } = await fetchMarkAbnormalDevanningOrder(id);
  if (error) return;
  window.$message?.success($t('common.updateSuccess'));
  await getData();
}

async function handleCancelAbnormal(id: CommonType.IdType) {
  const { error } = await fetchCancelAbnormalDevanningOrder(id);
  if (error) return;
  window.$message?.success($t('common.updateSuccess'));
  await getData();
}

function handleRowMenuSelect(key: string | number, row: Api.Wms.DevanningOrder) {
  const k = String(key);
  if (k === 'd1') return;
  switch (k) {
    case 'detail':
      openDetail(row.id);
      break;
    case 'export':
      handleExportRow(row);
      break;
    case 'complete':
      window.$dialog?.warning({
        title: $t('common.warning'),
        content: $t('page.wms.devanningOrder.completeConfirm'),
        positiveText: $t('common.confirm'),
        negativeText: $t('common.cancel'),
        onPositiveClick: async () => {
          await handleComplete(row.id);
        }
      });
      break;
    case 'remark':
      openRemarkModal(row);
      break;
    case 'cancelComplete':
      window.$dialog?.warning({
        title: $t('common.warning'),
        content: $t('page.wms.devanningOrder.cancelCompleteConfirm'),
        positiveText: $t('common.confirm'),
        negativeText: $t('common.cancel'),
        onPositiveClick: async () => {
          await handleCancelComplete(row.id);
        }
      });
      break;
    case 'markAbnormal':
      window.$dialog?.warning({
        title: $t('common.warning'),
        content: $t('page.wms.devanningOrder.markAbnormalConfirm'),
        positiveText: $t('common.confirm'),
        negativeText: $t('common.cancel'),
        onPositiveClick: async () => {
          await handleMarkAbnormal(row.id);
        }
      });
      break;
    case 'cancelAbnormal':
      window.$dialog?.warning({
        title: $t('common.warning'),
        content: $t('page.wms.devanningOrder.cancelAbnormalConfirm'),
        positiveText: $t('common.confirm'),
        negativeText: $t('common.cancel'),
        onPositiveClick: async () => {
          await handleCancelAbnormal(row.id);
        }
      });
      break;
    case 'delete':
      window.$dialog?.warning({
        title: $t('common.warning'),
        content: $t('common.confirmDelete'),
        positiveText: $t('common.confirm'),
        negativeText: $t('common.cancel'),
        onPositiveClick: async () => {
          await handleDelete(row.id);
        }
      });
      break;
    default:
      break;
  }
}

function onImportSubmitted() {
  closeImport();
  getDataByPage();
}

function onCreateSubmitted() {
  closeCreate();
  getDataByPage();
}
</script>

<template>
  <div class="h-full min-h-500px flex flex-col gap-16px overflow-hidden lt-sm:overflow-auto">
    <DevanningOrderSearch
      v-model:model="searchParams"
      :can-import="hasAuth('wms:devanningOrder:import')"
      :can-add="hasAuth('wms:devanningOrder:add')"
      @search="getDataByPage"
      @import="openImport"
      @create="openCreate"
    />

    <NCard
      :bordered="false"
      size="small"
      class="card-wrapper flex min-h-0 flex-1 flex-col overflow-hidden sm:flex-1-hidden"
      content-class="flex min-h-0 flex-1 flex-col overflow-hidden"
    >
      <template #header>
        <div class="flex-y-center justify-between gap-12px">
          <span class="text-16px font-medium">{{ $t('page.wms.devanningOrder.title') }}</span>
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
      <div class="flex min-h-0 flex-1 flex-col gap-16px overflow-hidden">
        <NSpace class="shrink-0 flex-wrap" align="center" :size="8">
          <NTag
            v-for="item in statusTabs"
            :key="String(item.key)"
            :type="searchParams.status === item.key ? 'primary' : 'default'"
            :bordered="false"
            round
            class="cursor-pointer px-10px"
            @click="setStatusFilter(item.key)"
          >
            {{ $t(item.label) }}
          </NTag>
        </NSpace>
        <div class="min-h-0 flex flex-1 basis-0 flex-col overflow-hidden">
          <DataTable
            :columns="columns"
            :data="data"
            :flex-height="!appStore.isMobile"
            :scroll-x="scrollX"
            :loading="loading"
            remote
            :row-key="row => row.id"
            :pagination="mobilePagination"
            class="devanning-order-table h-full min-h-280px sm:min-h-0"
            @update:sorter="handleUpdateSorter"
          />
        </div>
      </div>
    </NCard>

    <DevanningOrderImportModal v-model:visible="importVisible" @submitted="onImportSubmitted" />
    <DevanningOrderOperateDrawer v-model:visible="createVisible" @submitted="onCreateSubmitted" />
    <DevanningOrderRemarkModal
      v-model:visible="remarkModalVisible"
      :order-id="remarkOrderId"
      :initial-remark="remarkInitial"
      @submitted="getData"
    />
    <DevanningOrderDetailDrawer v-model:visible="detailVisible" :order-id="detailOrderId" />
  </div>
</template>

<style scoped>
:deep(.devanning-order-table .n-data-table-th__title),
:deep(.devanning-order-table .n-data-table-th) {
  font-size: 15px;
  font-weight: 600;
}

.status-pill {
  font-size: 16px;
  line-height: 20px;
}

:deep(.devanning-order-table .n-data-table-th),
:deep(.devanning-order-table .n-data-table-td) {
  text-align: left !important;
}

/** 表头单行，避免「拆柜完成时间」等在中等列宽下折行 */
:deep(.devanning-order-table .n-data-table-th) {
  white-space: nowrap;
}

:deep(.devanning-order-table .n-data-table-td) {
  font-size: 14px;
}

/** 行内日期选择器不顶破表头；列宽由 minWidth 控制 */
:deep(.devanning-expected-picker .n-input),
:deep(.devanning-expected-picker .n-input__input-el) {
  min-height: 30px;
}
</style>
