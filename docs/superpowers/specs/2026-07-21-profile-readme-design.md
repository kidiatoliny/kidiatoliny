# Profile README Design

## Objective

Turn the profile README into a clear engineering portfolio. The page should explain what Kidiatoliny builds, establish the scale of the work, and make the repository catalog easy to navigate without tables or badge walls.

## Page structure

1. An animated macOS terminal opens the README. It runs `whoami`, `current-focus`, and `./pacman`, with the contribution game rendered as command output.
2. A short positioning statement and the primary profile links follow the terminal.
3. `~/selected-work` presents four areas with product context:
   - NosFerry as a production platform for ferry operations in Cabo Verde.
   - Apple native products across macOS and iOS, including Hodos and DotSync.
   - Akira as the open-source ecosystem for payments, fiscal tooling, desktop foundations, and developer infrastructure.
   - Hunter as an open-source product with the repository as its canonical destination.
4. `~/open-source` uses native expandable sections for the larger repository catalog. Each group includes a concise purpose statement before its links.
5. `~/learning` distinguishes deep learning and cybersecurity as active study areas rather than shipped product work.
6. `~/connect` stays compact. The previous toolbox content moves into the closing terminal to avoid duplication.
7. A second macOS terminal closes the README. It presents three compact command outputs:
   - `github-stats --year current` shows live contributions, current streak, and longest streak.
   - `languages --top` shows the leading languages across public GitHub repositories.
   - `stack --current` groups the curated stack into:
     - applications: Laravel, React, and React Native;
     - Apple native: Swift, SwiftUI, App Intents, Live Activities, SwiftData, and Keychain;
     - systems: Go, Rust, Tauri, and Wails;
     - intelligence: Apple Intelligence and MLX;
     - data: PostgreSQL, MySQL, SQLite, and Redis;
     - operations: Docker, GitHub Actions, Pest, and PHPStan.

## Visual language

- Keep terminal syntax as the common visual system.
- Use GitHub-native disclosure controls to create hierarchy without tables.
- Put context before links so repository names never appear as an unexplained list.
- Keep light and dark SVG variants synchronized with GitHub theme preferences.
- Avoid decorative badges, emojis, oversized headings, and duplicated sections.

## Dynamic assets

- The existing Pacman workflow continues to generate the animated contribution graph and wraps it in the opening terminal.
- The workflow also queries GitHub contribution, streak, and public repository language data, combines it with the curated current stack, and generates light and dark closing terminals.
- Generated SVG files remain on the `output` branch so the profile README stays lightweight.
- The workflow runs on its current schedule and through manual dispatch.

## Verification

- Test SVG wrapper and stats rendering with Node tests.
- Validate generated SVG documents with `xmllint`.
- Render light and dark PNG previews and inspect layout at the GitHub README width.
- Check README links and confirm no visible project name is left without surrounding context.
