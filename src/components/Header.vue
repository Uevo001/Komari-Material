<script setup lang="ts">
import { computed, defineAsyncComponent, h, inject, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAppStore } from '@/stores/app'

const AppearancePanel = defineAsyncComponent(() => import('./AppearancePanel.vue'))
const LoginDialog = defineAsyncComponent(() => import('./LoginDialog.vue'))

const router = useRouter()
const appStore = useAppStore()
const isScrolled = inject<ReturnType<typeof ref<boolean>>>('isScrolled', ref(false))
const siteFavicon = ref('/favicon.ico')

const brandTitle = computed(() => appStore.publicSettings?.sitename || 'Komari Material')
const brandSubtitle = computed(() => brandTitle.value === 'Komari Material' ? 'Material Design 3 theme' : 'Komari Material')
const hasBackgroundBlur = computed(() => appStore.backgroundEnabled && appStore.cardBlurRadius > 0)
const themeAction = computed(() => {
  if (appStore.themeMode === 'light') {
    return { icon: 'light_mode', label: '浅色主题' }
  }
  if (appStore.themeMode === 'dark') {
    return { icon: 'dark_mode', label: '深色主题' }
  }
  return { icon: 'contrast', label: '自动主题' }
})

const barStyle = computed(() => ({ maxWidth: appStore.maxPageWidth }))

function handleButtonClick(action: string) {
  switch (action) {
    case 'toggleTheme':
      appStore.updateThemeMode()
      break
    case 'openAppearancePanel':
      window.$modal.create({
        title: '外观设置',
        content: () => h(AppearancePanel),
      })
      break
    case 'jumpToSetting':
      location.href = '/admin'
      break
    case 'openLoginDialog':
      window.$modal.create({
        title: '登录',
        content: () => h(LoginDialog),
      })
      break
  }
}
</script>

<template>
  <header
    class="material-top-app-bar"
    :class="{ 'material-top-app-bar--scrolled': isScrolled }"
    :style="barStyle"
  >
    <div
      class="material-top-app-bar__inner"
      :class="{ 'md-surface-glass': isScrolled && hasBackgroundBlur }"
    >
      <button class="material-brand" type="button" aria-label="返回首页" @click="router.push('/')">
        <span class="material-brand__mark" aria-hidden="true">
          <img class="material-brand__avatar" :src="siteFavicon" alt="">
        </span>
        <span class="material-brand__copy">
          <strong class="material-brand__text">{{ brandTitle }}</strong>
          <span class="material-brand__subtitle">{{ brandSubtitle }}</span>
        </span>
      </button>

      <nav class="material-top-app-bar__actions" aria-label="全局操作">
        <button
          class="material-icon-button"
          type="button"
          title="外观设置"
          aria-label="打开外观设置"
          @click="handleButtonClick('openAppearancePanel')"
        >
          <span class="material-symbols-rounded">palette</span>
        </button>

        <button
          class="material-icon-button"
          type="button"
          :title="themeAction.label"
          :aria-label="`${themeAction.label}，点击切换`"
          @click="handleButtonClick('toggleTheme')"
        >
          <span class="material-symbols-rounded">{{ themeAction.icon }}</span>
        </button>

        <button
          v-if="appStore.isLoggedIn"
          class="material-icon-button"
          type="button"
          title="后台管理"
          aria-label="进入后台管理"
          @click="handleButtonClick('jumpToSetting')"
        >
          <span class="material-symbols-rounded">settings</span>
        </button>

        <button
          v-if="!appStore.isLoggedIn && appStore.showLoginButton"
          class="material-login-button"
          type="button"
          @click="handleButtonClick('openLoginDialog')"
        >
          <span class="material-symbols-rounded">login</span>
          登录
        </button>
      </nav>
    </div>
  </header>
</template>

<style scoped lang="scss">
.material-top-app-bar {
  position: sticky;
  top: 0;
  z-index: 20;
  width: 100%;
  margin: 0 auto;
  padding-inline: 16px;
}

.material-top-app-bar__inner {
  display: flex;
  min-height: 84px;
  align-items: center;
  justify-content: space-between;
  gap: 32px;
  padding: 20px 24px;
  overflow: hidden;
  border-radius: 0 0 28px 28px;
  background: transparent;
  box-shadow: none;
  transition:
    background-color var(--md-app-motion-duration-short) var(--md-app-motion-easing-standard),
    box-shadow var(--md-app-motion-duration-short) var(--md-app-motion-easing-standard);
}

.material-top-app-bar--scrolled .material-top-app-bar__inner {
  background: var(--md-sys-color-surface-container);
  box-shadow: var(--md-app-elevation-1);
}

.material-brand {
  display: inline-flex;
  min-width: 0;
  align-items: center;
  gap: 12px;
  border: 0;
  padding: 0;
  color: var(--md-sys-color-on-surface);
  background: transparent;
  cursor: pointer;
}

.material-brand__mark {
  display: inline-grid;
  width: 44px;
  height: 44px;
  flex-shrink: 0;
  place-items: center;
  overflow: hidden;
  border-radius: 14px;
  background: var(--md-sys-color-secondary-container);
}

.material-brand__avatar {
  width: 32px;
  height: 32px;
  border-radius: 10px;
}

.material-brand__copy {
  display: grid;
  min-width: 0;
  gap: 2px;
  text-align: left;
}

.material-brand__text,
.material-brand__subtitle {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.material-brand__text {
  color: var(--md-sys-color-on-surface);
  font-family: var(--md-sys-typescale-title-small-font);
  font-size: var(--md-sys-typescale-title-small-size);
  font-weight: var(--md-sys-typescale-title-small-weight);
  line-height: var(--md-sys-typescale-title-small-line-height);
  letter-spacing: var(--md-sys-typescale-title-small-tracking);
}

.material-brand__subtitle {
  color: var(--md-sys-color-on-surface-variant);
  font-family: var(--md-sys-typescale-body-small-font);
  font-size: var(--md-sys-typescale-body-small-size);
  font-weight: var(--md-sys-typescale-body-small-weight);
  line-height: var(--md-sys-typescale-body-small-line-height);
  letter-spacing: var(--md-sys-typescale-body-small-tracking);
}

.material-top-app-bar__actions {
  display: flex;
  align-items: center;
  gap: 4px;
}

.material-top-app-bar__actions .material-icon-button {
  width: 44px;
  height: 44px;
}

.material-login-button {
  display: inline-flex;
  height: 40px;
  align-items: center;
  justify-content: center;
  gap: 8px;
  border: 0;
  border-radius: 20px;
  margin-left: 4px;
  padding: 0 16px;
  color: var(--md-sys-color-on-secondary-container);
  background: var(--md-sys-color-secondary-container);
  font-family: var(--md-sys-typescale-label-large-font);
  font-size: var(--md-sys-typescale-label-large-size);
  font-weight: var(--md-sys-typescale-label-large-weight);
  line-height: var(--md-sys-typescale-label-large-line-height);
  letter-spacing: var(--md-sys-typescale-label-large-tracking);
  white-space: nowrap;
  cursor: pointer;
  transition:
    background-color var(--md-app-motion-duration-short) var(--md-app-motion-easing-standard),
    box-shadow var(--md-app-motion-duration-short) var(--md-app-motion-easing-standard);

  &:hover {
    background: color-mix(
      in srgb,
      var(--md-sys-color-on-secondary-container) var(--md-app-state-hover),
      var(--md-sys-color-secondary-container)
    );
    box-shadow: var(--md-app-elevation-1);
  }

  &:active {
    background: color-mix(
      in srgb,
      var(--md-sys-color-on-secondary-container) var(--md-app-state-pressed),
      var(--md-sys-color-secondary-container)
    );
    box-shadow: none;
  }
}

.material-login-button .material-symbols-rounded {
  font-size: 18px;
}

@media (max-width: 640px) {
  .material-top-app-bar__inner {
    border-radius: 0 0 24px 24px;
    gap: 8px;
    padding: 14px 12px;
  }

  .material-brand {
    gap: 8px;
  }

  .material-brand__mark {
    width: 40px;
    height: 40px;
    border-radius: 13px;
  }

  .material-brand__avatar {
    width: 30px;
    height: 30px;
  }

  .material-brand__subtitle {
    display: none;
  }

  .material-top-app-bar__actions {
    gap: 0;
  }

  .material-login-button {
    margin-left: 0;
  }
}
</style>
