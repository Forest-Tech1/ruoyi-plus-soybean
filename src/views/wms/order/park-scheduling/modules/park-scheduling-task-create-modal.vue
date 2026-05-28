<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import dayjs from 'dayjs';
import { jsonClone } from '@sa/utils';
import { fetchBatchCreateParkSchedulingTask } from '@/service/api/wms/park-scheduling';
import {
  PARK_DEVANNING_BATCH_STATUS,
  getDefaultParkTaskPlannedWorkDate,
  normalizeParkBatchUpsertResult,
  parseParkDevanningBatchPaste,
  parseParkTaskCoNoBatch,
  type ParkDevanningBatchPasteStatus
} from '@/constants/wms-park';
import { WMS_DICT_DEVANNING_ROUND } from '@/constants/wms-devanning';
import { useFormRules, useNaiveForm } from '@/hooks/common/form';
import { useDict } from '@/hooks/business/dict';
import { $t } from '@/locales';
import DictSelect from '@/components/custom/dict-select.vue';
import { enrichDevanningBatchPasteItems } from './park-batch-paste-resolve';
import {
  buildParkDockSuggestOptionsFromBoard,
  fetchParkDockSuggestOptions,
  mergeParkDockSuggestOptions,
  type ParkDockSuggestOption
} from './park-dock-suggest';

defineOptions({
  name: 'ParkSchedulingTaskCreateModal'
});

export type ParkCreatePresetDock = {
  id: CommonType.IdType;
  slotName: string;
  assignMode: 'current' | 'queued';
  /** 与道口业务类型对齐，打开弹窗时默认选中任务类型 */
  businessType?: Api.Wms.ParkTaskType | null;
};

const props = defineProps<{
  /** 从 Dock 卡片「添加作业」带入；与 visible 同时由父级设置 */
  presetDock?: ParkCreatePresetDock | null;
  /** 当前看板，用于道口识别码模糊匹配 */
  board?: Api.Wms.ParkSchedulingBoard | null;
}>();

const emit = defineEmits<{
  submitted: [];
  batchResult: [result: Api.Wms.ParkSchedulingBatchUpsertResult];
}>();

useDict(WMS_DICT_DEVANNING_ROUND, true);

const visible = defineModel<boolean>('visible', { default: false });
const submitting = ref(false);
const dockOptions = ref<ParkDockSuggestOption[]>([]);

const { formRef, validate, restoreValidation } = useNaiveForm();
const { createRequiredRule } = useFormRules();

const taskType = ref<Api.Wms.ParkTaskType>('devanning');
/** 支持多行 / 逗号 / 分号 / 空格分隔批量柜号 */
const coNoBatch = ref('');
const plannedWorkDate = ref(getDefaultParkTaskPlannedWorkDate());
const devanningRound = ref<string | null>(null);
const remark = ref('');
/** 本次打开弹窗时锁定的 Dock 指派（避免提交过程中父级清空 preset） */
const appliedDockAssign = ref<ParkCreatePresetDock | null>(null);

const taskTypeOptions = [
  { label: $t('page.wms.parkScheduling.taskTypeDevanning'), value: 'devanning' },
  { label: $t('page.wms.parkScheduling.taskTypeLoading'), value: 'loading' }
];

const devanningPasteRaw = computed(() =>
  taskType.value === 'devanning' ? parseParkDevanningBatchPaste(coNoBatch.value) : { items: [], skipped: [] }
);

const devanningPasteResolved = computed(() => {
  if (taskType.value !== 'devanning') {
    return { items: [] as ReturnType<typeof enrichDevanningBatchPasteItems>['items'], skipped: [] };
  }
  const preset =
    appliedDockAssign.value?.id != null
      ? {
          id: appliedDockAssign.value.id,
          slotName: appliedDockAssign.value.slotName,
          assignMode: appliedDockAssign.value.assignMode
        }
      : null;
  return enrichDevanningBatchPasteItems(devanningPasteRaw.value.items, dockOptions.value, preset);
});

/** 拆柜：柜号 + 状态 + 车数/体积 + 道口；装车：仅柜号列表 */
const parsedBatchItems = computed(() => {
  if (taskType.value === 'devanning') {
    return devanningPasteResolved.value.items;
  }
  return parseParkTaskCoNoBatch(coNoBatch.value).map(coNo => ({ coNo, status: 'pending' as const }));
});

const parsedCoNos = computed(() => parsedBatchItems.value.map(i => i.coNo));

const allPasteSkipped = computed(() => [
  ...devanningPasteRaw.value.skipped,
  ...devanningPasteResolved.value.skipped
]);

const devanningBatchBreakdown = computed(() => {
  const items = parsedBatchItems.value;
  const count = (s: ParkDevanningBatchPasteStatus) => items.filter(i => i.status === s).length;
  const withRatio = items.filter(i => i.vehicleCount != null && i.volume != null).length;
  const withDock = items.filter(i => i.dockId != null).length;
  const skipped = allPasteSkipped.value;
  return {
    total: items.length,
    pending: count(PARK_DEVANNING_BATCH_STATUS.PENDING),
    notArrived: count(PARK_DEVANNING_BATCH_STATUS.NOT_ARRIVED),
    inProgress: count(PARK_DEVANNING_BATCH_STATUS.IN_PROGRESS),
    inventoryUpdate: count(PARK_DEVANNING_BATCH_STATUS.INVENTORY_UPDATE),
    completed: count(PARK_DEVANNING_BATCH_STATUS.COMPLETED),
    skipped: skipped.length,
    hyphenSkipped: skipped.filter(s => s.reason === 'CO_NO_HYPHEN').length,
    dockSkipped: skipped.filter(s => s.reason === 'DOCK_NOT_MATCHED').length,
    inProgressDockSkipped: skipped.filter(s => s.reason === 'DOCK_REQUIRED_IN_PROGRESS').length,
    withRatio,
    withDock
  };
});

const coNoBatchValidateMessage = computed(() => {
  if (parsedCoNos.value.length > 0) return '';
  const raw = coNoBatch.value.trim();
  if (!raw) return $t('page.wms.parkScheduling.form.coNoRequired');
  if (taskType.value === 'devanning' && allPasteSkipped.value.length > 0) {
    const skipped = allPasteSkipped.value;
    const hyphenOnly = skipped.length > 0 && skipped.every(s => s.reason === 'CO_NO_HYPHEN');
    if (hyphenOnly) {
      return $t('page.wms.parkScheduling.form.coNoBatchHyphenSkipped', { count: skipped.length });
    }
    const dockOnly =
      skipped.length > 0 &&
      skipped.every(s => s.reason === 'DOCK_NOT_MATCHED' || s.reason === 'DOCK_REQUIRED_IN_PROGRESS');
    if (dockOnly) {
      return $t('page.wms.parkScheduling.form.coNoBatchDockSkipped');
    }
    return $t('page.wms.parkScheduling.form.coNoBatchSkippedOnly');
  }
  return $t('page.wms.parkScheduling.form.coNoBatchEmpty');
});

const rules = computed(() => ({
  coNoBatch: [
    {
      validator: () => parsedCoNos.value.length > 0,
      message: () => coNoBatchValidateMessage.value,
      trigger: ['blur', 'change']
    }
  ],
  plannedWorkDate: [createRequiredRule($t('page.wms.parkScheduling.form.plannedWorkTimeRequired'))]
}));

const presetHint = computed(() => {
  const d = appliedDockAssign.value;
  if (!d) return '';
  if (d.assignMode === 'current') {
    return $t('page.wms.parkScheduling.createTaskDockPresetCurrent', { name: d.slotName });
  }
  return $t('page.wms.parkScheduling.createTaskDockPresetQueued', { name: d.slotName });
});

async function loadDockOptions() {
  const fromBoard = buildParkDockSuggestOptionsFromBoard(props.board ?? null, 'devanning');
  const fromMaster = await fetchParkDockSuggestOptions('devanning');
  dockOptions.value = mergeParkDockSuggestOptions(fromBoard, fromMaster);
}

function resetForm() {
  taskType.value = 'devanning';
  coNoBatch.value = '';
  plannedWorkDate.value = getDefaultParkTaskPlannedWorkDate();
  devanningRound.value = null;
  remark.value = '';
}

watch(visible, v => {
  if (v) {
    appliedDockAssign.value = props.presetDock ? jsonClone(props.presetDock) : null;
    resetForm();
    const bt = props.presetDock?.businessType;
    if (bt === 'devanning' || bt === 'loading') {
      taskType.value = bt;
    }
    void loadDockOptions();
    restoreValidation();
  } else {
    appliedDockAssign.value = null;
  }
});

function buildDevanningBatchPayload(): Api.Wms.ParkSchedulingTaskBatchCreateParams {
  const expectedDevanningTime = dayjs(plannedWorkDate.value).format('YYYY-MM-DD');
  const dock = appliedDockAssign.value;
  const items = parsedBatchItems.value;
  const anyPerRowDock = items.some(i => i.dockId != null);

  return {
    taskType: 'devanning',
    coNos: parsedCoNos.value,
    batchItems: items.map(i => ({
      coNo: i.coNo,
      status: i.status,
      vehicleCount: i.vehicleCount ?? null,
      volume: i.volume ?? null,
      dockId: i.dockId ?? null,
      devanningDock: i.devanningDock ?? null,
      assignToDockMode: i.assignToDockMode ?? null
    })),
    orderLevel: null,
    expectedDevanningTime,
    devanningRound: devanningRound.value,
    remark: remark.value.trim() || null,
    ...(dock && !anyPerRowDock
      ? { dockId: dock.id, assignToDockMode: dock.assignMode }
      : { dockId: undefined, assignToDockMode: undefined })
  };
}

async function handleSubmit() {
  await validate();
  const coNos = parsedCoNos.value;
  if (!coNos.length) {
    window.$message?.warning($t('page.wms.parkScheduling.form.coNoBatchEmpty'));
    return;
  }
  submitting.value = true;
  try {
    const payload =
      taskType.value === 'devanning'
        ? buildDevanningBatchPayload()
        : {
            taskType: taskType.value,
            coNos,
            orderLevel: null,
            plannedWorkTime: dayjs(plannedWorkDate.value).startOf('day').format('YYYY-MM-DD HH:mm:ss'),
            devanningRound: devanningRound.value,
            remark: remark.value.trim() || null
          };

    const { data, error } = await fetchBatchCreateParkSchedulingTask(payload);
    if (error) return;

    if (taskType.value === 'devanning') {
      const result = normalizeParkBatchUpsertResult(data);
      if (result) {
        emit('batchResult', result);
        if (result.successCount > 0) {
          window.$message?.success(
            $t('page.wms.parkScheduling.batchCreateSuccess', { count: result.successCount })
          );
        } else {
          window.$message?.warning($t('page.wms.parkScheduling.batchResultAllFailed'));
        }
      } else {
        window.$message?.success($t('page.wms.parkScheduling.batchCreateSuccess', { count: coNos.length }));
      }
    } else {
      window.$message?.success($t('page.wms.parkScheduling.batchCreateSuccess', { count: coNos.length }));
    }

    visible.value = false;
    emit('submitted');
  } finally {
    submitting.value = false;
  }
}
</script>

<template>
  <NModal
    v-model:show="visible"
    preset="card"
    :title="$t('page.wms.parkScheduling.createTask')"
    class="w-520px max-w-[94vw]"
    :bordered="false"
  >
    <NAlert v-if="presetHint" type="info" class="mb-12px" :bordered="false">
      {{ presetHint }}
    </NAlert>
    <NForm
      ref="formRef"
      :model="{ coNoBatch, plannedWorkDate }"
      :rules="rules"
      label-placement="left"
      label-width="108"
    >
      <NFormItem :label="$t('page.wms.parkScheduling.taskType')">
        <NRadioGroup v-model:value="taskType">
          <NSpace>
            <NRadio v-for="opt in taskTypeOptions" :key="opt.value" :value="opt.value">
              {{ opt.label }}
            </NRadio>
          </NSpace>
        </NRadioGroup>
      </NFormItem>
      <NFormItem :label="$t('page.wms.parkScheduling.coNoBatch')" path="coNoBatch">
        <NInput
          v-model:value="coNoBatch"
          type="textarea"
          :rows="6"
          :placeholder="
            taskType === 'devanning'
              ? $t('page.wms.parkScheduling.coNoBatchPlaceholderDevanning')
              : $t('page.wms.parkScheduling.coNoBatchPlaceholder')
          "
        />
        <div v-if="parsedCoNos.length" class="mt-6px text-12px text-gray-500 dark:text-gray-400">
          <template v-if="taskType === 'devanning'">
            {{
              $t('page.wms.parkScheduling.coNoBatchParsedDevanning', {
                count: devanningBatchBreakdown.total,
                pending: devanningBatchBreakdown.pending,
                notArrived: devanningBatchBreakdown.notArrived,
                inProgress: devanningBatchBreakdown.inProgress,
                inventoryUpdate: devanningBatchBreakdown.inventoryUpdate,
                completed: devanningBatchBreakdown.completed
              })
            }}
            <template v-if="devanningBatchBreakdown.withDock">
              {{
                $t('page.wms.parkScheduling.coNoBatchParsedWithDock', {
                  count: devanningBatchBreakdown.withDock
                })
              }}
            </template>
            <template v-if="devanningBatchBreakdown.withRatio">
              {{ $t('page.wms.parkScheduling.coNoBatchParsedWithRatio', { count: devanningBatchBreakdown.withRatio }) }}
            </template>
            <template v-if="devanningBatchBreakdown.skipped">
              {{ $t('page.wms.parkScheduling.coNoBatchParsedSkipped', { count: devanningBatchBreakdown.skipped }) }}
            </template>
          </template>
          <template v-else>
            {{ $t('page.wms.parkScheduling.coNoBatchParsed', { count: parsedCoNos.length }) }}
          </template>
        </div>
        <div
          v-else-if="coNoBatch.trim()"
          class="mt-6px text-12px text-[var(--n-warning-color)]"
        >
          {{ coNoBatchValidateMessage }}
        </div>
      </NFormItem>
      <NFormItem
        :label="
          taskType === 'devanning'
            ? $t('page.wms.devanningOrder.expectedDevanningTime')
            : $t('page.wms.parkScheduling.plannedWorkTime')
        "
        path="plannedWorkDate"
      >
        <NDatePicker v-model:formatted-value="plannedWorkDate" type="date" value-format="yyyy-MM-dd" class="w-full" />
      </NFormItem>
      <NFormItem v-if="taskType === 'devanning'" :label="$t('page.wms.parkScheduling.devanningRound')">
        <DictSelect v-model:value="devanningRound" :dict-code="WMS_DICT_DEVANNING_ROUND" clearable />
      </NFormItem>
      <NFormItem :label="$t('page.wms.parkScheduling.remark')">
        <NInput v-model:value="remark" type="textarea" :rows="2" />
      </NFormItem>
    </NForm>
    <template #footer>
      <NSpace justify="end">
        <NButton @click="visible = false">{{ $t('common.cancel') }}</NButton>
        <NButton type="primary" :loading="submitting" @click="handleSubmit">{{ $t('common.confirm') }}</NButton>
      </NSpace>
    </template>
  </NModal>
</template>
