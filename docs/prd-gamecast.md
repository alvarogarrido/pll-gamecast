# PRD summary: 2027 Season Gamecast Updates (IL-EPIC-68)

Source: Notion PRD "2027 Season Gamecast Updates PRD" (Inside Lacrosse). Goal: comprehensive, dynamic coverage of DI college lacrosse games across the pregame, live and postgame states. All layouts must be mobile and desktop friendly. Priorities: MUST / SHOULD / COULD.

## Layout
- Top, all states: Other Games Bar, Header Bar, Section Selector (Gamecast / Stats / Play-by-Play / Highlights).
- Desktop: 2 columns, left 40% / right 60%.
  - **Pre:** left = Players to Watch, Injury Report, Key Team Stats; right = Preview Video, Preview Article(s), Win Predictions, Conference Standings, Previous 3 Results.
  - **Live:** left = Win Probability, Live Game Insights, Win Predictions; right = Top Performers, Injury Report, Key Team Stats, Venue Information.
  - **Post:** left = Win Probability, Top Performers, Key Team Stats; right = Highlights Carousel, Recap Article Excerpt, Venue Information.
- Ads may go in the outer columns on desktop and in a bottom bar on mobile. Betting components come later.

## Modules
- **Other Games Bar** [Pre/Live/Post] SHOULD: small horizontal scroller of the week's other games. Each shows team logos and rankings. State shows the start time (pre), score + quarter (live) or score + "Final" (post). Order: live games, then upcoming, then completed. Within a state, sort by start time asc, then number of ranked teams desc, then sum of rankings asc, then best single ranking asc.
- **Header Bar** MUST:
  - Full, all states: team name, logo, record (show 0-0 too), national rank, RPI.
  - Pre: game date and time, where to watch, location, weather (temperature, precipitation if any).
  - Live: quarter and clock, score, where to watch, a simple 4-quarter box score.
  - Post: score, the 4-quarter box score, national rank change and RPI change after the game.
  - Minimized (sticky on scroll): logo, name, rank, plus date/time and where to watch (pre), score with quarter and clock (live), or score (post).
- **Section Selector** [Live/Post]: Gamecast, Stats, Play-by-Play, Highlights.
- **Players to Watch** [Pre] MUST, 3 sections, each with name, roster photo, jersey number, class and position:
  - Top Scorers: goals per game, shots per game and season shooting %, all to 1 decimal.
  - Goalie: saves per game and season save %.
  - Faceoff: season FO%.
- **Top Performers** [Live/Post], 3 sections, each with name, photo, jersey number and class:
  - Scorers: primary = goals; secondary = n/m shooting, assists, points.
  - Goalie: primary = saves; secondary = save %.
  - Faceoff: primary = faceoffs won; secondary = FO% and TO.
- **Injury Report** [Pre/Live] COULD: name, photo, class, jersey number, position, injury description.
- **Key Team Stats**, comparing the two teams:
  - [Pre] MUST, per-game averages to 1 decimal: scores/game, shots/game, shooting %, turnovers/game, faceoff %, save %.
  - [Live/Post]: goals, shots, shooting %, turnovers, faceoff %, save %.
- **Preview Video** [Pre] SHOULD: autoplays and recommends the next video.
- **Preview Article Excerpt(s)** [Pre] SHOULD: article name, key sentence, writer name, full-article CTA, and a carousel of other relevant articles. **Recap Article Excerpt** [Post] has the same shape.
- **Game Stakes** SHOULD: 2–3 sentences on why the game matters.
- **Win Predictions** [Pre/Live] COULD: win probability plus IL Staff Picks (team logo, staff name, staff photo).
- **Team Conference Standings** COULD: one table if both teams share a conference, otherwise a selector between the two conferences. Rows show rank, team, conference W and L, and overall W and L.
- **Previous 3 Game Results** COULD: 2 columns (one per team), 3 games each, with W/L, opponent logo, and score (team first).
- **Win Probability** [Live/Post]: line graph of how likely each team is to win now and over the course of the game.
- **Live Game Insights** [Live]: the most recent notable insight (scoring milestones, streaks, droughts, lead changes), with the latest highlighted.
- **Venue Information** [Live/Post]: location, stadium name, weather (temperature, precipitation).
- **Highlights Carousel** [Post]: carousel of relevant highlights and other videos.
- **Stats Section** [Live/Post]: a selector between Team Stats, Team A players and Team B players, following the PLL gamecast Stats tab.
- **Play-by-Play Section** [Live/Post]: filter by All / Goals / Shots / Faceoffs / Turnovers / Penalties. Each play shows the team logo, play type, relevant player info and the time on the clock.
- **Highlights tab** [Post]: video carousel of all associated highlights, plus all relevant articles.
- Future: fan vote, tournament odds impact, live view of the field.
