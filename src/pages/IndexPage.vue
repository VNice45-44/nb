<template>
  <q-page class="notebook-shell">
    <aside class="machine-rail">
      <div class="brand-block">
        <div class="brand-mark">OS</div>
        <div>
          <p class="eyebrow">Observation OS</p>
          <h1>Machine notebooks</h1>
        </div>
      </div>

      <div class="rail-actions">
        <q-btn unelevated icon="add" label="New entry" class="new-entry-btn" @click="createEntry" />
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
        <p>Notebook growth</p>
        <div class="growth-meter">
          <span :style="{ width: selectedMachine.progress + '%' }"></span>
        </div>
        <small>{{ selectedMachine.progress }}% mapped, still messy</small>
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
              :key="section.title"
              class="note-section"
              :class="section.kind"
            >
              <header>
                <q-icon :name="section.icon" />
                <h3>{{ section.title }}</h3>
              </header>

              <div v-if="section.kind === 'sketch'" class="sketch-pad">
                <div class="boom"></div>
                <div class="arm"></div>
                <div class="bucket"></div>
                <div class="track"></div>
                <p>{{ section.content }}</p>
              </div>

              <ul v-else-if="Array.isArray(section.content)" class="note-list">
                <li v-for="item in section.content" :key="item">{{ item }}</li>
              </ul>

              <p v-else>{{ section.content }}</p>

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
            placeholder="/help"
          />
        </form>
      </aside>
    </main>
  </q-page>
</template>

<script setup>
import { useNotebookWorkspace } from 'src/composables/useNotebookWorkspace'

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
  toggleTerminal,
  history,
  execute,
} = useNotebookWorkspace()
</script>
