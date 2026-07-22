# Profile Card Color Remap Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Remap only the KIDIATOLINY, NosFerry, and Apple native card colors while preserving every other blue token.

**Architecture:** Extend the SVG asset regression test with exact theme-specific surface and foreground assertions. Modify only the four approved SVG assets, then render each to verify contrast and hierarchy visually.

**Tech Stack:** SVG, Node.js `node:test`, `rsvg-convert`.

## Global Constraints

- KIDIATOLINY and NosFerry use `#6C4CF1` in light theme and `#9B7BFF` in dark theme.
- Apple native uses `#FF6B4A` in light theme and `#FF8066` in dark theme.
- Unrelated blue accents remain unchanged.
- Light-theme purple uses light foregrounds; dark-theme purple uses dark foregrounds; coral uses dark foregrounds.

---

### Task 1: Remap the three card surfaces

**Files:**
- Modify: `.github/scripts/signal-assets.test.mjs`
- Modify: `assets/signal-identity-light.svg`
- Modify: `assets/signal-identity-dark.svg`
- Modify: `assets/signal-work-light.svg`
- Modify: `assets/signal-work-dark.svg`

**Interfaces:**
- Produces: four theme-specific SVG assets with exact card colors and readable foregrounds.

- [ ] **Step 1: Write the failing color regression test**

Read the identity and work assets and assert:

```js
assert.match(identityLight, /fill="#6C4CF1"/u);
assert.match(identityDark, /fill="#9B7BFF"/u);
assert.match(workLight, /fill="#6C4CF1"/u);
assert.match(workLight, /fill="#FF6B4A"/u);
assert.match(workDark, /fill="#9B7BFF"/u);
assert.match(workDark, /fill="#FF8066"/u);
```

Also assert that `#2867e8` remains in the light selected-work asset as the Akira accent and that the old Apple surfaces `#6f52d9` and `#8065e7` are absent.

- [ ] **Step 2: Run the asset test and verify RED**

Run: `node --test .github/scripts/signal-assets.test.mjs`

Expected: FAIL because the approved surfaces still use blue and the old purple.

- [ ] **Step 3: Apply the exact surface and foreground colors**

Replace only the approved fills. Update identity and NosFerry foregrounds to `#ffffff` in light theme and `#07111f` in dark theme. Use `#1b0c08` for the Apple native title and supporting text in both themes, with a compatible dark mono footer.

- [ ] **Step 4: Run tests and render all affected assets**

Run:

```bash
node --test .github/scripts/*.test.mjs
for asset in assets/signal-identity-light.svg assets/signal-identity-dark.svg assets/signal-work-light.svg assets/signal-work-dark.svg; do rsvg-convert "$asset" -o "/tmp/$(basename "$asset" .svg).png"; done
```

Expected: all tests PASS and all four renders exit 0.

- [ ] **Step 5: Commit and push**

```bash
git add .github/scripts/signal-assets.test.mjs assets/signal-identity-light.svg assets/signal-identity-dark.svg assets/signal-work-light.svg assets/signal-work-dark.svg docs/superpowers/plans/2026-07-22-profile-card-color-remap.md
git commit -m "style(profile): remap featured card colors"
git push origin main
```
