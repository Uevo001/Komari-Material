<script setup lang="ts">
import type { VersionInfo } from '@/utils/api'
import { computed, onMounted, onUnmounted, ref } from 'vue'
import { useAppStore } from '@/stores/app'
import { getSharedApi } from '@/utils/api'

const appStore = useAppStore()
const api = getSharedApi()
const buildVersion = __BUILD_VERSION__
const buildGitHash = __BUILD_GIT_HASH__
const serverVersion = ref<VersionInfo | null>(null)
let idleCallbackId: number | null = null
let fallbackTimer: ReturnType<typeof window.setTimeout> | null = null

async function fetchServerVersion() {
  try {
    serverVersion.value = await api.getVersion()
  }
  catch {
    // 静默失败
  }
}

onMounted(() => {
  if (typeof window.requestIdleCallback === 'function') {
    idleCallbackId = window.requestIdleCallback(() => void fetchServerVersion(), { timeout: 2000 })
  }
  else {
    fallbackTimer = window.setTimeout(() => void fetchServerVersion(), 1000)
  }
})

onUnmounted(() => {
  if (idleCallbackId !== null && typeof window.cancelIdleCallback === 'function') {
    window.cancelIdleCallback(idleCallbackId)
  }
  if (fallbackTimer !== null) {
    window.clearTimeout(fallbackTimer)
  }
})

const formattedServerVersion = computed(() => serverVersion.value?.version ?? null)
const containerStyle = computed(() =>
  appStore.fullWidth
    ? {}
    : { maxWidth: appStore.maxPageWidth, marginInline: 'auto' },
)

const showIcp = computed(() => appStore.icpEnabled && appStore.icpNumber)
const showPolice = computed(() => appStore.policeEnabled && appStore.policeNumber)
const showFiling = computed(() => showIcp.value || showPolice.value)
const hasBackgroundBlur = computed(() => appStore.backgroundEnabled && appStore.cardBlurRadius > 0)
</script>

<template>
  <footer class="material-footer" :class="{ 'md-surface-glass': hasBackgroundBlur }">
    <div class="material-footer__inner" :style="containerStyle">
      <div class="material-footer__meta">
        <div class="material-footer__line">
          <span>Powered by</span>
          <a href="https://github.com/komari-monitor/komari" target="_blank" rel="noopener noreferrer">Komari Monitor</a>
          <span v-if="formattedServerVersion" class="material-footer__version">v{{ formattedServerVersion }}</span>
        </div>

        <div class="material-footer__line">
          <span>Theme by</span>
          <a href="https://github.com/lyimoexiao/komari-theme-material" target="_blank" rel="noopener noreferrer">Komari Material</a>
          <span class="material-footer__version">v{{ buildVersion }} ({{ buildGitHash }})</span>
        </div>
      </div>

      <div v-if="showFiling" class="material-footer__filing">
        <a v-if="showIcp" :href="appStore.icpUrl" target="_blank" rel="noopener noreferrer">
          {{ appStore.icpNumber }}
        </a>
        <span v-if="showIcp && showPolice">|</span>
        <a v-if="showPolice && appStore.policeUrl" :href="appStore.policeUrl" target="_blank" rel="noopener noreferrer">
          {{ appStore.policeNumber }}
        </a>
        <span v-else-if="showPolice">{{ appStore.policeNumber }}</span>
      </div>
    </div>
  </footer>
</template>

<style scoped lang="scss">
.material-footer {
  width: 100%;
  color: var(--md-sys-color-on-surface-variant);
  background: color-mix(in srgb, var(--md-sys-color-surface) 72%, transparent);
}

.material-footer__inner {
  display: flex;
  gap: 16px;
  align-items: center;
  justify-content: space-between;
  padding: 18px 16px 22px;
}

.material-footer__meta {
  display: flex;
  flex-wrap: wrap;
  gap: 10px 24px;
}

.material-footer__line {
  display: inline-flex;
  flex-wrap: wrap;
  gap: 5px;
  align-items: center;
  font-size: 13px;
}

.material-footer__version {
  font-family: var(--md-app-number-font-family);
  font-size: 12px;
  opacity: 0.72;
}

.material-footer__filing {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  align-items: center;
  font-size: 12px;
}

.material-footer a {
  color: var(--md-sys-color-primary);
  font-weight: 600;
  text-decoration: none;

  &:hover {
    text-decoration: underline;
  }
}

@media (max-width: 640px) {
  .material-footer__inner {
    flex-direction: column;
    align-items: flex-start;
  }
}
</style>
