# Open design questions (for Alvaro)

Collected from the component batches. Answer inline; resolved items move to `docs/design-decisions.md`.

## Batch B: Top Performers, Players to Watch, Stats
1. The chip labels are "Scoring / Goalie / Faceoff"; Figma says "Goals / Saves / Faceoff Wins". Which do you prefer?
2. Players to Watch: pick the scorer by season total points or by points per game? (It currently uses totals.)
3. The scorer secondary line shows "2/5 SH" (goals/shots) for the PRD's "n/m shooting". Is that OK?
4. The penalties card is titled "Extra-Man & Penalties" (Figma: "Power Play"). Should box-score tables get a totals row?
5. NCAA data has no passes/touches and no 2-point goals (PLL-only stats), so those Figma rows are dropped. Confirm.
6. At 320px the Top Performers row is tight (the avatar nearly touches the card edge).

## Batch A: Header Bar, Other Games Bar, Section Selector, Game Flow
7. GameFlow goal segments use team primaries, but many NCAA teams are navy (Duke vs ND look alike). Use a lighter tint, or a per-team accent override?
8. Pregame weather is text only ("73°F · Windy · 1% precip") because the icon set has no weather glyphs. Add weather icons to Figma?
9. The Figma Live header has a GameSync banner and a Stats/Highlights action row. The PRD puts those elsewhere, so they're omitted. Confirm.
10. Unchanged rank/RPI after a final shows "=". Hide unchanged values instead?
11. The minimized header score is 32px (`score` token); the Figma collapsed card uses 24px. Add a `score.sm` 24px token?
12. Tab label "Plays" vs the PRD/Figma "Play-by-Play"?

---
**Status 2026-10-13:** batch questions resolved as D7–D18 in `docs/design-decisions.md`. Still open for Alvaro:
- Weather icons (sun/cloud/rain/snow/wind/indoor) are drawn privately in VenueInfo. Should they be designed in Figma?
- Insight cards could show the player's avatar (the data has playerId). Wanted?
- Goal markers on the win-probability line?
- The desktop Header Bar is sparse at 1200px width. Redesign for desktop, or constrain its width?
