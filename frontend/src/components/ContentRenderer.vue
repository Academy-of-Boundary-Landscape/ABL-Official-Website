<!-- src/components/ContentRenderer.vue -->
<template>
  <div class="content-renderer">
    <!-- 遍历从API获取的 content 数组 -->
    <template v-for="(block, index) in content" :key="index">
      
      <!-- 如果是段落 (paragraph) -->
      <p v-if="block.type === 'paragraph'">
        <template v-for="(child, childIndex) in block.children" :key="childIndex">
          <span :class="getInlineStyles(child)">{{ child.text }}</span>
        </template>
      </p>

      <!-- 如果是标题 (heading) -->
      <component v-if="block.type === 'heading'" :is="`h${block.level}`">
        <template v-for="(child, childIndex) in block.children" :key="childIndex">
          <span :class="getInlineStyles(child)">{{ child.text }}</span>
        </template>
      </component>

      <!-- 
        ↓↓↓ 核心逻辑：如果是我们自定义的组件 ↓↓↓
      -->
      <div v-if="block.type === 'component' && block.component === 'default.product-embed'" class="embedded-product">
        <!-- 
          直接在这里使用 ProductCard 组件！
          注意：我们需要确保关联的制品数据已经被 populate 了。
        -->
        <ProductCard v-if="block.product" :product="block.product" />
      </div>

      <!-- 在这里可以继续添加对其他块类型（如 list, image 等）的处理 -->

    </template>
  </div>
</template>

<script setup>
import ProductCard from '@/components/ProductCard.vue'; // 引入 ProductCard

defineProps({
  content: {
    type: Array,
    required: true,
    default: () => []
  }
});

// 辅助函数，用于处理加粗、斜体等内联样式
const getInlineStyles = (child) => {
  return {
    'font-bold': child.bold,
    'italic': child.italic,
    'underline': child.underline,
    'line-through': child.strikethrough
  };
};
</script>

<style scoped>
.content-renderer {
  line-height: 1.8;
}
.embedded-product {
  /* 为嵌入的卡片提供一些垂直间距 */
  margin: 2rem 0;
  /* (可选) 让它稍微不那么宽，以嵌入在文本中 */
  max-width: 400px; 
}
/* 简单的内联样式 */
.font-bold { font-weight: bold; }
.italic { font-style: italic; }
.underline { text-decoration: underline; }
.line-through { text-decoration: line-through; }
</style>