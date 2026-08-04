<script setup>
import { ref, onMounted } from 'vue'
import { fetchProjects } from '../api.js'

const projects = ref([])

const FALLBACK = [
  {
    id: 1,
    title: 'yanphayu_v2',
    description: 'My current portfolio — this very website. A professional light theme built with Vue 3 and Vite, with dark/light mode.',
    badge: 'Portfolio v2',
    image: '/image/projects/yanphayu_v2.png',
    stack: 'Vue 3, Vite',
    login_hint: '',
    live_url: 'https://yanphayuv2.vercel.app',
    source_url: 'https://github.com/yanphayu/yanphayu_v2',
    sort_order: 0
  },
  {
    id: 2,
    title: 'JomvinhKH',
    description: 'A static site showcasing places in Cambodia — my first Vue.js project, built with Vite and Tailwind, deployed on Vercel.',
    badge: 'My first Web',
    image: '/image/projects/jomvinhkh.png',
    stack: 'Vue 3, Vite, Tailwind',
    login_hint: '',
    live_url: 'https://jomvinhkh.vercel.app',
    source_url: 'https://github.com/yanphayu/JomvinhKH',
    sort_order: 1
  },
  {
    id: 3,
    title: 'KitchenFlow — Restaurant Management System',
    description: 'A restaurant manager built with PHP, MySQL, and jQuery/AJAX — Chart.js dashboard, order/tables/foods/categories management, global search, and role-based login.',
    badge: 'Full-Stack PHP',
    image: '/image/projects/rms.png',
    stack: 'PHP, MySQL, jQuery/AJAX, Chart.js',
    login_hint: 'admin / 1234',
    live_url: 'https://rmszin2.wuaze.com',
    source_url: 'https://github.com/yanphayu/Restaurant-Management-System',
    sort_order: 2
  },
  {
    id: 4,
    title: 'yanphayu_v1',
    description: 'My very first portfolio website — the earlier iteration of this site, before the redesign.',
    badge: 'Portfolio v1',
    image: '/image/projects/yanphayu_v1.png',
    stack: 'Vue 3, Vite',
    login_hint: '',
    live_url: 'https://yanphayuv1.vercel.app',
    source_url: 'https://github.com/yanphayu/yanphayu_v1',
    sort_order: 3
  }
]

onMounted(async () => {
  const list = await fetchProjects()
  if (list && list.length) {
    projects.value = list
  } else {
    projects.value = FALLBACK
  }
})
</script>

<template>
  <section class="section" id="projects">
    <div class="container">
      <h2 class="section-title">Projects</h2>


      <div class="projects-grid featured">
        <article v-for="project in projects" :key="project.id" class="card project-card featured-card">
          <div v-if="project.image" class="project-banner">
            <img :src="project.image" :alt="project.title + ' screenshot'" class="project-img">
            <span v-if="project.badge" class="badge">{{ project.badge }}</span>
          </div>
          <h3 class="card-title">{{ project.title }}</h3>
          <p v-if="project.description" class="project-desc">{{ project.description }}</p>
          <div v-if="project.stack" class="project-stack mono">
            <span v-for="s in project.stack.split(',')" :key="s.trim()">{{ s.trim() }}</span>
          </div>
          <p v-if="project.login_hint" class="project-login mono">{{ project.login_hint }}</p>
          <div class="project-links">
            <a v-if="project.live_url" :href="project.live_url" target="_blank" rel="noopener" class="btn btn-secondary btn-sm">Live Demo</a>
            <a v-if="project.source_url" :href="project.source_url" target="_blank" rel="noopener" class="btn btn-secondary btn-sm">Source</a>
          </div>
        </article>
      </div>
    </div>
  </section>
</template>
