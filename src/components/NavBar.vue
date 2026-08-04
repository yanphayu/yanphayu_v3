<script setup>
import { activeSection } from '../state.js'
import ThemeToggle from './ThemeToggle.vue'

const items = [
  { id: 'home', label: 'Home' },
  { id: 'about', label: 'About' },
  { id: 'skills', label: 'Skills' },
  { id: 'projects', label: 'Projects' },
  { id: 'education', label: 'Education' },
  { id: 'music', label: 'Music' },
  { id: 'contact', label: 'Contact' }
]
</script>

<template>
  <nav class="nav" aria-label="Primary">
    <div class="nav-inner">
      <a href="#home" class="nav-logo">yanphayu<span class="dot">.</span>dev</a>
      <div class="nav-right">
        <div class="nav-links">
          <a
            v-for="item in items"
            :key="item.id"
            class="nav-link"
            :class="{ active: activeSection === item.id }"
            :href="'#' + item.id"
          >{{ item.label }}</a>
        </div>
        <ThemeToggle />
      </div>
    </div>
  </nav>
</template>
