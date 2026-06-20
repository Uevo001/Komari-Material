<template>
  <div class="loading-cover" role="status" aria-live="polite">
    <div class="loading-cover__surface">
      <div class="md-spinner" />
      <span>Loading...</span>
    </div>
  </div>
</template>

<style scoped lang="scss">
.loading-cover {
  position: absolute;
  inset: 0;
  z-index: 30;
  display: flex;
  width: 100vw;
  height: 100vh;
  align-items: center;
  justify-content: center;
  background: color-mix(in srgb, var(--md-sys-color-background) 82%, transparent);
  backdrop-filter: blur(12px);
}

.loading-cover__surface {
  display: inline-flex;
  align-items: center;
  gap: 14px;
  border: 1px solid var(--md-sys-color-outline-variant);
  border-radius: 24px;
  padding: 18px 22px;
  color: var(--md-sys-color-on-surface);
  background: var(--md-sys-color-surface-container-high);
  box-shadow: var(--md-app-elevation-2);
  font-size: 14px;
  font-weight: 600;
}
</style>
