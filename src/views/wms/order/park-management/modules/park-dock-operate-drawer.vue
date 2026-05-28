<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { jsonClone } from '@sa/utils';
import { useLoading } from '@sa/hooks';
import { fetchCreateParkDock, fetchUpdateParkDock } from '@/service/api/wms/park-dock';
import { WMS_DICT_PARK_LOCATION_AREA } from '@/constants/wms-park';
import { useFormRules, useNaiveForm } from '@/hooks/common/form';
import { useDict } from '@/hooks/business/dict';
import { $t } from '@/locales';
import DictSelect from '@/components/custom/dict-select.vue';

defineOptions({
  name: 'ParkDockOperateDrawer'
});

interface Props {
  operateType: NaiveUI.TableOperateType;
  rowData?: Api.Wms.ParkDock | null;
  slotType: Api.Wms.ParkSlotType;
}

const props = defineProps<Props>();

interface Emits {
  (e: 'submitted'): void;
}

const emit = defineEmits<Emits>();

useDict(WMS_DICT_PARK_LOCATION_AREA, true);

const visible = defineModel<boolean>('visible', { default: false });

const { loading, startLoading, endLoading } = useLoading();
const { formRef, validate, restoreValidation } = useNaiveForm();
const { createRequiredRule } = useFormRules();

const title = computed(() =>
  props.operateType === 'add'
    ? $t('page.wms.parkManagement.addSlot')
    : $t('page.wms.parkManagement.editSlot')
);

type Model = Api.Wms.ParkDockOperateParams;

const statusOptions = [
  { label: $t('page.wms.parkManagement.statusOpen'), value: 'open' },
  { label: $t('page.wms.parkManagement.statusClosed'), value: 'closed' }
];

const businessTypeOptions = [
  { label: $t('page.wms.parkManagement.businessTypeDevanning'), value: 'devanning' },
  { label: $t('page.wms.parkManagement.businessTypeLoading'), value: 'loading' }
];

const DEFAULT_PARKING_LIMIT = 1;

const model = ref<Model>(createDefaultModel());
const showParkingLimit = ref(false);

function createDefaultModel(): Model {
  return {
    id: undefined,
    slotName: '',
    slotType: props.slotType,
    businessType: 'devanning',
    locationArea: null,
    parkingLimit: DEFAULT_PARKING_LIMIT,
    sortOrder: 0,
    priority: 1,
    status: 'open',
    remark: null
  };
}

const rules = {
  slotName: [createRequiredRule($t('page.wms.parkManagement.form.slotNameRequired'))],
  businessType: [createRequiredRule($t('page.wms.parkManagement.form.businessTypeRequired'))],
  locationArea: [createRequiredRule($t('page.wms.parkManagement.form.locationAreaRequired'))]
};

function handleUpdateModelWhenEdit() {
  model.value = createDefaultModel();
  model.value.slotType = props.slotType;
  showParkingLimit.value = false;
  if (props.operateType === 'edit' && props.rowData) {
    const parkingLimit = props.rowData.parkingLimit ?? DEFAULT_PARKING_LIMIT;
    model.value = jsonClone({
      id: props.rowData.id,
      slotName: props.rowData.slotName,
      slotType: props.rowData.slotType,
      businessType: props.rowData.businessType ?? 'devanning',
      locationArea: props.rowData.locationArea ?? null,
      parkingLimit,
      sortOrder: props.rowData.sortOrder ?? 0,
      priority: props.rowData.priority ?? 1,
      status: props.rowData.status,
      remark: props.rowData.remark ?? null
    });
    showParkingLimit.value = parkingLimit !== DEFAULT_PARKING_LIMIT;
  }
}

function resetParkingLimitToDefault() {
  model.value.parkingLimit = DEFAULT_PARKING_LIMIT;
  showParkingLimit.value = false;
}

watch(visible, () => {
  if (visible.value) {
    handleUpdateModelWhenEdit();
    restoreValidation();
  }
});

async function handleSubmit() {
  await validate();
  if (!showParkingLimit.value) {
    model.value.parkingLimit = DEFAULT_PARKING_LIMIT;
  }
  startLoading();
  const api = props.operateType === 'add' ? fetchCreateParkDock : fetchUpdateParkDock;
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
      <NForm ref="formRef" :model="model" :rules="rules" label-placement="left" label-width="108">
        <NFormItem :label="$t('page.wms.parkManagement.slotName')" path="slotName">
          <NInput v-model:value="model.slotName" :placeholder="$t('page.wms.parkManagement.slotName')" />
        </NFormItem>
        <NFormItem :label="$t('page.wms.parkManagement.businessType')" path="businessType">
          <NSelect v-model:value="model.businessType" :options="businessTypeOptions" />
        </NFormItem>
        <NFormItem :label="$t('page.wms.parkManagement.locationArea')" path="locationArea" required>
          <DictSelect
            v-model:value="model.locationArea"
            :dict-code="WMS_DICT_PARK_LOCATION_AREA"
            immediate
            :placeholder="$t('page.wms.parkManagement.locationAreaPlaceholder')"
          />
        </NFormItem>
        <NFormItem :label="$t('page.wms.parkManagement.sortOrder')" path="sortOrder">
          <NInputNumber
            v-model:value="model.sortOrder"
            :min="0"
            :max="9999"
            class="w-full"
            :placeholder="$t('page.wms.parkManagement.sortOrder')"
          />
        </NFormItem>
        <NFormItem
          v-if="model.businessType === 'devanning' && model.slotType === 'dock'"
          :label="$t('page.wms.parkManagement.priority')"
          path="priority"
        >
          <NInputNumber
            v-model:value="model.priority"
            :min="1"
            :max="999"
            class="w-full"
            :placeholder="$t('page.wms.parkManagement.priorityPlaceholder')"
          />
        </NFormItem>
        <NFormItem v-if="showParkingLimit" :label="$t('page.wms.parkManagement.parkingLimit')" path="parkingLimit">
          <div class="flex w-full items-center gap-8px">
            <NInputNumber
              v-model:value="model.parkingLimit"
              :min="1"
              :max="99"
              class="flex-1"
              :placeholder="$t('page.wms.parkManagement.parkingLimitPlaceholder')"
            />
            <NButton text type="warning" @click="resetParkingLimitToDefault">
              {{ $t('page.wms.parkManagement.restoreParkingLimitDefault') }}
            </NButton>
          </div>
        </NFormItem>
        <NButton v-else text type="primary" class="mb-4px" @click="showParkingLimit = true">
          {{ $t('page.wms.parkManagement.adjustParkingLimit') }}
        </NButton>
        <NFormItem :label="$t('page.wms.parkManagement.status')" path="status">
          <NSelect v-model:value="model.status" :options="statusOptions" />
        </NFormItem>
        <NFormItem :label="$t('page.wms.parkManagement.remark')" path="remark">
          <NInput v-model:value="model.remark" type="textarea" :rows="3" />
        </NFormItem>
      </NForm>
      <template #footer>
        <NSpace justify="end">
          <NButton @click="visible = false">{{ $t('common.cancel') }}</NButton>
          <NButton type="primary" :loading="loading" @click="handleSubmit">{{ $t('common.confirm') }}</NButton>
        </NSpace>
      </template>
    </NDrawerContent>
  </NDrawer>
</template>
