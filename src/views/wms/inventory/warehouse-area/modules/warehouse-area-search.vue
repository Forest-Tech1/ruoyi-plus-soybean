<script setup lang="ts">
import { h } from 'vue';
import type { DropdownOption } from 'naive-ui';
import { NButton, NDropdown } from 'naive-ui';
import { useNaiveForm } from '@/hooks/common/form';
import { useDict } from '@/hooks/business/dict';
import { useAuth } from '@/hooks/business/auth';
import { $t } from '@/locales';
import SvgIcon from '@/components/custom/svg-icon.vue';
import DictSelect from '@/components/custom/dict-select.vue';

defineOptions({
  name: 'WarehouseAreaSearch'
});

interface Props {
  canAdd?: boolean;
  canBatchDelete?: boolean;
  batchDisabled?: boolean;
}

interface Emits {
  (e: 'search'): void;
  (e: 'add'): void;
  (e: 'batchDelete'): void;
}

const props = withDefaults(defineProps<Props>(), {
  canAdd: true,
  canBatchDelete: true,
  batchDisabled: true
});

const emit = defineEmits<Emits>();

const { hasAuth } = useAuth();
const { formRef, validate, restoreValidation } = useNaiveForm();

useDict('wms_storage_method', true);
useDict('wms_warehouse_area_type', true);

const model = defineModel<Api.Wms.WarehouseAreaSearchParams>('model', { required: true });

const batchOptions: DropdownOption[] = [
  {
    label: () => $t('common.batchDelete'),
    key: 'delete',
    icon: () => h(SvgIcon, { icon: 'material-symbols:delete-outline', class: 'text-18px' }),
    disabled: !hasAuth('wms:warehouseArea:remove')
  }
];

function handleBatchSelect(key: string) {
  if (key === 'delete') emit('batchDelete');
}

async function reset() {
  await restoreValidation();
  model.value.areaName = null;
  model.value.areaType = null;
  model.value.storageMethod = null;
  emit('search');
}

async function search() {
  await validate();
  emit('search');
}
</script>

<template>
  <NCard :bordered="false" size="small" class="card-wrapper">
    <template #header>
      <div class="flex-y-center flex-wrap justify-between gap-12px">
        <span class="text-16px font-medium">{{ $t('common.search') }}</span>
        <NSpace>
          <NDropdown
            :options="batchOptions"
            :disabled="!props.canBatchDelete || props.batchDisabled"
            @select="handleBatchSelect"
          >
            <NButton :disabled="!props.canBatchDelete">
              {{ $t('page.wms.inventory.warehouseArea.batchOperation') }}
              <template #icon>
                <icon-material-symbols-keyboard-arrow-down-rounded class="text-icon" />
              </template>
            </NButton>
          </NDropdown>
          <NButton type="primary" :disabled="!props.canAdd" @click="emit('add')">
            <template #icon>
              <icon-material-symbols-add-rounded class="text-icon" />
            </template>
            {{ $t('page.wms.inventory.warehouseArea.addArea') }}
          </NButton>
        </NSpace>
      </div>
    </template>
    <NForm ref="formRef" :model="model" label-placement="left" label-width="auto">
      <NGrid responsive="screen" item-responsive :cols="24" :x-gap="12" :y-gap="12">
        <NFormItemGi span="24 m:12 l:8" :label="$t('page.wms.inventory.warehouseArea.areaName')">
          <NInput
            v-model:value="model.areaName"
            clearable
            :placeholder="$t('page.wms.inventory.warehouseArea.areaName')"
          />
        </NFormItemGi>
        <NFormItemGi span="24 m:12 l:8" :label="$t('page.wms.inventory.warehouseArea.areaType')">
          <DictSelect
            v-model:value="model.areaType"
            dict-code="wms_warehouse_area_type"
            clearable
            class="w-full"
            :placeholder="$t('page.wms.inventory.warehouseArea.areaType')"
          />
        </NFormItemGi>
        <NFormItemGi span="24 m:12 l:8" :label="$t('page.wms.inventory.warehouseArea.storageMethod')">
          <DictSelect
            v-model:value="model.storageMethod"
            dict-code="wms_storage_method"
            clearable
            class="w-full"
            :placeholder="$t('page.wms.inventory.warehouseArea.storageMethod')"
          />
        </NFormItemGi>
        <NFormItemGi span="24" :show-feedback="false">
          <NSpace justify="end" class="w-full">
            <NButton @click="reset">
              <template #icon>
                <icon-ic-round-refresh class="text-icon" />
              </template>
              {{ $t('common.reset') }}
            </NButton>
            <NButton type="primary" ghost @click="search">
              <template #icon>
                <icon-ic-round-search class="text-icon" />
              </template>
              {{ $t('common.search') }}
            </NButton>
          </NSpace>
        </NFormItemGi>
      </NGrid>
    </NForm>
  </NCard>
</template>

<style scoped></style>
