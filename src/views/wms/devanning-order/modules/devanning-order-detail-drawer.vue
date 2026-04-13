<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { useWindowSize } from '@vueuse/core';
import { fetchGetDevanningOrderDetail } from '@/service/api/wms/devanning-order';
import { WMS_DICT_DEVANNING_ROUND, WMS_DICT_ORDER_LEVEL } from '@/constants/wms-devanning';
import DictTag from '@/components/custom/dict-tag.vue';
import { $t } from '@/locales';
import DevanningOrderInboundPlanTab from './devanning-order-inbound-plan-tab.vue';

defineOptions({
  name: 'DevanningOrderDetailDrawer'
});

const visible = defineModel<boolean>('visible', { default: false });

const props = defineProps<{
  orderId: CommonType.IdType | null;
}>();

const { width } = useWindowSize();
const drawerWidth = computed(() => Math.max(360, Math.floor((width.value * 2) / 3)));

const activeTab = ref<'basic' | 'inbound'>('basic');

const loading = ref(false);
const detail = ref<Api.Wms.DevanningOrder | null>(null);

const statusLabel = computed(() => {
  const s = detail.value?.status;
  if (!s) return '-';
  const map: Record<Api.Wms.DevanningOrderStatus, string> = {
    pending_schedule: $t('page.wms.devanningOrder.statusEnum.pending_schedule'),
    pending_devanning: $t('page.wms.devanningOrder.statusEnum.pending_devanning'),
    completed: $t('page.wms.devanningOrder.statusEnum.completed'),
    abnormal: $t('page.wms.devanningOrder.statusEnum.abnormal')
  };
  return map[s];
});

async function loadDetail() {
  if (!props.orderId) {
    detail.value = null;
    return;
  }
  loading.value = true;
  try {
    const { data, error } = await fetchGetDevanningOrderDetail(props.orderId);
    if (!error) {
      detail.value = data;
    }
  } finally {
    loading.value = false;
  }
}

watch(visible, v => {
  if (v && props.orderId) {
    activeTab.value = 'basic';
    loadDetail();
  }
  if (!v) {
    activeTab.value = 'basic';
  }
});
</script>

<template>
  <NDrawer v-model:show="visible" :width="drawerWidth" display-directive="show" class="max-w-full">
    <NDrawerContent :title="$t('page.wms.devanningOrder.detailTitle')" closable>
      <NSpin :show="loading" class="min-h-0 flex min-h-400px flex-1 flex-col">
        <NTabs v-model:value="activeTab" type="line" class="min-h-0 flex-1">
          <NTabPane name="basic" :tab="$t('page.wms.devanningOrder.detailTabBasic')">
            <div class="max-h-[calc(100vh-160px)] overflow-y-auto pr-8px">
              <NDescriptions v-if="detail" label-placement="left" bordered :column="1" size="small">
                <NDescriptionsItem :label="$t('page.wms.devanningOrder.coNo')">
                  {{ detail.coNo }}
                </NDescriptionsItem>
                <NDescriptionsItem :label="$t('page.wms.devanningOrder.orderDate')">
                  {{ detail.orderDate }}
                </NDescriptionsItem>
                <NDescriptionsItem :label="$t('page.wms.devanningOrder.blNo')">
                  {{ detail.blNo }}
                </NDescriptionsItem>
                <NDescriptionsItem :label="$t('page.wms.devanningOrder.statusColumn')">
                  {{ statusLabel }}
                </NDescriptionsItem>
                <NDescriptionsItem :label="$t('page.wms.devanningOrder.devanningCompleteTime')">
                  {{ detail.devanningCompleteTime }}
                </NDescriptionsItem>
                <NDescriptionsItem :label="$t('page.wms.devanningOrder.expectedDevanningTime')">
                  {{ detail.expectedDevanningTime ? String(detail.expectedDevanningTime).slice(0, 10) : '—' }}
                </NDescriptionsItem>
                <NDescriptionsItem :label="$t('page.wms.devanningOrder.inboundWarehouse')">
                  {{ detail.inboundWarehouse }}
                </NDescriptionsItem>
                <NDescriptionsItem :label="$t('page.wms.devanningOrder.orderLevel')">
                  <DictTag
                    v-if="detail.orderLevel"
                    :dict-code="WMS_DICT_ORDER_LEVEL"
                    :value="detail.orderLevel"
                    immediate
                  />
                  <template v-else>—</template>
                </NDescriptionsItem>
                <NDescriptionsItem :label="$t('page.wms.devanningOrder.devanningDock')">
                  {{ detail.devanningDock }}
                </NDescriptionsItem>
                <NDescriptionsItem :label="$t('page.wms.devanningOrder.cargoQty')">
                  {{ detail.cargoQty }}
                </NDescriptionsItem>
                <NDescriptionsItem :label="$t('page.wms.devanningOrder.cargoWeight')">
                  {{ detail.cargoWeight }}
                </NDescriptionsItem>
                <NDescriptionsItem :label="$t('page.wms.devanningOrder.devanningRound')">
                  <DictTag
                    v-if="detail.devanningRound"
                    :dict-code="WMS_DICT_DEVANNING_ROUND"
                    :value="detail.devanningRound"
                    immediate
                  />
                  <template v-else>—</template>
                </NDescriptionsItem>
                <NDescriptionsItem :label="$t('page.common.remark')">{{ detail.remark }}</NDescriptionsItem>
              </NDescriptions>
            </div>
          </NTabPane>
          <NTabPane name="inbound" :tab="$t('page.wms.devanningOrder.detailTabInbound')">
            <div class="min-h-320px">
              <DevanningOrderInboundPlanTab
                v-if="activeTab === 'inbound' && props.orderId"
                :order-id="props.orderId"
                :co-no="detail?.coNo"
              />
            </div>
          </NTabPane>
        </NTabs>
      </NSpin>
    </NDrawerContent>
  </NDrawer>
</template>

<style scoped></style>
