<template>
  <!-- 整张卡片不能包成一个 RouterLink：hero 有两个不同的去处——
       封面与标题去作品详情页，招募 CTA 去 /join。包成一个链接的话 CTA
       就成了假按钮（点它其实跳作品页），而把 CTA 写成嵌套的 <a> 又是非法 HTML。
       所以用 <article> 做容器，各自给出真实的链接。 -->
  <article class="work-hero" :class="{ 'has-cover': coverUrl }">
    <RouterLink v-if="coverUrl" :to="`/works/${work.slug}`" class="work-hero-media">
      <img :src="coverUrl" :alt="work.title" />
    </RouterLink>

    <div class="work-hero-body">
      <div class="work-hero-meta">
        <span class="work-hero-type">{{ typeText }}</span>
        <StatusBadge :status="work.workStatus" :recruiting="Boolean(work.recruiting)" />
      </div>
      <h2 class="work-hero-title">
        <RouterLink :to="`/works/${work.slug}`">{{ work.title }}</RouterLink>
      </h2>
      <p class="work-hero-summary">{{ work.summary }}</p>
      <RouterLink v-if="work.recruiting" to="/join" class="work-hero-cta">
        &gt;&gt; 我们在找人
      </RouterLink>
    </div>
  </article>
</template>

<script setup>
import { computed } from 'vue'
import { RouterLink } from 'vue-router'
import { getStrapiMedia } from '@/composables/strapi'
import { typeLabel } from '@/utils/work'
import StatusBadge from '@/components/work/StatusBadge.vue'

const props = defineProps({
  work: { type: Object, required: true },
})

const coverUrl = computed(() => getStrapiMedia(props.work?.coverImage))
const typeText = computed(() => typeLabel(props.work?.workType))
</script>

<style scoped>
/* 无封面时视觉重量来自排版与留白，不是占位块——
   在制新游戏正是预告态，没有图可看，注意力自然落到状态与 CTA 上。 */
.work-hero {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  padding: 2.5rem 2rem;
  margin: 2rem 0 3rem;
  background: var(--color-box-strong);
  border: 1px solid var(--color-border-soft);
  transition:
    border-color 0.2s ease,
    box-shadow 0.2s ease;
}

.work-hero:hover {
  border-color: var(--color-hover-border);
  box-shadow: 0 0 24px var(--color-box-glow);
}

.work-hero-media img {
  display: block;
  max-width: 100%;
  max-height: 40vh;
  width: auto;
  margin: 0 auto;
}

.work-hero-meta {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  flex-wrap: wrap;
}

.work-hero-type {
  font-family: var(--font-family-mono);
  font-size: 0.85rem;
  color: var(--color-text-subtle);
}

/* 无封面时标题更大，撑住块面 */
.work-hero-title {
  margin: 0;
  font-size: 2rem;
  line-height: 1.3;
}

.work-hero-title a {
  color: var(--color-heading);
  text-decoration: none;
}

.work-hero-title a:hover {
  color: var(--color-accent);
}

.work-hero.has-cover .work-hero-title {
  font-size: 1.6rem;
}

.work-hero-summary {
  margin: 0;
  max-width: 44rem;
  font-size: 1.05rem;
  line-height: 1.8;
  color: var(--color-text-muted);
}

.work-hero-cta {
  align-self: flex-start;
  padding: 0.5rem 1.2rem;
  border: 1px solid var(--color-accent);
  color: var(--color-accent);
  font-family: var(--font-family-mono);
}

/* 移动优先：窄屏纵向堆叠（上方默认值），md 起有封面时左右分栏 */
@screen md {
  .work-hero.has-cover {
    display: grid;
    grid-template-columns: 1fr 1.2fr;
    align-items: center;
    gap: 2.5rem;
  }
}
</style>
