<script setup lang="ts">
import { ref, watch } from 'vue';
import type { UploadFileInfo } from 'naive-ui';
import { NAlert, NButton, NModal, NP, NSpace, NText, NUpload, NUploadDragger } from 'naive-ui';
import { useDownload } from '@/hooks/business/download';
import { fetchSubmitInventoryDataExistingImport } from '@/service/api/wms/inventory-data';
import { useWmsExistingImportTaskStore } from '@/store/modules/wms-existing-import-task';
import { $t } from '@/locales';
import SvgIcon from '@/components/custom/svg-icon.vue';

defineOptions({
  name: 'InventoryDataExistingImportModal'
});

const emit = defineEmits<{ submitted: [] }>();

const visible = defineModel<boolean>('visible', { default: false });

const { download } = useDownload();
const existingImportTaskStore = useWmsExistingImportTaskStore();

const submitting = ref(false);
const fileList = ref<UploadFileInfo[]>([]);

function resetState() {
  submitting.value = false;
  fileList.value = [];
}

function closeModal() {
  visible.value = false;
}

async function handleSubmitImport() {
  const file = fileList.value[0]?.file;
  if (!file) {
    window.$message?.warning($t('page.wms.inventoryData.existingImportNeedFile'));
    return;
  }
  submitting.value = true;
  try {
    const { data, error } = await fetchSubmitInventoryDataExistingImport(file);
    if (error) return;

    const taskId = data?.taskId;
    if (taskId == null) {
      window.$message?.error($t('page.wms.inventoryData.existingImportMissingTaskId'));
      return;
    }

    existingImportTaskStore.registerTask(taskId);
    window.$message?.success($t('page.wms.inventoryData.existingImportSubmitOk'));
    emit('submitted');
    visible.value = false;
    resetState();
  } finally {
    submitting.value = false;
  }
}

function handleDownloadTemplate() {
  void download(
    '/wms/order/inventory-data/existing-import/template',
    {},
    `${$t('page.wms.inventoryData.title')}_${$t('page.wms.inventoryData.existingImportTitle')}_${Date.now()}.xlsx`
  );
}

watch(visible, v => {
  if (v) resetState();
});
</script>

<template>
  <NModal
    v-model:show="visible"
    :title="$t('page.wms.inventoryData.existingImportTitle')"
    preset="card"
    :bordered="false"
    display-directive="if"
    class="max-w-[min(720px,96vw)] w-[min(720px,96vw)]"
    :content-style="{ maxHeight: 'min(88vh, 720px)' }"
    @close="closeModal"
  >
    <div class="flex max-h-[min(72vh,640px)] flex-col gap-16px overflow-hidden">
      <NUpload
        v-model:file-list="fileList"
        :default-upload="false"
        :max="1"
        :file-size="20"
        accept=".xls,.xlsx"
        list-type="text"
      >
        <NUploadDragger>
          <div class="mb-12px flex-center">
            <SvgIcon icon="material-symbols:unarchive-outline" class="text-58px color-#d8d8db dark:color-#a1a1a2" />
          </div>
          <NText class="text-16px">{{ $t('common.importTip') }}</NText>
          <NP depth="3" class="mt-8px text-center">
            {{ $t('page.wms.inventoryData.existingImportDirectHint') }}
          </NP>
          <NP depth="3" class="mt-4px text-center">
            {{ $t('common.importSize') }}
            <b class="text-red-500">20MB</b>
            {{ $t('common.importFormat') }}
            <b class="text-red-500">xls/xlsx</b>
            {{ $t('common.importEnd') }}
          </NP>
        </NUploadDragger>
      </NUpload>

      <NAlert type="info" :title="$t('page.wms.inventoryData.existingImportNoticeTitle')" :bordered="false">
        <div class="text-13px leading-relaxed whitespace-pre-line">
          {{ $t('page.wms.inventoryData.existingImportNoticeBody') }}
        </div>
      </NAlert>
    </div>

    <template #footer>
      <NSpace justify="space-between" :size="16" class="w-full">
        <NButton @click="handleDownloadTemplate">{{ $t('common.downloadTemplate') }}</NButton>

        <NSpace justify="end" :size="16">
          <NButton @click="closeModal">{{ $t('common.cancel') }}</NButton>
          <NButton type="primary" :loading="submitting" @click="handleSubmitImport">
            {{ $t('page.wms.inventoryData.existingImportSubmitImport') }}
          </NButton>
        </NSpace>
      </NSpace>
    </template>
  </NModal>
</template>
