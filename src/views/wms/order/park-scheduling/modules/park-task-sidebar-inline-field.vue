<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, ref, watch } from 'vue';
import type { SelectOption } from 'naive-ui';
import { NInputNumber, NSelect } from 'naive-ui';
import { fetchPatchParkSchedulingTask } from '@/service/api/wms/park-scheduling';
import { normalizeParkOrderLevel } from '@/constants/wms-park';
import { useAuth } from '@/hooks/business/auth';
import { $t } from '@/locales';

defineOptions({
  name: 'ParkTaskSidebarInlineField'
});

const props = defineProps<{
  task: Api.Wms.ParkSchedulingTask;
  kind: 'orderLevel' | 'devanningRound' | 'dock';
  /** 拆柜轮次 dict_value → dict_label */
  dictRecord?: Record<string, string>;
  /** Dock 下拉（value 为 id 字符串） */
  dockOptions?: SelectOption[];
  /** 拆柜轮次下拉 */
  roundOptions?: SelectOption[];
}>();

const emit = defineEmits<{
  patched: [];
}>();

const { hasAuth } = useAuth();

const editing = ref(false);
const saving = ref(false);
const draft = ref<string | number | null>(null);
const wrapRef = ref<HTMLElement | null>(null);

const canUse = computed(() => hasAuth('wms:parkScheduling:edit'));

const canEditDevanningFields = computed(
  () => props.kind === 'dock' || props.task.taskType === 'devanning'
);

const displayLabel = computed(() => {
  if (props.kind === 'orderLevel') {
    const n = normalizeParkOrderLevel(props.task.orderLevel);
    return n != null ? String(n) : '—';
  }
  if (props.kind === 'devanningRound') {
    const v = props.task.devanningRound;
    if (!v) return '—';
    return props.dictRecord?.[v] ?? v;
  }
  const d = (props.task.devanningDock ?? props.task.dockName ?? '').trim();
  return d || '—';
});

function sameOrderLevel(a: number | null, b: number | null | undefined) {
  return (a ?? null) === (normalizeParkOrderLevel(b) ?? null);
}

function sameRound(a: string | null, b: string | null | undefined) {
  const x = a ?? '';
  const y = String(b ?? '').trim();
  return x === y;
}

function sameDock(a: string | null, b: CommonType.IdType | null | undefined) {
  if (a == null || a === '') return b == null || b === '';
  return String(b ?? '') === a;
}

async function onOrderLevelCommit(v: number | null) {
  const next = normalizeParkOrderLevel(v);
  if (sameOrderLevel(next, props.task.orderLevel)) {
    cancel();
    return;
  }
  await savePatch({ orderLevel: next });
}

function beginEdit() {
  if (!canUse.value || !canEditDevanningFields.value) return;
  editing.value = true;
  if (props.kind === 'orderLevel') {
    draft.value = normalizeParkOrderLevel(props.task.orderLevel);
  } else if (props.kind === 'devanningRound') {
    draft.value = props.task.devanningRound?.trim() ? String(props.task.devanningRound) : null;
  } else {
    draft.value = props.task.dockId != null ? String(props.task.dockId) : null;
  }
  void nextTick(() => {
    wrapRef.value?.focus();
  });
}

function cancel() {
  editing.value = false;
  draft.value = null;
}

async function savePatch(patch: Partial<Pick<Api.Wms.ParkSchedulingTaskPatchParams, 'orderLevel' | 'devanningRound' | 'dockId'>>) {
  saving.value = true;
  try {
    const { error } = await fetchPatchParkSchedulingTask({
      taskId: props.task.id,
      ...patch
    });
    if (error) {
      cancel();
      return;
    }
    window.$message?.success($t('page.wms.parkScheduling.inlinePatchSuccess'));
    editing.value = false;
    draft.value = null;
    emit('patched');
  } finally {
    saving.value = false;
  }
}

function onDockSelect(v: string | null) {
  const next = v && v.trim() ? v : null;
  if (sameDock(next, props.task.dockId)) {
    cancel();
    return;
  }
  void savePatch({ dockId: (next as unknown as CommonType.IdType) ?? null });
}

function onRoundSelect(v: string | null) {
  const next = v && String(v).trim() ? String(v) : null;
  if (sameRound(next, props.task.devanningRound)) {
    cancel();
    return;
  }
  void savePatch({ devanningRound: next });
}

function onSelectKeydown(e: KeyboardEvent) {
  if (e.key === 'Escape') {
    e.stopPropagation();
    cancel();
  }
}

function onKeydown(e: KeyboardEvent) {
  if (e.key === 'Escape') {
    e.preventDefault();
    cancel();
  }
}

let docPointerBound = false;

function handleDocPointerDown(ev: MouseEvent | PointerEvent) {
  if (!editing.value || saving.value) return;
  const t = ev.target;
  if (!(t instanceof Node)) return;
  if (wrapRef.value?.contains(t)) return;
  const el = t instanceof Element ? t : (t.parentElement as Element | null);
  if (el?.closest?.('.n-base-select-menu')) return;
  cancel();
}

function bindDocClose() {
  if (docPointerBound) return;
  docPointerBound = true;
  window.addEventListener('pointerdown', handleDocPointerDown, true);
}

function unbindDocClose() {
  if (!docPointerBound) return;
  docPointerBound = false;
  window.removeEventListener('pointerdown', handleDocPointerDown, true);
}

watch(editing, ed => {
  if (ed) bindDocClose();
  else unbindDocClose();
});

onBeforeUnmount(() => {
  unbindDocClose();
});

watch(
  () => props.task.id,
  () => {
    if (editing.value) cancel();
  }
);
</script>

<template>
  <div ref="wrapRef" class="park-task-inline min-w-0" tabindex="-1" @keydown="onKeydown">
    <span
      v-if="!editing"
      class="park-task-inline__text"
      :class="{ 'park-task-inline__text--muted': !canUse || !canEditDevanningFields }"
      @dblclick="beginEdit"
    >
      {{ displayLabel }}
    </span>
    <NInputNumber
      v-else-if="kind === 'orderLevel'"
      :value="draft as number | null"
      size="tiny"
      class="park-task-inline__control"
      :loading="saving"
      clearable
      :show-button="false"
      @update:value="onOrderLevelCommit"
      @keydown="onSelectKeydown"
    />
    <NSelect
      v-else-if="kind === 'devanningRound'"
      :value="draft"
      size="tiny"
      class="park-task-inline__control"
      :loading="saving"
      filterable
      clearable
      :consistent-menu-width="false"
      :options="roundOptions ?? []"
      @update:value="onRoundSelect"
      @keydown="onSelectKeydown"
    />
    <NSelect
      v-else-if="kind === 'dock'"
      :value="draft"
      size="tiny"
      class="park-task-inline__control"
      :loading="saving"
      filterable
      clearable
      :consistent-menu-width="false"
      :options="dockOptions ?? []"
      @update:value="onDockSelect"
      @keydown="onSelectKeydown"
    />
  </div>
</template>

<style scoped>
.park-task-inline__text {
  display: block;
  min-height: 22px;
  line-height: 22px;
  cursor: default;
  border-radius: 2px;
  padding: 0 2px;
}

.park-task-inline__text:not(.park-task-inline__text--muted) {
  cursor: text;
}

.park-task-inline__text:not(.park-task-inline__text--muted):hover {
  outline: 1px dashed rgb(24 144 255 / 45%);
}

.park-task-inline__text--muted {
  opacity: 0.75;
}

.park-task-inline__control {
  width: 100%;
}
</style>
