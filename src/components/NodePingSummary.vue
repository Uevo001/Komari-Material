<script setup lang="ts">
import { computed } from 'vue'
import { useAppStore } from '@/stores/app'
import { formatBytesPerSecondWithConfig } from '@/utils/helper'

const props = withDefaults(defineProps<{
  uuid: string
  uploadSpeed?: number
  downloadSpeed?: number
  density?: 'regular' | 'compact'
}>(), {
  uploadSpeed: 0,
  downloadSpeed: 0,
  density: 'regular',
})

const appStore = useAppStore()

function normalizeSpeed(value: number): number {
  if (!Number.isFinite(value))
    return 0
  return Math.max(value, 0)
}

const uploadSpeedValue = computed(() => normalizeSpeed(props.uploadSpeed))

const downloadSpeedValue = computed(() => normalizeSpeed(props.downloadSpeed))

const uploadSpeedDisplay = computed(() => {
  return formatBytesPerSecondWithConfig(uploadSpeedValue.value, appStore.byteDecimals)
})

const downloadSpeedDisplay = computed(() => {
  return formatBytesPerSecondWithConfig(downloadSpeedValue.value, appStore.byteDecimals)
})

const speedTitle = computed(() => {
  return `上传 ${uploadSpeedDisplay.value}，下载 ${downloadSpeedDisplay.value}`
})
</script>

<template>
  <div class="node-ping-summary" :class="`node-ping-summary--${props.density}`">
    <section
      class="node-ping-summary__panel node-ping-summary__panel--speed"
      :title="speedTitle"
    >
      <div
        class="node-ping-summary__speed-pairs"
        :aria-label="speedTitle"
      >
        <span class="node-ping-summary__speed-item node-ping-summary__speed-item--upload">
          <span class="material-symbols-rounded" aria-hidden="true">arrow_upward</span>
          <strong class="md-number">{{ uploadSpeedDisplay }}</strong>
        </span>
        <span class="node-ping-summary__speed-item node-ping-summary__speed-item--download">
          <span class="material-symbols-rounded" aria-hidden="true">arrow_downward</span>
          <strong class="md-number">{{ downloadSpeedDisplay }}</strong>
        </span>
      </div>
    </section>
  </div>
</template>

<style scoped lang="scss">
.node-ping-summary {
  display: grid;
  min-width: 0;
  grid-template-columns: 1fr;
  gap: 8px;
}

.node-ping-summary__panel {
  --ping-accent-color: var(--md-sys-color-primary);

  position: relative;
  display: grid;
  min-width: 0;
  container-type: inline-size;
  gap: 6px;
  overflow: hidden;
  border-radius: 8px;
  padding: 8px 10px 7px;
  color: var(--ping-accent-color);
  background: var(--md-sys-color-surface-container-high);
  transition: background-color var(--md-app-motion-duration-short) var(--md-app-motion-easing-standard);
}

.node-ping-summary__panel::before {
  content: '';
  position: absolute;
  inset: 0;
  background: var(--md-sys-color-on-surface);
  opacity: 0;
  pointer-events: none;
  transition: opacity var(--md-app-motion-duration-short) var(--md-app-motion-easing-standard);
}

.node-ping-summary__panel:hover::before {
  opacity: var(--md-app-state-hover);
}

.node-ping-summary__speed-pairs {
  position: relative;
  display: grid;
  min-width: 0;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  align-items: center;
  gap: 10px;
}

.node-ping-summary__speed-item {
  --speed-item-color: var(--ping-accent-color);

  display: grid;
  min-width: 0;
  grid-template-columns: 20px minmax(0, 1fr);
  align-items: center;
  gap: 7px;

  .material-symbols-rounded {
    display: inline-flex;
    width: 20px;
    height: 20px;
    align-items: center;
    justify-content: center;
    border-radius: 999px;
    color: var(--speed-item-color);
    background: color-mix(in srgb, var(--speed-item-color) 12%, transparent);
    font-size: 15px;
    line-height: 1;
  }

  strong {
    min-width: 0;
    overflow: hidden;
    color: var(--md-sys-color-on-surface);
    font-family: var(--md-sys-typescale-label-medium-font);
    font-size: var(--md-sys-typescale-label-medium-size);
    font-weight: 800;
    line-height: var(--md-sys-typescale-label-medium-line-height);
    letter-spacing: var(--md-sys-typescale-label-medium-tracking);
    text-align: right;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
}

.node-ping-summary__speed-item--upload {
  --speed-item-color: var(--md-chart-success);
}

.node-ping-summary__speed-item--download {
  --speed-item-color: var(--md-sys-color-primary);
}

.node-ping-summary__panel--speed {
  --ping-accent-color: var(--md-sys-color-primary);
}

.node-ping-summary--compact {
  gap: 6px;
}

.node-ping-summary--compact .node-ping-summary__panel {
  gap: 4px;
  padding: 7px 8px 6px;
}

.node-ping-summary--compact .node-ping-summary__speed-pairs {
  gap: 8px;
}

.node-ping-summary--compact .node-ping-summary__speed-item {
  grid-template-columns: 18px minmax(0, 1fr);
  gap: 5px;

  .material-symbols-rounded {
    width: 18px;
    height: 18px;
    font-size: 14px;
  }

  strong {
    font-family: var(--md-sys-typescale-label-small-font);
    font-size: var(--md-sys-typescale-label-small-size);
    font-weight: 800;
    line-height: var(--md-sys-typescale-label-small-line-height);
    letter-spacing: var(--md-sys-typescale-label-small-tracking);
  }
}

@media (max-width: 360px) {
  .node-ping-summary {
    gap: 5px;
  }

  .node-ping-summary__panel {
    padding-inline: 6px;
  }

  .node-ping-summary__speed-pairs {
    gap: 6px;
  }
}
</style>
