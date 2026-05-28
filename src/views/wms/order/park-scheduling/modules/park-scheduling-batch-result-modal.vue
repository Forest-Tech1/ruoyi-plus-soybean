<script setup lang="ts">
import { computed } from 'vue';
import { formatParkBatchFailureReason } from '@/constants/wms-park';
import { $t } from '@/locales';

function failureReasonLabel(reason: string) {
  return formatParkBatchFailureReason(reason, $t);
}

defineOptions({
  name: 'ParkSchedulingBatchResultModal'
});

const visible = defineModel<boolean>('visible', { default: false });

const props = defineProps<{
  result: Api.Wms.ParkSchedulingBatchUpsertResult | null;
}>();

const hasFailures = computed(() => (props.result?.failCount ?? 0) > 0);
const hasSuccesses = computed(() => (props.result?.successCount ?? 0) > 0);

const successRows = computed(() => props.result?.successes ?? []);
const failRows = computed(() => props.result?.failures ?? []);
const autoAssign = computed(() => props.result?.autoAssign ?? null);
const hasAutoAssign = computed(() => Boolean(autoAssign.value?.executed));
</script>

<template>
  <NModal
    v-model:show="visible"
    preset="card"
    :title="$t('page.wms.parkScheduling.batchResultTitle')"
    class="w-640px max-w-[96vw]"
    :bordered="false"
  >
    <template v-if="result">
      <div class="mb-12px text-14px">
        {{
          $t('page.wms.parkScheduling.batchResultSummary', {
            success: result.successCount,
            fail: result.failCount
          })
        }}
      </div>
      <NAlert v-if="!hasSuccesses && hasFailures" type="error" :bordered="false" class="mb-12px">
        {{ $t('page.wms.parkScheduling.batchResultAllFailed') }}
      </NAlert>
      <NAlert v-else-if="hasFailures" type="warning" :bordered="false" class="mb-12px">
        {{ $t('page.wms.parkScheduling.batchResultPartial') }}
      </NAlert>
      <NAlert v-if="hasAutoAssign" type="info" :bordered="false" class="mb-12px">
        {{
          $t('page.wms.parkScheduling.batchAutoAssignSummary', {
            assigned: autoAssign!.assignedCount,
            skipped: autoAssign!.skippedCount,
            date: autoAssign!.expectedDevanningTime
          })
        }}
      </NAlert>

      <NTabs v-if="hasSuccesses || hasFailures || hasAutoAssign" type="line" animated>
        <NTabPane
          v-if="hasSuccesses"
          name="success"
          :tab="$t('page.wms.parkScheduling.batchResultSuccessTab', { count: result.successCount })"
        >
          <NScrollbar class="max-h-320px">
            <ul class="m-0 list-none p-0 text-13px leading-relaxed">
              <li v-for="(row, i) in successRows" :key="`ok-${i}-${row.coNo}`" class="py-4px">
                <span class="font-600">{{ row.coNo }}</span>
                <span class="text-gray-500"> — ID {{ row.orderId }}</span>
              </li>
            </ul>
          </NScrollbar>
        </NTabPane>
        <NTabPane
          v-if="hasFailures"
          name="fail"
          :tab="$t('page.wms.parkScheduling.batchResultFailTab', { count: result.failCount })"
        >
          <NScrollbar class="max-h-320px">
            <ul class="m-0 list-none p-0 text-13px leading-relaxed">
              <li
                v-for="(row, i) in failRows"
                :key="`fail-${i}-${row.coNo}`"
                class="border-b border-[#f0f0f0] py-6px last:border-0"
              >
                <div class="font-600 text-red-600">{{ row.coNo }}</div>
                <div class="text-12px text-gray-600">{{ failureReasonLabel(row.reason) }}</div>
              </li>
            </ul>
          </NScrollbar>
        </NTabPane>
        <NTabPane
          v-if="hasAutoAssign"
          name="assign"
          :tab="$t('page.wms.parkScheduling.batchAutoAssignTab', { count: autoAssign!.assignedCount })"
        >
          <NScrollbar class="max-h-320px">
            <ul class="m-0 list-none p-0 text-13px leading-relaxed">
              <li
                v-for="(row, i) in autoAssign!.assigned"
                :key="`as-${i}-${row.coNo}`"
                class="border-b border-[#f0f0f0] py-6px last:border-0"
              >
                <span class="font-600">{{ row.coNo }}</span>
                <span class="text-gray-500">
                  — {{ $t('page.wms.parkScheduling.batchAutoAssignRow', {
                    dock: row.dockName,
                    level: row.orderLevel
                  }) }}
                </span>
              </li>
            </ul>
          </NScrollbar>
        </NTabPane>
      </NTabs>
    </template>
    <NEmpty v-else class="py-24px" :description="$t('page.wms.parkScheduling.batchResultEmpty')" />

    <template #footer>
      <NSpace justify="end">
        <NButton type="primary" @click="visible = false">{{ $t('common.confirm') }}</NButton>
      </NSpace>
    </template>
  </NModal>
</template>
