---
name: trauma-informed-wellbeing-ui
description: >-
  Design and implementation guidance for trauma-informed, highly accessible (WCAG 2.2 AA), 
  reassuring, mobile-first, and low-bandwidth UI/UX tailored for participants across schools, 
  corporate workplaces, churches, and human-service organizations. Use when designing or building 
  participant-facing screens, assessment flows, consent centers, and wellbeing dashboards.
---

# Trauma-Informed & Accessible Wellbeing UI/UX (SWEEP Care AI)

## Target Audience Context
Participants include students, employees, congregants, and service users who may be experiencing emotional distress, burnout, vulnerability, or anxiety. The interface must communicate safety, predictability, non-judgment, and total agency.

---

## 1. Core Trauma-Informed Principles (SAMHSA & Healthcare UX)

1. **Safety & Predictability:**
   - Always tell the user how many questions exist, estimated completion time (e.g., "5–7 minutes"), and that answers autosave continuously.
   - Never show abrupt countdown timers, flashing elements, or high-urgency alarms.
   - Provide a persistent, discreet "Quick Exit" button for sensitive environments.

2. **Trustworthiness & Transparency:**
   - Every assessment screen must feature an accessible "Who sees this?" tooltip explaining visibility (e.g., "Aggregated into team trends only — no manager can see your personal responses").
   - Explicitly display whether the assessment is Identified or Anonymous before starting.

3. **Choice & Agency:**
   - Allow participants to skip optional questions or pause and resume later.
   - Clear and effortless consent withdrawal mechanisms in the Consent Centre.

4. **Collaboration & Empowerment:**
   - Present results with non-stigmatizing, growth-oriented language (e.g., "Opportunities for Support" instead of "Deficit / Failure").
   - Avoid red/alarming color palettes for low wellbeing scores; use calm, neutral tones (e.g., slate, lavender, teal, warm amber).

---

## 2. Accessibility Guidelines (WCAG 2.2 AA Mandatory)

- **Contrast Ratios:** Minimum 4.5:1 for body text, 3:1 for large text and UI components.
- **Non-Color Reliance:** Never use color alone to convey state or score severity. Always pair color with text labels, icons, or numeric values.
- **Keyboard Navigation:** Full tab order, visible focus rings (`focus-visible:ring-2 focus-visible:ring-primary`), and `Enter`/`Space` activation for all interactive elements.
- **Screen Reader Semantics:**
  - Proper ARIA landmarks (`role="main"`, `role="region"`, `aria-live="polite"` for autosave indicators).
  - Radiogroups and Likert matrices must have associated `<fieldset>` and `<legend>` elements.
- **Touch Targets:** Minimum 44x44 CSS pixels for mobile touch targets (Likert radio buttons, buttons, navigation links).

---

## 3. Low-Bandwidth & Resilient Mobile Architecture

- **Mobile-First Layout:** Single-column layout on viewports < 768px.
- **Autosave & Offline State:**
  - Autosave answers after each selection or blur via background debounce.
  - Display non-distracting sync state badge: `Saved locally` → `Syncing...` → `All answers saved`.
  - Cache active assessment forms in IndexedDB/Local storage to survive connection drops without data loss.
- **Asset Optimization:** Zero heavy hero videos; vector SVGs for illustrations; modern variable system fonts (`font-sans`).

---

## 4. UI Copy & Tone of Voice

- **Avoid Medicalization:** Do not use clinical diagnostic labels ("depression", "disorder", "pathology"). Use wellbeing domain terminology ("Emotional wellbeing", "Energy & fatigue", "Workplace connection").
- **Clear Distinction of Status:**
  - `DATA`: "What you reported"
  - `CALCULATION`: "Calculated domain score"
  - `INTERPRETATION`: "Suggested focus areas"
  - `RECOMMENDATION`: "Optional programs and resources"
