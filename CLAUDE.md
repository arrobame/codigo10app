# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

@AGENTS.md

## Commands

```bash
# Development
npm start                   # Metro bundler (web on http://localhost:8081)
npm run web                 # Alias for web-only development

# Build & Deploy
npm run build:web           # expo export --platform web + patch-web.js post-processing
npm run deploy              # build:web then push to Vercel production

# Release (bumps package.json + git tag)
npm run release:patch       # patch version bump → push + tag
npm run release:minor       # minor version bump → push + tag
```

**Dev server caveat**: Never set `$env:CI = "1"` before starting — it disables Metro hot reload ("Metro is running in CI mode, reloads are disabled").

**Reset tutorial** (browser console): `localStorage.removeItem('cbvp_tutorial_seen'); location.reload()`

## Architecture

### Stack
- **Expo SDK 54** (web-only PWA, deployed to Vercel at `https://codigo10.vercel.app`)
- **React Navigation** native stack with typed `RootStackParamList` (`src/types/index.ts`)
- **Firebase** (Spark plan): Firestore for scores/leaderboard, Auth for Google Sign-In (popup on web)
- **Vercel Analytics** via `@vercel/analytics/react` (NOT `/next`) — rendered in `App.tsx`

### Theming pattern
Every screen/component uses `makeStyles(C: ThemeColors, isDark: boolean)` memoized with `useMemo`:
```tsx
const { C, isDark } = useTheme();
const styles = useMemo(() => makeStyles(C, isDark), [C, isDark]);
```
`ThemeColors` is defined in `src/theme/colors.ts`. Both `darkColors` and `lightColors` share the same interface.

### Navigation
All routes declared in `RootStackParamList` (`src/types/index.ts`). Navigator is in `src/navigation/index.tsx`. The web container is constrained to `maxWidth: 480` to mimic a phone layout. Dynamic header titles are set with `useLayoutEffect(() => navigation.setOptions({ title }), [...])`.

### Data layer
- `src/data/codigos.ts` — static array of all Código 10 entries (`{ codigo, descripcion, nemotecnia }`)
- `src/data/salidas.ts` — step-by-step radio dispatch scenarios (`Salida[]`)
- `src/utils/scores.ts` — Firestore reads/writes for leaderboard records (Firestore collection: `records/{uid}`, subcollection `records/{uid}/games`)
- `src/utils/storage.ts` — AsyncStorage for local error tracking (`cbvp_errors` key)
- `src/utils/inAppNotifications.ts` — Firestore `broadcasts` collection, last-seen tracked in AsyncStorage (`cbvp_last_broadcast_seen`)

### Quiz engine (`src/screens/QuizScreen.tsx`)
- `mode: "streak" | "speed" | "practice"`, `direction: "codigo_a_descripcion" | "descripcion_a_codigo"`
- Distractors are weighted by the user's error history and proximity (adjacent codes ±8 positions)
- Near-miss detection: codes within ±2 of the correct code trigger a `"near_miss"` feedback phase

### Salidas a Servicios (`src/screens/SalidaDetailScreen.tsx`)
- `SalidaSide = "dispatch" | "command" | "mobile"` — three bubble styles
- `dispatch` → red border, left-aligned; `command`/`mobile` → yellow border; `mobile` → right-aligned
- Inline tappable code chips: message text split on `/(10-\d+)/g`, each match rendered as a pressable `<Text>` that opens a modal with the code's `descripcion` (no nemotecnia shown)

### Build post-processing (`patch-web.js`)
Run automatically by `build:web`. Injects PWA manifest, CBVP logo, and `beforeinstallprompt` capture into `dist/index.html`. Also writes `dist/.vercel/project.json` to re-link the Vercel project (Expo wipes `dist/` on each export).

### LocalStorage keys (web)
| Key | Purpose |
|-----|---------|
| `cbvp_tutorial_seen` | Tutorial shown flag (set to `"1"` after first close) |
| `cbvp_ranking_snapshot` | Previous ranking position for "you've been surpassed" alerts |
| `cbvp_last_broadcast_seen` | Last seen broadcast ID |
| `cbvp_errors` | Per-code error counts (via AsyncStorage) |
