<script setup lang="ts">
import { useDebounceFn } from '@vueuse/core'
import { computed, defineAsyncComponent, nextTick, onActivated, onDeactivated, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import MarkdownRenderer from '@/components/MarkdownRenderer.vue'
import { useAppStore } from '@/stores/app'
import { useNodesStore } from '@/stores/nodes'
import { isRegionMatch } from '@/utils/regionHelper'

defineOptions({
  name: 'HomeView',
})

const NodeCard = defineAsyncComponent(() => import('@/components/NodeCard.vue'))
const NodeGeneralCards = defineAsyncComponent(() => import('@/components/NodeGeneralCards.vue'))
const NodeList = defineAsyncComponent(() => import('@/components/NodeList.vue'))

const appStore = useAppStore()
const nodesStore = useNodesStore()
const router = useRouter()

onActivated(() => {
  if (appStore.homeScrollPosition > 0) {
    nextTick(() => {
      window.scrollTo({ top: appStore.homeScrollPosition, behavior: 'instant' })
    })
  }
})

onDeactivated(() => {
  appStore.homeScrollPosition = window.scrollY
})

const searchText = ref('')
const debouncedSearchText = ref('')
const updateDebouncedSearch = useDebounceFn((value: string) => {
  debouncedSearchText.value = value
}, 300)

watch(searchText, (value) => {
  updateDebouncedSearch(value)
})

const groups = computed(() => {
  return [
    {
      tab: '全部节点',
      name: 'all',
    },
    ...nodesStore.groups.map(group => ({
      tab: group,
      name: group,
    })),
  ]
})

const showGroupTabs = computed(() => {
  if (appStore.hideSingleGroupTab && nodesStore.groups.length <= 1) {
    return false
  }
  return true
})

watch(
  () => nodesStore.groups,
  (groups) => {
    const currentGroup = appStore.nodeSelectedGroup
    if (currentGroup !== 'all' && !groups.includes(currentGroup)) {
      appStore.nodeSelectedGroup = 'all'
    }
  },
  { immediate: true },
)

function isNodeMatchSearch(node: typeof nodesStore.nodes[number], search: string): boolean {
  if (!search.trim())
    return true

  const lowerSearch = search.toLowerCase().trim()
  if (node.name.toLowerCase().includes(lowerSearch))
    return true
  if (node.region && isRegionMatch(node.region, search))
    return true
  if (node.os && node.os.toLowerCase().includes(lowerSearch))
    return true
  if (node.group && node.group.toLowerCase().includes(lowerSearch))
    return true
  if (node.tags && node.tags.toLowerCase().includes(lowerSearch))
    return true
  if (node.remark && node.remark.toLowerCase().includes(lowerSearch))
    return true

  return false
}

const nodeList = computed(() => {
  let filteredNodes = appStore.nodeSelectedGroup === 'all'
    ? nodesStore.nodes
    : nodesStore.nodes.filter(node => node.group === appStore.nodeSelectedGroup)

  if (debouncedSearchText.value.trim()) {
    filteredNodes = filteredNodes.filter(node => isNodeMatchSearch(node, debouncedSearchText.value))
  }

  return filteredNodes
})

const alertClass = computed(() => {
  const type = appStore.alertType
  if (type === 'error')
    return 'md-alert--error'
  if (type === 'success')
    return 'md-alert--success'
  if (type === 'warning')
    return 'md-alert--warning'
  return ''
})

function updateSearch(event: Event) {
  searchText.value = (event.target as HTMLInputElement).value
}

function handleNodeClick(node: typeof nodesStore.nodes[number]) {
  router.push({ name: 'instance-detail', params: { id: node.uuid } })
}
</script>

<template>
  <div class="home-view">
    <div v-if="appStore.connectionError" class="home-view__alert-wrap">
      <div class="md-alert md-alert--error">
        <span class="material-symbols-rounded">error</span>
        <div>
          <strong>RPC 服务错误</strong>
          <div>连接服务器失败，请检查网络设置或刷新页面后再试。</div>
        </div>
      </div>
    </div>

    <div v-if="appStore.alertEnabled && appStore.alertContent" class="home-view__alert-wrap">
      <div class="md-alert" :class="alertClass">
        <span class="material-symbols-rounded">campaign</span>
        <div>
          <strong v-if="appStore.alertTitle">{{ appStore.alertTitle }}</strong>
          <MarkdownRenderer :content="appStore.alertContent" />
        </div>
      </div>
    </div>

    <NodeGeneralCards />

    <div class="home-view__divider" />

    <section class="node-info">
      <div class="node-toolbar">
        <label class="node-toolbar__search" aria-label="搜索节点">
          <span class="material-symbols-rounded" aria-hidden="true">search</span>
          <input
            type="search"
            placeholder="搜索节点名称、地区、系统"
            :value="searchText"
            @input="updateSearch"
          >
        </label>

        <div class="md-segmented-control" role="group" aria-label="节点视图">
          <button
            class="md-segmented-control__button"
            :class="{ 'is-active': appStore.nodeViewMode === 'card' }"
            type="button"
            title="卡片视图"
            @click="appStore.nodeViewMode = 'card'"
          >
            <span class="material-symbols-rounded">grid_view</span>
          </button>
          <button
            class="md-segmented-control__button"
            :class="{ 'is-active': appStore.nodeViewMode === 'list' }"
            type="button"
            title="列表视图"
            @click="appStore.nodeViewMode = 'list'"
          >
            <span class="material-symbols-rounded">view_list</span>
          </button>
        </div>
      </div>

      <div v-if="showGroupTabs" class="md-tab-row" aria-label="节点分组">
        <button
          v-for="group in groups"
          :key="group.name"
          class="md-tab-button"
          :class="{ 'is-active': appStore.nodeSelectedGroup === group.name }"
          type="button"
          @click="appStore.nodeSelectedGroup = group.name"
        >
          {{ group.tab }}
        </button>
      </div>

      <div class="nodes">
        <div v-if="nodeList.length !== 0 && appStore.nodeViewMode === 'card'" class="node-card-grid">
          <NodeCard v-for="node in nodeList" :key="node.uuid" :node="node" @click="handleNodeClick(node)" />
        </div>

        <NodeList v-else-if="nodeList.length !== 0 && appStore.nodeViewMode === 'list'" :nodes="nodeList" @click="handleNodeClick" />

        <div v-else class="md-empty">
          <span class="material-symbols-rounded">inbox</span>
          <span>暂无节点</span>
        </div>
      </div>
    </section>
  </div>
</template>

<style scoped lang="scss">
.home-view__alert-wrap {
  padding: 8px 16px;
}

.home-view__divider {
  height: 1px;
  margin: 0 16px;
  background: repeating-linear-gradient(
    to right,
    color-mix(in srgb, var(--md-sys-color-outline-variant) 82%, transparent) 0 8px,
    transparent 8px 14px
  );
}

.node-info {
  display: flex;
  flex-direction: column;
  gap: 14px;
  padding: 16px;
}

.node-toolbar {
  display: flex;
  gap: 10px;
  align-items: center;
}

.node-toolbar__search {
  position: relative;
  display: flex;
  flex: 1;
  min-width: 0;
  height: var(--md-app-control-height);
  align-items: center;
  gap: 10px;
  border: 1px solid var(--md-sys-color-outline);
  border-radius: var(--md-sys-shape-corner-medium);
  padding: 0 14px;
  color: var(--md-sys-color-on-surface-variant);
  background: color-mix(in srgb, var(--md-sys-color-surface-container-low) 86%, transparent);
  transition:
    border-color 160ms ease,
    box-shadow 160ms ease,
    background 160ms ease;

  &:focus-within {
    border-color: var(--md-sys-color-primary);
    box-shadow: 0 0 0 2px color-mix(in srgb, var(--md-sys-color-primary) 18%, transparent);
    color: var(--md-sys-color-primary);
    background: var(--md-sys-color-surface-container-low);
  }

  .material-symbols-rounded {
    flex: 0 0 auto;
    font-size: 22px;
  }

  input {
    width: 100%;
    min-width: 0;
    border: 0;
    outline: 0;
    color: var(--md-sys-color-on-surface);
    background: transparent;
    font: inherit;

    &::placeholder {
      color: var(--md-sys-color-on-surface-variant);
      opacity: 0.78;
    }
  }
}

.node-card-grid {
  display: grid;
  grid-template-columns: repeat(1, minmax(0, 1fr));
  gap: var(--md-app-grid-gap);

  @media (min-width: 640px) {
    grid-template-columns: repeat(auto-fill, minmax(340px, 1fr));
  }
}

@media (max-width: 640px) {
  .node-toolbar {
    align-items: stretch;
  }
}
</style>
