<template>
  <q-page class="notebook-shell">
    <aside class="machine-rail">
      <div class="brand-block">
        <img class="brand-mark" :src="brandMark" alt="Observation OS" />
        <div>
          <p class="eyebrow">Observation OS</p>
          <h1>Machine notebooks</h1>
        </div>
      </div>

      <div class="rail-actions">
        <q-btn
          unelevated
          icon="add"
          label="New notebook"
          class="new-entry-btn"
          @click="createEntry"
        />
        <q-btn
          flat
          round
          icon="terminal"
          class="rail-icon-btn"
          :class="{ active: terminalOpen }"
          @click="toggleTerminal"
        >
          <q-tooltip>Toggle command log</q-tooltip>
        </q-btn>
        <q-btn
          flat
          round
          icon="logout"
          class="rail-icon-btn"
          v-if="userEmail"
          @click="signOutAndRedirect"
        >
          <q-tooltip>Sign out</q-tooltip>
        </q-btn>
      </div>

      <nav class="machine-list" aria-label="Machine notebooks">
        <button
          v-for="machine in machines"
          :key="machine.id"
          type="button"
          class="machine-tab"
          :class="{ active: machine.id === selectedMachine.id }"
          @click="selectedId = machine.id"
        >
          <span class="machine-number">{{ machine.number }}</span>
          <span>
            <strong>{{ machine.name }}</strong>
            <small>{{ machine.type }}</small>
          </span>
        </button>
      </nav>

      <div class="rail-footer">
        <p>Activity grid</p>
        <div class="activity-calendar" aria-label="Notebook activity calendar">
          <div v-for="day in activityDays" :key="day.label" class="activity-day" :class="{ active: day.active }">
            <span>{{ day.label }}</span>
          </div>
        </div>
        <small>{{ activeActivityCount }} active days in this notebook</small>
      </div>
    </aside>

    <main class="notebook-stage">
      <div class="workspace-grid">
        <section class="notebook-page">
          <header class="entry-header">
            <div>
              <p class="eyebrow">{{ selectedMachine.number }}</p>
              <h2>{{ selectedMachine.name }}</h2>
              <p class="machine-type">{{ selectedMachine.type }}</p>
            </div>

            <div class="entry-meta">
              <label>
                <span>Date</span>
                <input v-model="selectedMachine.date" type="text" />
              </label>
              <label>
                <span>Status</span>
                <select v-model="selectedMachine.status">
                  <option>Observing</option>
                  <option>Sketching</option>
                  <option>Testing</option>
                  <option>Archived</option>
                </select>
              </label>
            </div>
          </header>

          <section class="question-strip">
            <span>Question</span>
            <textarea v-model="selectedMachine.question" rows="2" />
          </section>

          <section class="knowledge-strip">
            <div>
              <span>Knowledge links</span>
              <p>Reusable articles this notebook is already touching.</p>
            </div>
            <div class="knowledge-links">
              <button
                v-for="linkId in selectedMachine.libraryRefs"
                :key="linkId"
                type="button"
                :class="{ active: linkId === selectedLibraryId }"
                @click="openLibrary(linkId)"
              >
                {{ libraryMap[linkId]?.title || linkId }}
              </button>
            </div>
          </section>

          <div class="notebook-grid">
            <article
              v-for="section in selectedMachine.sections"
             :key="section.sectionKey || section.id"
              class="note-section"
              :class="section.kind"
            >
             <header class="section-heading">
               <div class="section-title-wrap">
                 <q-icon :name="section.icon" />
                 <div>
                   <h3>{{ section.title }}</h3>
                   <p v-if="section.displayType && section.displayType !== 'text'" class="section-kind">
                     {{ section.displayType }}
                   </p>
                 </div>
               </div>

               <div class="section-actions">
                 <button
                   v-if="editingSectionKey !== (section.sectionKey || section.id)"
                   type="button"
                   class="section-action-btn"
                   @click="beginSectionEdit(section)"
                 >
                   Edit
                 </button>
                 <template v-else>
                   <button type="button" class="section-action-btn secondary" @click="cancelSectionEdit">
                     Cancel
                   </button>
                   <button type="button" class="section-action-btn primary" @click="saveSectionEdit(section)">
                     Save
                   </button>
                 </template>
               </div>
             </header>

             <div v-if="editingSectionKey === (section.sectionKey || section.id)" class="section-editor">
               <textarea v-model="editingDraft" rows="8"></textarea>
             </div>

             <div v-else>
               <div v-if="section.displayType === 'sketch'" class="sketch-pad">
                 <div class="boom"></div>
                 <div class="arm"></div>
                 <div class="bucket"></div>
                 <div class="track"></div>
                 <p>{{ section.content }}</p>
               </div>

               <ul v-else-if="Array.isArray(section.content)" class="note-list">
                 <li v-for="(item, index) in section.content" :key="`${section.sectionKey || section.id}-${index}`">
                   <span v-if="typeof item === 'string'">{{ item }}</span>
                   <span v-else-if="item?.text">{{ item.text }}</span>
                   <span v-else>{{ JSON.stringify(item) }}</span>
                 </li>
               </ul>

               <div v-else-if="section.content && typeof section.content === 'object'" class="structured-payload">
                 <pre>{{ JSON.stringify(section.content, null, 2) }}</pre>
               </div>

               <p v-else>{{ section.content }}</p>
             </div>

             <div v-if="section.metadata && Object.keys(section.metadata).length" class="section-metadata">
               <span v-if="section.metadata.status" class="meta-pill">{{ section.metadata.status }}</span>
               <span v-for="tag in section.metadata.tags || []" :key="tag" class="meta-pill">{{ tag }}</span>
               <span v-if="section.metadata.units" class="meta-pill">{{ section.metadata.units }}</span>
             </div>

             <div v-if="section.references?.length" class="reference-row">
               <button
                 v-for="reference in section.references"
                 :key="reference"
                 type="button"
                 @click="openLibrary(reference)"
               >
                 {{ libraryMap[reference]?.title || reference }}
               </button>
             </div>
            </article>
          </div>
        </section>

        <aside class="library-panel">
          <header>
            <p class="eyebrow">Engineering library</p>
            <h2>{{ activeLibrary.title }}</h2>
            <p>{{ activeLibrary.path.join(' / ') }}</p>
          </header>

          <div class="library-tabs">
            <button
              v-for="library in engineeringLibraries"
              :key="library.id"
              type="button"
              :class="{ active: library.id === activeLibrary.category }"
              @click="openLibrary(library.entries[0].id)"
            >
              {{ library.title }}
            </button>
          </div>

          <article class="library-card">
            <div class="library-card-head">
              <q-icon :name="activeLibrary.icon" />
              <span>{{ activeLibrary.kind }}</span>
            </div>
            <p>{{ activeLibrary.summary }}</p>

            <div class="article-sections">
              <section v-for="section in activeLibrary.sections" :key="section.title">
                <h3>{{ section.title }}</h3>
                <ul>
                  <li v-for="item in section.items" :key="item">{{ item }}</li>
                </ul>
              </section>
            </div>
          </article>

          <div class="library-tree">
            <section v-for="library in engineeringLibraries" :key="library.id">
              <h3>{{ library.title }}</h3>
              <button
                v-for="entry in library.entries"
                :key="entry.id"
                type="button"
                :class="{ active: entry.id === selectedLibraryId }"
                @click="openLibrary(entry.id)"
              >
                <span>{{ entry.title }}</span>
                <small>{{ entry.path.at(-1) }}</small>
              </button>
            </section>
          </div>
        </aside>
      </div>

      <aside class="terminal-dock" :class="{ open: terminalOpen }">
        <div class="terminal-head">
          <span>zinja@observation:~$</span>
          <q-btn flat dense round icon="close" @click="terminalOpen = false">
            <q-tooltip>Close command log</q-tooltip>
          </q-btn>
        </div>

        <div class="terminal-log" ref="scrollArea">
          <div
            v-for="(item, index) in history"
            :key="index"
            class="history-item"
            v-html="item.content"
          ></div>
        </div>

        <form @submit.prevent="execute" class="command-row">
          <span>&gt;</span>
          <input
            ref="cmdInput"
            v-model="currentInput"
            type="text"
            autocomplete="off"
            spellcheck="false"
            placeholder="/append capture a note"
          />
        </form>
      </aside>
    </main>
  </q-page>
</template>

<script setup>
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useNotebookWorkspace } from 'src/composables/useNotebookWorkspace'
import { useSupabaseAuth } from 'src/composables/useSupabaseAuth'
import brandMark from 'src/assets/brand-mark.svg'

const router = useRouter()
const { user, signOut } = useSupabaseAuth()
const userEmail = computed(() => user.value?.email || '')

const signOutAndRedirect = async () => {
  await signOut()
  router.push('/login')
}

const {
  terminalOpen,
  selectedId,
  selectedLibraryId,
  currentInput,
  cmdInput,
  scrollArea,
  machines,
  engineeringLibraries,
  selectedMachine,
  libraryMap,
  activeLibrary,
  openLibrary,
  createEntry,
  updateSectionContent,
  toggleTerminal,
  history,
  execute,
} = useNotebookWorkspace()

const editingSectionKey = ref('')
const editingDraft = ref('')

const serializeSectionContent = (content) => {
  if (Array.isArray(content) || (content && typeof content === 'object')) {
    return JSON.stringify(content, null, 2)
  }

  return typeof content === 'string' ? content : ''
}

const beginSectionEdit = (section) => {
  editingSectionKey.value = section.sectionKey || section.id
  editingDraft.value = serializeSectionContent(section.content)
}

const cancelSectionEdit = () => {
  editingSectionKey.value = ''
  editingDraft.value = ''
}

const saveSectionEdit = async (section) => {
  const sectionKey = section.sectionKey || section.id
  let nextContent = editingDraft.value.trim()

  if (!nextContent) {
    nextContent = ''
  } else {
    try {
      const parsedValue = JSON.parse(nextContent)
      if (Array.isArray(parsedValue) || (parsedValue && typeof parsedValue === 'object')) {
        nextContent = parsedValue
      }
    } catch {
      nextContent = editingDraft.value
    }
  }

  await updateSectionContent(sectionKey, nextContent)
  editingSectionKey.value = ''
  editingDraft.value = ''
}

const activityDays = computed(() => {
  const today = new Date()
  const start = new Date(today.getFullYear(), today.getMonth(), 1)
  const days = []
  const activityDates = selectedMachine.value?.activityDates || []

  for (let index = 0; index < 28; index += 1) {
    const current = new Date(start)
    current.setDate(start.getDate() + index)
    const label = current.getDate().toString()
    const active = activityDates.includes(current.toISOString().slice(0, 10))

    days.push({ label, active })
  }

  return days
})

const activeActivityCount = computed(() => activityDays.value.filter((day) => day.active).length)
</script>
