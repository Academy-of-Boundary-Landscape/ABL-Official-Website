<!-- src/components/CategoryFilter.vue -->
<template>
  <n-select
    v-model:value="selectedCategory"
    :options="categoryOptions"
    placeholder="选择分类"
    size="large"
    clearable
    @update:value="handleUpdate"
  />
</template>

<script setup>
import { computed } from 'vue'
import { NSelect } from 'naive-ui'

const props = defineProps({
  categories: {
    type: Array,
    required: true,
  },
  modelValue: {
    type: String,
    default: '',
  },
})

const emit = defineEmits(['update:modelValue'])

// 将分类数组转换为 n-select 需要的 options 格式
const categoryOptions = computed(() => {
  return props.categories.map((category) => ({
    label: category,
    value: category,
  }))
})

const selectedCategory = computed({
  get: () => props.modelValue,
  set: (value) => {
    emit('update:modelValue', value)
  },
})

const handleUpdate = (value) => {
  emit('update:modelValue', value)
}
</script>

<style scoped>
/* Naive UI 样式已经通过主题配置 */
</style>
