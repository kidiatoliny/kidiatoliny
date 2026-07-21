import { writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

import { resolveTerminalPalette } from './terminal-theme.mjs';

const TERMINAL_WIDTH = 1200;
const TERMINAL_HEIGHT = 600;
const WINDOW_X = 17;
const WINDOW_Y = 18;
const WINDOW_WIDTH = 1166;
const WINDOW_HEIGHT = 564;
const FONT_FAMILY = 'SFMono-Regular, Consolas, Liberation Mono, monospace';

const CURRENT_STACK = [
  ['applications', 'Laravel · React · React Native'],
  ['apple-native', 'Swift · SwiftUI · App Intents · Live Activities'],
  ['systems', 'Go · Rust · Tauri · Wails'],
  ['intelligence', 'Apple Intelligence · MLX'],
  ['data', 'PostgreSQL · MySQL · SQLite · Redis'],
  ['operations', 'Docker · GitHub Actions · Pest · PHPStan'],
];

export function renderGitHubStatsTerminal(stats, theme) {
  const palette = resolveTerminalPalette(theme);
  const languages = stats.languages.map(escapeXml).join(' · ');
  const statCards = [
    ['contributions', stats.contributions.toLocaleString('en-US')],
    ['current streak', `${stats.currentStreak}d`],
    ['longest streak', `${stats.longestStreak}d`],
  ];

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${TERMINAL_WIDTH}" height="${TERMINAL_HEIGHT}" viewBox="0 0 ${TERMINAL_WIDTH} ${TERMINAL_HEIGHT}" role="img" aria-labelledby="stats-title stats-description">
  <title id="stats-title">Kidiatoliny GitHub statistics and current stack</title>
  <desc id="stats-description">A macOS terminal showing contribution statistics, top public repository languages, and the current engineering stack.</desc>
  <defs>
    <clipPath id="kidiatoliny-stats-window-clip">
      <rect x="${WINDOW_X}" y="${WINDOW_Y}" width="${WINDOW_WIDTH}" height="${WINDOW_HEIGHT}" rx="16"/>
    </clipPath>
    <filter id="kidiatoliny-stats-shadow" x="-10%" y="-20%" width="120%" height="150%">
      <feDropShadow dx="0" dy="8" stdDeviation="12" flood-color="#010409" flood-opacity="0.35"/>
    </filter>
  </defs>
  <g filter="url(#kidiatoliny-stats-shadow)">
    <g clip-path="url(#kidiatoliny-stats-window-clip)">
      <rect x="${WINDOW_X}" y="${WINDOW_Y}" width="${WINDOW_WIDTH}" height="${WINDOW_HEIGHT}" fill="${palette.body}"/>
      <rect x="${WINDOW_X}" y="${WINDOW_Y}" width="${WINDOW_WIDTH}" height="52" fill="${palette.titleBar}"/>
      <path d="M${WINDOW_X} 70h${WINDOW_WIDTH}" stroke="${palette.border}" stroke-width="2"/>

      <circle cx="49" cy="44" r="9" fill="#ff5f57"/>
      <circle cx="77" cy="44" r="9" fill="#febc2e"/>
      <circle cx="105" cy="44" r="9" fill="#28c840"/>
      <text x="600" y="49" fill="${palette.muted}" font-family="${FONT_FAMILY}" font-size="15" text-anchor="middle">kidiatoliny@github · zsh</text>

      ${renderPrompt({ y: 106, command: `github-stats --year ${stats.year}`, palette })}
      ${renderStatCards(statCards, palette)}

      ${renderPrompt({ y: 232, command: 'languages --top', palette })}
      <text x="49" y="272" fill="${palette.output}" font-family="${FONT_FAMILY}" font-size="20" font-weight="600">${languages}</text>

      ${renderPrompt({ y: 326, command: 'stack --current', palette })}
      ${renderStack(palette)}

      ${renderPrompt({ y: 556, command: '', palette })}
      <rect x="270" y="540" width="10" height="20" rx="1" fill="${palette.prompt}"/>
    </g>
    <rect x="${WINDOW_X}" y="${WINDOW_Y}" width="${WINDOW_WIDTH}" height="${WINDOW_HEIGHT}" rx="16" fill="none" stroke="${palette.border}" stroke-width="2"/>
  </g>
</svg>`;
}

function renderStatCards(cards, palette) {
  return cards.map(([label, value], index) => {
    const x = 49 + (index * 366);

    return `<g>
        <rect x="${x}" y="124" width="340" height="72" rx="8" fill="${palette.panel}" stroke="${palette.border}"/>
        <text x="${x + 18}" y="150" fill="${palette.muted}" font-family="${FONT_FAMILY}" font-size="15">${label}</text>
        <text x="${x + 18}" y="181" fill="${palette.prompt}" font-family="${FONT_FAMILY}" font-size="24" font-weight="700">${value}</text>
      </g>`;
  }).join('\n      ');
}

function renderStack(palette) {
  return CURRENT_STACK.map(([label, value], index) => {
    const y = 365 + (index * 30);

    return `<text x="49" y="${y}" font-family="${FONT_FAMILY}" font-size="17"><tspan fill="${palette.muted}">${label}</tspan><tspan x="235" fill="${palette.secondary}">${value}</tspan></text>`;
  }).join('\n      ');
}

function renderPrompt({ y, command, palette }) {
  return `<text x="49" y="${y}" font-family="${FONT_FAMILY}" font-size="18" xml:space="preserve"><tspan fill="${palette.prompt}">kidiatoliny@github</tspan><tspan fill="${palette.muted}">:</tspan><tspan fill="${palette.path}">~</tspan><tspan fill="${palette.muted}">$</tspan><tspan fill="${palette.command}">${command ? ` ${escapeXml(command)}` : ''}</tspan></text>`;
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
    throw new Error('Usage: node github-stats-terminal.mjs <output.svg> [github|github-dark]');
  }

  const sampleStats = {
    year: new Date().getUTCFullYear(),
    contributions: 2451,
    currentStreak: 18,
    longestStreak: 47,
    languages: ['PHP', 'TypeScript', 'Swift', 'Rust', 'Go'],
  };

  writeFileSync(outputPath, renderGitHubStatsTerminal(sampleStats, theme));
}
