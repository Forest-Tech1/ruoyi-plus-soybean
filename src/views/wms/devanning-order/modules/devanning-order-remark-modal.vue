<script setup lang="ts">
import { ref, watch } from 'vue';
import { fetchUpdateDevanningOrderRemark } from '@/service/api/wms/devanning-order';
import { $t } from '@/locales';

defineOptions({
  name: 'DevanningOrderRemarkModal'
});

interface Emits {
  (e: 'submitted'): void;
}

const emit = defineEmits<Emits>();

const visible = defineModel<boolean>('visible', { default: false });

const props = defineProps<{
  orderId: CommonType.IdType | null;
  initialRemark?: string | null;
}>();

const remarkText = ref('');
const submitting = ref(false);

watch(
  () => [visible.value, props.orderId, props.initialRemark] as const,
  ([show]) => {
    if (show && props.orderId != null) {
      remarkText.value = props.initialRemark ?? '';
    }
  }
);

function close() {
  visible.value = false;
}

async function submit() {
  if (props.orderId == null) return;
  submitting.value = true;
  try {
    const { error } = await fetchUpdateDevanningOrderRemark(props.orderId, remarkText.value);
    if (error) return;
    window.$message?.success($t('common.updateSuccess'));
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
    :title="$t('page.wms.devanningOrder.remarkModalTitle')"
    preset="card"
    :bordered="false"
    class="w-560px max-w-90%"
    :mask-closable="false"
    @close="close"
  >
    <NInput
      v-model:value="remarkText"
      type="textarea"
      :placeholder="$t('page.wms.devanningOrder.remarkPlaceholder')"
      :rows="5"
      show-count
      :maxlength="500"
    />
    <template #footer>
      <NSpace justify="end">
        <NButton @click="close">{{ $t('common.cancel') }}</NButton>
        <NButton type="primary" :loading="submitting" :disabled="orderId == null" @click="submit">
          {{ $t('common.confirm') }}
        </NButton>
      </NSpace>
    </template>
  </NModal>
</template>

<style scoped></style>
