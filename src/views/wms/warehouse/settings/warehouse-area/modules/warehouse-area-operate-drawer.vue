<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { jsonClone } from '@sa/utils';
import { useLoading } from '@sa/hooks';
import { fetchCreateWarehouseArea, fetchUpdateWarehouseArea } from '@/service/api/wms/warehouse-area';
import { useFormRules, useNaiveForm } from '@/hooks/common/form';
import { useDict } from '@/hooks/business/dict';
import { $t } from '@/locales';
import DictSelect from '@/components/custom/dict-select.vue';

defineOptions({
  name: 'WarehouseAreaOperateDrawer'
});

interface Props {
  operateType: NaiveUI.TableOperateType;
  rowData?: Api.Wms.WarehouseArea | null;
}

const props = defineProps<Props>();

interface Emits {
  (e: 'submitted'): void;
}

const emit = defineEmits<Emits>();

useDict('wms_storage_method', true);
useDict('wms_warehouse_area_type', true);

const visible = defineModel<boolean>('visible', { default: false });

const { loading, startLoading, endLoading } = useLoading();
const { formRef, validate, restoreValidation } = useNaiveForm();
const { createRequiredRule } = useFormRules();

const title = computed(() => {
  const titles: Record<NaiveUI.TableOperateType, string> = {
    add: $t('page.wms.inventory.warehouseArea.addArea'),
    edit: $t('page.wms.inventory.warehouseArea.editArea')
  };
  return titles[props.operateType];
});

type Model = Api.Wms.WarehouseAreaOperateParams;

const model = ref<Model>(createDefaultModel());

function createDefaultModel(): Model {
  return {
    id: undefined,
    areaName: '',
    storageMethod: null,
    areaType: null,
    locationMixedStorage: false,
    maxMixedQty: null
  };
}

const rules = {
  areaName: [createRequiredRule($t('page.wms.inventory.warehouseArea.form.areaNameRequired'))],
  maxMixedQty: [
    {
      validator: (_rule: any, value: unknown) => {
        if (!model.value.locationMixedStorage) return true;
        if (value === null || value === undefined || value === '') return false;
        const n = Number(value);
        return Number.isFinite(n) && n > 0;
      },
      message: $t('page.wms.inventory.warehouseArea.form.maxMixedQtyRequired'),
      trigger: ['blur', 'change']
    }
  ]
};

function handleUpdateModelWhenEdit() {
  model.value = createDefaultModel();
  if (props.operateType === 'edit' && props.rowData) {
    model.value = jsonClone({
      id: props.rowData.id,
      areaName: props.rowData.areaName,
      storageMethod: props.rowData.storageMethod ?? null,
      areaType: props.rowData.areaType ?? null,
      locationMixedStorage: Boolean(props.rowData.locationMixedStorage),
      maxMixedQty: props.rowData.maxMixedQty ?? null
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
  const api = props.operateType === 'add' ? fetchCreateWarehouseArea : fetchUpdateWarehouseArea;
  const { error } = await api(model.value);
  endLoading();
  if (error) return;
  window.$message?.success(props.operateType === 'add' ? $t('common.addSuccess') : $t('common.updateSuccess'));
  visible.value = false;
  emit('submitted');
}
</script>

<template>
  <NDrawer v-model:show="visible" display-directive="show" :width="400">
    <NDrawerContent :title="title" :native-scrollbar="false" closable>
      <NForm ref="formRef" :model="model" :rules="rules" label-placement="left" label-width="100">
        <NFormItem :label="$t('page.wms.inventory.warehouseArea.areaName')" path="areaName">
          <NInput v-model:value="model.areaName" :placeholder="$t('page.wms.inventory.warehouseArea.areaName')" />
        </NFormItem>
        <NFormItem :label="$t('page.wms.inventory.warehouseArea.storageMethod')" path="storageMethod">
          <DictSelect
            v-model:value="model.storageMethod"
            dict-code="wms_storage_method"
            class="w-full"
            :placeholder="$t('page.wms.inventory.warehouseArea.storageMethod')"
          />
        </NFormItem>
        <NFormItem :label="$t('page.wms.inventory.warehouseArea.areaType')" path="areaType">
          <DictSelect
            v-model:value="model.areaType"
            dict-code="wms_warehouse_area_type"
            class="w-full"
            :placeholder="$t('page.wms.inventory.warehouseArea.areaType')"
          />
        </NFormItem>
        <NFormItem :label="$t('page.wms.inventory.warehouseArea.locationMixedStorage')">
          <NSwitch
            :value="Boolean(model.locationMixedStorage)"
            @update:value="
              v => {
                model.locationMixedStorage = v;
                if (!v) model.maxMixedQty = null;
              }
            "
          />
        </NFormItem>
        <NFormItem
          v-if="model.locationMixedStorage"
          path="maxMixedQty"
          :label="$t('page.wms.inventory.warehouseArea.maxMixedQty')"
        >
          <NInputNumber v-model:value="model.maxMixedQty" class="w-full" :min="1" :precision="0" />
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
