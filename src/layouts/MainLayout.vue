<template>
  <q-layout view="lHh Lpr lFf" class="bg-dark-page text-white">
    <q-page-container>
      <router-view />
    </q-page-container>
  </q-layout>
</template>

<script setup>
import { useQuasar } from 'quasar'
import { onMounted } from 'vue'

const $q = useQuasar()

onMounted(() => {
  // Force dark mode for the terminal vibe
  $q.dark.set(true)
})
</script>
