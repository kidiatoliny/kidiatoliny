import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

import { resolveTerminalPalette } from './terminal-theme.mjs';

const TERMINAL_WIDTH = 1200;
const WINDOW_X = 17;
const WINDOW_Y = 18;
const TITLE_BAR_HEIGHT = 52;
const GAME_Y = 278;
const BOTTOM_PADDING = 18;

export function wrapPacmanInTerminal(pacmanSvg, gameTheme) {
  const normalizedSvg = pacmanSvg.replace(/<\?xml[^>]*>/u, '').trim();
  const rootMatch = normalizedSvg.match(/<svg\b([^>]*)>/u);

  if (!rootMatch) {
    throw new Error('Pacman SVG root element was not found.');
  }

  const sourceWidth = readSvgDimension(rootMatch[1], 'width');
  const sourceHeight = readSvgDimension(rootMatch[1], 'height');
  const terminalHeight = GAME_Y + sourceHeight + BOTTOM_PADDING;
  const windowHeight = terminalHeight - (WINDOW_Y * 2);
  const palette = resolveTerminalPalette(gameTheme);
  const embeddedSvg = normalizedSvg.replace(
    rootMatch[0],
    `<svg x="${WINDOW_X}" y="${GAME_Y}" width="${sourceWidth}" height="${sourceHeight}" viewBox="0 0 ${sourceWidth} ${sourceHeight}">`,
  );

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${TERMINAL_WIDTH}" height="${terminalHeight}" viewBox="0 0 ${TERMINAL_WIDTH} ${terminalHeight}" role="img" aria-labelledby="terminal-title terminal-description">
  <title id="terminal-title">Kidiatoliny terminal running Pacman</title>
  <desc id="terminal-description">A macOS terminal window showing Kidiatoliny, current engineering focus, and an animated Pacman contribution graph.</desc>
  <defs>
    <clipPath id="kidiatoliny-terminal-window-clip">
      <rect x="${WINDOW_X}" y="${WINDOW_Y}" width="${sourceWidth}" height="${windowHeight}" rx="16"/>
    </clipPath>
    <filter id="kidiatoliny-terminal-shadow" x="-10%" y="-20%" width="120%" height="150%">
      <feDropShadow dx="0" dy="8" stdDeviation="12" flood-color="#010409" flood-opacity="0.35"/>
    </filter>
  </defs>
  <g filter="url(#kidiatoliny-terminal-shadow)">
    <g clip-path="url(#kidiatoliny-terminal-window-clip)">
      <rect x="${WINDOW_X}" y="${WINDOW_Y}" width="${sourceWidth}" height="${windowHeight}" fill="${palette.body}"/>
      <rect x="${WINDOW_X}" y="${WINDOW_Y}" width="${sourceWidth}" height="${TITLE_BAR_HEIGHT}" fill="${palette.titleBar}"/>
      <path d="M${WINDOW_X} ${WINDOW_Y + TITLE_BAR_HEIGHT}h${sourceWidth}" stroke="${palette.border}" stroke-width="2"/>

      <circle cx="49" cy="44" r="9" fill="#ff5f57"/>
      <circle cx="77" cy="44" r="9" fill="#febc2e"/>
      <circle cx="105" cy="44" r="9" fill="#28c840"/>

      <text x="600" y="49" fill="${palette.muted}" font-family="SFMono-Regular, Consolas, Liberation Mono, monospace" font-size="15" text-anchor="middle">kidiatoliny@github · zsh</text>

      ${renderPrompt({ y: 108, command: 'whoami', palette })}
      <text x="49" y="140" fill="${palette.output}" font-family="SFMono-Regular, Consolas, Liberation Mono, monospace" font-size="19" font-weight="600">Kidiatoliny</text>

      ${renderPrompt({ y: 188, command: 'current-focus', palette })}
      <text x="49" y="220" fill="${palette.secondary}" font-family="SFMono-Regular, Consolas, Liberation Mono, monospace" font-size="18">product systems · Apple platforms · AI and machine learning · developer tools</text>

      ${renderPrompt({ y: 260, command: './pacman', palette })}
      ${embeddedSvg}
    </g>
    <rect x="${WINDOW_X}" y="${WINDOW_Y}" width="${sourceWidth}" height="${windowHeight}" rx="16" fill="none" stroke="${palette.border}" stroke-width="2"/>
  </g>
</svg>`;
}

function readSvgDimension(attributes, dimension) {
  const match = attributes.match(new RegExp(`\\b${dimension}=["']([0-9.]+)["']`, 'u'));

  if (!match) {
    throw new Error(`Pacman SVG ${dimension} was not found.`);
  }

  return Number(match[1]);
}

function renderPrompt({ y, command, palette }) {
  return `<text x="49" y="${y}" font-family="SFMono-Regular, Consolas, Liberation Mono, monospace" font-size="18" xml:space="preserve"><tspan fill="${palette.prompt}">kidiatoliny@github</tspan><tspan fill="${palette.muted}">:</tspan><tspan fill="${palette.path}">~</tspan><tspan fill="${palette.muted}">$</tspan><tspan fill="${palette.command}"> ${command}</tspan></text>`;
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  const [, , inputPath, outputPath, gameTheme = 'github-dark'] = process.argv;

  if (!inputPath || !outputPath) {
    throw new Error('Usage: node pacman-terminal.mjs <input.svg> <output.svg> [github|github-dark]');
  }

  writeFileSync(outputPath, wrapPacmanInTerminal(readFileSync(inputPath, 'utf8'), gameTheme));
}
