<script setup lang="ts">
import { computed, h, onMounted, ref, toRaw } from 'vue';
import type { DropdownOption } from 'naive-ui';
import { NDatePicker, NInputNumber, NSelect } from 'naive-ui';
import { jsonClone } from '@sa/utils';
import {
  getDefaultDevanningOrderCreateTimeRange,
  buildDevanningStatusSelectOptions,
  WMS_DICT_DEVANNING_ROUND
} from '@/constants/wms-devanning';
import DictSelect from '@/components/custom/dict-select.vue';
import { useNaiveForm } from '@/hooks/common/form';
import SvgIcon from '@/components/custom/svg-icon.vue';
import { $t } from '@/locales';

defineOptions({
  name: 'DevanningOrderSearch'
});

interface Props {
  /** 是否有导入权限（无权限时按钮禁用） */
  canImport?: boolean;
  /** 是否有新建权限 */
  canAdd?: boolean;
  /** 是否可使用批量删除（与单行删除权限一致） */
  canBatchRemove?: boolean;
}

interface Emits {
  (e: 'search'): void;
  (e: 'import'): void;
  /** 原始订单派送表导入（表头映射 + 预处理） */
  (e: 'importRaw'): void;
  /** 导入订单：Sheet2 + V2 预览 import-preview/v2 */
  (e: 'importOrder'): void;
  (e: 'create'): void;
  /** 批量操作中选择「批量删除」 */
  (e: 'batchDelete'): void;
}

const emit = defineEmits<Emits>();

const props = withDefaults(defineProps<Props>(), {
  canImport: true,
  canAdd: true,
  canBatchRemove: false
});

const batchDropdownOptions = computed<DropdownOption[]>(() => [
  {
    label: $t('page.wms.devanningOrder.batchDelete'),
    key: 'batchDelete',
    icon: () => h(SvgIcon, { icon: 'material-symbols:delete-outline', class: 'text-18px text-error' })
  }
]);

function onBatchDropdownSelect(key: string | number) {
  if (String(key) === 'batchDelete') emit('batchDelete');
}

/** 「导入」下拉：标准派送、原始订单；「导入订单」为旁侧独立按钮（Sheet2 · V2） */
const importDropdownOptions = computed<DropdownOption[]>(() => [
  {
    label: $t('page.wms.devanningOrder.importDispatchStandard'),
    key: 'importStandard',
    icon: () => h(SvgIcon, { icon: 'material-symbols:upload-file-outline', class: 'text-18px' })
  },
  {
    label: $t('page.wms.devanningOrder.importRawOrder'),
    key: 'importRaw',
    icon: () => h(SvgIcon, { icon: 'material-symbols:table-rows-outline', class: 'text-18px' })
  }
]);

function onImportDropdownSelect(key: string | number) {
  const k = String(key);
  if (k === 'importStandard') emit('import');
  else if (k === 'importRaw') emit('importRaw');
}

const { formRef, validate, restoreValidation } = useNaiveForm();

/** 默认筛选：创建时间（params.createTimeBegin / createTimeEnd） */
const createTimeRange = ref<[string, string] | null>(null);
/** 可选：下单时间（params.orderTimeBegin / orderTimeEnd），默认不传 */
const orderTimeRange = ref<[string, string] | null>(null);
const completeTimeRange = ref<[string, string] | null>(null);
const expectedTimeRange = ref<[string, string] | null>(null);

const model = defineModel<Api.Wms.DevanningOrderSearchParams>('model', { required: true });

const devanningStatusFilterOptions = computed(() => buildDevanningStatusSelectOptions($t));

const defaultModel = jsonClone(toRaw(model.value));

function initDefaultCreateTimeRange() {
  const { createTimeBegin, createTimeEnd } = getDefaultDevanningOrderCreateTimeRange();
  createTimeRange.value = [createTimeBegin, createTimeEnd];
  onCreateTimeRange(createTimeRange.value);
}

onMounted(() => {
  const p = model.value.params!;
  const hasCreateRange = Boolean(p.createTimeBegin && p.createTimeEnd);
  if (!hasCreateRange) {
    initDefaultCreateTimeRange();
  } else {
    createTimeRange.value = [p.createTimeBegin!, p.createTimeEnd!];
  }
  orderTimeRange.value =
    p.orderTimeBegin && p.orderTimeEnd ? [p.orderTimeBegin, p.orderTimeEnd] : null;
});

function onCreateTimeRange(value: [string, string] | null) {
  const p = model.value.params!;
  if (value?.length === 2) {
    p.createTimeBegin = value[0];
    p.createTimeEnd = value[1];
  } else {
    p.createTimeBegin = undefined;
    p.createTimeEnd = undefined;
  }
}

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
  completeTimeRange.value = null;
  expectedTimeRange.value = null;
  Object.assign(model.value, jsonClone(defaultModel));
  const p = model.value.params!;
  createTimeRange.value =
    p.createTimeBegin && p.createTimeEnd ? [p.createTimeBegin, p.createTimeEnd] : null;
  orderTimeRange.value =
    p.orderTimeBegin && p.orderTimeEnd ? [p.orderTimeBegin, p.orderTimeEnd] : null;
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
  <NCard :bordered="false" size="small" class="table-search card-wrapper">
    <!-- 默认收起，减少首屏占用；需要时再展开搜索 -->
    <NCollapse>
      <NCollapseItem :title="$t('common.search')" name="devanning-order-search">
        <template #header-extra>
          <NSpace @click.stop>
            <NButton size="small" type="primary" :disabled="!props.canAdd" @click="emit('create')">
              <template #icon>
                <icon-material-symbols-add-rounded class="text-icon" />
              </template>
              {{ $t('page.wms.devanningOrder.newOrder') }}
            </NButton>
            <NDropdown
              trigger="click"
              placement="bottom-start"
              :options="batchDropdownOptions"
              :disabled="!props.canBatchRemove"
              @select="onBatchDropdownSelect"
            >
              <NButton size="small" :disabled="!props.canBatchRemove">
                <template #icon>
                  <SvgIcon icon="material-symbols:keyboard-arrow-down-rounded" class="text-icon" />
                </template>
                {{ $t('page.wms.devanningOrder.batchOperations') }}
              </NButton>
            </NDropdown>
            <NDropdown
              trigger="click"
              placement="bottom-start"
              :options="importDropdownOptions"
              :disabled="!props.canImport"
              @select="onImportDropdownSelect"
            >
              <NButton size="small" :disabled="!props.canImport">
                <template #icon>
                  <icon-material-symbols-upload-rounded class="text-icon" />
                </template>
                {{ $t('common.import') }}
                <SvgIcon icon="material-symbols:keyboard-arrow-down-rounded" class="text-icon ml-4px op-80" />
              </NButton>
            </NDropdown>
            <NTooltip placement="top-start">
              <template #trigger>
                <NButton size="small" :disabled="!props.canImport" @click="emit('importOrder')">
                  <template #icon>
                    <SvgIcon icon="material-symbols:table-chart-outline" class="text-icon" />
                  </template>
                  {{ $t('page.wms.devanningOrder.importOrder') }}
                </NButton>
              </template>
              {{ $t('page.wms.devanningOrder.importOrderTooltip') }}
            </NTooltip>
          </NSpace>
        </template>
        <NForm ref="formRef" :model="model" label-placement="left" label-width="auto">
          <NGrid responsive="screen" item-responsive :cols="24" :x-gap="8" :y-gap="8">
            <NFormItemGi span="24 m:12 l:8" :label="$t('page.wms.devanningOrder.createTimeRange')">
              <NDatePicker
                v-model:formatted-value="createTimeRange"
                type="datetimerange"
                value-format="yyyy-MM-dd HH:mm:ss"
                clearable
                class="w-full"
                @update:formatted-value="onCreateTimeRange"
              />
            </NFormItemGi>
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
              <NInputNumber
                v-model:value="model.orderLevel"
                :placeholder="$t('page.wms.devanningOrder.orderLevelPlaceholder')"
                clearable
                class="w-full"
                :show-button="false"
              />
            </NFormItemGi>
            <NFormItemGi span="24 m:12 l:8" :label="$t('page.wms.devanningOrder.devanningStatus')">
              <NSelect
                v-model:value="model.devanningStatus"
                :options="devanningStatusFilterOptions"
                :placeholder="$t('page.wms.devanningOrder.devanningStatus')"
                clearable
                class="w-full"
              />
            </NFormItemGi>
            <NFormItemGi span="24 m:12 l:8" :label="$t('page.wms.devanningOrder.coNo')">
              <NInput v-model:value="model.coNo" size="small" clearable :placeholder="$t('page.wms.devanningOrder.coNo')" />
            </NFormItemGi>
            <NFormItemGi span="24 m:12 l:8" :label="$t('page.wms.devanningOrder.blNo')">
              <NInput v-model:value="model.blNo" size="small" clearable :placeholder="$t('page.wms.devanningOrder.blNo')" />
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
