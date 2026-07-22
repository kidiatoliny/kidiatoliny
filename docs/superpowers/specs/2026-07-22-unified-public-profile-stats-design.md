# Unified Public Profile Stats

## Goal

Present one coherent technology footprint built from Kidiatoliny's public work across the personal account and the organizations behind the portfolio.

## Sources

The generator will aggregate public, non-fork repositories owned by:

- `kidiatoliny`
- `akira-io`
- `akira-foundation`
- `Nos-Ferry`

Contribution totals and streaks remain sourced from the `kidiatoliny` contribution calendar. GitHub already includes qualifying organization activity in that calendar, so organization contributions must not be added again.

Repository language bytes will be collected for all four owners in one GraphQL request and combined before rendering. Private repositories remain excluded.

## Fixed Technology Footprint

The visualization will always render these six signals, even when a measured language has a zero value:

1. Swift + SwiftUI
2. PHP + Laravel
3. Go
4. Rust
5. TypeScript
6. JavaScript

GitHub Linguist reports languages, not frameworks. The `Swift + SwiftUI` bar therefore uses Swift language bytes, and the `PHP + Laravel` bar uses PHP language bytes. The interface will name this convention in accessible SVG metadata instead of claiming that GitHub detects framework usage directly.

All six rows are normalized across Swift, PHP, Go, Rust, TypeScript, and JavaScript bytes, then sorted by percentage from highest to lowest.

The panel title becomes `Core technology footprint`. Its context label becomes `PUBLIC REPOSITORIES · 4 OWNERS`; it will no longer claim to show the top public repositories or a global top-five language ranking.

## Selected Work Overflow

The NosFerry description will use explicit SVG text lines with controlled widths in both themes. Each line must end inside the dominant card's right padding rather than relying on browser text wrapping.

## Failure Behavior

The workflow must fail with a clear error if the personal user is absent. A missing organization response contributes no repositories instead of breaking the entire visualization, allowing a public organization rename or temporary access difference to degrade safely.

## Verification

Automated tests will cover:

- aggregation of language sizes from the personal account and all three organizations;
- the fixed technology list, percentage ordering, and normalization to 100 percent;
- retention of zero-value technologies;
- the JavaScript language signal;
- exclusion of unrelated languages from the rendered footprint;
- the public-only GraphQL constraint;
- explicit NosFerry line boundaries in both SVG themes;
- rendering of the final light and dark SVG assets.
