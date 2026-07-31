<template>
  <div class="content-blocks">
    <div v-for="(block, index) in blocks" :key="index">
      <div
        v-if="block.__component === 'content-block.content-block'"
        class="markdown-block"
        v-html="renderMarkdown(block.contentMd)"
      ></div>

      <div v-else-if="block.__component === 'embedding.link-embed'" class="link-embed-block">
        <a :href="block.linkContent" target="_blank" rel="noopener noreferrer" class="external-link">
          {{ block.linkName || block.linkContent }}
        </a>
      </div>

      <div v-else-if="block.__component === 'embedding.iframe-embed'" class="iframe-embed-block">
        <iframe
          :src="block.iframeContent"
          frameborder="0"
          class="embedded-iframe"
          allowfullscreen
        ></iframe>
      </div>

      <div
        v-else-if="block.__component === 'embedding.file-embed' && block.File?.length"
        class="file-embed-block"
      >
        <a
          :href="fileUrl(block.File[0])"
          :download="block.FileName || block.File[0].name || '下载文件'"
          class="external-link"
        >
          {{ block.FileName || block.File[0].name || '下载文件' }}
        </a>
      </div>

      <div
        v-else-if="block.__component === 'embedding.audio-embed' && block.audioFile"
        class="audio-embed-block"
      >
        <p v-if="block.trackName" class="audio-track-name">{{ block.trackName }}</p>
        <audio :src="fileUrl(block.audioFile)" controls preload="none"></audio>
      </div>
    </div>
  </div>
</template>

<script setup>
import { marked } from 'marked'
import { getStrapiMedia } from '@/composables/strapi'

defineProps({
  blocks: { type: Array, default: () => [] },
})

// 与 EventDetail.vue 一致：marked(text)，不是 marked.parse(text)
const renderMarkdown = (markdownText) => marked(markdownText || '')
const fileUrl = (file) => getStrapiMedia(file)
</script>

<style scoped src="./detail-shared.css"></style>

<style scoped>
.content-blocks {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  margin: 2rem 0;
}

.embedded-iframe {
  width: 100%;
  aspect-ratio: 16 / 9;
  border: 1px solid var(--color-border-soft);
}

.audio-embed-block {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.audio-track-name {
  margin: 0;
  font-family: var(--font-family-mono);
  font-size: 0.9rem;
  color: var(--color-text-subtle);
}

/* preload="none"：8.5MB 的主题曲不能在页面打开时就开始下载 */
.audio-embed-block audio {
  width: 100%;
}
</style>
