<script setup lang="ts">
import { computed, ref } from 'vue';
import { normalizeWarehouseInventoryOutstockResult } from '@/utils/wms-inventory-data-outstock';
import { fetchPostInventoryDataManualOutstock } from '@/service/api/wms/inventory-data';
import { $t } from '@/locales';

defineOptions({
  name: 'InventoryDataManualOutstockModal'
});

interface Emits {
  (e: 'submitted'): void;
}

const emit = defineEmits<Emits>();

const visible = defineModel<boolean>('visible', { default: false });

const props = defineProps<{
  row: Api.Wms.WarehouseInventoryDataLine | null;
}>();

const submitting = ref(false);

/** 整行出库：与列表「打板数」一致，由前端原样提交给后端 */
const fullPalletCount = computed(() => {
  const n = Math.floor(Number(props.row?.palletCount) || 0);
  return n > 0 ? n : 0;
});

const canSubmit = computed(() => {
  if (props.row?.inventoryDetailId == null) return false;
  return fullPalletCount.value > 0;
});

function display(v: unknown) {
  if (v == null || v === '') return '—';
  const s = String(v).trim();
  return s || '—';
}

function close() {
  visible.value = false;
}

async function handleSubmit() {
  const r = props.row;
  const id = r?.inventoryDetailId;
  const pallets = fullPalletCount.value;
  if (id == null || !canSubmit.value) return;
  submitting.value = true;
  try {
    const { data, error } = await fetchPostInventoryDataManualOutstock({
      inventoryDetailId: id,
      palletCount: pallets
    });
    if (error) return;
    const { summary, rows } = normalizeWarehouseInventoryOutstockResult(data);
    const first = rows[0];
    const status = String(first?.outstockStatus ?? first?.status ?? '').toLowerCase();
    const failed = status === 'failed' || status === 'error' || status === 'fail';
    if (failed) {
      const msg = first ? (first.message ?? first.remark ?? first.errorMsg ?? summary) : summary;
      window.$message?.warning(typeof msg === 'string' && msg.trim() ? msg : $t('page.wms.inventoryData.manualOutstockRejected'));
      return;
    }
    if (summary) {
      window.$message?.success(summary);
    } else {
      window.$message?.success($t('page.wms.inventoryData.manualOutstockSuccess'));
    }
    emit('submitted');
    visible.value = false;
  } finally {
    submitting.value = false;
  }
}
</script>

<template>
  <NModal
    v-model:show="visible"
    preset="card"
    :title="$t('page.wms.inventoryData.manualOutstockTitle')"
    class="max-w-[96vw] w-520px"
    :bordered="false"
    display-directive="show"
    :mask-closable="false"
    @close="close"
  >
    <div v-if="row" class="flex flex-col gap-12px">
      <NAlert type="info" :bordered="false">
        {{ $t('page.wms.inventoryData.manualOutstockHint') }}
      </NAlert>

      <NDescriptions label-placement="left" bordered size="small" :column="1">
        <NDescriptionsItem :label="$t('page.wms.inventoryData.orderNo')">
          {{ display(row.systemSoNo) }}
        </NDescriptionsItem>
        <NDescriptionsItem :label="$t('page.wms.inventoryData.coNo')">
          {{ display(row.coNo) }}
        </NDescriptionsItem>
        <NDescriptionsItem :label="$t('page.wms.inventoryData.shipmentCode')">
          {{ display(row.shipmentCode) }}
        </NDescriptionsItem>
        <NDescriptionsItem :label="$t('page.wms.inventoryData.zoneCode')">
          {{ display(row.zoneCode) }}
        </NDescriptionsItem>
        <NDescriptionsItem :label="$t('page.wms.inventoryData.locationCode')">
          {{ display(row.locationCode) }}
        </NDescriptionsItem>
        <NDescriptionsItem :label="$t('page.wms.inventoryData.palletCount')">
          {{ fullPalletCount > 0 ? String(fullPalletCount) : '—' }}
        </NDescriptionsItem>
      </NDescriptions>

      <NAlert v-if="fullPalletCount <= 0" type="warning" :bordered="false">
        {{ $t('page.wms.inventoryData.manualOutstockNoPallet') }}
      </NAlert>

      <NAlert v-else type="default" :bordered="false" class="bg-gray-50 dark:bg-white/5">
        {{ $t('page.wms.inventoryData.manualOutstockOutAllNote', { count: fullPalletCount }) }}
      </NAlert>
    </div>

    <template #footer>
      <NSpace justify="end" :size="12">
        <NButton @click="close">{{ $t('common.cancel') }}</NButton>
        <NButton type="primary" :loading="submitting" :disabled="!canSubmit" @click="handleSubmit">
          {{ $t('page.wms.inventoryData.manualOutstockSubmit') }}
        </NButton>
      </NSpace>
    </template>
  </NModal>
</template>
