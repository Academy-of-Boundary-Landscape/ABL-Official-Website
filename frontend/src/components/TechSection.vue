<template>
  <section :class="['tech-box', 'tech-section', customClass]">
    <header v-if="title || $slots.header" class="tech-section__header">
      <slot name="header">
        <span v-if="showDot" class="tech-section__dot"></span>
        <h2 class="tech-section__title">{{ title }}</h2>
      </slot>
    </header>
    <div class="tech-section__body">
      <slot />
    </div>
  </section>
</template>

<script setup>
defineProps({
  title: {
    type: String,
    default: '',
  },
  showDot: {
    type: Boolean,
    default: true,
  },
  customClass: {
    type: String,
    default: '',
  },
})
</script>

<style scoped>
.tech-section__header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 12px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.06);
  padding-bottom: 6px;
}

.tech-section__title {
  margin: 0;
  font-size: 0.9rem;
  font-weight: 600;
  color: var(--color-heading);
  text-transform: uppercase;
  letter-spacing: 1px;
}

.tech-section__dot {
  width: 6px;
  height: 6px;
  background-color: rgba(255, 255, 255, 0.9);
  display: inline-block;
}
</style>
