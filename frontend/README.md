
# 🟢 Vue 3 前端快速入门

欢迎来到前端仓库！本项目使用 **Vue 3 + Vite** 构建。
如果你以前写过后端或传统 HTML/jQuery，Vue 的最大区别在于：**它是数据驱动的**。你不需要手动修改 DOM（比如 `document.getElementById`），你只需要修改数据，Vue 会自动更新页面。

---

## 1. Vue 的核心特性 (速成)

*   **组件化 (Components)**: 
    我们将页面拆分成积木。一个 `.vue` 文件就是一个组件，它同时包含：
    *   `<template>`: HTML 结构
    *   `<script setup>`: JS 逻辑 (Vue 3 组合式 API)
    *   `<style>`: CSS 样式

*   **响应式 (Reactivity)**:
    当你在 JS 里修改变量（例如 `count.value++`），HTML 里绑定了这个变量的地方会自动刷新。

*   **单页应用 (SPA)**:
    点击链接时页面不会“白屏刷新”，Vue 只是偷偷替换了中间的内容。这就需要用到 **Router**。

---

## 2. 📂 项目目录结构详解 (基于当前项目)

参照你的截图，这是每个文件夹的作用：

### 核心源码 (`src/`)
*   **`main.js`**: 🚀 **入口文件**。整个 App 从这里启动，加载全局配置（如路由、样式）。
*   **`App.vue`**: 🏠 **根组件**。所有页面都嵌在这个组件的 `<router-view />` 里面。
*   **`views/`**: 📄 **页面级组件**。
    *   这里存放“完整的页面”，比如 `Home.vue`, `About.vue`。
    *   *开发习惯*：如果你要写个新页面，先在这里建文件。
*   **`components/`**: 🧩 **通用小组件**。
    *   这里存放被复用的组件，比如 `Navbar.vue` (导航栏), `Footer.vue`, `EventCard.vue`（展示一个事件信息的卡片）。
    *   *特点*：它们通常不直接处理路由，只负责展示数据。
*   **`router/` (index.js)**: 🗺️ **路由配置**。
    *   这里定义了 URL 和页面的对应关系。
    *   例如：访问 `/about` -> 显示 `views/About.vue`。
*   **`composables/`**: 🧠 **逻辑复用 / API 层 (重要!)**。
    *   Vue 3 特有概念（类似 React Hooks）。
    *   **`strapi.js`**: 这里封装了连接 Strapi 后端的通用工具（fetcher），封装好了如何向后端请求数据的方法。
    *   **`useEventAPI.js`**: 旧版本的 API 调用封装，现在大部分逻辑已迁移到 `strapi.js`，基本作废了。
*   **`assets/`**: 🖼️ 静态资源（图片、字体），会被打包编译。
*   **`data/`**: 💾 可能存放了一些静态的 JSON 数据或模拟数据，目前还没有。
*   （推荐你创建）**`store/`**: 🗃️ 状态管理，存放全局共享的数据和逻辑。

### 配置文件
*   **`.env.development` / `.env.production`**: 🌍 环境变量。
    *   这里定义了 `VITE_API_URL`。
    *   Dev 模式指向 `localhost:1337`，Prod 模式指向服务器 IP/域名。
*   **`vite.config.js`**: ⚡ 构建工具 Vite 的配置（类似 Webpack，但更快）。
*   **`package.json`**: 项目依赖清单。

---

## 3. 前后端工作原理

Vue 是**客户端渲染 (CSR)**，它运行在用户的浏览器里，无法直接连接数据库。它必须通过 HTTP 请求跟 Strapi 后端对话。

#### 典型的数据加载流程：

1.  **用户访问页面**: 浏览器加载 Vue，Vue Router 决定渲染哪个 `views/xxx.vue`。
2.  **组件挂载 (onMounted)**: 页面加载时，Vue 组件执行 `<script>` 里的代码。
3.  **调用 Composable**: 组件调用 `src/composables/useEventAPI.js` 里的函数。
4.  **发送请求**: `strapi.js` 向后端发起请求（例如 `GET http://localhost:1337/api/events`）。
5.  **更新数据**:
    *   Strapi 返回 JSON 数据。
    *   Vue 接收数据，赋值给响应式变量（`ref`）。
    *   页面自动根据数据渲染列表。

#### 代码示例 (伪代码):

```javascript
// src/views/EventList.vue

<script setup>
import { ref, onMounted } from 'vue';
// 引入我们在 composables 里写好的 API 方法
import { useEventAPI } from '@/composables/useEventAPI';

const events = ref([]); // 1. 定义一个空的数据容器（响应式）
const { getAllEvents } = useEventAPI();

// 2. 页面加载完成后自动执行
onMounted(async () => {
  // 3. 向 Strapi 请求数据
  const response = await getAllEvents();
  // 4. 更新数据，HTML 会自动变
  events.value = response.data;
});
</script>

<template>
  <div>
    <!-- 5. 循环渲染数据 -->
    <div v-for="item in events" :key="item.id">
      {{ item.attributes.title }}
    </div>
  </div>
</template>
```

---

## 4. 如何新增一个页面？

如果你想练习 Vue，尝试以下步骤：

1.  **新建页面**: 在 `src/views/` 下创建一个 `TestPage.vue`。随便写点 `<h1>Hello Vue</h1>`。
2.  **注册路由**: 打开 `src/router/index.js`，导入这个组件，并添加一条规则：
    ```js
    { path: '/test', component: () => import('../views/TestPage.vue') }
    ```
3.  **访问**: 浏览器打开 `http://localhost:5173/test`，你应该能看到你的页面。
4.  **获取数据**: 参考上面的代码示例，尝试引入 `useEventAPI` 把 Strapi 里的数据展示出来。


这是一个非常好的练习任务，既能让新人熟悉 Vue 的模版语法（Template），又能让他们体会组件化开发的优势，同时因为不动核心逻辑（Script），风险相对可控。

以下是为你起草的 **README 任务说明书**。你可以将其保存为 `UI_REFACTOR_GUIDE.md` 或者直接添加到现有的 README 中。

此文档重点强调了 **“逻辑与视图分离”** 的概念，并使用了 **Before vs After** 的对比教学法。

***


# 你的任务：迁移前端至 Naive UI

## 1. 任务目标
我们需要将现有的手写 HTML/CSS 界面，升级为使用 **Naive UI** 组件库。
**核心原则：**
1.  **只改“样式”**：修改 HTML 结构和样式。
2.  **尽量不动“逻辑”**：保持 `src/composables` 和 `<script setup>` 里的数据获取逻辑、变量名尽可能完全不变。

## 什么是 Naive UI？
[Naive UI](https://www.naiveui.com/zh-CN/dark) 是一个 Vue 3 专用的组件库，提供了丰富的 UI 组件（按钮、表格、卡片等），可以大幅提升开发效率和界面一致性。
逻辑很简单，与其让我们自己写按钮组件、卡片组件，或者花哨的布局和进度条组件，不如直接用现成的、设计良好的组件。
Naive UI 就是一个这样的组件库，它很符合我的审美，也很容易上手。

## 2. 准备工作
1.  **参考文档**：
    *   请务必收藏 [Naive UI 官方文档](https://www.naiveui.com/zh-CN/dark)。
    *   你会频繁查阅“组件”栏目，比如按钮怎么写、表格怎么写、卡片怎么写。
2.  **安装 (如果你还没装)**：
    ```bash
    npm install naive-ui
    npm install -D vfonts # 推荐字体
    ```

---

## 3. 重构工作流 

请按照以下步骤重构 `src/views` 下的页面：

### 第一步：寻找对应组件
看一眼现有的 HTML 标签，去 Naive UI 文档里找“平替”。

| 原生 HTML | Naive UI 组件 | 文档关键词 |
| :--- | :--- | :--- |
| `<button>` | `<n-button>` | 按钮 Button |
| `<input>` | `<n-input>` | 输入框 Input |
| `<div>` (用于布局) | `<n-space>` 或 `<n-grid>` | 间距 Space / 栅格 Grid |
| `<div class="card">` | `<n-card>` | 卡片 Card |
| `<ul><li>` | `<n-list>` | 列表 List |
| `<table>` | `<n-data-table>` | 数据表格 Data Table |
| `<span>` (用于标签) | `<n-tag>` | 标签 Tag |

### 第二步：替换代码 

这是你最需要关注的部分。我们以“展示一个社团活动”为例：

#### 🔴 重构前 (原生 HTML)
*代码冗长，需要手写 CSS 类名。*

```html
<template>
  <div class="event-card">
    <!-- 标题 -->
    <h3>{{ event.title }}</h3>
    <!-- 内容 -->
    <p>{{ event.description }}</p>
    <!-- 按钮 -->
    <button class="btn-primary" @click="handleJoin(event.id)">
      立即报名
    </button>
  </div>
</template>

<style>
/* 需要手写一大堆 CSS */
.event-card { border: 1px solid #ccc; padding: 20px; }
.btn-primary { background: blue; color: white; }
</style>
```

#### 🟢 重构后 (Naive UI)
*代码简洁，样式由组件库自动处理。*

```html
<template>
  <!-- 直接使用 n-card 组件，通过 title 属性传值 -->
  <n-card :title="event.title" hoverable>
    <!-- 内容区域 -->
    {{ event.description }}
    
    <!-- 底部操作区，使用 footer 插槽 -->
    <template #footer>
      <!-- type="primary" 直接决定了颜色是主题色 -->
      <n-button type="primary" @click="handleJoin(event.id)">
        立即报名
      </n-button>
    </template>
  </n-card>
</template>

<script setup>
// ⚠️ 别忘了引入你用到的组件！(除非配置了自动引入)
import { NCard, NButton } from 'naive-ui'
// 原有的逻辑代码保持不变...
</script>

<style>
/* 大部分 CSS 可以删掉了，除非微调 */
</style>
```

---

## 常见技巧

### 1. 布局用：`<n-space>`
新人最头疼的是“怎么让两个按钮横着排，中间还得有点缝隙”。
不要写 `margin-right: 10px` 了，用 `<n-space>`：

```html
<n-space>
  <n-button>取消</n-button>
  <n-button type="primary">确认</n-button>
</n-space>
```
它会自动处理子元素的排列和间距。

### 2.灵活布局：`<n-grid>`
如果你想让活动卡片“一行显示 3 个，手机上一行显示 1 个”，请使用 Grid：

```html
<!-- cols="1 s:2 m:3" 意思是：默认1列，小屏2列，中屏3列 -->
<n-grid x-gap="12" y-gap="12" cols="1 s:2 m:3" responsive="screen">
  <n-grid-item v-for="item in events" :key="item.id">
    <n-card>...</n-card>
  </n-grid-item>
</n-grid>
```

### 3. 图标的使用
Naive UI 推荐配合 `@vicons/ionicons5` 使用图标。
```bash
npm install @vicons/ionicons5
```
```html
<n-icon size="20">
  <GameControllerOutline /> <!-- 需要 import -->
</n-icon>
```

---

## 最终标准
当你提交代码时，请确认：
1.  **页面没崩**：没有控制台红字报错。
2.  **功能正常**：原本能点击获取数据的按钮，现在依然能获取数据。
3.  **视觉统一**：页面上不再出现原生的按钮，全部替换为了 Naive UI 风格。
4.  **代码清理**：原本 `views` 里无用的 CSS 代码（如 `.card-wrapper`）已被删除。


## 技巧：AI辅助开发

**不要在此任务中“手写”！**
将普通 HTML/CSS 翻译成 Naive UI 组件代码，是大语言最擅长的事情。

特别地，比如 Gemini 3.0 Pro模型，它的世界知识特别丰富，你甚至不需要给他喂“Naive UI 文档”，它自己就知道怎么用。

### 1. 如何向 AI 提问？ (Prompt 模版)

不要只问“怎么写按钮”，要把你现在的代码贴给它。试试用下面的话术提问：

> **场景一：重写代码**
> “我正在学习 Vue 3 和 Naive UI。请帮我把下面这段原生 Vue 代码重构为使用 Naive UI 的组件。要求：保留原有的事件和变量绑定，不要修改大幅修改逻辑，并删除冗余的css。
>
> [粘贴你的旧代码]”
的 `<n-space justify="space-between">` 是什么意思？它和普通的 CSS flex 布局有什么区别？”

### 2. 你需要注意什么？ 

虽然 AI 很强，但它偶尔会“一本正经地胡说八道”。

你最有可能遇到的问题是 AI 写出的代码“语法错误”或者“组件名拼错”，这时候你最好回去检查一下组件文档，确认一下正确的写法。