<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue';
import type { SelectOption } from 'naive-ui';
import {
  NButton,
  NCard,
  NCollapse,
  NCollapseItem,
  NEmpty,
  NInput,
  NPagination,
  NSelect,
  NSlider,
  NSpin,
  NSwitch,
  NTooltip
} from 'naive-ui';
import { watchDebounced } from '@vueuse/core';
import { fetchGetWarehouseAreaList, fetchGetWarehouseAreaStockStatistics } from '@/service/api/wms/warehouse-area';
import { fetchGetWarehouseLocationList } from '@/service/api/wms/location';
import { fetchGetPlatformList } from '@/service/api/basic/platform-warehouse';
import { WMS_DICT_DELIVERY_TYPE } from '@/constants/wms-devanning';
import { useDict } from '@/hooks/business/dict';
import { $t } from '@/locales';
import DictSelect from '@/components/custom/dict-select.vue';
import DictTag from '@/components/custom/dict-tag.vue';
import SvgIcon from '@/components/custom/svg-icon.vue';
import WarehouseLocationDetailDrawer from '@/views/wms/inventory/location/modules/location-detail-drawer.vue';
import { useAppStore } from '@/store/modules/app';

defineOptions({
  name: 'WarehouseInventoryMap'
});

const STORAGE_HIDDEN_ZONES = 'wms-warehouse-inventory-map:hidden-zones';
const STORAGE_AREA_SIDEBAR_EXPANDED = 'wms-warehouse-inventory-map:area-sidebar-expanded';

useDict('wms_warehouse_area_type', true);
useDict('wms_storage_method', true);
useDict(WMS_DICT_DELIVERY_TYPE, true);

const appStore = useAppStore();

const loading = ref(false);
const areasLoading = ref(false);

/** 全库库区名称顺序（用于 A→B→C 分段；一次拉全量参与排序） */
const warehouseAreaNameOrder = ref<string[]>([]);

const areas = ref<Api.Wms.WarehouseArea[]>([]);
const areaSearchKeyword = ref('');
const areaPageNum = ref(1);
const areaPageSize = ref(12);
const areaTotal = ref(0);

/** null = 全部库区 */
const selectedAreaId = ref<CommonType.IdType | null>(null);
const selectedZoneCode = ref<string | null>(null);

/** 在「全部库区」视图下，被用户关闭、不显示在平面图上的库区名称（与 zoneCode / areaName 一致） */
const zonesHiddenFromMap = ref<string[]>([]);

const locations = ref<Api.Wms.WarehouseLocation[]>([]);

const areaStockStatistics = ref<Api.Wms.WarehouseAreaStockStatistics | null>(null);

/** 平面图：按库存仓库代码（含空库位） */
const inventoryWarehouseCodeSearch = ref('');
/** 上架规则筛选（须选派送方式后才启用；与上架配置页字段语义对齐） */
const putawayDispatchMethod = ref<string | null>(null);
const putawayPlatformId = ref<CommonType.IdType | null>(null);
const putawayPlatformWarehouseCode = ref('');

const platforms = ref<Api.Basic.Platform[]>([]);
const platformOptions = computed<SelectOption[]>(() =>
  platforms.value.map(p => ({
    label: `${p.platformName} (${p.platformCode})`,
    value: p.id
  }))
);

/** 左侧库区面板展开（折叠后桌面端仅保留窄条） */
const areaSidebarExpanded = ref(true);

function loadCollapsePreferences() {
  try {
    const area = localStorage.getItem(STORAGE_AREA_SIDEBAR_EXPANDED);
    if (area === '0') areaSidebarExpanded.value = false;
  } catch {
    // ignore
  }
}

function toggleAreaSidebar() {
  areaSidebarExpanded.value = !areaSidebarExpanded.value;
}

/** 库内平面图显示比例（默认最小格，便于总览；可放大看明细） */
const MAP_SCALE_MIN = 0.35;
const MAP_SCALE_MAX = 1.25;
const MAP_SCALE_STEP = 0.05;
/** 小于等于该比例时，格内仅显示库位编码，点击查看详情抽屉 */
const MAP_SCALE_COMPACT_THRESHOLD = 0.56;
const mapScale = ref(MAP_SCALE_MIN);

function clampMapScale(v: number) {
  const n = Math.round(v * 100) / 100;
  return Math.min(MAP_SCALE_MAX, Math.max(MAP_SCALE_MIN, n));
}

function zoomStep(delta: number) {
  mapScale.value = clampMapScale(mapScale.value + delta);
}

function resetMapZoom() {
  mapScale.value = MAP_SCALE_MIN;
}

/** 滑块拖动会极高频触发；合并到每帧最多提交一次，避免上千单元格连续重排卡顿 */
let mapScaleRafId = 0;
let pendingMapScale: number | null = null;

function scheduleMapScaleFromSlider(raw: number | number[]) {
  const v = Array.isArray(raw) ? raw[0] : raw;
  pendingMapScale = clampMapScale(Number(v));
  if (mapScaleRafId !== 0) return;
  mapScaleRafId = requestAnimationFrame(() => {
    mapScaleRafId = 0;
    if (pendingMapScale != null) {
      mapScale.value = pendingMapScale;
      pendingMapScale = null;
    }
  });
}

const isCompactCellView = computed(() => mapScale.value <= MAP_SCALE_COMPACT_THRESHOLD);

/** 随缩放调整单元格最小宽高（基准略小，便于一屏容纳更多格并依赖换行） */
const cellMinWidthPx = computed(() => Math.max(48, Math.round(92 * mapScale.value)));

/** 高度：明细模式下随放大额外拉高，避免格子过扁 */
const cellMinHeightPx = computed(() => {
  const s = mapScale.value;
  const base = Math.max(38, Math.round(72 * s));
  if (s <= MAP_SCALE_COMPACT_THRESHOLD) return base;
  const span = MAP_SCALE_MAX - MAP_SCALE_MIN;
  const u = span > 1e-6 ? Math.min(1, Math.max(0, (s - MAP_SCALE_MIN) / span)) : 0;
  const detailBoost = Math.round(12 + 54 * u);
  return base + detailBoost;
});

/** 库位悬浮气泡：白字 + 深色底（避免与 naive 默认浅色气泡撞色） */
const mapLocTooltipThemeOverrides = {
  padding: '0px',
  borderRadius: '8px',
  color: '#171717',
  textColor: '#ffffff',
  boxShadow: '0 12px 28px rgba(0, 0, 0, 0.38)'
};

const detailVisible = ref(false);
const detailLocationId = ref<CommonType.IdType | null>(null);

function openLocationDetail(cell: Api.Wms.WarehouseLocation) {
  if (!cell?.id) return;
  detailLocationId.value = cell.id;
  detailVisible.value = true;
}

async function onLocationDetailUpdated() {
  await loadLocations();
}

function loadHiddenZonesFromStorage() {
  try {
    const raw = localStorage.getItem(STORAGE_HIDDEN_ZONES);
    if (!raw) return;
    const parsed = JSON.parse(raw) as unknown;
    if (Array.isArray(parsed) && parsed.every(x => typeof x === 'string')) {
      zonesHiddenFromMap.value = parsed as string[];
    }
  } catch {
    // ignore
  }
}

function persistHiddenZones() {
  try {
    localStorage.setItem(STORAGE_HIDDEN_ZONES, JSON.stringify(zonesHiddenFromMap.value));
  } catch {
    // ignore
  }
}

function zoneVisibleOnMap(zoneName: string | null | undefined): boolean {
  const z = String(zoneName ?? '').trim();
  if (!z) return true;
  return !zonesHiddenFromMap.value.includes(z);
}

function setZoneVisibleOnMap(zoneName: string, visible: boolean) {
  const z = zoneName.trim();
  if (!z) return;
  const set = new Set(zonesHiddenFromMap.value);
  if (visible) set.delete(z);
  else set.add(z);
  zonesHiddenFromMap.value = [...set];
  persistHiddenZones();
}

function safeNumber(v: unknown): number | null {
  const n = Number(v);
  if (Number.isNaN(n)) return null;
  return n;
}

function utilizationPercentOf(summary: Api.Wms.WarehouseAreaStockSummary | null | undefined): number | null {
  if (!summary) return null;
  const cap = safeNumber(summary.totalCapacity);
  const cur = safeNumber(summary.totalCurrentStock);
  const pct = safeNumber(summary.utilizationPercent);
  if (pct != null) return Math.max(0, Math.min(100, Math.round(pct)));
  if (cap == null || cap <= 0 || cur == null) return null;
  return Math.max(0, Math.min(100, Math.round((cur / cap) * 100)));
}

function stockTierStyle(pct: number | null, cap: number | null): Record<string, string> {
  // 与平面图色阶一致：Empty 0% | Low 1–49% | Moderate 50–79% | High 80–94% | Critical 95%+
  if (cap == null || cap <= 0 || pct == null) {
    return { backgroundColor: 'rgba(148, 163, 184, 0.22)', color: 'rgba(71, 85, 105, 0.95)' };
  }
  if (pct <= 0) return { backgroundColor: 'rgba(34, 197, 94, 0.16)', color: 'rgba(20, 83, 45, 0.95)' };
  if (pct < 50) return { backgroundColor: 'rgba(56, 189, 248, 0.18)', color: 'rgba(7, 89, 133, 0.95)' };
  if (pct < 80) return { backgroundColor: 'rgba(250, 204, 21, 0.2)', color: 'rgba(113, 63, 18, 0.95)' };
  if (pct < 95) return { backgroundColor: 'rgba(249, 115, 22, 0.2)', color: 'rgba(124, 45, 18, 0.95)' };
  return { backgroundColor: 'rgba(239, 68, 68, 0.18)', color: 'rgba(127, 29, 29, 0.95)' };
}

const areaStockSummaryMap = computed(() => {
  const m = new Map<string, Api.Wms.WarehouseAreaStockSummary>();
  const list = areaStockStatistics.value?.areas ?? [];
  for (const a of list) {
    const key = String(a.areaName ?? '').trim();
    if (key) m.set(key, a);
  }
  return m;
});

function areaSummaryOf(areaName: string | null | undefined) {
  const k = String(areaName ?? '').trim();
  if (!k) return null;
  return areaStockSummaryMap.value.get(k) ?? null;
}

function formatStockSummary(summary: Api.Wms.WarehouseAreaStockSummary | null | undefined) {
  const cap = safeNumber(summary?.totalCapacity);
  const cur = safeNumber(summary?.totalCurrentStock);
  const pct = utilizationPercentOf(summary);
  return {
    cap,
    cur,
    pct,
    capText: cap == null ? '—' : String(cap),
    curText: cur == null ? '—' : String(cur),
    pctText: pct == null ? '—' : `${pct}%`,
    pctStyle: stockTierStyle(pct, cap)
  };
}

/** 当前视图下的库位（不按行列过滤；全部库区时尊重左侧「平面图」隐藏开关） */
const locationsForFlatMap = computed(() =>
  locations.value.filter(l => {
    if (!selectedZoneCode.value) {
      const zc = String(l.zoneCode ?? '').trim();
      if (zc && zonesHiddenFromMap.value.includes(zc)) return false;
    }
    return true;
  })
);

function compareLocationCode(a: Api.Wms.WarehouseLocation, b: Api.Wms.WarehouseLocation) {
  const ca = String(a.locationCode ?? '');
  const cb = String(b.locationCode ?? '');
  return ca.localeCompare(cb, 'zh-CN', { numeric: true, sensitivity: 'base' });
}

/** 按库区顺序（与后台库区列表 areaName 升序一致）分段，区内库位编码排序后平铺 */
const flatZoneSections = computed(() => {
  const list = locationsForFlatMap.value;
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

/** 占用率 0–100（库容无效时无法计算） */
function utilizationRatioPercent(loc: Api.Wms.WarehouseLocation): number | null {
  const cap = loc.capacity;
  const cur = loc.currentStock ?? 0;
  if (cap == null || cap <= 0) return null;
  return Math.min(100, (cur / cap) * 100);
}

/**
 * 五级占用色：Empty 0% | Low 1–49% | Moderate 50–79% | High 80–94% | Critical 95%+
 * 库容无效：中性灰
 */
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

type LocationWarehouseCodeLine = {
  warehouseCode: string;
  palletCount: number | null;
};

/** 兼容旧返回 destinationOccupancies / 行内 destination */
type WarehouseLocationWithLegacyOcc = Api.Wms.WarehouseLocation & {
  destinationOccupancies?: unknown;
};

function occupancyRowsRaw(loc: Api.Wms.WarehouseLocation): unknown[] {
  const l = loc as WarehouseLocationWithLegacyOcc;
  const next = l.warehouseCodeOccupancies;
  const legacy = l.destinationOccupancies;
  if (Array.isArray(next) && next.length) return next;
  if (Array.isArray(legacy) && legacy.length) return legacy;
  return [];
}

function normalizeWarehouseCodeLines(loc: Api.Wms.WarehouseLocation): LocationWarehouseCodeLine[] {
  const raw = occupancyRowsRaw(loc);
  return raw.map(row => {
    const r = row as {
      warehouseCode?: string | null;
      destination?: string | null;
      palletCount?: number | null;
    };
    const code = String(r.warehouseCode ?? r.destination ?? '').trim() || '—';
    return {
      warehouseCode: code,
      palletCount:
        r.palletCount != null && !Number.isNaN(Number(r.palletCount)) ? Number(r.palletCount) : null
    };
  });
}

/** 当前筛选下列表库位的仓库代码占用明细（避免模板内重复解析） */
const warehouseCodeLinesByLocationId = computed(() => {
  const m = new Map<string, LocationWarehouseCodeLine[]>();
  for (const loc of locationsForFlatMap.value) {
    m.set(String(loc.id), normalizeWarehouseCodeLines(loc));
  }
  return m;
});

function warehouseCodeLinesOf(loc: Api.Wms.WarehouseLocation) {
  return warehouseCodeLinesByLocationId.value.get(String(loc.id)) ?? [];
}

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

async function loadAreas() {
  areasLoading.value = true;
  const { data, error } = await fetchGetWarehouseAreaList({
    pageNum: areaPageNum.value,
    pageSize: areaPageSize.value,
    areaName: areaSearchKeyword.value?.trim() || undefined,
    orderByColumn: 'areaName',
    isAsc: 'asc'
  });
  areasLoading.value = false;
  if (error || !data?.rows) {
    areas.value = [];
    areaTotal.value = 0;
    return;
  }
  areas.value = data.rows;
  areaTotal.value = Number(data.total) || 0;
}

async function loadAreaStockStatistics() {
  const { data, error } = await fetchGetWarehouseAreaStockStatistics();
  if (error || !data) {
    areaStockStatistics.value = null;
    return;
  }
  areaStockStatistics.value = data;
}

async function loadLocations() {
  loading.value = true;
  try {
    const invCode = inventoryWarehouseCodeSearch.value?.trim();
    const dispatch = putawayDispatchMethod.value?.trim();
    const hasPutawayFilter = Boolean(dispatch);
    const platCode = putawayPlatformWarehouseCode.value?.trim();
    const { data, error } = await fetchGetWarehouseLocationList({
      pageNum: 1,
      pageSize: 5000,
      zoneCode: selectedZoneCode.value?.trim() || undefined,
      locationKeyword: null,
      keyword: null,
      status: '0',
      orderByColumn: 'locationCode',
      isAsc: 'asc',
      inventoryWarehouseCode: invCode || undefined,
      putawayDispatchMethod: hasPutawayFilter ? dispatch : undefined,
      putawayPlatformId:
        hasPutawayFilter && putawayPlatformId.value != null && putawayPlatformId.value !== ''
          ? putawayPlatformId.value
          : undefined,
      putawayPlatformWarehouseCode: hasPutawayFilter && platCode ? platCode : undefined
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

async function refreshAll() {
  await loadWarehouseAreaNameOrder();
  await loadAreas();
  await loadAreaStockStatistics();
  await loadLocations();
}

function selectArea(id: CommonType.IdType | null, zoneName?: string | null) {
  selectedAreaId.value = id;
  selectedZoneCode.value = id == null ? null : zoneName ?? null;
  void loadLocations();
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

watchDebounced(
  [
    inventoryWarehouseCodeSearch,
    putawayDispatchMethod,
    putawayPlatformId,
    putawayPlatformWarehouseCode
  ],
  () => {
    void loadLocations();
  },
  { debounce: 400 }
);

watch(putawayDispatchMethod, v => {
  if (!v?.trim()) {
    putawayPlatformId.value = null;
    putawayPlatformWarehouseCode.value = '';
  }
});

watch(areaSidebarExpanded, v => {
  try {
    localStorage.setItem(STORAGE_AREA_SIDEBAR_EXPANDED, v ? '1' : '0');
  } catch {
    // ignore
  }
});

onMounted(async () => {
  loadHiddenZonesFromStorage();
  loadCollapsePreferences();
  const { data } = await fetchGetPlatformList();
  if (data) platforms.value = data;
  void refreshAll();
});

onBeforeUnmount(() => {
  if (mapScaleRafId !== 0) {
    cancelAnimationFrame(mapScaleRafId);
    mapScaleRafId = 0;
  }
});
</script>

<template>
  <div class="h-full min-h-500px flex flex-col gap-16px overflow-hidden lt-sm:overflow-auto">
    <div class="flex min-h-0 flex-1 flex-col gap-16px overflow-hidden lg:flex-row">
      <!-- 左侧：库区（可折叠；折叠后大屏为窄条，仅保留展开按钮） -->
      <div
        class="area-sidebar-shell flex min-h-0 shrink-0 flex-col overflow-hidden border border-gray-200 rounded-8px bg-white transition-[width,padding,gap] duration-200 ease-out dark:border-gray-700 dark:bg-gray-900"
        :class="
          areaSidebarExpanded
            ? 'w-full gap-8px self-stretch p-10px lg:w-280px'
            : 'w-full gap-8px self-stretch p-8px lg:w-52px lg:min-w-[52px] lg:max-w-[52px] lg:overflow-hidden'
        "
      >
        <div
          class="flex shrink-0 items-center gap-6px"
          :class="areaSidebarExpanded ? 'justify-between' : 'justify-between lg:justify-center'"
        >
          <template v-if="areaSidebarExpanded">
            <span class="min-w-0 truncate text-14px font-600">{{ $t('page.wms.inventory.location.areaList') }}</span>
            <div class="flex shrink-0 items-center gap-4px">
              <span class="whitespace-nowrap text-12px text-gray-500 tabular-nums dark:text-gray-400">
                {{ $t('datatable.itemCount', { total: areaTotal }) }}
              </span>
              <NTooltip placement="bottom">
                <template #trigger>
                  <NButton quaternary size="tiny" @click="toggleAreaSidebar">
                    <template #icon>
                      <icon-material-symbols-keyboard-double-arrow-left class="text-icon" />
                    </template>
                  </NButton>
                </template>
                {{ $t('page.wms.warehouseInventoryMap.collapseAreaSidebar') }}
              </NTooltip>
            </div>
          </template>
          <template v-else>
            <span class="min-w-0 truncate text-14px font-600 lg:hidden">{{ $t('page.wms.inventory.location.areaList') }}</span>
            <NTooltip placement="right">
              <template #trigger>
                <NButton quaternary size="small" class="shrink-0 lg:w-full" @click="toggleAreaSidebar">
                  <template #icon>
                    <icon-material-symbols-keyboard-double-arrow-right class="text-icon" />
                  </template>
                </NButton>
              </template>
              {{ $t('page.wms.warehouseInventoryMap.expandAreaSidebar') }}
            </NTooltip>
          </template>
        </div>

        <div v-show="areaSidebarExpanded" class="flex min-h-0 flex-1 flex-col gap-8px overflow-hidden lt-md:min-h-[200px]">
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

          <div class="relative min-h-[120px] flex flex-1 flex-col overflow-hidden">
            <div class="area-card-list min-h-0 flex-1 overflow-y-auto overscroll-contain py-2px">
              <div class="flex flex-col gap-6px">
                <div
                  class="area-card cursor-pointer rounded-6px border px-8px py-6px transition-colors"
                  :class="
                    selectedAreaId === null
                      ? 'border-primary bg-gray-50 shadow-sm dark:border-primary dark:bg-gray-800/70'
                      : 'border-gray-200 bg-gray-50 dark:border-gray-600 dark:bg-gray-800/50'
                  "
                  @click="selectArea(null)"
                >
                  <div class="truncate text-13px font-600 leading-tight">
                    {{ $t('page.wms.inventory.location.allLocations') }}
                  </div>
                  <div class="mt-4px truncate text-11px text-gray-500 leading-snug dark:text-gray-400">
                    {{ $t('page.wms.inventory.location.allLocationsHint') }}
                  </div>
                  <template v-if="areaStockStatistics?.all">
                    <div class="mt-8px flex flex-wrap items-center justify-between gap-8px">
                      <div class="flex flex-wrap items-center gap-x-8px gap-y-4px text-11px text-gray-600 dark:text-gray-300">
                        <span class="tabular-nums">
                          {{ formatStockSummary(areaStockStatistics.all).curText }}/{{
                            formatStockSummary(areaStockStatistics.all).capText
                          }}
                        </span>
                        <span class="text-gray-400 dark:text-gray-500">
                          {{ $t('page.wms.warehouseInventoryMap.cellPalletUnit') }}
                        </span>
                      </div>
                      <span
                        class="shrink-0 rounded-6px px-8px py-3px text-11px font-700 tabular-nums"
                        :style="formatStockSummary(areaStockStatistics.all).pctStyle"
                      >
                        {{ formatStockSummary(areaStockStatistics.all).pctText }}
                      </span>
                    </div>
                  </template>
                </div>

                <div
                  v-for="a in areas"
                  :key="String(a.id)"
                  class="area-card rounded-6px border px-8px py-6px transition-colors"
                  :class="
                    selectedAreaId === a.id
                      ? 'border-primary bg-gray-50 shadow-sm dark:border-primary dark:bg-gray-800/70'
                      : 'border-gray-200 bg-gray-50 dark:border-gray-600 dark:bg-gray-800/50'
                  "
                >
                  <div class="flex cursor-pointer items-start gap-8px" @click="selectArea(a.id, a.areaName)">
                    <div class="min-w-0 flex-1">
                      <div class="min-w-0 truncate text-13px font-600 leading-tight" :title="a.areaName">{{ a.areaName }}</div>
                      <div class="mt-6px flex flex-wrap items-center gap-6px">
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

                        <!-- 仅在「全部库区」模式下：控制该区库位是否参与右侧平面图（放到标签旁边） -->
                        <div
                          v-if="selectedAreaId === null"
                          class="ml-auto flex items-center gap-6px"
                          @click.stop
                        >
                          <span class="text-11px text-gray-500 dark:text-gray-400">
                            {{ $t('page.wms.warehouseInventoryMap.floorPlanVisibility') }}
                          </span>
                          <NSwitch
                            size="small"
                            :rubber-band="false"
                            :value="zoneVisibleOnMap(a.areaName)"
                            @update:value="v => setZoneVisibleOnMap(String(a.areaName), v)"
                          />
                        </div>
                      </div>
                      <template v-if="areaSummaryOf(a.areaName)">
                        <div class="mt-8px flex flex-wrap items-center justify-between gap-8px">
                          <div class="flex flex-wrap items-center gap-x-8px gap-y-4px text-11px text-gray-600 dark:text-gray-300">
                            <span class="tabular-nums">
                              {{ formatStockSummary(areaSummaryOf(a.areaName)).curText }}/{{
                                formatStockSummary(areaSummaryOf(a.areaName)).capText
                              }}
                            </span>
                            <span class="text-gray-400 dark:text-gray-500">
                              {{ $t('page.wms.warehouseInventoryMap.cellPalletUnit') }}
                            </span>
                          </div>
                          <span
                            class="shrink-0 rounded-6px px-8px py-3px text-11px font-700 tabular-nums"
                            :style="formatStockSummary(areaSummaryOf(a.areaName)).pctStyle"
                          >
                            {{ formatStockSummary(areaSummaryOf(a.areaName)).pctText }}
                          </span>
                        </div>
                      </template>
                    </div>
                  </div>
                </div>

                <div v-if="!areasLoading && !areas.length" class="py-12px text-center text-12px text-gray-500">
                  {{ $t('common.noData') }}
                </div>
              </div>
            </div>
            <div
              v-show="areasLoading"
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
      </div>

      <!-- 右侧：仓库可视化 -->
      <NCard
        :bordered="false"
        size="small"
        class="card-wrapper min-h-0 min-w-0 flex flex-1 flex-col overflow-hidden"
        content-class="flex min-h-0 flex-1 flex-col overflow-hidden"
      >
        <template #header>
          <div class="flex w-full min-w-0 flex-col gap-12px">
            <div class="flex flex-wrap items-center justify-between gap-12px">
              <span class="text-16px font-medium">{{ $t('page.wms.warehouseInventoryMap.title') }}</span>
              <NButton secondary size="small" type="primary" :loading="loading" @click="refreshAll">
                <template #icon>
                  <icon-material-symbols-refresh-rounded class="text-icon" />
                </template>
                {{ $t('common.refresh') }}
              </NButton>
            </div>
            <NCollapse class="w-full" :default-expanded-names="['warehouse-inventory-map-search']">
              <NCollapseItem :title="$t('common.search')" name="warehouse-inventory-map-search">
                <div class="flex w-full min-w-0 flex-col gap-10px pt-4px">
                  <div class="min-w-0 sm:max-w-320px">
                    <div class="mb-4px text-12px text-gray-600 dark:text-gray-400">
                      {{ $t('page.wms.warehouseInventoryMap.searchInventoryWarehouseCode') }}
                    </div>
                    <NInput
                      v-model:value="inventoryWarehouseCodeSearch"
                      clearable
                      size="small"
                      :placeholder="$t('page.wms.warehouseInventoryMap.searchInventoryWarehouseCodePlaceholder')"
                    />
                  </div>
                  <div class="border-t border-gray-200 pt-10px dark:border-gray-600">
                    <div class="mb-8px text-12px font-600 text-gray-700 dark:text-gray-200">
                      {{ $t('page.wms.warehouseInventoryMap.putawayRuleFilter') }}
                    </div>
                    <div class="flex w-full min-w-0 flex-wrap items-end gap-12px">
                      <div class="min-w-0 w-full sm:w-160px">
                        <div class="mb-4px text-12px text-gray-600 dark:text-gray-400">
                          <span class="text-red-500">*</span>
                          {{ $t('page.wms.inventory.warehouseArea.putawayDispatchMethod') }}
                        </div>
                        <DictSelect
                          v-model:value="putawayDispatchMethod"
                          :dict-code="WMS_DICT_DELIVERY_TYPE"
                          clearable
                          size="small"
                          class="w-full"
                          :placeholder="$t('page.wms.inventory.warehouseArea.putawayDispatchMethodPlaceholder')"
                        />
                      </div>
                      <div class="min-w-0 w-full sm:w-200px">
                        <div class="mb-4px text-12px text-gray-600 dark:text-gray-400">
                          {{ $t('page.wms.inventory.warehouseArea.putawayPlatform') }}
                        </div>
                        <NSelect
                          v-model:value="putawayPlatformId"
                          clearable
                          filterable
                          size="small"
                          class="w-full"
                          :options="platformOptions"
                          :disabled="!putawayDispatchMethod?.trim()"
                          :placeholder="$t('page.wms.inventory.warehouseArea.putawayPlatformPlaceholder')"
                        />
                      </div>
                      <div class="min-w-0 w-full flex-1 sm:max-w-240px">
                        <div class="mb-4px text-12px text-gray-600 dark:text-gray-400">
                          {{ $t('page.wms.inventory.warehouseArea.putawayPlatformCodes') }}
                        </div>
                        <NInput
                          v-model:value="putawayPlatformWarehouseCode"
                          clearable
                          size="small"
                          :disabled="!putawayDispatchMethod?.trim()"
                          :placeholder="$t('page.wms.inventory.warehouseArea.putawayPlatformCodesPlaceholder')"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </NCollapseItem>
            </NCollapse>
            <!-- 缩放固定在卡片头部，避免需先滚到平面图内才能操作 -->
            <div
              class="flex min-w-0 flex-wrap items-center gap-8px border border-gray-200 rounded-8px bg-gray-50 px-10px py-8px dark:border-gray-600 dark:bg-gray-800/50"
            >
              <span class="shrink-0 whitespace-nowrap text-12px text-gray-600 dark:text-gray-400">
                {{ $t('page.wms.warehouseInventoryMap.mapScale') }}
              </span>
              <NButton quaternary size="tiny" class="min-w-28px shrink-0 px-4px" @click="zoomStep(-MAP_SCALE_STEP)">
                <template #icon>
                  <icon-material-symbols-remove-rounded class="text-icon" />
                </template>
              </NButton>
              <NSlider
                class="min-w-120px max-w-full flex-1 sm:min-w-160px sm:max-w-240px"
                :value="mapScale"
                :min="MAP_SCALE_MIN"
                :max="MAP_SCALE_MAX"
                :step="MAP_SCALE_STEP"
                :format-tooltip="v => `${Math.round(Number(v) * 100)}%`"
                @update:value="scheduleMapScaleFromSlider"
              />
              <NButton quaternary size="tiny" class="min-w-28px shrink-0 px-4px" @click="zoomStep(MAP_SCALE_STEP)">
                <template #icon>
                  <icon-material-symbols-add-rounded class="text-icon" />
                </template>
              </NButton>
              <span class="shrink-0 tabular-nums text-12px text-gray-700 dark:text-gray-300">
                {{ Math.round(mapScale * 100) }}%
              </span>
              <NButton size="tiny" secondary class="shrink-0" @click="resetMapZoom">
                {{ $t('page.wms.warehouseInventoryMap.mapScaleReset') }}
              </NButton>
            </div>
          </div>
        </template>

        <NSpin :show="loading" class="map-spin min-h-260px flex flex-1 flex-col overflow-hidden">
          <!-- 单一包裹层：保证 flex 高度传递；平面图区域纵向滚动 -->
          <div class="flex min-h-0 flex-1 flex-col overflow-hidden">
            <div
              v-if="!loading && locations.length === 0"
              class="flex flex-1 items-center justify-center py-48px"
            >
              <NEmpty :description="$t('page.wms.warehouseInventoryMap.noLocations')" />
            </div>

            <div
              v-else-if="!loading && locations.length > 0 && locationsForFlatMap.length === 0"
              class="flex flex-1 flex-col items-center justify-center gap-12px py-48px"
            >
              <NEmpty :description="$t('page.wms.warehouseInventoryMap.noLocationsInFilter')" />
            </div>

            <div
              v-else-if="flatZoneSections.length"
              class="warehouse-visual-outer min-h-0 min-w-0 flex-1 overflow-x-hidden overflow-y-auto overscroll-contain p-10px sm:p-12px"
              :style="{ maxHeight: appStore.isMobile ? '65vh' : 'calc(100vh - 300px)' }"
            >
              <div
                class="warehouse-visual-frame w-full max-w-full rounded-12px border-2 border-solid border-slate-600 bg-slate-100/80 p-12px shadow-inner dark:border-slate-500 dark:bg-slate-900/60 sm:p-14px"
              >
                <div class="mb-12px flex flex-col gap-8px border-b border-slate-300/80 pb-10px dark:border-slate-600">
                  <div class="flex flex-wrap items-center gap-x-12px gap-y-6px">
                    <span class="text-13px font-600 text-slate-700 dark:text-slate-200">
                      {{ $t('page.wms.warehouseInventoryMap.frameTitle') }}
                    </span>
                    <span v-if="selectedZoneCode" class="text-12px text-slate-500">{{ selectedZoneCode }}</span>
                    <span v-else class="text-12px text-slate-500">{{ $t('page.wms.warehouseInventoryMap.zoneAll') }}</span>
                    <span class="text-11px text-slate-400 dark:text-slate-500">
                      {{ $t('page.wms.warehouseInventoryMap.mapWrapHint') }}
                    </span>
                  </div>
                  <div class="flex flex-wrap gap-x-10px gap-y-6px" aria-hidden="true">
                    <span class="mr-4px text-11px font-600 text-slate-600 dark:text-slate-300">
                      {{ $t('page.wms.warehouseInventoryMap.occupancyLegend') }}
                    </span>
                    <span class="flex items-center gap-4px text-11px text-slate-600 dark:text-slate-400">
                      <span class="inline-block size-12px shrink-0 rounded-3px border border-emerald-600/55 bg-emerald-400/35" />
                      {{ $t('page.wms.warehouseInventoryMap.occupancyEmpty') }}
                    </span>
                    <span class="flex items-center gap-4px text-11px text-slate-600 dark:text-slate-400">
                      <span class="inline-block size-12px shrink-0 rounded-3px border border-sky-500/55 bg-sky-400/38" />
                      {{ $t('page.wms.warehouseInventoryMap.occupancyLow') }}
                    </span>
                    <span class="flex items-center gap-4px text-11px text-slate-600 dark:text-slate-400">
                      <span class="inline-block size-12px shrink-0 rounded-3px border border-amber-600/55 bg-amber-400/42" />
                      {{ $t('page.wms.warehouseInventoryMap.occupancyModerate') }}
                    </span>
                    <span class="flex items-center gap-4px text-11px text-slate-600 dark:text-slate-400">
                      <span class="inline-block size-12px shrink-0 rounded-3px border border-orange-600/55 bg-orange-400/40" />
                      {{ $t('page.wms.warehouseInventoryMap.occupancyHigh') }}
                    </span>
                    <span class="flex items-center gap-4px text-11px text-slate-600 dark:text-slate-400">
                      <span class="inline-block size-12px shrink-0 rounded-3px border border-red-600/60 bg-red-400/42" />
                      {{ $t('page.wms.warehouseInventoryMap.occupancyCritical') }}
                    </span>
                    <span class="flex items-center gap-4px text-11px text-slate-600 dark:text-slate-400">
                      <span class="inline-block size-12px shrink-0 rounded-3px border border-slate-500/55 bg-slate-400/22" />
                      {{ $t('page.wms.warehouseInventoryMap.occupancyUnknown') }}
                    </span>
                  </div>
                </div>

                <div class="flex flex-col gap-18px">
                  <section
                    v-for="section in flatZoneSections"
                    :key="section.zoneKey"
                    class="flat-zone-section min-w-0"
                  >
                    <div class="mb-10px text-15px font-700 text-slate-800 dark:text-slate-100">
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
                        :style="{ maxWidth: 'min(360px, 92vw)' }"
                      >
                        <template #trigger>
                          <div
                            class="flat-loc-cell flex shrink-0 cursor-pointer flex-col overflow-hidden rounded-8px border transition-colors select-none"
                            :style="{
                              width: `${cellMinWidthPx}px`,
                              height: `${cellMinHeightPx}px`,
                              minHeight: `${cellMinHeightPx}px`,
                              ...occupancyBgStyle(loc)
                            }"
                            @click="openLocationDetail(loc)"
                          >
                            <template v-if="isCompactCellView">
                              <div class="flex min-h-0 flex-1 flex-col items-center justify-center px-4px py-6px text-center">
                                <span
                                  class="truncate font-700 leading-tight text-slate-900 dark:text-slate-50"
                                  :class="mapScale < 0.45 ? 'text-10px' : 'text-11px'"
                                >
                                  {{ loc.locationCode || '—' }}
                                </span>
                              </div>
                            </template>
                            <template v-else>
                              <div class="flex h-full min-h-0 flex-col gap-4px overflow-hidden p-6px text-11px leading-snug">
                                <div class="shrink-0 truncate text-center text-12px font-700 text-slate-900 dark:text-slate-100">
                                  {{ loc.locationCode || '—' }}
                                </div>
                                <div class="shrink-0 flex justify-between gap-6px border-b border-black/10 pb-4px dark:border-white/12">
                                  <span class="shrink-0 text-gray-600 dark:text-gray-400">
                                    {{ $t('page.wms.warehouseInventoryMap.cellRemainingAvailable') }}
                                  </span>
                                  <span class="min-w-0 truncate text-right font-600 tabular-nums text-slate-900 dark:text-slate-100">
                                    {{ formatRemainingDisplay(loc) }}
                                  </span>
                                </div>
                                <div class="flat-loc-cell-scroll min-h-0 flex-1 overflow-y-auto overscroll-contain pr-2px">
                                  <template v-if="warehouseCodeLinesOf(loc).length">
                                    <div
                                      v-for="(row, idx) in warehouseCodeLinesOf(loc)"
                                      :key="idx"
                                      class="mb-6px border-b border-black/6 pb-6px last:mb-0 last:border-0 last:pb-0 dark:border-white/10"
                                    >
                                      <div class="break-words text-slate-800 dark:text-slate-100">
                                        {{ row.warehouseCode }}
                                      </div>
                                      <div class="mt-2px text-slate-600 dark:text-slate-400">
                                        <template v-if="row.palletCount != null">
                                          {{ row.palletCount }} {{ $t('page.wms.warehouseInventoryMap.cellPalletUnit') }}
                                        </template>
                                        <template v-else>—</template>
                                      </div>
                                    </div>
                                  </template>
                                  <div v-else class="text-slate-500 dark:text-slate-400">
                                    {{ $t('page.wms.warehouseInventoryMap.warehouseCodeInventoryEmpty') }}
                                  </div>
                                </div>
                              </div>
                            </template>
                          </div>
                        </template>
                        <div class="max-h-280px max-w-full overflow-y-auto px-12px py-10px text-12px leading-snug text-white">
                          <div class="mb-8px border-b border-white/25 pb-8px font-700">
                            {{ loc.locationCode || '—' }}
                          </div>
                          <div class="mb-8px flex justify-between gap-12px">
                            <span>{{ $t('page.wms.warehouseInventoryMap.cellRemainingAvailable') }}</span>
                            <span class="font-600 tabular-nums">{{ formatRemainingDisplay(loc) }}</span>
                          </div>
                          <div class="space-y-8px">
                            <template v-if="warehouseCodeLinesOf(loc).length">
                              <div
                                v-for="(row, idx) in warehouseCodeLinesOf(loc)"
                                :key="`tip-${idx}`"
                                class="border-b border-white/20 pb-8px last:border-0 last:pb-0"
                              >
                                <div class="break-words font-600">{{ row.warehouseCode }}</div>
                                <div class="mt-4px font-500">
                                  <template v-if="row.palletCount != null">
                                    {{ row.palletCount }} {{ $t('page.wms.warehouseInventoryMap.cellPalletUnit') }}
                                  </template>
                                  <template v-else>—</template>
                                </div>
                              </div>
                            </template>
                            <div v-else>{{ $t('page.wms.warehouseInventoryMap.warehouseCodeInventoryEmpty') }}</div>
                          </div>
                        </div>
                      </NTooltip>
                    </div>
                  </section>
                </div>
              </div>
            </div>
          </div>
        </NSpin>
      </NCard>
    </div>

    <WarehouseLocationDetailDrawer
      v-model:visible="detailVisible"
      :location-id="detailLocationId"
      @updated="onLocationDetailUpdated"
    />
  </div>
</template>

<style scoped>
.map-spin :deep(.n-spin-content) {
  display: flex;
  flex: 1;
  flex-direction: column;
  min-height: 0;
  overflow: hidden;
}

.warehouse-visual-outer {
  scrollbar-gutter: stable both-edges;
  touch-action: pan-x pan-y;
  -webkit-overflow-scrolling: touch;
}

.flat-loc-cell-scroll {
  scrollbar-width: thin;
}
</style>
