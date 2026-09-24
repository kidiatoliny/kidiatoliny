import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

import { ownerNodes, ownerQueryArguments, ownerQueryFields, ownerVariables } from './repository-owners.mjs';

const GITHUB_GRAPHQL_URL = 'https://api.github.com/graphql';
const WIDTH = 1200;
const HEIGHT = 480;
const FONT = '-apple-system,BlinkMacSystemFont,Segoe UI,sans-serif';
const MONO = 'SFMono-Regular,Consolas,monospace';
const CARD_X = [18, 312, 606, 900];
const CARD_WIDTH = [281, 281, 281, 282];

const ECOSYSTEM_QUERY = `
  query EcosystemTopics(
    ${ownerQueryArguments()}
  ) {
    ${ownerQueryFields('RepositoryTopics')}
  }

  fragment RepositoryTopics on RepositoryOwner {
    repositories(first: 100, isFork: false, ownerAffiliations: OWNER, privacy: PUBLIC) {
      nodes {
        repositoryTopics(first: 20) {
          nodes {
            topic {
              name
            }
          }
        }
      }
    }
  }
`;

const THEMES = {
  github: {
    background: '#f7f8fa',
    border: '#d8dee8',
    title: '#171b23',
    eyebrow: '#6b7688',
    research: { surface: '#f2edff', border: '#d9cdf7', eyebrow: '#765db5', text: '#241b38', chip: '#ffffff', chipBorder: '#c9b9ef', chipText: '#674d9f' },
    tones: {
      plain: { surface: '#ffffff', border: '#d8dee8', title: '#2867e8', line: '#505b6d', count: '#171b23' },
      violet: { surface: '#ffffff', border: '#d8dee8', title: '#6f52d9', line: '#505b6d', count: '#171b23' },
      acid: { surface: '#c9ff4a', border: null, title: '#4e6419', line: '#27330d', count: '#172006' },
      inverse: { surface: '#171b23', border: null, title: '#78a9ff', line: '#c3cbd7', count: '#ffffff' },
    },
  },
  'github-dark': {
    background: '#080b12',
    border: '#263145',
    title: '#f4f7fb',
    eyebrow: '#7f8ba0',
    research: { surface: '#171221', border: '#403357', eyebrow: '#a890e8', text: '#f0ebff', chip: '#221a30', chipBorder: '#5b4778', chipText: '#c3b2ef' },
    tones: {
      plain: { surface: '#111722', border: '#263145', title: '#78a9ff', line: '#aeb8c8', count: '#f4f7fb' },
      violet: { surface: '#111722', border: '#263145', title: '#a88fff', line: '#aeb8c8', count: '#f4f7fb' },
      acid: { surface: '#c9ff4a', border: null, title: '#4e6419', line: '#27330d', count: '#172006' },
      inverse: { surface: '#18202d', border: '#263145', title: '#78a9ff', line: '#c3cbd7', count: '#ffffff' },
    },
  },
};

export function countEcosystemTopics(payload, topics) {
  const counts = new Map(topics.map((topic) => [topic, 0]));

  for (const owner of ownerNodes(payload?.data)) {
    for (const repository of owner.repositories?.nodes ?? []) {
      for (const node of repository.repositoryTopics?.nodes ?? []) {
        const topic = node.topic?.name;

        if (counts.has(topic)) {
          counts.set(topic, counts.get(topic) + 1);
        }
      }
    }
  }

  return counts;
}

export function formatCount(count) {
  return String(count).padStart(2, '0');
}

export function renderEcosystemCard(config, counts, theme = 'github') {
  const palette = THEMES[theme] ?? THEMES.github;

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${WIDTH}" height="${HEIGHT}" viewBox="0 0 ${WIDTH} ${HEIGHT}" role="img" aria-labelledby="title desc">
  <title id="title">${escapeXml(config.title)}</title><desc id="desc">${escapeXml(config.description)}</desc>
  <rect x="1" y="1" width="${WIDTH - 2}" height="${HEIGHT - 2}" rx="22" fill="${palette.background}" stroke="${palette.border}" stroke-width="2"/>
  <text x="28" y="48" fill="${palette.title}" font-family="${FONT}" font-size="29" font-weight="850">${escapeXml(config.title)}</text>
  <text x="1172" y="46" text-anchor="end" fill="${palette.eyebrow}" font-family="${MONO}" font-size="13" font-weight="700" letter-spacing="2">${escapeXml(config.eyebrow)}</text>
  <g font-family="${FONT}">
    ${config.categories.map((category, index) => renderCategory(category, index, counts, palette)).join('\n    ')}
  </g>
  ${renderResearch(config.research, palette)}
</svg>`;
}

function renderCategory(category, index, counts, palette) {
  const tone = palette.tones[category.tone] ?? palette.tones.plain;
  const x = CARD_X[index];
  const textX = x + 24;
  const stroke = tone.border ? ` stroke="${tone.border}"` : '';
  const lines = category.lines
    .map((line, lineIndex) => `<text x="${textX}" y="${157 + (lineIndex * 26)}" fill="${tone.line}" font-size="16">${escapeXml(line)}</text>`)
    .join('');

  return `<rect x="${x}" y="72" width="${CARD_WIDTH[index]}" height="235" rx="16" fill="${tone.surface}"${stroke}/><text x="${textX}" y="112" fill="${tone.title}" font-size="19" font-weight="800">${escapeXml(category.title)}</text>${lines}<text x="${textX}" y="279" fill="${tone.count}" font-size="42" font-weight="900">${formatCount(counts.get(category.topic) ?? 0)}</text>`;
}

function renderResearch(research, palette) {
  const chips = research.tracks
    .map((track, index) => {
      const x = 860 + (index * 156);

      return `<rect x="${x}" y="365" width="142" height="48" rx="24" fill="${palette.research.chip}" stroke="${palette.research.chipBorder}"/><text x="${x + 71}" y="395" text-anchor="middle" fill="${palette.research.chipText}" font-family="${FONT}" font-size="15" font-weight="700">${escapeXml(track)}</text>`;
    })
    .join('\n  ');

  return `<rect x="18" y="323" width="1164" height="139" rx="16" fill="${palette.research.surface}" stroke="${palette.research.border}"/>
  <text x="44" y="361" fill="${palette.research.eyebrow}" font-family="${MONO}" font-size="13" font-weight="700" letter-spacing="2">${escapeXml(research.eyebrow)}</text>
  <text x="44" y="405" fill="${palette.research.text}" font-family="${FONT}" font-size="22" font-weight="750">${escapeXml(research.statement)}</text>
  ${chips}`;
}

const DEFAULT_CONFIG_PATH = resolve(dirname(fileURLToPath(import.meta.url)), '../data/ecosystem.json');

export function readEcosystemConfig(path = DEFAULT_CONFIG_PATH) {
  return JSON.parse(readFileSync(path, 'utf8'));
}

export async function fetchEcosystemCounts({ token, topics, fetchImpl = fetch }) {
  const response = await fetchImpl(GITHUB_GRAPHQL_URL, {
    method: 'POST',
    headers: {
      accept: 'application/vnd.github+json',
      authorization: `Bearer ${token}`,
      'content-type': 'application/json',
      'user-agent': 'kidiatoliny-profile-readme',
    },
    body: JSON.stringify({ query: ECOSYSTEM_QUERY, variables: ownerVariables() }),
  });

  if (!response.ok) {
    throw new Error(`GitHub ecosystem topics request failed with status ${response.status}.`);
  }

  const payload = await response.json();

  if (payload.errors?.length) {
    throw new Error(payload.errors.map((error) => error.message).join('; '));
  }

  return countEcosystemTopics(payload, topics);
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
  const [, , outputPath, theme = 'github'] = process.argv;

  if (!outputPath) {
    throw new Error('Usage: node ecosystem-card.mjs <output.svg> [github|github-dark]');
  }

  const config = readEcosystemConfig();
  const counts = new Map(config.categories.map((category, index) => [category.topic, [4, 4, 7, 12][index]]));

  writeFileSync(outputPath, renderEcosystemCard(config, counts, theme));
}
