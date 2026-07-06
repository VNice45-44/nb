import { computed, nextTick, ref } from 'vue'

export function useNotebookWorkspace() {
  const terminalOpen = ref(false)
  const selectedId = ref('excavator')
  const selectedLibraryId = ref('box-beams')
  const currentInput = ref('')
  const cmdInput = ref(null)
  const scrollArea = ref(null)

  const machines = ref([
    {
      id: 'excavator',
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
          title: 'Observations',
          icon: 'visibility',
          content: [
            'The operator moves tiny levers, but the bucket tears through compacted soil.',
            'The boom moves slowly and deliberately, suggesting force is being traded for speed.',
            'The machine anchors itself through mass, tracks, and a wide contact patch.',
          ],
        },
        {
          title: 'Sketches',
          icon: 'gesture',
          kind: 'sketch',
          content: 'Boom, stick, bucket, cylinders, tracks. Draw force arrows next.',
          references: ['box-beams', 'hydraulic-cylinders', 'pins-bushings'],
        },
        {
          title: 'Subsystems',
          icon: 'account_tree',
          content: [
            'Diesel engine powers hydraulic pumps.',
            'Hydraulic cylinders convert fluid pressure into linear motion.',
            'Boom, stick, and bucket form linked levers.',
            'Tracks distribute load and resist tipping.',
          ],
          references: ['hydraulic-pumps', 'hydraulic-cylinders', 'linkages'],
        },
        {
          title: 'Mathematics',
          icon: 'functions',
          content:
            'Force comes from pressure times piston area. The linkage then changes direction, travel, and leverage around each pivot.',
          references: ['pressure-area', 'moments'],
        },
        {
          title: 'Failure modes',
          icon: 'warning',
          content: [
            'Hydraulic leaks reduce pressure and control.',
            'Pins and bushings wear at high-load pivots.',
            'Overreaching can move the center of mass outside the stable base.',
          ],
          references: ['fatigue', 'pins-bushings', 'buckling'],
        },
        {
          title: 'Interesting questions',
          icon: 'help_outline',
          content: [
            'Where is the highest stress during a full bucket curl?',
            'How much useful work is lost as heat in the hydraulic system?',
            'Can an operator feel the load before a sensor reports it?',
          ],
        },
        {
          title: 'Further reading',
          icon: 'menu_book',
          content: [
            'Hydraulic cylinder sizing',
            'Free body diagrams for linkages',
            'Excavator stability charts',
          ],
          references: ['free-body-diagrams', 'moments'],
        },
        {
          title: 'Ideas for Observation OS',
          icon: 'lightbulb',
          content: [
            'Add a pressure x piston area calculator.',
            'Let sketches attach force arrows and notes.',
            'Compare machines by energy conversion chain.',
          ],
        },
      ],
    },
    {
      id: 'bicycle',
      number: 'Machine #002',
      name: 'Bicycle',
      type: 'Human-powered drivetrain',
      date: 'Unfiled',
      status: 'Sketching',
      progress: 18,
      question: 'How do gears turn weak leg motion into useful road speed?',
      libraryRefs: ['gears', 'chains', 'bearings', 'brakes'],
      sections: [
        {
          title: 'Observations',
          icon: 'visibility',
          content: ['Pedaling cadence stays similar while speed changes through gear choice.'],
        },
        {
          title: 'Sketches',
          icon: 'gesture',
          kind: 'sketch',
          content: 'Frame triangle, wheels, chain loop, crank, cassette.',
        },
        {
          title: 'Subsystems',
          icon: 'account_tree',
          content: ['Frame', 'Crank', 'Chain', 'Cassette', 'Brakes', 'Wheels'],
          references: ['chains', 'gears', 'bearings', 'brakes'],
        },
        {
          title: 'Mathematics',
          icon: 'functions',
          content: 'Gear ratio = front teeth divided by rear teeth.',
          references: ['gear-ratio'],
        },
        {
          title: 'Failure modes',
          icon: 'warning',
          content: ['Chain stretch', 'Brake fade', 'Spoke fatigue'],
        },
        {
          title: 'Interesting questions',
          icon: 'help_outline',
          content: ['Why does a larger wheel feel smoother over rough ground?'],
        },
        {
          title: 'Further reading',
          icon: 'menu_book',
          content: ['Gear inches', 'Rolling resistance', 'Human power curves'],
        },
        {
          title: 'Ideas for Observation OS',
          icon: 'lightbulb',
          content: ['Make a gear ratio playground.'],
        },
      ],
    },
    {
      id: 'crane',
      number: 'Machine #003',
      name: 'Tower crane',
      type: 'Counterweighted lifting system',
      date: 'Unfiled',
      status: 'Observing',
      progress: 24,
      question: 'How does a crane stay upright while lifting far from its mast?',
      libraryRefs: ['moments', 'box-beams', 'buckling', 'load-cells'],
      sections: [
        {
          title: 'Observations',
          icon: 'visibility',
          content: ['The counter-jib balances load moments around the tower.'],
        },
        {
          title: 'Sketches',
          icon: 'gesture',
          kind: 'sketch',
          content: 'Mast, slewing unit, jib, trolley, counterweight.',
        },
        {
          title: 'Subsystems',
          icon: 'account_tree',
          content: ['Mast', 'Jib', 'Trolley', 'Hoist', 'Counterweight', 'Foundation'],
          references: ['box-beams', 'wire-rope', 'load-cells'],
        },
        {
          title: 'Mathematics',
          icon: 'functions',
          content: 'Moment = force times distance from the pivot.',
          references: ['moments', 'free-body-diagrams'],
        },
        {
          title: 'Failure modes',
          icon: 'warning',
          content: ['Overload', 'High wind', 'Foundation movement'],
          references: ['buckling', 'fatigue'],
        },
        {
          title: 'Interesting questions',
          icon: 'help_outline',
          content: ['How do operators judge wind risk from the cab?'],
        },
        {
          title: 'Further reading',
          icon: 'menu_book',
          content: ['Load charts', 'Moment limits', 'Slewing mechanisms'],
        },
        {
          title: 'Ideas for Observation OS',
          icon: 'lightbulb',
          content: ['Build a moment balance visualizer.'],
        },
      ],
    },
  ])

  const engineeringLibraries = ref([
    {
      id: 'structures',
      title: 'Structures',
      entries: [
        {
          id: 'box-beams',
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
              items: [
                'Look for welded seams, gussets, tapered depth, and load paths toward pivots.',
              ],
            },
            {
              title: 'Math',
              items: [
                'Bending stress depends on moment and section modulus.',
                'Buckling and fatigue matter near holes and welds.',
              ],
            },
            {
              title: 'Applications',
              items: ['Excavator booms', 'Crane jibs', 'Trailer frames', 'Robotic arms'],
            },
          ],
        },
        {
          id: 'buckling',
          category: 'structures',
          title: 'Buckling',
          kind: 'Failure mode',
          icon: 'compress',
          path: ['Structures', 'Stability', 'Buckling'],
          summary:
            'A member can fail by suddenly deflecting sideways under compression long before the material crushes.',
          sections: [
            {
              title: 'Observation',
              items: ['Long, slender compression members deserve suspicion.'],
            },
            {
              title: 'Math',
              items: ['Critical load falls quickly as unsupported length increases.'],
            },
            { title: 'Applications', items: ['Crane masts', 'Hydraulic rods', 'Scaffold tubes'] },
          ],
        },
        {
          id: 'fatigue',
          category: 'structures',
          title: 'Fatigue',
          kind: 'Failure mode',
          icon: 'timeline',
          path: ['Structures', 'Failure modes', 'Fatigue'],
          summary:
            'Repeated loading can grow tiny cracks into serious failures even when each individual load seems acceptable.',
          sections: [
            {
              title: 'Observation',
              items: ['Watch weld toes, sharp corners, holes, and cyclic load paths.'],
            },
            {
              title: 'Math',
              items: ['Stress range and cycle count are more important than one dramatic peak.'],
            },
            { title: 'Applications', items: ['Boom pivots', 'Frames', 'Shafts', 'Springs'] },
          ],
        },
      ],
    },
    {
      id: 'mechanics',
      title: 'Mechanics',
      entries: [
        {
          id: 'linkages',
          category: 'mechanics',
          title: 'Linkages',
          kind: 'Mechanism',
          icon: 'device_hub',
          path: ['Mechanics', 'Mechanisms', 'Linkages'],
          summary:
            'Linkages move force through pivots, changing direction, speed, and leverage depending on geometry.',
          sections: [
            {
              title: 'Observation',
              items: ['Name the fixed link, input link, output link, and pivots.'],
            },
            { title: 'Math', items: ['Mechanical advantage changes as the angles change.'] },
            {
              title: 'Applications',
              items: ['Excavator buckets', 'Steering systems', 'Folding arms'],
            },
          ],
        },
        {
          id: 'pins-bushings',
          category: 'mechanics',
          title: 'Pins and bushings',
          kind: 'Machine element',
          icon: 'radio_button_checked',
          path: ['Mechanics', 'Machine elements', 'Pins and bushings'],
          summary:
            'Pins carry shear and bearing loads while bushings provide a replaceable wear surface around pivots.',
          sections: [
            {
              title: 'Observation',
              items: ['Look for grease fittings, ovalized holes, and side play.'],
            },
            { title: 'Failure modes', items: ['Wear', 'Galling', 'Shear', 'Poor lubrication'] },
            { title: 'Applications', items: ['Excavator joints', 'Loader arms', 'Hinges'] },
          ],
        },
        {
          id: 'gears',
          category: 'mechanics',
          title: 'Gears',
          kind: 'Machine element',
          icon: 'settings',
          path: ['Mechanics', 'Power transmission', 'Gears'],
          summary:
            'Gears transfer rotation through tooth contact, trading torque, speed, direction, or axis orientation.',
          sections: [
            {
              title: 'Types',
              items: ['Spur', 'Helical', 'Bevel', 'Worm', 'Planetary', 'Rack and pinion'],
            },
            {
              title: 'Failure modes',
              items: ['Tooth wear', 'Pitting', 'Backlash', 'Misalignment'],
            },
            {
              title: 'Applications',
              items: ['Bicycles', 'Differentials', 'Gearboxes', 'Machine tools'],
            },
          ],
        },
        {
          id: 'chains',
          category: 'mechanics',
          title: 'Chains',
          kind: 'Power transmission',
          icon: 'link',
          path: ['Mechanics', 'Power transmission', 'Chains'],
          summary:
            'Chains transmit force through tension and sprocket engagement, often with simple serviceability.',
          sections: [
            {
              title: 'Observation',
              items: ['Watch slack, alignment, lubrication, and sprocket tooth shape.'],
            },
            { title: 'Failure modes', items: ['Stretch', 'Corrosion', 'Pin wear', 'Derailment'] },
            { title: 'Applications', items: ['Bicycles', 'Motorcycles', 'Conveyors'] },
          ],
        },
        {
          id: 'bearings',
          category: 'mechanics',
          title: 'Bearings',
          kind: 'Machine element',
          icon: 'donut_large',
          path: ['Mechanics', 'Machine elements', 'Bearings'],
          summary: 'Bearings support loads while allowing controlled motion with reduced friction.',
          sections: [
            {
              title: 'Observation',
              items: ['Listen for noise, feel heat, check play, look for contamination.'],
            },
            { title: 'Types', items: ['Plain', 'Ball', 'Roller', 'Tapered roller', 'Thrust'] },
            { title: 'Applications', items: ['Wheels', 'Motors', 'Pumps', 'Gearboxes'] },
          ],
        },
        {
          id: 'brakes',
          category: 'mechanics',
          title: 'Brakes',
          kind: 'Machine element',
          icon: 'pan_tool',
          path: ['Mechanics', 'Machine elements', 'Brakes'],
          summary: 'Brakes convert motion into heat so a machine can slow, stop, or hold position.',
          sections: [
            {
              title: 'Observation',
              items: ['Look for heat, wear surfaces, actuation method, and cooling path.'],
            },
            {
              title: 'Failure modes',
              items: ['Fade', 'Glazing', 'Fluid boiling', 'Cable stretch'],
            },
            { title: 'Applications', items: ['Bicycles', 'Cranes', 'Cars', 'Winches'] },
          ],
        },
        {
          id: 'wire-rope',
          category: 'mechanics',
          title: 'Wire rope',
          kind: 'Lifting element',
          icon: 'linear_scale',
          path: ['Mechanics', 'Lifting', 'Wire rope'],
          summary:
            'Wire rope is flexible in bending but strong in tension, making it central to lifting systems.',
          sections: [
            {
              title: 'Observation',
              items: ['Inspect broken strands, kinks, corrosion, sheave wear, and drum winding.'],
            },
            { title: 'Failure modes', items: ['Fatigue', 'Abrasion', 'Crushing', 'Birdcaging'] },
            { title: 'Applications', items: ['Cranes', 'Elevators', 'Winches'] },
          ],
        },
      ],
    },
    {
      id: 'hydraulics',
      title: 'Hydraulics',
      entries: [
        {
          id: 'hydraulic-cylinders',
          category: 'hydraulics',
          title: 'Hydraulic cylinders',
          kind: 'Actuator',
          icon: 'open_in_full',
          path: ['Hydraulics', 'Actuators', 'Linear cylinders'],
          summary:
            'Hydraulic cylinders turn pressurized fluid into large linear forces across a piston area.',
          sections: [
            {
              title: 'Observation',
              items: ['Find rod side, cap side, seals, mounts, and exposed stroke.'],
            },
            {
              title: 'Math',
              items: ['Force equals pressure times piston area. Rod side has less area.'],
            },
            {
              title: 'Applications',
              items: ['Excavators', 'Dump trucks', 'Presses', 'Steering systems'],
            },
          ],
        },
        {
          id: 'hydraulic-pumps',
          category: 'hydraulics',
          title: 'Hydraulic pumps',
          kind: 'Power source',
          icon: 'sync',
          path: ['Hydraulics', 'Pumps', 'Gear / piston / vane'],
          summary:
            'Pumps create flow. System resistance and valves determine the pressure that develops.',
          sections: [
            { title: 'Types', items: ['Gear pump', 'Piston pump', 'Vane pump'] },
            {
              title: 'Observation',
              items: ['Listen for cavitation, heat, noise, and slow actuator response.'],
            },
            { title: 'Applications', items: ['Excavators', 'Loaders', 'Hydraulic presses'] },
          ],
        },
        {
          id: 'pressure-area',
          category: 'hydraulics',
          title: 'Pressure x area',
          kind: 'Engineering math',
          icon: 'calculate',
          path: ['Hydraulics', 'Mathematics', 'Pressure x area'],
          summary:
            'Hydraulics multiply force because modest pressure acting over a large piston area creates large output force.',
          sections: [
            { title: 'Formula', items: ['Force = pressure x area'] },
            {
              title: 'Observation',
              items: ['A larger cylinder can push harder at the same pressure.'],
            },
            {
              title: 'Applications',
              items: ['Excavator boom lift', 'Hydraulic jack', 'Brake caliper'],
            },
          ],
        },
      ],
    },
    {
      id: 'mathematics',
      title: 'Mathematics',
      entries: [
        {
          id: 'moments',
          category: 'mathematics',
          title: 'Moments',
          kind: 'Engineering math',
          icon: 'rotate_90_degrees_ccw',
          path: ['Mathematics', 'Statics', 'Moments'],
          summary:
            'A moment is turning effect: force applied at a distance from a pivot. It explains cranes, breaker bars, doors, and wheel nuts.',
          sections: [
            { title: 'Formula', items: ['Moment = force x perpendicular distance'] },
            {
              title: 'See it in',
              items: ['Excavator', 'Crane', 'Door hinge', 'Wheel nut', 'Breaker bar'],
            },
            {
              title: 'Observation',
              items: ['Longer arms increase turning effect but also increase structural demand.'],
            },
          ],
        },
        {
          id: 'gear-ratio',
          category: 'mathematics',
          title: 'Gear ratio',
          kind: 'Engineering math',
          icon: 'functions',
          path: ['Mathematics', 'Ratios', 'Gear ratio'],
          summary:
            'Gear ratio compares input and output rotation, revealing the trade between speed and torque.',
          sections: [
            {
              title: 'Formula',
              items: ['Driven teeth divided by driver teeth, depending on convention.'],
            },
            { title: 'See it in', items: ['Bicycle drivetrain', 'Gearbox', 'Differential'] },
            { title: 'Observation', items: ['Low speed usually means high torque at the output.'] },
          ],
        },
        {
          id: 'free-body-diagrams',
          category: 'mathematics',
          title: 'Free body diagrams',
          kind: 'Analysis tool',
          icon: 'architecture',
          path: ['Mathematics', 'Statics', 'Free body diagrams'],
          summary:
            'A free body diagram isolates one part and draws every external force and moment acting on it.',
          sections: [
            {
              title: 'Observation',
              items: ['Choose a part, cut it free mentally, draw supports and loads.'],
            },
            { title: 'Use for', items: ['Boom forces', 'Crane balance', 'Hinge reactions'] },
            { title: 'Failure modes', items: ['Missing a force gives a beautiful wrong answer.'] },
          ],
        },
      ],
    },
    {
      id: 'observation',
      title: 'Observation',
      entries: [
        {
          id: 'pressure-sensors',
          category: 'observation',
          title: 'Pressure sensors',
          kind: 'Sensor',
          icon: 'sensors',
          path: ['Observation', 'Sensors', 'Pressure'],
          summary:
            'Pressure sensors reveal what a hydraulic or pneumatic system is resisting, but they do not directly tell you motion or flow.',
          sections: [
            { title: 'Can observe', items: ['Pressure spikes', 'Load changes', 'Relief events'] },
            {
              title: 'Cannot observe',
              items: [
                'Exact actuator position without another sensor',
                'Internal leakage by itself',
              ],
            },
            {
              title: 'How it lies',
              items: ['Noise', 'Bad calibration', 'Slow sampling', 'Sensor placement'],
            },
          ],
        },
        {
          id: 'load-cells',
          category: 'observation',
          title: 'Load cells',
          kind: 'Sensor',
          icon: 'scale',
          path: ['Observation', 'Sensors', 'Force'],
          summary:
            'Load cells measure force through strain, making invisible loads visible to a control or safety system.',
          sections: [
            { title: 'Can observe', items: ['Tension', 'Compression', 'Overload trends'] },
            {
              title: 'Cannot observe',
              items: ['Load direction without geometry', 'Fatigue damage directly'],
            },
            {
              title: 'Observation OS use',
              items: [
                'Warn about overload',
                'Record lifting history',
                'Compare expected and measured force',
              ],
            },
          ],
        },
      ],
    },
  ])

  const selectedMachine = computed(() => {
    return machines.value.find((machine) => machine.id === selectedId.value) || machines.value[0]
  })

  const libraryArticles = computed(() => {
    return engineeringLibraries.value.flatMap((library) => library.entries)
  })

  const libraryMap = computed(() => {
    return Object.fromEntries(libraryArticles.value.map((article) => [article.id, article]))
  })

  const activeLibrary = computed(() => {
    return libraryMap.value[selectedLibraryId.value] || libraryArticles.value[0]
  })

  const openLibrary = (id) => {
    selectedLibraryId.value = id
  }

  const createEntry = () => {
    const nextNumber = String(machines.value.length + 1).padStart(3, '0')
    const id = `machine-${nextNumber}`

    machines.value.push({
      id,
      number: `Machine #${nextNumber}`,
      name: 'Untitled machine',
      type: 'Unclassified mechanism',
      date: 'Unfiled',
      status: 'Observing',
      progress: 3,
      question: 'What does this machine transform, resist, or multiply?',
      libraryRefs: ['moments', 'free-body-diagrams'],
      sections: [
        { title: 'Observations', icon: 'visibility', content: [''] },
        {
          title: 'Sketches',
          icon: 'gesture',
          kind: 'sketch',
          content: 'Sketch the obvious parts first.',
        },
        { title: 'Subsystems', icon: 'account_tree', content: [''] },
        {
          title: 'Mathematics',
          icon: 'functions',
          content: 'Look for ratios, moments, pressure, flow, speed, or energy.',
        },
        { title: 'Failure modes', icon: 'warning', content: [''] },
        { title: 'Interesting questions', icon: 'help_outline', content: [''] },
        { title: 'Further reading', icon: 'menu_book', content: [''] },
        { title: 'Ideas for Observation OS', icon: 'lightbulb', content: [''] },
      ],
    })

    selectedId.value = id
  }

  const toggleTerminal = async () => {
    terminalOpen.value = !terminalOpen.value
    await nextTick()
    cmdInput.value?.focus()
  }

  const commandResponses = {
    '/help':
      '<strong>Commands</strong><br>/machine - current notebook<br>/question - current question<br>/library - active library article<br>/sections - notebook template<br>/clear - clear command log',
    '/sections':
      'Question, Observations, Sketches, Subsystems, Mathematics, Failure modes, Interesting questions, Further reading, Ideas for Observation OS',
  }

  const scrollToBottom = async () => {
    await nextTick()
    if (scrollArea.value) {
      scrollArea.value.scrollTop = scrollArea.value.scrollHeight
    }
  }

  const history = ref([
    { content: 'Observation OS notebook initialized.' },
    { content: 'Every machine gets its own entry. Run <strong>/help</strong> for commands.' },
  ])

  const execute = () => {
    const cmd = currentInput.value.trim().toLowerCase()
    if (!cmd) return

    history.value.push({
      content: `<span class="terminal-command">&gt; ${cmd}</span>`,
    })

    if (cmd === '/clear') {
      history.value = []
    } else if (cmd === '/machine') {
      history.value.push({
        content: `${selectedMachine.value.number}: ${selectedMachine.value.name} (${selectedMachine.value.status})`,
      })
    } else if (cmd === '/question') {
      history.value.push({ content: selectedMachine.value.question })
    } else if (cmd === '/library') {
      history.value.push({
        content: `${activeLibrary.value.title}: ${activeLibrary.value.path.join(' / ')}`,
      })
    } else if (commandResponses[cmd]) {
      history.value.push({ content: commandResponses[cmd] })
    } else {
      history.value.push({ content: `No command named ${cmd}. Try /help.` })
    }

    currentInput.value = ''
    scrollToBottom()
  }

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
  }
}
