---
name: profit-tracker-design
style: calm fintech minimalism
source: user-provided exact specification (§15 of the build prompt)
colors:
  light:
    background: "#F6F7F9"
    card: "#FFFFFF"
    foreground: "#111827"
    muted-foreground: "#6B7280"
    border: "#E5E7EB"
  dark:
    background: "#0E1116"
    card: "#161B22"
    foreground: "#E6EDF3"
    muted-foreground: "#8B98A5"
    border: "#26303B"
  accent: "#4F46E5"
  profit: "#16A34A"
  loss: "#DC2626"
radius:
  card: "16px"
shadow:
  soft: "0 1px 2px rgba(0,0,0,.04), 0 8px 24px rgba(0,0,0,.04)"
typography:
  sans: "system-ui, -apple-system, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif"
  numeric: "font-variant-numeric: tabular-nums"
layout:
  max-width: "1100px"
  mobile-padding: "16px"
  desktop-padding: "24px"
  kpi-columns: "1 (mobile) / 3 (tablet) / 6 (desktop)"
motion:
  modal-toast: "150ms"
theme-default: "system (prefers-color-scheme), user override persisted"
---

# Profit Tracker — Visual Design

## 1. Design Direction
Calm fintech minimalism. Generous whitespace, large tabular-nums figures, zero
illustrations, no gradient heroes, no motivational copy. Numbers are the hero.

## 2. Color System
Light and dark themes defined by the YAML tokens above. Accent indigo `#4F46E5`
is used only for the primary action and active states. Profit green `#16A34A`
and loss red `#DC2626` carry financial meaning and are never decorative.

## 3. Typography
System sans stack for all UI. All monetary / numeric output uses
`font-variant-numeric: tabular-nums` so columns align. Headings are medium/semibold
with tight tracking; the main "Чистая прибыль" figure is the largest element.

## 4. Spacing & Grid
Centered content column capped at 1100px. 16px gutters on mobile, 24px on desktop.
KPI grid: 1 column mobile (primary card full-width), 3 columns tablet, 6 desktop.

## 5. Components
Cards: 16px radius, soft two-layer shadow. Inputs with visible labels and
`focus-visible` ring in accent. Segmented period control. Modal centered on
desktop, bottom-sheet on mobile. Toasts bottom-center with undo.

## 6. States
Profit positive = green, negative = red with minus sign (no parentheses).
Empty states use neutral gray plates. In-stock deals use a muted background + badge.

## 7. Motion
150ms ease for modal and toast entrance. Row hover = background change only.
No bouncing/animating numbers, no confetti, no streaks.

## 8. Accessibility
Labels on every field, visible focus-visible outlines, ≥4.5:1 contrast,
≥44px tap targets, aria-live polite for toasts and KPI updates, full keyboard
operation (Tab/Enter/Esc/arrows), aria-labels on icon buttons.
