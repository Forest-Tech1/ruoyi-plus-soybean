<script setup lang="ts">
import { computed } from 'vue';
import { useNaiveForm } from '@/hooks/common/form';
import { useDict } from '@/hooks/business/dict';
import DictSelect from '@/components/custom/dict-select.vue';
import { $t } from '@/locales';

defineOptions({
  name: 'WarehouseLocationTopCollapseSearch'
});

const COLLAPSE_NAME = 'wms-inventory-location-search';

interface Emits {
  (e: 'search'): void;
}

const emit = defineEmits<Emits>();

useDict('sys_normal_disable', true);

/** 与拆柜订单搜索一致：用 NCollapse 折叠；true 表示展开搜索区 */
const expanded = defineModel<boolean>('expanded', { default: true });

const model = defineModel<Api.Wms.WarehouseLocationSearchParams>('model', { required: true });

/** 映射到 NCollapse 的 expanded-names */
const expandedNames = computed({
  get() {
    return expanded.value ? [COLLAPSE_NAME] : [];
  },
  set(names: string[]) {
    expanded.value = names.includes(COLLAPSE_NAME);
  }
});

const { formRef, validate, restoreValidation } = useNaiveForm();

async function reset() {
  await restoreValidation();
  model.value.locationKeyword = null;
  model.value.keyword = null;
  model.value.status = null;
  emit('search');
}

async function search() {
  await validate();
  emit('search');
}
</script>

<template>
  <!-- 结构与拆柜订单 modules/devanning-order-search.vue 一致：NCard.table-search + NCollapse（箭头在标题左侧） -->
  <NCard :bordered="false" size="small" class="table-search card-wrapper shrink-0">
    <NCollapse v-model:expanded-names="expandedNames">
      <NCollapseItem :title="$t('common.search')" :name="COLLAPSE_NAME">
        <NForm ref="formRef" :model="model" label-placement="left" label-width="auto">
          <NGrid responsive="screen" item-responsive :cols="24" :x-gap="12" :y-gap="12">
            <NFormItemGi span="24 m:12 l:8" :label="$t('page.wms.inventory.location.searchLocationKeyword')">
              <NInput
                v-model:value="model.locationKeyword"
                clearable
                :placeholder="$t('page.wms.inventory.location.searchLocationKeywordPlaceholder')"
              />
            </NFormItemGi>
            <NFormItemGi span="24 m:12 l:8" :label="$t('page.wms.inventory.location.status')">
              <DictSelect
                v-model:value="model.status"
                dict-code="sys_normal_disable"
                clearable
                class="w-full"
                :placeholder="$t('page.wms.inventory.location.status')"
              />
            </NFormItemGi>
            <NFormItemGi span="24" :show-feedback="false">
              <NSpace justify="end" class="w-full">
                <NButton size="small" @click="reset">
                  <template #icon>
                    <icon-ic-round-refresh class="text-icon" />
                  </template>
                  {{ $t('common.reset') }}
                </NButton>
                <NButton size="small" type="primary" ghost @click="search">
                  <template #icon>
                    <icon-ic-round-search class="text-icon" />
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

<style scoped></style>
