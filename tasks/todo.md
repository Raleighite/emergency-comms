# UI Redesign + Dark Mode — Emergency Comms

## Design System
- **Primary:** Navy/slate (`slate-800`/`slate-900`), dark mode: `slate-950`/`slate-900`
- **Accent:** Warm amber (`amber-500`/`amber-600`) for CTAs
- **Background:** Light: `gray-50`, Dark: `slate-950`
- **Cards:** Light: `bg-white rounded-2xl shadow-md`, Dark: `bg-slate-900 border-slate-800`
- **Text:** Inter font, 16px+ body, high contrast
- **Severity borders:** Left border — blue=info, amber=important, red=critical
- **Dark mode:** `dark:` Tailwind variants, ThemeContext, localStorage + prefers-color-scheme

## Todo

### Infrastructure
- [ ] 1. `index.css` — Inter font, dark mode base styles, skeleton shimmer animation
- [ ] 2. New: `ThemeContext.jsx` — dark/light toggle, localStorage, prefers-color-scheme default
- [ ] 3. New: `Toast.jsx` — toast notification component (dark surface both modes)
- [ ] 4. New: `SkeletonLoader.jsx` — shimmer skeleton for loading states
- [ ] 5. New: `ConfirmModal.jsx` — reusable confirmation modal

### Layout + Core
- [ ] 6. `App.jsx` — wrap in ThemeProvider
- [ ] 7. `Layout.jsx` — dark navy nav, theme toggle button, warm tones, dark mode

### Pages
- [ ] 8. `Home.jsx` — hero redesign, 3-step, tier callout, dark mode
- [ ] 9. `Login.jsx` — cleaner card, larger inputs, dark mode
- [ ] 10. `AuthVerify.jsx` — spinner, cleaner error, dark mode
- [ ] 11. `Dashboard.jsx` — card-based, status badges, skeleton loader, dark mode
- [ ] 12. `CreateEvent.jsx` — template cards with icons, dark mode
- [ ] 13. `EventView.jsx` — status badge, severity updates, sticky CTA, auto-refresh indicator, dark mode
- [ ] 14. `EventAdmin.jsx` — char counter, draft save, confirm modal, lock icons, dark mode

### Components
- [ ] 15. `PasswordGate.jsx` — calmer styling, dark mode
- [ ] 16. `Onboarding.jsx` — larger text, dark mode

### Tests
- [ ] 17. Update tests + verify all pass

## Review
*(To be filled after implementation)*
