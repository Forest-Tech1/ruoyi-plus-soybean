<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue';
import type { SelectOption } from 'naive-ui';
import { NButton, NCard, NInputNumber, NRadio, NRadioGroup, NSelect, NSpace, NTag } from 'naive-ui';
import { useLoading } from '@sa/hooks';
import {
  fetchGetPlatformList,
  fetchGetPlatformWarehouseList
} from '@/service/api/basic/platform-warehouse';
import { fetchGetWarehouseAreaList } from '@/service/api/wms/warehouse-area';
import { fetchGetWarehouseLocationList } from '@/service/api/wms/location';
import {
  fetchCreatePutawayRule,
  fetchUpdatePutawayRule
} from '@/service/api/wms/putaway-rule';
import { useDict } from '@/hooks/business/dict';
import { $t } from '@/locales';
import { WMS_DICT_DELIVERY_TYPE } from '@/constants/wms-devanning';

defineOptions({
  name: 'PutawayRuleOperateModal'
});

interface Props {
  /** 编辑时传入 */
  ruleId?: CommonType.IdType | null;
  /** 列表行 rulePayload，编辑回填 */
  initialPayload?: string | null;
}

const props = withDefaults(defineProps<Props>(), {
  ruleId: null,
  initialPayload: null
});

interface Emits {
  (e: 'submitted'): void;
}

const emit = defineEmits<Emits>();

const visible = defineModel<boolean>('visible', { default: false });
const { loading, startLoading, endLoading } = useLoading();

/** 规则对象维度：四选一，仅当前维度下的多选生效 */
type TargetKind = 'warehouse_area' | 'warehouse_location' | 'area_type' | 'storage_method';

type RuleScopeV3 = {
  targetKind: TargetKind;
  /**
   * `warehouse_area`：仅 `warehouseAreaIds` 非 null；
   * `warehouse_location`：**库区 + 库位** — `warehouseAreaIds`（必填，可多库区）与 `warehouseLocationIds`（可多选）均非 null，其余为 null；
   * 其它维度：仅对应一项数组非 null。
   */
  warehouseAreaIds: CommonType.IdType[] | null;
  warehouseLocationIds: CommonType.IdType[] | null;
  areaTypes: string[] | null;
  storageMethods: string[] | null;
};

type ScopeFormModel = {
  targetKind: TargetKind;
  warehouseAreaIds: CommonType.IdType[];
  warehouseLocationIds: CommonType.IdType[];
  areaTypes: string[];
  storageMethods: string[];
};

type ConditionLine = {
  priority: number | null;
  dispatchMethod: string | null;
  platformId: CommonType.IdType | null;
  platformCodes: string[];
};

type RulePayloadV3 = {
  version: 3;
  scope: RuleScopeV3;
  conditionOp: 'AND' | 'OR';
  conditions: ConditionLine[];
};

const scopeModel = reactive<ScopeFormModel>({
  targetKind: 'warehouse_area',
  warehouseAreaIds: [],
  warehouseLocationIds: [],
  areaTypes: [],
  storageMethods: []
});

const conditionOp = ref<'AND' | 'OR'>('OR');
const conditions = reactive<ConditionLine[]>([]);

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

/** 「库区 + 库位」模式下：已选库区对应的库区名称集合，与库位 `zoneCode` 对齐（与兜底分配弹窗一致） */
const selectedZoneNameSet = computed(() => {
  if (scopeModel.targetKind !== 'warehouse_location') return new Set<string>();
  const ids = scopeModel.warehouseAreaIds;
  if (!ids?.length) return new Set<string>();
  const idSet = new Set(ids.map(String));
  return new Set(
    areas.value
      .filter(a => a.id != null && idSet.has(String(a.id)))
      .map(a => String(a.areaName ?? '').trim())
      .filter(Boolean)
  );
});

/** 仅展示所选库区下的库位，按库位编码升序 */
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

function pruneScopeLocationIds() {
  if (scopeModel.targetKind !== 'warehouse_location') return;
  const allowed = new Set(locationsInSelectedZones.value.map(l => String(l.id)));
  if (!scopeModel.warehouseAreaIds.length) {
    scopeModel.warehouseLocationIds = [];
    return;
  }
  scopeModel.warehouseLocationIds = scopeModel.warehouseLocationIds.filter(id => allowed.has(String(id)));
}

const platformLoading = ref(false);
const platforms = ref<Api.Basic.Platform[]>([]);
const platformOptions = computed<SelectOption[]>(() =>
  platforms.value.map(p => ({
    label: `${p.platformName} (${p.platformCode})`,
    value: p.id
  }))
);

const warehouseCodeOptionsByPlatform = reactive<Record<string, SelectOption[]>>({});
const warehouseCodesLoadingPlatformId = ref<CommonType.IdType | null>(null);
const warehouseCodesLoadPending = new Set<string>();
const warehouseCodesFetched = new Set<string>();

const { options: dispatchMethodOptions } = useDict(WMS_DICT_DELIVERY_TYPE, true);
const { options: areaTypeDictOptions } = useDict('wms_warehouse_area_type', true);
const { options: storageMethodDictOptions } = useDict('wms_storage_method', true);

function createEmptyCondition(): ConditionLine {
  return {
    priority: null,
    dispatchMethod: null,
    platformId: null,
    platformCodes: []
  };
}

function isTargetKind(v: string): v is TargetKind {
  return v === 'warehouse_area' || v === 'warehouse_location' || v === 'area_type' || v === 'storage_method';
}

function onTargetKindChange(kind: string) {
  if (!isTargetKind(kind)) return;
  const prev = scopeModel.targetKind;
  scopeModel.targetKind = kind;
  if (prev !== kind) {
    scopeModel.warehouseAreaIds = [];
    scopeModel.warehouseLocationIds = [];
    scopeModel.areaTypes = [];
    scopeModel.storageMethods = [];
  }
}

function scopeV3ToForm(s: RuleScopeV3): void {
  const tk = (s as { targetKind?: string })?.targetKind;
  scopeModel.targetKind = isTargetKind(String(tk)) ? (tk as TargetKind) : 'warehouse_area';
  scopeModel.warehouseAreaIds = Array.isArray(s?.warehouseAreaIds) ? [...s.warehouseAreaIds] : [];
  scopeModel.warehouseLocationIds = Array.isArray(s?.warehouseLocationIds) ? [...s.warehouseLocationIds] : [];
  scopeModel.areaTypes = Array.isArray(s?.areaTypes) ? [...s.areaTypes] : [];
  scopeModel.storageMethods = Array.isArray(s?.storageMethods) ? [...s.storageMethods] : [];
}

/** 旧版 v2 单选 scope → v3 */
function migrateScopeV2ToV3(scope: Record<string, unknown>): RuleScopeV3 {
  const wa = scope.warehouseAreaId;
  const wl = scope.warehouseLocationId;
  const at = scope.areaType;
  const sm = scope.storageMethod;
  if (wl != null && wl !== '') {
    return {
      targetKind: 'warehouse_location',
      warehouseAreaIds: wa != null && wa !== '' ? [wa as CommonType.IdType] : [],
      warehouseLocationIds: [wl as CommonType.IdType],
      areaTypes: null,
      storageMethods: null
    };
  }
  if (wa != null && wa !== '') {
    return {
      targetKind: 'warehouse_area',
      warehouseAreaIds: [wa as CommonType.IdType],
      warehouseLocationIds: null,
      areaTypes: null,
      storageMethods: null
    };
  }
  if (at != null && at !== '') {
    return {
      targetKind: 'area_type',
      warehouseAreaIds: null,
      warehouseLocationIds: null,
      areaTypes: [String(at)],
      storageMethods: null
    };
  }
  if (sm != null && sm !== '') {
    return {
      targetKind: 'storage_method',
      warehouseAreaIds: null,
      warehouseLocationIds: null,
      areaTypes: null,
      storageMethods: [String(sm)]
    };
  }
  return {
    targetKind: 'warehouse_area',
    warehouseAreaIds: [],
    warehouseLocationIds: null,
    areaTypes: null,
    storageMethods: null
  };
}

function parseStoredPayload(raw: string): RulePayloadV3 | null {
  try {
    const obj = JSON.parse(raw) as Record<string, unknown>;
    if (!obj || typeof obj !== 'object' || !Array.isArray(obj.conditions)) return null;
    const ver = Number(obj.version);
    if (ver === 3 && obj.scope && typeof obj.scope === 'object') {
      const sc = { ...(obj.scope as object) } as RuleScopeV3;
      if (sc.targetKind === 'warehouse_location') {
        if (!Array.isArray(sc.warehouseAreaIds)) sc.warehouseAreaIds = [];
        if (!Array.isArray(sc.warehouseLocationIds)) sc.warehouseLocationIds = [];
      }
      return {
        version: 3,
        scope: sc,
        conditionOp: obj.conditionOp === 'AND' ? 'AND' : 'OR',
        conditions: (obj.conditions as ConditionLine[]).map(c => ({
          priority: c.priority ?? null,
          dispatchMethod: c.dispatchMethod ?? null,
          platformId: c.platformId ?? null,
          platformCodes: Array.isArray(c.platformCodes) ? [...c.platformCodes] : []
        }))
      };
    }
    if (ver === 2 && obj.scope && typeof obj.scope === 'object') {
      return {
        version: 3,
        scope: migrateScopeV2ToV3(obj.scope as Record<string, unknown>),
        conditionOp: obj.conditionOp === 'AND' ? 'AND' : 'OR',
        conditions: (obj.conditions as ConditionLine[]).map(c => ({
          priority: c.priority ?? null,
          dispatchMethod: c.dispatchMethod ?? null,
          platformId: c.platformId ?? null,
          platformCodes: Array.isArray(c.platformCodes) ? [...c.platformCodes] : []
        }))
      };
    }
  } catch {
    return null;
  }
  return null;
}

function defaultPayload(): RulePayloadV3 {
  return {
    version: 3,
    scope: {
      targetKind: 'warehouse_area',
      warehouseAreaIds: [],
      warehouseLocationIds: null,
      areaTypes: null,
      storageMethods: null
    },
    conditionOp: 'OR',
    conditions: [createEmptyCondition()]
  };
}

function applyPayload(p: RulePayloadV3) {
  scopeV3ToForm(p.scope);
  conditionOp.value = p.conditionOp === 'AND' ? 'AND' : 'OR';
  conditions.splice(
    0,
    conditions.length,
    ...(p.conditions?.length ? p.conditions.map(c => ({ ...c, platformCodes: [...(c.platformCodes ?? [])] })) : [createEmptyCondition()])
  );
}

function buildScopePayload(): RuleScopeV3 {
  const k = scopeModel.targetKind;
  if (k === 'warehouse_area') {
    return {
      targetKind: 'warehouse_area',
      warehouseAreaIds: [...scopeModel.warehouseAreaIds],
      warehouseLocationIds: null,
      areaTypes: null,
      storageMethods: null
    };
  }
  if (k === 'warehouse_location') {
    return {
      targetKind: 'warehouse_location',
      warehouseAreaIds: [...scopeModel.warehouseAreaIds],
      warehouseLocationIds: [...scopeModel.warehouseLocationIds],
      areaTypes: null,
      storageMethods: null
    };
  }
  if (k === 'area_type') {
    return {
      targetKind: 'area_type',
      warehouseAreaIds: null,
      warehouseLocationIds: null,
      areaTypes: [...scopeModel.areaTypes],
      storageMethods: null
    };
  }
  return {
    targetKind: 'storage_method',
    warehouseAreaIds: null,
    warehouseLocationIds: null,
    areaTypes: null,
    storageMethods: [...scopeModel.storageMethods]
  };
}

function resetFromProps() {
  warehouseCodesFetched.clear();
  Object.keys(warehouseCodeOptionsByPlatform).forEach(k => delete warehouseCodeOptionsByPlatform[k]);
  const raw = props.initialPayload?.trim();
  if (raw) {
    const parsed = parseStoredPayload(raw);
    if (parsed) {
      applyPayload(parsed);
      const pids = new Set(
        conditions.map(c => c.platformId).filter((id): id is CommonType.IdType => id != null)
      );
      pids.forEach(id => void loadWarehouseCodeOptionsForPlatform(id));
      return;
    }
  }
  applyPayload(defaultPayload());
}

const scopeMultiPlaceholder = computed(() => {
  const k = scopeModel.targetKind;
  if (k === 'warehouse_area') return $t('page.wms.putawayRule.multiSelectArea');
  if (k === 'warehouse_location') return '';
  if (k === 'area_type') return $t('page.wms.putawayRule.multiSelectAreaType');
  return $t('page.wms.putawayRule.multiSelectStorage');
});

function getWarehouseCodeOptions(platformId: CommonType.IdType | null) {
  if (platformId == null) return [];
  return warehouseCodeOptionsByPlatform[String(platformId)] ?? [];
}

async function loadWarehouseCodeOptionsForPlatform(platformId: CommonType.IdType) {
  const key = String(platformId);
  if (warehouseCodesFetched.has(key) || warehouseCodesLoadPending.has(key)) return;
  warehouseCodesLoadPending.add(key);
  warehouseCodesLoadingPlatformId.value = platformId;
  let aborted = false;
  try {
    const acc: SelectOption[] = [];
    let pageNum = 1;
    let total = 0;
    const pageSize = 500;
    do {
      const { data, error } = await fetchGetPlatformWarehouseList({
        platformId,
        pageNum,
        pageSize,
        keyword: null,
        status: '0',
        countryCodes: null
      });
      if (error || !data) {
        aborted = true;
        break;
      }
      total = data.total ?? 0;
      for (const w of data.rows ?? []) {
        const code = (w.warehouseCode ?? '').trim().toUpperCase();
        if (!code) continue;
        acc.push({ label: code, value: code });
      }
      pageNum += 1;
    } while (acc.length < total && pageNum <= 50);
    if (aborted) return;
    const seen = new Set<string>();
    warehouseCodeOptionsByPlatform[key] = acc.filter(o => {
      const v = String(o.value);
      if (seen.has(v)) return false;
      seen.add(v);
      return true;
    });
    warehouseCodesFetched.add(key);
  } finally {
    warehouseCodesLoadPending.delete(key);
    if (String(warehouseCodesLoadingPlatformId.value) === key) {
      warehouseCodesLoadingPlatformId.value = null;
    }
  }
}

function onConditionPlatformUpdate(row: ConditionLine, platformId: CommonType.IdType | null) {
  row.platformId = platformId;
  row.platformCodes = [];
  if (platformId != null) void loadWarehouseCodeOptionsForPlatform(platformId);
}

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
  if (error || !data) {
    areas.value = [];
    return;
  }
  areas.value = data.rows ?? [];
}

async function loadLocations() {
  if (locationLoading.value) return;
  locationLoading.value = true;
  const { data, error } = await fetchGetWarehouseLocationList({
    pageNum: 1,
    pageSize: 5000,
    keyword: null,
    status: null,
    orderByColumn: 'locationCode',
    isAsc: 'asc'
  });
  locationLoading.value = false;
  if (error || !data) {
    locations.value = [];
    return;
  }
  locations.value = data.rows ?? [];
}

async function loadPlatforms() {
  if (platformLoading.value) return;
  platformLoading.value = true;
  const { data, error } = await fetchGetPlatformList();
  platformLoading.value = false;
  if (error || !data) {
    platforms.value = [];
    return;
  }
  platforms.value = data;
}

function addConditionRow() {
  conditions.push(createEmptyCondition());
}

function removeConditionRow(idx: number) {
  conditions.splice(idx, 1);
  if (!conditions.length) conditions.push(createEmptyCondition());
}

function normalizePlatformCodes(v: unknown) {
  if (!Array.isArray(v)) return [];
  return v
    .map(String)
    .map(s => s.trim().toUpperCase())
    .filter(Boolean)
    .slice(0, 50);
}

async function handleSubmit() {
  const k = scopeModel.targetKind;
  if (k === 'warehouse_area') {
    if (!scopeModel.warehouseAreaIds.length) {
      window.$message?.warning($t('page.wms.putawayRule.scopeNeedOneValue'));
      return;
    }
  } else if (k === 'warehouse_location') {
    if (!scopeModel.warehouseAreaIds.length) {
      window.$message?.warning($t('page.wms.putawayRule.scopeNeedWarehouseArea'));
      return;
    }
  } else if (k === 'area_type') {
    if (!scopeModel.areaTypes.length) {
      window.$message?.warning($t('page.wms.putawayRule.scopeNeedOneValue'));
      return;
    }
  } else if (!scopeModel.storageMethods.length) {
    window.$message?.warning($t('page.wms.putawayRule.scopeNeedOneValue'));
    return;
  }

  for (let i = 0; i < conditions.length; i += 1) {
    const dm = String(conditions[i].dispatchMethod ?? '').trim();
    if (!dm) {
      window.$message?.warning($t('page.wms.putawayRule.dispatchMethodRequired', { index: i + 1 }));
      return;
    }
  }

  const payload: RulePayloadV3 = {
    version: 3,
    scope: buildScopePayload(),
    conditionOp: conditionOp.value,
    conditions: conditions.map(c => {
      const platformId = c.platformId ?? null;
      return {
        priority: c.priority ?? null,
        dispatchMethod: c.dispatchMethod ?? null,
        platformId,
        platformCodes: platformId == null ? [] : normalizePlatformCodes(c.platformCodes)
      };
    })
  };
  const rulePayload = JSON.stringify(payload);
  startLoading();
  if (props.ruleId != null) {
    const { error } = await fetchUpdatePutawayRule({ id: props.ruleId, rulePayload });
    endLoading();
    if (error) return;
  } else {
    const { error } = await fetchCreatePutawayRule({ rulePayload });
    endLoading();
    if (error) return;
  }
  window.$message?.success(props.ruleId != null ? $t('common.updateSuccess') : $t('common.addSuccess'));
  visible.value = false;
  emit('submitted');
}

const conditionOpTagType = computed(() => (conditionOp.value === 'AND' ? 'info' : 'warning'));

/**
 * 弹窗带 `:key` 重建时，子组件可能在 `visible === true` 下挂载，普通 watch 不会触发；
 * 使用 `immediate` 保证打开态挂载时也会拉取库区/库位/平台选项。
 */
watch(
  visible,
  async v => {
    if (!v) return;
    await Promise.all([loadAreas(), loadLocations(), loadPlatforms()]);
    resetFromProps();
    pruneScopeLocationIds();
  },
  { immediate: true }
);

watch(
  () => [scopeModel.targetKind, scopeModel.warehouseAreaIds.slice(), locations.value.length, areas.value.length] as const,
  () => {
    pruneScopeLocationIds();
  }
);
</script>

<template>
  <NModal
    v-model:show="visible"
    preset="card"
    :title="ruleId != null ? $t('page.wms.putawayRule.editRule') : $t('page.wms.putawayRule.addRule')"
    class="w-1080px max-w-[96vw]"
    :bordered="false"
  >
    <div class="flex flex-col gap-16px lg:flex-row">
      <NCard
        size="small"
        :title="$t('page.wms.putawayRule.ruleTarget')"
        class="min-w-0 flex-1 lg:max-w-420px"
        :bordered="true"
      >
        <NSpace vertical size="medium">
          <div class="text-12px text-gray-500 leading-snug">{{ $t('page.wms.putawayRule.targetKindHint') }}</div>
          <NRadioGroup :value="scopeModel.targetKind" name="putaway-rule-target-kind" @update:value="onTargetKindChange">
            <NSpace vertical size="small">
              <NRadio value="warehouse_area">{{ $t('page.wms.putawayRule.targetByArea') }}</NRadio>
              <NRadio value="warehouse_location">{{ $t('page.wms.putawayRule.targetByLocation') }}</NRadio>
              <NRadio value="area_type">{{ $t('page.wms.putawayRule.targetByAreaType') }}</NRadio>
              <NRadio value="storage_method">{{ $t('page.wms.putawayRule.targetByStorage') }}</NRadio>
            </NSpace>
          </NRadioGroup>
          <div class="border-t border-gray-100 pt-10px dark:border-gray-700">
            <div v-if="scopeModel.targetKind === 'warehouse_location'" class="flex flex-col gap-10px">
              <div>
                <div class="mb-6px text-12px text-gray-500">
                  {{ $t('page.wms.putawayRule.locationModeAreaLabel') }}
                  <span class="text-error">*</span>
                </div>
                <NSelect
                  key="wl-area"
                  v-model:value="scopeModel.warehouseAreaIds"
                  multiple
                  clearable
                  filterable
                  :loading="areaLoading"
                  :options="areaOptions"
                  :placeholder="$t('page.wms.putawayRule.multiSelectArea')"
                  class="w-full"
                  @update:value="scopeModel.warehouseLocationIds = []"
                />
              </div>
              <div>
                <div class="mb-6px text-12px text-gray-500">
                  {{ $t('page.wms.putawayRule.locationModeLocationLabel') }}
                </div>
                <NSelect
                  key="wl-loc"
                  v-model:value="scopeModel.warehouseLocationIds"
                  multiple
                  clearable
                  filterable
                  :disabled="!scopeModel.warehouseAreaIds.length"
                  :loading="locationLoading"
                  :options="locationOptions"
                  :placeholder="$t('page.wms.putawayRule.multiSelectLocation')"
                  class="w-full"
                />
              </div>
            </div>
            <template v-else>
              <div v-if="scopeMultiPlaceholder" class="mb-6px text-12px text-gray-500">{{ scopeMultiPlaceholder }}</div>
              <NSelect
                v-if="scopeModel.targetKind === 'warehouse_area'"
                key="wa"
                v-model:value="scopeModel.warehouseAreaIds"
                multiple
                clearable
                filterable
                :loading="areaLoading"
                :options="areaOptions"
                :placeholder="$t('page.wms.putawayRule.multiSelectArea')"
                class="w-full"
              />
              <NSelect
                v-else-if="scopeModel.targetKind === 'area_type'"
                key="at"
                v-model:value="scopeModel.areaTypes"
                multiple
                clearable
                filterable
                :options="areaTypeDictOptions"
                :placeholder="$t('page.wms.putawayRule.multiSelectAreaType')"
                class="w-full"
              />
              <NSelect
                v-else
                key="sm"
                v-model:value="scopeModel.storageMethods"
                multiple
                clearable
                filterable
                :options="storageMethodDictOptions"
                :placeholder="$t('page.wms.putawayRule.multiSelectStorage')"
                class="w-full"
              />
            </template>
          </div>
        </NSpace>
      </NCard>

      <NCard
        size="small"
        :title="$t('page.wms.inventory.warehouseArea.putawayCondition')"
        class="min-w-0 flex-[2]"
        :bordered="true"
      >
        <div class="mb-12px flex flex-wrap items-center gap-12px">
          <span class="text-13px text-gray-600">{{ $t('page.wms.putawayRule.conditionCombine') }}</span>
          <NRadioGroup v-model:value="conditionOp" size="small">
            <NRadio value="AND">{{ $t('page.wms.putawayRule.opAnd') }}</NRadio>
            <NRadio value="OR">{{ $t('page.wms.putawayRule.opOr') }}</NRadio>
          </NRadioGroup>
        </div>

        <div
          class="grid grid-cols-[72px_140px_200px_1fr_72px] items-center gap-8px border-b border-gray-100 px-4px py-8px text-12px text-gray-500 dark:border-gray-700"
        >
          <div>{{ $t('page.wms.inventory.warehouseArea.putawayPriority') }}</div>
          <div>
            <span class="text-error">*</span>{{ $t('page.wms.inventory.warehouseArea.putawayDispatchMethod') }}
          </div>
          <div>{{ $t('page.wms.inventory.warehouseArea.putawayPlatform') }}</div>
          <div>{{ $t('page.wms.inventory.warehouseArea.putawayPlatformCodes') }}</div>
          <div class="text-right">{{ $t('common.operate') }}</div>
        </div>

        <div class="mt-6px flex flex-col gap-8px">
          <template v-for="(r, idx) in conditions" :key="idx">
            <div
              class="grid grid-cols-[72px_140px_200px_1fr_72px] items-center gap-8px rounded-8px bg-gray-50 px-4px py-8px dark:bg-gray-800/50"
            >
              <NInputNumber v-model:value="r.priority" :min="1" :precision="0" size="small" />
              <NSelect
                v-model:value="r.dispatchMethod"
                size="small"
                filterable
                :options="dispatchMethodOptions"
                :placeholder="$t('page.wms.inventory.warehouseArea.putawayDispatchMethodPlaceholder')"
              />
              <NSelect
                :value="r.platformId"
                size="small"
                clearable
                filterable
                :loading="platformLoading"
                :options="platformOptions"
                :placeholder="$t('page.wms.putawayRule.putawayPlatformOptional')"
                @update:value="(v: CommonType.IdType | null) => onConditionPlatformUpdate(r, v)"
              />
              <NSelect
                v-model:value="r.platformCodes"
                size="small"
                multiple
                tag
                filterable
                clearable
                :disabled="r.platformId == null"
                :loading="String(warehouseCodesLoadingPlatformId ?? '') === String(r.platformId ?? '')"
                :options="getWarehouseCodeOptions(r.platformId)"
                :placeholder="$t('page.wms.inventory.warehouseArea.putawayPlatformCodesPlaceholder')"
              />
              <div class="text-right">
                <NButton size="tiny" type="warning" secondary @click="removeConditionRow(idx)">
                  {{ $t('common.delete') }}
                </NButton>
              </div>
            </div>
            <div v-if="idx !== conditions.length - 1" class="flex-center py-2px">
              <NTag :type="conditionOpTagType" size="small" round bordered>
                {{ conditionOp === 'AND' ? $t('page.wms.putawayRule.opAnd') : $t('page.wms.putawayRule.opOr') }}
              </NTag>
            </div>
          </template>
        </div>

        <div class="mt-12px">
          <NButton size="small" type="warning" secondary @click="addConditionRow">{{ $t('common.add') }}</NButton>
        </div>
      </NCard>
    </div>

    <template #footer>
      <NSpace justify="end">
        <NButton @click="visible = false">{{ $t('common.close') }}</NButton>
        <NButton type="primary" :loading="loading" @click="handleSubmit">{{ $t('common.confirm') }}</NButton>
      </NSpace>
    </template>
  </NModal>
</template>
