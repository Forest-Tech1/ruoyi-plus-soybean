<script setup lang="ts">
import { computed, ref } from 'vue';
import {
  devanningStatusI18nKey,
  resolveDevanningOrderStatus,
  WMS_DICT_DEVANNING_ROUND
} from '@/constants/wms-devanning';
import DictTag from '@/components/custom/dict-tag.vue';
import { formatExpectedDevanningDateOnly, patchDevanningOrder } from '@/hooks/business/use-devanning-order-patch';
import { useAuth } from '@/hooks/business/auth';
import { $t } from '@/locales';
import SvgIcon from '@/components/custom/svg-icon.vue';
import { getDevanningOrderAttachmentCount } from './devanning-order-attachment-utils';

defineOptions({
  name: 'DevanningOrderDetailBasicTab'
});

const props = defineProps<{
  order: Api.Wms.DevanningOrder;
}>();

const emit = defineEmits<{
  updated: [];
  openAttachments: [];
}>();

const attachmentCount = computed(() => getDevanningOrderAttachmentCount(props.order));
const attachmentButtonLabel = computed(() =>
  attachmentCount.value > 0
    ? $t('page.wms.devanningOrder.attachmentsHas', { count: attachmentCount.value })
    : $t('page.wms.devanningOrder.attachmentsUpload')
);

const { hasAuth } = useAuth();

/** 预计拆柜时间：有编辑权限即可在详情中修改（不限制订单是否已完成） */
const canEditExpectedTime = computed(
  () => hasAuth('wms:devanningOrder:edit') || hasAuth('wms:devanningOrder:add')
);

const savingExpected = ref(false);

const statusLabel = computed(() => {
  const map: Record<Api.Wms.DevanningOrderStatus, string> = {
    pending_schedule: $t('page.wms.devanningOrder.statusEnum.pending_schedule'),
    pending_devanning: $t('page.wms.devanningOrder.statusEnum.pending_devanning'),
    completed: $t('page.wms.devanningOrder.statusEnum.completed'),
    abnormal: $t('page.wms.devanningOrder.statusEnum.abnormal')
  };
  return map[props.order.status] ?? props.order.status;
});

const expectedDateStr = computed(() => formatExpectedDevanningDateOnly(props.order.expectedDevanningTime));

async function onExpectedDateChange(v: string | null) {
  if (v === expectedDateStr.value) return;
  if (savingExpected.value) return;
  savingExpected.value = true;
  try {
    const ok = await patchDevanningOrder(props.order, { expectedDevanningTime: v });
    if (ok) emit('updated');
  } finally {
    savingExpected.value = false;
  }
}
</script>

<template>
  <div class="max-h-[calc(100vh-160px)] overflow-y-auto pr-8px">
    <NDescriptions label-placement="left" bordered :column="1" size="small">
      <NDescriptionsItem :label="$t('page.wms.devanningOrder.coNo')">
        {{ order.coNo }}
      </NDescriptionsItem>
      <NDescriptionsItem :label="$t('page.common.createTime')">
        {{ order.createTime ?? '—' }}
      </NDescriptionsItem>
      <NDescriptionsItem :label="$t('page.wms.devanningOrder.blNo')">
        {{ order.blNo ?? '—' }}
      </NDescriptionsItem>
      <NDescriptionsItem :label="$t('page.wms.devanningOrder.statusColumn')">
        {{ statusLabel }}
      </NDescriptionsItem>
      <NDescriptionsItem :label="$t('page.wms.devanningOrder.devanningCompleteTime')">
        {{ order.devanningCompleteTime ?? '—' }}
      </NDescriptionsItem>
      <NDescriptionsItem :label="$t('page.wms.devanningOrder.expectedDevanningTime')">
        <NDatePicker
          v-if="canEditExpectedTime"
          size="small"
          class="devanning-detail-expected-picker max-w-240px"
          type="date"
          :formatted-value="expectedDateStr"
          value-format="yyyy-MM-dd"
          clearable
          :disabled="savingExpected"
          @update:formatted-value="onExpectedDateChange"
        />
        <template v-else>
          {{ expectedDateStr ?? '—' }}
        </template>
      </NDescriptionsItem>
      <NDescriptionsItem :label="$t('page.wms.devanningOrder.inboundWarehouse')">
        {{ order.inboundWarehouse ?? '—' }}
      </NDescriptionsItem>
      <NDescriptionsItem :label="$t('page.wms.devanningOrder.orderLevel')">
        {{ order.orderLevel ?? '—' }}
      </NDescriptionsItem>
      <NDescriptionsItem :label="$t('page.wms.devanningOrder.devanningStatus')">
        {{
          (() => {
            const s = resolveDevanningOrderStatus(order);
            const key = devanningStatusI18nKey(s);
            return key ? $t(key) : '—';
          })()
        }}
      </NDescriptionsItem>
      <NDescriptionsItem :label="$t('page.wms.devanningOrder.queuePosition')">
        {{ order.queuePosition ?? '—' }}
      </NDescriptionsItem>
      <NDescriptionsItem :label="$t('page.wms.devanningOrder.devanningDock')">
        {{ order.devanningDock ?? '—' }}
      </NDescriptionsItem>
      <NDescriptionsItem :label="$t('page.wms.devanningOrder.driverPhone')">
        {{ order.driverPhone ?? '—' }}
      </NDescriptionsItem>
      <NDescriptionsItem :label="$t('page.wms.devanningOrder.cargoQty')">
        {{ order.cargoQty ?? '—' }}
      </NDescriptionsItem>
      <NDescriptionsItem :label="$t('page.wms.devanningOrder.cargoWeight')">
        {{ order.cargoWeight ?? '—' }}
      </NDescriptionsItem>
      <NDescriptionsItem :label="$t('page.wms.devanningOrder.devanningRound')">
        <DictTag
          v-if="order.devanningRound"
          :dict-code="WMS_DICT_DEVANNING_ROUND"
          :value="order.devanningRound"
          immediate
        />
        <template v-else>—</template>
      </NDescriptionsItem>
      <NDescriptionsItem :label="$t('page.common.remark')">
        {{ order.remark?.trim() ? order.remark : '—' }}
      </NDescriptionsItem>
      <NDescriptionsItem :label="$t('page.wms.devanningOrder.attachmentsColumn')">
        <NButton
          size="tiny"
          secondary
          :type="attachmentCount > 0 ? 'success' : 'primary'"
          @click="emit('openAttachments')"
        >
          <span class="inline-flex items-center gap-4px">
            <SvgIcon icon="material-symbols:attach-file" class="text-16px" />
            <span>{{ attachmentButtonLabel }}</span>
          </span>
        </NButton>
      </NDescriptionsItem>
    </NDescriptions>
  </div>
</template>

<style scoped>
.devanning-detail-expected-picker {
  width: 100%;
}
</style>
