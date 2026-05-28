<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import type { SelectOption } from 'naive-ui';
import { useNaiveForm } from '@/hooks/common/form';
import { useDict } from '@/hooks/business/dict';
import { useAuth } from '@/hooks/business/auth';
import { fetchGetPlatformList } from '@/service/api/basic/platform-warehouse';
import { WMS_DICT_DELIVERY_TYPE } from '@/constants/wms-devanning';
import { $t } from '@/locales';
import DictSelect from '@/components/custom/dict-select.vue';

defineOptions({
  name: 'PutawayConfigSearch'
});

interface Emits {
  (e: 'search'): void;
  (e: 'addRule'): void;
  (e: 'fallbackAllocation'): void;
}

const emit = defineEmits<Emits>();

const { hasAuth } = useAuth();
const { formRef, validate, restoreValidation } = useNaiveForm();

useDict('wms_storage_method', true);
useDict('wms_warehouse_area_type', true);
useDict(WMS_DICT_DELIVERY_TYPE, true);

const model = defineModel<Api.Wms.PutawayRuleSearchParams>('model', { required: true });

const platforms = ref<Api.Basic.Platform[]>([]);
const platformOptions = computed<SelectOption[]>(() =>
  platforms.value.map(p => ({
    label: `${p.platformName} (${p.platformCode})`,
    value: p.id
  }))
);

onMounted(async () => {
  const { data } = await fetchGetPlatformList();
  if (data) platforms.value = data;
});

async function reset() {
  await restoreValidation();
  model.value.areaName = null;
  model.value.locationCode = null;
  model.value.areaType = null;
  model.value.storageMethod = null;
  model.value.dispatchMethod = null;
  model.value.platformId = null;
  model.value.platformWarehouseCode = null;
  emit('search');
}

async function search() {
  await validate();
  emit('search');
}
</script>

<template>
  <!-- 与拆柜订单等页一致：NCollapse 可折叠搜索；工具栏放在 header-extra，折叠后仍可操作 -->
  <NCard :bordered="false" size="small" class="table-search card-wrapper shrink-0">
    <NCollapse>
      <NCollapseItem :title="$t('common.search')" name="putaway-config-search">
        <template #header-extra>
          <NSpace @click.stop>
            <NButton
              v-if="hasAuth('wms:putawayRule:edit')"
              size="small"
              secondary
              type="primary"
              @click="emit('fallbackAllocation')"
            >
              <template #icon>
                <icon-material-symbols-tune-rounded class="text-icon" />
              </template>
              {{ $t('page.wms.putawayRule.fallbackAllocationButton') }}
            </NButton>
            <NButton v-if="hasAuth('wms:putawayRule:add')" size="small" type="primary" @click="emit('addRule')">
              <template #icon>
                <icon-material-symbols-add-rounded class="text-icon" />
              </template>
              {{ $t('page.wms.putawayRule.addRule') }}
            </NButton>
          </NSpace>
        </template>
        <NForm ref="formRef" :model="model" label-placement="left" label-width="auto">
          <NGrid responsive="screen" item-responsive :cols="24" :x-gap="12" :y-gap="12">
            <NFormItemGi span="24 m:12 l:6" :label="$t('page.wms.putawayRule.searchAreaName')">
              <NInput v-model:value="model.areaName" clearable :placeholder="$t('page.wms.putawayRule.searchAreaName')" />
            </NFormItemGi>
            <NFormItemGi span="24 m:12 l:6" :label="$t('page.wms.putawayRule.searchLocationCode')">
              <NInput
                v-model:value="model.locationCode"
                clearable
                :placeholder="$t('page.wms.putawayRule.searchLocationCode')"
              />
            </NFormItemGi>
            <NFormItemGi span="24 m:12 l:6" :label="$t('page.wms.inventory.warehouseArea.areaType')">
              <DictSelect v-model:value="model.areaType" dict-code="wms_warehouse_area_type" clearable />
            </NFormItemGi>
            <NFormItemGi span="24 m:12 l:6" :label="$t('page.wms.inventory.warehouseArea.storageMethod')">
              <DictSelect v-model:value="model.storageMethod" dict-code="wms_storage_method" clearable />
            </NFormItemGi>
            <NFormItemGi span="24 m:12 l:6" :label="$t('page.wms.inventory.warehouseArea.putawayDispatchMethod')">
              <DictSelect v-model:value="model.dispatchMethod" :dict-code="WMS_DICT_DELIVERY_TYPE" clearable />
            </NFormItemGi>
            <NFormItemGi span="24 m:12 l:6" :label="$t('page.wms.inventory.warehouseArea.putawayPlatform')">
              <NSelect
                v-model:value="model.platformId"
                clearable
                filterable
                :options="platformOptions"
                :placeholder="$t('page.wms.inventory.warehouseArea.putawayPlatformPlaceholder')"
              />
            </NFormItemGi>
            <NFormItemGi span="24 m:12 l:6" :label="$t('page.wms.putawayRule.searchPlatformCode')">
              <NInput
                v-model:value="model.platformWarehouseCode"
                clearable
                :placeholder="$t('page.wms.putawayRule.searchPlatformCode')"
              />
            </NFormItemGi>
            <NFormItemGi span="24" :show-feedback="false">
              <NSpace justify="end" class="w-full">
                <NButton size="small" @click="reset">
                  <template #icon>
                    <icon-material-symbols-refresh-rounded class="text-icon" />
                  </template>
                  {{ $t('common.reset') }}
                </NButton>
                <NButton size="small" type="primary" ghost @click="search">
                  <template #icon>
                    <icon-material-symbols-search-rounded class="text-icon" />
                  </template>
                  {{ $t('common.search') }}
                </NButton>
              </NSpace>
            </NFormItemGi>
          </NGrid>
        </NForm>
      </NCollapseItem>
    </NCollapse>
  </NCard>
</template>
