# Redesign Brief — Climber Rehabilitation App (攀爬康复仪)

> Paste this whole document into Claude (Design) to generate a new visual design + screen flows.
> It is grounded in the real, currently-running app logic. Don't invent features — redesign what exists.

---

## 1. Role & Goal

You are a senior product designer specializing in **medical / rehabilitation device interfaces**. Redesign the UI/UX of an existing Android app for a **climbing rehabilitation machine** (攀爬康复仪). The app already works functionally but looks unpolished, is hard to use, and has fragile layouts. Make it **calm, trustworthy, clinical, and effortless to use** — and **bilingual (Simplified Chinese + English)**.

Deliver: a cohesive design system, redesigned screen layouts (described in detail + visual mockups), and component specs that a React Native / Expo developer can implement directly. Do **not** change what the app does; change how it looks and feels.

---

## 2. Product Context

- **What it is:** A companion app for a physical climbing/stepping rehab machine. A tablet (or phone) runs the app and connects over **Bluetooth (BLE)** to the machine and to body sensors.
- **Who uses it:** Patients doing supervised rehab/exercise, and clinicians/operators who set up users and read results. Many users are older, fatigued, or have limited mobility — clarity and large touch targets matter.
- **Where it runs:** **Portrait orientation**, on a tablet or phone (often mounted near the machine). Design portrait-first and **responsive** (must not break between phone and tablet widths). Used at arm's length during exertion, so primary live data must be **glanceable from a distance**.
- **Connected sensors (BLE):** heart-rate strap (KYTO), posture sensor (WIT-Motion), and a 4-point force sensor (left/right hand, left/right leg). The machine receives **resistance** commands (left/right).
- **Tech stack to design within:** Expo / React Native, `expo-router` (file-based screens), `expo-sqlite` (local DB), `react-native-ble-plx`. Light + dark mode supported. Assume `react-native-reanimated` available for animation and `react-native-svg` for charts/gauges.

---

## 3. Information Architecture (the real screens)

**Splash** → **Home** → four feature areas, plus **Settings** (gear, top-right).

### Home (`(tabs)/index`)
Header = organization name (configurable) + settings gear. Body = four large entry cards:
1. **动态评估 / Dynamic Assessment** — pick a patient, run a posture-based assessment session.
2. **自由训练 / Free Training** — the main live workout screen.
3. **情景游戏 / Scenario Game** — gamified training. *(Currently an empty placeholder — design an intended layout / "coming soon" state, see §6.)*
4. **用户管理 / 运动数据 — User Management & Exercise Data** — patient list + per-patient history.
Logo pinned at bottom.

### Free Training (`free-training`) — the hero screen
Real-time session for the selected patient. Live elements on screen at once:
- **4 force bars**: 左手力 / 右手力 / 左腿力 / 右腿力 (left hand, right hand, left leg, right leg force, in Newtons).
- **Heart rate** (bpm) with color zones (green/orange/red), target range, and MAX.
- **Exercise duration** (timer), with a target.
- **Calories** (kcal), with a target.
- **Speed** — current + average (m/s).
- **Climbing distance** (m), with a target.
- **Posture** indicator.
- **Resistance control** — left & right, adjustable 1–10, sent to machine over BLE.
- **Start / Pause / End** controls; a **target-setting modal** (duration/distance/calories); an **accessory/connection modal** (mode select + device connect); on End, the session is saved to the DB.

### Dynamic Assessment (`dynamic-assessment` → `exercise`)
Patient picker + new-patient form (name, gender, age, height, weight). Then a session screen centered on a **large circular countdown/progress ring** ("运动时长"), with heart rate, distance, left/right resistance, target setting, and a heart-rate-too-high alert banner ("心率过高 请停止运动").

### User Management & Exercise Data (`user-management`)
Grid/list of patient cards (name, gender, age, height, weight, avatar). Selecting a patient shows their **exercise records**: date, type, duration, distance, calories, avg/max speed, avg/max heart rate, targets, and per-second detail (heart rate + speed over time → trend charts).

### Settings (`settings`)
Organization name; auto-lock time; version mode (单机版/standalone vs networked); language; and **BLE device IDs** for heart-rate, posture, and force sensors (pair/save). Save buttons with success/error alerts.

### Data model (for designing cards & history)
- **User:** id, name, age, gender, height, weight, avatar?
- **ExerciseRecord:** id, userId, date, type, duration, distance, calories, averageSpeed, maxSpeed, heartRate{avg,max}, trainingTargets{duration?,distance?,calories?,speed?}, detailedData[{time, heartRate, speed}].

---

## 4. Problems to Fix (why it needs a redesign)

1. **Fragile, absolutely-positioned layouts.** Live screens scatter widgets with hardcoded pixel offsets (`position:absolute`, `bottom:380`, `paddingHorizontal:240`, fixed `450px` circles). This overlaps/clips on different screen sizes and contributes to layout breakage and crashes. **Replace with a responsive, flex/grid layout system** that adapts to any portrait size — this is a top priority.
2. **No design system.** Colors are hardcoded ad-hoc across files (`#FF6B6B`, `#4ECDC4`, `#FF7F50`, `#FF6B35`…); the theme file is barely used. Typography, spacing, radii, and shadows are inconsistent.
3. **Weak visual hierarchy.** During a workout it's unclear what to look at first. Primary metrics, secondary metrics, and controls aren't visually tiered.
4. **Inconsistent components.** Buttons, cards, and modals differ screen to screen.
5. **Partial dark mode.** Several screens hardcode white backgrounds and black text.
6. **Oversized/overflowing elements.** e.g. splash title at 80pt with a fixed 240px height.
7. **Placeholder & mock content.** Scenario Game is empty; some live data is randomly generated — design real, intentional states.

---

## 5. Design Direction

**Aesthetic:** Clean **medical / clinical** — calm, trustworthy, rehab-clinic feel. Soft, low-saturation palette (think soft blues/teals and greens), generous whitespace, rounded cards, gentle shadows, large readable type. Avoid loud "gym app" energy; favor reassurance and clarity. Accessible contrast (WCAG AA), large touch targets (≥48dp), and a layout legible at arm's length.

**Deliver a design system:**
- **Color tokens** for light + dark: background, surface/card, primary (clinical accent), secondary, plus semantic **status colors** (success/in-zone green, warning/caution amber, danger/over-limit red) used consistently for heart-rate zones, alerts, and connection state.
- **Heart-rate zone scale** (resting → moderate → vigorous → max) as a reusable color ramp.
- **Typography scale** (display / title / subtitle / body / caption / large-number "metric" style for live readouts) with CJK + Latin support; numbers should be tabular and very legible.
- **Spacing, radius, elevation, and icon** tokens.
- **Core components:** primary/secondary/danger buttons, metric card, force bar, circular progress/gauge, list/grid patient card, modal/sheet, header, alert banner, connection-status chip, stepper (for resistance ±), tab/segmented control, empty & loading & error states.

**Bilingual (CN / EN):**
- Design every label, button, and screen to display **Simplified Chinese and English**. Recommend an approach (e.g. global language toggle in Settings — already exists — with i18n keys) and show key screens in both languages.
- Account for **text length differences** (English often longer): layouts must not clip or overflow when switching languages. Provide a glossary mapping the existing Chinese terms to English (动态评估→Dynamic Assessment, 自由训练→Free Training, 情景游戏→Scenario Game, 用户管理→User Management, 运动数据→Exercise Data, 左手力→Left Hand Force, 阻力→Resistance, 心率→Heart Rate, 运动时长→Duration, 攀爬距离→Distance, 能量消耗→Calories, 体姿态→Posture, 开始/暂停/结束→Start/Pause/End, etc.).

---

## 6. Screen-by-Screen Redesign Asks

For each, provide: layout/wireframe, component breakdown, states (idle/active/error), and a styled mockup in both light & dark.

1. **Splash** — calm branded loading; logo + app name + version; replace the oversized title.
2. **Home** — four feature entries as clear, equal, legible cards with icon + bilingual label + short helper text; obvious primary action (Free Training). Show device/patient context and connection status. Make Scenario Game read intentionally (e.g. tasteful "coming soon" treatment) rather than broken.
3. **Free Training (hero)** — the key redesign. Replace the absolutely-positioned scatter with a **structured responsive layout**: a clear primary zone (the metrics the patient/clinician watches most — e.g. duration, heart rate with zone, distance/calories vs target), a **4-point force visualization** (hand/leg, left/right — consider a body-map or grouped bars), prominent **left/right resistance steppers**, and a fixed, thumb-reachable **Start/Pause/End** bar. Define how it reflows on narrow vs wide portrait. Include the **target-setting** and **connect-accessory** flows as bottom sheets, and an unmissable **heart-rate-over-limit alert** state.
4. **Dynamic Assessment** — patient select + add/edit patient form (clean, validated), then the **circular progress/countdown** session screen with supporting metrics and the safety alert banner. Make the ring responsive (no fixed 450px).
5. **User Management & Exercise Data** — patient grid/cards; patient detail with a **history list and trend charts** (heart rate & speed over a session) using the per-second data; clear empty state when a patient has no records.
6. **Settings** — grouped sections (Organization, General: lock time / version mode / language, **Bluetooth devices**: heart-rate / posture / force pairing with live connection status). Clear save feedback.
7. **Global states** — define BLE **connection status** (disconnected / scanning / connected) visual language, plus loading, empty, and error patterns reused everywhere.

---

## 7. Constraints & Deliverables

**Constraints**
- Portrait-first, fully **responsive** across phone↔tablet; **no hardcoded absolute pixel positions** for primary layout. Use flex/grid, percentages, and safe-area insets.
- Light **and** dark mode for every screen.
- Bilingual CN/EN with overflow-safe layouts.
- Implementable in React Native / Expo with the listed libraries (SVG gauges/charts, Reanimated transitions). Keep effects performant for a low-end Android tablet — this app must run **smoothly without crashing or going black**, so prefer simple, robust layouts over heavy effects.
- Large touch targets, AA contrast, legible-at-distance numerals.

**Deliverables**
1. Design-system / token sheet (color, type, spacing, radius, elevation, icons) for light + dark.
2. Reusable component library (specs + visuals) per §5.
3. Redesigned mockups for every screen in §6, in both languages and both themes.
4. Notes mapping each design token/component to how it should be implemented (e.g. a central theme file replacing the scattered hardcoded colors), so the rebuild is straightforward.
5. A bilingual string glossary.

Ask me clarifying questions only if something blocks you; otherwise propose sensible defaults and proceed.
