import { writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

const WIDTH = 1200;
const HEIGHT = 560;
const FONT = 'Inter, -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif';
const MONO = 'SFMono-Regular, Consolas, Liberation Mono, monospace';

const STACK = [
  ['APPLICATIONS', ['Laravel · React · React Native']],
  ['APPLE NATIVE', ['Swift · SwiftUI · SwiftData', 'App Intents · Live Activities']],
  ['SYSTEMS', ['Go · Rust · Tauri · Wails']],
  ['INTELLIGENCE', ['Apple Intelligence · MLX']],
  ['DATA', ['PostgreSQL · MySQL · SQLite · Redis']],
  ['OPERATIONS', ['Docker · GitHub Actions · Pest · PHPStan']],
];

const LANGUAGE_COLORS = {
  PHP: '#777bb4',
  TypeScript: '#3178c6',
  JavaScript: '#f1e05a',
  Swift: '#f05138',
  Rust: '#dea584',
  Go: '#00add8',
  CSS: '#563d7c',
  Astro: '#ff5a03',
};

const PALETTES = {
  github: {
    background: '#f7f8fa', surface: '#ffffff', surfaceAlt: '#eef2f7', border: '#d8dee8',
    text: '#171b23', muted: '#687386', blue: '#2867e8', acid: '#b7f51d', acidText: '#172000',
  },
  'github-dark': {
    background: '#080b12', surface: '#111722', surfaceAlt: '#192130', border: '#263145',
    text: '#f4f7fb', muted: '#8b97aa', blue: '#78a9ff', acid: '#c9ff4a', acidText: '#121900',
  },
};

export function renderGitHubStatsGrid(stats, theme = 'github') {
  const palette = PALETTES[theme] ?? PALETTES.github;
  const cards = [
    ['CONTRIBUTIONS', stats.contributions.toLocaleString('en-US')],
    ['CURRENT STREAK', `${stats.currentStreak} days`],
    ['LONGEST STREAK', `${stats.longestStreak} days`],
  ];

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${WIDTH}" height="${HEIGHT}" viewBox="0 0 ${WIDTH} ${HEIGHT}" role="img" aria-labelledby="stats-title stats-description">
  <title id="stats-title">Kidiatoliny GitHub signal</title>
  <desc id="stats-description">Contribution statistics for ${stats.year}, top public repository languages, and current engineering stack.</desc>
  <rect width="1200" height="560" rx="22" fill="${palette.background}" stroke="${palette.border}" stroke-width="2"/>
  <text x="28" y="50" fill="${palette.text}" font-family="${FONT}" font-size="30" font-weight="800">GitHub signal</text>
  <text x="1172" y="45" fill="${palette.muted}" font-family="${MONO}" font-size="13" font-weight="700" letter-spacing="3" text-anchor="end">PUBLIC ACTIVITY · ${stats.year}</text>
  ${cards.map(([label, value], index) => renderStatCard(label, value, index, palette)).join('\n  ')}
  <rect x="18" y="224" width="482" height="314" rx="18" fill="${palette.surface}" stroke="${palette.border}"/>
  <text x="42" y="266" fill="${palette.blue}" font-family="${FONT}" font-size="20" font-weight="750">Language distribution</text>
  <text x="42" y="291" fill="${palette.muted}" font-family="${MONO}" font-size="12" letter-spacing="1.5">TOP PUBLIC REPOSITORIES</text>
  ${renderLanguages(stats.languages, palette)}
  <rect x="518" y="224" width="664" height="314" rx="18" fill="${palette.surface}" stroke="${palette.border}"/>
  <text x="542" y="266" fill="${palette.text}" font-family="${FONT}" font-size="20" font-weight="750">Current stack</text>
  <text x="1158" y="264" fill="${palette.muted}" font-family="${MONO}" font-size="12" letter-spacing="1.5" text-anchor="end">TOOLS IN ACTIVE USE</text>
  ${renderStack(palette)}
</svg>`;
}

function renderStatCard(label, value, index, palette) {
  const x = 18 + (index * 394);
  const fill = index === 0 ? palette.acid : palette.surface;
  const text = index === 0 ? palette.acidText : palette.text;
  const muted = index === 0 ? palette.acidText : palette.muted;

  return `<g>
    <rect x="${x}" y="72" width="376" height="132" rx="18" fill="${fill}" stroke="${palette.border}"/>
    <text x="${x + 24}" y="109" fill="${muted}" font-family="${MONO}" font-size="12" font-weight="700" letter-spacing="2">${label}</text>
    <text x="${x + 24}" y="167" fill="${text}" font-family="${FONT}" font-size="45" font-weight="850">${escapeXml(value)}</text>
  </g>`;
}

function renderLanguages(languages, palette) {
  return languages.map((language, index) => {
    const y = 332 + (index * 43);
    const color = LANGUAGE_COLORS[language.name] ?? palette.blue;
    const width = Math.max(12, Math.round(language.share * 3.05));

    return `<g>
      <circle cx="48" cy="${y - 4}" r="5" fill="${color}"/>
      <text x="62" y="${y}" fill="${palette.text}" font-family="${FONT}" font-size="15" font-weight="650">${escapeXml(language.name)}</text>
      <rect x="190" y="${y - 14}" width="260" height="10" rx="5" fill="${palette.surfaceAlt}"/>
      <rect x="190" y="${y - 14}" width="${width}" height="10" rx="5" fill="${color}"/>
      <text x="474" y="${y}" fill="${palette.muted}" font-family="${MONO}" font-size="13" text-anchor="end">${language.share}%</text>
    </g>`;
  }).join('\n  ');
}

function renderStack(palette) {
  return STACK.map(([label, lines], index) => {
    const column = index % 2;
    const row = Math.floor(index / 2);
    const x = 542 + (column * 310);
    const y = 318 + (row * 75);

    return `<g>
      <text x="${x}" y="${y}" fill="${palette.blue}" font-family="${MONO}" font-size="12" font-weight="700" letter-spacing="1.4">${label}</text>
      <text x="${x}" y="${y + 27}" fill="${palette.text}" font-family="${FONT}" font-size="14.5" font-weight="550">${lines.map((line, lineIndex) => `<tspan x="${x}" dy="${lineIndex === 0 ? 0 : 20}">${escapeXml(line)}</tspan>`).join('')}</text>
    </g>`;
  }).join('\n  ');
}

function escapeXml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&apos;');
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  const [, , outputPath, theme = 'github-dark'] = process.argv;

  if (!outputPath) {
    throw new Error('Usage: node github-stats-grid.mjs <output.svg> [github|github-dark]');
  }

  const sampleStats = {
    year: new Date().getUTCFullYear(),
    contributions: 2451,
    currentStreak: 18,
    longestStreak: 47,
    languages: [
      { name: 'PHP', share: 42 },
      { name: 'TypeScript', share: 27 },
      { name: 'Swift', share: 16 },
      { name: 'Rust', share: 9 },
      { name: 'Go', share: 6 },
    ],
  };

  writeFileSync(outputPath, renderGitHubStatsGrid(sampleStats, theme));
}
