// src/main.js

// **就是这一行！确保它在这里！**
import './assets/base.css'
import './assets/main.css'
import 'uno.css'
import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import { applyColorTokensToCssVars } from './config/colorTokens'

// Naive UI 配置
import { create, NConfigProvider } from 'naive-ui'

const naive = create({
  components: [NConfigProvider],
})

applyColorTokensToCssVars()

const app = createApp(App)

app.use(naive)
app.use(router)
app.mount('#app')
