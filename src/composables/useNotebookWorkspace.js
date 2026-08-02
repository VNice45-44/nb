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
  if (payload.value !== undefined) return payload.value
  if (payload.body !== undefined) return normalizeSectionContent(payload.body)
  if (typeof payload.summary === 'string') return payload.summary
  return payload
}

const extractSectionReferences = (raw, content) => {
  if (Array.isArray(raw.references) && raw.references.length) return raw.references

  const metadataRefs = Array.isArray(raw.metadata?.references) ? raw.metadata.references : []
  if (metadataRefs.length) return metadataRefs

  if (Array.isArray(content?.references) && content.references.length) return content.references

  if (Array.isArray(raw.sections)) {
    return raw.sections
      .flatMap((item) => {
        if (Array.isArray(item?.items)) {
          return item.items.map((entry) => entry.reference).filter(Boolean)
        }
        if (item?.reference) {
          return [item.reference]
        }
        return []
      })
      .filter(Boolean)
  }

  return []
}

const normalizeMachineSection = (raw) => {
  const content = normalizeSectionContent(raw.content)

  return {
    id: raw.id,
    sectionKey: raw.section_key || raw.id,
    title: raw.title || 'Untitled section',
    icon: raw.icon || sectionIconFallback(raw.title, raw.display_type),
    displayType: raw.display_type || 'text',
    kind: raw.display_type === 'sketch' ? 'sketch' : raw.display_type || 'text',
    content,
    references: extractSectionReferences(raw, content),
    metadata: raw.metadata || {},
    raw,
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
    name: 'Gear train concept',
    type: 'Mechanical power transmission',
    date: '2026-08-01',
    status: 'Sketching',
    progress: 28,
    question: 'How do we transfer torque through a compact, durable gear pair?',
    libraryRefs: ['gear-train', 'shaft-design', 'bearing-loads'],
    sections: [
      {
        id: 'offline-section-1',
        sectionKey: 'gear-intent',
        title: 'Design intent',
        icon: 'article',
        display_type: 'text',
        content: [
          'The target is a compact gearbox that couples a motor to an output shaft without excessive size.',
          'We want the assembly to be easy to inspect and service, with clear access to lubrication points.',
        ],
      },
      {
        id: 'offline-section-2',
        sectionKey: 'gear-sketch',
        title: 'Sketch',
        icon: 'gesture',
        display_type: 'sketch',
        content: 'Pinion, idler, output gear, input shaft, and support bearings. Mark the contact pattern next.',
        references: ['gear-train', 'shaft-design'],
      },
      {
        id: 'offline-section-3',
        sectionKey: 'gear-checklist',
        title: 'Checklist',
        icon: 'checklist',
        display_type: 'checklist',
        content: ['Confirm module and face width', 'Verify shaft spacing', 'Check lubrication access'],
        metadata: { status: 'open', tags: ['gear', 'assembly'] },
      },
      {
        id: 'offline-section-4',
        sectionKey: 'gear-calculation',
        title: 'Calculation',
        icon: 'functions',
        display_type: 'calculation',
        content: {
          formula: 'T = F × r',
          values: {
            force: '150 N',
            radius: '0.08 m',
            result: '12 N·m',
          },
        },
        metadata: { units: 'N·m' },
      },
    ],
  },
  {
    id: 'offline-machine-002',
    number: 'Machine #002',
    name: 'Flatbed trailer concept',
    type: 'Light-duty transport platform',
    date: '2026-08-02',
    status: 'Observing',
    progress: 18,
    question: 'How do we keep the deck stiff while staying light and easy to tow?',
    libraryRefs: ['trailer-frame', 'coupler', 'load-paths'],
    sections: [
      {
        id: 'offline-section-5',
        sectionKey: 'trailer-framework',
        title: 'Frame assumptions',
        icon: 'view_in_ar',
        display_type: 'assumption',
        content: [
          'Use a rectangular frame with cross-members at the wheelbase and deck edges.',
          'Use the tongue as a load path to the hitch rather than a separate brace.',
        ],
        metadata: { tags: ['trailer', 'frame'] },
      },
      {
        id: 'offline-section-6',
        sectionKey: 'trailer-measurement',
        title: 'Measurement',
        icon: 'straighten',
        display_type: 'measurement',
        content: {
          deckWidth: '1.8 m',
          deckLength: '3.2 m',
          payloadTarget: '800 kg',
        },
      },
    ],
  },
]

const FALLBACK_LIBRARY = [
  {
    id: 'power-transmission',
    title: 'Power transmission',
    icon: 'sync_alt',
    entries: [
      {
        id: 'gear-train',
        slug: 'gear-train',
        category: 'power-transmission',
        title: 'Gear train',
        kind: 'Principle',
        icon: 'sync_alt',
        path: ['Power transmission', 'Gear train'],
        summary:
          'Gear trains trade speed for torque while keeping the motion path controlled, which is useful for compact mechanical drives.',
        sections: [
          {
            title: 'Observation',
            items: ['Check tooth contact and center distance before assuming the train is correct.'],
          },
          {
            title: 'Calculation',
            items: ['Torque and speed scale through the gear ratio.'],
          },
        ],
      },
      {
        id: 'shaft-design',
        slug: 'shaft-design',
        category: 'power-transmission',
        title: 'Shaft design',
        kind: 'Design pattern',
        icon: 'engineering',
        path: ['Power transmission', 'Shaft design'],
        summary: 'Shafts need enough diameter and support to carry torque, bending, and vibration without excessive deflection.',
        sections: [
          {
            title: 'Observation',
            items: ['Support spacing and keyway placement change the stress pattern dramatically.'],
          },
        ],
      },
    ],
  },
  {
    id: 'structures',
    title: 'Structures',
    icon: 'view_in_ar',
    entries: [
      {
        id: 'trailer-frame',
        slug: 'trailer-frame',
        category: 'structures',
        title: 'Trailer frame',
        kind: 'Structural element',
        icon: 'view_in_ar',
        path: ['Structures', 'Trailer frame'],
        summary: 'A trailer bed needs a clear load path from the deck to the axle and hitch so the platform stays stiff and predictable.',
        sections: [
          {
            title: 'Observation',
            items: ['Cross-members near the axle and tongue reduce twist.'],
          },
        ],
      },
      {
        id: 'coupler',
        slug: 'coupler',
        category: 'structures',
        title: 'Coupler',
        kind: 'Connection',
        icon: 'link',
        path: ['Structures', 'Coupler'],
        summary: 'The coupler should present a stable, repeatable connection point while keeping the trailer easy to attach and detach.',
        sections: [
          {
            title: 'Observation',
            items: ['Misalignment at the hitch creates bending that the frame must absorb.'],
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
          sectionKey: `section-${Date.now()}`,
          title: 'New section',
          icon: 'article',
          display_type: 'text',
          kind: 'text',
          content: 'Use this space to capture observations.',
        },
      ],
    }

    machines.value.unshift(fallback)
    selectedId.value = fallback.id
  }

  const updateSectionContent = async (sectionKeyOrId, nextContent, metadata = {}) => {
    const targetMachine = machines.value.find((machine) =>
      machine.sections.some((section) => section.sectionKey === sectionKeyOrId || section.id === sectionKeyOrId),
    )

    if (!targetMachine) {
      return null
    }

    const targetSection = targetMachine.sections.find(
      (section) => section.sectionKey === sectionKeyOrId || section.id === sectionKeyOrId,
    )

    if (!targetSection) {
      return null
    }

    const nextMetadata = {
      ...(targetSection.metadata || {}),
      ...metadata,
    }

    targetSection.content = nextContent
    targetSection.metadata = nextMetadata

    if (supabase && targetSection.id) {
      const { error } = await supabase
        .from('machine_sections')
        .update({
          content: nextContent,
          metadata: nextMetadata,
        })
        .eq('id', targetSection.id)

      if (error) {
        console.warn('Unable to persist section content:', error)
      }
    }

    return targetSection
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
    updateSectionContent,
    toggleTerminal,
    history,
    execute,
    commandList,
  }
}
