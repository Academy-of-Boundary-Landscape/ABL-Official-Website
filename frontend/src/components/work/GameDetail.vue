<template>
  <section class="detail-block">
    <dl class="detail-facts">
      <template v-if="platforms.length">
        <dt>平台</dt>
        <dd>{{ platforms.join(' / ') }}</dd>
      </template>
      <template v-if="block.basedOn">
        <dt>基于</dt>
        <dd>{{ block.basedOn }}</dd>
      </template>
      <template v-if="block.engine">
        <dt>引擎</dt>
        <dd>{{ block.engine }}</dd>
      </template>
    </dl>

    <a
      v-if="block.trailerUrl"
      :href="block.trailerUrl"
      class="detail-trailer"
      target="_blank"
      rel="noopener noreferrer"
    >
      &gt;&gt; 观看 PV
    </a>

    <div v-if="screenshots.length" class="detail-screenshots">
      <h3 class="detail-subtitle">截图</h3>
      <div class="screenshot-grid">
        <img
          v-for="shot in screenshots"
          :key="shot.id"
          :src="urlOf(shot)"
          :alt="shot.alternativeText || '游戏截图'"
          loading="lazy"
        />
      </div>
    </div>

    <div v-if="downloads.length" class="detail-downloads">
      <h3 class="detail-subtitle">下载</h3>
      <a
        v-for="channel in downloads"
        :key="channel.id ?? channel.url"
        :href="channel.url"
        class="download-channel"
        target="_blank"
        rel="noopener noreferrer"
      >
        {{ channel.channelName }}
      </a>
    </div>
  </section>
</template>

<script setup>
import { computed } from 'vue'
import { getStrapiMedia } from '@/composables/strapi'
import { parsePlatforms } from '@/utils/work'

const props = defineProps({
  block: { type: Object, required: true },
})

const platforms = computed(() => parsePlatforms(props.block?.platforms))
const screenshots = computed(() => props.block?.screenshots ?? [])
const downloads = computed(() => props.block?.downloads ?? [])
const urlOf = (shot) => getStrapiMedia(shot)
</script>

<style scoped src="./detail-shared.css"></style>

<style scoped>
.detail-trailer {
  align-self: flex-start;
  font-family: var(--font-family-mono);
  color: var(--color-accent);
  text-decoration: none;
}

.screenshot-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 1rem;
}

.screenshot-grid img {
  width: 100%;
  display: block;
  border: 1px solid var(--color-border-soft);
}

/* 移动优先：窄屏单列，md 起两列 */
@screen md {
  .screenshot-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}
</style>
