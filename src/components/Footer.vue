<script setup lang="ts">
import type { VersionInfo } from '@/utils/api'
import { computed, onMounted, onUnmounted, ref } from 'vue'
import { useAppStore } from '@/stores/app'
import { getSharedApi } from '@/utils/api'
import { sanitizeNavigationUrl } from '@/utils/urlHelper'

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
const barStyle = computed(() => ({ maxWidth: appStore.maxPageWidth }))

const showIcp = computed(() => appStore.icpEnabled && appStore.icpNumber)
const showPolice = computed(() => appStore.policeEnabled && appStore.policeNumber)
const showFiling = computed(() => showIcp.value || showPolice.value)
const safeIcpUrl = computed(() => sanitizeNavigationUrl(appStore.icpUrl))
const safePoliceUrl = computed(() => sanitizeNavigationUrl(appStore.policeUrl))
</script>

<template>
  <footer class="material-footer" :style="barStyle">
    <div class="material-footer__inner">
      <div class="material-footer__brand">
        <span class="material-footer__mark" aria-hidden="true">
          <span class="material-symbols-rounded">monitor_heart</span>
        </span>
        <span class="material-footer__brand-copy">
          <strong>Komari Material</strong>
          <span>Material Design 3 theme for Komari Monitor</span>
        </span>
      </div>

      <div class="material-footer__supporting">
        <nav class="material-footer__links" aria-label="项目链接">
          <a href="https://github.com/komari-monitor/komari" target="_blank" rel="noopener noreferrer">
            Komari Monitor
          </a>
          <span aria-hidden="true">·</span>
          <a href="https://github.com/Liebesfreud/Komari-Material" target="_blank" rel="noopener noreferrer">
            GitHub
          </a>
        </nav>

        <div v-if="showFiling" class="material-footer__filing">
          <a v-if="showIcp && safeIcpUrl" :href="safeIcpUrl" target="_blank" rel="noopener noreferrer">
            {{ appStore.icpNumber }}
          </a>
          <span v-else-if="showIcp">{{ appStore.icpNumber }}</span>
          <span v-if="showIcp && showPolice" aria-hidden="true">·</span>
          <a v-if="showPolice && safePoliceUrl" :href="safePoliceUrl" target="_blank" rel="noopener noreferrer">
            {{ appStore.policeNumber }}
          </a>
          <span v-else-if="showPolice">{{ appStore.policeNumber }}</span>
        </div>

        <div
          class="material-footer__version"
          :title="`Theme v${buildVersion} (${buildGitHash})${formattedServerVersion ? ` · Komari v${formattedServerVersion}` : ''}`"
        >
          <span>Theme v{{ buildVersion }}</span>
          <template v-if="formattedServerVersion">
            <span aria-hidden="true">·</span>
            <span>Core v{{ formattedServerVersion }}</span>
          </template>
        </div>
      </div>
    </div>
  </footer>
</template>

<style scoped lang="scss">
.material-footer {
  width: 100%;
  margin: 24px auto 0;
  padding-inline: 16px;
  color: var(--md-sys-color-on-surface-variant);
}

.material-footer__inner {
  display: flex;
  gap: 32px;
  align-items: center;
  justify-content: space-between;
  padding: 20px 24px;
  overflow: hidden;
  border-radius: 28px 28px 0 0;
  background: var(--md-sys-color-surface-container-low);
}

.material-footer__brand {
  display: flex;
  min-width: 0;
  align-items: center;
  gap: 12px;
}

.material-footer__mark {
  display: inline-grid;
  width: 44px;
  height: 44px;
  flex: 0 0 auto;
  place-items: center;
  border-radius: 14px;
  color: var(--md-sys-color-on-secondary-container);
  background: var(--md-sys-color-secondary-container);
}

.material-footer__brand-copy {
  display: grid;
  min-width: 0;
  gap: 2px;
}

.material-footer__brand-copy strong {
  color: var(--md-sys-color-on-surface);
  font-family: var(--md-sys-typescale-title-small-font);
  font-size: var(--md-sys-typescale-title-small-size);
  font-weight: var(--md-sys-typescale-title-small-weight);
  line-height: var(--md-sys-typescale-title-small-line-height);
  letter-spacing: var(--md-sys-typescale-title-small-tracking);
}

.material-footer__brand-copy > span {
  font-family: var(--md-sys-typescale-body-small-font);
  font-size: var(--md-sys-typescale-body-small-size);
  line-height: var(--md-sys-typescale-body-small-line-height);
  letter-spacing: var(--md-sys-typescale-body-small-tracking);
}

.material-footer__supporting {
  display: grid;
  justify-items: end;
  gap: 5px;
  margin-right: 56px;
  text-align: right;
}

.material-footer__links,
.material-footer__filing {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  align-items: center;
  font-family: var(--md-sys-typescale-body-small-font);
  font-size: var(--md-sys-typescale-body-small-size);
  line-height: var(--md-sys-typescale-body-small-line-height);
  letter-spacing: var(--md-sys-typescale-body-small-tracking);
}

.material-footer__version {
  display: flex;
  flex-wrap: wrap;
  justify-content: flex-end;
  gap: 5px;
  font-family: var(--md-app-number-font-family);
  font-size: var(--md-sys-typescale-label-small-size);
  line-height: var(--md-sys-typescale-label-small-line-height);
  letter-spacing: var(--md-sys-typescale-label-small-tracking);
  opacity: 0.64;
}

.material-footer a {
  color: var(--md-sys-color-on-surface-variant);
  font-weight: var(--md-sys-typescale-label-large-weight);
  text-decoration: none;
  transition: color var(--md-app-motion-duration-short) var(--md-app-motion-easing-standard);

  &:hover {
    color: var(--md-sys-color-primary);
    text-decoration: underline;
  }
}

@media (max-width: 640px) {
  .material-footer__inner {
    flex-direction: column;
    gap: 20px;
    align-items: center;
    padding: 24px 20px;
    border-radius: 24px 24px 0 0;
  }

  .material-footer__brand {
    align-items: center;
    text-align: left;
  }

  .material-footer__brand-copy > span {
    max-width: 230px;
  }

  .material-footer__supporting {
    justify-items: center;
    margin-right: 0;
    text-align: center;
  }

  .material-footer__links,
  .material-footer__filing,
  .material-footer__version {
    justify-content: center;
  }
}
</style>
