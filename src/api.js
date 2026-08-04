export const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:8000'

async function get(path) {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), 3500)
  try {
    const res = await fetch(API_BASE + path, { signal: controller.signal })
    if (!res.ok) throw new Error('bad status')
    const json = await res.json()
    if (!json.ok || !Array.isArray(json.data)) throw new Error('bad payload')
    return json.data
  } catch (e) {
    return null
  } finally {
    clearTimeout(timer)
  }
}

export function fetchProjects() {
  return get('/api/projects.php')
}

export function fetchMusic() {
  return get('/api/music.php')
}
