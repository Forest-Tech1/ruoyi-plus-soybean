<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import type { FormRules } from 'naive-ui';
import { NButton, NDrawer, NDrawerContent, NForm, NFormItem, NInput, NSelect, NSwitch } from 'naive-ui';
import { fetchCreatePlatformWarehouse, fetchUpdatePlatformWarehouse } from '@/service/api/basic/platform-warehouse';
import { COUNTRY_OPTIONS, US_STATE_OPTIONS } from '@/constants/basic-platform';
import { useAppStore } from '@/store/modules/app';
import { useNaiveForm } from '@/hooks/common/form';
import { $t } from '@/locales';

defineOptions({
  name: 'WarehouseOperateDrawer'
});

const emit = defineEmits<{ submitted: [] }>();

const visible = defineModel<boolean>('visible', { default: false });

const props = defineProps<{
  /** 下拉选项来源 */
  platforms: Api.Basic.Platform[];
  /** 打开「新增」时的默认选中平台（左侧当前平台） */
  defaultPlatformId: CommonType.IdType | null;
  editRow: Api.Basic.PlatformWarehouse | null;
}>();

const appStore = useAppStore();
const { formRef, validate, restoreValidation } = useNaiveForm();

const model = ref<Api.Basic.PlatformWarehouseOperateParams>({
  platformId: 0 as unknown as CommonType.IdType,
  warehouseName: '',
  warehouseCode: '',
  countryCode: 'US',
  stateProvince: null,
  city: null,
  addressLine: '',
  postalCode: null,
  status: '0',
  remark: null
});

const title = computed(() =>
  props.editRow ? $t('page.basic.platformWarehouse.editWarehouse') : $t('page.basic.platformWarehouse.addWarehouse')
);

const codeDisabled = computed(() => Boolean(props.editRow));

const platformSelectOptions = computed(() =>
  props.platforms.map(p => ({
    label: `${p.platformName} (${p.platformCode})`,
    value: p.id
  }))
);

const platformSelectDisabled = computed(() => Boolean(props.editRow));

const countryOptions = computed(() =>
  COUNTRY_OPTIONS.map(c => ({
    label: appStore.locale === 'zh-CN' ? `${c.nameZh} (${c.code})` : `${c.nameEn} (${c.code})`,
    value: c.code
  }))
);

const isUS = computed(() => model.value.countryCode === 'US');

const rules: FormRules = {
  warehouseName: [
    {
      required: true,
      message: () => $t('page.basic.platformWarehouse.rule.warehouseName'),
      trigger: ['blur', 'input']
    },
    { max: 100, message: () => $t('page.basic.platformWarehouse.rule.warehouseNameMax'), trigger: ['blur', 'input'] }
  ],
  warehouseCode: [
    {
      required: true,
      message: () => $t('page.basic.platformWarehouse.rule.warehouseCode'),
      trigger: ['blur', 'input']
    },
    {
      pattern: /^[A-Z0-9-]{1,20}$/,
      message: () => $t('page.basic.platformWarehouse.rule.warehouseCodePattern'),
      trigger: ['blur', 'input']
    }
  ],
  countryCode: {
    required: true,
    message: () => $t('page.basic.platformWarehouse.rule.country'),
    trigger: 'change'
  },
  addressLine: [
    { required: true, message: () => $t('page.basic.platformWarehouse.rule.addressLine'), trigger: ['blur', 'input'] },
    { max: 200, message: () => $t('page.basic.platformWarehouse.rule.addressLineMax'), trigger: ['blur', 'input'] }
  ],
  platformId: {
    required: true,
    validator: (_rule, value: unknown) => {
      if (value === null || value === undefined || value === '') return false;
      if (typeof value === 'number' && (Number.isNaN(value) || value === 0)) return false;
      return props.platforms.some(p => p.id === value);
    },
    message: () => $t('page.basic.platformWarehouse.rule.platformId'),
    trigger: ['change', 'blur']
  }
};

function onWarehouseCodeInput(v: string) {
  model.value.warehouseCode = v.toUpperCase().replace(/[^A-Z0-9-]/g, '');
}

function defaultPlatformIdForAdd(): CommonType.IdType {
  const id = props.defaultPlatformId;
  if (id != null && id !== undefined && props.platforms.some(p => p.id === id)) {
    return id;
  }
  return (props.platforms[0]?.id ?? (0 as unknown as CommonType.IdType)) as CommonType.IdType;
}

function resetModel() {
  model.value = {
    platformId: defaultPlatformIdForAdd(),
    warehouseName: '',
    warehouseCode: '',
    countryCode: 'US',
    stateProvince: null,
    city: null,
    addressLine: '',
    postalCode: null,
    status: '0',
    remark: null
  };
}

async function handleSubmit() {
  await validate();
  if (props.editRow) {
    const { error } = await fetchUpdatePlatformWarehouse({
      ...model.value,
      id: props.editRow.id,
      warehouseCode: props.editRow.warehouseCode
    });
    if (error) return;
  } else {
    const { error } = await fetchCreatePlatformWarehouse(model.value);
    if (error) return;
  }
  window.$message?.success($t('common.saveSuccess'));
  visible.value = false;
  emit('submitted');
}

watch(visible, async v => {
  if (v) {
    await restoreValidation();
    if (props.editRow) {
      model.value = {
        id: props.editRow.id,
        platformId: props.editRow.platformId,
        warehouseName: props.editRow.warehouseName,
        warehouseCode: props.editRow.warehouseCode,
        countryCode: props.editRow.countryCode,
        stateProvince: props.editRow.stateProvince ?? null,
        city: props.editRow.city ?? null,
        addressLine: props.editRow.addressLine,
        postalCode: props.editRow.postalCode ?? null,
        status: props.editRow.status,
        remark: props.editRow.remark ?? null
      };
    } else {
      resetModel();
    }
  }
});
</script>

<template>
  <NDrawer v-model:show="visible" :width="480" display-directive="show">
    <NDrawerContent :title="title" closable>
      <NForm ref="formRef" :model="model" :rules="rules" label-placement="left" label-width="100px">
        <NFormItem path="platformId" :label="$t('page.basic.platformWarehouse.belongPlatform')">
          <NSelect
            v-model:value="model.platformId"
            class="w-full"
            filterable
            :options="platformSelectOptions"
            :disabled="platformSelectDisabled"
            :placeholder="$t('page.basic.platformWarehouse.belongPlatformPlaceholder')"
          />
        </NFormItem>
        <NFormItem path="warehouseName" :label="$t('page.basic.platformWarehouse.warehouseName')">
          <NInput v-model:value="model.warehouseName" :maxlength="100" show-count clearable />
        </NFormItem>
        <NFormItem path="warehouseCode" :label="$t('page.basic.platformWarehouse.warehouseCodeCol')">
          <NInput
            :value="model.warehouseCode"
            :disabled="codeDisabled"
            :placeholder="$t('page.basic.platformWarehouse.warehouseCodeHint')"
            @update:value="onWarehouseCodeInput"
          />
        </NFormItem>
        <NFormItem path="countryCode" :label="$t('page.basic.platformWarehouse.country')">
          <NSelect v-model:value="model.countryCode" filterable :options="countryOptions" class="w-full" />
        </NFormItem>
        <NFormItem :label="$t('page.basic.platformWarehouse.stateProvince')">
          <NSelect
            v-if="isUS"
            v-model:value="model.stateProvince"
            filterable
            clearable
            :options="US_STATE_OPTIONS"
            class="w-full"
          />
          <NInput v-else v-model:value="model.stateProvince" clearable :maxlength="100" />
        </NFormItem>
        <NFormItem :label="$t('page.basic.platformWarehouse.city')">
          <NInput v-model:value="model.city" clearable :maxlength="100" />
        </NFormItem>
        <NFormItem path="addressLine" :label="$t('page.basic.platformWarehouse.addressLine')">
          <NInput v-model:value="model.addressLine" type="textarea" :maxlength="200" show-count :rows="2" />
        </NFormItem>
        <NFormItem :label="$t('page.basic.platformWarehouse.postalCode')">
          <NInput v-model:value="model.postalCode" clearable :maxlength="20" />
        </NFormItem>
        <NFormItem :label="$t('page.basic.platformWarehouse.status')">
          <NSwitch :value="model.status === '0'" @update:value="v => (model.status = v ? '0' : '1')">
            <template #checked>{{ $t('page.basic.platformWarehouse.enabled') }}</template>
            <template #unchecked>{{ $t('page.basic.platformWarehouse.disabled') }}</template>
          </NSwitch>
        </NFormItem>
        <NFormItem :label="$t('page.basic.platformWarehouse.remark')">
          <NInput v-model:value="model.remark" type="textarea" :maxlength="200" show-count :rows="2" />
        </NFormItem>
      </NForm>
      <template #footer>
        <div class="flex justify-end gap-12px">
          <NButton @click="visible = false">{{ $t('common.close') }}</NButton>
          <NButton type="primary" @click="handleSubmit">{{ $t('common.save') }}</NButton>
        </div>
      </template>
    </NDrawerContent>
  </NDrawer>
</template>
