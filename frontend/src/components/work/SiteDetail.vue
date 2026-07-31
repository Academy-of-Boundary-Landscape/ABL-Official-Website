<template>
  <section class="detail-block">
    <dl class="detail-facts">
      <template v-if="block.eventDate">
        <dt>活动日期</dt>
        <dd>{{ block.eventDate }}</dd>
      </template>
      <template v-if="block.participantCount">
        <dt>参与人数</dt>
        <dd>{{ block.participantCount }}</dd>
      </template>
    </dl>

    <a
      v-if="block.url"
      :href="block.url"
      class="detail-primary-link"
      target="_blank"
      rel="noopener noreferrer"
    >
      &gt;&gt; 访问活动站
    </a>
  </section>
</template>

<script setup>
defineProps({
  block: { type: Object, required: true },
})
</script>

<style scoped src="./detail-shared.css"></style>
