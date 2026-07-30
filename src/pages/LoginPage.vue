<template>
  <q-page class="login-terminal-page">
    <section class="login-terminal-shell">
      <header class="login-terminal-brand">
        <img class="brand-mark" :src="brandMark" alt="Observation OS" />
        <div>
          <p class="eyebrow">Observation OS</p>
          <h1>Email access terminal</h1>
        </div>
      </header>

      <div class="login-terminal-window">
        <div class="login-terminal-bar">
          <span>zinja@observation:~/access</span>
          <span>AUTH // EMAIL ONLY</span>
        </div>

        <div class="login-terminal-log">
          <p class="terminal-muted">Observation OS access layer initialized.</p>
          <p>
            <span class="prompt-prefix">zinja@system:~$</span>
            <span class="cmd-text">/help</span>
          </p>
          <div class="terminal-response">
            <div>[System Directives Available]:</div>
            <ul>
              <li v-for="item in commandList" :key="item.command">
                <strong>{{ item.command }}</strong> - {{ item.description }}
              </li>
            </ul>
          </div>
          <p>
            <span class="prompt-prefix">zinja@system:~$</span>
            <span class="cmd-text">/contact</span>
          </p>
          <div class="terminal-response" v-html="responses['/contact']"></div>
          <p>
            <span class="prompt-prefix">zinja@system:~$</span>
            <span class="cmd-text">request email access</span>
          </p>
        </div>

        <q-form @submit.prevent="submitEmail" class="login-terminal-form">
          <label class="terminal-email-row">
            <span class="prompt-prefix">email:</span>
            <input
              v-model="email"
              type="email"
              autofocus
              autocomplete="email"
              spellcheck="false"
              placeholder="you@example.com"
              aria-label="Email address"
            />
          </label>

          <div class="login-terminal-actions">
            <q-btn
              type="submit"
              unelevated
              icon="send"
              label="Send sign-in link"
              class="terminal-submit-btn"
              :loading="isLoading"
            />
          </div>
        </q-form>

        <div class="login-terminal-status" aria-live="polite">
          <p v-if="message" class="success">{{ message }}</p>
          <p v-if="error" class="error">{{ error }}</p>
          <p v-if="userEmail" class="signed-in">
            Signed in as <strong>{{ userEmail }}</strong
            >. Redirecting...
          </p>
          <p v-if="!message && !error && !userEmail" class="terminal-muted">
            Wait for a magic link. No password stored here.
          </p>
        </div>
      </div>
    </section>
  </q-page>
</template>

<script setup>
import { computed, onMounted, ref, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { commandList, responses } from 'src/data/terminalData'
import { useSupabaseAuth, initSupabaseAuth, loginWithEmail } from 'src/composables/useSupabaseAuth'
import brandMark from 'src/assets/brand-mark.svg'

const router = useRouter()
const route = useRoute()
const email = ref('')
const { user, authLoading, authMessage } = useSupabaseAuth()
const message = ref('')
const error = ref('')

const userEmail = computed(() => user.value?.email || '')
const isLoading = computed(() => authLoading.value)

const submitEmail = async () => {
  error.value = ''
  message.value = ''

  if (!email.value) {
    error.value = 'Please enter your email address.'
    return
  }

  const { error: authErr } = await loginWithEmail(email.value)
  if (authErr) {
    error.value = authErr.message
    return
  }

  message.value = authMessage.value || 'Check your inbox for the sign-in link.'
}

watch(
  () => user.value,
  (currentUser) => {
    if (currentUser) {
      const redirectTo = route.query.redirect || '/'
      router.replace(redirectTo)
    }
  },
)

onMounted(async () => {
  await initSupabaseAuth()
  if (user.value) {
    const redirectTo = route.query.redirect || '/'
    router.replace(redirectTo)
  }
})
</script>
