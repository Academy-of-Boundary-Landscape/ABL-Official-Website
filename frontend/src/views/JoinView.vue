<template>
  <div class="join-view container">
    <section class="page-header">
      <h1 class="section-title">加入我们 // Join</h1>
    </section>

    <AsyncBoundary
      :loading="loading"
      :error="error"
      :empty="notFound"
      skeleton="text"
      empty-text=">> 招募信息尚未录入。"
      @retry="refresh"
    >
      <ContentBlocks v-if="blocks.length" :blocks="blocks" />
    </AsyncBoundary>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import AsyncBoundary from '@/components/AsyncBoundary.vue'
import ContentBlocks from '@/components/work/ContentBlocks.vue'
import { usePageBySlug } from '@/composables/usePages'

const { data: page, loading, error, notFound, refresh } = usePageBySlug('join')
const blocks = computed(() => page.value?.body ?? [])
</script>
