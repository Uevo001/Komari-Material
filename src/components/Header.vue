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
const showThemeIdentity = computed(() => brandTitle.value !== 'Komari Material')

const containerStyle = computed(() => {
  if (appStore.fullWidth) {
    return {}
  }
  return {
    maxWidth: appStore.maxPageWidth,
    marginInline: 'auto',
  }
})

const actionButtons = computed(() => {
  const buttons = [
    {
      title: '外观设置',
      icon: 'palette',
      action: 'openAppearancePanel',
      disabled: false,
    },
    {
      title: appStore.themeMode === 'auto' ? '自动主题' : appStore.themeMode === 'light' ? '浅色主题' : '深色主题',
      icon: appStore.themeMode === 'auto' ? 'contrast' : appStore.themeMode === 'light' ? 'light_mode' : 'dark_mode',
      action: 'toggleTheme',
      disabled: false,
    },
  ]

  if (appStore.isLoggedIn) {
    buttons.push({
      title: '后台管理',
      icon: 'settings',
      action: 'jumpToSetting',
      disabled: false,
    })
  }
  else if (appStore.showLoginButton) {
    buttons.push({
      title: '登录',
      icon: 'login',
      action: 'openLoginDialog',
      disabled: false,
    })
  }

  return buttons
})

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
  <header class="material-top-app-bar" :class="{ 'material-top-app-bar--scrolled': isScrolled }">
    <div class="material-top-app-bar__inner" :style="containerStyle">
      <button class="material-brand" type="button" aria-label="返回首页" @click="router.push('/')">
        <img class="material-brand__avatar" :src="siteFavicon" alt="">
        <span class="material-brand__copy">
          <span class="material-brand__text">{{ brandTitle }}</span>
          <span v-if="showThemeIdentity" class="material-brand__subtitle">Komari Material</span>
        </span>
      </button>

      <nav class="material-top-app-bar__actions" aria-label="全局操作">
        <button
          v-for="button in actionButtons"
          :key="button.action"
          class="material-icon-button"
          type="button"
          :disabled="button.disabled"
          :title="button.title"
          :aria-label="button.title"
          @click="handleButtonClick(button.action)"
        >
          <span class="material-symbols-rounded">{{ button.icon }}</span>
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
  transition: background-color var(--md-app-motion-duration-short) var(--md-app-motion-easing-standard);
}

.material-top-app-bar--scrolled {
  background: var(--md-sys-color-surface-container);
}

.material-top-app-bar__inner {
  display: flex;
  height: 64px;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 0 16px;
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

.material-brand__avatar {
  width: 36px;
  height: 36px;
  flex-shrink: 0;
  border-radius: 999px;
}

.material-brand__copy {
  display: grid;
  min-width: 0;
  gap: 1px;
  text-align: left;
}

.material-brand__text {
  overflow: hidden;
  font-family: var(--md-sys-typescale-title-medium-font);
  font-size: var(--md-sys-typescale-title-medium-size);
  font-weight: 800;
  line-height: var(--md-sys-typescale-title-medium-line-height);
  letter-spacing: var(--md-sys-typescale-title-medium-tracking);
  text-overflow: ellipsis;
  white-space: nowrap;
}

.material-brand__subtitle {
  overflow: hidden;
  color: var(--md-sys-color-on-surface-variant);
  font-family: var(--md-sys-typescale-label-small-font);
  font-size: var(--md-sys-typescale-label-small-size);
  font-weight: var(--md-sys-typescale-label-small-weight);
  line-height: var(--md-sys-typescale-label-small-line-height);
  letter-spacing: var(--md-sys-typescale-label-small-tracking);
  text-overflow: ellipsis;
  white-space: nowrap;
}

.material-top-app-bar__actions {
  display: flex;
  align-items: center;
  gap: 4px;
}

@media (max-width: 640px) {
  .material-top-app-bar__inner {
    gap: 8px;
  }

  .material-brand {
    gap: 8px;
  }

  .material-top-app-bar__actions {
    gap: 0;
  }
}
</style>
