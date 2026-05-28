<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { NButton, NDescriptions, NDescriptionsItem, NInput, NInputNumber, NModal, NSpace, NTooltip } from 'naive-ui';
import DictTag from '@/components/custom/dict-tag.vue';
import { WMS_DICT_DELIVERY_TYPE } from '@/constants/wms-devanning';
import { fetchUpdateDevanningInboundPlanSystemPreLocation } from '@/service/api/wms/devanning-order';
import {
  parseSystemPreLocationAllocations,
  serializeSystemPreLocationAllocations,
  type WmsPreLocationAllocation
} from '@/utils/wms-devanning-pre-location';
import { $t } from '@/locales';
import DevanningOrderPreLocationMapPickerModal from './devanning-order-pre-location-map-picker-modal.vue';

defineOptions({
  name: 'DevanningOrderInboundPreLocationModal'
});

const visible = defineModel<boolean>('visible', { default: false });

const props = defineProps<{
  orderId: CommonType.IdType | null;
  plan: Api.Wms.DevanningInboundPlan | null;
}>();

const emit = defineEmits<{
  saved: [];
}>();

type EditableLine = WmsPreLocationAllocation & { _key: string };

function newKey() {
  return `${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

const lines = ref<EditableLine[]>([]);
const saving = ref(false);
const mapPickerVisible = ref(false);

function cloneFromPlan(p: Api.Wms.DevanningInboundPlan | null) {
  if (!p) {
    lines.value = [];
    return;
  }
  const parsed = parseSystemPreLocationAllocations(p.systemPreLocation);
  lines.value = parsed.map(l => ({ ...l, _key: newKey() }));
}

watch(
  () => [visible.value, props.plan?.id, props.plan?.systemPreLocation] as const,
  () => {
    if (visible.value && props.plan) {
      cloneFromPlan(props.plan);
    }
  }
);

watch(visible, v => {
  if (v && props.plan) cloneFromPlan(props.plan);
});

function openMapPicker() {
  mapPickerVisible.value = true;
}

function mergeAllocationsFromMap(rows: WmsPreLocationAllocation[]) {
  for (const row of rows) {
    const code = String(row.locationCode ?? '').trim();
    if (!code) continue;
    const n = Math.max(0, Math.floor(Number(row.palletCount) || 0));
    const exist = lines.value.find(l => String(l.locationCode ?? '').trim() === code);
    if (exist) {
      exist.palletCount = Math.max(0, Math.floor(Number(exist.palletCount) || 0) + n);
    } else {
      lines.value.push({ _key: newKey(), locationCode: code, palletCount: n });
    }
  }
}

function removeLine(idx: number) {
  lines.value.splice(idx, 1);
}

const canSubmit = computed(() => {
  if (!props.plan?.id || props.orderId == null) return false;
  if (!lines.value.length) return true;
  return lines.value.every(l => String(l.locationCode ?? '').trim().length > 0);
});

/** 概要区：货物单证一行展示 */
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

async function handleSubmit() {
  if (!props.plan?.id || props.orderId == null || !canSubmit.value) return;
  saving.value = true;
  try {
    const payload = serializeSystemPreLocationAllocations(
      lines.value.map(({ locationCode, palletCount }) => ({ locationCode, palletCount }))
    );
    const { error } = await fetchUpdateDevanningInboundPlanSystemPreLocation({
      id: props.plan.id,
      orderId: props.orderId,
      systemPreLocation: payload
    });
    if (error) return;
    window.$message?.success($t('common.updateSuccess'));
    visible.value = false;
    emit('saved');
  } finally {
    saving.value = false;
  }
}
</script>

<template>
  <NModal
    v-model:show="visible"
    preset="card"
    :title="$t('page.wms.devanningOrder.inboundPlan.editSystemPreLocationTitle')"
    class="w-[min(640px,94vw)] max-w-94%"
    :bordered="false"
    :mask-closable="false"
  >
    <div v-if="plan" class="flex flex-col gap-10px">
      <div class="rd-6px border border-gray-200 bg-gray-50/80 px-8px py-6px dark:border-gray-600 dark:bg-white/5">
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

      <p class="text-12px text-gray-500 leading-snug">
        {{ $t('page.wms.devanningOrder.inboundPlan.editSystemPreLocationHint') }}
      </p>

      <div class="text-12px font-600 text-slate-800 dark:text-slate-100">
        {{ $t('page.wms.devanningOrder.inboundPlan.preLocationAllocatedLinesTitle') }}
      </div>
      <div class="max-h-360px overflow-y-auto flex flex-col gap-8px">
        <div
          v-for="(line, idx) in lines"
          :key="line._key"
          class="flex flex-wrap items-center gap-8px rd-4px bg-gray-50 px-12px py-8px dark:bg-white/5"
        >
          <span class="text-12px text-gray-500 w-40px shrink-0">{{ idx + 1 }}</span>
          <NInput
            v-model:value="line.locationCode"
            class="min-w-160px flex-1"
            :placeholder="$t('page.wms.devanningOrder.inboundPlan.preLocationCodePlaceholder')"
          />
          <NInputNumber
            v-model:value="line.palletCount"
            class="w-120px"
            :min="0"
            :precision="0"
            :placeholder="$t('page.wms.devanningOrder.inboundPlan.preLocationPalletPlaceholder')"
          />
          <NButton quaternary type="error" size="small" @click="removeLine(idx)">
            {{ $t('common.delete') }}
          </NButton>
        </div>
        <NButton dashed block @click="openMapPicker">
          {{ $t('page.wms.devanningOrder.inboundPlan.addPreLocationLine') }}
        </NButton>
      </div>
      <DevanningOrderPreLocationMapPickerModal v-model:visible="mapPickerVisible" :plan="plan" @confirm="mergeAllocationsFromMap" />
      <NSpace justify="end">
        <NButton @click="visible = false">{{ $t('common.cancel') }}</NButton>
        <NButton type="primary" :loading="saving" :disabled="!canSubmit" @click="handleSubmit">
          {{ $t('common.confirm') }}
        </NButton>
      </NSpace>
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
