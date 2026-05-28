<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue';
import type { SelectOption } from 'naive-ui';
import { useLoading } from '@sa/hooks';
import { fetchGetWarehouseAreaList } from '@/service/api/wms/warehouse-area';
import { fetchGetWarehouseLocationList } from '@/service/api/wms/location';
import {
  fetchGetPutawayFallbackAllocation,
  fetchSavePutawayFallbackAllocation
} from '@/service/api/wms/putaway-rule';
import { $t } from '@/locales';

defineOptions({
  name: 'PutawayFallbackAllocationModal'
});

interface Emits {
  (e: 'submitted'): void;
}

const emit = defineEmits<Emits>();

const visible = defineModel<boolean>('visible', { default: false });
const { loading, startLoading, endLoading } = useLoading();

const areaLoading = ref(false);
const areas = ref<Api.Wms.WarehouseArea[]>([]);
const areaOptions = computed<SelectOption[]>(() =>
  areas.value.map(a => ({
    label: a.areaName,
    value: a.id!
  }))
);

const locationLoading = ref(false);
const locations = ref<Api.Wms.WarehouseLocation[]>([]);

const form = reactive<{
  warehouseAreaIds: CommonType.IdType[];
  warehouseLocationIds: CommonType.IdType[];
}>({
  warehouseAreaIds: [],
  warehouseLocationIds: []
});

/** 已选库区对应的 `areaName` 集合，用于与库位 `zoneCode` 对齐 */
const selectedZoneNameSet = computed(() => {
  const ids = form.warehouseAreaIds;
  if (!ids?.length) return new Set<string>();
  const idSet = new Set(ids.map(String));
  return new Set(
    areas.value.filter(a => a.id != null && idSet.has(String(a.id))).map(a => String(a.areaName ?? '').trim())
  );
});

const locationsInSelectedZones = computed(() => {
  const zones = selectedZoneNameSet.value;
  if (!zones.size) return [];
  const filtered = locations.value.filter(l => {
    const z = String(l.zoneCode ?? '').trim();
    return z && zones.has(z);
  });
  return [...filtered].sort((a, b) => {
    const ca = String(a.locationCode ?? '').trim();
    const cb = String(b.locationCode ?? '').trim();
    if (ca !== cb) return ca.localeCompare(cb, undefined, { numeric: true });
    return String(a.id).localeCompare(String(b.id));
  });
});

const locationOptions = computed<SelectOption[]>(() =>
  locationsInSelectedZones.value.map(l => ({
    label: [l.zoneCode, l.locationCode].filter(Boolean).join(' / ') || String(l.id),
    value: l.id!
  }))
);

function pruneLocationIds() {
  const allowed = new Set(locationsInSelectedZones.value.map(l => String(l.id)));
  form.warehouseLocationIds = form.warehouseLocationIds.filter(id => allowed.has(String(id)));
}

watch(
  () => form.warehouseAreaIds,
  () => {
    pruneLocationIds();
  }
);

async function loadAreas() {
  if (areaLoading.value) return;
  areaLoading.value = true;
  const { data, error } = await fetchGetWarehouseAreaList({
    pageNum: 1,
    pageSize: 1000,
    areaName: null,
    areaType: null,
    storageMethod: null,
    orderByColumn: 'createTime',
    isAsc: 'desc'
  });
  areaLoading.value = false;
  areas.value = error || !data ? [] : data.rows ?? [];
}

async function loadLocations() {
  if (locationLoading.value) return;
  locationLoading.value = true;
  const { data, error } = await fetchGetWarehouseLocationList({
    pageNum: 1,
    pageSize: 5000,
    zoneCode: null,
    locationKeyword: null,
    keyword: null,
    status: null,
    orderByColumn: 'locationCode',
    isAsc: 'asc'
  });
  locationLoading.value = false;
  locations.value = error || !data ? [] : data.rows ?? [];
}

async function loadSaved() {
  const { data, error } = await fetchGetPutawayFallbackAllocation();
  if (error || !data) {
    form.warehouseAreaIds = [];
    form.warehouseLocationIds = [];
    return;
  }
  form.warehouseAreaIds = Array.isArray(data.warehouseAreaIds) ? [...data.warehouseAreaIds] : [];
  form.warehouseLocationIds = Array.isArray(data.warehouseLocationIds) ? [...data.warehouseLocationIds] : [];
  pruneLocationIds();
}

async function openSetup() {
  await Promise.all([loadAreas(), loadLocations()]);
  await loadSaved();
}

watch(visible, v => {
  if (v) void openSetup();
});

function clearFallbackAreas() {
  form.warehouseAreaIds = [];
  form.warehouseLocationIds = [];
}

async function handleSubmit() {
  startLoading();
  const { error } = await fetchSavePutawayFallbackAllocation({
    warehouseAreaIds: [...form.warehouseAreaIds],
    warehouseLocationIds: [...form.warehouseLocationIds]
  });
  endLoading();
  if (error) return;
  window.$message?.success($t('common.updateSuccess'));
  visible.value = false;
  emit('submitted');
}
</script>

<template>
  <NModal
    v-model:show="visible"
    preset="card"
    :title="$t('page.wms.putawayRule.fallbackModalTitle')"
    class="w-560px max-w-[96vw]"
    :bordered="false"
    :mask-closable="false"
  >
    <div class="mb-12px text-13px text-gray-600 leading-relaxed dark:text-gray-400">
      {{ $t('page.wms.putawayRule.fallbackHint') }}
    </div>
    <NForm label-placement="left" label-width="auto">
      <NFormItem :label="$t('page.wms.putawayRule.fallbackAreaLabel')">
        <div class="flex w-full flex-wrap items-start gap-8px">
          <NSelect
            v-model:value="form.warehouseAreaIds"
            multiple
            filterable
            clearable
            :loading="areaLoading"
            :options="areaOptions"
            :placeholder="$t('page.wms.putawayRule.fallbackAreaPlaceholder')"
            class="min-w-0 flex-1"
          />
          <NButton secondary size="small" class="shrink-0" @click="clearFallbackAreas">
            {{ $t('page.wms.putawayRule.fallbackClearAreasButton') }}
          </NButton>
        </div>
      </NFormItem>
      <NFormItem :label="$t('page.wms.putawayRule.fallbackLocationLabel')">
        <NSelect
          v-model:value="form.warehouseLocationIds"
          multiple
          filterable
          clearable
          :disabled="!form.warehouseAreaIds.length"
          :loading="locationLoading"
          :options="locationOptions"
          :placeholder="$t('page.wms.putawayRule.fallbackLocationPlaceholder')"
          class="w-full"
        />
      </NFormItem>
    </NForm>
    <template #footer>
      <NSpace justify="end" class="w-full">
        <NButton @click="visible = false">{{ $t('common.cancel') }}</NButton>
        <NButton type="primary" :loading="loading" @click="handleSubmit">{{ $t('common.save') }}</NButton>
      </NSpace>
    </template>
  </NModal>
</template>
