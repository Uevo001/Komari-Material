import type { PingRecord } from '@/utils/rpc'
import { defineStore } from 'pinia'
import { computed, onScopeDispose, ref, shallowRef, watch } from 'vue'
import { getSharedRpc } from '@/utils/rpc'

export interface NodePingHistoryPoint {
  time: string
  latency: number | null
  loss: number | null
}

export interface NodePingStats {
  avgLatency: number
  avgLoss: number
  history: NodePingHistoryPoint[]
  hasData: boolean
}

export interface PingTaskInfo {
  id: number
  name: string
  interval: number
  loss: number
}

export interface PingRecordsResponse {
  count?: number
  records: PingRecord[]
  tasks?: PingTaskInfo[]
}

interface TaskRecordSummary {
  total: number
  success: number
}

const PING_STATS_HOURS = 1
const PING_REFRESH_INTERVAL_MS = 60_000
const HISTORY_BUCKET_COUNT = 20

function createEmptyStats(): NodePingStats {
  return {
    avgLatency: 0,
    avgLoss: 0,
    history: [],
    hasData: false,
  }
}

function average(values: number[]): number {
  if (!values.length)
    return 0
  return values.reduce((sum, value) => sum + value, 0) / values.length
}

function isFiniteNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value)
}

function summarizeTaskRecords(records: PingRecord[]): Map<number, TaskRecordSummary> {
  const summaries = new Map<number, TaskRecordSummary>()

  for (const record of records) {
    const summary = summaries.get(record.task_id) ?? { total: 0, success: 0 }
    summary.total += 1
    if (record.value >= 0)
      summary.success += 1
    summaries.set(record.task_id, summary)
  }

  return summaries
}

function getIncludedTaskIds(records: PingRecord[]): Set<number> {
  const summaries = summarizeTaskRecords(records)
  return new Set(
    [...summaries.entries()]
      .filter(([, summary]) => summary.total > 0 && summary.success > 0)
      .map(([taskId]) => taskId),
  )
}

function buildRecordsByClient(records: PingRecord[]): Map<string, PingRecord[]> {
  const grouped = new Map<string, PingRecord[]>()

  for (const record of records) {
    if (!record.client)
      continue
    const currentRecords = grouped.get(record.client) ?? []
    currentRecords.push(record)
    grouped.set(record.client, currentRecords)
  }

  return grouped
}

function buildPingHistory(records: PingRecord[]): NodePingHistoryPoint[] {
  const sortedRecords = records
    .map((record) => {
      const timestamp = new Date(record.time).getTime()
      return { ...record, timestamp }
    })
    .filter(record => Number.isFinite(record.timestamp))
    .sort((left, right) => left.timestamp - right.timestamp)

  if (!sortedRecords.length)
    return []

  const lastTime = sortedRecords[sortedRecords.length - 1]?.timestamp ?? Date.now()
  const firstTime = lastTime - PING_STATS_HOURS * 3600_000
  const bucketSize = PING_STATS_HOURS * 3600_000 / HISTORY_BUCKET_COUNT

  return Array.from({ length: HISTORY_BUCKET_COUNT }, (_, index) => {
    const startTime = firstTime + bucketSize * index
    const endTime = index === HISTORY_BUCKET_COUNT - 1 ? lastTime + 1 : startTime + bucketSize
    const bucketRecords = sortedRecords.filter(
      record => record.timestamp >= startTime && record.timestamp < endTime,
    )
    const validLatencyRecords = bucketRecords.filter(record => record.value >= 0)
    const lostCount = bucketRecords.length - validLatencyRecords.length
    const latency = validLatencyRecords.length
      ? average(validLatencyRecords.map(record => record.value))
      : null
    const loss = bucketRecords.length
      ? lostCount / bucketRecords.length * 100
      : null

    return {
      time: new Date(startTime).toISOString(),
      latency,
      loss,
    }
  })
}

function buildStats(records: PingRecord[]): NodePingStats {
  const includedTaskIds = getIncludedTaskIds(records)
  if (!includedTaskIds.size)
    return createEmptyStats()

  const filteredRecords = records.filter(record => includedTaskIds.has(record.task_id))
  const history = buildPingHistory(filteredRecords)
  const taskRecords = new Map<number, PingRecord[]>()

  for (const record of filteredRecords) {
    const currentRecords = taskRecords.get(record.task_id) ?? []
    currentRecords.push(record)
    taskRecords.set(record.task_id, currentRecords)
  }

  const latencyValues: number[] = []
  const taskLossValues: number[] = []

  for (const recordsByTask of taskRecords.values()) {
    const validValues = recordsByTask
      .map(record => record.value)
      .filter(value => value >= 0)

    if (!validValues.length)
      continue

    latencyValues.push(average(validValues))
    taskLossValues.push((recordsByTask.length - validValues.length) / recordsByTask.length * 100)
  }

  const historyLatencyValues = history
    .map(point => point.latency)
    .filter(isFiniteNumber)
  const historyLossValues = history
    .map(point => point.loss)
    .filter(isFiniteNumber)

  const avgLatency = latencyValues.length ? average(latencyValues) : average(historyLatencyValues)
  const avgLoss = taskLossValues.length ? average(taskLossValues) : average(historyLossValues)
  const hasData = historyLatencyValues.length > 0 || historyLossValues.length > 0

  return {
    avgLatency,
    avgLoss,
    history,
    hasData,
  }
}

export const useNodePingStore = defineStore('nodePing', () => {
  const recordsByClient = shallowRef<Map<string, PingRecord[]>>(new Map())
  const loading = ref(false)
  const error = ref<string | null>(null)
  const lastFetchedAt = ref(0)
  const subscriberCount = ref(0)

  let refreshTimer: ReturnType<typeof setInterval> | null = null
  let pendingRequest: Promise<void> | null = null

  async function fetchRecords(): Promise<void> {
    if (pendingRequest)
      return pendingRequest

    const rpc = getSharedRpc()
    loading.value = recordsByClient.value.size === 0
    error.value = null

    pendingRequest = (async () => {
      try {
        const result = await rpc.getClient().call<PingRecordsResponse>('common:getRecords', {
          type: 'ping',
          hours: PING_STATS_HOURS,
        })

        recordsByClient.value = buildRecordsByClient(result?.records ?? [])
        lastFetchedAt.value = Date.now()
      }
      catch (err) {
        error.value = err instanceof Error ? err.message : '获取 Ping 历史失败'
      }
      finally {
        loading.value = false
        pendingRequest = null
      }
    })()

    return pendingRequest
  }

  function startRefresh() {
    if (refreshTimer)
      return

    void fetchRecords()
    refreshTimer = setInterval(() => {
      void fetchRecords()
    }, PING_REFRESH_INTERVAL_MS)
  }

  function stopRefresh() {
    if (!refreshTimer)
      return
    clearInterval(refreshTimer)
    refreshTimer = null
  }

  function retain() {
    subscriberCount.value += 1
    startRefresh()

    let released = false
    return () => {
      if (released)
        return
      released = true
      subscriberCount.value = Math.max(0, subscriberCount.value - 1)
      if (subscriberCount.value === 0)
        stopRefresh()
    }
  }

  function useStats(uuid: () => string, enabled: () => boolean) {
    let stopRetain: (() => void) | null = null

    function releaseRetain() {
      stopRetain?.()
      stopRetain = null
    }

    watch(
      () => enabled() && uuid().trim(),
      (shouldRetain) => {
        if (shouldRetain && !stopRetain) {
          stopRetain = retain()
          return
        }

        if (!shouldRetain)
          releaseRetain()
      },
      { immediate: true },
    )

    onScopeDispose(releaseRetain)

    const stats = computed(() => {
      if (!enabled())
        return createEmptyStats()
      const records = recordsByClient.value.get(uuid()) ?? []
      return records.length ? buildStats(records) : createEmptyStats()
    })

    return {
      stats,
      loading,
      error,
      lastFetchedAt,
    }
  }

  return {
    recordsByClient,
    loading,
    error,
    lastFetchedAt,
    fetchRecords,
    useStats,
  }
})
