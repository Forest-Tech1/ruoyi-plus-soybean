<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue';
import type { SelectOption } from 'naive-ui';
import { useLoading } from '@sa/hooks';
import { fetchUpdateWarehouseAreaPutaway } from '@/service/api/wms/warehouse-area';
import { fetchGetPlatformList } from '@/service/api/basic/platform-warehouse';
import { $t } from '@/locales';

defineOptions({
  name: 'WarehouseAreaPutawayModal'
});

interface Props {
  areaId?: CommonType.IdType | null /** 库区 id */;
  initialRemark?: string | null;
}

const props = defineProps<Props>();

interface Emits {
  (e: 'submitted'): void;
}

const emit = defineEmits<Emits>();

const visible = defineModel<boolean>('visible', { default: false });

const { loading, startLoading, endLoading } = useLoading();

type PutawayRuleRow = {
  priority: number | null;
  dispatchMethod: string | null;
  platformId: CommonType.IdType | null;
  platformCodes: string[];
};

type PutawayRulePayload = {
  version: 1;
  op: 'OR';
  rules: PutawayRuleRow[];
};

const formModel = reactive<PutawayRulePayload>({
  version: 1,
  op: 'OR',
  rules: []
});

const platformLoading = ref(false);
const platforms = ref<Api.Basic.Platform[]>([]);

const platformOptions = computed<SelectOption[]>(() =>
  platforms.value.map(p => ({
    label: `${p.platformName} (${p.platformCode})`,
    value: p.id
  }))
);

const dispatchMethodOptions = computed<SelectOption[]>(() => [
  // 目前仅做 UI 占位，后端可按业务字典扩展
  { label: $t('page.wms.inventory.warehouseArea.putawayDispatchMethodPlaceholder'), value: 'placeholder' }
]);

function createEmptyRow(): PutawayRuleRow {
  return {
    priority: null,
    dispatchMethod: null,
    platformId: null,
    platformCodes: []
  };
}

function ensureAtLeastOneRow() {
  if (!formModel.rules.length) formModel.rules.push(createEmptyRow());
}

function parseInitialRemarkToRules(raw: string | null | undefined) {
  if (!raw) return;
  const text = String(raw).trim();
  if (!text) return;
  try {
    const obj = JSON.parse(text) as Partial<PutawayRulePayload>;
    if (obj && obj.version === 1 && Array.isArray(obj.rules)) {
      formModel.rules = obj.rules.map(r => ({
        priority: typeof r.priority === 'number' ? r.priority : null,
        dispatchMethod: typeof r.dispatchMethod === 'string' ? r.dispatchMethod : null,
        platformId: (r.platformId ?? null) as any,
        platformCodes: Array.isArray(r.platformCodes) ? r.platformCodes.filter(Boolean).map(String) : []
      }));
    }
  } catch {
    // 兼容旧的纯文本备注：不做自动转换，让用户重新配置
  }
}

function reset() {
  formModel.rules = [];
  parseInitialRemarkToRules(props.initialRemark);
  ensureAtLeastOneRow();
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

function addRow() {
  formModel.rules.push(createEmptyRow());
}

function removeRow(idx: number) {
  formModel.rules.splice(idx, 1);
  ensureAtLeastOneRow();
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
  if (props.areaId == null) return;
  // 最小校验：至少选择平台；平台代码允许为空（代表全部/不限制）
  const invalid = formModel.rules.some(r => r.platformId == null);
  if (invalid) {
    window.$message?.warning($t('page.wms.inventory.warehouseArea.putawayPlatformRequired'));
    return;
  }

  startLoading();
  const payload: PutawayRulePayload = {
    version: 1,
    op: 'OR',
    rules: formModel.rules.map(r => ({
      priority: r.priority ?? null,
      dispatchMethod: r.dispatchMethod ?? null,
      platformId: r.platformId,
      platformCodes: normalizePlatformCodes(r.platformCodes)
    }))
  };
  const { error } = await fetchUpdateWarehouseAreaPutaway(props.areaId, JSON.stringify(payload));
  endLoading();
  if (error) return;
  window.$message?.success($t('common.updateSuccess'));
  visible.value = false;
  emit('submitted');
}

watch(visible, async v => {
  if (!v) return;
  await loadPlatforms();
  reset();
});
</script>

<template>
  <NModal
    v-model:show="visible"
    preset="card"
    :title="$t('page.wms.inventory.warehouseArea.putawayCondition')"
    class="w-980px"
    :bordered="false"
  >
    <div class="min-h-200px">
      <div
        class="grid grid-cols-[80px_160px_220px_1fr_90px] items-center gap-12px px-8px py-10px text-12px text-gray-500"
      >
        <div>{{ $t('page.wms.inventory.warehouseArea.putawayPriority') }}</div>
        <div>{{ $t('page.wms.inventory.warehouseArea.putawayDispatchMethod') }}</div>
        <div>{{ $t('page.wms.inventory.warehouseArea.putawayPlatform') }}</div>
        <div>{{ $t('page.wms.inventory.warehouseArea.putawayPlatformCodes') }}</div>
        <div class="text-right">{{ $t('common.operate') }}</div>
      </div>

      <div class="mt-6px flex flex-col gap-10px">
        <template v-for="(r, idx) in formModel.rules" :key="idx">
          <div
            class="grid grid-cols-[80px_160px_220px_1fr_90px] items-center gap-12px rounded-8px bg-gray-50 px-8px py-10px dark:bg-gray-800/50"
          >
            <NInputNumber v-model:value="r.priority" :min="1" :precision="0" size="small" />
            <NSelect
              v-model:value="r.dispatchMethod"
              size="small"
              clearable
              filterable
              :options="dispatchMethodOptions"
              :placeholder="$t('page.wms.inventory.warehouseArea.putawayDispatchMethodPlaceholder')"
            />
            <NSelect
              v-model:value="r.platformId"
              size="small"
              clearable
              filterable
              :loading="platformLoading"
              :options="platformOptions"
              :placeholder="$t('page.wms.inventory.warehouseArea.putawayPlatformPlaceholder')"
            />
            <NSelect
              v-model:value="r.platformCodes"
              size="small"
              multiple
              tag
              filterable
              clearable
              :placeholder="$t('page.wms.inventory.warehouseArea.putawayPlatformCodesPlaceholder')"
            />
            <div class="text-right">
              <NButton size="small" type="warning" secondary @click="removeRow(idx)">
                {{ $t('common.delete') }}
              </NButton>
            </div>
          </div>

          <div v-if="idx !== formModel.rules.length - 1" class="flex-center py-2px">
            <NTag type="warning" size="small" round bordered>
              {{ $t('page.wms.inventory.warehouseArea.putawayOr') }}
            </NTag>
          </div>
        </template>
      </div>

      <div class="mt-14px">
        <NButton type="warning" secondary @click="addRow">{{ $t('common.add') }}</NButton>
      </div>
    </div>
    <template #footer>
      <NSpace justify="end">
        <NButton @click="visible = false">{{ $t('common.close') }}</NButton>
        <NButton type="primary" :loading="loading" @click="handleSubmit">{{ $t('common.confirm') }}</NButton>
      </NSpace>
    </template>
  </NModal>
</template>

<style scoped></style>
