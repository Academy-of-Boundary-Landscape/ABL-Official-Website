<!-- src/components/CategoryFilter.vue -->
<template>
  <div class="custom-select" ref="selectWrapper">
    <!-- 这是用户看到的、始终显示的触发器 -->
    <button @click="toggleDropdown" class="select-trigger">
      <span>{{ modelValue }}</span>
      <svg :class="{ 'is-open': isOpen }" class="arrow-icon" viewBox="0 0 24 24">
        <path d="M7 10l5 5 5-5z"></path>
      </svg>
    </button>

    <!-- 这是点击后出现的选项列表 -->
    <transition name="fade">
      <ul v-if="isOpen" class="select-options">
        <li
          v-for="category in categories"
          :key="category"
          @click="selectOption(category)"
          class="select-option"
          :class="{ active: modelValue === category }"
        >
          {{ category }}
        </li>
      </ul>
    </transition>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue';

// 使用 props 和 emits 来支持 v-model
const props = defineProps({
  categories: { type: Array, required: true },
  modelValue: { type: String, required: true } // 对应 v-model 的值
});
const emit = defineEmits(['update:modelValue']);

const isOpen = ref(false);
const selectWrapper = ref(null);

const toggleDropdown = () => {
  isOpen.value = !isOpen.value;
};

const selectOption = (category) => {
  emit('update:modelValue', category); // 发射事件，更新父组件的状态
  isOpen.value = false; // 选择后关闭下拉菜单
};

// --- 点击外部关闭下拉菜单的逻辑 ---
const handleClickOutside = (event) => {
  if (selectWrapper.value && !selectWrapper.value.contains(event.target)) {
    isOpen.value = false;
  }
};

onMounted(() => {
  document.addEventListener('click', handleClickOutside);
});

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside);
});
</script>

<style scoped>
.custom-select {
  position: relative;
  min-width: 200px; /* 下拉菜单的最小宽度 */
  width: fit-content;
}


.select-trigger {
  width: 100%;
  padding: 0.6rem 1rem;
  background-color: var(--color-background);
  border: 1px solid var(--color-border);
  color: var(--color-text);
  font-size: 1rem;
  cursor: pointer;
  display: flex;
  justify-content: space-between;
  align-items: center;
  transition: border-color 0.2s ease;
}

.select-trigger:hover {
  border-color: var(--color-accent);
}

.arrow-icon {
  width: 24px;
  height: 24px;
  fill: var(--color-text);
  transition: transform 0.3s ease;
}

.arrow-icon.is-open {
  transform: rotate(180deg);
}

.select-options {
    position: absolute;
    top: calc(100% + 5px);
    left: 0;
    right: 0;
    background-color: var(--color-background-soft);
    /* 增加不透明度，确保背景完全不透明 */
    background-color: var(--color-background-soft, #000000);
    opacity: 1;
    /* 使用 box-shadow 增强遮挡感 */
    box-shadow: 0 4px 16px rgba(0,0,0,0.15), 0 0 0 1px var(--color-border);
    border: 1px solid var(--color-border);
    list-style: none;
    padding: 0.5rem 0;
    margin: 0;
    z-index: 1000; /* 提高层级，确保遮挡 */
    max-height: 200px;
    overflow-y: auto;
}

.select-option {
  padding: 0.75rem 1rem;
  cursor: pointer;
  transition: background-color 0.2s ease;
}

.select-option:hover {
  background-color: rgba(var(--color-accent-rgb), 0.1);
}

.select-option.active {
  background-color: var(--color-accent);
  color: var(--color-background);
}

/* 过渡动画 */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease, transform 0.2s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
  transform: translateY(-10px);
}
</style>