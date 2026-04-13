<script setup lang="ts">
import { h } from 'vue';
import type { DropdownOption } from 'naive-ui';
import { NButton, NDropdown } from 'naive-ui';
import { useNaiveForm } from '@/hooks/common/form';
import { useAuth } from '@/hooks/business/auth';
import { useDict } from '@/hooks/business/dict';
import { $t } from '@/locales';
import SvgIcon from '@/components/custom/svg-icon.vue';
import DictSelect from '@/components/custom/dict-select.vue';

defineOptions({
  name: 'WarehouseLocationSearch'
});

interface Props {
  canAdd?: boolean;
  canImport?: boolean;
  canBatchDelete?: boolean;
  canBatchStatus?: boolean;
  batchDisabled?: boolean;
}

interface Emits {
  (e: 'search'): void;
  (e: 'add'): void;
  (e: 'import'): void;
  (e: 'batchDelete'): void;
  (e: 'batchStatus', status: Api.Common.EnableStatus): void;
}

const props = withDefaults(defineProps<Props>(), {
  canAdd: true,
  canImport: true,
  canBatchDelete: true,
  canBatchStatus: true,
  batchDisabled: true
});

const emit = defineEmits<Emits>();

const { hasAuth } = useAuth();
const { formRef, validate, restoreValidation } = useNaiveForm();

useDict('sys_normal_disable', true);

const model = defineModel<Api.Wms.WarehouseLocationSearchParams>('model', { required: true });

const statusBatchOptions: DropdownOption[] = [
  {
    label: () => $t('page.wms.inventory.location.statusEnable'),
    key: '0',
    icon: () => h(SvgIcon, { icon: 'material-symbols:check-circle-outline', class: 'text-18px' }),
    disabled: !hasAuth('wms:location:status')
  },
  {
    label: () => $t('page.wms.inventory.location.statusDisable'),
    key: '1',
    icon: () => h(SvgIcon, { icon: 'material-symbols:block', class: 'text-18px' }),
    disabled: !hasAuth('wms:location:status')
  }
];

function handleStatusBatchSelect(key: string | number) {
  emit('batchStatus', String(key) as Api.Common.EnableStatus);
}

async function reset() {
  await restoreValidation();
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
  <NCard :bordered="false" size="small" class="card-wrapper">
    <template #header>
      <div class="flex-y-center flex-wrap justify-between gap-12px">
        <span class="text-16px font-medium">{{ $t('common.search') }}</span>
        <NSpace wrap>
          <NButton :disabled="!props.canBatchDelete || props.batchDisabled" @click="emit('batchDelete')">
            <template #icon>
              <icon-material-symbols-delete-outline class="text-icon" />
            </template>
            {{ $t('common.batchDelete') }}
          </NButton>
          <NDropdown
            :options="statusBatchOptions"
            :disabled="!props.canBatchStatus || props.batchDisabled"
            @select="handleStatusBatchSelect"
          >
            <NButton :disabled="!props.canBatchStatus">
              {{ $t('page.wms.inventory.location.changeStatus') }}
              <template #icon>
                <icon-material-symbols-keyboard-arrow-down-rounded class="text-icon" />
              </template>
            </NButton>
          </NDropdown>
          <NButton type="primary" :disabled="!props.canAdd" @click="emit('add')">
            <template #icon>
              <icon-material-symbols-add-rounded class="text-icon" />
            </template>
            {{ $t('page.wms.inventory.location.addLocation') }}
          </NButton>
          <NButton :disabled="!props.canImport" @click="emit('import')">
            <template #icon>
              <icon-material-symbols-upload-rounded class="text-icon" />
            </template>
            {{ $t('page.wms.inventory.location.importLocation') }}
          </NButton>
        </NSpace>
      </div>
    </template>
    <NForm ref="formRef" :model="model" label-placement="left" label-width="auto">
      <NGrid responsive="screen" item-responsive :cols="24" :x-gap="12" :y-gap="12">
        <NFormItemGi span="24 m:12 l:8" :label="$t('page.wms.inventory.location.filterKeyword')">
          <NInput
            v-model:value="model.keyword"
            clearable
            :placeholder="$t('page.wms.inventory.location.filterPlaceholder')"
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
