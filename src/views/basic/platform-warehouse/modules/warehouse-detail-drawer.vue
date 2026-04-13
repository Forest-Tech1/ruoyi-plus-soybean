<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import {
  NDescriptions,
  NDescriptionsItem,
  NDrawer,
  NDrawerContent,
  NEmpty,
  NSpin,
  NTimeline,
  NTimelineItem
} from 'naive-ui';
import { fetchGetPlatformWarehouseDetail } from '@/service/api/basic/platform-warehouse';
import { countryFlagEmoji, getCountryLabel } from '@/constants/basic-platform';
import { useAppStore } from '@/store/modules/app';
import { $t } from '@/locales';

defineOptions({
  name: 'WarehouseDetailDrawer'
});

const visible = defineModel<boolean>('visible', { default: false });

const props = defineProps<{
  warehouseId: CommonType.IdType | null;
}>();

const appStore = useAppStore();
const loading = ref(false);
const detail = ref<Api.Basic.PlatformWarehouseDetail | null>(null);

const title = computed(() => $t('page.basic.platformWarehouse.warehouseDetail'));

watch(visible, async v => {
  if (v && props.warehouseId) {
    loading.value = true;
    detail.value = null;
    const { data, error } = await fetchGetPlatformWarehouseDetail(props.warehouseId);
    loading.value = false;
    if (!error && data) {
      detail.value = data;
    }
  }
});
</script>

<template>
  <NDrawer v-model:show="visible" :width="520" display-directive="show">
    <NDrawerContent :title="title" closable>
      <NSpin :show="loading">
        <template v-if="detail">
          <NDescriptions label-placement="left" bordered size="small" :column="1" class="mb-16px">
            <NDescriptionsItem :label="$t('page.basic.platformWarehouse.warehouseCodeCol')">
              {{ detail.warehouseCode }}
            </NDescriptionsItem>
            <NDescriptionsItem :label="$t('page.basic.platformWarehouse.warehouseName')">
              {{ detail.warehouseName }}
            </NDescriptionsItem>
            <NDescriptionsItem :label="$t('page.basic.platformWarehouse.country')">
              <span class="inline-flex items-center gap-6px">
                <span class="text-18px">{{ countryFlagEmoji(detail.countryCode) }}</span>
                {{ getCountryLabel(detail.countryCode, appStore.locale) }}
              </span>
            </NDescriptionsItem>
            <NDescriptionsItem :label="$t('page.basic.platformWarehouse.stateProvince')">
              {{ detail.stateProvince || '—' }}
            </NDescriptionsItem>
            <NDescriptionsItem :label="$t('page.basic.platformWarehouse.city')">
              {{ detail.city || '—' }}
            </NDescriptionsItem>
            <NDescriptionsItem :label="$t('page.basic.platformWarehouse.addressLine')">
              {{ detail.addressLine }}
            </NDescriptionsItem>
            <NDescriptionsItem :label="$t('page.basic.platformWarehouse.postalCode')">
              {{ detail.postalCode || '—' }}
            </NDescriptionsItem>
            <NDescriptionsItem :label="$t('page.basic.platformWarehouse.status')">
              {{
                detail.status === '0'
                  ? $t('page.basic.platformWarehouse.enabled')
                  : $t('page.basic.platformWarehouse.disabled')
              }}
            </NDescriptionsItem>
            <NDescriptionsItem :label="$t('page.basic.platformWarehouse.remark')">
              {{ detail.remark || '—' }}
            </NDescriptionsItem>
            <NDescriptionsItem :label="$t('page.basic.platformWarehouse.createTime')">
              {{ detail.createTime || '—' }}
            </NDescriptionsItem>
          </NDescriptions>
          <div class="text-14px font-600 mb-8px">{{ $t('page.basic.platformWarehouse.operateLog') }}</div>
          <NTimeline v-if="detail.operateLogs?.length" size="medium">
            <NTimelineItem v-for="log in detail.operateLogs" :key="String(log.id)" :title="log.operateUserName || '—'">
              <div class="text-12px text-gray-500">{{ log.operateTime }}</div>
              <div>{{ log.changeSummary }}</div>
            </NTimelineItem>
          </NTimeline>
          <NEmpty v-else :description="$t('page.basic.platformWarehouse.noOperateLog')" size="small" />
        </template>
        <NEmpty v-else-if="!loading" :description="$t('common.noData')" />
      </NSpin>
    </NDrawerContent>
  </NDrawer>
</template>
