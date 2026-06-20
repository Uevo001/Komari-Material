<script setup lang="ts">
import type { MaterialDensity, MonetColorMode, MonetPaletteName } from '@/utils/materialTheme'
import { computed } from 'vue'
import { useAppStore } from '@/stores/app'
import { buildMaterialThemeTokens, MONET_PALETTES, normalizeHexColor } from '@/utils/materialTheme'

type ThemeMode = 'auto' | 'light' | 'dark'
type BackgroundType = 'image' | 'video'

const appStore = useAppStore()

const themeModeOptions: Array<{ value: ThemeMode, label: string, icon: string }> = [
  { value: 'auto', label: '跟随系统', icon: 'contrast' },
  { value: 'light', label: '浅色', icon: 'light_mode' },
  { value: 'dark', label: '深色', icon: 'dark_mode' },
]

const monetModeOptions: Array<{ value: MonetColorMode, label: string, icon: string }> = [
  { value: 'seed', label: '手动色', icon: 'format_color_fill' },
  { value: 'palette', label: '调色盘', icon: 'palette' },
  { value: 'wallpaper', label: '壁纸取色', icon: 'image_search' },
]

const densityOptions: Array<{ value: MaterialDensity, label: string, icon: string }> = [
  { value: 'compact', label: '紧凑', icon: 'density_small' },
  { value: 'comfortable', label: '舒展', icon: 'density_medium' },
]

const paletteLabels: Record<MonetPaletteName, string> = {
  'material-teal': '湖青',
  'ocean-blue': '海蓝',
  'forest-green': '森绿',
  'sunset-orange': '落日',
  'rose-pink': '蔷薇',
  'violet-purple': '堇紫',
  'slate-gray': '石板',
}

const selectedPalette = computed<MonetPaletteName>(() => {
  const value = appStore.themeSettings.monetPalette
  if (typeof value === 'string' && value in MONET_PALETTES) {
    return value as MonetPaletteName
  }
  return 'material-teal'
})

const paletteOptions = computed(() => {
  return Object.entries(MONET_PALETTES).map(([key, palette]) => {
    const tokens = buildMaterialThemeTokens(palette.seedColor, appStore.isDark, appStore.materialDensity)
    return {
      key: key as MonetPaletteName,
      label: paletteLabels[key as MonetPaletteName],
      seedColor: palette.seedColor,
      swatches: [
        tokens.colors.primary!,
        tokens.colors.secondary!,
        tokens.colors.tertiary!,
      ],
    }
  })
})

const densityModel = computed<MaterialDensity>({
  get: () => appStore.materialDensity,
  set: value => appStore.updateAppearanceSetting('materialDensity', value),
})

const fullWidthModel = computed<boolean>({
  get: () => appStore.fullWidth,
  set: value => appStore.updateAppearanceSetting('fullWidth', value),
})

const maxPageWidthModel = computed<string>({
  get: () => appStore.maxPageWidth,
  set: value => appStore.updateAppearanceSetting('maxPageWidth', value.trim() || '1800px'),
})

const backgroundEnabledModel = computed<boolean>({
  get: () => appStore.backgroundEnabled,
  set: value => appStore.updateAppearanceSetting('backgroundEnabled', value),
})

const backgroundTypeModel = computed<BackgroundType>({
  get: () => appStore.backgroundType,
  set: value => appStore.updateAppearanceSetting('backgroundType', value),
})

const lightBackgroundUrlModel = computed<string>({
  get: () => appStore.lightBackgroundUrl,
  set: value => appStore.updateAppearanceSetting('lightBackgroundUrl', value.trim()),
})

const darkBackgroundUrlModel = computed<string>({
  get: () => appStore.darkBackgroundUrl,
  set: value => appStore.updateAppearanceSetting('darkBackgroundUrl', value.trim()),
})

const backgroundBlurModel = computed<number>({
  get: () => appStore.backgroundBlur,
  set: value => appStore.updateAppearanceSetting('backgroundBlur', clampNumber(value, 0, 40)),
})

const backgroundOverlayModel = computed<number>({
  get: () => appStore.backgroundOverlay,
  set: value => appStore.updateAppearanceSetting('backgroundOverlay', clampNumber(value, 0, 100)),
})

const wallpaperStatus = computed(() => {
  if (appStore.monetColorMode !== 'wallpaper') {
    return '未启用壁纸取色'
  }
  if (appStore.backgroundType !== 'image') {
    return '壁纸取色仅支持图片背景'
  }
  if (!appStore.currentBackgroundUrl) {
    return '请先填写当前模式的图片背景地址'
  }
  if (appStore.wallpaperSeedColor) {
    return `已取色 ${appStore.wallpaperSeedColor}`
  }
  if (appStore.wallpaperSeedError) {
    return '取色失败，已使用调色盘回退'
  }
  return '正在读取壁纸颜色'
})

function clampNumber(value: number, min: number, max: number) {
  const safeValue = Number.isFinite(value) ? value : min
  return Math.min(max, Math.max(min, safeValue))
}

function setThemeMode(value: ThemeMode) {
  appStore.updateThemeMode(value)
}

function setMonetMode(value: MonetColorMode) {
  appStore.updateAppearanceSetting('monetColorMode', value)
}

function setPalette(value: MonetPaletteName) {
  appStore.updateAppearanceSetting('monetPalette', value)
}

function setManualSeedColor(event: Event) {
  const value = (event.target as HTMLInputElement).value
  appStore.updateAppearanceSetting('materialSeedColor', normalizeHexColor(value, appStore.manualMaterialSeedColor))
}
</script>

<template>
  <div class="appearance-panel">
    <section class="appearance-section">
      <div class="appearance-section__header">
        <span class="material-symbols-rounded">routine</span>
        <div>
          <h3>主题</h3>
          <p>当前生效色 {{ appStore.materialSeedColor }}</p>
        </div>
      </div>

      <div class="appearance-segmented" aria-label="主题模式">
        <button
          v-for="option in themeModeOptions"
          :key="option.value"
          class="appearance-segmented__button"
          :class="{ 'is-active': appStore.themeMode === option.value }"
          type="button"
          @click="setThemeMode(option.value)"
        >
          <span class="material-symbols-rounded">{{ option.icon }}</span>
          <span>{{ option.label }}</span>
        </button>
      </div>
    </section>

    <section class="appearance-section">
      <div class="appearance-section__header">
        <span class="material-symbols-rounded">palette</span>
        <div>
          <h3>莫奈取色</h3>
          <p>{{ wallpaperStatus }}</p>
        </div>
      </div>

      <div class="appearance-segmented appearance-segmented--three" aria-label="莫奈取色模式">
        <button
          v-for="option in monetModeOptions"
          :key="option.value"
          class="appearance-segmented__button"
          :class="{ 'is-active': appStore.monetColorMode === option.value }"
          type="button"
          @click="setMonetMode(option.value)"
        >
          <span class="material-symbols-rounded">{{ option.icon }}</span>
          <span>{{ option.label }}</span>
        </button>
      </div>

      <div class="appearance-field-grid">
        <label class="appearance-field">
          <span>手动种子色</span>
          <span class="appearance-color-input">
            <input type="color" :value="appStore.manualMaterialSeedColor" @input="setManualSeedColor">
            <input type="text" :value="appStore.manualMaterialSeedColor" spellcheck="false" @change="setManualSeedColor">
          </span>
        </label>
      </div>

      <div class="appearance-palette-grid" aria-label="莫奈调色盘">
        <button
          v-for="palette in paletteOptions"
          :key="palette.key"
          class="appearance-palette"
          :class="{ 'is-active': selectedPalette === palette.key }"
          type="button"
          @click="setPalette(palette.key)"
        >
          <span class="appearance-palette__swatches">
            <span
              v-for="color in palette.swatches"
              :key="color"
              class="appearance-palette__swatch"
              :style="{ backgroundColor: color }"
            />
          </span>
          <span class="appearance-palette__label">{{ palette.label }}</span>
          <span class="appearance-palette__seed">{{ palette.seedColor }}</span>
        </button>
      </div>
    </section>

    <section class="appearance-section">
      <div class="appearance-section__header">
        <span class="material-symbols-rounded">dashboard_customize</span>
        <div>
          <h3>界面</h3>
          <p>密度、宽度和信息留白</p>
        </div>
      </div>

      <div class="appearance-segmented" aria-label="界面密度">
        <button
          v-for="option in densityOptions"
          :key="option.value"
          class="appearance-segmented__button"
          :class="{ 'is-active': densityModel === option.value }"
          type="button"
          @click="densityModel = option.value"
        >
          <span class="material-symbols-rounded">{{ option.icon }}</span>
          <span>{{ option.label }}</span>
        </button>
      </div>

      <div class="appearance-field-grid">
        <label class="appearance-switch">
          <input v-model="fullWidthModel" type="checkbox">
          <span>占满屏幕宽度</span>
        </label>
        <label class="appearance-field">
          <span>最大页面宽度</span>
          <input v-model="maxPageWidthModel" type="text" spellcheck="false" placeholder="1800px">
        </label>
      </div>
    </section>

    <section class="appearance-section">
      <div class="appearance-section__header">
        <span class="material-symbols-rounded">wallpaper</span>
        <div>
          <h3>壁纸</h3>
          <p>{{ appStore.isDark ? '当前使用暗色模式背景' : '当前使用亮色模式背景' }}</p>
        </div>
      </div>

      <div class="appearance-field-grid">
        <label class="appearance-switch">
          <input v-model="backgroundEnabledModel" type="checkbox">
          <span>启用自定义背景</span>
        </label>
        <label class="appearance-field">
          <span>背景类型</span>
          <select v-model="backgroundTypeModel">
            <option value="image">
              image
            </option>
            <option value="video">
              video
            </option>
          </select>
        </label>
      </div>

      <label class="appearance-field">
        <span>亮色背景地址</span>
        <input v-model="lightBackgroundUrlModel" type="url" spellcheck="false" placeholder="https://...">
      </label>
      <label class="appearance-field">
        <span>暗色背景地址</span>
        <input v-model="darkBackgroundUrlModel" type="url" spellcheck="false" placeholder="https://...">
      </label>

      <div class="appearance-range-grid">
        <label class="appearance-range">
          <span>模糊 {{ backgroundBlurModel }}px</span>
          <input v-model.number="backgroundBlurModel" type="range" min="0" max="40" step="1">
        </label>
        <label class="appearance-range">
          <span>遮罩 {{ backgroundOverlayModel }}%</span>
          <input v-model.number="backgroundOverlayModel" type="range" min="0" max="100" step="1">
        </label>
      </div>
    </section>

    <footer class="appearance-panel__footer">
      <button class="appearance-reset-button" type="button" :disabled="!appStore.hasAppearanceOverrides" @click="appStore.resetAppearanceSettings()">
        <span class="material-symbols-rounded">restart_alt</span>
        <span>恢复后台外观</span>
      </button>
    </footer>
  </div>
</template>

<style scoped lang="scss">
.appearance-panel {
  display: grid;
  gap: 18px;
}

.appearance-section {
  display: grid;
  gap: 14px;
  padding-bottom: 18px;
  border-bottom: 1px solid color-mix(in srgb, var(--md-sys-color-outline-variant) 72%, transparent);
}

.appearance-section__header {
  display: flex;
  align-items: flex-start;
  gap: 12px;

  > .material-symbols-rounded {
    width: 36px;
    height: 36px;
    flex-shrink: 0;
    align-items: center;
    justify-content: center;
    border-radius: 12px;
    color: var(--md-sys-color-on-secondary-container);
    background: var(--md-sys-color-secondary-container);
  }

  h3 {
    margin: 0;
    color: var(--md-sys-color-on-surface);
    font-size: 16px;
    font-weight: 500;
    line-height: 1.25;
  }

  p {
    margin: 4px 0 0;
    color: var(--md-sys-color-on-surface-variant);
    font-size: 12px;
    line-height: 1.45;
  }
}

.appearance-segmented {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(0, 1fr));
  overflow: hidden;
  border: 1px solid var(--md-sys-color-outline);
  border-radius: 20px;
  background: var(--md-sys-color-surface-container-low);
}

.appearance-segmented__button {
  position: relative;
  display: inline-flex;
  min-height: 44px;
  overflow: hidden;
  align-items: center;
  justify-content: center;
  gap: 8px;
  border: 0;
  border-right: 1px solid var(--md-sys-color-outline-variant);
  padding: 0 10px;
  color: var(--md-sys-color-on-surface-variant);
  background: transparent;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;

  &::before {
    content: '';
    position: absolute;
    inset: 0;
    background: currentColor;
    opacity: 0;
    transition: opacity var(--md-app-motion-duration-short) var(--md-app-motion-easing-standard);
  }

  > * {
    position: relative;
    z-index: 1;
  }

  &:hover::before {
    opacity: var(--md-app-state-hover);
  }

  &:last-child {
    border-right: 0;
  }

  &.is-active {
    color: var(--md-sys-color-on-secondary-container);
    background: var(--md-sys-color-secondary-container);
  }
}

.appearance-field-grid,
.appearance-range-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
}

.appearance-field,
.appearance-switch,
.appearance-range {
  display: grid;
  gap: 7px;
  color: var(--md-sys-color-on-surface-variant);
  font-size: 12px;
  font-weight: 600;
}

.appearance-field input,
.appearance-field select {
  width: 100%;
  min-height: 40px;
  border: 1px solid var(--md-sys-color-outline-variant);
  border-radius: 4px;
  padding: 0 12px;
  color: var(--md-sys-color-on-surface);
  background: var(--md-sys-color-surface-container-lowest);
  outline: none;

  &:focus {
    border-color: var(--md-sys-color-primary);
    box-shadow: 0 0 0 2px color-mix(in srgb, var(--md-sys-color-primary) 18%, transparent);
  }
}

.appearance-color-input {
  display: grid;
  grid-template-columns: 48px minmax(0, 1fr);
  gap: 8px;

  input[type='color'] {
    padding: 4px;
  }
}

.appearance-switch {
  min-height: 40px;
  grid-template-columns: auto minmax(0, 1fr);
  align-items: center;

  input {
    position: relative;
    width: 52px;
    height: 32px;
    appearance: none;
    border: 2px solid var(--md-sys-color-outline);
    border-radius: 999px;
    background: var(--md-sys-color-surface-container-highest);
    cursor: pointer;
    transition:
      background-color var(--md-app-motion-duration-short) var(--md-app-motion-easing-standard),
      border-color var(--md-app-motion-duration-short) var(--md-app-motion-easing-standard);

    &::before {
      content: '';
      position: absolute;
      top: 5px;
      left: 5px;
      width: 18px;
      height: 18px;
      border-radius: 999px;
      background: var(--md-sys-color-outline);
      transition:
        width var(--md-app-motion-duration-short) var(--md-app-motion-easing-standard),
        height var(--md-app-motion-duration-short) var(--md-app-motion-easing-standard),
        transform var(--md-app-motion-duration-short) var(--md-app-motion-easing-standard),
        background-color var(--md-app-motion-duration-short) var(--md-app-motion-easing-standard);
    }

    &:checked {
      border-color: var(--md-sys-color-primary);
      background: var(--md-sys-color-primary);
    }

    &:checked::before {
      width: 24px;
      height: 24px;
      background: var(--md-sys-color-on-primary);
      transform: translate(16px, -3px);
    }
  }

  span {
    color: var(--md-sys-color-on-surface);
    font-size: 13px;
  }
}

.appearance-palette-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px;
}

.appearance-palette {
  display: grid;
  min-height: 70px;
  grid-template-columns: auto minmax(0, 1fr);
  grid-template-areas:
    'swatch label'
    'swatch seed';
  align-items: center;
  gap: 2px 10px;
  border: 1px solid var(--md-sys-color-outline-variant);
  border-radius: var(--md-app-card-radius);
  padding: 10px;
  color: var(--md-sys-color-on-surface);
  background: var(--md-sys-color-surface-container-low);
  text-align: left;
  cursor: pointer;

  &.is-active {
    border-color: var(--md-sys-color-primary);
    background: var(--md-sys-color-primary-container);
  }
}

.appearance-palette__swatches {
  grid-area: swatch;
  display: flex;
  overflow: hidden;
  width: 42px;
  height: 42px;
  border-radius: 8px;
  box-shadow: inset 0 0 0 1px color-mix(in srgb, var(--md-sys-color-outline) 32%, transparent);
}

.appearance-palette__swatch {
  flex: 1;
}

.appearance-palette__label {
  grid-area: label;
  overflow: hidden;
  font-size: 13px;
  font-weight: 500;
  line-height: 1.2;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.appearance-palette__seed {
  grid-area: seed;
  color: var(--md-sys-color-on-surface-variant);
  font-family: var(--md-app-number-font-family);
  font-size: 11px;
  line-height: 1.2;
}

.appearance-range {
  input {
    width: 100%;
    accent-color: var(--md-sys-color-primary);
  }
}

.appearance-panel__footer {
  display: flex;
  justify-content: flex-end;
}

.appearance-reset-button {
  display: inline-flex;
  min-height: 40px;
  align-items: center;
  justify-content: center;
  gap: 8px;
  border: 1px solid var(--md-sys-color-outline-variant);
  border-radius: 999px;
  padding: 0 14px;
  color: var(--md-sys-color-on-surface);
  background: var(--md-sys-color-surface-container-low);
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;

  &:disabled {
    opacity: 0.46;
    cursor: not-allowed;
  }
}

@media (max-width: 640px) {
  .appearance-field-grid,
  .appearance-range-grid,
  .appearance-palette-grid {
    grid-template-columns: 1fr;
  }

  .appearance-segmented__button {
    min-height: 48px;
    flex-direction: column;
    gap: 2px;
    font-size: 12px;
  }
}
</style>
