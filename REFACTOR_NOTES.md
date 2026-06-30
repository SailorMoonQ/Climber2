# Refactor Notes — Climber Rehab redesign applied

The Claude Design handoff has been implemented into the live Expo/React Native codebase.
All BLE / SQLite / context logic is preserved; only UI/layout/theme changed.

## What changed
- **`constants/theme.ts`** — replaced with the central design tokens (colors light+dark, HR-zone
  ramp + `hrZoneColor`/`hrZoneKey`, spacing/radius/elevation/type, system-safe fonts). No more
  scattered hardcoded hex.
- **`i18n/` (new)** — `LanguageProvider` + `useI18n()` with a full CN/EN string table. Language is
  persisted in a new `app_settings` table (added to `utils/database.ts`) and toggled from Settings.
- **`hooks/use-tokens.ts` (new)** — `const { c } = useTokens()` for theme-aware colors.
- **`components/ui/primitives.tsx` (new)** — shared, responsive, token-driven components:
  `Txt`, `Metric`, `Card`, `Header`, `AppButton`, `Stepper`, `ConnectionChip`, `SegmentedControl`,
  `ProgressBar`, `ForceTile`, `HrZoneRamp`, `Avatar`, `AlertBanner`, `BottomSheet`.
- **Screens rebuilt with flex/grid (no more absolute positioning):**
  Splash (`app/index.tsx`), Home (`app/(tabs)/index.tsx`), Free Training (`app/free-training.tsx`),
  Dynamic Assessment session (`app/exercise.tsx`) + picker (`app/dynamic-assessment.tsx`),
  User Management (`app/user-management.tsx` + `components/user-list-grid.tsx`),
  Settings (`app/settings.tsx`), Scenario Game (`app/scenario-game.tsx`).
- **Navigation** — root + tabs layouts now hide the native header; each screen renders the custom
  `Header`. `GestureHandlerRootView` + `LanguageProvider` added at the root.

## Hardware wiring status (for the debugging phase)
- **Wired to real sensors already:** 4-point Force (`ForceService.setForceCallback`), Resistance
  out (`ForceService.sendResistanceData` on every stepper change), Heart rate in Assessment
  (`KYTOHeartRateService.scanAndConnect`).
- **Still simulated (random) until wired to hardware:** heart rate, speed, distance, calories in
  **Free Training** (the per-second `setInterval` sampler). Swap that block for the real BLE feed
  during hardware debug.
- Sensor device IDs are still configured in **Settings → Bluetooth devices**.

## Not yet restyled (functional, low priority)
`components/ui/target-setting-modal.tsx` and `accessory-modal.tsx` still use the old styling but
work. The old `app/(modals)/user.tsx` add/edit form is unchanged. Fonts use system fallbacks
(IBM Plex / Noto Sans SC can be added later via `expo-font` — only `theme.ts` Fonts needs updating).

## Build locally (replaces remote Expo) + start hardware debug
Local Android build (needs Android SDK + JDK 17 installed):
```
npx expo install --check      # verify dependency versions
npx tsc --noEmit              # typecheck (run this first on your machine)
npx expo run:android          # local prebuild + Gradle build to a connected device/emulator
```
BLE needs a real device (not an emulator) and the app installed as a dev/standalone build.
