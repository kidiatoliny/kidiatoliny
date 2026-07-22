# Profile Card Color Remap

## Goal

Change the palette of three prominent cards without altering the wider Signal Grid color system.

## Scope

- The KIDIATOLINY identity card changes from blue to purple.
- The NosFerry selected-work card changes from blue to purple.
- The Apple native selected-work card changes from purple to coral.
- Every other blue remains unchanged, including links, headings, Akira accents, GitHub statistics, and language colors.
- Lime and neutral surfaces remain unchanged.

## Theme Colors

Light theme:

- Purple surface: `#6C4CF1`
- Coral surface: `#FF6B4A`

Dark theme:

- Purple surface: `#9B7BFF`
- Coral surface: `#FF8066`

Text colors inside the remapped surfaces must be selected per theme to preserve readable contrast. The identity and NosFerry cards use light foregrounds on the deeper light-theme purple and dark foregrounds on the lighter dark-theme purple. The coral cards use dark foregrounds in both themes.

## Files

- `assets/signal-identity-light.svg`
- `assets/signal-identity-dark.svg`
- `assets/signal-work-light.svg`
- `assets/signal-work-dark.svg`

## Verification

Automated asset tests will assert the exact surface and foreground colors in both themes and confirm that unrelated blue tokens remain present. All four SVGs will be rendered to PNG for visual inspection before commit and push.
