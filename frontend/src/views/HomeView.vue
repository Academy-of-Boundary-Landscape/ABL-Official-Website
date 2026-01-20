<template>
  <div class="home-view container">
    <section class="page-header">
      <!-- ↓↓↓ 新增的div容器，用于包裹标题和副标题 ↓↓↓ -->
      <div class="header-content">
        <h1 class="title">境界景观学会</h1>
        <p class="subtitle">In search of the vacua where phantasm resides.</p>
      </div>
    </section>

    <!-- 
      ↓↓↓ 新增：最近事件展示区 ↓↓↓
    -->
    <section v-if="recentEvents.length > 0" class="tech-box recent-events-section">
      <h2 class="box-title">最新动态</h2>
      <div class="events-convention-layout">
        <!-- 左侧：事件列表 (EventList) -->
        <div class="events-list">
          <EventCard 
            v-for="event in recentEvents" 
            :key="event.id" 
            :event="event" 
          />
        </div>

        <!-- 右侧，用于显示接下来三场未进行的展会 -->
        <aside class="convention-data-box tech-box">
          <h3 class="box-title">最近展会</h3>
          <div v-if="upcomingConventions.length > 0" class="convention-list">
            <div v-for="convention in upcomingConventions" :key="convention.id" class="convention-item">
              <h4>{{ convention.name }}</h4>
              <p><strong>日期:</strong> {{ convention.date }}</p>
              <p>qq群号:{{ convention.qqgroup }}</p>
            </div>
          </div>
          <p v-else>暂无即将参加的展会。</p>
        </aside>
      </div>
    </section>

    <!-- 
      ↓↓↓ 主内容与侧边栏的两栏布局 ↓↓↓
    -->
    <div class="main-layout">
      <!-- 左侧：最新制品 -->
      <aside class="sidebar">
        <div class="tech-box">
          <h2 class="box-title">最新制品</h2>
          <div v-if="recentProducts.length > 0" class="products-list">
            <ProductCard 
              v-for="product in recentProducts" 
              :key="product.id" 
              :product="product" 
            />
          </div>
          <p v-else>暂无新品发布。</p>
        </div>
      </aside>

      <!-- 右侧：主内容区 -->
      <main class="main-content">
        <div class="tech-box">
            <h1>基本介绍</h1>
            <p> 境界景观学会 是一个秘封组(广义)中心的东方project同人社团，现主催是Renko_1055，创立于2025年8月8日。</p>
            <p>我们打算让创作者们结合自己的专业本领，并且去积极学习和研究，探索新奇而有趣的同人创作形式，并把它们以不同的"项目"为单位进行推进，来做出给同好们带来快乐的作品。</p>
            <p>很显然，社团官网也是一个项目之一</p>
        </div>
        <hr class="divider">
        <div class="tech-box">
            <h1>联系我们</h1>
            <p> qq交流群: 748966747</p>
            <p> 社团邮箱：contact@secret-sealing.club</p> 
        </div>
        <hr class="divider">

        <div class="tech-box">
          <h2>社团设定</h2>
          <p>这是一段中二的故事设定,没有现实意义</p>
          <p>
            "境界景观学会"是一个多元宇宙的研究实体，该组织由无数多元宇宙时间线中的“宇佐见莲子”与“玛艾露贝莉·赫恩”构成。并试图对"境界"这个物理对象进行研究。
            在各自的世界中，她们对“结界”的另一侧抱有强烈的好奇心；而当这种探索欲跨越了单一宇宙的限制后，一个终极的疑问便浮现出来：支配所有世界诞生与分化的元规律，究竟为何物？
        </p>
          <p>
          我们的核心理论，是建立在弦理论“弦景观”（String Landscape）假说之上延伸而出的<strong>“境界景观”（Boundary Landscape）</strong>假说。在弦理论中，额外的维度被卷曲在微小的Calabi-Yau流形中，其不同的几何构型决定了我们宇宙的基本物理常数。
          我们在研究中各自独立地发现：<strong>“境界”本身，就是一种独立于时空的、全新的物理自由度。</strong> 正如“弦景观”中存在着海量的真空构型一样，“境界”这一自由度也拥有近乎无限的、被称为“境界真空”的稳定状态。每一种“境界真空构型”（Boundary Vacuum Configuration）都对应着一个具有独特性质的平行宇宙。例如，在某个真空态中，“幻想”作为一种物理实在是被允许存在的，这便构成了“幻想乡”；而在另一个真空态中，它则被严格的物理法则所抑制，这便是“外界”。
          </p>
          <p>
            在此理论框架下，诸如“博丽大结界”之类的“结界”，不再是单纯的分割两物“墙壁”，而是连接不同“境界真空”的<strong>“瞬子解”（Instanton Solution）</strong>
            基于这个理论，我们开始了对境界的研究、观测和干涉，最终各自实现了“穿梭”，来到了其他“临近”的多元宇宙之中，而在长时间的独立探索之后，我们意识到了其他宇宙中存在彼此的可能性。
          </p>
          <p>
            本学会由此诞生。来自不同多元宇宙的秘封组将联合起来，我们不再满足于对“境界”的观测，而是致力于构建它作为物理对象的系统性理论，并最终对不可计数的境界“景观结构”进行研究。
          </p>
        </div>
      </main>
    </div>

    <div style="height: 40px;"></div> 
    <section class="tech-box">
      <h2 class="box-title">社团线上项目展示(不久后会更新)</h2>
      <ProjectsBar /> 
    </section>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { apiClient } from '@/composables/strapi';
import ProjectsBar from '@/components/ProjectsBar.vue'; 
import ProductCard from '@/components/ProductCard.vue';
import EventCard from '@/components/EventCard.vue';

const recentProducts = ref([]);
const recentEvents = ref([]);
const upcomingConventions = ref([]);

const fetchRecentData = async () => {
  // 获取今天的日期字符串（格式：YYYY-MM-DD）
  const today = new Date().toISOString().slice(0, 10);

  try {
    const [productsResponse, eventsResponse,conventionResponse] = await Promise.all([
      apiClient.get('/products', {
        params: {
          sort: 'releaseDate:desc',
          'pagination[limit]': 3,
          populate: 'coverImage'
        }
      }),
      apiClient.get('/events', {
        params: {
          sort: 'date:desc',
          'pagination[limit]': 3,
          populate: 'coverImage'
        }
      }),
      apiClient.get('/conventions', { // API端点修改为 /conventions
        params: {
          // 按日期升序排序，这样最近的就在最前面
          sort: 'date:asc',
          // 添加筛选条件：日期(date) 大于等于($gte) 今天(today)
          'filters[date][$gte]': today,
          // 限制最多返回3条记录
          'pagination[limit]': 3,
        }
      })
    ]);

    recentProducts.value = productsResponse.data.data || productsResponse.data;
    recentEvents.value = eventsResponse.data.data || eventsResponse.data;
    upcomingConventions.value = conventionResponse.data.data || [];


  } catch (error) {
    console.error("无法获取主页动态数据:", error);
  }
};

onMounted(fetchRecentData);
</script>
<style scoped>
/* ==========================================================================
   1. Page Header (关键修改：嵌套Flexbox布局)
   ========================================================================== */

/* --- 外部容器：负责 “横线 - 内容 - 横线” 的水平布局 --- */
.page-header {
  display: flex;
  align-items: center; /* 垂直居中线条和内容块 */
  gap: 1rem;           /* 在线条和内容块之间创建间距 */
  margin: 60px 0 80px;
}

/* 使用伪元素创建左右的线条 */
.page-header::before,
.page-header::after {
  content: '';
  flex-grow: 1; /* 让线条自动填充所有可用空间 */
  height: 3px;
  background-color: var(--color-accent);
  border-radius: 1px;
}

/* --- 内部容器：负责 “标题在上，副标题在下” 的垂直布局 --- */
.header-content {
  display: flex;
  flex-direction: column; /* 让标题和副标题垂直堆叠 */
  align-items: center;   /* 确保它们自身也水平居中 */
  flex-shrink: 0;        /* 防止标题过长时被压缩 */
}

.page-header .title {
  font-size: 3.5rem;
  margin-bottom: 0.75rem; /* 主标题与副标题的间距 */
  /* 移除了下划线，以避免与左右的横线冲突，让视觉更干净 */
}

.page-header .subtitle {
  font-size: 1.1rem;
  color: var(--color-text);
  white-space: nowrap; /* 防止副标题换行 */
}


/* ==========================================================================
   2. Layout & Components (其余样式保持一致)
   ========================================================================== */

/* --- 布局和组件微调 --- */
.tech-box {
  margin-top: 20px;
}

.events-list {
  display: grid;
  gap: 0.4 rem;
}

.events-convention-layout {
  display: grid;
  grid-template-columns: 3fr 1fr; 
  gap: 20px; 
  align-items: start; 
}

.convention-data-box {
  padding: 1.5rem;
  margin-top: 0;
}

.convention-data-box .box-title {
  margin-top: 0;
  font-size: 1.2rem;
}

.convention-item:not(:last-child) {
  margin-bottom: 1rem;
  padding-bottom: 1rem;
  border-bottom: 1px solid var(--color-accent); 
}

.convention-item h4 {
  margin-bottom: 0.25rem;
}

/* --- 主要内容区域的两栏布局 --- */
.main-layout {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(0, 2.5fr);
  gap: 40px;
  margin-top: 40px;
}

.sidebar .products-list {
  display: grid;
  gap: 1.5rem;
}

/* ==========================================================================
   3. Responsive Design
   ========================================================================== */
@media (max-width: 992px) {
  .main-layout,
  .events-convention-layout {
    grid-template-columns: 1fr;
  }

  .page-header {
    gap: 1rem;
  }
}
</style>