<template>
  <TechSection title="友情链接 / LINKS">
    <ul class="friend-list">
      <li v-for="link in links" :key="link.url">
        <a :href="link.url" target="_blank" rel="noopener noreferrer" class="friend-link">
          <!-- 站名与域名包一层：窄屏换行时域名缩进对齐站名，而不是顶到
               最左边与 >> 前缀齐平——那样会把前缀的层级感打散。 -->
          <span class="friend-body">
            <span class="friend-name">{{ link.name }}</span>
            <span class="friend-host">{{ link.host }}</span>
          </span>
        </a>
      </li>
    </ul>
  </TechSection>
</template>

<script setup>
import TechSection from '@/components/TechSection.vue'

// 硬编码而非走 CMS：目前只有一条，且友链变动频率约等于零。
// 为一条链接新建 content type 太重；塞进 page:home 的 link-embed 则拿不到
// 独立区块的视觉处理。加第二条的成本是往下面这个数组里加一行 + 发一次版。
//
// 措辞刻意只留站名与域名，不写介绍：两个组织名义上是分开的，
// 正文里任何"同一批人"式的说明都会把它们绑到一起。
const links = [
  {
    name: '东方幻想指南',
    host: 'fantasyguide.cn',
    url: 'https://fantasyguide.cn/',
  },
]
</script>

<style scoped>
.friend-list {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

/* >> 前缀与 HomeView 的 .section-more-link、WorkDetail 的入口链接同一套终端风 */
.friend-link {
  display: inline-flex;
  align-items: baseline;
  gap: 0.75rem;
  font-family: var(--font-family-mono);
  font-size: 0.9rem;
  color: var(--color-text);
  text-decoration: none;
}

.friend-link::before {
  content: '>>';
  color: var(--color-accent);
  flex-shrink: 0;
}

.friend-body {
  display: inline-flex;
  align-items: baseline;
  gap: 0.75rem;
  flex-wrap: wrap;
}

.friend-link:hover {
  color: var(--color-accent);
}

.friend-link:hover .friend-name {
  text-decoration: underline;
}

.friend-host {
  color: var(--color-text-subtle);
  font-size: 0.85rem;
}
</style>
