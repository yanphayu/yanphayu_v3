import { ref } from 'vue'

const KEY = 'portfolio-theme'
const isDark = ref(false)

function readStored() {
  try {
    return localStorage.getItem(KEY)
  } catch (e) {
    return null
  }
}

function devicePrefersDark() {
  return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches
}

function resolveInitial() {
  const stored = readStored()
  if (stored === 'dark') return true
  if (stored === 'light') return false
  return devicePrefersDark()
}

function apply() {
  document.documentElement.setAttribute('data-theme', isDark.value ? 'dark' : 'light')
  document.dispatchEvent(new CustomEvent('themechange'))
}

isDark.value = resolveInitial()
apply()

function toggleTheme() {
  isDark.value = !isDark.value
  try {
    localStorage.setItem(KEY, isDark.value ? 'dark' : 'light')
  } catch (e) {}
  apply()
}

if (window.matchMedia) {
  const mq = window.matchMedia('(prefers-color-scheme: dark)')
  const onChange = () => {
    try {
      localStorage.removeItem(KEY)
    } catch (e) {}
    location.reload()
  }
  if (mq.addEventListener) mq.addEventListener('change', onChange)
  else if (mq.addListener) mq.addListener(onChange)
}

export { isDark, toggleTheme }
