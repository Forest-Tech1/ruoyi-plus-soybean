<script setup lang="ts" generic="T extends Record<string, unknown>, K = never">
import { computed } from 'vue';
import { VueDraggable } from 'vue-draggable-plus';
import { themeTableSizeOptions } from '@/constants/app';
import { useThemeStore } from '@/store/modules/theme';
import { $t } from '@/locales';
import { translateOptions } from '@/utils/common';

defineOptions({
  name: 'TableColumnSetting'
});

const columns = defineModel<NaiveUI.TableColumnCheck[]>('columns', {
  required: true
});

const themeStore = useThemeStore();

const tooltipRecord: Record<NaiveUI.TableColumnFixed, App.I18n.I18nKey> = {
  left: 'datatable.fixed.right',
  right: 'datatable.fixed.unFixed',
  unFixed: 'datatable.fixed.left'
};

function handleFixed(column: NaiveUI.TableColumnCheck) {
  const fixedOptions: NaiveUI.TableColumnFixed[] = ['left', 'right', 'unFixed'];
  const index = fixedOptions.findIndex(item => item === column.fixed);
  const nextIndex = index === fixedOptions.length - 1 ? 0 : index + 1;
  column.fixed = fixedOptions[nextIndex];
}

const visibleStats = computed(() => {
  let total = 0;
  let checked = 0;

  columns.value.forEach(column => {
    if (!column.visible) return;

    total += 1;
    if (column.checked) checked += 1;
  });

  return { total, checked };
});

const selectAllChecked = computed(() => {
  const { total, checked } = visibleStats.value;

  return total > 0 && checked === total;
});

const selectAllIndeterminate = computed(() => {
  const { total, checked } = visibleStats.value;

  return checked > 0 && checked < total;
});

function toggleSelectAll(checked: boolean) {
  columns.value.forEach(column => {
    if (!column.visible) return;

    column.checked = checked;
  });
}
</script>

<template>
  <NPopover placement="bottom-end" trigger="click">
    <template #trigger>
      <NButton size="small">
        <template #icon>
          <icon-ant-design-setting-outlined class="text-icon" />
        </template>
        {{ $t('common.columnSetting') }}
      </NButton>
    </template>
    <div>
      <div class="flex-col-stretch gap-10px">
        <div class="text-12px text-gray-500">{{ $t('theme.tablePropsTitle') }}</div>
        <div class="flex items-center justify-between gap-12px">
          <div class="text-12px text-gray-500">{{ $t('theme.table.size.title') }}</div>
          <NSelect
            v-model:value="themeStore.table.size"
            :options="translateOptions(themeTableSizeOptions)"
            size="small"
            class="w-120px"
          />
        </div>
        <div class="flex items-center justify-between gap-12px">
          <div class="text-12px text-gray-500">{{ $t('theme.table.bordered') }}</div>
          <NSwitch v-model:value="themeStore.table.bordered" />
        </div>
        <div class="flex items-center justify-between gap-12px">
          <div class="text-12px text-gray-500">{{ $t('theme.table.bottomBordered') }}</div>
          <NSwitch v-model:value="themeStore.table.bottomBordered" />
        </div>
        <div class="flex items-center justify-between gap-12px">
          <div class="text-12px text-gray-500">{{ $t('theme.table.singleColumn') }}</div>
          <NSwitch v-model:value="themeStore.table.singleColumn" :checked-value="false" :unchecked-value="true" />
        </div>
        <div class="flex items-center justify-between gap-12px">
          <div class="text-12px text-gray-500">{{ $t('theme.table.singleLine') }}</div>
          <NSwitch v-model:value="themeStore.table.singleLine" :checked-value="false" :unchecked-value="true" />
        </div>
        <div class="flex items-center justify-between gap-12px">
          <div class="text-12px text-gray-500">{{ $t('theme.table.striped') }}</div>
          <NSwitch v-model:value="themeStore.table.striped" />
        </div>
      </div>

      <div class="h-36px flex-y-center rd-4px pl-26px hover:(bg-primary bg-opacity-20)">
        <NCheckbox
          :checked="selectAllChecked"
          :indeterminate="selectAllIndeterminate"
          :disabled="visibleStats.total === 0"
          class="flex-1"
          @update:checked="toggleSelectAll"
        >
          {{ $t('common.selectAll') }}
        </NCheckbox>
      </div>
      <NDivider class="!my-4px" />
      <VueDraggable
        v-model="columns"
        :animation="150"
        filter=".none_draggable"
        class="column-setting-scroll overflow-y-auto max-h-[200px]"
      >
        <div
          v-for="item in columns"
          :key="item.key"
          class="h-36px flex-y-center justify-between gap-6px"
          :class="{ hidden: !item.visible }"
        >
          <div class="h-full flex-y-center flex-1 rd-4px hover:(bg-primary bg-opacity-20)">
            <icon-mdi-drag class="mr-8px h-full cursor-move text-icon" />
            <NCheckbox v-model:checked="item.checked" class="none_draggable flex-1">
              <template v-if="typeof item.title === 'function'">
                <component :is="item.title" />
              </template>
              <template v-else>{{ item.title }}</template>
            </NCheckbox>
          </div>
          <ButtonIcon
            :disabled="!item.checked"
            :focusable="false"
            :tooltip-content="$t(tooltipRecord[item.fixed || 'unFixed'])"
            @click="handleFixed(item)"
          >
            <icon-octicon-pin-16 v-if="item.fixed === 'unFixed'" />
            <icon-octicon-pin-16 v-else-if="item.fixed === 'left'" class="rotate-270" />
            <icon-octicon-pin-slash-16 v-else />
          </ButtonIcon>
        </div>
      </VueDraggable>
    </div>
  </NPopover>
</template>

<style scoped lang="scss">
.column-setting-scroll {
  @include scrollbar();
}
</style>
