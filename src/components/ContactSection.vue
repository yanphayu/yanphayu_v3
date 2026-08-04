<script setup>
import { ref } from 'vue'

const form = ref(null)
const status = ref(null)
const statusText = ref('')
const statusClass = ref('')
const sending = ref(false)

const TELEGRAM_ENDPOINT = 'https://script.google.com/macros/s/AKfycbwq7CG7jt8j3p5Vh_iW3qusC7WwgtNW5DXiFVbonJB7o38_jttsvdiW0BvsRMy6C8jd/exec'

async function sendTelegram(payload) {
  if (!TELEGRAM_ENDPOINT) {
    throw new Error('not-configured')
  }
  const response = await fetch(TELEGRAM_ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'text/plain' },
    body: JSON.stringify(payload)
  })
  const result = await response.json()
  if (!result.ok) {
    throw new Error(result.error || 'request-failed')
  }
  return result
}

async function onSubmit(e) {
  e.preventDefault()

  const name = e.target.name.value.trim()
  const email = e.target.email.value.trim()
  const subject = e.target.subject.value.trim()
  const message = e.target.message.value.trim()

  statusText.value = ''
  statusClass.value = ''

  if (!name || !email || !message) {
    statusText.value = 'please fill in all required fields.'
    statusClass.value = 'error'
    return
  }

  const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
  if (!emailOk) {
    statusText.value = 'please enter a valid email address.'
    statusClass.value = 'error'
    return
  }

  sending.value = true

  try {
    await sendTelegram({ name, email, subject, message })
    statusText.value = 'message sent! I will get back to you soon.'
    statusClass.value = 'success'
    e.target.reset()
  } catch (err) {
    if (err.message === 'not-configured') {
      statusText.value = 'telegram not configured yet.'
    } else {
      statusText.value = 'something went wrong. try again later.'
    }
    statusClass.value = 'error'
  } finally {
    sending.value = false
  }
}
</script>

<template>
  <section class="section section-alt" id="contact">
    <div class="container">
      <h2 class="section-title">Contact</h2>


      <div class="contact-grid">
        <div class="contact-info">
          <p class="contact-lead">
            Have a question, a project idea, or just want to say hi? My inbox is always open.
          </p>
          <ul class="contact-channels">
            <li>
              <span class="mono accent">Email</span>
              <a href="mailto:yanphayu@gmail.com">yanphayu@gmail.com</a>
            </li>
            <li>
              <span class="mono accent">GitHub</span>
              <a href="https://github.com/yanphayu" target="_blank" rel="noopener">github.com/yanphayu</a>
            </li>
            <li>
              <span class="mono accent">Telegram</span>
              <a href="https://t.me/yukkk99999" target="_blank" rel="noopener">@yukkk99999</a>
            </li>
          </ul>
        </div>

        <form ref="form" class="card contact-form" id="contact-form" novalidate @submit="onSubmit">
          <div class="form-row">
            <div class="form-group">
              <label for="name">Name</label>
              <input type="text" id="name" name="name" placeholder="Your name" autocomplete="name" required>
            </div>
            <div class="form-group">
              <label for="email">Email</label>
              <input type="email" id="email" name="email" placeholder="you@example.com" autocomplete="email" required>
            </div>
          </div>
          <div class="form-group">
            <label for="subject">Subject</label>
            <input type="text" id="subject" name="subject" placeholder="What's this about?" autocomplete="off">
          </div>
          <div class="form-group">
            <label for="message">Message</label>
            <textarea id="message" name="message" rows="5" placeholder="Write your message…" autocomplete="off" required></textarea>
          </div>
          <button type="submit" class="btn btn-primary" :disabled="sending">{{ sending ? 'Sending…' : 'Send Message' }}</button>
          <p class="form-status" :class="statusClass" role="status" aria-live="polite">{{ statusText }}</p>
        </form>
      </div>
    </div>
  </section>
</template>
