<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import type { FormRules, UploadCustomRequestOptions } from 'naive-ui';
import { NButton, NDrawer, NDrawerContent, NForm, NFormItem, NInput, NSwitch, NUpload, NUploadDragger } from 'naive-ui';
import {
  fetchCreatePlatform,
  fetchUpdatePlatform,
  fetchUploadPlatformIcon
} from '@/service/api/basic/platform-warehouse';
import { useNaiveForm } from '@/hooks/common/form';
import { $t } from '@/locales';

defineOptions({
  name: 'PlatformOperateDrawer'
});

interface Emits {
  (e: 'submitted'): void;
}

const emit = defineEmits<Emits>();

const visible = defineModel<boolean>('visible', { default: false });

const props = defineProps<{
  /** null = 新增 */
  editRow: Api.Basic.Platform | null;
}>();

const { formRef, validate, restoreValidation } = useNaiveForm();

const model = ref<Api.Basic.PlatformOperateParams>({
  platformName: '',
  platformCode: '',
  iconUrl: null,
  status: '0',
  remark: null
});

const title = computed(() =>
  props.editRow ? $t('page.basic.platformWarehouse.editPlatform') : $t('page.basic.platformWarehouse.addPlatform')
);

const codeDisabled = computed(() => Boolean(props.editRow));

const rules: FormRules = {
  platformName: [
    { required: true, message: () => $t('page.basic.platformWarehouse.rule.platformName'), trigger: ['blur', 'input'] },
    { max: 30, message: () => $t('page.basic.platformWarehouse.rule.platformNameMax'), trigger: ['blur', 'input'] }
  ],
  platformCode: [
    { required: true, message: () => $t('page.basic.platformWarehouse.rule.platformCode'), trigger: ['blur', 'input'] },
    {
      pattern: /^[A-Z0-9]{3,10}$/,
      message: () => $t('page.basic.platformWarehouse.rule.platformCodePattern'),
      trigger: ['blur', 'input']
    }
  ]
};

function resetModel() {
  model.value = {
    id: null,
    platformName: '',
    platformCode: '',
    iconUrl: null,
    status: '0',
    remark: null
  };
}

async function handleSubmit() {
  await validate();
  if (props.editRow) {
    const { error } = await fetchUpdatePlatform({
      ...model.value,
      id: props.editRow.id,
      platformCode: props.editRow.platformCode
    });
    if (error) return;
  } else {
    const { error } = await fetchCreatePlatform(model.value);
    if (error) return;
  }
  window.$message?.success($t('common.saveSuccess'));
  visible.value = false;
  emit('submitted');
}

function onCodeInput(v: string) {
  model.value.platformCode = v.toUpperCase().replace(/[^A-Z0-9]/g, '');
}

async function customUpload({ file, onFinish, onError }: UploadCustomRequestOptions) {
  const raw = file.file;
  if (!raw) {
    onError();
    return;
  }
  const { data, error } = await fetchUploadPlatformIcon(raw);
  if (error || data == null) {
    onError();
    return;
  }
  model.value.iconUrl = typeof data === 'string' ? data : ((data as any).url ?? String(data));
  onFinish();
}

watch(visible, async v => {
  if (v) {
    await restoreValidation();
    if (props.editRow) {
      model.value = {
        id: props.editRow.id,
        platformName: props.editRow.platformName,
        platformCode: props.editRow.platformCode,
        iconUrl: props.editRow.iconUrl ?? null,
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
  <NDrawer v-model:show="visible" :width="420" display-directive="show">
    <NDrawerContent :title="title" closable>
      <NForm ref="formRef" :model="model" :rules="rules" label-placement="left" label-width="100px">
        <NFormItem path="platformName" :label="$t('page.basic.platformWarehouse.platformName')">
          <NInput v-model:value="model.platformName" :maxlength="30" show-count clearable />
        </NFormItem>
        <NFormItem path="platformCode" :label="$t('page.basic.platformWarehouse.platformCode')">
          <NInput :value="model.platformCode" :disabled="codeDisabled" placeholder="AMZ" @update:value="onCodeInput" />
        </NFormItem>
        <NFormItem :label="$t('page.basic.platformWarehouse.platformIcon')">
          <div class="flex flex-col gap-8px">
            <NUpload :max="1" list-type="image-card" :custom-request="customUpload" accept="image/png,image/jpeg">
              <NUploadDragger class="min-h-100px">
                <div class="text-12px text-gray-500">{{ $t('page.basic.platformWarehouse.iconUploadHint') }}</div>
              </NUploadDragger>
            </NUpload>
            <NInput
              v-model:value="model.iconUrl"
              clearable
              :placeholder="$t('page.basic.platformWarehouse.iconUrlPlaceholder')"
            />
          </div>
        </NFormItem>
        <NFormItem :label="$t('page.basic.platformWarehouse.status')">
          <NSwitch :value="model.status === '0'" @update:value="v => (model.status = v ? '0' : '1')">
            <template #checked>{{ $t('page.basic.platformWarehouse.enabled') }}</template>
            <template #unchecked>{{ $t('page.basic.platformWarehouse.disabled') }}</template>
          </NSwitch>
        </NFormItem>
        <NFormItem :label="$t('page.basic.platformWarehouse.remark')">
          <NInput v-model:value="model.remark" type="textarea" :maxlength="200" show-count :rows="3" />
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
