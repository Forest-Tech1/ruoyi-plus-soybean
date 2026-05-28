<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { getDefaultDriverCheckInRecordTimeRange } from '@/constants/wms-driver-check-in';
import { $t } from '@/locales';

defineOptions({
  name: 'DriverCheckInRecordSearch'
});

interface Emits {
  (e: 'search'): void;
  (e: 'reset'): void;
}

const emit = defineEmits<Emits>();

const model = defineModel<Api.Wms.DriverCheckInRecordSearchParams>('model', { required: true });

const checkedInRange = ref<[string, string] | null>(null);

function syncRangeToParams(value: [string, string] | null) {
  if (!model.value.params) model.value.params = {};
  const p = model.value.params;
  if (value?.length === 2) {
    p.checkedInBegin = value[0];
    p.checkedInEnd = value[1];
  } else {
    p.checkedInBegin = undefined;
    p.checkedInEnd = undefined;
  }
}

function initTodayRange() {
  const { checkedInBegin, checkedInEnd } = getDefaultDriverCheckInRecordTimeRange();
  checkedInRange.value = [checkedInBegin, checkedInEnd];
  syncRangeToParams(checkedInRange.value);
}

onMounted(() => {
  const p = model.value.params;
  if (p?.checkedInBegin && p?.checkedInEnd) {
    checkedInRange.value = [p.checkedInBegin, p.checkedInEnd];
  } else {
    initTodayRange();
  }
});

function onRangeUpdate(value: [string, string] | null) {
  checkedInRange.value = value;
  syncRangeToParams(value);
}

function search() {
  emit('search');
}

function reset() {
  model.value.coNo = null;
  model.value.driverPhone = null;
  initTodayRange();
  emit('reset');
}
</script>

<template>
  <NCard :bordered="false" size="small" class="card-wrapper">
    <NForm :model="model" label-placement="left" :label-width="88">
      <NGrid responsive="screen" item-responsive>
        <NFormItemGi span="24 m:12 l:8" :label="$t('page.wms.driverCheckInRecord.checkedInTimeRange')">
          <NDatePicker
            v-model:formatted-value="checkedInRange"
            type="datetimerange"
            value-format="yyyy-MM-dd HH:mm:ss"
            clearable
            class="w-full"
            @update:formatted-value="onRangeUpdate"
          />
        </NFormItemGi>
        <NFormItemGi span="24 m:12 l:8" :label="$t('page.wms.devanningOrder.coNo')">
          <NInput v-model:value="model.coNo" clearable :placeholder="$t('page.wms.devanningOrder.coNo')" />
        </NFormItemGi>
        <NFormItemGi span="24 m:12 l:8" :label="$t('page.wms.driverCheckInRecord.driverPhone')">
          <NInput
            v-model:value="model.driverPhone"
            clearable
            :placeholder="$t('page.wms.driverCheckInRecord.driverPhonePlaceholder')"
          />
        </NFormItemGi>
        <NFormItemGi span="24 m:12 l:8">
          <NSpace>
            <NButton type="primary" @click="search">
              <template #icon>
                <icon-ic-round-search class="text-icon" />
              </template>
              {{ $t('common.search') }}
            </NButton>
            <NButton @click="reset">
              <template #icon>
                <icon-ic-round-refresh class="text-icon" />
              </template>
              {{ $t('common.reset') }}
            </NButton>
          </NSpace>
        </NFormItemGi>
      </NGrid>
    </NForm>
  </NCard>
</template>
