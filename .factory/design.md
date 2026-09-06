# Visual thesis — the routing field

## Direction and rationale

**Generative geometry: a routing field, not a dashboard.** Saved notes enter as quiet paper-like fragments on the left, pass through a precise five-way junction, and leave as colored action paths. The geometry explains the product's job: turn a pile into one deliberate direction. It avoids knowledge-graph clichés, productivity gradients, and synthetic “AI” imagery because this product makes no inferences—the learner chooses.

The interface is deliberately single-mode, a deep ink workshop. The painted background keeps browser/OS theme differences from changing contrast or atmosphere. Light ticket sheets carry the note itself; surrounding chrome recedes.

## Palette

| Token | Value | Role |
| --- | --- | --- |
| Ink | `#111516` | Page background |
| Charcoal | `#1A2021` | Raised surface |
| Chalk | `#F4F0E6` | Primary text / note sheet |
| Fog | `#B9C2BD` | Muted text (7.7:1 on ink) |
| Vermilion | `#FF6B4A` | Primary route / focus (5.8:1 on ink) |
| Mint | `#B8F2D1` | Success (13.8:1 on ink) |
| Amber | `#F4C95D` | Warning (11.7:1 on ink) |
| Rose | `#FF9D9D` | Error (9.6:1 on ink) |
| Blueprint | `#76A9FF` | Recall route |
| Lime | `#C8E86A` | Solve route |
| Lilac | `#C6A5FF` | Teach route |

Route colors are always paired with a label, verb, and distinct line/shape; color never carries status alone.

## Typography

- **Interface:** `Inter`, locally subset as a variable WOFF2 file, with a system sans fallback. Its compact, open forms keep controls clear at extension scale.
- **Note voice:** `Lora`, locally subset as a variable WOFF2 file, with Georgia fallback. The humane serif distinguishes source material from controls and makes excerpts feel like notes rather than database rows.
- Scale: 14 / 16 / 20 / 28 / 44 / 64px. Body never falls below 16px in the working app. Reading measure is capped at 68 characters; numerals use tabular forms.

## Spacing and shape

An 8px base rhythm with 4px for optical corrections: 4, 8, 12, 16, 24, 32, 48, 64. Controls are at least 44px tall with 8px between targets. Corners are purposeful: sheets use 4–8px corners, while routing controls use clipped polygonal corners and circular nodes. Thin `#394344` rules replace excess cards.

## Interaction grammar

- One note occupies the visual center; the queue is context, never a competing list.
- Five routes fan from one orange node. Keyboard keys `1–5` mirror their left-to-right order; `R` rescans; `E` opens export. Labels show shortcuts.
- Routing folds the current sheet toward the selected path over 220ms, then advances the queue. Undo returns from the same direction.
- Folder permission, offline license checks, empty queues, write errors, and the free limit each have a specific recovery action.
- Phone/extension widths stack the route controls into a two-column switchboard and omit explanatory side annotations, preserving the note and actions.

## Motion policy

Only state change moves. Sheets enter 12px from the queue origin; route paths draw once on the landing hero; button presses compress 1px. UI motion lasts 160–240ms and animates only opacity/transform. Nothing loops. Under `prefers-reduced-motion: reduce`, transforms and path drawing are removed and changes become instant opacity swaps. Depth remains through scale, overlap, and contrast.

## Asset plan and provenance

The hero is an original generated still: an abstract overhead paper-routing machine made from matte charcoal, ivory paper, and five colored geometric tracks. It clarifies “one note, one direction” without pretending the product uses AI. A hand-authored SVG route glyph provides the extension icon and small diagrams.

**Prompt sheet:** “Top-down editorial still life of a minimal geometric paper-routing machine, one warm ivory markdown note card entering a precise five-way junction, five distinct tracks made of cobalt blue, acid lime, soft lilac, vermilion coral and mint, matte black charcoal desk, subtle recycled-paper fibers, crisp hard-edged Bauhaus geometry, long soft studio shadows, tactile cut-paper and anodized metal materials, restrained composition with generous negative space, slight three-quarter perspective, palette: soot black, bone paper, signal coral, blueprint blue, mint; no text, no letters, no watermark, no logos, no people, no screens, no gradients, no neon, no glossy 3D render, no brands.”

- Model: Azure OpenAI image generation deployment `factory-image` via the factory generator.
- Date: 2026-08-28.
- License/provenance: generated originally for Note Rehearsal Router; no third-party source assets or recognizable people/brands.
- Review criteria: no pseudo-text, unintended icons, seams, impossible connections, brand marks, or palette drift. Source candidate and prompt sidecar live in `assets/src/`; optimized WebP/AVIF outputs ship locally.
- `site/public/assets/social-card.jpg` is a 1200×630 center crop of the original generated routing field. `site/public/icon/apple-touch-icon.png` is derived from the hand-authored route icon. No additional source art was introduced.
