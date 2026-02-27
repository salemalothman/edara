# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev      # Start development server
npm run build    # Build for production
npm run lint     # Run ESLint
npm run start    # Start production server
```

There are no test scripts configured. TypeScript build errors are intentionally suppressed via `ignoreBuildErrors: true` in [next.config.mjs](next.config.mjs).

## Architecture Overview

**Edara** is a property management SaaS dashboard for the Kuwaiti market, built with Next.js 15 (App Router), React 19, shadcn/ui, and Tailwind CSS.

### Core Systems

**Internationalization (i18n) + RTL**
- Language state lives in [contexts/language-context.tsx](contexts/language-context.tsx) — provides `language`, `setLanguage`, `t(key)`, and `dir` (`ltr`/`rtl`)
- Access via `useLanguage()` hook (re-exported from [hooks/use-language.ts](hooks/use-language.ts))
- Translations are JSON files in [translations/](translations/) — `en.json` and `ar.json`, accessed via dot-notation keys (e.g. `t("dashboard.title")`)
- When switching to Arabic, the app sets `document.documentElement.dir = "rtl"` and `lang = "ar"`
- RTL layout support is built into [tailwind.config.ts](tailwind.config.ts) via custom utilities (`.ps-*`, `.pe-*`, `.ms-auto`, `.me-auto`) and [app/globals.css](app/globals.css) with `[dir="rtl"]` overrides

**Formatting**
- Currency always formats in Kuwaiti Dinar (KWD / دينار), always using Western Arabic numerals (latn numbering system even for Arabic locale)
- Use `useFormatter()` from [hooks/use-formatter.ts](hooks/use-formatter.ts) for locale-aware number, currency, date formatting
- Raw utilities are in [utils/format.ts](utils/format.ts)

**Theming**
- Light/dark mode via `next-themes` (`ThemeProvider` wraps the app in [app/layout.tsx](app/layout.tsx))
- CSS custom properties defined in [app/globals.css](app/globals.css) under `:root` and `.dark`
- For charts and visualizations, use `getThemeColors(theme)` from [utils/theme-colors.ts](utils/theme-colors.ts)

### App Structure

Routes follow the Next.js App Router pattern. Each module (properties, tenants, contracts, invoices, maintenance, reports) has:
- `page.tsx` — server component entry point with metadata
- `page-client.tsx` — client component with actual UI
- `*-content.tsx` — sub-content components where needed
- `loading.tsx` — loading skeleton

The root route (`/`) renders [app/dashboard-page.tsx](app/dashboard-page.tsx) which is a client component.

### Component Organization

- [components/ui/](components/ui/) — shadcn/ui base components (configured with `new-york` style, `neutral` base color, lucide icons)
- [components/](components/) — feature-specific components organized by module (e.g. `components/properties/`, `components/tenants/`)
- [components/financial-metrics/](components/financial-metrics/) — financial chart and KPI components

### Key Custom UI Components

- **`InteractiveButton`** ([components/ui/interactive-button.tsx](components/ui/interactive-button.tsx)) — wraps `Button` with async loading/success/error state management and toast feedback. Use this instead of plain `Button` for async actions.
- **`cn()`** ([lib/utils.ts](lib/utils.ts)) — standard `clsx` + `tailwind-merge` utility

### shadcn/ui Setup

Path aliases (from [tsconfig.json](tsconfig.json) via [components.json](components.json)):
- `@/components` → `components/`
- `@/components/ui` → `components/ui/`
- `@/lib/utils` → `lib/utils.ts`
- `@/hooks` → `hooks/`
- `@/contexts` → `contexts/`
- `@/translations` → `translations/`
- `@/utils` → `utils/`

### RTL Development Notes

- Prefer logical CSS properties (`ps-*`, `pe-*`, `ms-auto`) over directional ones (`pl-*`, `pr-*`, `ml-*`) to support RTL automatically
- For inline RTL-specific overrides, use `rtl:` Tailwind variant (e.g. `pl-2 rtl:pr-2 rtl:pl-0`)
- The HTML `dir` attribute on `<html>` is managed dynamically by `LanguageProvider`
