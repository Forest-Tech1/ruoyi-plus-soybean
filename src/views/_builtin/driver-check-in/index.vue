<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import {
  fetchDriverCheckIn,
  fetchDriverCheckInBatch,
  fetchDriverCheckInCoSuggest
} from '@/service/api/wms/driver-check-in';
import SvgIcon from '@/components/custom/svg-icon.vue';
import {
  driverCheckInMessages,
  formatDriverCheckInSuccessMessage,
  resolveDriverCheckInErrorMessage,
  type DriverCheckInErrorCode,
  type DriverCheckInLang
} from './driver-check-in-i18n';

defineOptions({
  name: 'DriverCheckIn'
});

const SUCCESS_HOLD_MS = 4000;
const BATCH_MAX = 50;

const route = useRoute();
const router = useRouter();

const LANG_STORAGE_KEY = 'driver-check-in-lang';

const lang = ref<DriverCheckInLang>('zh');
const driverPhone = ref('');
/** false = 单柜（模糊联想）；true = 批量（多行粘贴） */
const batchMode = ref(false);
const coNoSingle = ref('');
const coNoBatch = ref('');
const coSuggestOptions = ref<{ label: string; value: string }[]>([]);
const coSuggestLoading = ref(false);
const checking = ref(false);
const resultType = ref<'idle' | 'success' | 'partial' | 'error'>('idle');
const resultMessage = ref('');
const successCoNo = ref('');
const lastSuccessResult = ref<Api.Wms.DriverCheckInResult | null>(null);
const lastBatchResult = ref<Api.Wms.DriverCheckInBatchResult | null>(null);

const msg = computed(() => driverCheckInMessages[lang.value]);

let successTimer: ReturnType<typeof setTimeout> | null = null;
let suggestTimer: ReturnType<typeof setTimeout> | null = null;

const SUGGEST_DEBOUNCE_MS = 280;

function clearSuccessTimer() {
  if (successTimer) {
    clearTimeout(successTimer);
    successTimer = null;
  }
}

function resetSuccessUi() {
  clearSuccessTimer();
  resultType.value = 'idle';
  resultMessage.value = '';
  successCoNo.value = '';
  lastSuccessResult.value = null;
  lastBatchResult.value = null;
}

function parseCoNoLines(raw: string): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const line of raw.split(/\r?\n/)) {
    const co = line.trim().toUpperCase();
    if (!co || seen.has(co)) continue;
    seen.add(co);
    out.push(co);
  }
  return out;
}

function scheduleAutoReset() {
  clearSuccessTimer();
  successTimer = setTimeout(() => {
    resetSuccessUi();
    if (batchMode.value) {
      coNoBatch.value = '';
    } else {
      coNoSingle.value = '';
      coSuggestOptions.value = [];
    }
  }, SUCCESS_HOLD_MS);
}

function clearSuggestTimer() {
  if (suggestTimer) {
    clearTimeout(suggestTimer);
    suggestTimer = null;
  }
}

async function loadCoSuggest(keyword: string) {
  const kw = keyword.trim();
  if (!kw) {
    coSuggestOptions.value = [];
    return;
  }
  coSuggestLoading.value = true;
  try {
    const { data, error } = await fetchDriverCheckInCoSuggest({ keyword: kw });
    if (error || !data?.length) {
      coSuggestOptions.value = [];
      return;
    }
    coSuggestOptions.value = data.map(item => ({
      label: item.coNo,
      value: item.coNo
    }));
  } finally {
    coSuggestLoading.value = false;
  }
}

function onCoSingleInput(v: string) {
  coNoSingle.value = v.toUpperCase();
  clearSuggestTimer();
  suggestTimer = setTimeout(() => {
    void loadCoSuggest(coNoSingle.value);
  }, SUGGEST_DEBOUNCE_MS);
}

function toggleBatchMode() {
  batchMode.value = !batchMode.value;
  clearSuggestTimer();
  coSuggestOptions.value = [];
  if (batchMode.value) {
    coNoSingle.value = '';
  } else {
    coNoBatch.value = '';
  }
  if (resultType.value !== 'success') {
    resultType.value = 'idle';
    resultMessage.value = '';
    lastBatchResult.value = null;
  }
}

function showSingleSuccess(result: Api.Wms.DriverCheckInResult) {
  lastSuccessResult.value = result;
  lastBatchResult.value = null;
  successCoNo.value = (result.coNo ?? '').trim();
  resultType.value = 'success';
  resultMessage.value = formatDriverCheckInSuccessMessage(lang.value, result);
  window.$message?.success(`${msg.value.successTitle} · ${successCoNo.value}`, {
    duration: SUCCESS_HOLD_MS
  });
  scheduleAutoReset();
}

function showBatchResult(result: Api.Wms.DriverCheckInBatchResult) {
  lastBatchResult.value = result;
  lastSuccessResult.value = result.successes[0] ?? null;
  const { total, successCount, failCount } = result;

  if (failCount === 0) {
    resultType.value = 'success';
    successCoNo.value =
      result.successes.length === 1
        ? (result.successes[0]?.coNo ?? '').trim()
        : '';
    resultMessage.value =
      total === 1 && result.successes[0]
        ? formatDriverCheckInSuccessMessage(lang.value, result.successes[0])
        : msg.value.successBatchSummary
            .replace('{total}', String(total))
            .replace('{success}', String(successCount));
    window.$message?.success(msg.value.successBatchTitle, { duration: SUCCESS_HOLD_MS });
    scheduleAutoReset();
    return;
  }

  if (successCount > 0) {
    resultType.value = 'partial';
    resultMessage.value = msg.value.partialSummary
      .replace('{success}', String(successCount))
      .replace('{fail}', String(failCount));
    return;
  }

  resultType.value = 'error';
  const first = result.failures[0];
  resultMessage.value = first
    ? resolveDriverCheckInErrorMessage(lang.value, first.errorCode, first)
    : msg.value.errors.UNKNOWN;
}

function persistLang() {
  try {
    sessionStorage.setItem(LANG_STORAGE_KEY, lang.value);
  } catch {
    /* ignore */
  }
}

function initLang() {
  const q = String(route.query.lang ?? '').toLowerCase();
  if (q === 'en' || q === 'zh') {
    lang.value = q;
    return;
  }
  try {
    const stored = sessionStorage.getItem(LANG_STORAGE_KEY);
    if (stored === 'en' || stored === 'zh') lang.value = stored;
  } catch {
    /* ignore */
  }
}

function setLang(next: DriverCheckInLang) {
  lang.value = next;
  persistLang();
  if (resultType.value === 'success' && lastSuccessResult.value) {
    if (lastBatchResult.value && lastBatchResult.value.total > 1) {
      resultMessage.value = msg.value.successBatchSummary
        .replace('{total}', String(lastBatchResult.value.total))
        .replace('{success}', String(lastBatchResult.value.successCount));
    } else {
      resultMessage.value = formatDriverCheckInSuccessMessage(lang.value, lastSuccessResult.value);
    }
  }
  if (resultType.value === 'partial' && lastBatchResult.value) {
    resultMessage.value = driverCheckInMessages[next].partialSummary
      .replace('{success}', String(lastBatchResult.value.successCount))
      .replace('{fail}', String(lastBatchResult.value.failCount));
  }
}

function parseFailPayload(err: unknown): Api.Wms.DriverCheckInFailData | null {
  const ax = err as { response?: { data?: { data?: Api.Wms.DriverCheckInFailData } } };
  return ax?.response?.data?.data ?? null;
}

function resolveErrorMessage(err: unknown, fail?: Api.Wms.DriverCheckInFailData | null): string {
  const code = (fail?.errorCode ?? 'UNKNOWN') as DriverCheckInErrorCode;
  const ax = err as { response?: { data?: { msg?: string } } };
  const mapped = resolveDriverCheckInErrorMessage(lang.value, code, fail);
  if (code !== 'UNKNOWN') return mapped;
  return ax?.response?.data?.msg || mapped;
}

watch([driverPhone, coNoSingle, coNoBatch], () => {
  if (resultType.value === 'success') return;
  if (resultType.value !== 'idle') {
    resultType.value = 'idle';
    resultMessage.value = '';
    lastBatchResult.value = null;
  }
});

async function submitCheckIn() {
  const phone = driverPhone.value.trim();
  const coNos = batchMode.value
    ? parseCoNoLines(coNoBatch.value)
    : parseCoNoLines(coNoSingle.value);

  if (!phone) {
    resetSuccessUi();
    resultType.value = 'error';
    resultMessage.value = msg.value.errors.DRIVER_PHONE_REQUIRED;
    return;
  }
  if (!coNos.length) {
    resetSuccessUi();
    resultType.value = 'error';
    resultMessage.value = msg.value.errors.CO_NO_REQUIRED;
    return;
  }
  if (coNos.length > BATCH_MAX) {
    resetSuccessUi();
    resultType.value = 'error';
    resultMessage.value = msg.value.errors.BATCH_TOO_LARGE;
    return;
  }

  if (batchMode.value) {
    coNoBatch.value = coNos.join('\n');
  } else {
    coNoSingle.value = coNos[0] ?? '';
  }
  checking.value = true;
  resetSuccessUi();

  try {
    if (coNos.length === 1) {
      const { data, error } = await fetchDriverCheckIn({ coNo: coNos[0], driverPhone: phone });
      if (error) {
        resultType.value = 'error';
        resultMessage.value = resolveErrorMessage(error, parseFailPayload(error));
        return;
      }
      if (!data) {
        resultType.value = 'error';
        resultMessage.value = msg.value.errors.UNKNOWN;
        return;
      }
      showSingleSuccess(data);
      return;
    }

    const { data, error } = await fetchDriverCheckInBatch({ coNos, driverPhone: phone });
    if (error) {
      resultType.value = 'error';
      resultMessage.value = resolveErrorMessage(error, parseFailPayload(error));
      return;
    }
    if (!data) {
      resultType.value = 'error';
      resultMessage.value = msg.value.errors.UNKNOWN;
      return;
    }
    showBatchResult(data);
  } catch (e) {
    resultType.value = 'error';
    resultMessage.value = resolveErrorMessage(e, parseFailPayload(e));
  } finally {
    checking.value = false;
  }
}

function ensureStandaloneRoute() {
  if (route.meta.constant === true && route.path === '/driver-check-in') return;
  void router.replace({
    path: '/driver-check-in',
    query: route.query,
    hash: route.hash
  });
}

onMounted(() => {
  ensureStandaloneRoute();
  initLang();
  document.title = `${driverCheckInMessages[lang.value].companyName} · Check-in`;
});

watch(lang, l => {
  document.title = `${driverCheckInMessages[l].companyName} · Check-in`;
  if (resultType.value === 'success' && lastSuccessResult.value) {
    if (lastBatchResult.value && lastBatchResult.value.total > 1) {
      resultMessage.value = driverCheckInMessages[l].successBatchSummary
        .replace('{total}', String(lastBatchResult.value.total))
        .replace('{success}', String(lastBatchResult.value.successCount));
    } else {
      resultMessage.value = formatDriverCheckInSuccessMessage(l, lastSuccessResult.value);
    }
  }
});

onBeforeUnmount(() => {
  clearSuccessTimer();
  clearSuggestTimer();
});
</script>

<template>
  <div class="driver-check-in-page">
    <div class="driver-check-in-card">
      <header class="driver-check-in-header">
        <p class="driver-check-in-company">{{ msg.companyName }}</p>
        <h1 class="driver-check-in-title">{{ msg.pageTitle }}</h1>
        <div class="driver-check-in-lang" role="group" :aria-label="msg.langEn">
          <button
            type="button"
            class="driver-check-in-lang__btn"
            :class="{ 'driver-check-in-lang__btn--active': lang === 'zh' }"
            @click="setLang('zh')"
          >
            {{ msg.langZh }}
          </button>
          <button
            type="button"
            class="driver-check-in-lang__btn"
            :class="{ 'driver-check-in-lang__btn--active': lang === 'en' }"
            @click="setLang('en')"
          >
            {{ msg.langEn }}
          </button>
        </div>
      </header>

      <div
        v-if="resultType === 'success'"
        class="driver-check-in-result driver-check-in-result--success driver-check-in-result--prominent"
        role="status"
        aria-live="polite"
      >
        <p class="driver-check-in-result__title">
          {{ lastBatchResult && lastBatchResult.total > 1 ? msg.successBatchTitle : msg.successTitle }}
        </p>
        <p v-if="successCoNo" class="driver-check-in-result__co">{{ successCoNo }}</p>
        <p class="driver-check-in-result__text">{{ resultMessage }}</p>
        <ul
          v-if="lastBatchResult && lastBatchResult.successes.length > 1"
          class="driver-check-in-result__list"
        >
          <li v-for="item in lastBatchResult.successes" :key="item.coNo">{{ item.coNo }}</li>
        </ul>
        <p class="driver-check-in-result__hint">{{ msg.successAutoCloseHint }}</p>
      </div>

      <div
        v-if="resultType === 'partial' && lastBatchResult"
        class="driver-check-in-result driver-check-in-result--partial"
        role="status"
        aria-live="polite"
      >
        <p class="driver-check-in-result__title">{{ msg.partialTitle }}</p>
        <p class="driver-check-in-result__text">{{ resultMessage }}</p>
        <p class="driver-check-in-result__subheading">{{ msg.failuresHeading }}</p>
        <ul class="driver-check-in-result__list driver-check-in-result__list--fail">
          <li v-for="f in lastBatchResult.failures" :key="f.coNo">
            <strong>{{ f.coNo }}</strong>
            — {{ resolveDriverCheckInErrorMessage(lang, f.errorCode, f) }}
          </li>
        </ul>
        <p v-if="lastBatchResult.successes.length" class="driver-check-in-result__subheading">
          {{ msg.successesHeading }}
        </p>
        <ul v-if="lastBatchResult.successes.length" class="driver-check-in-result__list">
          <li v-for="s in lastBatchResult.successes" :key="s.coNo">{{ s.coNo }}</li>
        </ul>
      </div>

      <form class="driver-check-in-form" @submit.prevent="submitCheckIn">
        <label class="driver-check-in-label" for="driver-phone">{{ msg.driverPhoneLabel }}</label>
        <NInput
          id="driver-phone"
          v-model:value="driverPhone"
          type="tel"
          inputmode="tel"
          autocomplete="tel"
          :placeholder="msg.driverPhonePlaceholder"
          :disabled="checking || resultType === 'success'"
          size="large"
          clearable
        />

        <label class="driver-check-in-label" :for="batchMode ? 'driver-co-batch' : 'driver-co-single'">
          {{ msg.coNoLabel }}
          <span v-if="batchMode" class="driver-check-in-label__mode">{{ msg.batchModeActive }}</span>
        </label>
        <div class="driver-check-in-co-row">
          <NAutoComplete
            v-if="!batchMode"
            id="driver-co-single"
            v-model:value="coNoSingle"
            class="driver-check-in-co-input"
            :options="coSuggestOptions"
            :loading="coSuggestLoading"
            :placeholder="msg.coNoPlaceholderSingle"
            :disabled="checking || resultType === 'success'"
            clearable
            size="large"
            :input-props="{ autocapitalize: 'characters', spellcheck: false }"
            @update:value="onCoSingleInput"
          />
          <NInput
            v-else
            id="driver-co-batch"
            v-model:value="coNoBatch"
            class="driver-check-in-co-input"
            type="textarea"
            :autosize="{ minRows: 3, maxRows: 8 }"
            :placeholder="msg.coNoPlaceholder"
            :disabled="checking || resultType === 'success'"
            :input-props="{ autocapitalize: 'characters', spellcheck: false }"
            size="large"
          />
          <NTooltip placement="top">
            <template #trigger>
              <NButton
                class="driver-check-in-mode-toggle"
                :class="{ 'driver-check-in-mode-toggle--batch': batchMode }"
                :disabled="checking || resultType === 'success'"
                :aria-label="batchMode ? msg.switchToSingle : msg.switchToBatch"
                quaternary
                circle
                size="large"
                @click="toggleBatchMode"
              >
                <SvgIcon
                  :icon="
                    batchMode
                      ? 'material-symbols:search-rounded'
                      : 'material-symbols:playlist-add-rounded'
                  "
                  class="text-22px"
                />
              </NButton>
            </template>
            {{ batchMode ? msg.switchToSingle : msg.switchToBatch }}
          </NTooltip>
        </div>
        <p v-if="batchMode" class="driver-check-in-hint">{{ msg.coNoBatchHint }}</p>

        <NButton
          type="primary"
          size="large"
          block
          class="driver-check-in-submit"
          :loading="checking"
          :disabled="resultType === 'success'"
          attr-type="submit"
        >
          {{ checking ? msg.checking : msg.checkInButton }}
        </NButton>
      </form>

      <div
        v-if="resultType === 'error'"
        class="driver-check-in-result driver-check-in-result--error"
        role="alert"
      >
        <p class="driver-check-in-result__text">{{ resultMessage }}</p>
      </div>
    </div>
  </div>
</template>

<style scoped>
.driver-check-in-page {
  box-sizing: border-box;
  min-height: 100dvh;
  padding: max(16px, env(safe-area-inset-top)) 16px max(24px, env(safe-area-inset-bottom));
  display: flex;
  justify-content: center;
  align-items: flex-start;
  background: linear-gradient(165deg, #e8f4ff 0%, #f5f7fa 42%, #fff 100%);
}

.driver-check-in-card {
  width: 100%;
  max-width: 420px;
  margin: 0 auto;
  padding: 24px 20px 28px;
  border-radius: 16px;
  background: #fff;
  box-shadow: 0 8px 28px rgb(15 35 52 / 10%);
}

.driver-check-in-header {
  text-align: center;
  margin-bottom: 28px;
}

.driver-check-in-company {
  margin: 0 0 6px;
  font-size: 22px;
  font-weight: 700;
  letter-spacing: 0.02em;
  color: #1677ff;
  line-height: 1.25;
}

.driver-check-in-title {
  margin: 0 0 14px;
  font-size: 15px;
  font-weight: 500;
  color: #595959;
}

.driver-check-in-lang {
  display: inline-flex;
  gap: 4px;
  padding: 3px;
  border-radius: 999px;
  background: #f0f0f0;
}

.driver-check-in-lang__btn {
  min-width: 52px;
  min-height: 36px;
  padding: 0 14px;
  border: none;
  border-radius: 999px;
  background: transparent;
  color: #595959;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
}

.driver-check-in-lang__btn--active {
  background: #fff;
  color: #1677ff;
  box-shadow: 0 1px 4px rgb(0 0 0 / 8%);
}

.driver-check-in-form {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.driver-check-in-label {
  font-size: 15px;
  font-weight: 600;
  color: #262626;
}

.driver-check-in-label__mode {
  margin-left: 6px;
  font-size: 12px;
  font-weight: 500;
  color: #1677ff;
}

.driver-check-in-co-row {
  display: flex;
  align-items: flex-start;
  gap: 8px;
}

.driver-check-in-co-input {
  flex: 1;
  min-width: 0;
}

.driver-check-in-mode-toggle {
  flex-shrink: 0;
  margin-top: 2px;
}

.driver-check-in-mode-toggle--batch {
  color: #1677ff;
  background: #e6f4ff;
}

.driver-check-in-hint {
  margin: -6px 0 0;
  font-size: 12px;
  color: #8c8c8c;
  line-height: 1.45;
}

.driver-check-in-form :deep(.n-input) {
  font-size: 17px;
}

.driver-check-in-form :deep(textarea.n-input__textarea-el) {
  font-size: 16px;
  letter-spacing: 0.02em;
}

.driver-check-in-submit {
  margin-top: 8px;
  min-height: 50px;
  font-size: 17px;
  font-weight: 600;
  border-radius: 10px;
}

.driver-check-in-result {
  margin-bottom: 16px;
  padding: 14px 16px;
  border-radius: 10px;
  font-size: 14px;
  line-height: 1.5;
}

.driver-check-in-result--prominent {
  padding: 18px 16px;
  animation: driver-check-in-success-in 0.28s ease-out;
}

@keyframes driver-check-in-success-in {
  from {
    opacity: 0;
    transform: translateY(-6px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.driver-check-in-result--success {
  background: #f6ffed;
  border: 1px solid #b7eb8f;
  color: #389e0d;
}

.driver-check-in-result--partial {
  background: #fffbe6;
  border: 1px solid #ffe58f;
  color: #ad6800;
}

.driver-check-in-result--error {
  margin-top: 16px;
  margin-bottom: 0;
  background: #fff2f0;
  border: 1px solid #ffccc7;
  color: #cf1322;
}

.driver-check-in-result__title {
  margin: 0 0 8px;
  font-size: 18px;
  font-weight: 700;
}

.driver-check-in-result__co {
  margin: 0 0 8px;
  font-size: 20px;
  font-weight: 700;
  letter-spacing: 0.04em;
  word-break: break-all;
}

.driver-check-in-result__text {
  margin: 0 0 8px;
}

.driver-check-in-result__subheading {
  margin: 10px 0 6px;
  font-size: 13px;
  font-weight: 600;
}

.driver-check-in-result__list {
  margin: 0;
  padding-left: 18px;
  max-height: 160px;
  overflow-y: auto;
  font-size: 13px;
}

.driver-check-in-result__list--fail li {
  margin-bottom: 6px;
  word-break: break-all;
}

.driver-check-in-result__hint {
  margin: 0;
  font-size: 12px;
  opacity: 0.88;
}

@media (max-width: 390px) {
  .driver-check-in-card {
    padding: 20px 16px 24px;
  }

  .driver-check-in-company {
    font-size: 20px;
  }
}
</style>
