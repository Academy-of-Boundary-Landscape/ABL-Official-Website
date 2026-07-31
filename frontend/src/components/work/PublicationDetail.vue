<template>
  <section class="detail-block">
    <dl class="detail-facts">
      <template v-if="block.releaseDate">
        <dt>发行日期</dt>
        <dd>{{ block.releaseDate }}</dd>
      </template>
      <template v-if="block.spec">
        <dt>规格</dt>
        <dd>{{ block.spec }}</dd>
      </template>
      <template v-if="block.contributorCount">
        <dt>参与作者</dt>
        <dd>{{ block.contributorCount }} 位</dd>
      </template>
    </dl>
  </section>
</template>

<script setup>
defineProps({
  block: { type: Object, required: true },
})
</script>

<style scoped src="./detail-shared.css"></style>
