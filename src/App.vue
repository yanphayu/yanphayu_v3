<script setup>
import { onMounted, onBeforeUnmount, nextTick } from 'vue'
import { activeSection } from './state.js'
import NavBar from './components/NavBar.vue'
import HeroSection from './components/HeroSection.vue'
import AboutSection from './components/AboutSection.vue'
import SkillsSection from './components/SkillsSection.vue'
import ProjectsSection from './components/ProjectsSection.vue'
import EducationSection from './components/EducationSection.vue'
import MusicSection from './components/MusicSection.vue'
import ContactSection from './components/ContactSection.vue'
import FooterBar from './components/FooterBar.vue'

let spyObserver = null
let revealObserver = null

onMounted(async () => {
  await nextTick()

  /* ---------- Dock scroll-spy ---------- */
  const sections = Array.from(document.querySelectorAll('main section[id]'))
  if (sections.length && 'IntersectionObserver' in window) {
    spyObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) activeSection.value = entry.target.id
        })
      },
      { rootMargin: '-45% 0px -50% 0px', threshold: 0 }
    )
    sections.forEach((sec) => spyObserver.observe(sec))
  }

  /* ---------- Scroll reveal ---------- */
  const revealEls = document.querySelectorAll('.card, .section-title, .section-subtitle')
  if ('IntersectionObserver' in window) {
    revealObserver = new IntersectionObserver(
      (entries, obs) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('visible')
            obs.unobserve(entry.target)
          }
        })
      },
      { threshold: 0.08 }
    )
    revealEls.forEach((el) => {
      el.classList.add('reveal')
      revealObserver.observe(el)
    })
  } else {
    revealEls.forEach((el) => el.classList.add('visible'))
  }
})

onBeforeUnmount(() => {
  if (spyObserver) spyObserver.disconnect()
  if (revealObserver) revealObserver.disconnect()
})
</script>

<template>
  <NavBar />
  <main>
    <HeroSection />
    <AboutSection />
    <SkillsSection />
    <ProjectsSection />
    <EducationSection />
    <MusicSection />
    <ContactSection />
  </main>
  <FooterBar />
</template>
