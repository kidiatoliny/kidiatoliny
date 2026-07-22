# Unified Public Profile Stats Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Aggregate public repository languages from Kidiatoliny and three organizations into one ordered six-technology footprint, while correcting the NosFerry SVG overflow.

**Architecture:** Keep contribution totals and streaks on the existing user calendar query. Add repository-owner aliases to the same GraphQL request, flatten all returned repository connections in the normalizer, select six named languages, map Swift and PHP to their framework-aware display labels, normalize their shares, and render them in descending order.

**Tech Stack:** Node.js 20, GitHub GraphQL API, SVG, `node:test`, `rsvg-convert`.

## Global Constraints

- Only public, non-fork repositories from `kidiatoliny`, `akira-io`, `akira-foundation`, and `Nos-Ferry` contribute language bytes.
- Contributions and streaks remain sourced only from the `kidiatoliny` contribution calendar.
- Always render Swift + SwiftUI, PHP + Laravel, Go, Rust, TypeScript, and JavaScript.
- Percentages total 100 and rows are ordered from highest to lowest.
- NosFerry copy must remain inside its card in both themes.

---

### Task 1: Aggregate public languages across four owners

**Files:**
- Modify: `.github/scripts/github-profile-stats.mjs`
- Test: `.github/scripts/github-profile-stats.test.mjs`

**Interfaces:**
- Consumes: GitHub GraphQL payload with `user`, `personal`, `akiraIo`, `akiraFoundation`, and `nosFerry` repository connections.
- Produces: `normalizeGitHubProfileStats(payload, today)` returning `languages: Array<{ name: string, share: number }>`.

- [ ] **Step 1: Write the failing multi-owner aggregation test**

Extend the fixture with owner aliases and assert the fixed display set:

```js
assert.deepEqual(stats.languages.map(({ name }) => name), [
  'PHP + Laravel',
  'TypeScript',
  'Swift + SwiftUI',
  'Go',
  'Rust',
  'JavaScript',
]);
assert.equal(stats.languages.reduce((total, language) => total + language.share, 0), 100);
```

Also inspect the serialized request and require all owners plus `privacy: PUBLIC` and `isFork: false`.

- [ ] **Step 2: Run the focused test and verify RED**

Run: `node --test .github/scripts/github-profile-stats.test.mjs`

Expected: FAIL because organization aliases are not queried or normalized.

- [ ] **Step 3: Implement the fixed language footprint**

Define the selected signals:

```js
const TECHNOLOGY_SIGNALS = new Map([
  ['Swift', 'Swift + SwiftUI'],
  ['PHP', 'PHP + Laravel'],
  ['Go', 'Go'],
  ['Rust', 'Rust'],
  ['TypeScript', 'TypeScript'],
  ['JavaScript', 'JavaScript'],
]);
```

Add GraphQL repository-owner aliases for the four owners, each using `first: 100`, `isFork: false`, and `privacy: PUBLIC`. Flatten their repository nodes, sum only selected language sizes, normalize shares across all six signals, correct rounding on the largest signal, and sort by descending share with the fixed signal order as the tie-breaker.

- [ ] **Step 4: Run the focused test and verify GREEN**

Run: `node --test .github/scripts/github-profile-stats.test.mjs`

Expected: all profile-stat tests PASS.

### Task 2: Render the unified footprint

**Files:**
- Modify: `.github/scripts/github-stats-grid.mjs`
- Test: `.github/scripts/github-stats-grid.test.mjs`

**Interfaces:**
- Consumes: the six ordered language signals from Task 1.
- Produces: `renderGitHubStatsGrid(stats, theme)` with a six-row `Core technology footprint` panel.

- [ ] **Step 1: Write the failing renderer test**

Use six signal objects and assert:

```js
assert.match(svg, /Core technology footprint/u);
assert.match(svg, /PUBLIC REPOSITORIES · 4 OWNERS/u);
assert.match(svg, /Swift \+ SwiftUI/u);
assert.match(svg, /PHP \+ Laravel/u);
assert.match(svg, /JavaScript/u);
assert.doesNotMatch(svg, /Language distribution|TOP PUBLIC REPOSITORIES/u);
```

- [ ] **Step 2: Run the renderer test and verify RED**

Run: `node --test .github/scripts/github-stats-grid.test.mjs`

Expected: FAIL on the old title, subtitle, and five-row sample.

- [ ] **Step 3: Implement the six-row layout**

Rename the panel, replace the subtitle, expand vertical spacing for six rows, and map framework-aware labels to their base-language colors:

```js
const LANGUAGE_COLORS = {
  'PHP + Laravel': '#777bb4',
  TypeScript: '#3178c6',
  'Swift + SwiftUI': '#f05138',
  Rust: '#dea584',
  Go: '#00add8',
  JavaScript: '#f1e05a',
};
```

Update the sample payload to contain six sorted signals totaling 100.

- [ ] **Step 4: Run the renderer test and verify GREEN**

Run: `node --test .github/scripts/github-stats-grid.test.mjs`

Expected: all grid-renderer tests PASS.

### Task 3: Correct NosFerry copy boundaries and verify the release

**Files:**
- Modify: `assets/signal-work-light.svg`
- Modify: `assets/signal-work-dark.svg`
- Test: `.github/scripts/signal-assets.test.mjs`

**Interfaces:**
- Produces: two theme-specific selected-work SVGs with the same explicit NosFerry line structure.

- [ ] **Step 1: Write the failing asset-boundary test**

Read both SVGs and assert three controlled NosFerry description `<text>` lines whose final x-coordinate remains the shared left inset:

```js
for (const svg of [lightSvg, darkSvg]) {
  assert.match(svg, /Production infrastructure for ticketing, passenger operations,/u);
  assert.match(svg, /refunds, company sales, support, audit, HR,/u);
  assert.match(svg, /and back-office workflows\./u);
}
```

- [ ] **Step 2: Run the asset test and verify RED**

Run: `node --test .github/scripts/signal-assets.test.mjs`

Expected: FAIL because the current description has only two overlong lines.

- [ ] **Step 3: Split the NosFerry description in both themes**

Replace the two description lines with three explicit lines at `x="48"` and y positions `178`, `208`, and `238`; move the technology footer only if necessary to retain breathing room.

- [ ] **Step 4: Run all tests and render every asset**

Run:

```bash
node --test .github/scripts/*.test.mjs
for asset in assets/signal-*.svg; do rsvg-convert "$asset" -o "/tmp/$(basename "$asset" .svg).png"; done
node .github/scripts/github-stats-grid.mjs /tmp/github-stats-dark.svg github-dark
rsvg-convert /tmp/github-stats-dark.svg -o /tmp/github-stats-dark.png
```

Expected: all tests PASS, every render exits 0, and visual inspection shows no clipped copy.

- [ ] **Step 5: Commit and push**

```bash
git add .github/scripts/github-profile-stats.mjs .github/scripts/github-profile-stats.test.mjs .github/scripts/github-stats-grid.mjs .github/scripts/github-stats-grid.test.mjs .github/scripts/signal-assets.test.mjs assets/signal-work-light.svg assets/signal-work-dark.svg docs/superpowers
git commit -m "fix(profile): unify public technology stats"
git push origin main
```
