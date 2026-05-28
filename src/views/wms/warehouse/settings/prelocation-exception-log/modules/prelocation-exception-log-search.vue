<script setup lang="ts">
import { ref, toRaw } from 'vue';
import { NDatePicker } from 'naive-ui';
import { jsonClone } from '@sa/utils';
import { useNaiveForm } from '@/hooks/common/form';
import { useDict } from '@/hooks/business/dict';
import { $t } from '@/locales';
import DictSelect from '@/components/custom/dict-select.vue';

defineOptions({
  name: 'PrelocationExceptionLogSearch'
});

interface Emits {
  (e: 'search'): void;
}

const emit = defineEmits<Emits>();

const { formRef, validate, restoreValidation } = useNaiveForm();

useDict('wms_prelocation_allocation_exception_type', true);

const dateRangeLogTime = ref<[string, string] | null>(null);

const model = defineModel<Api.Wms.PrelocationAllocationExceptionLogSearchParams>('model', { required: true });

const defaultModel = jsonClone(toRaw(model.value));

function onDateRangeUpdate(value: [string, string] | null) {
  const params = model.value.params ?? {};
  model.value.params = params;
  if (value && value.length === 2) {
    [params.beginTime, params.endTime] = value;
  } else {
    params.beginTime = undefined;
    params.endTime = undefined;
  }
}

async function reset() {
  await restoreValidation();
  dateRangeLogTime.value = null;
  Object.assign(model.value, jsonClone(defaultModel));
  model.value.params = jsonClone(defaultModel.params ?? {});
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
      <span class="text-16px font-medium">{{ $t('common.search') }}</span>
    </template>
    <NForm ref="formRef" :model="model" label-placement="left" label-width="auto">
      <NGrid responsive="screen" item-responsive :cols="24" :x-gap="12" :y-gap="12">
        <NFormItemGi span="24 m:12 l:6" :label="$t('page.wms.prelocationExceptionLog.orderNo')">
          <NInput
            v-model:value="model.orderNo"
            clearable
            :placeholder="$t('page.wms.prelocationExceptionLog.orderNoPlaceholder')"
          />
        </NFormItemGi>
        <NFormItemGi span="24 m:12 l:6" :label="$t('page.wms.prelocationExceptionLog.coNo')">
          <NInput v-model:value="model.coNo" clearable :placeholder="$t('page.wms.prelocationExceptionLog.coNoPlaceholder')" />
        </NFormItemGi>
        <NFormItemGi span="24 m:12 l:6" :label="$t('page.wms.prelocationExceptionLog.shipmentCode')">
          <NInput
            v-model:value="model.shipmentCode"
            clearable
            :placeholder="$t('page.wms.prelocationExceptionLog.shipmentCodePlaceholder')"
          />
        </NFormItemGi>
        <NFormItemGi span="24 m:12 l:6" :label="$t('page.wms.prelocationExceptionLog.exceptionType')">
          <DictSelect
            v-model:value="model.exceptionType"
            dict-code="wms_prelocation_allocation_exception_type"
            clearable
            :placeholder="$t('page.wms.prelocationExceptionLog.exceptionTypePlaceholder')"
          />
        </NFormItemGi>
        <NFormItemGi span="24 m:12 l:6" :label="$t('page.wms.prelocationExceptionLog.exceptionReasonKeyword')">
          <NInput
            v-model:value="model.exceptionReasonKeyword"
            clearable
            :placeholder="$t('page.wms.prelocationExceptionLog.exceptionReasonKeywordPlaceholder')"
          />
        </NFormItemGi>
        <NFormItemGi span="24 m:12 l:8" :label="$t('page.wms.prelocationExceptionLog.logTimeRange')">
          <NDatePicker
            v-model:formatted-value="dateRangeLogTime"
            type="datetimerange"
            value-format="yyyy-MM-dd HH:mm:ss"
            clearable
            class="w-full"
            @update:formatted-value="onDateRangeUpdate"
          />
        </NFormItemGi>
        <NFormItemGi span="24" class="flex justify-end gap-12px">
          <NButton @click="reset">
            <template #icon>
              <icon-material-symbols-refresh-rounded class="text-icon" />
            </template>
            {{ $t('common.reset') }}
          </NButton>
          <NButton type="primary" ghost @click="search">
            <template #icon>
              <icon-material-symbols-search-rounded class="text-icon" />
            </template>
            {{ $t('common.search') }}
          </NButton>
        </NFormItemGi>
      </NGrid>
    </NForm>
  </NCard>
</template>
