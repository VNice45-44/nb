export const commandList = [
  { command: '/help', description: 'List operating parameters and commands' },
  { command: '/about', description: 'About and focus areas' },
  { command: '/projects', description: 'Active and archived projects' },
  { command: '/working-on', description: 'Current work in progress' },
  { command: '/field-notes', description: 'Tiny observations and questions' },
  { command: '/simulations', description: 'Simulation sandbox index' },
  { command: '/library', description: 'Current curiosities and reading list' },
  { command: '/contact', description: 'Communication handshake' },
  { command: '/clear', description: 'Flush terminal output buffer' },
]

export const responses = {
  '/help': `
    <div>[System Directives Available]:</div>
    <ul>
      <li><strong style="color: #31ccec">/about</strong> - About and focus areas</li>
      <li><strong style="color: #31ccec">/projects</strong> - Projects</li>
      <li><strong style="color: #31ccec">/working-on</strong> - Currently working on</li>
      <li><strong style="color: #31ccec">/field-notes</strong> - Tiny observations</li>
      <li><strong style="color: #31ccec">/simulations</strong> - Simulation sandbox</li>
      <li><strong style="color: #31ccec">/library</strong> - Current curiosities</li>
      <li><strong style="color: #31ccec">/contact</strong> - Contact</li>
      <li><strong style="color: #31ccec">/clear</strong> - Flush buffer</li>
    </ul>
  `,
  '/about': `
    <div><strong style="color: #31ccec">Focus Areas:</strong></div>
    <ul>
      <li>Systems Engineering</li>
      <li>Infrastructure</li>
      <li>Simulation</li>
      <li>Local Economies</li>
      <li>Linux</li>
    </ul>
    <div style="margin-top:10px"><strong style="color: #31ccec">Current Interests:</strong></div>
    <ul>
      <li>Autonomous Systems</li>
      <li>GIS</li>
      <li>Distributed Networks</li>
    </ul>
  `,
  '/projects': `
    <div><strong>PLUM</strong></div>
    <div><em>Status:</em> Rebuilding</div>
    <div style="margin-bottom:8px">Description: Local-first economic network.</div>
    <hr />
    <div><strong>WAKO</strong></div>
    <div><em>Status:</em> Research</div>
    <div>Description: Waste collection routing system.</div>
  `,
  '/working-on': `
    <div><strong>CURRENTLY WORKING ON</strong></div>
    <ul>
      <li>Rebuilding Plum</li>
      <li>Studying routing systems</li>
      <li>Improving Linux workflow</li>
    </ul>
  `,
  '/field-notes': `
    <div><strong>[2026-06-01]</strong></div>
    <div style="margin-top:6px"><strong>Observation:</strong></div>
    <div>Most estate waste collection routes appear manually optimized.</div>
    <div style="margin-top:6px"><strong>Question:</strong></div>
    <div>Can routing be improved using simple heuristics before requiring full GIS optimization?</div>
  `,
  '/simulations': `
    <div><strong>Simulation Sandbox</strong></div>
    <ol>
      <li>Vehicle Dynamics</li>
      <li>Pathfinding</li>
      <li>Routing Systems</li>
    </ol>
  `,
  '/library': `
    <div><strong>CURRENT CURIOSITIES</strong></div>
    <ul>
      <li>Linux internals</li>
      <li>GIS systems</li>
      <li>Local economies</li>
      <li>Waste logistics</li>
      <li>Sensor fusion</li>
    </ul>
    <div style="margin-top:10px"><strong>A Principle We Should Keep</strong></div>
    <ul>
      <li>What am I building?</li>
      <li>What am I studying?</li>
      <li>What am I testing?</li>
      <li>What am I observing?</li>
    </ul>
  `,
  '/contact': `
    <div>Run <strong style="color: #31ccec">sudo consult zinja</strong> to initiate handshake.</div>
  `,
}
