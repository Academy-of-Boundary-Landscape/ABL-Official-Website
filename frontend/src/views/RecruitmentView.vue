<!-- src/views/RecruitmentView.vue -->
<template>
  <div class="recruitment-view">
    <section class="page-header">
      <div class="header-content">
        <h1 class="title">// 加入我们</h1>
        <p class="subtitle">社团刚刚建立不久，我们很需要有专业技能的同好加入我们！</p>
      </div>
    </section>

    <div class="job-card">
      <h2>职位：画师</h2>
      <p class="description">任务：负责社团作品的插图、封面、人设等视觉模块构建。</p>
      <h3>推荐需求:</h3>
      <ul>
        <li>会画通常二次元画风角色图片，并有能力画出多数角色的常规姿势图片</li>
        <li>具备较好的绘画能力，有稳定的画风，画技不会非常雷人</li>
        <li>乐于团队协作，为项目提供美术资源</li>
        <li>申请中请附带您的代表作品（链接或附件）</li>
      </ul>
    </div>

    <div class="job-card">
      <h2>职位：排版与平面设计师</h2>
      <p class="description">任务：负责社团同人志的排版和平面设计。</p>
      <h3>推荐需求:</h3>
      <ul>
        <li>能够使用Adobe Illustrator或者类似的平面设计软件，或者In Design类似的排版软件</li>
        <li>有基本的审美，乐于学习与参考优秀的其他作品的设计</li>
        <li>乐于为同人志或者社团的宣传图做设计工作</li>
        <li>能按照要求，用给定素材完成排版与平面设计任务</li>
        <li>申请中请附带您的代表作品（平面设计或者排版）</li>
      </ul>
    </div>
    <div class="job-card">
      <h2>职位：硬件工程师</h2>
      <p class="description">任务：负责单片机或机械装置类制品的研究</p>
      <h3>推荐需求:</h3>
      <ul>
        <li>有基本的编程能力和硬件知识，了解基本的单片机知识或者机械装置设计</li>
        <li>有人类水平的动手能力，能够进行基本的焊接、拼接和组装工作</li>
        <li>有良好的团队合作精神，能够与团队成员合作</li>
        <li>如果你有一台3D打印机我会求着您来</li>
        <li>如果您有相关专业经验，特别是电赛之类的比赛经验，我们非常期待您来</li>
      </ul>
    </div>
    <div class="job-card">
      <h2>职位：*出摊合作者</h2>
      <p class="description">任务：在展会出摊场合协助我们出摊，无需进行其他工作</p>
      <h3>推荐需求:</h3>
      <ul>
        <li>有人类水平的智力和动手能力，能按照指示一项项完成布摊和出摊任务</li>
        <li>布摊和看摊时认真负责，能专心完成任务并做好善后工作</li>
        <li>有相对健康的体魄和勤奋的双腿</li>
      </ul>
    </div>
    <div class="contact-section">
      <h2>// 申请渠道</h2>
      <p>
        确定您的申请意向后，请将相关信息发送至指定邮箱：<br />
        <a href="mailto:contact@abl.secret-sealing.club">contact@abl.secret-sealing.club</a>
      </p>
      <p>邮件内部请包含您的基本信息和申请意向，以及您的qq联系方式，我们会在一周内回复</p>
    </div>
  </div>
</template>

<style scoped>
.recruitment-view h1 {
  font-size: 2.5rem;
  margin-bottom: 1rem;
}
.intro {
  margin-bottom: 3rem;
  color: var(--color-text);
}

.job-card {
  padding: 2rem;
  margin-bottom: 2rem;
  border: 1px solid var(--color-border);
  transition: all 0.3s ease;
}

.job-card:hover {
  border-color: var(--color-border-hover);
  box-shadow: 0 0 15px var(--color-border);
  transform: translateY(-5px);
}

.job-card h2 {
  color: var(--color-accent);
  font-size: 1.8rem;
  margin-bottom: 0.5rem;
}

.job-card .description {
  margin-bottom: 1.5rem;
  color: var(--color-text);
  font-style: italic;
}

.job-card h3 {
  font-size: 1.2rem;
  margin-bottom: 1rem;
  color: #fff;
}

.job-card ul {
  list-style: none;
  padding-left: 0;
}

.job-card li {
  padding-left: 1.5em;
  position: relative;
  margin-bottom: 0.7rem;
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

.contact-section {
  margin-top: 3rem;
  padding: 2rem;
  border: 1px dashed var(--color-border);
  text-align: center;
}
</style>