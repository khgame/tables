# Assets & Attribution

This demo uses pictograms from game-icons.net for card illustrations.

- Source: https://game-icons.net
- License: Creative Commons Attribution 3.0 (CC BY 3.0)
- Authors: Lorc, Delapouite & contributors

Imported icons (as SVG, bundled via Vite `?raw`):

- backward-time (Delapouite)
- baseball-bat (Delapouite)
- brain-freeze (Lorc)
- crown (Lorc)
- distraction (Lorc)
- exit-door (Delapouite)
- grab (Lorc)
- life-support (Lorc)
- magic-broom (Delapouite)
- magic-portal (Lorc)
- megaphone (Delapouite)
- prayer (Lorc)
- return-arrow (Lorc)
- sandstorm (Delapouite)
- time-trap (Lorc)

Notes:
- `breaking-chain` is currently using the built-in fallback glyph in the codebase because a suitable icon name was not resolved; feel free to substitute with a preferred chain-breaking variant from game-icons.net and update `ui/src/assets/game-icons` and the mapping in `CardArtwork.tsx` accordingly.
- All SVGs are normalized to use `currentColor` in the UI so they naturally inherit the card palette.
