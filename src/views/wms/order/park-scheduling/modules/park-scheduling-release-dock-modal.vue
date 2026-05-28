<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import {
  buildParkDockSuggestOptionsFromBoard,
  countActiveCoOnDock,
  fetchParkDockSuggestOptions,
  filterParkDockSuggestOptions,
  findParkDockSuggestOption,
  fuzzyMatchParkDockQuery,
  mergeParkDockSuggestOptions,
  type ParkDockSuggestOption
} from './park-dock-suggest';
import { fetchReleaseParkDock } from '@/service/api/wms/park-scheduling';
import { $t } from '@/locales';

defineOptions({
  name: 'ParkSchedulingReleaseDockModal'
});

const visible = defineModel<boolean>('visible', { default: false });

const props = defineProps<{
  board: Api.Wms.ParkSchedulingBoard | null;
  taskType: Api.Wms.ParkTaskType;
}>();

const emit = defineEmits<{
  released: [];
}>();

const searchText = ref('');
const selectedDockId = ref<CommonType.IdType | null>(null);
const allOptions = ref<ParkDockSuggestOption[]>([]);
const optionsLoading = ref(false);
const submitting = ref(false);

const autocompleteOptions = computed(() => {
  const q = searchText.value.trim();
  if (selectedDockId.value != null) {
    const picked = findParkDockSuggestOption(allOptions.value, selectedDockId.value);
    if (picked && (!q || fuzzyMatchParkDockQuery(q, picked))) {
      return [{ label: picked.label, value: picked.label }];
    }
  }
  return filterParkDockSuggestOptions(allOptions.value, q).map(o => ({
    label: o.label,
    value: o.label
  }));
});

const selectedDock = computed(() => findParkDockSuggestOption(allOptions.value, selectedDockId.value));

async function loadDockOptions() {
  optionsLoading.value = true;
  try {
    const fromBoard = buildParkDockSuggestOptionsFromBoard(props.board, props.taskType);
    const fromMaster = await fetchParkDockSuggestOptions(props.taskType);
    allOptions.value = mergeParkDockSuggestOptions(fromBoard, fromMaster);
  } finally {
    optionsLoading.value = false;
  }
}

function resetForm() {
  searchText.value = '';
  selectedDockId.value = null;
}

function resolveDockFromInput(text: string): ParkDockSuggestOption | null {
  const trimmed = text.trim();
  if (!trimmed) return null;
  const exact = allOptions.value.find(o => o.label === trimmed || o.slotName === trimmed);
  if (exact) return exact;
  const fuzzy = filterParkDockSuggestOptions(allOptions.value, trimmed);
  return fuzzy.length === 1 ? fuzzy[0]! : null;
}

function onSearchUpdate(text: string) {
  searchText.value = text;
  const resolved = resolveDockFromInput(text);
  selectedDockId.value = resolved?.dockId ?? null;
}

function onAutocompleteSelect(label: string) {
  const opt = allOptions.value.find(o => o.label === label);
  if (!opt) return;
  searchText.value = opt.label;
  selectedDockId.value = opt.dockId;
}

function confirmReleaseWarning(dock: ParkDockSuggestOption, coCount: number): Promise<boolean> {
  return new Promise(resolve => {
    const d = window.$dialog;
    if (!d) {
      resolve(false);
      return;
    }
    let settled = false;
    const finish = (v: boolean) => {
      if (settled) return;
      settled = true;
      resolve(v);
    };
    d.warning({
      title: $t('common.warning'),
      content: $t('page.wms.parkScheduling.releaseDockConfirm', {
        dock: dock.slotName,
        count: coCount
      }),
      positiveText: $t('common.confirm'),
      negativeText: $t('common.cancel'),
      /** 须高于本弹窗 NModal（3200），否则二次确认被挡住 */
      zIndex: 4000,
      onPositiveClick: () => {
        finish(true);
        return true;
      },
      onNegativeClick: () => {
        finish(false);
        return true;
      },
      onClose: () => finish(false)
    });
  });
}

async function handleConfirm() {
  const dock =
    selectedDock.value ?? resolveDockFromInput(searchText.value);
  if (!dock) {
    window.$message?.warning($t('page.wms.parkScheduling.releaseDockPickDock'));
    return;
  }

  const coCount = countActiveCoOnDock(props.board, dock.dockId);
  const ok = await confirmReleaseWarning(dock, coCount);
  if (!ok) return;

  submitting.value = true;
  try {
    const { error } = await fetchReleaseParkDock({
      dockId: dock.dockId,
      taskType: props.taskType
    });
    if (error) return;
    window.$message?.success($t('page.wms.parkScheduling.releaseDockSuccess', { dock: dock.slotName }));
    visible.value = false;
    emit('released');
  } finally {
    submitting.value = false;
  }
}

watch(visible, v => {
  if (v) {
    resetForm();
    void loadDockOptions();
  }
});
</script>

<template>
  <NModal
    v-model:show="visible"
    preset="card"
    :title="$t('page.wms.parkScheduling.releaseDockModalTitle')"
    class="w-[min(480px,94vw)]"
    :bordered="false"
    :mask-closable="false"
    to="body"
    :z-index="3000"
  >
    <div class="flex flex-col gap-12px">
      <NFormItem :label="$t('page.wms.parkScheduling.releaseDockField')" label-placement="top">
        <NAutoComplete
          v-model:value="searchText"
          :options="autocompleteOptions"
          :loading="optionsLoading"
          clearable
          :placeholder="$t('page.wms.parkScheduling.releaseDockPlaceholder')"
          :get-show="() => true"
          @update:value="onSearchUpdate"
          @select="onAutocompleteSelect"
        />
      </NFormItem>
      <NText depth="3" class="text-13px leading-relaxed">
        {{ $t('page.wms.parkScheduling.releaseDockHint') }}
      </NText>
    </div>

    <template #footer>
      <NSpace justify="end" :size="12">
        <NButton :disabled="submitting" @click="visible = false">{{ $t('common.cancel') }}</NButton>
        <NButton type="warning" :loading="submitting" @click="handleConfirm">
          {{ $t('common.confirm') }}
        </NButton>
      </NSpace>
    </template>
  </NModal>
</template>
