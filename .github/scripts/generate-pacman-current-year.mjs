import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';

import { fetchGitHubProfileStats } from './github-profile-stats.mjs';
import { renderGitHubStatsTerminal } from './github-stats-terminal.mjs';
import { wrapPacmanInTerminal } from './pacman-terminal.mjs';

const generatorPath =
  process.env.PACMAN_GENERATOR_PATH ?? '/tmp/pacman-contribution-graph/dist/pacman-contribution-graph.js';
const githubToken = process.env.GITHUB_TOKEN;
const githubUserName = process.env.GITHUB_REPOSITORY_OWNER;
const currentYear = new Date().getUTCFullYear();

if (!githubToken) {
  throw new Error('GITHUB_TOKEN is required.');
}

if (!githubUserName) {
  throw new Error('GITHUB_REPOSITORY_OWNER is required.');
}

patchGeneratorForCurrentYear(generatorPath);

console.log('Pacman generator patched for the current year.');

const { ArcadeRenderer } = await import(pathToFileURL(generatorPath).href);

mkdirSync('dist', { recursive: true });

await generatePacmanSvg({
  ArcadeRenderer,
  githubUserName,
  githubToken,
  gameTheme: 'github',
  outputPath: 'dist/pacman-contribution-graph.svg',
});

console.log('Light Pacman terminal generated.');

await generatePacmanSvg({
  ArcadeRenderer,
  githubUserName,
  githubToken,
  gameTheme: 'github-dark',
  outputPath: 'dist/pacman-contribution-graph-dark.svg',
});

console.log('Dark Pacman terminal generated.');

console.log('Fetching GitHub profile statistics.');

const profileStats = await fetchGitHubProfileStats({
  token: githubToken,
  username: githubUserName,
  year: currentYear,
});

console.log('GitHub profile statistics fetched.');

writeFileSync('dist/github-stats.svg', renderGitHubStatsTerminal(profileStats, 'github'));
writeFileSync('dist/github-stats-dark.svg', renderGitHubStatsTerminal(profileStats, 'github-dark'));

console.log('GitHub statistics terminals generated.');

function patchGeneratorForCurrentYear(generatorPath) {
  const from = `${currentYear}-01-01T00:00:00Z`;
  const to = new Date().toISOString();
  let source = readFileSync(generatorPath, 'utf8');

  const replacements = [
    ['query ($login: String!) {', 'query ($login: String!, $from: DateTime!, $to: DateTime!) {'],
    ['contributionsCollection {', 'contributionsCollection(from: $from, to: $to) {'],
    [
      'variables: { login: store.config.username }',
      `variables: { login: store.config.username, from: '${from}', to: '${to}' }`,
    ],
  ];

  for (const [searchValue, replacementValue] of replacements) {
    if (!source.includes(searchValue)) {
      throw new Error(`Pacman generator patch target was not found: ${searchValue}`);
    }

    source = source.replace(searchValue, replacementValue);
  }

  writeFileSync(generatorPath, source);
}

async function generatePacmanSvg({ ArcadeRenderer, githubUserName, githubToken, gameTheme, outputPath }) {
  const pacmanSvg = await renderPacmanSvg({ ArcadeRenderer, githubUserName, githubToken, gameTheme });
  const svg = wrapPacmanInTerminal(pacmanSvg, gameTheme);

  writeFileSync(outputPath, svg);
}

function renderPacmanSvg({ ArcadeRenderer, githubUserName, githubToken, gameTheme }) {
  return new Promise((resolve, reject) => {
    let generatedSvg = '';

    const renderer = new ArcadeRenderer({
      game: 'pacman',
      platform: 'github',
      username: githubUserName,
      gameTheme,
      githubSettings: {
        accessToken: githubToken,
      },
      svgCallback: (svg) => {
        generatedSvg = svg;
      },
      gameOverCallback: () => {
        resolve(generatedSvg);
      },
      pointsIncreasedCallback: () => {},
    });

    renderer.start().catch(reject);
  });
}
