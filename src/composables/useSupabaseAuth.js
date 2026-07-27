import { ref } from 'vue'
import { supabase } from 'src/composables/useSupabaseClient'

const user = ref(null)
const session = ref(null)
const authLoading = ref(true)
const authError = ref(null)
const authMessage = ref(null)
const initialized = ref(false)

export async function initSupabaseAuth() {
  if (initialized.value) {
    return session.value
  }

  authLoading.value = true

  if (!supabase) {
    authError.value =
      'Supabase is not configured yet. Add VITE_SUPABASE_URL/VITE_SUPABASE_PUBLISHABLE_KEY (or the equivalent SUPABASE_* env vars) to enable email sign-in.'
    initialized.value = true
    authLoading.value = false
    return null
  }

  const { data, error } = await supabase.auth.getSession()
  if (error) {
    authError.value = error.message
  }

  session.value = data?.session ?? null
  user.value = data?.session?.user ?? null
  initialized.value = true
  authLoading.value = false

  supabase.auth.onAuthStateChange((event, newSession) => {
    session.value = newSession ?? null
    user.value = newSession?.user ?? null
  })

  return session.value
}

export async function loginWithEmail(email) {
  authLoading.value = true
  authError.value = null
  authMessage.value = null

  if (!supabase) {
    authLoading.value = false
    authError.value =
      'Supabase is not configured yet. Add your environment variables to enable email login.'
    return { error: new Error(authError.value) }
  }

  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: {
      emailRedirectTo: window.location.origin,
    },
  })

  if (error) {
    authError.value = error.message
  } else {
    authMessage.value = 'Check your inbox for a magic sign-in link.'
  }

  authLoading.value = false
  return { error }
}

export async function signOut() {
  authLoading.value = true

  if (!supabase) {
    authLoading.value = false
    user.value = null
    session.value = null
    return { error: null }
  }

  const { error } = await supabase.auth.signOut()
  authLoading.value = false

  if (error) {
    authError.value = error.message
  } else {
    user.value = null
    session.value = null
  }

  return { error }
}

export function useSupabaseAuth() {
  return {
    user,
    session,
    authLoading,
    authError,
    authMessage,
    initSupabaseAuth,
    loginWithEmail,
    signOut,
  }
}
