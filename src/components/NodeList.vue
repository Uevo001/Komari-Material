<script setup lang="ts">
import type { NodeData } from '@/stores/nodes'
import { computed, h, ref } from 'vue'
import PingChart from '@/components/PingChart.vue'
import TrafficProgress from '@/components/TrafficProgress.vue'
import { useAppStore } from '@/stores/app'
import { formatBytesPerSecondWithConfig, formatBytesWithConfig, formatDateTime, formatUptimeWithFormat, getStatus } from '@/utils/helper'
import { getOSImage, getOSName } from '@/utils/osImageHelper'
import { getRegionCode, getRegionDisplayName } from '@/utils/regionHelper'
import { formatPriceWithCycle, getDaysUntilExpired, getExpireStatus, parseTags } from '@/utils/tagHelper'

const props = defineProps<{
  nodes: NodeData[]
}>()

const emit = defineEmits<{
  click: [node: NodeData]
}>()

const appStore = useAppStore()
const themeColors = computed(() => appStore.materialThemeTokens.chartColors)
const sortKey = ref<string>('')
const sortDir = ref<1 | -1>(1)
const columns = computed(() => appStore.listViewColumns)

const formatBytes = (bytes: number) => formatBytesWithConfig(bytes, appStore.byteDecimals)
const formatBytesPerSecond = (bytes: number) => formatBytesPerSecondWithConfig(bytes, appStore.byteDecimals)
const formatUptime = (seconds: number) => formatUptimeWithFormat(seconds, appStore.uptimeFormat)

const columnTitles: Record<string, string> = {
  status: '状态',
  region: '地区',
  name: '节点',
  tags: '标签',
  uptime: '运行时间',
  os: '系统',
  cpu: 'CPU',
  mem: '内存',
  disk: '硬盘',
  traffic: '流量',
  rate: '速率',
}

const gridStyle = computed(() => {
  const visibleColumns = columns.value
  const columnWidths = appStore.listColumnWidths
  const columnGap = appStore.listColumnGap
  const templateColumns = visibleColumns.map(col => columnWidths[col] || 'auto')
  return {
    gridTemplateColumns: templateColumns.join(' '),
    gap: columnGap,
  }
})

const rowHeightStyle = computed(() => {
  const height = appStore.listRowHeight
  if (height) {
    return { height, minHeight: height }
  }
  return {}
})

const hasBackgroundBlur = computed(() => appStore.backgroundEnabled && appStore.cardBlurRadius > 0)
const listBlurClass = computed(() => {
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

const sortedNodes = computed(() => {
  const nodes = [...props.nodes]
  const key = sortKey.value
  const dir = sortDir.value
  if (!key)
    return nodes

  return nodes.sort((a, b) => {
    switch (key) {
      case 'status':
        return dir * ((a.online ? 1 : 0) - (b.online ? 1 : 0))
      case 'region':
      case 'name':
      case 'os': {
        const va = String(a[key] || '').toLowerCase()
        const vb = String(b[key] || '').toLowerCase()
        return dir * (va < vb ? -1 : va > vb ? 1 : 0)
      }
      case 'uptime':
        return dir * ((a.uptime ?? 0) - (b.uptime ?? 0))
      case 'cpu':
        return dir * ((a.cpu ?? 0) - (b.cpu ?? 0))
      case 'mem':
        return dir * ((a.ram ?? 0) / (a.mem_total || 1) - (b.ram ?? 0) / (b.mem_total || 1))
      case 'disk':
        return dir * ((a.disk ?? 0) / (a.disk_total || 1) - (b.disk ?? 0) / (b.disk_total || 1))
      case 'traffic':
        return dir * (getTrafficUsed(a) - getTrafficUsed(b))
      case 'rate':
        return dir * (((a.net_out ?? 0) + (a.net_in ?? 0)) - ((b.net_out ?? 0) + (b.net_in ?? 0)))
      default:
        return 0
    }
  })
})

function handleSort(col: string) {
  if (sortKey.value === col) {
    sortDir.value = sortDir.value === 1 ? -1 : 1
  }
  else {
    sortKey.value = col
    sortDir.value = 1
  }
}

function getColumnStyle(col: string): Record<string, string> {
  return {
    ...(appStore.listColumnPadding[col] ? { padding: appStore.listColumnPadding[col] } : {}),
    ...(appStore.listColumnMargin[col] ? { margin: appStore.listColumnMargin[col] } : {}),
  }
}

function getFlagSrc(region: string): string {
  return `/images/flags/${getRegionCode(region)}.svg`
}

function handleClick(node: NodeData) {
  emit('click', node)
}

function openPingChart(node: NodeData) {
  window.$modal.create({
    title: `${node.name} - 延迟监控`,
    content: () => h(PingChart, { uuid: node.uuid }),
  })
}

function showTrafficProgress(node: NodeData): boolean {
  return node.traffic_limit > 0
}

function getTrafficUsedPercentage(node: NodeData): number {
  if (node.traffic_limit <= 0)
    return 0

  return Math.min((getTrafficUsed(node) / node.traffic_limit) * 100, 100)
}

function getTrafficUsed(node: NodeData): number {
  const { net_total_up = 0, net_total_down = 0, traffic_limit_type } = node
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
}

function getExpireBadgeColor(status: string): string {
  switch (status) {
    case 'expired':
    case 'critical':
      return '#E54D2E'
    case 'warning':
      return '#F97316'
    case 'long_term':
      return '#8D8D8D'
    case 'normal':
    default:
      return '#30A46C'
  }
}

function getNodeTags(node: NodeData): Array<{ text: string, color: string }> {
  const tags: Array<{ text: string, color: string }> = []
  const lang = appStore.lang

  if (node.price !== 0) {
    const days = getDaysUntilExpired(node.expired_at)
    const status = getExpireStatus(node.expired_at)
    const color = getExpireBadgeColor(status)

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

  for (const tag of parseTags(node.tags)) {
    tags.push({ text: tag.text, color: tag.hex })
  }

  return tags
}

function tagStyle(color: string) {
  return {
    color,
    backgroundColor: `${color}20`,
    borderColor: `${color}44`,
  }
}

function statusColor(status: 'success' | 'warning' | 'error') {
  if (status === 'success')
    return themeColors.value.success
  if (status === 'warning')
    return themeColors.value.warning
  return themeColors.value.error
}

function memPercent(node: NodeData) {
  return (node.ram ?? 0) / (node.mem_total || 1) * 100
}

function diskPercent(node: NodeData) {
  return (node.disk ?? 0) / (node.disk_total || 1) * 100
}
</script>

<template>
  <div class="node-list-wrapper">
    <div class="md-card node-list" :class="[{ 'md-surface-glass': hasBackgroundBlur }, listBlurClass]">
      <div class="node-list__header" :style="gridStyle">
        <div
          v-for="col in columns"
          :key="col"
          class="node-list__header-cell"
          :style="getColumnStyle(col)"
          @click="handleSort(col)"
        >
          <span>{{ columnTitles[col] }}</span>
          <span v-if="sortKey === col" class="material-symbols-rounded">{{ sortDir === 1 ? 'arrow_upward' : 'arrow_downward' }}</span>
        </div>
      </div>

      <div
        v-for="node in sortedNodes"
        :key="node.uuid"
        class="node-list__row"
        :class="{ 'node-list__row--offline': !node.online }"
        :style="rowHeightStyle"
        @click="handleClick(node)"
      >
        <div class="node-list__grid" :style="gridStyle">
          <template v-for="col in columns" :key="col">
            <div v-if="col === 'status'" class="node-list__cell node-list__cell--status" :style="getColumnStyle('status')">
              <button
                v-if="appStore.showPingChartButton"
                class="material-icon-button node-list__chart-button"
                type="button"
                title="查看延迟图表"
                @click.stop="openPingChart(node)"
              >
                <span class="material-symbols-rounded">show_chart</span>
              </button>
              <span v-if="appStore.listStatusStyle === 'tag'" class="md-chip" :class="node.online ? 'md-chip--success' : 'md-chip--error'">
                {{ node.online ? '在线' : '离线' }}
              </span>
              <span v-else class="node-list__status-badge" :class="{ 'node-list__status-badge--online': node.online }">
                {{ node.online ? '在线' : '离线' }}
              </span>
            </div>

            <div v-else-if="col === 'region'" class="node-list__cell node-list__cell--center" :style="getColumnStyle('region')">
              <img class="node-list__flag" :src="getFlagSrc(node.region)" :alt="getRegionDisplayName(node.region)">
            </div>

            <div v-else-if="col === 'name'" class="node-list__cell node-list__name" :style="getColumnStyle('name')">
              {{ node.name }}
            </div>

            <div v-else-if="col === 'tags'" class="node-list__cell node-list__tags" :style="getColumnStyle('tags')">
              <span v-for="(tag, index) in getNodeTags(node)" :key="index" class="md-chip" :style="tagStyle(tag.color)">
                {{ tag.text }}
              </span>
            </div>

            <div v-else-if="col === 'uptime'" class="node-list__cell md-number" :style="getColumnStyle('uptime')">
              {{ formatUptime(node.uptime ?? 0) }}
            </div>

            <div v-else-if="col === 'os'" class="node-list__cell node-list__os" :style="getColumnStyle('os')">
              <img :src="getOSImage(node.os)" :alt="getOSName(node.os)">
              <span>{{ getOSName(node.os) }}</span>
            </div>

            <div v-else-if="col === 'cpu'" class="node-list__cell node-list__resource" :style="getColumnStyle('cpu')">
              <div class="node-list__resource-line md-number">
                <span>{{ (node.cpu ?? 0).toFixed(1) }}%</span>
                <small>{{ node.load.toFixed(2) ?? 0 }}, {{ node.load5.toFixed(2) ?? 0 }}, {{ node.load15.toFixed(2) ?? 0 }}</small>
              </div>
              <div class="md-progress">
                <div class="md-progress__bar" :style="{ width: `${node.cpu ?? 0}%`, backgroundColor: statusColor(getStatus(node.cpu ?? 0)) }" />
              </div>
            </div>

            <div v-else-if="col === 'mem'" class="node-list__cell node-list__resource" :style="getColumnStyle('mem')">
              <div class="node-list__resource-line md-number">
                <span>{{ memPercent(node).toFixed(1) }}%</span>
                <small>{{ formatBytes(node.ram ?? 0) }} / {{ formatBytes(node.mem_total ?? 0) }}</small>
              </div>
              <div class="md-progress">
                <div class="md-progress__bar" :style="{ width: `${memPercent(node)}%`, backgroundColor: statusColor(getStatus(memPercent(node))) }" />
              </div>
            </div>

            <div v-else-if="col === 'disk'" class="node-list__cell node-list__resource" :style="getColumnStyle('disk')">
              <div class="node-list__resource-line md-number">
                <span>{{ diskPercent(node).toFixed(1) }}%</span>
                <small>{{ formatBytes(node.disk ?? 0) }} / {{ formatBytes(node.disk_total ?? 0) }}</small>
              </div>
              <div class="md-progress">
                <div class="md-progress__bar" :style="{ width: `${diskPercent(node)}%`, backgroundColor: statusColor(getStatus(diskPercent(node))) }" />
              </div>
            </div>

            <div v-else-if="col === 'rate'" class="node-list__cell node-list__rate md-number" :style="getColumnStyle('rate')">
              <span :style="{ color: themeColors.success }">↑{{ formatBytesPerSecond(node.net_out ?? 0) }}</span>
              <span :style="{ color: themeColors.primary }">↓{{ formatBytesPerSecond(node.net_in ?? 0) }}</span>
            </div>

            <div v-else-if="col === 'traffic'" class="node-list__cell node-list__resource" :style="getColumnStyle('traffic')">
              <div class="node-list__resource-line md-number">
                <span v-if="showTrafficProgress(node)">{{ getTrafficUsedPercentage(node).toFixed(1) }}%</span>
                <span v-else>∞</span>
                <small>{{ formatBytes(getTrafficUsed(node)) }} / <template v-if="showTrafficProgress(node)">{{ formatBytes(node.traffic_limit) }}</template><template v-else>∞</template></small>
              </div>
              <TrafficProgress
                :upload="node.net_total_up ?? 0"
                :download="node.net_total_down ?? 0"
                :traffic-limit="node.traffic_limit"
                :traffic-limit-type="(node.traffic_limit_type || 'sum')"
                height="6px"
              />
            </div>
          </template>
        </div>

        <div v-if="!node.online" class="node-list__offline-overlay" aria-hidden="true">
          <img class="node-list__flag" :src="getFlagSrc(node.region)" :alt="getRegionDisplayName(node.region)">
          <strong>{{ node.name }}</strong>
          <span class="md-number">最后在线 {{ formatDateTime(node.time) }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
.node-list-wrapper {
  min-width: 0;
  overflow-x: auto;
}

.node-list {
  min-width: fit-content;
}

.node-list__header,
.node-list__grid {
  display: grid;
  align-items: center;
}

.node-list__header {
  min-height: 44px;
  padding: 0 16px;
  border-bottom: 1px solid var(--md-sys-color-outline-variant);
  background: var(--md-sys-color-surface-container-high);
}

.node-list__header-cell {
  display: inline-flex;
  min-width: 0;
  align-items: center;
  gap: 4px;
  color: var(--md-sys-color-on-surface-variant);
  font-size: 12px;
  font-weight: 650;
  cursor: pointer;
  user-select: none;
}

.node-list__header-cell .material-symbols-rounded {
  font-size: 14px;
}

.node-list__row {
  position: relative;
  min-height: var(--md-app-row-height);
  padding: 8px 16px;
  border-bottom: 1px solid color-mix(in srgb, var(--md-sys-color-outline-variant) 72%, transparent);
  cursor: pointer;
  transition: background-color 160ms ease;

  &:hover {
    background: color-mix(in srgb, var(--md-sys-color-on-surface) 5%, transparent);
  }

  &:last-child {
    border-bottom: 0;
  }
}

.node-list__cell {
  min-width: 0;
  overflow: hidden;
  color: var(--md-sys-color-on-surface-variant);
  font-size: 12px;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.node-list__cell--status,
.node-list__cell--center {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
}

.node-list__chart-button {
  width: 32px;
  height: 32px;
}

.node-list__name {
  color: var(--md-sys-color-on-surface);
  font-size: 14px;
  font-weight: 680;
}

.node-list__flag {
  width: 20px;
  height: 20px;
  border-radius: 5px;
  object-fit: cover;
}

.node-list__tags {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  align-items: center;
}

.node-list__os {
  display: inline-flex;
  align-items: center;
  gap: 6px;

  img {
    width: 16px;
    height: 16px;
    flex-shrink: 0;
  }
}

.node-list__resource {
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.node-list__resource-line {
  display: flex;
  align-items: center;
  gap: 8px;

  small {
    margin-left: auto;
    overflow: hidden;
    color: var(--md-sys-color-on-surface-variant);
    text-overflow: ellipsis;
    white-space: nowrap;
  }
}

.node-list__rate {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.node-list__status-badge {
  display: inline-flex;
  min-height: 22px;
  align-items: center;
  border-radius: 999px;
  padding: 0 8px;
  color: var(--md-sys-color-on-error-container);
  background: var(--md-sys-color-error-container);
  font-size: 11px;
  font-weight: 650;
}

.node-list__status-badge--online {
  color: #063a20;
  background: color-mix(in srgb, #8dd7a5 35%, transparent);
}

.node-list__offline-overlay {
  position: absolute;
  inset: 0 0 0 auto;
  z-index: 3;
  display: flex;
  width: min(72%, 620px);
  align-items: center;
  gap: 10px;
  padding: 0 18px;
  color: var(--md-sys-color-on-surface-variant);
  background: color-mix(in srgb, var(--md-sys-color-surface-container-high) 84%, transparent);
  backdrop-filter: blur(16px);
  pointer-events: none;
  transition: opacity 160ms ease;

  strong {
    min-width: 0;
    overflow: hidden;
    color: var(--md-sys-color-on-surface);
    text-overflow: ellipsis;
    white-space: nowrap;
  }
}

.node-list__row:hover .node-list__offline-overlay {
  opacity: 0;
}
</style>
