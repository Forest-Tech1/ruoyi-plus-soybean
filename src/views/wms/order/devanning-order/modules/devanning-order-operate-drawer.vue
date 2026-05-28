<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { NDatePicker, NInputNumber, NSelect } from 'naive-ui';
import dayjs from 'dayjs';
import { useWindowSize } from '@vueuse/core';
import { fetchCreateDevanningOrder } from '@/service/api/wms/devanning-order';
import {
  buildDevanningStatusSelectOptions,
  DEVANNING_DEFAULT_STATUS,
  WMS_DICT_DEVANNING_ROUND
} from '@/constants/wms-devanning';
import DictSelect from '@/components/custom/dict-select.vue';
import { useFormRules, useNaiveForm } from '@/hooks/common/form';
import { $t } from '@/locales';
import DevanningOrderOperateInboundEditor from './devanning-order-operate-inbound-editor.vue';

defineOptions({
  name: 'DevanningOrderOperateDrawer'
});

interface Emits {
  (e: 'submitted'): void;
}

const emit = defineEmits<Emits>();

const visible = defineModel<boolean>('visible', {
  default: false
});

const { width } = useWindowSize();
const drawerWidth = computed(() => Math.max(520, Math.min(920, Math.floor((width.value * 2) / 3))));

const activeTab = ref<'basic' | 'inbound'>('basic');

const { formRef: basicFormRef, validate: validateBasic, restoreValidation: restoreValidationBasic } = useNaiveForm();

const { createRequiredRule } = useFormRules();

const title = computed(() => $t('page.wms.devanningOrder.newOrder'));

const devanningStatusOptions = computed(() => buildDevanningStatusSelectOptions($t));

/** 新建单展示用：下单日期取提交当日（与创建日一致） */
const orderDateTodayDisplay = computed(() => dayjs().format('YYYY-MM-DD'));

type Model = Api.Wms.DevanningOrderOperateParams;

const model = ref<Model>(createDefaultModel());

type DraftRow = Api.Wms.DevanningInboundPlanCreateLine & { _key: string };

const inboundDraftLines = ref<DraftRow[]>([]);

const expectedStr = ref<string | null>(null);

function createDefaultModel(): Model {
  return {
    id: null,
    coNo: '',
    blNo: '',
    orderDate: null,
    expectedDevanningTime: null,
    devanningRound: null,
    orderLevel: null,
    devanningStatus: DEVANNING_DEFAULT_STATUS,
    inboundWarehouse: '',
    devanningDock: '',
    driverPhone: '',
    cargoQty: null,
    cargoWeight: null,
    remark: ''
  };
}

const basicRules: Record<'coNo', App.Global.FormRule> = {
  coNo: createRequiredRule($t('page.wms.devanningOrder.form.coNoRequired'))
};

function closeDrawer() {
  visible.value = false;
}

function onExpected(v: string | null) {
  model.value.expectedDevanningTime = v || null;
}

function validateInboundPlansHuman(): boolean {
  if (!inboundDraftLines.value.length) {
    window.$message?.warning($t('page.wms.devanningOrder.inboundPlanAtLeastOne'));
    return false;
  }
  for (let i = 0; i < inboundDraftLines.value.length; i += 1) {
    const r = inboundDraftLines.value[i];
    const so = r.systemSoNo?.trim();
    const sc = r.shipmentCode?.trim();
    if (!so && !sc) {
      window.$message?.warning($t('page.wms.devanningOrder.inboundPlanRowNeedIdentifier', { index: i + 1 }));
      return false;
    }
  }
  return true;
}

function stripDraftToCreateLine(row: DraftRow): Api.Wms.DevanningInboundPlanCreateLine {
  return {
    systemSoNo: row.systemSoNo?.trim() || null,
    shipmentCode: row.shipmentCode?.trim() || null,
    platform: row.platform?.trim() || null,
    warehouseCode: row.warehouseCode?.trim() || null,
    addressType: row.addressType?.trim() || null,
    deliveryMethod: row.deliveryMethod?.trim() || null,
    totalPieces: row.totalPieces ?? null,
    weight: row.weight ?? null,
    volumeCbm: row.volumeCbm ?? null,
    remark: row.remark?.trim() || null
  };
}

async function handleSubmit() {
  await validateBasic();
  if (!validateInboundPlansHuman()) {
    activeTab.value = 'inbound';
    return;
  }

  /** 下单日期 = 创建日（提交当日），无需用户选择；预计拆柜仅有日期时：有日期→待安排，无→待拆柜 */
  const hasExpected = Boolean(model.value.expectedDevanningTime && String(model.value.expectedDevanningTime).trim());
  const payload: Api.Wms.DevanningOrderCreateParams = {
    ...model.value,
    blNo: model.value.blNo?.trim() || null,
    driverPhone: model.value.driverPhone?.trim() || null,
    orderDate: dayjs().format('YYYY-MM-DD'),
    status: hasExpected ? 'pending_schedule' : 'pending_devanning',
    devanningStatus: model.value.devanningStatus ?? DEVANNING_DEFAULT_STATUS,
    inboundPlans: inboundDraftLines.value.map(stripDraftToCreateLine)
  };

  const { error } = await fetchCreateDevanningOrder(payload);
  if (error) return;
  window.$message?.success($t('common.addSuccess'));
  closeDrawer();
  emit('submitted');
}

watch(visible, async () => {
  if (!visible.value) return;
  /** 必须先同步重置表单与入库计划行，再 await；否则用户在 await 间隙切换 Tab 并「添加入库计划行」会被后续清空 */
  activeTab.value = 'basic';
  model.value = createDefaultModel();
  expectedStr.value = null;
  inboundDraftLines.value = [];
  await restoreValidationBasic();
});
</script>

<template>
  <NDrawer v-model:show="visible" :width="drawerWidth" display-directive="show" class="max-w-full">
    <NDrawerContent :title="title" closable>
      <NTabs v-model:value="activeTab" type="line" class="min-h-0 flex-1">
        <NTabPane name="basic" :tab="$t('page.wms.devanningOrder.detailTabBasic')">
          <NForm
            ref="basicFormRef"
            :model="model"
            :rules="basicRules"
            label-placement="left"
            label-width="100px"
            class="max-h-[calc(100vh-200px)] overflow-y-auto pr-8px"
          >
            <NFormItem path="coNo" :label="$t('page.wms.devanningOrder.coNo')">
              <NInput v-model:value="model.coNo" :placeholder="$t('page.wms.devanningOrder.coNo')" />
            </NFormItem>
            <NFormItem path="blNo" :label="$t('page.wms.devanningOrder.blNo')">
              <NInput v-model:value="model.blNo" :placeholder="$t('page.wms.devanningOrder.blNo')" />
            </NFormItem>
            <NFormItem :label="$t('page.wms.devanningOrder.orderDate')">
              <NInput
                :value="`${orderDateTodayDisplay}（${$t('page.wms.devanningOrder.orderDateAutoTip')}）`"
                disabled
                class="opacity-90"
              />
            </NFormItem>
            <NFormItem :label="$t('page.wms.devanningOrder.expectedDevanningTime')">
              <NDatePicker
                v-model:formatted-value="expectedStr"
                type="date"
                value-format="yyyy-MM-dd"
                clearable
                class="w-full"
                @update:formatted-value="onExpected"
              />
            </NFormItem>
            <NFormItem :label="$t('page.wms.devanningOrder.devanningRound')">
              <DictSelect
                v-model:value="model.devanningRound"
                :dict-code="WMS_DICT_DEVANNING_ROUND"
                :immediate="true"
                clearable
                class="w-full"
                :placeholder="$t('page.wms.devanningOrder.devanningRound')"
              />
            </NFormItem>
            <NFormItem :label="$t('page.wms.devanningOrder.orderLevel')">
              <NInputNumber
                v-model:value="model.orderLevel"
                clearable
                class="w-full"
                :show-button="false"
                :placeholder="$t('page.wms.devanningOrder.orderLevelPlaceholder')"
              />
            </NFormItem>
            <NFormItem :label="$t('page.wms.devanningOrder.devanningStatus')">
              <NSelect
                v-model:value="model.devanningStatus"
                :options="devanningStatusOptions"
                class="w-full"
                :placeholder="$t('page.wms.devanningOrder.devanningStatus')"
              />
            </NFormItem>
            <NFormItem :label="$t('page.wms.devanningOrder.inboundWarehouse')">
              <NInput v-model:value="model.inboundWarehouse" />
            </NFormItem>
            <NFormItem :label="$t('page.wms.devanningOrder.devanningDock')">
              <NInput v-model:value="model.devanningDock" />
            </NFormItem>
            <NFormItem :label="$t('page.wms.devanningOrder.driverPhone')">
              <NInput
                v-model:value="model.driverPhone"
                :placeholder="$t('page.wms.devanningOrder.driverPhonePlaceholder')"
              />
            </NFormItem>
            <NFormItem :label="$t('page.wms.devanningOrder.cargoQty')">
              <NInputNumber v-model:value="model.cargoQty" class="w-full" :min="0" />
            </NFormItem>
            <NFormItem :label="$t('page.wms.devanningOrder.cargoWeight')">
              <NInputNumber v-model:value="model.cargoWeight" class="w-full" :min="0" :precision="3" />
            </NFormItem>
            <NFormItem :label="$t('page.common.remark')">
              <NInput v-model:value="model.remark" type="textarea" />
            </NFormItem>
          </NForm>
        </NTabPane>
        <NTabPane name="inbound" :tab="$t('page.wms.devanningOrder.detailTabInbound')">
          <div class="min-h-320px">
            <DevanningOrderOperateInboundEditor v-model:lines="inboundDraftLines" />
          </div>
        </NTabPane>
      </NTabs>
      <template #footer>
        <NSpace :size="16">
          <NButton @click="closeDrawer">{{ $t('common.cancel') }}</NButton>
          <NButton type="primary" @click="handleSubmit">{{ $t('common.confirm') }}</NButton>
        </NSpace>
      </template>
    </NDrawerContent>
  </NDrawer>
</template>

<style scoped></style>
