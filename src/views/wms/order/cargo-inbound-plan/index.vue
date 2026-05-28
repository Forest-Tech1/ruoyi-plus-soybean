<script setup lang="ts">
import { reactive, ref } from 'vue';
import {
  NButton,
  NCard,
  NCollapse,
  NCollapseItem,
  NForm,
  NFormItemGi,
  NGrid,
  NInput,
  NSpace,
  NTag,
  NTooltip
} from 'naive-ui';
import { $t } from '@/locales';
import DevanningOrderInboundPlanTab from '../devanning-order/modules/devanning-order-inbound-plan-tab.vue';

defineOptions({
  name: 'CargoInboundPlan'
});

type CargoPhaseTab = Api.Wms.CargoInboundInventoryPhase | null;

const cargoPhaseTabs: {
  key: CargoPhaseTab;
  labelKey: App.I18n.I18nKey;
  hintKey?: App.I18n.I18nKey;
}[] = [
  { key: null, labelKey: 'page.wms.cargoInboundPlan.phaseAll' },
  {
    key: 'not_in_stock',
    labelKey: 'page.wms.cargoInboundPlan.phaseNotInStock',
    hintKey: 'page.wms.cargoInboundPlan.phaseNotInStockHint'
  },
  {
    key: 'in_stock',
    labelKey: 'page.wms.cargoInboundPlan.phaseInStock',
    hintKey: 'page.wms.cargoInboundPlan.phaseInStockHint'
  },
  {
    key: 'out_stock',
    labelKey: 'page.wms.cargoInboundPlan.phaseOutStock',
    hintKey: 'page.wms.cargoInboundPlan.phaseOutStockHint'
  }
];

const filterDraft = reactive<Api.Wms.DevanningInboundPlanGlobalSearchParams>({
  pageNum: 1,
  pageSize: 10,
  coNo: null,
  systemSoNo: null,
  shipmentCode: null,
  locationCode: null,
  zoneCode: null,
  cargoPhase: null
});

/** 提交给 Tab 的检索条件（分页仍由 Tab 内维护，此处不传 page） */
const activeFilters = ref<Api.Wms.DevanningInboundPlanGlobalSearchParams>({
  pageNum: 1,
  pageSize: 10,
  coNo: null,
  systemSoNo: null,
  shipmentCode: null,
  locationCode: null,
  zoneCode: null,
  cargoPhase: null
});

const inboundReloadNonce = ref(0);

function applySearch() {
  activeFilters.value = {
    ...activeFilters.value,
    coNo: filterDraft.coNo,
    systemSoNo: filterDraft.systemSoNo,
    shipmentCode: filterDraft.shipmentCode,
    locationCode: filterDraft.locationCode,
    zoneCode: filterDraft.zoneCode
  };
  inboundReloadNonce.value += 1;
}

function resetSearch() {
  filterDraft.coNo = null;
  filterDraft.systemSoNo = null;
  filterDraft.shipmentCode = null;
  filterDraft.locationCode = null;
  filterDraft.zoneCode = null;
  activeFilters.value = {
    ...activeFilters.value,
    coNo: null,
    systemSoNo: null,
    shipmentCode: null,
    locationCode: null,
    zoneCode: null,
    cargoPhase: null
  };
  inboundReloadNonce.value += 1;
}

function setCargoPhase(key: CargoPhaseTab) {
  activeFilters.value = {
    ...activeFilters.value,
    cargoPhase: key
  };
  inboundReloadNonce.value += 1;
}
</script>

<template>
  <div class="h-full min-h-500px flex flex-col gap-16px overflow-hidden lt-sm:overflow-auto">
    <NCard :bordered="false" size="small" class="table-search card-wrapper shrink-0">
      <NCollapse>
        <NCollapseItem :title="$t('common.search')" name="cargo-inbound-plan-search">
          <NForm :model="filterDraft" label-placement="left" label-width="auto">
            <NGrid responsive="screen" item-responsive :cols="24" :x-gap="8" :y-gap="8">
              <NFormItemGi span="24 m:12 l:8" :label="$t('page.wms.devanningOrder.coNo')">
                <NInput v-model:value="filterDraft.coNo" size="small" clearable :placeholder="$t('page.wms.devanningOrder.coNo')" />
              </NFormItemGi>
              <NFormItemGi span="24 m:12 l:8" :label="$t('page.wms.cargoInboundPlan.systemSoNo')">
                <NInput
                  v-model:value="filterDraft.systemSoNo"
                  size="small"
                  clearable
                  :placeholder="$t('page.wms.cargoInboundPlan.systemSoNo')"
                />
              </NFormItemGi>
              <NFormItemGi span="24 m:12 l:8" :label="$t('page.wms.devanningOrder.inboundPlan.shipmentCode')">
                <NInput
                  v-model:value="filterDraft.shipmentCode"
                  size="small"
                  clearable
                  :placeholder="$t('page.wms.devanningOrder.inboundPlan.shipmentCode')"
                />
              </NFormItemGi>
              <NFormItemGi span="24 m:12 l:8" :label="$t('page.wms.cargoInboundPlan.locationCode')">
                <NInput
                  v-model:value="filterDraft.locationCode"
                  size="small"
                  clearable
                  :placeholder="$t('page.wms.cargoInboundPlan.locationCode')"
                />
              </NFormItemGi>
              <NFormItemGi span="24 m:12 l:8" :label="$t('page.wms.cargoInboundPlan.zoneCode')">
                <NInput
                  v-model:value="filterDraft.zoneCode"
                  size="small"
                  clearable
                  :placeholder="$t('page.wms.cargoInboundPlan.zoneCode')"
                />
              </NFormItemGi>
              <NFormItemGi span="24" :show-feedback="false">
                <div class="w-full flex justify-end gap-10px">
                  <NButton size="small" @click="resetSearch">
                    <template #icon>
                      <icon-ic-round-refresh class="text-icon" />
                    </template>
                    {{ $t('common.reset') }}
                  </NButton>
                  <NButton size="small" type="primary" ghost @click="applySearch">
                    <template #icon>
                      <icon-ic-round-search class="text-icon" />
                    </template>
                    {{ $t('common.search') }}
                  </NButton>
                </div>
              </NFormItemGi>
            </NGrid>
          </NForm>
        </NCollapseItem>
      </NCollapse>
    </NCard>

    <NCard
      :bordered="false"
      size="small"
      class="card-wrapper flex min-h-0 flex-1 flex-col overflow-hidden"
      content-class="flex min-h-0 flex-1 flex-col overflow-hidden"
    >
      <template #header>
        <span class="text-16px font-medium">{{ $t('page.wms.cargoInboundPlan.title') }}</span>
      </template>
      <div class="shrink-0 px-4px pb-12px">
        <NSpace class="flex-wrap" align="center" :size="8">
          <template v-for="item in cargoPhaseTabs" :key="String(item.key)">
            <NTooltip v-if="item.hintKey" placement="top">
              <template #trigger>
                <NTag
                  :type="(activeFilters.cargoPhase ?? null) === item.key ? 'primary' : 'default'"
                  :bordered="false"
                  round
                  class="cursor-pointer px-10px"
                  @click="setCargoPhase(item.key)"
                >
                  {{ $t(item.labelKey) }}
                </NTag>
              </template>
              {{ item.hintKey ? $t(item.hintKey) : '' }}
            </NTooltip>
            <NTag
              v-else
              :type="(activeFilters.cargoPhase ?? null) === item.key ? 'primary' : 'default'"
              :bordered="false"
              round
              class="cursor-pointer px-10px"
              @click="setCargoPhase(item.key)"
            >
              {{ $t(item.labelKey) }}
            </NTag>
          </template>
        </NSpace>
      </div>
      <div class="min-h-0 flex flex-1 flex-col overflow-hidden">
        <DevanningOrderInboundPlanTab
          :order-id="null"
          global-mode
          :global-filters="activeFilters"
          :inbound-reload-nonce="inboundReloadNonce"
        />
      </div>
    </NCard>
  </div>
</template>
