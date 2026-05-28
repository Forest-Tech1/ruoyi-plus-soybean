<script setup lang="ts">
import { computed, ref } from 'vue';
import { useRouter } from 'vue-router';
import { storeToRefs } from 'pinia';
import { useNoticeStore, type NoticeItem } from '@/store/modules/notice';
import { useDriverCheckInNoticePoll } from '@/hooks/business/driver-check-in-notice';
import { markDriverCheckInRecordSeen } from '@/utils/driver-check-in-notice';
import { $t } from '@/locales';

defineOptions({
  name: 'MessgaeButton'
});

const router = useRouter();
const show = ref(false);
const noticeStore = useNoticeStore();
const { state } = storeToRefs(noticeStore);

useDriverCheckInNoticePoll();

const driverNotices = computed(() => noticeStore.driverCheckInNotices());
const genericNotices = computed(() => noticeStore.genericNotices());

const noticeNum = computed(() => {
  return state.value.notices.filter(notice => !notice.read).length || 0;
});

function goDriverCheckInRecords(notice: NoticeItem) {
  noticeStore.readNotice(notice);
  if (notice.recordId != null) {
    markDriverCheckInRecordSeen(notice.recordId);
  }
  show.value = false;
  void router.push({
    name: 'wms_order_driver-check-in-record',
    query: {
      recordId: notice.recordId != null ? String(notice.recordId) : undefined,
      coNo: notice.coNo,
      driverPhone: notice.driverPhone
    }
  });
}

function onNoticeClick(notice: NoticeItem) {
  if (notice.kind === 'driver_check_in') {
    goDriverCheckInRecords(notice);
    return;
  }
  noticeStore.readNotice(notice);
}

function openAllRecords() {
  show.value = false;
  void router.push({ name: 'wms_order_driver-check-in-record' });
}
</script>

<template>
  <NPopover v-model:show="show" trigger="click" arrow-point-to-center raw class="border-rounded-6px">
    <template #trigger>
      <NTooltip :disabled="show">
        <template #trigger>
          <NButton quaternary class="bell-button h-36px text-icon" :focusable="false">
            <NBadge :value="noticeNum" :max="99" :offset="[2, -2]">
              <div class="bell-icon flex-center gap-8px">
                <SvgIcon local-icon="bell" />
              </div>
            </NBadge>
          </NButton>
        </template>
        {{ $t('page.home.message') }}
      </NTooltip>
    </template>
    <NCard
      size="small"
      :bordered="false"
      class="w-345px"
      header-class="p-0"
      :segmented="{ content: true, footer: 'soft' }"
    >
      <template #header>
        <span>{{ $t('page.wms.driverCheckInRecord.noticePanelTitle') }}</span>
      </template>
      <template #header-extra>
        <NTooltip placement="left" :z-index="98">
          <template #trigger>
            <NPopconfirm @positive-click="() => noticeStore.readAll()">
              <template #trigger>
                <NButton quaternary>
                  <div class="flex-center gap-8px">
                    <SvgIcon icon="lucide:mail-check" class="text-16px" />
                  </div>
                </NButton>
              </template>
              {{ $t('page.wms.driverCheckInRecord.readAllConfirm') }}
            </NPopconfirm>
          </template>
          {{ $t('page.wms.driverCheckInRecord.readAll') }}
        </NTooltip>
      </template>
      <NScrollbar class="h-300px">
        <template v-if="driverNotices.length || genericNotices.length">
          <template v-if="driverNotices.length">
            <div class="mb-8px text-12px text-gray-500">
              {{ $t('page.wms.driverCheckInRecord.noticeSectionCheckIn') }}
            </div>
            <template v-for="(message, index) in driverNotices" :key="`d-${message.recordId ?? index}`">
              <NDivider v-show="index !== 0" />
              <div class="flex cursor-pointer gap-8px" @click="onNoticeClick(message)">
                <div class="min-w-0 flex-1 flex-col justify-between gap-3px">
                  <NEllipsis class="w-full">{{ message.message }}</NEllipsis>
                  <span class="text-#898989">{{ message.time }}</span>
                </div>
                <NTag :type="message.read ? 'default' : 'warning'" size="small">
                  {{ message.read ? $t('page.wms.driverCheckInRecord.read') : $t('page.wms.driverCheckInRecord.unread') }}
                </NTag>
              </div>
            </template>
          </template>
          <template v-if="genericNotices.length">
            <NDivider v-if="driverNotices.length" />
            <div v-if="driverNotices.length" class="mb-8px text-12px text-gray-500">
              {{ $t('page.wms.driverCheckInRecord.noticeSectionOther') }}
            </div>
            <template v-for="(message, index) in genericNotices" :key="`g-${index}`">
              <NDivider v-show="index !== 0" />
              <div class="flex cursor-pointer" @click="onNoticeClick(message)">
                <div class="flex-col justify-between gap-3px">
                  <NEllipsis class="w-260px">{{ message.message }}</NEllipsis>
                  <span class="text-#898989">{{ message.time }}</span>
                </div>
                <NTag :type="message.read ? 'success' : 'error'">
                  {{ message.read ? $t('page.wms.driverCheckInRecord.read') : $t('page.wms.driverCheckInRecord.unread') }}
                </NTag>
              </div>
            </template>
          </template>
        </template>
        <NEmpty v-else class="h-180px flex-center" />
      </NScrollbar>
      <template #footer>
        <div class="flex items-center justify-end">
          <NButton text type="primary" @click="openAllRecords">
            {{ $t('page.wms.driverCheckInRecord.viewAllRecords') }}
          </NButton>
        </div>
      </template>
    </NCard>
  </NPopover>
</template>

<style scoped lang="scss">
:deep(.n-divider) {
  margin: 12px 0;
}

:deep(.n-badge-sup) {
  padding: 0 5px !important;
  font-size: 10px !important;
  height: 15px !important;
  line-height: 15px !important;
}

.bell-button {
  &:hover {
    .bell-icon {
      animation: bell-ring 1s both;
    }
  }
}

@keyframes bell-ring {
  0%,
  100% {
    transform-origin: top;
  }

  15% {
    transform: rotateZ(10deg);
  }

  30% {
    transform: rotateZ(-10deg);
  }

  45% {
    transform: rotateZ(5deg);
  }

  60% {
    transform: rotateZ(-5deg);
  }

  75% {
    transform: rotateZ(2deg);
  }
}
</style>
