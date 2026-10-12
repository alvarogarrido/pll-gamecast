# Design decisions

Source of truth for the Gamecast design tokens. Approved by Alvaro Garrido on 2026-10-12, after merging the audits of both PLL Figma files. The full proposal (evidence, module map, asset plan) is in the token proposal artifact; the raw audits are in `~/PLL/reference/figma-audit/`.

| # | Decision | Value |
|---|---|---|
| D1 | Page background | `#111111` (brand/coal, absorbs #121212) |
| D2 | Card surface | `#1F1F1F` (gray/900) |
| D3 | Live / positive | `#00CB83` (absorbs #00C364; mint #20F4CA not adopted) |
| D4 | Web fonts | **Inter** for UI text, **Barlow Condensed** for scores, the clock and big numerals. SF Pro can't be licensed for web. |
| D5 | Spacing scale | 2, 4, 8, **10**, 12, 16, 20, 24, 32, 40 |
| D6 | Gold | `#FFCB06` (absorbs #FFCC06, #FFC906, #FFCE00, #FFD200) |

## Semantic color tokens
| Token | Value |
|---|---|
| surface.page | #111111 |
| surface.card | #1F1F1F |
| surface.track | #262626 |
| surface.raised | #313131 |
| surface.chip | #3D3D3D |
| surface.selected | #595959 |
| border.default | #3A3E40 |
| border.hairline | #FFFFFF @ 8% |
| text.primary | #FFFFFF |
| text.secondary | #B4B4B9 |
| text.tertiary | #98989D |
| text.disabled | #595959 |
| text.onAccent | #111111 |
| accent.gold | #FFCB06 |
| accent.goldSubtle | #282310 |
| status.live / status.positive | #00CB83 |
| status.negative | #FA5050 |
| status.info / link | #3BA9F6 |
| tints | the same token at 10% alpha (live.tint, gold.tint, negative.tint) |

Team colors come from the API data at runtime (`--team-primary`, `--team-secondary` set inline on a team scope).

## Type scale (px, size/line-height)
| Token | Spec | Family |
|---|---|---|
| score.hero | 48/48, 800 | Barlow Condensed |
| score | 32/32, 800 | Barlow Condensed |
| score.sm | 24/24, 800 (D14) | Barlow Condensed |
| clock | 13/16, 600, tabular | Barlow Condensed |
| title1 | 28/34, 600 | Inter |
| title3 | 20/25, 700 (section headers, uppercase) | Inter |
| headline | 17/22, 600 | Inter |
| callout | 16/21, 400 | Inter |
| subhead | 15/20, 400/600 | Inter |
| footnote | 13/18, 400/600 | Inter |
| caption | 12/16, 500 | Inter |
| caption2 | 11/13, 500 | Inter |

## Radius and elevation
- Radius: xs 4, sm 8, md 10 (cards), lg 20, pill 999.
- Elevation: `elevation.1` = 0 0 12px #000; `elevation.2` = 0 2px 12px rgba(0,0,0,.8). Cards stay flat with a 1px `border.default`. Shadows are only for sticky bars and overlays.

## Component decisions (2026-10-13)
Alvaro decided D7–D9. The coordinator decided D10–D18 from the PRD and Figma; challenge any of them in `docs/design-questions.md`.

| # | Decision |
|---|---|
| D7 | Copy follows Figma/PRD: the tab is **"Play-by-Play"**; Top Performers chips are **"Goals" / "Saves" / "Faceoff Wins"**. |
| D8 | Play-by-Play micro rows (non-goal plays) are a **single ~40px line**: team logo · play type · "J. Smith (#11)" · detail · clock. No avatar. Goals stay strong cards. |
| D9 | Players to Watch top scorer = **points per game**, minimum 3 games played. |
| D10 | Team logos use ESPN's dark-background variants (`500-dark`). |
| D11 | Conference standings show separate **Conf W, Conf L, W, L** columns (PRD), not "W-L" strings. |
| D12 | Box score tables get a **Totals** row. |
| D13 | Unchanged rank/RPI after a final is hidden (no "=" indicator). Only real movement shows. |
| D14 | New type token **score.sm** (24/24 Barlow 800) for the minimized header and compact score chips. |
| D15 | Final-game win probability: the header shows the result ("Duke won") instead of 100.0% / 0.0%. Live values cap their display at 99.9% / 0.1%. |
| D16 | Desktop pregame keeps venue and weather inside the Header Bar; there's no separate VenueInfo card on desktop pregame. |
| D17 | GameSync banner and Figma's header action row are out of scope (PLL app features, not in the PRD). |
| D18 | Overtime gets a fixed minimum width in the win-probability chart (at least 10% of the x axis) so its label and sudden-victory end stay legible. |
