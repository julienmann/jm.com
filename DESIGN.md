# Mann Dev — Design System

## Palette
- `--bg: #0d0b09` — warm near-black background
- `--fg: #ede8d5` — warm off-white foreground
- `--mid: #9a9080` — muted warm grey for secondary text
- `--light: #131110` — slightly lighter than bg, for subtle panels
- `--rule: rgba(237,232,213,.1)` — hairline rule colour
- `--rule-accent: rgba(196,146,42,.3)` — gold hairline rule
- `--accent: #c4922a` — gold accent (active states, numbers, borders, CTAs)
- `--accent-dim: rgba(196,146,42,.18)` — dim gold for backgrounds

## Typography
- `--bebas: 'Bebas Neue', sans-serif` — display, large numbers, section labels
- `--serif: 'Playfair Display', serif` — italic editorial subheadings
- `--mono: 'IBM Plex Mono', monospace` — body, UI, tags, meta

## Layout
- Max content width: 1600px, centred
- Base padding: 3rem horizontal (1.5rem mobile)
- Section headers: flexbox space-between, Bebas label with 2px gold underline
- Two-column grids separated by 1px rule (no gap), not boxed cards
- Border language: `1px solid var(--rule)` for structure, `1px solid var(--rule-accent)` for gold emphasis

## Motion
- GSAP 3 + ScrollTrigger throughout
- Loader: letters stagger in, progress bar, curtain wipe
- Scroll reveals: clip-path wipes, autoAlpha + y offsets
- Cursor: gold dot + lagging ring

## Key Components
- `.section-label` — Bebas, 2rem, 2px gold underline
- `.stat-box` — grid cell, Bebas large number, mono label
- `.about-manifesto` — serif italic, gold border + outline
- `.process-step` — left gold bar animates on active, Bebas title, mono body
- `.pcanvas` — editorial process panel, no chrome, step num + name header
