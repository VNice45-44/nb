<template>
  <q-page class="login-page">
    <div class="login-card-wrapper">
      <div class="login-card">
        <div class="brand-block">
          <img class="brand-mark" :src="brandMark" alt="Observation OS" />
          <div>
            <p class="eyebrow">Observation OS</p>
            <h1>Sign in with email</h1>
          </div>
        </div>

        <p class="login-copy">Enter your email address and I'll send you a secure sign-in link.</p>

        <q-form @submit.prevent="submitEmail" class="login-form">
          <q-input
            v-model="email"
            label="Email address"
            type="email"
            autofocus
            lazy-rules
            :rules="[
              (val) => !!val || 'Email is required',
              (val) => /.+@.+\..+/.test(val) || 'Enter a valid email',
            ]"
            class="login-input"
          />

          <div class="login-actions">
            <q-btn
              type="submit"
              label="Send sign-in link"
              unelevated
              color="primary"
              :loading="isLoading"
            />
          </div>
        </q-form>

        <div class="login-status">
          <p v-if="message" class="success">{{ message }}</p>
          <p v-if="error" class="error">{{ error }}</p>
          <p v-if="userEmail" class="signed-in">
            Signed in as <strong>{{ userEmail }}</strong
            >. Redirecting...
          </p>
        </div>
      </div>
    </div>
  </q-page>
</template>

<script setup>
import { computed, onMounted, ref, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
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
