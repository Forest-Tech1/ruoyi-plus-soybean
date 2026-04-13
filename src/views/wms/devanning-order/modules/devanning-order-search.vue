<script setup lang="ts">
import { onMounted, ref, toRaw } from 'vue';
import { NDatePicker } from 'naive-ui';
import { jsonClone } from '@sa/utils';
import dayjs from 'dayjs';
import { WMS_DICT_DEVANNING_ROUND, WMS_DICT_ORDER_LEVEL } from '@/constants/wms-devanning';
import DictSelect from '@/components/custom/dict-select.vue';
import { useNaiveForm } from '@/hooks/common/form';
import { $t } from '@/locales';

defineOptions({
  name: 'DevanningOrderSearch'
});

interface Props {
  /** 是否有导入权限（无权限时按钮禁用） */
  canImport?: boolean;
  /** 是否有新建权限 */
  canAdd?: boolean;
}

interface Emits {
  (e: 'search'): void;
  (e: 'import'): void;
  (e: 'create'): void;
}

const emit = defineEmits<Emits>();

const props = withDefaults(defineProps<Props>(), {
  canImport: true,
  canAdd: true
});

const { formRef, validate, restoreValidation } = useNaiveForm();

const orderTimeRange = ref<[string, string] | null>(null);
const completeTimeRange = ref<[string, string] | null>(null);
const expectedTimeRange = ref<[string, string] | null>(null);

const model = defineModel<Api.Wms.DevanningOrderSearchParams>('model', { required: true });

const defaultModel = jsonClone(toRaw(model.value));

function initDefaultOrderTimeRange() {
  const start = dayjs().subtract(1, 'month').startOf('day').format('YYYY-MM-DD HH:mm:ss');
  const end = dayjs().add(1, 'month').endOf('day').format('YYYY-MM-DD HH:mm:ss');
  orderTimeRange.value = [start, end];
  onOrderTimeRange(orderTimeRange.value);
}

onMounted(() => {
  const p = model.value.params!;
  const hasValue = Boolean(p.orderTimeBegin && p.orderTimeEnd);
  if (!hasValue) {
    initDefaultOrderTimeRange();
  } else {
    orderTimeRange.value = [p.orderTimeBegin!, p.orderTimeEnd!];
  }
});

function onOrderTimeRange(value: [string, string] | null) {
  const p = model.value.params!;
  if (value?.length === 2) {
    p.orderTimeBegin = value[0];
    p.orderTimeEnd = value[1];
  } else {
    p.orderTimeBegin = undefined;
    p.orderTimeEnd = undefined;
  }
}

function onCompleteTimeRange(value: [string, string] | null) {
  const p = model.value.params!;
  if (value?.length === 2) {
    p.devanningCompleteBegin = value[0];
    p.devanningCompleteEnd = value[1];
  } else {
    p.devanningCompleteBegin = undefined;
    p.devanningCompleteEnd = undefined;
  }
}

function onExpectedTimeRange(value: [string, string] | null) {
  const p = model.value.params!;
  if (value?.length === 2) {
    p.expectedDevanningBegin = `${value[0]} 00:00:00`;
    p.expectedDevanningEnd = `${value[1]} 23:59:59`;
  } else {
    p.expectedDevanningBegin = undefined;
    p.expectedDevanningEnd = undefined;
  }
}

function resetModel() {
  orderTimeRange.value = null;
  completeTimeRange.value = null;
  expectedTimeRange.value = null;
  Object.assign(model.value, jsonClone(defaultModel));
}

async function reset() {
  await restoreValidation();
  resetModel();
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
      <div class="flex-y-center justify-between gap-12px">
        <span class="text-16px font-medium">{{ $t('common.search') }}</span>
        <NSpace>
          <NButton :disabled="!props.canImport" @click="emit('import')">
            <template #icon>
              <icon-material-symbols-upload-rounded class="text-icon" />
            </template>
            {{ $t('page.wms.devanningOrder.importOrder') }}
          </NButton>
          <NButton type="primary" :disabled="!props.canAdd" @click="emit('create')">
            <template #icon>
              <icon-material-symbols-add-rounded class="text-icon" />
            </template>
            {{ $t('page.wms.devanningOrder.newOrder') }}
          </NButton>
        </NSpace>
      </div>
    </template>
    <NForm ref="formRef" :model="model" label-placement="left" label-width="auto">
      <NGrid responsive="screen" item-responsive :cols="24" :x-gap="12" :y-gap="12">
        <NFormItemGi span="24 m:12 l:8" :label="$t('page.wms.devanningOrder.orderTimeRange')">
          <NDatePicker
            v-model:formatted-value="orderTimeRange"
            type="datetimerange"
            value-format="yyyy-MM-dd HH:mm:ss"
            clearable
            class="w-full"
            @update:formatted-value="onOrderTimeRange"
          />
        </NFormItemGi>
        <NFormItemGi span="24 m:12 l:8" :label="$t('page.wms.devanningOrder.devanningCompleteTimeRange')">
          <NDatePicker
            v-model:formatted-value="completeTimeRange"
            type="datetimerange"
            value-format="yyyy-MM-dd HH:mm:ss"
            clearable
            class="w-full"
            @update:formatted-value="onCompleteTimeRange"
          />
        </NFormItemGi>
        <NFormItemGi span="24 m:12 l:8" :label="$t('page.wms.devanningOrder.expectedDevanningTimeRange')">
          <NDatePicker
            v-model:formatted-value="expectedTimeRange"
            type="daterange"
            value-format="yyyy-MM-dd"
            clearable
            class="w-full"
            @update:formatted-value="onExpectedTimeRange"
          />
        </NFormItemGi>
        <NFormItemGi span="24 m:12 l:8" :label="$t('page.wms.devanningOrder.devanningRound')">
          <DictSelect
            v-model:value="model.devanningRound"
            :dict-code="WMS_DICT_DEVANNING_ROUND"
            :immediate="true"
            :placeholder="$t('page.wms.devanningOrder.devanningRound')"
            clearable
            class="w-full"
          />
        </NFormItemGi>
        <NFormItemGi span="24 m:12 l:8" :label="$t('page.wms.devanningOrder.orderLevel')">
          <DictSelect
            v-model:value="model.orderLevel"
            :dict-code="WMS_DICT_ORDER_LEVEL"
            :immediate="true"
            :placeholder="$t('page.wms.devanningOrder.orderLevel')"
            clearable
            class="w-full"
          />
        </NFormItemGi>
        <NFormItemGi span="24 m:12 l:8" :label="$t('page.wms.devanningOrder.coNo')">
          <NInput v-model:value="model.coNo" clearable :placeholder="$t('page.wms.devanningOrder.coNo')" />
        </NFormItemGi>
        <NFormItemGi span="24 m:12 l:8" :label="$t('page.wms.devanningOrder.blNo')">
          <NInput v-model:value="model.blNo" clearable :placeholder="$t('page.wms.devanningOrder.blNo')" />
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
