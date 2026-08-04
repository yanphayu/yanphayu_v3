<script setup>
import { ref, reactive, onMounted, onBeforeUnmount, nextTick } from 'vue'
import { MUSIC_TRACKS } from '../data/tracks.js'
import { fetchMusic } from '../api.js'

const tracks = ref([])

const playing = reactive([])
const times = reactive([])
const canvasEls = reactive([])

const players = []

function fmt(sec) {
  if (!isFinite(sec)) return '0:00'
  const m = Math.floor(sec / 60)
  const s = Math.floor(sec % 60)
  return m + ':' + String(s).padStart(2, '0')
}

function setCanvasRef(i, el) {
  canvasEls[i] = el
}

function resizeCanvas(p) {
  const w = p.canvas.clientWidth
  if (p.canvas.width !== w || p.canvas.height !== 56) {
    p.canvas.width = w
    p.canvas.height = 56
  }
}

function themeColors() {
  const cs = getComputedStyle(document.documentElement)
  const v = (name, fallback) => cs.getPropertyValue(name).trim() || fallback
  return {
    bg: v('--canvas-bg', '#EEF2F7'),
    barA: v('--primary', '#2563EB'),
    barB: v('--accent', '#06B6D4')
  }
}

function drawIdle(p) {
  const c = p.canvas.getContext('2d')
  c.fillStyle = themeColors().bg
  c.fillRect(0, 0, p.canvas.width, p.canvas.height)
}

function buildPlayer(i) {
  const p = {
    audio: new Audio(tracks.value[i].file),
    canvas: canvasEls[i],
    audioCtx: null,
    analyser: null,
    playing: false,
    rafId: null,
    lastTime: null,
    vizFallback: false,
    peakHolds: null,
    smoothVals: null,
    globalLevel: 0
  }
  p.audio.preload = 'metadata'

  resizeCanvas(p)
  drawIdle(p)

  p.drawLoop = function drawLoop() {
    p.rafId = requestAnimationFrame(drawLoop)
    const c = p.canvas.getContext('2d')
    const w = p.canvas.width
    const h = p.canvas.height
    const tc = themeColors()
    c.fillStyle = tc.bg
    c.fillRect(0, 0, w, h)

    const bars = 28
    const gap = 2
    const step = w / bars
    const bw = Math.max(1, step - gap)

    if (!p.playing) {
      if (p.peakHolds) p.peakHolds.fill(0)
      if (p.smoothVals) p.smoothVals.fill(0)
      p.globalLevel = 0
      for (let j = 0; j < bars; j++) {
        c.fillStyle = j % 2 === 0 ? tc.barA : tc.barB
        c.fillRect(j * step, h - 2, bw, 2)
      }
      return
    }

    const binCount = p.analyser && !p.vizFallback ? p.analyser.frequencyBinCount : 512
    const data = new Uint8Array(binCount)
    if (p.analyser && !p.vizFallback) {
      p.analyser.getByteFrequencyData(data)
    } else {
      for (let j = 0; j < binCount; j++) {
        const n = j / binCount
        data[j] = (Math.abs(Math.sin(n * 18 + p.audio.currentTime * 3)) +
                   Math.abs(Math.sin(n * 7 + p.audio.currentTime * 1.7))) * 255 * 0.5
      }
    }

    if (!p.peakHolds || p.peakHolds.length !== bars) p.peakHolds = new Array(bars).fill(0)
    if (!p.smoothVals || p.smoothVals.length !== bars) p.smoothVals = new Array(bars).fill(0)

    const hi = Math.max(2, Math.floor(binCount * 0.72))
    const startLog = Math.log(1)
    const spanLog = Math.log(1 + hi) - startLog

    const raws = new Array(bars)
    let levelSum = 0
    for (let j = 0; j < bars; j++) {
      const a = Math.exp(startLog + (j / bars) * spanLog) - 1
      const b = Math.exp(startLog + ((j + 1) / bars) * spanLog) - 1
      const i0 = Math.max(0, Math.floor(a))
      const i1 = Math.min(hi, Math.max(i0 + 1, Math.ceil(b)))
      let sum = 0
      for (let k = i0; k < i1; k++) sum += data[k]
      raws[j] = sum / (i1 - i0) / 255
      levelSum += raws[j]
    }
    const energy = levelSum / bars
    p.globalLevel += (energy - p.globalLevel) * 0.05
    const gain = Math.min(5, 0.16 / Math.max(0.0002, p.globalLevel))

    for (let j = 0; j < bars; j++) {
      const boosted = Math.min(1, raws[j] * gain)
      const v = Math.min(1, 0.04 + 0.96 * Math.pow(boosted, 0.55))
      p.smoothVals[j] += (v - p.smoothVals[j]) * 0.25
      if (p.smoothVals[j] > p.peakHolds[j]) p.peakHolds[j] = p.smoothVals[j]
      else p.peakHolds[j] *= 0.88
      const bh = Math.max(2, Math.floor(p.peakHolds[j] * (h - 4)))
      const x = j * step
      c.fillStyle = j % 2 === 0 ? tc.barA : tc.barB
      c.fillRect(x, h - bh, bw, bh)
    }
  }

  p.startAnalyzer = function startAnalyzer() {
    try {
      if (typeof p.audio.captureStream !== 'function') throw new Error('unsupported')
      const AC = window.AudioContext || window.webkitAudioContext
      if (!AC) throw new Error('unsupported')
      p.audioCtx = new AC()
      const stream = p.audio.captureStream()
      if (!stream || !stream.getAudioTracks || stream.getAudioTracks().length === 0) {
        throw new Error('no audio track')
      }
      p.analyser = p.audioCtx.createAnalyser()
      p.analyser.fftSize = 1024
      p.analyser.smoothingTimeConstant = 0.7
      const source = p.audioCtx.createMediaStreamSource(stream)
      source.connect(p.analyser)
      const gainNode = p.audioCtx.createGain()
      gainNode.gain.value = 0
      p.analyser.connect(gainNode)
      gainNode.connect(p.audioCtx.destination)
      const pr = p.audioCtx.resume()
      if (pr && pr.then) pr.catch(() => { p.vizFallback = true })
    } catch {
      p.vizFallback = true
    }
  }

  p.audio.addEventListener('timeupdate', () => {
    if (p.audio.duration && p.audio.currentTime !== p.lastTime) {
      p.lastTime = p.audio.currentTime
      times[i] = fmt(p.audio.currentTime) + ' / ' + fmt(p.audio.duration)
    }
  })
  p.audio.addEventListener('loadedmetadata', () => {
    times[i] = fmt(p.audio.currentTime) + ' / ' + fmt(p.audio.duration)
  })
  p.audio.addEventListener('ended', () => {
    p.playing = false
    playing[i] = false
    cancelAnimationFrame(p.rafId)
    drawIdle(p)
    times[i] = fmt(p.audio.duration) + ' / ' + fmt(p.audio.duration)
  })
  p.audio.addEventListener('error', () => {
    times[i] = 'track not found'
  })

  return p
}

function pauseOthers(except) {
  players.forEach((other) => {
    if (other && other !== except && !other.audio.paused) {
      other.audio.pause()
      other.playing = false
      const idx = players.indexOf(other)
      if (idx !== -1) playing[idx] = false
      cancelAnimationFrame(other.rafId)
    }
  })
}

async function toggle(i) {
  const p = players[i]
  if (!p) return
  if (p.audio.paused) {
    pauseOthers(p)
    try {
      await p.audio.play()
      p.playing = true
      playing[i] = true
      if (!p.audioCtx && !p.vizFallback) p.startAnalyzer()
      cancelAnimationFrame(p.rafId)
      p.drawLoop()
    } catch {
      times[i] = 'could not play'
    }
  } else {
    p.audio.pause()
    p.playing = false
    playing[i] = false
    cancelAnimationFrame(p.rafId)
    drawIdle(p)
  }
}

function onWindowResize() {
  players.forEach((p) => {
    if (p) resizeCanvas(p)
  })
}

function onThemeChange() {
  players.forEach((p) => {
    if (p && !p.playing) drawIdle(p)
  })
}

onMounted(async () => {
  let list = await fetchMusic()
  if (!list || !list.length) {
    list = MUSIC_TRACKS.map((t, i) => ({ id: i + 1, title: t.title, file: t.file, sort_order: i }))
  }
  tracks.value = list
  await nextTick()
  list.forEach((_, i) => {
    playing[i] = false
    times[i] = '0:00 / 0:00'
    players[i] = buildPlayer(i)
  })
  window.addEventListener('resize', onWindowResize)
  document.addEventListener('themechange', onThemeChange)
  document.addEventListener('pointerdown', () => {
    players.forEach((p) => {
      if (p && p.audioCtx && p.audioCtx.state === 'suspended') p.audioCtx.resume()
    })
  })
})

onBeforeUnmount(() => {
  window.removeEventListener('resize', onWindowResize)
  document.removeEventListener('themechange', onThemeChange)
  players.forEach((p) => {
    if (p) {
      cancelAnimationFrame(p.rafId)
      p.audio.pause()
      if (p.audioCtx) p.audioCtx.close()
    }
  })
})
</script>

<template>
  <section class="section" id="music">
    <div class="container">
      <h2 class="section-title">Music</h2>

      <div class="music-grid">
        <article v-for="(track, i) in tracks" :key="i" class="card music-card">
          <h3 class="card-title">{{ track.title }}</h3>
          <div class="player">
            <canvas :ref="(el) => setCanvasRef(i, el)" class="player-canvas" aria-hidden="true"></canvas>
            <div class="player-track">
              <button
                class="player-play"
                type="button"
                :class="{ playing: playing[i] }"
                :aria-label="playing[i] ? 'Pause' : 'Play'"
                :aria-pressed="playing[i] ? 'true' : 'false'"
                @click="toggle(i)"
              >
                <svg class="icon-play" viewBox="0 0 24 24" width="20" height="20" fill="currentColor"><path d="M7 5v14l12-7z"/></svg>
                <svg class="icon-pause" viewBox="0 0 24 24" width="20" height="20" fill="currentColor"><path d="M6 5h4v14H6zM14 5h4v14h-4z"/></svg>
              </button>
              <div class="player-info">
                <span class="player-time mono">{{ times[i] }}</span>
              </div>
            </div>
          </div>
        </article>
      </div>
    </div>
  </section>
</template>
