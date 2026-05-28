<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import {
  NButton,
  NCard,
  NDescriptions,
  NDescriptionsItem,
  NEmpty,
  NInputNumber,
  NModal,
  NSelect,
  NSpin,
  NTooltip
} from 'naive-ui';
import DictTag from '@/components/custom/dict-tag.vue';
import { WMS_DICT_DELIVERY_TYPE } from '@/constants/wms-devanning';
import { fetchGetWarehouseAreaList } from '@/service/api/wms/warehouse-area';
import { fetchGetWarehouseLocationList } from '@/service/api/wms/location';
import type { WmsPreLocationAllocation } from '@/utils/wms-devanning-pre-location';
import { $t } from '@/locales';

defineOptions({
  name: 'DevanningOrderPreLocationMapPickerModal'
});

const visible = defineModel<boolean>('visible', { default: false });

const props = withDefaults(
  defineProps<{
    /** 与编辑预库位主弹窗一致，用于顶部「入库计划概要」 */
    plan?: Api.Wms.DevanningInboundPlan | null;
    /** 仅选一条预分配（库存数据迁库）：点击其它格改为选新格并弹板数 */
    singlePreLocationPick?: boolean;
    /** 打开「填写该库位板数」时的默认板数（不传则用 1） */
    pickPalletInitialCount?: number | null;
    /** 库存迁库：顶部展示订单号 / 当前库位 / 当前板数 */
    inventoryContextBanner?: {
      orderNo: string;
      currentLocation: string;
      palletCount: string;
    } | null;
  }>(),
  {
    plan: null,
    singlePreLocationPick: false,
    pickPalletInitialCount: null,
    inventoryContextBanner: null
  }
);

const emit = defineEmits<{
  confirm: [rows: WmsPreLocationAllocation[]];
}>();

const cargoSummaryText = computed(() => {
  const p = props.plan;
  if (!p) return '—';
  const so = String(p.systemSoNo ?? '').trim();
  const sc = String(p.shipmentCode ?? '').trim();
  const bits: string[] = [];
  if (so) bits.push(`${$t('page.wms.devanningOrder.inboundPlan.systemSoNo')}：${so}`);
  if (sc) bits.push(`${$t('page.wms.devanningOrder.inboundPlan.shipmentCode')}：${sc}`);
  return bits.length ? bits.join(' · ') : '—';
});

function displayDash(v: unknown) {
  if (v == null || v === '') return '—';
  if (typeof v === 'number' && Number.isFinite(v)) return String(v);
  const s = String(v).trim();
  return s || '—';
}

const loading = ref(false);
const warehouseAreaNameOrder = ref<string[]>([]);
const locations = ref<Api.Wms.WarehouseLocation[]>([]);
/** 空字符串 = 全库 */
const selectedZoneCode = ref('');

/** 选中顺序保留；同库位不重复出现 */
const picked = ref<WmsPreLocationAllocation[]>([]);

/** 点击未选库位时先弹出填写板数，确认后加入已选 */
const pickPalletModalVisible = ref(false);
const pickPalletTarget = ref<Api.Wms.WarehouseLocation | null>(null);
const pickPalletDraft = ref<number | null>(1);

const mapLocTooltipThemeOverrides = {
  padding: '0px',
  borderRadius: '8px',
  color: '#171717',
  textColor: '#ffffff',
  boxShadow: '0 12px 28px rgba(0, 0, 0, 0.38)'
};

const MAP_SCALE_MIN = 0.42;
const MAP_SCALE_MAX = 1.05;
const mapScale = ref(0.52);

const cellMinWidthPx = computed(() => Math.max(52, Math.round(88 * mapScale.value)));
const cellMinHeightPx = computed(() => Math.max(40, Math.round(68 * mapScale.value)));
const isCompactCellView = computed(() => mapScale.value <= 0.52);

function utilizationRatioPercent(loc: Api.Wms.WarehouseLocation): number | null {
  const cap = loc.capacity;
  const cur = loc.currentStock ?? 0;
  if (cap == null || cap <= 0) return null;
  return Math.min(100, (cur / cap) * 100);
}

function occupancyBgStyle(loc: Api.Wms.WarehouseLocation): Record<string, string> {
  const cap = loc.capacity;
  const cur = loc.currentStock ?? 0;
  if (cap == null || cap <= 0) {
    return {
      backgroundColor: 'rgba(148, 163, 184, 0.22)',
      borderColor: 'rgba(100, 116, 139, 0.45)'
    };
  }
  const pct = utilizationRatioPercent(loc)!;
  if (cur <= 0 || pct <= 0) {
    return {
      backgroundColor: 'rgba(34, 197, 94, 0.34)',
      borderColor: 'rgba(22, 163, 74, 0.58)'
    };
  }
  if (pct < 50) {
    return {
      backgroundColor: 'rgba(56, 189, 248, 0.38)',
      borderColor: 'rgba(14, 165, 233, 0.58)'
    };
  }
  if (pct < 80) {
    return {
      backgroundColor: 'rgba(250, 204, 21, 0.42)',
      borderColor: 'rgba(202, 138, 4, 0.62)'
    };
  }
  if (pct < 95) {
    return {
      backgroundColor: 'rgba(249, 115, 22, 0.4)',
      borderColor: 'rgba(234, 88, 12, 0.62)'
    };
  }
  return {
    backgroundColor: 'rgba(239, 68, 68, 0.42)',
    borderColor: 'rgba(220, 38, 38, 0.68)'
  };
}

function compareLocationCode(a: Api.Wms.WarehouseLocation, b: Api.Wms.WarehouseLocation) {
  const ca = String(a.locationCode ?? '');
  const cb = String(b.locationCode ?? '');
  return ca.localeCompare(cb, 'zh-CN', { numeric: true, sensitivity: 'base' });
}

const flatZoneSections = computed(() => {
  const list = locations.value;
  const byZone = new Map<string, Api.Wms.WarehouseLocation[]>();
  for (const loc of list) {
    const z = String(loc.zoneCode ?? '').trim() || '—';
    if (!byZone.has(z)) byZone.set(z, []);
    byZone.get(z)!.push(loc);
  }
  for (const arr of byZone.values()) {
    arr.sort(compareLocationCode);
  }

  const order = warehouseAreaNameOrder.value.length
    ? warehouseAreaNameOrder.value.slice()
    : [...byZone.keys()].sort((a, b) => a.localeCompare(b, 'zh-CN'));

  const seen = new Set<string>();
  const sections: { zoneKey: string; title: string; items: Api.Wms.WarehouseLocation[] }[] = [];

  for (const name of order) {
    const items = byZone.get(name);
    if (items?.length) {
      sections.push({ zoneKey: name, title: name, items });
      seen.add(name);
    }
  }
  for (const k of byZone.keys()) {
    if (!seen.has(k) && byZone.get(k)!.length) {
      sections.push({ zoneKey: k, title: k, items: byZone.get(k)! });
    }
  }
  return sections;
});

const pickedCodes = computed(() => new Set(picked.value.map(p => p.locationCode)));

const summaryLine = computed(() => {
  if (!picked.value.length) {
    return $t('page.wms.devanningOrder.inboundPlan.preLocationPickEmpty');
  }
  const parts = picked.value.map(p =>
    $t('page.wms.devanningOrder.inboundPlan.preLocationPickSummarySegment', {
      location: p.locationCode,
      count: p.palletCount
    })
  );
  return `${$t('page.wms.devanningOrder.inboundPlan.preLocationPickSummaryPrefix')}${parts.join('，')}`;
});

const zoneFilterOptions = computed(() => {
  const opts: { label: string; value: string }[] = [
    { label: $t('page.wms.warehouseInventoryMap.zoneAll'), value: '' }
  ];
  for (const z of warehouseAreaNameOrder.value) {
    if (z) opts.push({ label: z, value: z });
  }
  return opts;
});

function formatRemainingDisplay(loc: Api.Wms.WarehouseLocation): string {
  const v = loc.remainingCapacity;
  if (v == null || Number.isNaN(Number(v))) return '—';
  return String(v);
}

async function loadWarehouseAreaNameOrder() {
  const { data, error } = await fetchGetWarehouseAreaList({
    pageNum: 1,
    pageSize: 3000,
    orderByColumn: 'areaName',
    isAsc: 'asc'
  });
  if (error || !data?.rows?.length) {
    warehouseAreaNameOrder.value = [];
    return;
  }
  warehouseAreaNameOrder.value = data.rows.map(r => String(r.areaName ?? '').trim()).filter(Boolean);
}

async function loadLocations() {
  loading.value = true;
  try {
    const { data, error } = await fetchGetWarehouseLocationList({
      pageNum: 1,
      pageSize: 5000,
      zoneCode: selectedZoneCode.value.trim() || undefined,
      locationKeyword: null,
      keyword: null,
      status: '0',
      orderByColumn: 'locationCode',
      isAsc: 'asc'
    });
    if (error || !data?.rows) {
      locations.value = [];
      return;
    }
    locations.value = data.rows;
  } finally {
    loading.value = false;
  }
}

function defaultPickPalletDraftValue() {
  const raw = props.pickPalletInitialCount;
  if (raw == null || Number.isNaN(Number(raw))) return 1;
  return Math.max(0, Math.floor(Number(raw)));
}

function togglePick(loc: Api.Wms.WarehouseLocation) {
  const code = String(loc.locationCode ?? '').trim();
  if (!code) return;
  if (props.singlePreLocationPick) {
    const cur = picked.value[0];
    if (cur?.locationCode === code) {
      picked.value = [];
      return;
    }
    pickPalletTarget.value = loc;
    pickPalletDraft.value = defaultPickPalletDraftValue();
    pickPalletModalVisible.value = true;
    return;
  }
  const i = picked.value.findIndex(p => p.locationCode === code);
  if (i >= 0) {
    picked.value.splice(i, 1);
    picked.value = [...picked.value];
    return;
  }
  pickPalletTarget.value = loc;
  pickPalletDraft.value = defaultPickPalletDraftValue();
  pickPalletModalVisible.value = true;
}

function cancelPickPalletModal() {
  pickPalletModalVisible.value = false;
  pickPalletTarget.value = null;
}

function confirmPickPalletModal() {
  const loc = pickPalletTarget.value;
  if (!loc) {
    cancelPickPalletModal();
    return;
  }
  const code = String(loc.locationCode ?? '').trim();
  if (!code) {
    cancelPickPalletModal();
    return;
  }
  const raw = pickPalletDraft.value;
  const n =
    raw == null || Number.isNaN(Number(raw)) ? 0 : Math.max(0, Math.floor(Number(raw)));
  const zone = String(loc.zoneCode ?? '').trim() || undefined;
  const row: WmsPreLocationAllocation = { locationCode: code, palletCount: n, zoneCode: zone };
  if (props.singlePreLocationPick) {
    picked.value = [row];
  } else {
    picked.value = [...picked.value, row];
  }
  cancelPickPalletModal();
}

function removePicked(idx: number) {
  picked.value.splice(idx, 1);
  picked.value = [...picked.value];
}

function updatePallet(idx: number, v: number | null) {
  const n = v == null || Number.isNaN(Number(v)) ? 0 : Math.max(0, Math.floor(Number(v)));
  const row = picked.value[idx];
  if (!row) return;
  picked.value.splice(idx, 1, { ...row, palletCount: n });
  picked.value = [...picked.value];
}

function resetState() {
  picked.value = [];
  selectedZoneCode.value = '';
  mapScale.value = 0.52;
  pickPalletModalVisible.value = false;
  pickPalletTarget.value = null;
  pickPalletDraft.value = 1;
}

watch(visible, v => {
  if (v) {
    resetState();
    void loadWarehouseAreaNameOrder().then(() => loadLocations());
  }
});

watch(selectedZoneCode, () => {
  if (visible.value) void loadLocations();
});

function handleConfirm() {
  const rows = picked.value
    .map(p => ({
      locationCode: String(p.locationCode).trim(),
      palletCount: Math.max(0, Math.floor(Number(p.palletCount) || 0))
    }))
    .filter(p => p.locationCode.length > 0);
  emit('confirm', rows);
  visible.value = false;
}

function zoomStep(delta: number) {
  const n = Math.round((mapScale.value + delta) * 100) / 100;
  mapScale.value = Math.min(MAP_SCALE_MAX, Math.max(MAP_SCALE_MIN, n));
}
</script>

<template>
  <NModal
    v-model:show="visible"
    preset="card"
    :title="$t('page.wms.devanningOrder.inboundPlan.preLocationPickFromMapTitle')"
    class="w-960px max-w-[96vw]"
    :bordered="false"
    :mask-closable="false"
  >
    <div
      class="flex max-h-[min(88vh,920px)] flex-col gap-10px overflow-y-auto overscroll-contain min-h-0 pr-2px"
    >
      <div
        v-if="inventoryContextBanner"
        class="shrink-0 rd-6px border border-gray-200 bg-gray-50/80 px-8px py-6px dark:border-gray-600 dark:bg-white/5"
      >
        <div class="mb-6px text-12px font-600 text-slate-800 dark:text-slate-100">
          {{ $t('page.wms.inventoryData.preLocationPickContextTitle') }}
        </div>
        <NDescriptions
          label-placement="left"
          bordered
          size="small"
          :column="2"
          class="pre-location-plan-summary bg-transparent text-12px"
        >
          <NDescriptionsItem :label="$t('page.wms.inventoryData.orderNo')">
            {{ inventoryContextBanner.orderNo }}
          </NDescriptionsItem>
          <NDescriptionsItem :label="$t('page.wms.inventoryData.currentLocationCode')">
            {{ inventoryContextBanner.currentLocation }}
          </NDescriptionsItem>
          <NDescriptionsItem :label="$t('page.wms.inventoryData.palletCount')" :span="2">
            {{ inventoryContextBanner.palletCount }}
          </NDescriptionsItem>
        </NDescriptions>
      </div>
      <div
        v-if="plan"
        class="shrink-0 rd-6px border border-gray-200 bg-gray-50/80 px-8px py-6px dark:border-gray-600 dark:bg-white/5"
      >
        <div class="mb-6px text-12px font-600 text-slate-800 dark:text-slate-100">
          {{ $t('page.wms.devanningOrder.inboundPlan.preLocationModalSummaryTitle') }}
        </div>
        <NDescriptions
          label-placement="left"
          bordered
          size="small"
          :column="2"
          class="pre-location-plan-summary bg-transparent text-12px"
        >
          <NDescriptionsItem :label="$t('page.wms.devanningOrder.inboundPlan.preLocationModalCargoDoc')" :span="2">
            <NTooltip placement="top-start" scrollable>
              <template #trigger>
                <span
                  class="block min-w-0 max-w-full cursor-default truncate text-12px leading-[18px] h-[18px]"
                >
                  {{ cargoSummaryText }}
                </span>
              </template>
              <div class="max-w-[min(520px,88vw)] break-words text-12px leading-snug">
                {{ cargoSummaryText }}
              </div>
            </NTooltip>
          </NDescriptionsItem>
          <NDescriptionsItem :label="$t('page.wms.devanningOrder.coNo')">
            {{ displayDash(plan.coNo) }}
          </NDescriptionsItem>
          <NDescriptionsItem :label="$t('page.wms.devanningOrder.inboundPlan.estimatedPalletCount')">
            {{ displayDash(plan.estimatedPalletCount) }}
          </NDescriptionsItem>
          <NDescriptionsItem :label="$t('page.wms.devanningOrder.inboundPlan.warehouseCode')">
            {{ displayDash(plan.warehouseCode) }}
          </NDescriptionsItem>
          <NDescriptionsItem :label="$t('page.wms.devanningOrder.inboundPlan.platform')">
            {{ displayDash(plan.platform) }}
          </NDescriptionsItem>
          <NDescriptionsItem :label="$t('page.wms.devanningOrder.inboundPlan.deliveryMethod')" :span="2">
            <DictTag
              v-if="plan.deliveryMethod != null && String(plan.deliveryMethod).trim() !== ''"
              size="small"
              :value="plan.deliveryMethod"
              :dict-code="WMS_DICT_DELIVERY_TYPE"
              immediate
            />
            <span v-else class="text-gray-400">—</span>
          </NDescriptionsItem>
        </NDescriptions>
      </div>

      <p class="shrink-0 text-12px text-gray-500 leading-snug">
        {{ $t('page.wms.devanningOrder.inboundPlan.preLocationPickFromMapHint') }}
      </p>

      <!-- 摘要 + 可改编板数列表合并为一块并 shrink-0，避免被下方 flex-1 平面图压扁不可见 -->
      <div
        class="shrink-0 rd-6px border border-gray-200 bg-gray-50 dark:border-gray-600 dark:bg-white/5"
      >
        <div
          class="border-b border-gray-200 px-10px py-8px text-12px leading-snug text-slate-800 dark:border-gray-600 dark:text-slate-100"
        >
          {{ summaryLine }}
        </div>
        <div v-if="picked.length" class="max-h-[min(260px,32vh)] overflow-y-auto px-10px py-8px flex flex-col gap-8px">
          <div class="text-12px text-gray-600 dark:text-gray-400">
            {{ $t('page.wms.devanningOrder.inboundPlan.preLocationPickSelectedEditableHint') }}
          </div>
          <div
            v-for="(row, idx) in picked"
            :key="`${row.locationCode}-${idx}`"
            class="flex flex-wrap items-center gap-8px rd-4px bg-white px-10px py-8px dark:bg-white/5"
          >
            <span class="min-w-100px font-600">{{ row.locationCode }}</span>
            <span class="text-12px text-gray-500">{{ $t('page.wms.devanningOrder.inboundPlan.preLocationPalletPlaceholder') }}</span>
            <NInputNumber
              class="w-120px"
              size="small"
              :value="row.palletCount"
              :min="0"
              :precision="0"
              @update:value="v => updatePallet(idx, v)"
            />
            <NButton size="tiny" quaternary type="error" @click="removePicked(idx)">
              {{ $t('common.delete') }}
            </NButton>
          </div>
        </div>
      </div>

      <div
        class="flex min-h-[min(380px,46vh)] shrink-0 flex-col gap-8px overflow-hidden sm:flex-row sm:min-h-[min(360px,44vh)]"
      >
        <div class="flex shrink-0 flex-col gap-8px sm:w-200px sm:shrink-0">
          <span class="text-12px text-gray-600 dark:text-gray-400">
            {{ $t('page.wms.devanningOrder.inboundPlan.preLocationPickZoneFilter') }}
          </span>
          <NSelect v-model:value="selectedZoneCode" :options="zoneFilterOptions" size="small" />
          <div class="flex flex-wrap items-center gap-6px">
            <span class="text-12px text-gray-600 dark:text-gray-400">
              {{ $t('page.wms.warehouseInventoryMap.mapScale') }}
            </span>
            <NButton size="tiny" quaternary @click="zoomStep(-0.05)">−</NButton>
            <span class="text-12px tabular-nums">{{ Math.round(mapScale * 100) }}%</span>
            <NButton size="tiny" quaternary @click="zoomStep(0.05)">+</NButton>
          </div>
        </div>

        <NCard
          :bordered="false"
          size="small"
          class="min-h-0 min-w-0 flex-1 overflow-hidden"
          content-class="!p-10px flex min-h-0 flex-1 flex-col overflow-hidden"
        >
          <NSpin :show="loading" class="min-h-200px flex flex-1 flex-col overflow-hidden">
            <div v-if="!loading && !locations.length" class="flex flex-1 items-center justify-center py-32px">
              <NEmpty :description="$t('page.wms.warehouseInventoryMap.noLocations')" />
            </div>
            <div
              v-else-if="flatZoneSections.length"
              class="min-h-0 flex-1 overflow-x-hidden overflow-y-auto overscroll-contain p-6px"
            >
              <div
                class="rd-10px border-2 border-solid border-slate-600 bg-slate-100/80 p-10px dark:border-slate-500 dark:bg-slate-900/60"
              >
                <div class="mb-10px flex flex-wrap gap-8px border-b border-slate-300/80 pb-8px text-12px dark:border-slate-600">
                  <span class="font-600 text-slate-700 dark:text-slate-200">
                    {{ $t('page.wms.warehouseInventoryMap.frameTitle') }}
                  </span>
                  <span class="text-slate-500">{{ $t('page.wms.devanningOrder.inboundPlan.preLocationPickClickToggle') }}</span>
                </div>
                <div class="flex flex-col gap-16px">
                  <section v-for="section in flatZoneSections" :key="section.zoneKey" class="min-w-0">
                    <div class="mb-8px text-14px font-700 text-slate-800 dark:text-slate-100">
                      {{ section.title }}
                    </div>
                    <div class="flex flex-wrap content-start gap-6px">
                      <NTooltip
                        v-for="loc in section.items"
                        :key="String(loc.id)"
                        trigger="hover"
                        placement="top-start"
                        :show-arrow="true"
                        :theme-overrides="mapLocTooltipThemeOverrides"
                      >
                        <template #trigger>
                          <div
                            class="flat-loc-cell flex shrink-0 cursor-pointer flex-col overflow-hidden rounded-8px border-2 transition-all select-none"
                            :class="
                              pickedCodes.has(String(loc.locationCode ?? '').trim())
                                ? 'border-primary ring-2 ring-primary/35'
                                : 'border-transparent'
                            "
                            :style="{
                              width: `${cellMinWidthPx}px`,
                              height: `${cellMinHeightPx}px`,
                              minHeight: `${cellMinHeightPx}px`,
                              ...occupancyBgStyle(loc)
                            }"
                            @click="togglePick(loc)"
                          >
                            <template v-if="isCompactCellView">
                              <div class="flex min-h-0 flex-1 flex-col items-center justify-center px-4px py-6px text-center">
                                <span class="truncate font-700 leading-tight text-slate-900 dark:text-slate-50 text-11px">
                                  {{ loc.locationCode || '—' }}
                                </span>
                              </div>
                            </template>
                            <template v-else>
                              <div class="flex h-full min-h-0 flex-col gap-4px overflow-hidden p-6px text-11px">
                                <div class="truncate text-center text-12px font-700 text-slate-900 dark:text-slate-100">
                                  {{ loc.locationCode || '—' }}
                                </div>
                                <div class="flex justify-between gap-6px border-b border-black/10 pb-4px dark:border-white/12">
                                  <span class="text-gray-600 dark:text-gray-400">
                                    {{ $t('page.wms.warehouseInventoryMap.cellRemainingAvailable') }}
                                  </span>
                                  <span class="truncate text-right font-600 tabular-nums">
                                    {{ formatRemainingDisplay(loc) }}
                                  </span>
                                </div>
                              </div>
                            </template>
                          </div>
                        </template>
                        <div class="max-w-280px px-10px py-8px text-12px text-white leading-snug">
                          <div class="mb-6px font-700">{{ loc.locationCode }}</div>
                          <div>{{ $t('page.wms.warehouseInventoryMap.cellRemainingAvailable') }} {{ formatRemainingDisplay(loc) }}</div>
                        </div>
                      </NTooltip>
                    </div>
                  </section>
                </div>
              </div>
            </div>
          </NSpin>
        </NCard>
      </div>

      <div class="shrink-0 flex justify-end gap-10px border-t border-gray-100 pt-10px dark:border-gray-700">
        <NButton @click="visible = false">{{ $t('common.cancel') }}</NButton>
        <NButton type="primary" @click="handleConfirm">{{ $t('common.confirm') }}</NButton>
      </div>
    </div>
  </NModal>

  <NModal
    v-model:show="pickPalletModalVisible"
    preset="card"
    :title="$t('page.wms.devanningOrder.inboundPlan.preLocationPickPalletTitle')"
    class="w-400px max-w-[92vw]"
    :bordered="false"
    :mask-closable="false"
    :z-index="3200"
    @close="cancelPickPalletModal"
  >
    <div v-if="pickPalletTarget" class="flex flex-col gap-10px">
      <div class="text-12px text-gray-600 dark:text-gray-400">
        {{ $t('page.wms.devanningOrder.inboundPlan.preLocationCodePlaceholder') }}：
        <span class="font-600 text-slate-900 dark:text-slate-100">{{ pickPalletTarget.locationCode || '—' }}</span>
      </div>
      <div class="text-12px text-gray-500 leading-snug">
        {{ $t('page.wms.devanningOrder.inboundPlan.preLocationPickPalletHint') }}
      </div>
      <div class="flex flex-wrap items-center gap-8px">
        <span class="text-12px shrink-0 text-gray-600 dark:text-gray-400">
          {{ $t('page.wms.devanningOrder.inboundPlan.preLocationPalletPlaceholder') }}
        </span>
        <NInputNumber
          v-model:value="pickPalletDraft"
          class="min-w-140px flex-1"
          :min="0"
          :precision="0"
        />
      </div>
      <div class="flex justify-end gap-10px pt-4px">
        <NButton @click="cancelPickPalletModal">{{ $t('common.cancel') }}</NButton>
        <NButton type="primary" @click="confirmPickPalletModal">{{ $t('common.confirm') }}</NButton>
      </div>
    </div>
  </NModal>
</template>

<style scoped lang="scss">
.pre-location-plan-summary :deep(table) {
  font-size: 12px;
}
.pre-location-plan-summary :deep(td),
.pre-location-plan-summary :deep(th) {
  padding-top: 4px;
  padding-bottom: 4px;
  line-height: 18px;
}
.pre-location-plan-summary :deep(.n-descriptions-table-content__content) {
  line-height: 18px;
}
</style>
