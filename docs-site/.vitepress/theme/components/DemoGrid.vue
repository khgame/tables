<script setup lang="ts">
import { withBase } from 'vitepress'

type DemoLink = {
  title: string
  description: string
  play: string
  source: string
}

const props = defineProps<{ demos: DemoLink[] }>()

const resolve = (path: string) => withBase(path)
</script>

<template>
  <div class="demo-grid">
    <article v-for="demo in props.demos" :key="demo.title" class="demo-card">
      <h3>{{ demo.title }}</h3>
      <p>{{ demo.description }}</p>
      <div class="actions">
        <a class="primary" :href="resolve(demo.play)" target="_blank" rel="noopener">
          🚀 立即体验
        </a>
        <a class="secondary" :href="demo.source" target="_blank" rel="noopener">
          📦 查看源码
        </a>
      </div>
    </article>
  </div>
</template>
