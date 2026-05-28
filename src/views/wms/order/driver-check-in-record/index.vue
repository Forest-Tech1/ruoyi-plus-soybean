<script setup lang="tsx">
import { computed, onMounted, ref, watch } from 'vue';
import { useRoute } from 'vue-router';
import { getDefaultDriverCheckInRecordTimeRange } from '@/constants/wms-driver-check-in';
import { useAuth } from '@/hooks/business/auth';
import { defaultTransform, useNaivePaginatedTable } from '@/hooks/common/table';
import { fetchDriverCheckInRecordList } from '@/service/api/wms/driver-check-in-record';
import { markDriverCheckInRecordSeen } from '@/utils/driver-check-in-notice';
import { $t } from '@/locales';
import DriverCheckInRecordSearch from './modules/driver-check-in-record-search.vue';

defineOptions({
  name: 'DriverCheckInRecord'
});

const route = useRoute();
const { hasAuth } = useAuth();

const defaultRange = getDefaultDriverCheckInRecordTimeRange();

const searchParams = ref<Api.Wms.DriverCheckInRecordSearchParams>({
  pageNum: 1,
  pageSize: 20,
  coNo: null,
  driverPhone: null,
  params: { ...defaultRange },
  orderByColumn: 'checkedInAt',
  isAsc: 'desc'
});

const highlightRecordId = ref<string | null>(null);

const { columns, columnChecks, data, getData, getDataByPage, loading, mobilePagination, scrollX } =
  useNaivePaginatedTable({
    api: () => fetchDriverCheckInRecordList(searchParams.value),
    transform: response => defaultTransform(response),
    onPaginationParamsChange: params => {
      searchParams.value.pageNum = params.page;
      searchParams.value.pageSize = params.pageSize;
    },
    columns: () => [
      {
        key: 'index',
        title: $t('common.index'),
        align: 'center',
        width: 64,
        render: (_row, index) =>
          (searchParams.value.pageNum! - 1) * (searchParams.value.pageSize || 20) + index + 1
      },
      {
        key: 'coNo',
        title: $t('page.wms.devanningOrder.coNo'),
        align: 'left',
        minWidth: 140,
        ellipsis: { tooltip: true },
        render: row => {
          const active = highlightRecordId.value === String(row.id);
          return (
            <span class={active ? 'font-600 text-primary' : ''}>{row.coNo ?? '—'}</span>
          );
        }
      },
      {
        key: 'checkedInAt',
        title: $t('page.wms.driverCheckInRecord.checkedInAt'),
        align: 'left',
        width: 176,
        sorter: true
      },
      {
        key: 'driverPhone',
        title: $t('page.wms.driverCheckInRecord.driverPhone'),
        align: 'left',
        minWidth: 132
      }
    ]
  });

const canList = computed(() => hasAuth('wms:driverCheckInRecord:list'));

function applyRouteQuery() {
  const qCo = String(route.query.coNo ?? '').trim();
  const qPhone = String(route.query.driverPhone ?? '').trim();
  const qId = String(route.query.recordId ?? route.query.id ?? '').trim();
  if (qCo) searchParams.value.coNo = qCo.toUpperCase();
  if (qPhone) searchParams.value.driverPhone = qPhone;
  if (qId) {
    highlightRecordId.value = qId;
    markDriverCheckInRecordSeen(qId);
  }
}

function handleSearch() {
  searchParams.value.pageNum = 1;
  getDataByPage();
}

function handleReset() {
  const range = getDefaultDriverCheckInRecordTimeRange();
  searchParams.value.params = { ...range };
  highlightRecordId.value = null;
  handleSearch();
}

onMounted(() => {
  applyRouteQuery();
  if (canList.value) void getData();
});

watch(
  () => route.query,
  () => {
    applyRouteQuery();
    if (canList.value) void getData();
  }
);
</script>

<template>
  <div class="h-full min-h-500px flex flex-col gap-12px overflow-hidden lt-sm:overflow-auto">
    <DriverCheckInRecordSearch v-model:model="searchParams" @search="handleSearch" @reset="handleReset" />

    <NCard
      :bordered="false"
      size="small"
      class="card-wrapper flex min-h-0 flex-1 flex-col overflow-hidden"
      content-class="flex min-h-0 flex-1 flex-col overflow-hidden"
    >
      <template #header>
        <div class="flex-y-center justify-between gap-12px">
          <span class="text-16px font-medium">{{ $t('page.wms.driverCheckInRecord.title') }}</span>
          <TableHeaderOperation
            v-model:columns="columnChecks"
            :loading="loading"
            :show-add="false"
            :show-delete="false"
            :show-export="false"
            @refresh="getData"
          />
        </div>
      </template>

      <NAlert v-if="!canList" type="warning" :show-icon="true" class="mb-12px">
        {{ $t('page.wms.driverCheckInRecord.noPermission') }}
      </NAlert>

      <NDataTable
        v-else
        :columns="columns"
        :data="data"
        :loading="loading"
        :scroll-x="scrollX"
        :row-key="row => String(row.id)"
        :row-class-name="row =>
          highlightRecordId === String(row.id) ? 'driver-check-in-record-row--highlight' : ''"
        remote
        class="min-h-0 flex-1"
        flex-height
      />
      <div v-if="canList" class="mt-12px flex justify-end">
        <NPagination v-bind="mobilePagination" />
      </div>
    </NCard>
  </div>
</template>

<style scoped>
:deep(.driver-check-in-record-row--highlight td) {
  background: rgb(22 119 255 / 8%);
}
</style>
