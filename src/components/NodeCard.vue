<script setup lang="ts">
import type { NodeData } from '@/stores/nodes'
import { computed, h } from 'vue'
import PingChart from '@/components/PingChart.vue'
import TrafficProgress from '@/components/TrafficProgress.vue'
import { useAppStore } from '@/stores/app'
import { formatBytesPerSecondWithConfig, formatBytesWithConfig, formatDateTime, formatUptimeWithFormat, getStatus } from '@/utils/helper'
import { getOSImage, getOSName } from '@/utils/osImageHelper'
import { getRegionCode, getRegionDisplayName } from '@/utils/regionHelper'
import { formatPriceWithCycle, getDaysUntilExpired, getExpireStatus, getExpireStatusHexColor, parseTags } from '@/utils/tagHelper'

const props = defineProps<{
  node: NodeData
}>()

const emit = defineEmits<{
  click: []
}>()

const appStore = useAppStore()
const themeColors = computed(() => appStore.materialThemeTokens.chartColors)

const formatBytes = (bytes: number) => formatBytesWithConfig(bytes, appStore.byteDecimals)
const formatBytesPerSecond = (bytes: number) => formatBytesPerSecondWithConfig(bytes, appStore.byteDecimals)
const formatUptime = (seconds: number) => formatUptimeWithFormat(seconds, appStore.uptimeFormat)
const offlineTime = computed(() => formatDateTime(props.node.time))

const cpuStatus = computed(() => getStatus(props.node.cpu ?? 0))
const memPercentage = computed(() => (props.node.ram ?? 0) / (props.node.mem_total || 1) * 100)
const memStatus = computed(() => getStatus(memPercentage.value))
const diskPercentage = computed(() => (props.node.disk ?? 0) / (props.node.disk_total || 1) * 100)
const diskStatus = computed(() => getStatus(diskPercentage.value))
const showTrafficProgress = computed(() => props.node.traffic_limit > 0)

const trafficUsedPercentage = computed(() => {
  if (props.node.traffic_limit <= 0)
    return 0

  const { net_total_up = 0, net_total_down = 0, traffic_limit_type } = props.node
  let used = 0

  switch (traffic_limit_type) {
    case 'up':
      used = net_total_up
      break
    case 'down':
      used = net_total_down
      break
    case 'min':
      used = Math.min(net_total_up, net_total_down)
      break
    case 'max':
      used = Math.max(net_total_up, net_total_down)
      break
    case 'sum':
    default:
      used = net_total_up + net_total_down
      break
  }

  return Math.min((used / props.node.traffic_limit) * 100, 100)
})

const trafficUsed = computed(() => {
  const { net_total_up = 0, net_total_down = 0, traffic_limit_type } = props.node
  switch (traffic_limit_type) {
    case 'up':
      return net_total_up
    case 'down':
      return net_total_down
    case 'min':
      return Math.min(net_total_up, net_total_down)
    case 'max':
      return Math.max(net_total_up, net_total_down)
    case 'sum':
    default:
      return net_total_up + net_total_down
  }
})

const priceTags = computed(() => {
  const tags: Array<{ text: string, color: string }> = []
  const lang = appStore.lang
  const node = props.node

  if (node.price !== 0) {
    const days = getDaysUntilExpired(node.expired_at)
    const status = getExpireStatus(node.expired_at)
    const color = getExpireStatusHexColor(status)

    if (status === 'expired') {
      tags.push({ text: lang === 'zh-CN' ? '已过期' : 'Expired', color })
    }
    else if (status === 'long_term') {
      tags.push({ text: lang === 'zh-CN' ? '长期' : 'Long-term', color })
    }
    else {
      tags.push({ text: lang === 'zh-CN' ? `剩余 ${days} 天` : `${days} days left`, color })
    }

    tags.push({ text: formatPriceWithCycle(node.price, node.billing_cycle, node.currency, lang), color: themeColors.value.primary })
  }

  return tags
})

const customTags = computed(() => {
  return parseTags(props.node.tags).map(tag => ({ text: tag.text, color: tag.hex }))
})

const mergedTags = computed(() => [...customTags.value, ...priceTags.value])
const shouldShowTagsInSeparateRow = computed(() => appStore.tagsInSeparateRow && mergedTags.value.length > 0)
const hasBackgroundBlur = computed(() => appStore.backgroundEnabled && appStore.cardBlurRadius > 0)
const cardBlurClass = computed(() => {
  if (!hasBackgroundBlur.value)
    return ''
  const radius = appStore.cardBlurRadius
  if (radius <= 8)
    return 'glass-8'
  if (radius <= 12)
    return 'glass-12'
  if (radius <= 16)
    return 'glass-16'
  if (radius <= 20)
    return 'glass-20'
  return `glass-${radius}`
})

function statusColor(status: 'success' | 'warning' | 'error') {
  if (status === 'success')
    return themeColors.value.success
  if (status === 'warning')
    return themeColors.value.warning
  return themeColors.value.error
}

function tagStyle(color: string) {
  return {
    color,
    backgroundColor: `${color}20`,
    borderColor: `${color}44`,
  }
}

function openPingChart() {
  window.$modal.create({
    title: `${props.node.name} - 延迟监控`,
    content: () => h(PingChart, { uuid: props.node.uuid }),
  })
}
</script>

<template>
  <article
    class="md-card md-card--interactive node-card"
    :class="[
      props.node.online ? 'node-card--online' : 'node-card--offline',
      { 'md-surface-glass': hasBackgroundBlur },
      cardBlurClass,
    ]"
    @click="emit('click')"
  >
    <header class="node-card__header">
      <div class="node-card__identity">
        <img class="node-card__flag" :src="`/images/flags/${getRegionCode(props.node.region)}.svg`" :alt="getRegionDisplayName(props.node.region)">
        <div v-if="customTags.length > 0 && !appStore.tagsInSeparateRow" class="node-card__hover-tags">
          <span v-for="(tag, index) in customTags" :key="index" class="md-chip" :style="tagStyle(tag.color)">
            {{ tag.text }}
          </span>
        </div>
        <h3 class="node-card__name">
          {{ props.node.name }}
        </h3>
      </div>

      <div class="node-card__actions">
        <button
          v-if="appStore.showPingChartButton"
          class="material-icon-button node-card__chart-button"
          type="button"
          title="查看延迟图表"
          aria-label="查看延迟图表"
          @click.stop="openPingChart"
        >
          <span class="material-symbols-rounded">show_chart</span>
        </button>
        <span
          class="node-card__status-dot"
          :class="{ 'node-card__status-dot--online': props.node.online }"
          :style="{ backgroundColor: props.node.online ? themeColors.success : themeColors.error }"
          :title="props.node.online ? '在线' : '离线'"
        />
      </div>
    </header>

    <div class="node-card__content">
      <div v-if="!props.node.online" class="node-card__offline-overlay" aria-hidden="true">
        <div class="node-card__offline-content">
          <div class="node-card__offline-title">
            <img class="node-card__flag" :src="`/images/flags/${getRegionCode(props.node.region)}.svg`" :alt="getRegionDisplayName(props.node.region)">
            <span>{{ props.node.name }}</span>
          </div>
          <strong>节点已离线</strong>
          <span class="md-number">最后在线 {{ offlineTime }}</span>
          <div v-if="!appStore.tagsInSeparateRow && priceTags.length > 0" class="node-card__tag-row node-card__tag-row--center">
            <span v-for="(tag, index) in priceTags" :key="index" class="md-chip" :style="tagStyle(tag.color)">
              {{ tag.text }}
            </span>
          </div>
        </div>
      </div>

      <div class="node-card__row">
        <span class="md-label">操作系统</span>
        <span class="node-card__os">
          <img :src="getOSImage(props.node.os)" :alt="getOSName(props.node.os)">
          <span>{{ getOSName(props.node.os) }} / {{ props.node.arch }}</span>
        </span>
      </div>

      <div class="node-card__resource-grid" :class="appStore.cardProgressLayout === '1col' ? 'node-card__resource-grid--single' : ''">
        <div class="node-card__resource">
          <div class="node-card__resource-head">
            <span class="md-label">CPU</span>
            <span class="md-number">{{ (props.node.cpu ?? 0).toFixed(1) }}%</span>
          </div>
          <div class="md-progress">
            <div class="md-progress__bar" :style="{ width: `${props.node.cpu ?? 0}%`, backgroundColor: statusColor(cpuStatus) }" />
          </div>
          <span class="node-card__hint md-number">{{ node.load.toFixed(2) ?? 0 }}, {{ node.load5.toFixed(2) ?? 0 }}, {{ node.load15.toFixed(2) ?? 0 }}</span>
        </div>

        <div class="node-card__resource">
          <div class="node-card__resource-head">
            <span class="md-label">内存</span>
            <span class="md-number">{{ memPercentage.toFixed(1) }}%</span>
          </div>
          <div class="md-progress">
            <div class="md-progress__bar" :style="{ width: `${memPercentage}%`, backgroundColor: statusColor(memStatus) }" />
          </div>
          <span class="node-card__hint md-number">{{ formatBytes(props.node.ram ?? 0) }} / {{ formatBytes(props.node.mem_total ?? 0) }}</span>
        </div>

        <div class="node-card__resource">
          <div class="node-card__resource-head">
            <span class="md-label">硬盘</span>
            <span class="md-number">{{ diskPercentage.toFixed(1) }}%</span>
          </div>
          <div class="md-progress">
            <div class="md-progress__bar" :style="{ width: `${diskPercentage}%`, backgroundColor: statusColor(diskStatus) }" />
          </div>
          <span class="node-card__hint md-number">{{ formatBytes(props.node.disk ?? 0) }} / {{ formatBytes(props.node.disk_total ?? 0) }}</span>
        </div>

        <div class="node-card__resource">
          <div class="node-card__resource-head">
            <span class="md-label">流量</span>
            <span class="md-number">{{ showTrafficProgress ? `${trafficUsedPercentage.toFixed(1)}%` : '∞' }}</span>
          </div>
          <TrafficProgress
            :height="6"
            :upload="props.node.net_total_up ?? 0"
            :download="props.node.net_total_down ?? 0"
            :traffic-limit="props.node.traffic_limit"
            :traffic-limit-type="(props.node.traffic_limit_type || 'sum')"
          />
          <span class="node-card__hint md-number">
            <template v-if="showTrafficProgress">{{ formatBytes(trafficUsed) }} / {{ formatBytes(props.node.traffic_limit) }}</template>
            <template v-else>
              <span :style="{ color: appStore.trafficSplitColor ? themeColors.success : undefined }">↑ {{ formatBytes(props.node.net_total_up ?? 0) }}</span>
              <span class="node-card__split" />
              <span :style="{ color: appStore.trafficSplitColor ? themeColors.primary : undefined }">↓ {{ formatBytes(props.node.net_total_down ?? 0) }}</span>
            </template>
          </span>
        </div>
      </div>

      <div class="node-card__row">
        <span class="md-label">网络速率</span>
        <span class="node-card__rate md-number">
          <span :style="{ color: themeColors.success }">↑ {{ formatBytesPerSecond(props.node.net_out ?? 0) }}</span>
          <span :style="{ color: themeColors.primary }">↓ {{ formatBytesPerSecond(props.node.net_in ?? 0) }}</span>
        </span>
      </div>

      <div class="node-card__row">
        <span class="md-label">运行时间</span>
        <span class="node-card__uptime">
          <template v-if="!shouldShowTagsInSeparateRow">
            <span v-for="(tag, index) in priceTags" :key="index" class="md-chip" :style="tagStyle(tag.color)">
              {{ tag.text }}
            </span>
          </template>
          <span v-if="appStore.uptimeTagWrap" class="md-chip">{{ formatUptime(props.node.uptime ?? 0) }}</span>
          <span v-else class="md-number">{{ formatUptime(props.node.uptime ?? 0) }}</span>
        </span>
      </div>

      <div v-if="shouldShowTagsInSeparateRow" class="node-card__row node-card__row--tags">
        <span class="md-label">标签</span>
        <span class="node-card__tag-row">
          <span v-for="(tag, index) in mergedTags" :key="index" class="md-chip" :style="tagStyle(tag.color)">
            {{ tag.text }}
          </span>
        </span>
      </div>
    </div>
  </article>
</template>

<style scoped lang="scss">
.node-card {
  min-height: 100%;
}

.node-card__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: var(--md-app-card-padding) var(--md-app-card-padding) 8px;
}

.node-card__identity {
  position: relative;
  display: flex;
  min-width: 0;
  align-items: center;
  gap: 10px;
}

.node-card__flag {
  width: 22px;
  height: 22px;
  flex-shrink: 0;
  border-radius: 5px;
  object-fit: cover;
}

.node-card__name {
  overflow: hidden;
  margin: 0;
  color: var(--md-sys-color-on-surface);
  font-size: 17px;
  font-weight: 720;
  line-height: 1.25;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.node-card__actions {
  display: flex;
  flex-shrink: 0;
  align-items: center;
  gap: 8px;
}

.node-card__chart-button {
  width: 34px;
  height: 34px;
}

.node-card__status-dot {
  position: relative;
  width: 9px;
  height: 9px;
  border-radius: 999px;
}

.node-card__status-dot--online::after {
  content: '';
  position: absolute;
  inset: 0;
  border-radius: inherit;
  background: inherit;
  opacity: 0.42;
  animation: node-status-wave 1.6s infinite ease-out;
}

.node-card__content {
  position: relative;
  display: flex;
  flex-direction: column;
  gap: 14px;
  padding: 8px var(--md-app-card-padding) var(--md-app-card-padding);
}

.node-card__row,
.node-card__resource-head {
  display: flex;
  min-width: 0;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.node-card__os,
.node-card__rate,
.node-card__uptime,
.node-card__tag-row {
  display: inline-flex;
  min-width: 0;
  flex-wrap: wrap;
  align-items: center;
  justify-content: flex-end;
  gap: 6px;
  color: var(--md-sys-color-on-surface);
  font-size: 13px;
}

.node-card__os img {
  width: 18px;
  height: 18px;
  flex-shrink: 0;
}

.node-card__resource-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 14px 18px;
}

.node-card__resource-grid--single {
  grid-template-columns: 1fr;
}

.node-card__resource {
  display: flex;
  min-width: 0;
  flex-direction: column;
  gap: 6px;
}

.node-card__resource-head {
  font-size: 13px;
}

.node-card__hint {
  overflow: hidden;
  color: var(--md-sys-color-on-surface-variant);
  font-size: 11px;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.node-card__split::before {
  content: ' ';
  display: inline-block;
  width: 6px;
}

.node-card__hover-tags {
  position: absolute;
  left: -1px;
  right: -160px;
  bottom: -52px;
  z-index: 3;
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  padding: 10px;
  border-radius: 16px;
  background: color-mix(in srgb, var(--md-sys-color-surface-container-high) 84%, transparent);
  backdrop-filter: blur(12px);
  opacity: 0;
  pointer-events: none;
  transform: translateY(6px);
  transition:
    opacity 180ms ease,
    transform 180ms ease;
}

.node-card:hover .node-card__hover-tags {
  opacity: 1;
  transform: translateY(0);
}

.node-card__offline-overlay {
  position: absolute;
  inset: 0;
  z-index: 4;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
  border-radius: 0 0 var(--md-app-card-radius) var(--md-app-card-radius);
  background: color-mix(in srgb, var(--md-sys-color-surface-container-high) 82%, transparent);
  backdrop-filter: blur(18px);
  pointer-events: none;
  transition: opacity 180ms ease;
}

.node-card:hover .node-card__offline-overlay {
  opacity: 0;
}

.node-card__offline-content {
  display: flex;
  max-width: 100%;
  flex-direction: column;
  gap: 7px;
  align-items: center;
  color: var(--md-sys-color-on-surface-variant);
  font-size: 12px;
  text-align: center;

  strong {
    color: var(--md-sys-color-error);
    font-size: 14px;
  }
}

.node-card__offline-title {
  display: flex;
  max-width: 100%;
  align-items: center;
  justify-content: center;
  gap: 8px;
  color: var(--md-sys-color-on-surface);
  font-weight: 650;
}

.node-card__tag-row--center {
  justify-content: center;
}

@keyframes node-status-wave {
  to {
    opacity: 0;
    transform: scale(2.8);
  }
}
</style>
