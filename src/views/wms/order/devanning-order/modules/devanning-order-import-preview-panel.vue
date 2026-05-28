<script setup lang="tsx">
import type { DataTableColumns, SelectOption } from 'naive-ui';
import { computed, h, onMounted, onUnmounted, ref, watch } from 'vue';
import { useWindowSize } from '@vueuse/core';
import { NCheckbox, NDataTable, NDescriptions, NDescriptionsItem, NInput, NSelect, NTag } from 'naive-ui';
import {
  devanningStatusI18nKey,
  resolveDevanningOrderStatus,
  WMS_DICT_DELIVERY_TYPE,
  WMS_DICT_DEVANNING_ROUND
} from '@/constants/wms-devanning';
import DictSelect from '@/components/custom/dict-select.vue';
import DictTag from '@/components/custom/dict-tag.vue';
import {
  useDevanningInboundPlanFields,
  WMS_INBOUND_ADDRESS_TYPE_COMMERCIAL,
  WMS_INBOUND_ADDRESS_TYPE_PRIVATE
} from '@/hooks/business/use-devanning-inbound-plan-fields';
import { useDict } from '@/hooks/business/dict';
import { useAppStore } from '@/store/modules/app';
import { $t } from '@/locales';

defineOptions({
  name: 'DevanningOrderImportPreviewPanel'
});

const props = defineProps<{
  items: Api.Wms.DevanningOrderImportPreviewItem[];
}>();

const appStore = useAppStore();
const { height: windowHeight } = useWindowSize();

const selectedPreviewId = defineModel<string | null>('selectedPreviewId', { default: null });

const selected = computed(() => props.items.find(i => i.previewId === selectedPreviewId.value) ?? null);

type PlanRow = Api.Wms.DevanningInboundPlanPreviewLine;

const { data: deliveryTypeDictData } = useDict(WMS_DICT_DELIVERY_TYPE, true);

const {
  platforms,
  loadPlatforms,
  platformSelectOptions,
  findPlatformByCodeOrName,
  platformResolvedByCode,
  warehouseOptionsForPlatformCode
} = useDevanningInboundPlanFields();

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

function platformDisplayLabel(raw: string | null | undefined) {
  const p = findPlatformByCodeOrName(raw);
  if (p) return `${p.platformName}（${p.platformCode}）`;
  const s = (raw ?? '').trim();
  return s || '—';
}

const warehouseInlinePreviewOptions = ref<SelectOption[]>([]);

function findDeliveryTypeEntry(code: string): Api.System.DictData | undefined {
  const c = code.trim();
  if (!c) return undefined;
  return deliveryTypeDictData.value.find(d => String(d.dictValue ?? '').trim() === c);
}

const editCell = ref<string | null>(null);

const editableCellReadonlyCls =
  'flex min-h-30px max-w-full min-w-0 cursor-text items-center justify-start rd-4px px-2px op-transition hover:bg-[var(--n-merged-hover-color)]';

function cellKey(rowKey: string, field: string) {
  return `${rowKey}__${field}`;
}

function isInlineOverlayTarget(t: EventTarget | null) {
  if (!(t instanceof Element)) return false;
  return !!(t.closest('[data-import-preview-edit="1"]') || t.closest('.n-base-select-menu'));
}

function closeEditFromOutside(ev: MouseEvent) {
  if (!editCell.value) return;
  if (isInlineOverlayTarget(ev.target)) return;
  editCell.value = null;
}

onMounted(() => {
  document.addEventListener('mousedown', closeEditFromOutside);
  void loadPlatforms();
});

onUnmounted(() => {
  document.removeEventListener('mousedown', closeEditFromOutside);
});

/** 就地修改当前选中预览项的入库计划行（确认导入时一并提交） */
function applyPreviewPatch(rowIndex: number, patch: Partial<PlanRow>) {
  const sel = selected.value;
  if (!sel?.order.inboundPlans?.length) return;
  const row = sel.order.inboundPlans[rowIndex];
  if (!row) return;
  if (Object.prototype.hasOwnProperty.call(patch, 'platform')) {
    const next = patch.platform;
    if (String(row.platform ?? '').trim() !== String(next ?? '').trim()) {
      patch.warehouseCode = null;
    }
  }
  Object.assign(row, patch);
  if (Object.prototype.hasOwnProperty.call(patch, 'hold')) {
    if (patch.hold) {
      row.deliveryMethod = 'hold';
    } else if (String(row.deliveryMethod ?? '').trim() === 'hold') {
      row.deliveryMethod = null;
    }
  }
  if (Object.prototype.hasOwnProperty.call(patch, 'deliveryMethod')) {
    const dm = patch.deliveryMethod != null ? String(patch.deliveryMethod).trim() : '';
    if (dm && dm !== 'hold') row.hold = false;
    if (dm === 'hold') row.hold = true;
  }
}

const inboundColumns = computed(() => {
  void deliveryTypeDictData.value.length;
  void editCell.value;
  void platforms.value;
  void warehouseInlinePreviewOptions.value;
  void addressTypeOptions.value;
  return [
    {
      key: 'systemSoNo',
      title: $t('page.wms.devanningOrder.inboundPlan.systemSoNo'),
      minWidth: 110,
      resizable: true,
      ellipsis: { tooltip: true }
    },
    {
      key: 'shipmentCode',
      title: $t('page.wms.devanningOrder.inboundPlan.shipmentCode'),
      minWidth: 110,
      resizable: true,
      ellipsis: { tooltip: true }
    },
    {
      key: 'platform',
      title: $t('page.wms.devanningOrder.inboundPlan.platform'),
      width: 100,
      resizable: true,
      render: (row: PlanRow & { __importPreviewRowKey?: string }, rowIndex: number) => {
        const rk = row.__importPreviewRowKey ?? `${selected.value?.previewId}-${rowIndex}`;
        const k = cellKey(rk, 'platform');
        const editing = editCell.value === k;
        if (editing) {
          return (
            <div data-import-preview-edit="1" class="min-w-160px max-w-full" onMousedown={(e: MouseEvent) => e.stopPropagation()}>
              <NSelect
                size="small"
                filterable
                clearable
                class="w-full"
                placeholder={$t('page.wms.devanningOrder.inboundPlan.platform')}
                options={platformOptionsWithFallback(row.platform)}
                value={row.platform ?? null}
                onUpdate:value={(v: string | null) => {
                  applyPreviewPatch(rowIndex, { platform: v ?? null });
                  editCell.value = null;
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
            <span class="truncate text-13px">{platformDisplayLabel(row.platform)}</span>
          </div>
        );
      }
    },
    {
      key: 'warehouseCode',
      title: $t('page.wms.devanningOrder.inboundPlan.warehouseCode'),
      width: 108,
      resizable: true,
      render: (row: PlanRow & { __importPreviewRowKey?: string }, rowIndex: number) => {
        const rk = row.__importPreviewRowKey ?? `${selected.value?.previewId}-${rowIndex}`;
        const k = cellKey(rk, 'warehouseCode');
        const editing = editCell.value === k;
        const useWarehouseSelect = platformResolvedByCode(row.platform);
        if (editing) {
          if (useWarehouseSelect) {
            return (
              <div data-import-preview-edit="1" class="min-w-160px max-w-full" onMousedown={(e: MouseEvent) => e.stopPropagation()}>
                <NSelect
                  size="small"
                  filterable
                  clearable
                  class="w-full font-mono"
                  placeholder={$t('page.wms.devanningOrder.inboundPlan.warehouseCode')}
                  options={warehouseInlinePreviewOptions.value}
                  value={row.warehouseCode ?? null}
                  onUpdate:value={(v: string | null) => {
                    applyPreviewPatch(rowIndex, { warehouseCode: v ?? null });
                    editCell.value = null;
                  }}
                />
              </div>
            );
          }
          return (
            <div data-import-preview-edit="1" class="min-w-88px" onMousedown={(e: MouseEvent) => e.stopPropagation()}>
              <NInput
                size="small"
                class="w-full font-mono"
                value={row.warehouseCode ?? ''}
                onUpdateValue={(v: string) => applyPreviewPatch(rowIndex, { warehouseCode: v || null })}
                onBlur={() => {
                  editCell.value = null;
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
            <span class="truncate text-13px font-mono">{row.warehouseCode?.trim() ? row.warehouseCode : '—'}</span>
          </div>
        );
      }
    },
    {
      key: 'addressType',
      title: $t('page.wms.devanningOrder.inboundPlan.addressType'),
      width: 100,
      resizable: true,
      render: (row: PlanRow & { __importPreviewRowKey?: string }, rowIndex: number) => {
        const rk = row.__importPreviewRowKey ?? `${selected.value?.previewId}-${rowIndex}`;
        const k = cellKey(rk, 'addressType');
        const editing = editCell.value === k;
        if (editing) {
          return (
            <div data-import-preview-edit="1" class="min-w-140px max-w-full" onMousedown={(e: MouseEvent) => e.stopPropagation()}>
              <NSelect
                size="small"
                clearable
                class="w-full"
                placeholder={$t('page.wms.devanningOrder.inboundPlan.addressType')}
                options={addressTypeOptions.value}
                value={row.addressType ?? null}
                onUpdate:value={(v: string | null) => {
                  applyPreviewPatch(rowIndex, { addressType: v ?? null });
                  editCell.value = null;
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
            <span class="truncate text-13px">{labelAddressType(row.addressType)}</span>
          </div>
        );
      }
    },
    {
      key: 'deliveryMethod',
      title: $t('page.wms.devanningOrder.inboundPlan.deliveryMethod'),
      width: 130,
      resizable: true,
      render: (row: PlanRow & { __importPreviewRowKey?: string }, rowIndex: number) => {
        const rk = row.__importPreviewRowKey ?? `${selected.value?.previewId}-${rowIndex}`;
        const k = cellKey(rk, 'deliveryMethod');
        const editing = editCell.value === k;
        if (editing) {
          return (
            <div
              data-import-preview-edit="1"
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
                  applyPreviewPatch(rowIndex, {
                    deliveryMethod: raw != null && String(raw).trim() !== '' ? String(raw) : null
                  });
                  editCell.value = null;
                }}
              />
            </div>
          );
        }
        const code = row.deliveryMethod?.trim();
        if (!code) {
          return (
            <div
              class={editableCellReadonlyCls}
              title={$t('page.wms.devanningOrder.doubleClickToEdit')}
              onDblclick={(e: MouseEvent) => {
                e.stopPropagation();
                editCell.value = k;
              }}
            >
              —
            </div>
          );
        }
        const entry = findDeliveryTypeEntry(code);
        const inner =
          entry != null
            ? h(DictTag, { dictData: entry, dictCode: WMS_DICT_DELIVERY_TYPE, immediate: true })
            : (() => {
                const lbl = row.deliveryMethodLabel?.trim();
                if (lbl) {
                  return h('span', { title: code }, [h(NTag, { size: 'small', type: 'default' }, { default: () => lbl })]);
                }
                return h('span', { title: code }, [h(NTag, { size: 'small', type: 'default' }, { default: () => code })]);
              })();
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
      resizable: true,
      render: (row: PlanRow & { __importPreviewRowKey?: string }, rowIndex: number) => {
        const rk = row.__importPreviewRowKey ?? `${selected.value?.previewId}-${rowIndex}`;
        const k = cellKey(rk, 'hold');
        const editing = editCell.value === k;
        if (editing) {
          return (
            <div data-import-preview-edit="1" onMousedown={(e: MouseEvent) => e.stopPropagation()}>
              <NCheckbox
                checked={Boolean(row.hold)}
                onUpdate:checked={(v: boolean) => {
                  applyPreviewPatch(rowIndex, { hold: v });
                  editCell.value = null;
                }}
              >
                HOLD
              </NCheckbox>
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
            {row.hold ? h(NTag, { size: 'small', type: 'warning' }, { default: () => 'HOLD' }) : '—'}
          </div>
        );
      }
    },
    {
      key: 'totalPieces',
      title: $t('page.wms.devanningOrder.inboundPlan.totalPieces'),
      width: 80,
      resizable: true
    },
    {
      key: 'weight',
      title: $t('page.wms.devanningOrder.inboundPlan.weight'),
      width: 72,
      resizable: true
    },
    {
      key: 'volumeCbm',
      title: $t('page.wms.devanningOrder.inboundPlan.volumeCbm'),
      width: 88,
      resizable: true
    },
    {
      key: 'estimatedPalletCount',
      title: $t('page.wms.devanningOrder.inboundPlan.estimatedPalletCount'),
      width: 96,
      resizable: true,
      render: (row: PlanRow) => {
        const v = row.estimatedPalletCount;
        return v != null && !Number.isNaN(Number(v)) ? String(v) : '—';
      }
    },
    {
      key: 'remark',
      title: $t('page.wms.devanningOrder.inboundPlan.lineRemark'),
      minWidth: 96,
      resizable: true,
      ellipsis: { tooltip: true }
    }
  ];
});

const scrollX = computed(() =>
  inboundColumns.value.reduce(
    (acc, c: { width?: number; minWidth?: number }) => acc + Number(c.width ?? c.minWidth ?? 100),
    0
  )
);

/** 带稳定行键，满足 DataTable row-key 仅接收行对象 */
const inboundRowsForTable = computed(() => {
  const pid = selected.value?.previewId ?? 'p';
  return (selected.value?.order.inboundPlans ?? []).map((r, i) => ({
    ...r,
    __importPreviewRowKey: `${pid}-${i}`
  }));
});

watch(editCell, async k => {
  await loadPlatforms();
  if (!k?.endsWith('__warehouseCode')) {
    warehouseInlinePreviewOptions.value = [];
    return;
  }
  const rk = k.slice(0, -'__warehouseCode'.length);
  const rows = inboundRowsForTable.value;
  const row = rows.find(r => r.__importPreviewRowKey === rk);
  warehouseInlinePreviewOptions.value = row ? await warehouseOptionsForPlatformCode(row.platform) : [];
});

function inboundRowKey(row: PlanRow & { __importPreviewRowKey?: string }) {
  return row.__importPreviewRowKey ?? `${selected.value?.previewId ?? 'p'}-0`;
}

watch(selectedPreviewId, () => {
  editCell.value = null;
});

/** 弹窗内宽度充足时用 3 列压缩基础信息高度；窄屏降为 2 / 1 */
const basicDescColumn = computed(() => {
  if (appStore.isMobile) return 1;
  if (typeof window !== 'undefined' && window.innerWidth < 900) return 2;
  return 3;
});

/**
 * 禁止使用 flex-height：在 NModal 内父链高度常为 auto，flex-height 会得到表体高度 0（行「消失」）。
 * 使用 max-height（像素）由 Naive 在表体内滚动，随窗口变化。
 */
const inboundTableMaxHeight = computed(() => {
  const h = windowHeight.value;
  if (h < 560) return Math.max(200, Math.round(h * 0.38));
  return Math.max(280, Math.min(680, Math.round(h * 0.48)));
});

/** 右侧仅展示柜号（不再展示来源文件名），列窄侧栏以让左侧主区更宽 */
const previewListColumns = computed<DataTableColumns<Api.Wms.DevanningOrderImportPreviewItem>>(() => [
  {
    key: 'coNo',
    title: $t('page.wms.devanningOrder.coNo'),
    minWidth: 108,
    width: 108,
    resizable: true,
    ellipsis: { tooltip: true },
    render: row => row.order?.coNo || $t('page.wms.devanningOrder.importPreviewNoCoNo')
  }
]);
</script>

<template>
  <!-- 左侧：紧凑基础信息 + 入库表（max-height 滚动，避免 flex-height 在 Modal 内高度为 0） -->
  <div class="flex h-full min-h-[min(56vh,520px)] gap-12px overflow-hidden lg:gap-16px">
    <!-- 左侧：基础 + 入库计划（按需求：点击右侧柜号后此处展示） -->
    <div class="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden border border-[var(--n-border-color)] rd-8px">
      <template v-if="selected">
        <!-- 基础信息：多列并排，减少纵向占位 -->
        <div class="shrink-0 border-b border-[var(--n-border-color)] px-12px py-10px">
          <div class="mb-8px text-13px font-600">
            {{ $t('page.wms.devanningOrder.detailTabBasic') }}
          </div>
          <NDescriptions
            label-placement="left"
            :column="basicDescColumn"
            bordered
            size="small"
            class="preview-basic-desc"
          >
            <NDescriptionsItem :label="$t('page.wms.devanningOrder.coNo')">
              {{ selected.order.coNo || '—' }}
            </NDescriptionsItem>
            <NDescriptionsItem :label="$t('page.wms.devanningOrder.blNo')">
              {{ selected.order.blNo || '—' }}
            </NDescriptionsItem>
            <NDescriptionsItem :label="$t('page.common.createTime')">
              {{ selected.order.createTime || selected.order.orderDate || '—' }}
            </NDescriptionsItem>
            <NDescriptionsItem :label="$t('page.wms.devanningOrder.expectedDevanningTime')">
              {{
                selected.order.expectedDevanningTime ? String(selected.order.expectedDevanningTime).slice(0, 10) : '—'
              }}
            </NDescriptionsItem>
            <NDescriptionsItem :label="$t('page.wms.devanningOrder.devanningRound')">
              <DictTag
                v-if="selected.order.devanningRound"
                :dict-code="WMS_DICT_DEVANNING_ROUND"
                :value="selected.order.devanningRound"
                immediate
              />
              <template v-else>—</template>
            </NDescriptionsItem>
            <NDescriptionsItem :label="$t('page.wms.devanningOrder.orderLevel')">
              {{ selected.order.orderLevel ?? '—' }}
            </NDescriptionsItem>
            <NDescriptionsItem :label="$t('page.wms.devanningOrder.devanningStatus')">
              {{
                (() => {
                  const key = devanningStatusI18nKey(resolveDevanningOrderStatus(selected.order));
                  return key ? $t(key) : '—';
                })()
              }}
            </NDescriptionsItem>
            <NDescriptionsItem :label="$t('page.wms.devanningOrder.inboundWarehouse')">
              {{ selected.order.inboundWarehouse || '—' }}
            </NDescriptionsItem>
            <NDescriptionsItem :label="$t('page.wms.devanningOrder.devanningDock')">
              {{ selected.order.devanningDock || '—' }}
            </NDescriptionsItem>
            <NDescriptionsItem :label="$t('page.wms.devanningOrder.cargoQty')">
              {{ selected.order.cargoQty ?? '—' }}
            </NDescriptionsItem>
            <NDescriptionsItem :label="$t('page.wms.devanningOrder.cargoWeight')">
              {{ selected.order.cargoWeight ?? '—' }}
            </NDescriptionsItem>
            <NDescriptionsItem :label="$t('page.wms.devanningOrder.remarkColumn')">
              {{ selected.order.remark || '—' }}
            </NDescriptionsItem>
          </NDescriptions>
        </div>

        <!-- 入库计划表格：占据左侧剩余高度 -->
        <div class="flex min-h-0 flex-1 flex-col px-12px pb-12px pt-10px">
          <div class="mb-6px shrink-0 text-13px font-600">
            {{ $t('page.wms.devanningOrder.detailTabInbound') }}
          </div>
          <div class="mb-8px shrink-0 text-11px leading-snug text-gray-500 dark:text-gray-400">
            {{ $t('page.wms.devanningOrder.importPreviewInboundEditHint') }}
          </div>
          <div class="min-h-[200px] flex-1 overflow-auto">
            <NDataTable
              size="small"
              :columns="inboundColumns"
              :data="inboundRowsForTable"
              :row-key="inboundRowKey"
              :scroll-x="scrollX"
              :max-height="inboundTableMaxHeight"
              striped
              class="import-preview-inbound-table"
            />
          </div>
        </div>
      </template>
      <div
        v-else
        class="flex min-h-[200px] flex-1 items-center justify-center text-13px text-gray-400 dark:text-gray-500"
      >
        {{ $t('page.wms.devanningOrder.importPreviewPickCoNo') }}
      </div>
    </div>

    <!-- 右侧：仅柜号列表（窄栏） -->
    <div
      class="flex h-full min-h-0 w-168px shrink-0 flex-col overflow-hidden border border-[var(--n-border-color)] rd-8px bg-gray-50/80 dark:bg-white/5"
    >
      <div
        class="shrink-0 border-b border-[var(--n-border-color)] px-10px py-8px text-13px font-600 text-gray-700 dark:text-gray-200"
      >
        {{ $t('page.wms.devanningOrder.coNo') }}
      </div>
      <div class="min-h-0 flex-1 overflow-hidden p-8px">
        <NDataTable
          size="small"
          :columns="previewListColumns"
          :data="items"
          :row-key="row => row.previewId"
          :max-height="inboundTableMaxHeight"
          striped
          :row-props="
            row => ({
              style: 'cursor:pointer;',
              class: selectedPreviewId === row.previewId ? 'import-preview-selected-row' : '',
              onClick: () => {
                selectedPreviewId = row.previewId;
              }
            })
          "
        />
      </div>
    </div>
  </div>
</template>

<style scoped>
.preview-basic-desc :deep(.n-descriptions-table-content__content) {
  word-break: break-word;
}

/* 压缩基础信息区行高，给下方入库表让出更多可视高度 */
.preview-basic-desc :deep(.n-descriptions-table-content__label),
.preview-basic-desc :deep(.n-descriptions-table-content__content) {
  padding-top: 5px !important;
  padding-bottom: 5px !important;
  font-size: 12px;
  line-height: 1.35;
}

:deep(.import-preview-selected-row td) {
  background: color-mix(in srgb, var(--n-primary-color) 14%, transparent) !important;
}

</style>
