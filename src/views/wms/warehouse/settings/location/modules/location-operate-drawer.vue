<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { jsonClone } from '@sa/utils';
import { useLoading } from '@sa/hooks';
import { fetchCreateWarehouseLocation, fetchUpdateWarehouseLocation } from '@/service/api/wms/location';
import { useFormRules, useNaiveForm } from '@/hooks/common/form';
import { useDict } from '@/hooks/business/dict';
import { $t } from '@/locales';
import DictSelect from '@/components/custom/dict-select.vue';

defineOptions({
  name: 'WarehouseLocationOperateDrawer'
});

interface Props {
  operateType: NaiveUI.TableOperateType;
  rowData?: Api.Wms.WarehouseLocation | null;
}

const props = defineProps<Props>();

interface Emits {
  (e: 'submitted'): void;
}

const emit = defineEmits<Emits>();

useDict('sys_normal_disable', true);

const visible = defineModel<boolean>('visible', { default: false });

const { loading, startLoading, endLoading } = useLoading();
const { formRef, validate, restoreValidation } = useNaiveForm();
const { createRequiredRule } = useFormRules();

const title = computed(() => {
  const titles: Record<NaiveUI.TableOperateType, string> = {
    add: $t('page.wms.inventory.location.addLocation'),
    edit: $t('page.wms.inventory.location.editLocation')
  };
  return titles[props.operateType];
});

type Model = Api.Wms.WarehouseLocationOperateParams;

const model = ref<Model>(createDefaultModel());

function createDefaultModel(): Model {
  return {
    id: undefined,
    zoneCode: '',
    locationCode: '',
    rowRank: null,
    columnRank: null,
    capacity: null,
    status: '0'
  };
}

const rules = {
  zoneCode: [createRequiredRule($t('page.wms.inventory.location.form.zoneRequired'))],
  locationCode: [createRequiredRule($t('page.wms.inventory.location.form.locationRequired'))],
  status: [createRequiredRule($t('page.wms.inventory.location.form.statusRequired'))]
};

function handleUpdateModelWhenEdit() {
  model.value = createDefaultModel();
  if (props.operateType === 'edit' && props.rowData) {
    model.value = jsonClone({
      id: props.rowData.id,
      zoneCode: props.rowData.zoneCode ?? '',
      locationCode: props.rowData.locationCode ?? '',
      rowRank: props.rowData.rowRank ?? null,
      columnRank: props.rowData.columnRank ?? null,
      capacity: props.rowData.capacity ?? null,
      status: (props.rowData.status ?? '0') as Api.Common.EnableStatus
    });
  }
}

watch(visible, () => {
  if (visible.value) {
    handleUpdateModelWhenEdit();
    restoreValidation();
  }
});

async function handleSubmit() {
  await validate();
  startLoading();
  const api = props.operateType === 'add' ? fetchCreateWarehouseLocation : fetchUpdateWarehouseLocation;
  const { error } = await api(model.value);
  endLoading();
  if (error) return;
  window.$message?.success(props.operateType === 'add' ? $t('common.addSuccess') : $t('common.updateSuccess'));
  visible.value = false;
  emit('submitted');
}
</script>

<template>
  <NDrawer v-model:show="visible" display-directive="show" :width="420">
    <NDrawerContent :title="title" :native-scrollbar="false" closable>
      <NForm ref="formRef" :model="model" :rules="rules" label-placement="left" label-width="100">
        <NFormItem :label="$t('page.wms.inventory.location.zone')" path="zoneCode">
          <NInput v-model:value="model.zoneCode" :placeholder="$t('page.wms.inventory.location.zone')" />
        </NFormItem>
        <NFormItem :label="$t('page.wms.inventory.location.location')" path="locationCode">
          <NInput v-model:value="model.locationCode" :placeholder="$t('page.wms.inventory.location.location')" />
        </NFormItem>
        <NFormItem :label="$t('page.wms.inventory.location.rowRank')" path="rowRank">
          <NInputNumber v-model:value="model.rowRank" class="w-full" clearable :min="0" />
        </NFormItem>
        <NFormItem :label="$t('page.wms.inventory.location.columnRank')" path="columnRank">
          <NInputNumber v-model:value="model.columnRank" class="w-full" clearable :min="0" />
        </NFormItem>
        <NFormItem :label="$t('page.wms.inventory.location.capacity')" path="capacity">
          <NInputNumber v-model:value="model.capacity" class="w-full" clearable :min="0" />
        </NFormItem>
        <NFormItem :label="$t('page.wms.inventory.location.status')" path="status">
          <DictSelect
            v-model:value="model.status"
            dict-code="sys_normal_disable"
            class="w-full"
            :placeholder="$t('page.wms.inventory.location.status')"
          />
        </NFormItem>
      </NForm>
      <template #footer>
        <NSpace :size="16">
          <NButton @click="visible = false">{{ $t('common.cancel') }}</NButton>
          <NButton type="primary" :loading="loading" @click="handleSubmit">{{ $t('common.confirm') }}</NButton>
        </NSpace>
      </template>
    </NDrawerContent>
  </NDrawer>
</template>

<style scoped></style>
