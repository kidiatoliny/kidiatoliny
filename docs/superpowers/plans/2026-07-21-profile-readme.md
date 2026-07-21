# Profile README Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a modern GitHub profile README with contextual project navigation, an animated Pacman terminal, and a closing terminal containing contribution, streak, language, and current-stack information.

**Architecture:** Keep the README as GitHub-native Markdown and HTML with no custom runtime. The scheduled profile workflow generates theme-aware SVG assets on the `output` branch: the existing Pacman animation wrapped in a terminal and a new statistics terminal rendered from GitHub GraphQL data plus a curated stack. Small Node modules separate data normalization from SVG presentation.

**Tech Stack:** GitHub Actions, Node.js 20, GitHub GraphQL API, SVG, GitHub-flavored Markdown

## Global Constraints

- Preserve the Pacman contribution game at the beginning of the README.
- Use no tables, decorative badge walls, emojis, or duplicated project sections.
- Present shipped Apple work separately from deep learning and cybersecurity studies.
- Include Swift and SwiftUI in the current stack.
- Keep Hunter linked to `https://github.com/kidiatoliny/hunter`.
- Generate synchronized light and dark SVG variants.
- Show contributions, current streak, longest streak, top languages, and the curated current stack; do not show commit or pull request totals.
- Provide a browser preview before any commit.

---

### Task 1: GitHub profile statistics model

**Files:**
- Create: `.github/scripts/github-profile-stats.mjs`
- Create: `.github/scripts/github-profile-stats.test.mjs`

**Interfaces:**
- Consumes: GitHub GraphQL response containing `contributionsCollection.contributionCalendar` and public repository language edges.
- Produces: `calculateStreaks(days: Array<{date: string, contributionCount: number}>, today: string): {current: number, longest: number}`.
- Produces: `normalizeGitHubProfileStats(payload: object, today: string): {year: number, contributions: number, currentStreak: number, longestStreak: number, languages: string[]}`.
- Produces: `fetchGitHubProfileStats({token: string, username: string, year: number, fetchImpl?: Function}): Promise<ProfileStats>`.

- [ ] **Step 1: Write streak and normalization tests**

```js
import assert from 'node:assert/strict';
import test from 'node:test';

import { calculateStreaks, normalizeGitHubProfileStats } from './github-profile-stats.mjs';

test('calculates current and longest contribution streaks', () => {
  const days = [
    { date: '2026-07-16', contributionCount: 1 },
    { date: '2026-07-17', contributionCount: 2 },
    { date: '2026-07-18', contributionCount: 0 },
    { date: '2026-07-19', contributionCount: 3 },
    { date: '2026-07-20', contributionCount: 4 },
    { date: '2026-07-21', contributionCount: 0 },
  ];

  assert.deepEqual(calculateStreaks(days, '2026-07-21'), { current: 2, longest: 2 });
});

test('aggregates public repository languages by byte count', () => {
  const payload = createFixture();
  const stats = normalizeGitHubProfileStats(payload, '2026-07-21');

  assert.equal(stats.contributions, 42);
  assert.deepEqual(stats.languages, ['PHP', 'TypeScript', 'Swift', 'Rust', 'Go']);
});
```

- [ ] **Step 2: Run the test and verify the missing module failure**

Run: `node --test .github/scripts/github-profile-stats.test.mjs`

Expected: FAIL with `ERR_MODULE_NOT_FOUND`.

- [ ] **Step 3: Implement normalization and GraphQL fetching**

Implement one GraphQL query with variables `login`, `from`, and `to`. Request the current-year contribution calendar and up to 100 owned, public, non-fork repositories with their language edges. Aggregate language edge sizes by language name, sort descending, and return the first five. Calculate streaks from calendar days, allowing an empty current day to fall back to the previous day.

- [ ] **Step 4: Run the statistics tests**

Run: `node --test .github/scripts/github-profile-stats.test.mjs`

Expected: all statistics tests PASS.

### Task 2: Theme-aware statistics terminal

**Files:**
- Create: `.github/scripts/github-stats-terminal.mjs`
- Create: `.github/scripts/github-stats-terminal.test.mjs`

**Interfaces:**
- Consumes: `ProfileStats` from Task 1 and theme name `github` or `github-dark`.
- Produces: `renderGitHubStatsTerminal(stats: ProfileStats, theme: string): string` containing a valid 1200-pixel-wide SVG.

- [ ] **Step 1: Write rendering tests**

```js
import assert from 'node:assert/strict';
import test from 'node:test';

import { renderGitHubStatsTerminal } from './github-stats-terminal.mjs';

const stats = {
  year: 2026,
  contributions: 2451,
  currentStreak: 18,
  longestStreak: 47,
  languages: ['PHP', 'TypeScript', 'Swift', 'Rust', 'Go'],
};

test('renders profile statistics and current stack', () => {
  const svg = renderGitHubStatsTerminal(stats, 'github-dark');

  assert.match(svg, /github-stats --year 2026/u);
  assert.match(svg, /2,451/u);
  assert.match(svg, /current streak/u);
  assert.match(svg, /PHP · TypeScript · Swift · Rust · Go/u);
  assert.match(svg, /Swift · SwiftUI · App Intents · Live Activities/u);
  assert.doesNotMatch(svg, /pull requests|commits/u);
});
```

- [ ] **Step 2: Run the test and verify the missing module failure**

Run: `node --test .github/scripts/github-stats-terminal.test.mjs`

Expected: FAIL with `ERR_MODULE_NOT_FOUND`.

- [ ] **Step 3: Implement the terminal SVG**

Render macOS traffic lights, the title `kidiatoliny@github · zsh`, colored prompts, three commands, and aligned output. Use these commands and groups:

```text
github-stats --year 2026
languages --top
stack --current
```

Use the curated stack from the approved design. Escape XML text, format contribution totals with `en-US`, and use the same light and dark palettes as the Pacman terminal.

- [ ] **Step 4: Run the rendering tests and validate sample SVG**

Run: `node --test .github/scripts/github-stats-terminal.test.mjs`

Expected: all rendering tests PASS.

### Task 3: Profile asset workflow

**Files:**
- Modify: `.github/scripts/generate-pacman-current-year.mjs`
- Modify: `.github/workflows/pacman.yml`
- Test: `.github/scripts/pacman-terminal.test.mjs`
- Test: `.github/scripts/github-profile-stats.test.mjs`
- Test: `.github/scripts/github-stats-terminal.test.mjs`

**Interfaces:**
- Consumes: `fetchGitHubProfileStats` and `renderGitHubStatsTerminal` from Tasks 1 and 2.
- Produces: `dist/github-stats.svg` and `dist/github-stats-dark.svg` alongside both Pacman terminal assets.

- [ ] **Step 1: Add asset generation assertions**

Verify the orchestration writes both theme variants from one normalized stats object and preserves both existing Pacman output names.

- [ ] **Step 2: Integrate stats generation**

After Pacman generation, call `fetchGitHubProfileStats` with `GITHUB_TOKEN`, `GITHUB_REPOSITORY_OWNER`, and the UTC current year. Write both terminal variants to `dist`.

- [ ] **Step 3: Rename workflow labels without changing triggers**

Use `Generate profile assets` as the workflow name, `Generate profile SVG assets` as the generation step, and `Push profile assets to the output branch` as the publication step. Preserve the twelve-hour schedule, manual dispatch, and main-branch push trigger.

- [ ] **Step 4: Run all Node tests**

Run: `node --test .github/scripts/*.test.mjs`

Expected: all tests PASS.

### Task 4: Contextual README structure

**Files:**
- Modify: `README.md`

**Interfaces:**
- Consumes: four generated SVG URLs from the `output` branch.
- Produces: a GitHub-native portfolio with contextual selected work, expandable open-source groups, learning, toolbox, contact links, and the closing statistics terminal.

- [ ] **Step 1: Replace the uncontextualized work list**

Create `~/selected-work` entries for NosFerry, Apple native products, Akira open source, and Hunter. Each entry must state its product area, practical scope, and relevant technologies before presenting links.

- [ ] **Step 2: Add expandable open-source groups**

Use `<details>` and `<summary>` for payments and fiscal systems, Laravel foundations, and systems tooling. Each summary includes a purpose phrase; each expanded body describes individual packages in concise lines.

- [ ] **Step 3: Preserve the learning boundary and compact navigation**

Keep deep learning and cybersecurity under `~/learning`. Keep the toolbox and contact areas compact, with Swift and SwiftUI present.

- [ ] **Step 4: Append the statistics terminal**

Add a theme-aware `<picture>` referencing `github-stats-dark.svg` and `github-stats.svg` as the final visual section of the README.

- [ ] **Step 5: Audit copy and links**

Run: `rg -n "emoji|delve into|leverage|robust solution|seamlessly| / " README.md`

Expected: no copy-guard violations.

### Task 5: Visual preview and verification

**Files:**
- Create outside the repository: `/private/tmp/kidiatoliny-readme-preview.html`
- Create outside the repository: `/private/tmp/github-stats-preview.svg`
- Create outside the repository: `/private/tmp/github-stats-preview.png`

**Interfaces:**
- Consumes: the modified README and locally rendered SVG assets.
- Produces: a browser preview for user approval before commit.

- [ ] **Step 1: Run code and document checks**

Run: `node --test .github/scripts/*.test.mjs`

Run: `git diff --check`

Expected: tests PASS and diff check has no output.

- [ ] **Step 2: Validate SVG output**

Run `xmllint --noout` against the light and dark Pacman terminal previews and statistics terminal previews.

Expected: all SVG documents are valid XML.

- [ ] **Step 3: Render the GitHub-width preview**

Create an HTML preview that mirrors GitHub's 846-pixel README content width, includes local opening and closing terminal assets, and renders the complete proposed content hierarchy.

- [ ] **Step 4: Open the preview and wait for approval**

Open the local preview in the in-app browser. Do not commit or push until Kidiatoliny approves the rendered result.
