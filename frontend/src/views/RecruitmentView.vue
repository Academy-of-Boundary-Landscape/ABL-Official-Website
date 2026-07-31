<!-- src/views/RecruitmentView.vue -->
<template>
  <div class="recruitment-view container">
    <section class="page-header">
      <div class="header-content">
        <h1 class="title">// 加入我们</h1>
        <p class="subtitle">社团刚刚建立不久，我们很需要有专业技能的同好加入我们！</p>

        <div class="intro tech-box">
          <h2 class="intro-title">我们是怎样的社团？</h2>
          <p class="intro-text">
            我们不太类似于用艺术资源设计亚克力周边去跑展会的传统同人社团，更类似一些技术宅组成的小工作室。
            我们更希望能把同好们的设想(脑洞)使用技术手段做成能够实际上线、实际运行的有趣作品。
          </p>
          <p class="intro-text">
            另外，我们的很多制品略微偏<b>面向 B 端用户</b>：即其他同人社团同行和展会主办/工作人员。
            比如<b>出摊用的软件工具</b>、<b>展会现场的互动游戏/答题系统</b>。我们希望能通过实用的工具和系统，为同人创作搭建“基础设施”。
          </p>
          <p class="intro-text">
            我们不苛求你是科班出身的传统程序员。在2026年，大语言模型让我们入门一个技术变得前所未有地简单。
            只要你对创作富有热情，并肯积极学习和动手，我们欢迎你加入我们一起把想法变成现实。
          </p>
          <p class="intro-text">
            目前社团的创作主要有三条长期路线：<b>网站（社团主页和线上活动平台）</b>、<b>软件（工具软件与APP）</b>、以及<b
              >独立游戏（Godot开发的小游戏）</b
            >
          </p>
        </div>
      </div>
    </section>

    <div v-for="job in jobOpenings" :key="job.title" class="job-card tech-box">
      <div class="job-title-row">
        <h2>{{ job.title }}</h2>
        <span v-if="job.tag" class="job-tag">{{ job.tag }}</span>
      </div>

      <p class="description">{{ job.description }}</p>

      <h3>推荐需求:</h3>
      <ul>
        <li v-for="requirement in job.requirements" :key="requirement">{{ requirement }}</li>
      </ul>

      <div v-if="job.notes?.length" class="job-notes">
        <div class="job-notes-title">我们很欢迎：</div>
        <ul>
          <li v-for="note in job.notes" :key="note">{{ note }}</li>
        </ul>
      </div>
    </div>

    <div class="contact-section tech-box">
      <h2 class="box-title">申请渠道</h2>
      <p class="contact-text">
        确定申请意向后，请将相关信息发送至：<br />
        <a href="mailto:contact@abl.secret-sealing.club">contact@abl.secret-sealing.club</a>
      </p>

      <div class="apply-hint">
        <h3>邮件里建议包含</h3>
        <ul>
          <li>你想加入的方向（网站 / APP / LLM&Agent / Godot / 美术 / 出摊协作）</li>
          <li>你的作品或证明（Repo / Demo 链接 / 截图 / 过往项目说明；没有也可以写你想做什么）</li>
          <li>你的 QQ 联系方式（以及可选：每周大概可投入时间）</li>
        </ul>
      </div>

      <p class="contact-footnote">
        我们一般会在一周内回复（如果没回，可能是邮件进垃圾箱了，也欢迎再戳一次）。
      </p>
    </div>
  </div>
</template>

<script setup>
const jobOpenings = [
  {
    title: '职位：画师',
    tag: '视觉资产',
    description: '任务：负责社团作品的插图、封面、人设等视觉模块构建。',
    requirements: [
      '会画常见二次元画风角色，并能稳定产出多数角色的常规姿势/表情差分',
      '画风相对稳定，完成度在线（不要求顶级，但不要“雷到观众当场退摊”）',
      '愿意与文案/策划/程序协作，根据项目需要提供美术资源与修改',
      '申请时请附代表作品（链接或附件；有同人作品更好）',
    ],
    notes: ['我们最缺的就是艺术资源！(毕竟我们目前都是一群理工专业的技术宅)'],
  },
  {
    title: '职位：程序（Web / App开发）',
    tag: '工程主力',
    description:
      '任务：参与社团网站与线上互动活动开发，或开发同人工具 App。我们更看重快速实现技术原型并迭代的能力。',
    requirements: [
      '符合我们的技术栈：',
      '网站开发我们常用标准的Vue + FastAPI',
      '软件开发我们主要用Tauri框架(Vue前端+Rust后端), 但后端Rust逻辑一般不复杂, 大模型足以胜任。',
      '有基本的编程能力，能写出可以跑的代码',
      '熟悉 Git 基本流程，愿意和其他成员进行合作',
    ],
    notes: [
      '同人圈不一定能遇到“科班出身”的专家，我们更欢迎：愿意自学、愿意动手、愿意把小东西做上线的同好',
    ],
  },

  {
    title: '职位：程序（LLM相关）',
    tag: '技术探索',
    description: '任务：参与开发已有的LLM相关项目，并有兴趣构思基于LLM的同人作品应用。',
    requirements: [
      '对大语言模型与 Agent 开发很感兴趣，至少会调API.',
      '能有一些有趣的，基于LLM应用的idea，我们很希望能结合大语言模型做出更有趣的同人制品',
      '有基本的工程能力，能构思系统架构、技术路线，并搓出一个能跑起来的demo等等',
      '例如一个实时的摊位导购、一个东方一设知识专家系统、通用的桌游主持人等',
    ],
    notes: [
      '我们现在正在迭代一个一设知识的专家系统，它目前部署在qq机器人上面用来给活动的一设问答环节当外挂。',
    ],
  },
  {
    title: '职位：*出摊合作者',
    tag: '展会战力',
    description: '任务：展会出摊时协助布摊、看摊、补货与收摊；无需进行其他长期工作。',
    requirements: [
      '有人类水平的智力与动手能力，能按清单一步步完成布摊与出摊任务',
      '因为我们开发了辅助软件，只需要在屏幕上点点点（像模拟经营游戏），其它统计和记录完全自动化',
      '体力靠谱：能搬箱子、能坐牢一天、腿脚勤快（电音环节能撑住更是高人）',
      '能基本沟通：遇到问题会及时反馈，不要林场消失',
    ],
  },
]
</script>

<style scoped>
.recruitment-view {
  padding-bottom: 48px;
}

.recruitment-view .page-header {
  margin-bottom: 2.2rem;
}

.intro {
  margin-top: 1.25rem;
  padding: 1.1rem 1.1rem; /* 窄屏默认值；桌面（md 及以上）见下方 @screen md 覆盖 */
  text-align: left;
}

.intro-title {
  color: var(--color-accent);
  font-size: 1.2rem;
  margin-bottom: 0.6rem;
  letter-spacing: 0.4px;
}

.intro-text {
  line-height: 1.7;
  opacity: 0.96;
  margin-bottom: 0.75rem;
}

.tracks {
  /* 注：.tracks/.track/.track-title/.track-desc 在当前模板中未被使用（零命中），
     属既存死代码，超出本 Task 范围，未做删除，仅按要求做媒体查询的移动优先翻转 */
  margin-top: 1rem;
  display: grid;
  grid-template-columns: 1fr; /* 窄屏默认值；桌面（lg 及以上）见下方 @screen lg 覆盖 */
  gap: 0.85rem;
}

.track {
  border: 1px solid rgba(255, 255, 255, 0.08);
  background: rgba(255, 255, 255, 0.03);
  border-radius: 14px;
  padding: 0.85rem 0.9rem; /* 窄屏默认值；桌面见下方 @screen md 覆盖 */
}

.track-title {
  font-weight: 800;
  letter-spacing: 0.4px;
  margin-bottom: 0.35rem;
  color: var(--color-heading);
}

.track-desc {
  line-height: 1.55;
  opacity: 0.92;
  font-size: 0.95rem;
}

.job-card {
  padding: 1.1rem 1.1rem; /* 窄屏默认值；桌面（md 及以上）见下方 @screen md 覆盖 */
  margin-bottom: 2rem;
}

.job-title-row {
  display: flex;
  align-items: center;
  gap: 0.7rem;
}

.job-tag {
  font-size: 0.82rem;
  padding: 0.18rem 0.6rem;
  border-radius: 999px;
  border: 1px solid rgba(255, 255, 255, 0.12);
  background: rgba(255, 255, 255, 0.04);
  opacity: 0.95;
}

.job-card h2 {
  color: var(--color-accent);
  font-size: 1.2rem; /* 窄屏默认值；桌面见下方 @screen md 覆盖 */
  margin-bottom: 0.15rem;
  letter-spacing: 0.5px;
}

.job-card .description {
  margin-top: 0.55rem;
  margin-bottom: 1rem;
  color: var(--color-text);
  font-style: italic;
  opacity: 0.94;
}

.job-card h3 {
  font-size: 1.05rem;
  margin-bottom: 0.75rem;
  color: var(--color-heading);
}

.job-card ul {
  list-style: none;
  padding-left: 0;
}

.job-card li {
  padding-left: 1.25em;
  position: relative;
  margin-bottom: 0.55rem;
  line-height: 1.55;
}

/* 使用伪元素创建科技感的列表标记 */
.job-card li::before {
  content: '>';
  position: absolute;
  left: 0;
  top: 0;
  color: var(--color-accent);
  font-weight: bold;
}

.job-notes {
  margin-top: 1.05rem;
  padding-top: 0.9rem;
  border-top: 1px dashed rgba(255, 255, 255, 0.12);
  opacity: 0.96;
}

.job-notes-title {
  font-weight: 800;
  margin-bottom: 0.55rem;
  color: var(--color-heading);
}

.contact-section {
  margin-top: 3rem;
  padding: 1.6rem;
  text-align: center;
}

.contact-text {
  line-height: 1.7;
}

.apply-hint {
  margin-top: 1.2rem;
  text-align: left;
  display: inline-block;
  padding: 1rem 1.1rem;
  border-radius: 14px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  background: rgba(255, 255, 255, 0.03);
}

.apply-hint h3 {
  margin: 0 0 0.65rem 0;
  font-size: 1.02rem;
  color: var(--color-heading);
}

.apply-hint ul {
  list-style: none;
  padding-left: 0;
  margin: 0;
}

.apply-hint li {
  padding-left: 1.25em;
  position: relative;
  margin-bottom: 0.5rem;
  line-height: 1.55;
}

.apply-hint li::before {
  content: '>';
  position: absolute;
  left: 0;
  top: 0;
  color: var(--color-accent);
  font-weight: bold;
}

.contact-footnote {
  margin-top: 1rem;
  opacity: 0.82;
  font-size: 0.95rem;
}

/* 移动优先：上方为窄屏默认值，md/lg 及以上覆盖为桌面值
 * 980px 与 768px 两个原断点分别归并到 lg（1024px）与 md（768px） */
@screen md {
  .intro,
  .job-card {
    padding: 1.35rem 1.6rem;
  }

  .job-card h2 {
    font-size: 1.42rem;
  }

  .track {
    padding: 0.9rem 0.95rem;
  }
}

@screen lg {
  .tracks {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }
}
</style>
