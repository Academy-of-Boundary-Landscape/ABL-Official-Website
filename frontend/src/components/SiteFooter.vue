<!-- src/components/SiteFooter.vue -->
<template>
  <n-layout-footer bordered class="site-footer">
    <n-space vertical :size="12" align="center">
      <n-space :size="16" align="center">
        <RouterLink to="/archive/products" class="footer-link">制品归档</RouterLink>
        <RouterLink to="/about" class="footer-link">关于我们</RouterLink>
      </n-space>
      <p class="copyright">&copy; 2025 境界景观学会 // ALL RIGHTS RESERVED</p>
      <n-button
        text
        tag="a"
        href="https://beian.miit.gov.cn/"
        target="_blank"
        size="small"
        class="beian-link"
      >
        吉ICP备2025029247号-1
      </n-button>
    </n-space>
  </n-layout-footer>
</template>

<script setup>
import { RouterLink } from 'vue-router'
import { NLayoutFooter, NSpace, NButton } from 'naive-ui'
</script>

<style scoped>
.site-footer {
  width: 100%;
  padding: 2rem;
  background-color: #21252e;
  border-top: 1px solid var(--color-border);
}

.copyright {
  color: rgba(255, 255, 255, 0.4);
  font-size: 0.8rem;
  letter-spacing: 1px;
  margin: 0;
}

.beian-link {
  color: #888 !important;
  font-size: 0.8rem;
}

.beian-link:hover {
  /* var(--color-primary) 从未被定义过，这条规则一直是空转；改用真实存在的 --color-accent */
  color: var(--color-accent) !important;
}

.footer-link {
  color: rgba(255, 255, 255, 0.55);
  font-size: 0.8rem;
  text-decoration: none;
}

.footer-link:hover {
  color: var(--color-accent);
}
</style>
