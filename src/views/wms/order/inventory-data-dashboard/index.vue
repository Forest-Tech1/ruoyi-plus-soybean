<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { watchDebounced } from '@vueuse/core';
import { NButton, NCard, NDatePicker, NInputNumber, NSelect, NSpace, NSpin, NText } from 'naive-ui';
import { getDefaultOutstockDashboardCreateTimeRange } from '@/constants/wms-outstock-data';
import { fetchGetInventoryDashboardByWarehouse } from '@/service/api/wms/inventory-data';
import { fetchGetOutstockDashboardByWarehouse } from '@/service/api/wms/outstock-data';
import { useEcharts } from '@/hooks/common/echarts';
import { useThemeStore } from '@/store/modules/theme';
import { useAppStore } from '@/store/modules/app';
import { $t } from '@/locales';

defineOptions({
  name: 'InventoryOutstockDataDashboard'
});

const themeStore = useThemeStore();
const appStore = useAppStore();

const presetTopOptions = computed(() => [
  { label: '30', value: 30 },
  { label: '50', value: 50 },
  { label: '80', value: 80 },
  { label: '100', value: 100 }
]);

function parseDashboardPayload(
  raw: unknown
): Api.Wms.WarehouseInventoryDashboardByWarehouseResult {
  if (raw == null || typeof raw !== 'object') {
    return { rows: [] };
  }
  const o = raw as Record<string, unknown>;
  if (Array.isArray(o.rows)) {
    return o as Api.Wms.WarehouseInventoryDashboardByWarehouseResult;
  }
  const inner = o.data;
  if (inner != null && typeof inner === 'object' && Array.isArray((inner as Record<string, unknown>).rows)) {
    return inner as Api.Wms.WarehouseInventoryDashboardByWarehouseResult;
  }
  return { rows: [] };
}

// ---------- 库存数据看板 ----------
const invChartRows = ref<{ warehouseCode: string; totalPallets: number }[]>([]);
const invTotalWarehouses = ref(0);
const invLoading = ref(false);
const invTopN = ref(30);

const { domRef: invDomRef, updateOptions: updateInvChartOptions } = useEcharts(() => ({
  tooltip: {
    trigger: 'axis',
    axisPointer: { type: 'shadow' }
  },
  grid: {
    left: '3%',
    right: '4%',
    bottom: 64,
    top: 48,
    containLabel: true
  },
  xAxis: {
    type: 'category',
    data: [] as string[],
    axisLabel: { rotate: 32, interval: 0, hideOverlap: false }
  },
  yAxis: {
    type: 'value',
    name: $t('page.wms.inventoryDataDashboard.palletCountAxis'),
    nameLocation: 'middle',
    nameGap: 48
  },
  series: [
    {
      type: 'bar',
      name: $t('page.wms.inventoryDataDashboard.palletCountSeries'),
      data: [] as number[],
      barMaxWidth: 36,
      itemStyle: {
        color: themeStore.themeColor,
        borderRadius: [4, 4, 0, 0]
      }
    }
  ]
}));

function applyInvChart() {
  const slice = invChartRows.value;
  const axisName = $t('page.wms.inventoryDataDashboard.palletCountAxis');
  const seriesName = $t('page.wms.inventoryDataDashboard.palletCountSeries');
  const barColor = themeStore.themeColor;

  updateInvChartOptions(opts => {
    opts.xAxis = {
      type: 'category',
      data: slice.map(s => s.warehouseCode),
      axisLabel: { rotate: 32, interval: 0, hideOverlap: false }
    };
    opts.yAxis = {
      type: 'value',
      name: axisName,
      nameLocation: 'middle',
      nameGap: 48
    };
    opts.series = [
      {
        type: 'bar',
        name: seriesName,
        data: slice.map(s => s.totalPallets),
        barMaxWidth: 36,
        itemStyle: {
          color: barColor,
          borderRadius: [4, 4, 0, 0]
        }
      }
    ];
    return opts;
  });
}

async function loadInventory() {
  invLoading.value = true;
  try {
    const n = Math.min(Math.max(1, Math.floor(invTopN.value || 30)), 500);
    const { data, error } = await fetchGetInventoryDashboardByWarehouse({ topN: n });
    if (error) {
      window.$message?.error($t('page.wms.inventoryDataDashboard.loadFailed'));
      invChartRows.value = [];
      invTotalWarehouses.value = 0;
      applyInvChart();
      return;
    }
    const payload = parseDashboardPayload(data);
    const emptyLabel = $t('page.wms.inventoryDataDashboard.emptyWarehouseCode');
    const rows = payload.rows ?? [];
    invChartRows.value = rows.map(r => {
      const rawCode = (r.warehouseCode ?? '').trim();
      const warehouseCode = rawCode || emptyLabel;
      const p = Number(r.totalPalletCount ?? 0);
      const totalPallets = Number.isFinite(p) ? p : 0;
      return { warehouseCode, totalPallets };
    });
    const tw = payload.totalWarehouses;
    invTotalWarehouses.value =
      typeof tw === 'number' && tw >= 0 ? tw : invChartRows.value.length;
    applyInvChart();
  } finally {
    invLoading.value = false;
  }
}

function onInvPresetSelect(v: number) {
  invTopN.value = v;
}

watchDebounced(
  invTopN,
  () => {
    void loadInventory();
  },
  { debounce: 400, immediate: true }
);

// ---------- 出库数据看板 ----------
const outChartRows = ref<{ warehouseCode: string; totalPallets: number }[]>([]);
const outTotalWarehouses = ref(0);
const outLoading = ref(false);
const outTopN = ref(30);

const outCreateTimeDefault = getDefaultOutstockDashboardCreateTimeRange();
const outCreateTimeRange = ref<[string, string] | null>([
  outCreateTimeDefault.createTimeBegin,
  outCreateTimeDefault.createTimeEnd
]);

const { domRef: outDomRef, updateOptions: updateOutChartOptions } = useEcharts(() => ({
  tooltip: {
    trigger: 'axis',
    axisPointer: { type: 'shadow' }
  },
  grid: {
    left: '3%',
    right: '4%',
    bottom: 64,
    top: 48,
    containLabel: true
  },
  xAxis: {
    type: 'category',
    data: [] as string[],
    axisLabel: { rotate: 32, interval: 0, hideOverlap: false }
  },
  yAxis: {
    type: 'value',
    name: $t('page.wms.outstockDataDashboard.palletCountAxis'),
    nameLocation: 'middle',
    nameGap: 48
  },
  series: [
    {
      type: 'bar',
      name: $t('page.wms.outstockDataDashboard.palletCountSeries'),
      data: [] as number[],
      barMaxWidth: 36,
      itemStyle: {
        color: themeStore.themeColor,
        borderRadius: [4, 4, 0, 0]
      }
    }
  ]
}));

function applyOutChart() {
  const slice = outChartRows.value;
  const axisName = $t('page.wms.outstockDataDashboard.palletCountAxis');
  const seriesName = $t('page.wms.outstockDataDashboard.palletCountSeries');
  const barColor = themeStore.themeColor;

  updateOutChartOptions(opts => {
    opts.xAxis = {
      type: 'category',
      data: slice.map(s => s.warehouseCode),
      axisLabel: { rotate: 32, interval: 0, hideOverlap: false }
    };
    opts.yAxis = {
      type: 'value',
      name: axisName,
      nameLocation: 'middle',
      nameGap: 48
    };
    opts.series = [
      {
        type: 'bar',
        name: seriesName,
        data: slice.map(s => s.totalPallets),
        barMaxWidth: 36,
        itemStyle: {
          color: barColor,
          borderRadius: [4, 4, 0, 0]
        }
      }
    ];
    return opts;
  });
}

async function loadOutstock() {
  outLoading.value = true;
  try {
    const n = Math.min(Math.max(1, Math.floor(outTopN.value || 30)), 500);
    const tr = outCreateTimeRange.value;
    const createTimeBegin = tr?.length === 2 ? tr[0] : undefined;
    const createTimeEnd = tr?.length === 2 ? tr[1] : undefined;
    const { data, error } = await fetchGetOutstockDashboardByWarehouse({
      topN: n,
      createTimeBegin,
      createTimeEnd
    });
    if (error) {
      window.$message?.error($t('page.wms.outstockDataDashboard.loadFailed'));
      outChartRows.value = [];
      outTotalWarehouses.value = 0;
      applyOutChart();
      return;
    }
    const payload = parseDashboardPayload(data);
    const emptyLabel = $t('page.wms.outstockDataDashboard.emptyWarehouseCode');
    const rows = payload.rows ?? [];
    outChartRows.value = rows.map(r => {
      const rawCode = (r.warehouseCode ?? '').trim();
      const warehouseCode = rawCode || emptyLabel;
      const p = Number(r.totalPalletCount ?? 0);
      const totalPallets = Number.isFinite(p) ? p : 0;
      return { warehouseCode, totalPallets };
    });
    const tw = payload.totalWarehouses;
    outTotalWarehouses.value =
      typeof tw === 'number' && tw >= 0 ? tw : outChartRows.value.length;
    applyOutChart();
  } finally {
    outLoading.value = false;
  }
}

function onOutPresetSelect(v: number) {
  outTopN.value = v;
}

const outstockLoadTrigger = computed(() => ({
  topN: outTopN.value,
  begin: outCreateTimeRange.value?.[0] ?? '',
  end: outCreateTimeRange.value?.[1] ?? ''
}));

watchDebounced(
  outstockLoadTrigger,
  () => {
    void loadOutstock();
  },
  { debounce: 400, deep: true, immediate: true }
);

watch(
  () => appStore.locale,
  () => {
    void loadInventory();
    void loadOutstock();
  }
);

watch(
  () => themeStore.themeColor,
  () => {
    if (invChartRows.value.length) {
      applyInvChart();
    }
    if (outChartRows.value.length) {
      applyOutChart();
    }
  }
);
</script>

<template>
  <div class="h-full min-h-500px flex flex-col gap-16px overflow-y-auto p-16px">
    <div class="text-18px text-primary font-medium">
      {{ $t('page.wms.inventoryDataDashboard.pageHeading') }}
    </div>

    <!-- 库存 -->
    <NCard :bordered="false" size="small" class="card-wrapper">
      <div class="flex flex-wrap items-center justify-between gap-12px">
        <div>
          <div class="text-16px text-primary font-medium">
            {{ $t('page.wms.inventoryDataDashboard.title') }}
          </div>
          <NText depth="3" class="text-12px">
            {{ $t('page.wms.inventoryDataDashboard.hint') }}
          </NText>
        </div>
        <NSpace align="center" wrap>
          <span class="text-13px whitespace-nowrap op-80">{{ $t('page.wms.inventoryDataDashboard.topCount') }}</span>
          <NSelect
            size="small"
            class="w-100px"
            :value="([30, 50, 80, 100].includes(invTopN) ? invTopN : null) as number | null"
            :options="presetTopOptions"
            :placeholder="$t('page.wms.inventoryDataDashboard.presetPlaceholder')"
            clearable
            @update:value="v => v != null && onInvPresetSelect(v)"
          />
          <NInputNumber
            v-model:value="invTopN"
            size="small"
            class="w-130px"
            :min="1"
            :max="500"
            :show-button="false"
            :placeholder="$t('page.wms.inventoryDataDashboard.manualPlaceholder')"
          />
          <NButton size="small" type="primary" :loading="invLoading" @click="loadInventory">
            {{ $t('common.refresh') }}
          </NButton>
        </NSpace>
      </div>
      <div class="mt-12px text-12px op-70">
        {{
          $t('page.wms.inventoryDataDashboard.statsLine', {
            warehouses: invTotalWarehouses,
            shown: invChartRows.length
          })
        }}
      </div>
    </NCard>

    <NCard :bordered="false" size="small" class="card-wrapper">
      <NSpin :show="invLoading" class="min-h-400px w-full">
        <div ref="invDomRef" class="h-400px w-full" />
      </NSpin>
    </NCard>

    <!-- 出库 -->
    <NCard :bordered="false" size="small" class="card-wrapper">
      <div class="flex flex-wrap items-center justify-between gap-12px">
        <div>
          <div class="text-16px text-primary font-medium">
            {{ $t('page.wms.outstockDataDashboard.title') }}
          </div>
          <NText depth="3" class="text-12px">
            {{ $t('page.wms.outstockDataDashboard.hint') }}
          </NText>
        </div>
        <NSpace align="center" wrap>
          <span class="text-13px whitespace-nowrap op-80">{{ $t('page.wms.outstockData.createTimeRange') }}</span>
          <NDatePicker
            v-model:formatted-value="outCreateTimeRange"
            type="datetimerange"
            value-format="yyyy-MM-dd HH:mm:ss"
            clearable
            class="min-w-280px max-w-full lt-sm:min-w-0 lt-sm:w-full"
          />
          <span class="text-13px whitespace-nowrap op-80">{{ $t('page.wms.outstockDataDashboard.topCount') }}</span>
          <NSelect
            size="small"
            class="w-100px"
            :value="([30, 50, 80, 100].includes(outTopN) ? outTopN : null) as number | null"
            :options="presetTopOptions"
            :placeholder="$t('page.wms.outstockDataDashboard.presetPlaceholder')"
            clearable
            @update:value="v => v != null && onOutPresetSelect(v)"
          />
          <NInputNumber
            v-model:value="outTopN"
            size="small"
            class="w-130px"
            :min="1"
            :max="500"
            :show-button="false"
            :placeholder="$t('page.wms.outstockDataDashboard.manualPlaceholder')"
          />
          <NButton size="small" type="primary" :loading="outLoading" @click="loadOutstock">
            {{ $t('common.refresh') }}
          </NButton>
        </NSpace>
      </div>
      <div class="mt-12px text-12px op-70">
        {{
          $t('page.wms.outstockDataDashboard.statsLine', {
            warehouses: outTotalWarehouses,
            shown: outChartRows.length
          })
        }}
      </div>
    </NCard>

    <NCard :bordered="false" size="small" class="card-wrapper">
      <NSpin :show="outLoading" class="min-h-400px w-full">
        <div ref="outDomRef" class="h-400px w-full" />
      </NSpin>
    </NCard>
  </div>
</template>

<style scoped></style>
