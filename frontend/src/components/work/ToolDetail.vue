<template>
  <section class="detail-block">
    <dl class="detail-facts">
      <template v-if="platforms.length">
        <dt>平台</dt>
        <dd>{{ platforms.join(' / ') }}</dd>
      </template>
      <template v-if="block.currentVersion">
        <dt>当前版本</dt>
        <dd>{{ block.currentVersion }}</dd>
      </template>
      <template v-if="block.license">
        <dt>许可证</dt>
        <dd>{{ block.license }}</dd>
      </template>
    </dl>

    <div class="detail-links">
      <a v-if="block.repoUrl" :href="block.repoUrl" target="_blank" rel="noopener noreferrer">
        &gt;&gt; 仓库
      </a>
      <a v-if="block.homepage" :href="block.homepage" target="_blank" rel="noopener noreferrer">
        &gt;&gt; 项目主页
      </a>
    </div>

    <div v-if="downloads.length" class="detail-downloads">
      <h3 class="detail-subtitle">下载</h3>
      <!-- 多渠道：GitHub 连不上时国内直链是唯一出路，两个都要露出来 -->
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

    <div v-if="block.changelog" class="detail-changelog">
      <h3 class="detail-subtitle">更新日志</h3>
      <div class="markdown-block" v-html="renderedChangelog"></div>
    </div>
  </section>
</template>

<script setup>
import { computed } from 'vue'
import { marked } from 'marked'
import { parsePlatforms } from '@/utils/work'

const props = defineProps({
  block: { type: Object, required: true },
})

const platforms = computed(() => parsePlatforms(props.block?.platforms))
const downloads = computed(() => props.block?.downloads ?? [])
// 站内既有两处（EventDetail、ProductDetail）都用 marked(text) 这种调用形式，
// 不是 marked.parse()。保持一致。
const renderedChangelog = computed(() => marked(props.block?.changelog ?? ''))
</script>

<style scoped src="./detail-shared.css"></style>

<style scoped>
.detail-links {
  display: flex;
  gap: 1rem;
  flex-wrap: wrap;
}

.detail-links a {
  font-family: var(--font-family-mono);
  color: var(--color-accent);
  text-decoration: none;
}

.detail-links a:hover {
  color: var(--color-accent-hover);
}
</style>
