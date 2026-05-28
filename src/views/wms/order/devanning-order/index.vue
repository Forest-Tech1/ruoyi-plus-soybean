<script setup lang="tsx">
import { computed, h, onMounted, onUnmounted, reactive, ref, shallowRef, watch } from 'vue';
import type { DataTableSortState, DropdownOption } from 'naive-ui';
import { NButton, NDatePicker, NDropdown, NInput, NInputNumber, NSelect, NTag, NTooltip } from 'naive-ui';
import { useBoolean } from '@sa/hooks';
import {
  fetchBatchDeleteDevanningOrder,
  fetchCancelAbnormalDevanningOrder,
  fetchCancelCompleteDevanningOrder,
  fetchCompleteDevanningOrder,
  fetchGetDevanningOrderList,
  fetchMarkAbnormalDevanningOrder,
} from '@/service/api/wms/devanning-order';
import {
  getDefaultDevanningOrderCreateTimeRange,
  buildDevanningStatusSelectOptions,
  devanningStatusI18nKey,
  normalizeDevanningOrderLevel,
  resolveDevanningOrderStatus,
  WMS_DICT_DEVANNING_ROUND
} from '@/constants/wms-devanning';
import DictTag from '@/components/custom/dict-tag.vue';
import { useAppStore } from '@/store/modules/app';
import { useAuth } from '@/hooks/business/auth';
import { useDownload } from '@/hooks/business/download';
import { useDevanningOrderExport } from '@/hooks/business/use-devanning-order-export';
import {
  formatExpectedDevanningDateOnly,
  patchDevanningOrder,
  useDevanningOrderEditPermission
} from '@/hooks/business/use-devanning-order-patch';
import { useDict } from '@/hooks/business/dict';
import { defaultTransform, useNaivePaginatedTable } from '@/hooks/common/table';
import { $t } from '@/locales';
import SvgIcon from '@/components/custom/svg-icon.vue';
import { handleCopy } from '@/utils/copy';
import DevanningOrderDetailDrawer from './modules/devanning-order-detail-drawer.vue';
import DevanningOrderImportModal from './modules/devanning-order-import-modal.vue';
import DevanningOrderRemarkModal from './modules/devanning-order-remark-modal.vue';
import DevanningOrderOperateDrawer from './modules/devanning-order-operate-drawer.vue';
import DevanningOrderSearch from './modules/devanning-order-search.vue';
import DevanningOrderAttachmentsModal from './modules/devanning-order-attachments-modal.vue';
import { getDevanningOrderAttachmentCount } from './modules/devanning-order-attachment-utils';

defineOptions({
  name: 'DevanningOrderList'
});

const appStore = useAppStore();
const { zip, download, printBlobFromAuthenticatedGet } = useDownload();
const { hasAuth } = useAuth();
const { exportDevanningSheet, exportPalletLabelWord } = useDevanningOrderExport();
const { canEditDevanningRow, canEditDevanningLabelTag } = useDevanningOrderEditPermission();

/**
 * 行「更多」→ 导出货物订单：必传 orderId（与列表行 / 详情 GET 同一条拆柜主键），后端只导当前海柜。
 * @see docs/wms-devanning-order-api.md §14.5
 */
function handleExportCargoOrdersForRow(row: Api.Wms.DevanningOrder) {
  const safeCo = (row.coNo ?? '').trim().replace(/[\\/:*?"<>|]/g, '_') || String(row.id);
  void download(
    '/wms/devanning-order/export/cargo-orders',
    { orderId: row.id } as Record<string, any>,
    `${$t('page.wms.devanningOrder.exportCargoOrders')}_${safeCo}_${Date.now()}.xlsx`
  );
}

const {
  bool: importVisible,
  setTrue: openImport,
  setFalse: closeImport
} = useBoolean();

/** 派送导入：标准 / 原始订单表；导入订单（Sheet2）走 V2 预览（确认共用 import-confirm） */
const importVariant = ref<'standard' | 'rawOrder' | 'rawOrderSheet2'>('standard');

function openImportStandard() {
  importVariant.value = 'standard';
  openImport();
}

function openImportRawOrder() {
  importVariant.value = 'rawOrder';
  openImport();
}

/** 导入订单：Sheet2 + V2 预览 `import-preview/v2`、模板 `importTemplate/v2` */
function openImportOrderSheet2() {
  importVariant.value = 'rawOrderSheet2';
  openImport();
}
const {
  bool: createVisible,
  setTrue: openCreate,
  setFalse: closeCreate
} = useBoolean();
const detailVisible = ref(false);
const detailOrderId = ref<CommonType.IdType | null>(null);
/** 导出拆柜单成功后递增，驱动详情抽屉内入库计划 Tab 重新拉取（含系统预库位） */
const inboundReloadNonce = ref(0);

const remarkModalVisible = ref(false);
const remarkOrderId = ref<CommonType.IdType | null>(null);
const remarkInitial = ref<string | null>(null);

const checkedRowKeys = shallowRef<CommonType.IdType[]>([]);

const coNoClickTimer = ref<number | null>(null);

/** 列表默认展示的列：柜号、操作状态、货物数量/重量、标签、备注、创建时间、操作；其余默认隐藏（可在列设置中打开） */
const DEVANNING_ORDER_DEFAULT_CHECKED_COLUMN_KEYS = new Set<string>([
  'coNo',
  'devanningStatus',
  'attachments',
  'operationPrintStatus',
  'orderLevel',
  'devanningRound',
  'devanningDock',
  'driverPhone',
  'expectedDevanningTime',
  'cargoQty',
  'cargoWeight',
  'labelTag',
  'remark',
  'createTime',
  'operate'
]);

function devanningOrderGetColumnDefaultChecked(column: NaiveUI.TableColumn<Api.Wms.DevanningOrder>) {
  const k = (column as NaiveUI.TableColumnWithKey<Api.Wms.DevanningOrder>).key;
  if (k != null && k !== '') {
    return DEVANNING_ORDER_DEFAULT_CHECKED_COLUMN_KEYS.has(String(k));
  }
  return true;
}

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
  pageSize: 100,
  coNo: null,
  blNo: null,
  status: null,
  devanningRound: null,
  orderLevel: null,
  devanningStatus: null,
  /** 默认：创建时间降序（对应后端 createTime；与表头默认排序一致） */
  orderByColumn: 'createTime',
  isAsc: 'desc',
  params: {
    ...getDefaultDevanningOrderCreateTimeRange(),
    devanningCompleteBegin: undefined,
    devanningCompleteEnd: undefined,
    expectedDevanningBegin: undefined,
    expectedDevanningEnd: undefined
  }
});

/** 列表「操作状态」：拆柜单 / 卡板贴是否已打（依赖后端布尔字段） */
function isDevanningPrintFlag(v: unknown): boolean {
  return v === true || v === 1 || v === '1' || String(v).toLowerCase() === 'true';
}

function renderOperationStatusCell(row: Api.Wms.DevanningOrder) {
  const sheet = isDevanningPrintFlag(row.devanningSheetPrinted);
  const pallet = isDevanningPrintFlag(row.palletLabelPrinted);
  if (!sheet && !pallet) {
    return <span class="text-13px text-gray-400">—</span>;
  }
  return (
    <div class="inline-flex max-w-full flex-col items-start justify-center gap-2px rd-4px bg-red-100 px-8px py-4px text-12px leading-[1.35] text-red-900 dark:bg-red-950/80 dark:text-red-100">
      <div class="min-h-[17px] whitespace-nowrap">
        {sheet ? $t('page.wms.devanningOrder.operationStatusDevanningSheetPrinted') : ''}
      </div>
      <div class="min-h-[17px] whitespace-nowrap">
        {pallet ? $t('page.wms.devanningOrder.operationStatusPalletLabelPrinted') : ''}
      </div>
    </div>
  );
}

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

const devanningStatusOptions = computed(() => buildDevanningStatusSelectOptions($t));

const getDataRef = ref<(() => Promise<void>) | null>(null);

const editCell = ref<string | null>(null);

const attachmentsVisible = ref(false);
const attachmentsOrder = ref<Api.Wms.DevanningOrder | null>(null);

function openAttachments(row: Api.Wms.DevanningOrder) {
  attachmentsOrder.value = row;
  attachmentsVisible.value = true;
}

watch(attachmentsVisible, v => {
  if (!v) {
    attachmentsOrder.value = null;
    void getData();
  }
});

function devanningCellKey(
  rowId: CommonType.IdType,
  field: 'round' | 'expected' | 'level' | 'dock' | 'label' | 'devanningStatus'
) {
  return `${rowId}__${field}`;
}

function renderDevanningStatusLabel(row: Api.Wms.DevanningOrder) {
  const s = resolveDevanningOrderStatus(row);
  const key = devanningStatusI18nKey(s);
  return key ? $t(key) : '—';
}

async function patchDevanningOrderRow(
  row: Api.Wms.DevanningOrder,
  patch: Partial<Api.Wms.DevanningOrderOperateParams>
) {
  const ok = await patchDevanningOrder(row, patch);
  if (!ok) return;
  editCell.value = null;
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
    opts.push({
      label: $t('page.wms.devanningOrder.exportCargoOrders'),
      key: 'exportCargoOrders',
      icon: () => h(SvgIcon, { icon: 'material-symbols:inventory-2-outline', class: 'text-18px' })
    });
  }
  if (hasAuth('wms:devanningOrder:palletLabel') || hasAuth('wms:devanningOrder:export')) {
    opts.push({
      label: $t('page.wms.devanningOrder.palletLabelWord'),
      key: 'pallet-docx',
      icon: () => h(SvgIcon, { icon: 'material-symbols:description-outline', class: 'text-18px' })
    });
    opts.push({
      label: $t('page.wms.devanningOrder.palletLabelZip'),
      key: 'pallet-zip',
      icon: () => h(SvgIcon, { icon: 'material-symbols:folder-zip-outline', class: 'text-18px' })
    });
  }
  if (
    hasAuth('wms:devanningOrder:palletLabelPdf') ||
    hasAuth('wms:devanningOrder:palletLabel') ||
    hasAuth('wms:devanningOrder:export')
  ) {
    opts.push({
      label: $t('page.wms.devanningOrder.palletLabelPdfDirectPrint'),
      key: 'pallet-pdf-preview',
      icon: () => h(SvgIcon, { icon: 'material-symbols:print-outline', class: 'text-18px' })
    });
    opts.push({
      label: $t('page.wms.devanningOrder.palletLabelPdf'),
      key: 'pallet-pdf',
      icon: () => h(SvgIcon, { icon: 'material-symbols:picture-as-pdf-outline', class: 'text-18px' })
    });
    opts.push({
      label: $t('page.wms.devanningOrder.palletLabelPdfZip'),
      key: 'pallet-pdfzip',
      icon: () => h(SvgIcon, { icon: 'material-symbols:folder-zip-outline', class: 'text-18px' })
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
const driverPhoneDraft = reactive<Record<string, string>>({});
const labelDraft = reactive<Record<string, string>>({});
const activeLabelRowId = ref<CommonType.IdType | null>(null);

const {
  columns,
  columnChecks,
  data,
  getData,
  getDataByPage,
  loading,
  mobilePagination,
  pagination,
  scrollX
} = useNaivePaginatedTable({
    initialPageSize: 100,
    paginationProps: {
      pageSizes: [10, 30, 50, 100, 300, 500]
    },
    getColumnDefaultChecked: devanningOrderGetColumnDefaultChecked,
    api: () => fetchGetDevanningOrderList(searchParams.value),
    transform: response => defaultTransform(response),
    onPaginationParamsChange: params => {
      searchParams.value.pageNum = params.page;
      searchParams.value.pageSize = params.pageSize;
    },
    columns: () => [
      {
        type: 'selection' as const,
        align: 'center',
        width: 56
      },
      {
        key: 'coNo',
        title: $t('page.wms.devanningOrder.coNo'),
        align: 'left',
        minWidth: 120,
        ellipsis: true,
        render: row => (
          <div
            class="inline-flex max-w-full min-w-0 cursor-pointer items-center"
            title={$t('page.wms.devanningOrder.detail')}
            onClick={(e: MouseEvent) => {
              e.stopPropagation();
              if (coNoClickTimer.value != null) window.clearTimeout(coNoClickTimer.value);
              coNoClickTimer.value = window.setTimeout(() => {
                void handleCopy(row.coNo ?? '');
                coNoClickTimer.value = null;
              }, 220);
            }}
            onDblclick={(e: MouseEvent) => {
              e.stopPropagation();
              if (coNoClickTimer.value != null) {
                window.clearTimeout(coNoClickTimer.value);
                coNoClickTimer.value = null;
              }
              openDetail(row.id);
            }}
          >
            <span class="truncate">{row.coNo ?? '—'}</span>
          </div>
        )
      },
      {
        key: 'attachments',
        title: $t('page.wms.devanningOrder.attachmentsColumn'),
        align: 'left',
        width: 138,
        render: row => {
          const c = getDevanningOrderAttachmentCount(row);
          return (
            <NButton size="tiny" secondary type={c > 0 ? 'success' : 'primary'} onClick={() => openAttachments(row)}>
              <span class="inline-flex items-center gap-4px">
                {h(SvgIcon, { icon: 'material-symbols:attach-file', class: 'text-16px' })}
                <span>
                  {c > 0
                    ? $t('page.wms.devanningOrder.attachmentsHas', { count: c })
                    : $t('page.wms.devanningOrder.attachmentsUpload')}
                </span>
              </span>
            </NButton>
          );
        }
      },
      {
        key: 'devanningStatus',
        title: editableColumnTitle('page.wms.devanningOrder.devanningStatus'),
        align: 'left',
        minWidth: 120,
        render: row => {
          const k = devanningCellKey(row.id, 'devanningStatus');
          const editing = editCell.value === k;
          if (!canEditDevanningRow(row)) {
            return <span class="whitespace-nowrap text-13px">{renderDevanningStatusLabel(row)}</span>;
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
                  class="max-w-full min-w-120px w-full text-left"
                  value={resolveDevanningOrderStatus(row)}
                  options={devanningStatusOptions.value}
                  clearable
                  onUpdate:value={(v: Api.Wms.DevanningStatus | null) => {
                    void patchDevanningOrderRow(row, {
                      devanningStatus: v,
                      schedulingStatus: v
                    });
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
              <span class="whitespace-nowrap text-13px">{renderDevanningStatusLabel(row)}</span>
            </div>
          );
        }
      },
      {
        key: 'queuePosition',
        title: $t('page.wms.devanningOrder.queuePosition'),
        align: 'center',
        width: 88,
        render: row => (
          <span class="whitespace-nowrap text-13px">{row.queuePosition ?? '—'}</span>
        )
      },
      {
        key: 'createTime',
        title: $t('page.common.createTime'),
        align: 'left',
        width: 172,
        ellipsis: { tooltip: true },
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
        key: 'operationPrintStatus',
        title: $t('page.wms.devanningOrder.operationStatusColumn'),
        align: 'left',
        width: 120,
        render: row => renderOperationStatusCell(row)
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
          const dateText = formatExpectedDevanningDateOnly(row.expectedDevanningTime) ?? '—';
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
                  formattedValue={formatExpectedDevanningDateOnly(row.expectedDevanningTime)}
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
                {row.orderLevel != null ? (
                  <span class="whitespace-nowrap text-13px">{row.orderLevel}</span>
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
                <NInputNumber
                  size="small"
                  class="max-w-full min-w-88px w-full text-left"
                  value={row.orderLevel ?? null}
                  clearable
                  showButton={false}
                  onUpdate:value={(v: number | null) => {
                    void patchDevanningOrderRow(row, { orderLevel: normalizeDevanningOrderLevel(v) });
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
              {row.orderLevel != null ? (
                <span class="whitespace-nowrap text-13px">{row.orderLevel}</span>
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
        key: 'driverPhone',
        title: editableColumnTitle('page.wms.devanningOrder.driverPhone'),
        align: 'left',
        minWidth: 132,
        render: row => {
          const k = devanningCellKey(row.id, 'driverPhone');
          const editing = editCell.value === k;
          if (!canEditDevanningRow(row))
            return <span class="whitespace-nowrap text-13px">{row.driverPhone?.trim() ? row.driverPhone : '—'}</span>;
          if (editing) {
            return (
              <div
                data-devanning-inline-edit="1"
                class="flex w-full justify-start"
                onMousedown={(e: MouseEvent) => e.stopPropagation()}
              >
                <NInput
                  size="small"
                  class="max-w-full min-w-[96px] w-full"
                  value={driverPhoneDraft[String(row.id)] ?? row.driverPhone ?? ''}
                  onUpdateValue={nv => {
                    driverPhoneDraft[String(row.id)] = nv;
                  }}
                  onBlur={() => {
                    const v = (driverPhoneDraft[String(row.id)] ?? '').trim();
                    const cur = (row.driverPhone ?? '').trim();
                    if (v === cur) {
                      editCell.value = null;
                      columnChecks.value = columnChecks.value.slice();
                      return;
                    }
                    void patchDevanningOrderRow(row, { driverPhone: v || null });
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
                driverPhoneDraft[String(row.id)] = row.driverPhone ?? '';
                editCell.value = k;
              }}
            >
              <span class="whitespace-nowrap text-13px">{row.driverPhone?.trim() ? row.driverPhone : '—'}</span>
            </div>
          );
        }
      },
      {
        key: 'labelTag',
        title: editableColumnTitle('page.wms.devanningOrder.labelTag'),
        align: 'left',
        minWidth: 140,
        render: row => {
          const k = devanningCellKey(row.id, 'label');
          const editing = editCell.value === k;

          const hasHold = Boolean(row.hasHold);
          const label = (row.labelTag ?? '').trim();
          const active = activeLabelRowId.value === row.id;
          const allowEditLabel = canEditDevanningLabelTag();

          // 标签：允许在任意状态下清除/编辑（由权限控制）；HOLD 仅展示，不可删除
          if (!allowEditLabel) {
            const showDash = !hasHold && !label;
            return (
              <div class="inline-flex max-w-full min-w-0 items-center gap-6px">
                {hasHold ? <NTag size="small" type="warning">HOLD</NTag> : null}
                {label ? (
                  <span
                    class="inline-block cursor-pointer"
                    onClick={(e: MouseEvent) => {
                      e.stopPropagation();
                      activeLabelRowId.value = row.id;
                    }}
                  >
                    <NTag size="small">{label}</NTag>
                  </span>
                ) : null}
                {showDash ? <span class="text-13px text-gray-400">—</span> : null}
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
                <NInput
                  size="small"
                  class="max-w-full min-w-[88px] w-full"
                  value={labelDraft[String(row.id)] ?? row.labelTag ?? ''}
                  onUpdateValue={nv => {
                    labelDraft[String(row.id)] = nv;
                  }}
                  onBlur={() => {
                    const v = (labelDraft[String(row.id)] ?? '').trim();
                    const cur = (row.labelTag ?? '').trim();
                    if (v === cur) {
                      editCell.value = null;
                      columnChecks.value = columnChecks.value.slice();
                      return;
                    }
                    void patchDevanningOrderRow(row, { labelTag: v || null });
                  }}
                />
              </div>
            );
          }

          const showDash = !hasHold && !label;
          return (
            <div
              class={editableCellReadonlyCls}
              title={$t('page.wms.devanningOrder.doubleClickToEdit')}
              onDblclick={(e: MouseEvent) => {
                e.stopPropagation();
                labelDraft[String(row.id)] = row.labelTag ?? '';
                editCell.value = k;
              }}
            >
              <div class="inline-flex max-w-full min-w-0 items-center gap-6px">
                {hasHold ? <NTag size="small" type="warning">HOLD</NTag> : null}
                {label ? (
                  <span
                    class="inline-block cursor-pointer"
                    onClick={(e: MouseEvent) => {
                      e.stopPropagation();
                      activeLabelRowId.value = row.id;
                    }}
                  >
                    <NTag
                      size="small"
                      closable={active}
                      onClose={
                        active
                          ? e => {
                              e.stopPropagation();
                              void patchDevanningOrderRow(row, { labelTag: null });
                            }
                          : undefined
                      }
                    >
                      {label}
                    </NTag>
                  </span>
                ) : null}
                {showDash ? <span class="whitespace-nowrap text-13px text-gray-400">—</span> : null}
              </div>
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
  if (k.endsWith('__driverPhone')) {
    const rowId = k.slice(0, -'__driverPhone'.length);
    const row = data.value.find(r => String(r.id) === rowId);
    if (row) driverPhoneDraft[String(row.id)] = row.driverPhone ?? '';
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
      driverPhoneDraft[String(r.id)] = r.driverPhone ?? '';
    }
    const ids = new Set(rows.map(r => r.id));
    checkedRowKeys.value = checkedRowKeys.value.filter(id => ids.has(id));
  },
  { deep: true, immediate: true }
);

/** 触发表格列算子重跑以读取最新 editCell，避免用 reloadColumns 重置列显隐 */
watch(editCell, () => {
  columnChecks.value = columnChecks.value.slice();
});

function handleUpdateSorter(sorter: DataTableSortState) {
  if (!sorter.order) {
    searchParams.value.orderByColumn = 'createTime';
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
  checkedRowKeys.value = [];
  getDataByPage();
}

/**
 * 删除行后刷新列表：若当前页已无数据（总页数变少），需把页码收回最后一页并再拉一次，否则会请求越界页得到空表。
 * `getData` 在 `@sa/hooks/use-table` 侧已对并发请求去重，此处与分页 watch 重叠触发时可避免旧响应覆盖。
 */
async function refreshListAfterOrderDeleted() {
  await getData();
  const total = Number(pagination.itemCount ?? 0);
  const pageSize = searchParams.value.pageSize ?? pagination.pageSize ?? 100;
  const maxPage = Math.max(1, Math.ceil(total / pageSize));
  const curPage = Number(searchParams.value.pageNum ?? pagination.page ?? 1);
  if (curPage > maxPage) {
    searchParams.value.pageNum = maxPage;
    pagination.page = maxPage;
    await getData();
  }
}

async function handleDelete(id: CommonType.IdType) {
  const { error } = await fetchBatchDeleteDevanningOrder([id]);
  if (error) return;
  window.$message?.success($t('common.deleteSuccess'));
  await refreshListAfterOrderDeleted();
}

/** 批量删除：与单行删除共用 `DELETE /wms/devanning-order/{ids}`，一次传入全部选中 id（勿循环请求） */
function handleBatchDeleteRequest() {
  const ids = [...checkedRowKeys.value];
  if (!ids.length) {
    window.$message?.warning($t('page.wms.devanningOrder.batchDeleteNeedSelection'));
    return;
  }
  window.$dialog?.warning({
    title: $t('common.warning'),
    content: $t('page.wms.devanningOrder.batchDeleteConfirm', { count: ids.length }),
    positiveText: $t('common.confirm'),
    negativeText: $t('common.cancel'),
    onPositiveClick: async () => {
      const { error } = await fetchBatchDeleteDevanningOrder(ids);
      if (error) return false;
      checkedRowKeys.value = [];
      window.$message?.success($t('common.deleteSuccess'));
      await refreshListAfterOrderDeleted();
      return true;
    }
  });
}

function openDetail(id: CommonType.IdType) {
  detailOrderId.value = id;
  detailVisible.value = true;
}

async function handleExportRow(row: Api.Wms.DevanningOrder) {
  const ok = await exportDevanningSheet(row);
  if (!ok) return;
  await getData();
  if (detailVisible.value && detailOrderId.value === row.id) {
    inboundReloadNonce.value += 1;
  }
}

async function handlePalletLabelsDocx(row: Api.Wms.DevanningOrder) {
  const ok = await exportPalletLabelWord(row);
  if (!ok) return;
  await getData();
  if (detailVisible.value && detailOrderId.value === row.id) {
    inboundReloadNonce.value += 1;
  }
}

function onDetailExportSuccess() {
  void getData();
  inboundReloadNonce.value += 1;
}

function onDetailUpdated() {
  void getData();
}

async function handlePalletLabelsZip(row: Api.Wms.DevanningOrder) {
  const name = `${$t('page.wms.devanningOrder.palletLabelFilePrefix')}_${row.coNo || row.id}_${Date.now()}.zip`;
  const ok = await zip(`/wms/devanning-order/${row.id}/pallet-labels/export?format=zip`, name);
  if (!ok) return;
  await getData();
  if (detailVisible.value && detailOrderId.value === row.id) {
    inboundReloadNonce.value += 1;
  }
}

/**
 * 卡板贴 PDF 直接打印：带鉴权拉 Blob → 隐藏 iframe `print()`；`preview=true` 不落「已打印」。
 * iframe 使用离屏正常尺寸，避免 0×0 视口导致 Chrome 打印 UI 缺「更多设置」等项。
 */
async function handlePalletLabelsPdfPreview(row: Api.Wms.DevanningOrder) {
  const ok = await printBlobFromAuthenticatedGet(
    `/wms/devanning-order/${row.id}/pallet-labels/export?format=pdf&preview=true`
  );
  if (!ok) return;
}

/** 卡板贴单 PDF 下载：`GET .../pallet-labels/export?format=pdf&preview=false`（成功后记 `palletLabelPrinted`） */
async function handlePalletLabelsPdf(row: Api.Wms.DevanningOrder) {
  const name = `${$t('page.wms.devanningOrder.palletLabelFilePrefix')}_${row.coNo || row.id}_${Date.now()}.pdf`;
  const ok = await zip(
    `/wms/devanning-order/${row.id}/pallet-labels/export?format=pdf&preview=false`,
    name
  );
  if (!ok) return;
  await getData();
  if (detailVisible.value && detailOrderId.value === row.id) {
    inboundReloadNonce.value += 1;
  }
}

/** 卡板贴多 PDF 打包：`GET .../pallet-labels/export?format=pdfzip` */
async function handlePalletLabelsPdfZip(row: Api.Wms.DevanningOrder) {
  const name = `${$t('page.wms.devanningOrder.palletLabelFilePrefix')}_${row.coNo || row.id}_${Date.now()}.zip`;
  const ok = await zip(`/wms/devanning-order/${row.id}/pallet-labels/export?format=pdfzip`, name);
  if (!ok) return;
  await getData();
  if (detailVisible.value && detailOrderId.value === row.id) {
    inboundReloadNonce.value += 1;
  }
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
    case 'exportCargoOrders':
      handleExportCargoOrdersForRow(row);
      break;
    case 'pallet-docx':
      handlePalletLabelsDocx(row);
      break;
    case 'pallet-zip':
      handlePalletLabelsZip(row);
      break;
    case 'pallet-pdf-preview':
      handlePalletLabelsPdfPreview(row);
      break;
    case 'pallet-pdf':
      handlePalletLabelsPdf(row);
      break;
    case 'pallet-pdfzip':
      handlePalletLabelsPdfZip(row);
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
      :can-batch-remove="hasAuth('wms:devanningOrder:remove')"
      @search="getDataByPage"
      @import="openImportStandard"
      @import-raw="openImportRawOrder"
      @import-order="openImportOrderSheet2"
      @create="openCreate"
      @batch-delete="handleBatchDeleteRequest"
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
        <div class="shrink-0">
          <NSpace class="flex-wrap" align="center" :size="8">
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
        </div>
        <div class="min-h-0 flex flex-1 basis-0 flex-col overflow-hidden">
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
            class="devanning-order-table h-full min-h-280px sm:min-h-0"
            @update:sorter="handleUpdateSorter"
          />
        </div>
      </div>
    </NCard>

    <DevanningOrderImportModal v-model:visible="importVisible" :variant="importVariant" @submitted="onImportSubmitted" />
    <DevanningOrderOperateDrawer v-model:visible="createVisible" @submitted="onCreateSubmitted" />
    <DevanningOrderRemarkModal
      v-model:visible="remarkModalVisible"
      :order-id="remarkOrderId"
      :initial-remark="remarkInitial"
      @submitted="getData"
    />
    <DevanningOrderAttachmentsModal
      v-model:visible="attachmentsVisible"
      :order-id="attachmentsOrder?.id ?? null"
      :co-no="attachmentsOrder?.coNo ?? null"
      :attachment-oss-ids="attachmentsOrder?.attachmentOssIds ?? null"
    />
    <DevanningOrderDetailDrawer
      v-model:visible="detailVisible"
      :order-id="detailOrderId"
      :inbound-reload-nonce="inboundReloadNonce"
      @exported="onDetailExportSuccess"
      @updated="onDetailUpdated"
    />
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

:deep(.devanning-order-table .n-data-table-th:not(:first-child)),
:deep(.devanning-order-table .n-data-table-td:not(:first-child)) {
  text-align: left !important;
}

/** 复选框列：与右侧竖线留出间距，避免贴边 */
:deep(.devanning-order-table .n-data-table-th:first-child),
:deep(.devanning-order-table .n-data-table-td:first-child) {
  padding-left: 12px;
  padding-right: 14px;
  text-align: center !important;
  vertical-align: middle;
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
