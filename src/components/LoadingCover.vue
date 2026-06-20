<template>
  <div class="loading-cover" role="status" aria-live="polite">
    <div class="loading-cover__surface">
      <md-circular-progress indeterminate />
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
}

.loading-cover__surface {
  display: inline-flex;
  align-items: center;
  gap: 14px;
  border: 1px solid var(--md-sys-color-outline-variant);
  border-radius: var(--md-app-card-radius-large);
  padding: 18px 22px;
  color: var(--md-sys-color-on-surface);
  background: var(--md-sys-color-surface-container-high);
  box-shadow: var(--md-app-elevation-1);
  font-size: 14px;
  font-weight: 600;
}
</style>
