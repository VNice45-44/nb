import { computed, nextTick, onMounted, ref } from 'vue'
import { useSupabaseClient } from 'src/composables/useSupabaseClient'
import { useSupabaseAuth } from 'src/composables/useSupabaseAuth'
import { commandList, responses } from 'src/data/terminalData'

const sectionIconFallback = (title, displayType) => {
  if (displayType === 'sketch') return 'gesture'
  if (title?.toLowerCase().includes('failure')) return 'warning'
  if (title?.toLowerCase().includes('math')) return 'functions'
  if (title?.toLowerCase().includes('observation')) return 'visibility'
  if (title?.toLowerCase().includes('ideas')) return 'lightbulb'
  return 'article'
}

const normalizeSectionContent = (payload) => {
  if (Array.isArray(payload)) return payload
  if (typeof payload === 'string') return payload
  if (!payload) return ''
  if (Array.isArray(payload.items)) return payload.items
  if (typeof payload.text === 'string') return payload.text
  if (payload.content !== undefined) return normalizeSectionContent(payload.content)
  return JSON.stringify(payload, null, 2)
}

const normalizeMachineSection = (raw) => {
  return {
    id: raw.id,
    title: raw.title || 'Untitled section',
    icon: raw.icon || sectionIconFallback(raw.title, raw.display_type),
    kind: raw.display_type === 'sketch' ? 'sketch' : 'text',
    content: normalizeSectionContent(raw.content),
    references: Array.isArray(raw.references)
      ? raw.references
      : Array.isArray(raw.sections)
        ? raw.sections.map((item) => item.reference).filter(Boolean)
        : [],
  }
}

const normalizeLibraryEntry = (entry, topic) => {
  const ui = entry.ui || {}
  const summary = entry.summary || ui.summary || 'No summary available.'
  const sections = Array.isArray(ui.sections)
    ? ui.sections
    : [
        {
          title: 'Overview',
          items: [summary],
        },
      ]

  return {
    id: entry.id,
    slug: entry.slug,
    title: entry.title,
    kind: ui.kind || 'Reference',
    icon: topic.icon || 'menu_book',
    category: topic.slug || topic.title,
    path: [topic.title, entry.title],
    summary,
    sections,
    ui,
  }
}

const normalizeMachine = (raw, index) => {
  const ui = raw.ui || {}
  const dateValue = ui.date || raw.created_at || ''

  return {
    id: raw.id,
    number: ui.number || `Machine #${index + 1}`,
    name: raw.title || 'Untitled machine',
    type: ui.type || 'Notebook entry',
    date: dateValue.slice(0, 10),
    status: raw.status || 'Observing',
    progress: typeof ui.progress === 'number' ? ui.progress : 0,
    question: ui.question || raw.description || 'Capture the machine question here.',
    libraryRefs: Array.isArray(raw.library_refs) ? raw.library_refs : [],
    sections: [],
    ui,
    raw,
  }
}

const buildLibraryMap = (entries) => {
  const map = {}
  entries.forEach((entry) => {
    map[entry.id] = entry
    if (entry.slug) {
      map[entry.slug] = entry
    }
  })
  return map
}

const FALLBACK_MACHINES = [
  {
    id: 'offline-machine-001',
    number: 'Machine #001',
    name: 'Excavator',
    type: 'Hydraulic earth mover',
    date: '2026-07-05',
    status: 'Observing',
    progress: 42,
    question: 'How does an excavator multiply force?',
    libraryRefs: ['box-beams', 'hydraulic-cylinders', 'moments', 'pins-bushings'],
    sections: [
      {
        id: 'offline-section-1',
        title: 'Observations',
        icon: 'visibility',
        kind: 'text',
        content: [
          'The operator moves tiny levers, but the bucket tears through compacted soil.',
          'The boom moves slowly and deliberately, suggesting force is being traded for speed.',
          'The machine anchors itself through mass, tracks, and a wide contact patch.',
        ],
      },
      {
        id: 'offline-section-2',
        title: 'Sketches',
        icon: 'gesture',
        kind: 'sketch',
        content: 'Boom, stick, bucket, cylinders, tracks. Draw force arrows next.',
        references: ['box-beams', 'hydraulic-cylinders', 'pins-bushings'],
      },
    ],
  },
]

const FALLBACK_LIBRARY = [
  {
    id: 'structures',
    title: 'Structures',
    icon: 'view_in_ar',
    entries: [
      {
        id: 'box-beams',
        slug: 'box-beams',
        category: 'structures',
        title: 'Box beams',
        kind: 'Structural element',
        icon: 'view_in_ar',
        path: ['Structures', 'Beams', 'Box beams'],
        summary:
          'Closed beam sections resist bending and torsion well for their weight, which is why machine arms often look like hollow boxes instead of solid bars.',
        sections: [
          {
            title: 'Observation',
            items: ['Look for welded seams, gussets, tapered depth, and load paths toward pivots.'],
          },
          {
            title: 'Math',
            items: [
              'Bending stress depends on moment and section modulus.',
              'Buckling and fatigue matter near holes and welds.',
            ],
          },
        ],
      },
    ],
  },
]

export function useNotebookWorkspace() {
  const { supabase } = useSupabaseClient()
  const { initSupabaseAuth } = useSupabaseAuth()

  const terminalOpen = ref(false)
  const selectedId = ref('')
  const selectedLibraryId = ref('')
  const currentInput = ref('')
  const cmdInput = ref(null)
  const scrollArea = ref(null)
  const machines = ref([])
  const engineeringLibraries = ref([])
  const libraryMap = ref({})
  const history = ref([])

  const selectedMachine = computed(() => {
    return (
      machines.value.find((machine) => machine.id === selectedId.value) ||
      machines.value[0] ||
      FALLBACK_MACHINES[0]
    )
  })

  const activeLibrary = computed(() => {
    return (
      libraryMap.value[selectedLibraryId.value] ||
      Object.values(libraryMap.value)[0] ||
      FALLBACK_LIBRARY[0].entries[0]
    )
  })

  const openLibrary = (reference) => {
    if (!reference) {
      return
    }

    if (libraryMap.value[reference]) {
      selectedLibraryId.value = reference
      return
    }

    const fallback = Object.values(libraryMap.value).find(
      (entry) => entry.slug === reference || entry.id === reference,
    )

    if (fallback) {
      selectedLibraryId.value = fallback.id
    }
  }

  const loadWorkspace = async () => {
    try {
      if (!supabase) {
        machines.value = FALLBACK_MACHINES
        engineeringLibraries.value = FALLBACK_LIBRARY
        libraryMap.value = buildLibraryMap(FALLBACK_LIBRARY[0].entries)
        selectedId.value = selectedId.value || FALLBACK_MACHINES[0].id
        selectedLibraryId.value = selectedLibraryId.value || FALLBACK_LIBRARY[0].entries[0]?.id
        return
      }

      const session = await initSupabaseAuth()
      const ownerId = session?.user?.id

      const machinesQuery = supabase.from('machines').select('*')
      if (ownerId) {
        machinesQuery.eq('owner_id', ownerId)
      }

      const [
        { data: machinesData, error: machinesError },
        { data: topicsData, error: topicsError },
        { data: entriesData, error: entriesError },
      ] = await Promise.all([
        machinesQuery.order('created_at', { ascending: false }),
        supabase.from('library_topics').select('*').order('sort_order', { ascending: true }),
        supabase.from('library_entries').select('*').order('title', { ascending: true }),
      ])

      if (machinesError || topicsError || entriesError) {
        console.warn('Backend fetch warnings:', machinesError, topicsError, entriesError)
      }

      if (Array.isArray(entriesData) && Array.isArray(topicsData)) {
        const topicsById = topicsData.reduce((acc, topic) => {
          acc[topic.id] = topic
          return acc
        }, {})

        const normalizedEntries = entriesData.map((entry) =>
          normalizeLibraryEntry(entry, topicsById[entry.topic_id] || {}),
        )
        const groupedTopics = topicsData.map((topic) => ({
          id: topic.id,
          title: topic.title,
          icon: topic.icon || 'menu_book',
          entries: normalizedEntries.filter(
            (entry) => entry.category === topic.slug || entry.category === topic.title,
          ),
        }))

        engineeringLibraries.value = groupedTopics.filter((topic) => topic.entries.length > 0)
        libraryMap.value = buildLibraryMap(normalizedEntries)
        selectedLibraryId.value =
          libraryMap.value[selectedLibraryId.value]?.id ||
          normalizedEntries[0]?.id ||
          selectedLibraryId.value
      } else {
        engineeringLibraries.value = FALLBACK_LIBRARY
        libraryMap.value = buildLibraryMap(FALLBACK_LIBRARY[0].entries)
        selectedLibraryId.value = selectedLibraryId.value || FALLBACK_LIBRARY[0].entries[0]?.id
      }

      if (Array.isArray(machinesData)) {
        const machineIds = machinesData.map((machine) => machine.id)
        const sectionsData = machineIds.length
          ? await supabase
              .from('machine_sections')
              .select('*')
              .in('machine_id', machineIds)
              .order('sort_order', { ascending: true })
          : { data: [] }

        const machineSectionsByMachine = (sectionsData.data || []).reduce((acc, section) => {
          const normalized = normalizeMachineSection(section)
          const machineId = section.machine_id
          if (!acc[machineId]) acc[machineId] = []
          acc[machineId].push(normalized)
          return acc
        }, {})

        machines.value = machinesData.map((machine, index) => {
          const normalizedMachine = normalizeMachine(machine, index)
          normalizedMachine.sections = machineSectionsByMachine[machine.id] || []
          return normalizedMachine
        })

        if (!machines.value.find((machine) => machine.id === selectedId.value)) {
          selectedId.value = machines.value[0]?.id || ''
        }
      }

      if (!machines.value.length) {
        machines.value = FALLBACK_MACHINES
        selectedId.value = selectedId.value || FALLBACK_MACHINES[0].id
      }
    } catch (error) {
      console.warn('Unable to load workspace from backend:', error)
      machines.value = FALLBACK_MACHINES
      engineeringLibraries.value = FALLBACK_LIBRARY
      libraryMap.value = buildLibraryMap(FALLBACK_LIBRARY[0].entries)
      selectedId.value = selectedId.value || FALLBACK_MACHINES[0].id
      selectedLibraryId.value = selectedLibraryId.value || FALLBACK_LIBRARY[0].entries[0]?.id
    }
  }

  const createEntry = () => {
    const fallback = {
      id: `offline-${Date.now()}`,
      number: `Machine #${machines.value.length + 1}`,
      name: 'New notebook entry',
      type: 'Untitled observation',
      date: new Date().toISOString().slice(0, 10),
      status: 'Observing',
      progress: 0,
      question: 'Start by writing a machine question.',
      libraryRefs: [],
      sections: [
        {
          id: `section-${Date.now()}`,
          title: 'New section',
          icon: 'article',
          kind: 'text',
          content: 'Use this space to capture observations.',
        },
      ],
    }

    machines.value.unshift(fallback)
    selectedId.value = fallback.id
  }

  const toggleTerminal = () => {
    terminalOpen.value = !terminalOpen.value
    nextTick(() => {
      if (scrollArea.value) {
        scrollArea.value.scrollTop = scrollArea.value.scrollHeight
      }
    })
  }

  const execute = async () => {
    const trimmed = currentInput.value.trim()
    if (!trimmed) {
      return
    }

    const userCommand = `<div><strong style="color:#31ccec">$</strong> ${trimmed}</div>`
    history.value.push({ content: userCommand })

    if (trimmed === '/clear') {
      history.value = []
      currentInput.value = ''
      return
    }

    const response = responses[trimmed] || `<div>Unknown command: <strong>${trimmed}</strong></div>`
    history.value.push({ content: response })

    currentInput.value = ''

    nextTick(() => {
      if (scrollArea.value) {
        scrollArea.value.scrollTop = scrollArea.value.scrollHeight
      }
    })
  }

  onMounted(() => {
    loadWorkspace()
  })

  return {
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
    commandList,
  }
}
