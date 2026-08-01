<template>
  <div class="work-detail-view container">
    <AsyncBoundary
      :loading="loading"
      :error="error"
      :empty="notFound"
      skeleton="text"
      empty-text=">> 找不到这个作品。"
      @retry="refresh"
    >
      <article v-if="work" class="work-detail">
        <header class="page-header">
          <div class="work-detail-meta">
            <span class="work-detail-type">{{ typeText }}</span>
            <StatusBadge :status="work.workStatus" :recruiting="Boolean(work.recruiting)" />
          </div>
          <h1 class="section-title">{{ work.title }}</h1>
          <p class="work-detail-summary">{{ work.summary }}</p>
        </header>

        <img v-if="coverUrl" :src="coverUrl" :alt="work.title" class="work-detail-cover" />

        <!-- 招募位放在正文之前：招人是当前作品页最重要的转化动作。
             守卫只看 recruiting——即使 recruitingRoles 还没填，徽标宣传的
             "招募中"也要有一个真实入口（联系我们），而不是显示徽标却没有
             区块。岗位列表本身单独用 roles.length 兜底为空。 -->
        <section v-if="work.recruiting" class="work-recruiting">
          <h2 class="detail-subtitle">正在招募</h2>
          <ul v-if="roles.length" class="role-list">
            <li v-for="role in roles" :key="role.id ?? role.roleName">
              <strong>{{ role.roleName }}</strong>
              <span v-if="role.count"> × {{ role.count }}</span>
              <p v-if="role.description">{{ role.description }}</p>
            </li>
          </ul>
          <RouterLink to="/join" class="detail-primary-link">&gt;&gt; 联系我们</RouterLink>
        </section>

        <!-- 类型专属区块：类型不匹配或动态区为空时 detailBlock 为 null，整块不渲染 -->
        <component :is="detailComponent" v-if="detailComponent && detailBlock" :block="detailBlock" />

        <ContentBlocks v-if="work.body?.length" :blocks="work.body" />

        <section v-if="staff.length" class="work-staff">
          <h2 class="detail-subtitle">制作名单</h2>
          <ul class="staff-list">
            <li v-for="member in staff" :key="member.id ?? member.name">
              <span class="staff-role">{{ member.role }}</span>
              <span class="staff-name">{{ member.name }}</span>
            </li>
          </ul>
        </section>

        <section v-if="news.length" class="work-news">
          <h2 class="detail-subtitle">开发日志与动态</h2>
          <ul class="news-list">
            <li v-for="item in news" :key="item.id">
              <RouterLink :to="`/news/${item.slug}`">
                <span class="news-date">{{ item.date }}</span>
                <span class="news-title">{{ item.title }}</span>
              </RouterLink>
            </li>
          </ul>
        </section>
      </article>
    </AsyncBoundary>
  </div>
</template>

<script setup>
import { computed, toRef } from 'vue'
import { useRoute, RouterLink } from 'vue-router'
import { getStrapiMedia } from '@/composables/strapi'
import { useWorkBySlug, useWorkNews } from '@/composables/useWorks'
import { resolveDetailBlock, typeLabel } from '@/utils/work'
import AsyncBoundary from '@/components/AsyncBoundary.vue'
import StatusBadge from '@/components/work/StatusBadge.vue'
import ContentBlocks from '@/components/work/ContentBlocks.vue'
import GameDetail from '@/components/work/GameDetail.vue'
import ToolDetail from '@/components/work/ToolDetail.vue'
import SiteDetail from '@/components/work/SiteDetail.vue'
import PublicationDetail from '@/components/work/PublicationDetail.vue'

const route = useRoute()
const slug = toRef(() => route.params.slug)

const { data: work, loading, error, notFound, refresh } = useWorkBySlug(slug)
const { data: newsData } = useWorkNews(slug)

const coverUrl = computed(() => getStrapiMedia(work.value?.coverImage))
const typeText = computed(() => typeLabel(work.value?.workType))
const roles = computed(() => work.value?.recruitingRoles ?? [])
const staff = computed(() => work.value?.staff ?? [])
const news = computed(() => newsData.value ?? [])

const detailBlock = computed(() =>
  resolveDetailBlock(work.value?.details, work.value?.workType),
)

const DETAIL_COMPONENTS = {
  game: GameDetail,
  tool: ToolDetail,
  site: SiteDetail,
  publication: PublicationDetail,
}

const detailComponent = computed(() => DETAIL_COMPONENTS[work.value?.workType] ?? null)
</script>

<style scoped src="../components/work/detail-shared.css"></style>

<style scoped>
.work-detail-meta {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  flex-wrap: wrap;
  margin-bottom: 0.75rem;
}

.work-detail-type {
  font-family: var(--font-family-mono);
  font-size: 0.85rem;
  color: var(--color-text-subtle);
}

.work-detail-summary {
  color: var(--color-text-muted);
  font-size: 1.05rem;
  line-height: 1.8;
  max-width: 46rem;
}

/* 封面按自身比例缩放并限高，横竖版都成立。
   原来是 width: 100% 无限高——csd20 的封面是 1131×1600 的竖版海报，
   在 1400px 视口下会渲染成近 2000px 高，要滚三屏才看得到正文。
   改成限高 + 宽度自适应 + 居中，横版封面照常占满宽度。 */
.work-detail-cover {
  display: block;
  max-width: 100%;
  max-height: 70vh;
  width: auto;
  margin: 0 auto 2rem;
  border: 1px solid var(--color-border-soft);
}

/* 详情页的小标题比区块内的略大一号，覆盖共用文件里的 1rem */
.detail-subtitle {
  font-size: 1.1rem;
}

.work-recruiting,
.work-staff,
.work-news {
  margin: 2.5rem 0;
}

.role-list,
.staff-list,
.news-list {
  list-style: none;
  padding: 0;
  margin: 0 0 1rem;
}

.role-list li {
  padding: 0.75rem 0;
  border-bottom: 1px solid var(--color-border-soft);
}

.role-list p {
  margin: 0.35rem 0 0;
  color: var(--color-text-muted);
  font-size: 0.92rem;
}

.staff-list li {
  display: flex;
  gap: 1rem;
  padding: 0.35rem 0;
}

.staff-role {
  min-width: 8rem;
  color: var(--color-text-subtle);
  font-family: var(--font-family-mono);
  font-size: 0.85rem;
}

.news-list li {
  padding: 0.5rem 0;
  border-bottom: 1px solid var(--color-border-soft);
}

.news-list a {
  display: flex;
  gap: 1rem;
  color: var(--color-text);
  text-decoration: none;
}

.news-list a:hover {
  color: var(--color-accent);
}

.news-date {
  min-width: 7rem;
  color: var(--color-text-subtle);
  font-family: var(--font-family-mono);
  font-size: 0.85rem;
}
</style>
