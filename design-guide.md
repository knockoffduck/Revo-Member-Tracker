# Design Guide - Revo Member Tracker

## Design System Overview
The project uses a custom design system built on top of **Tailwind CSS** and **shadcn/ui**. It supports both Light and Dark modes using CSS variables for semantic color tokens.

## Typography
- **Primary Font**: `Inter` (via `next/font/google`)
- **Usage**: Applied globally via `body` in `app/layout.tsx`.

## Colors
The color palette is defined in `app/globals.css` using HSL values. This allows for dynamic theming (Dark/Light mode).

### Semantic Tokens
| Token | Description |
|-------|-------------|
| `background` | Page background color |
| `foreground` | Default text color |
| `primary` | Primary brand color (usually dark in light mode, light in dark mode) |
| `secondary` | Secondary background/accents |
| `accent` | Highlighted elements or interactive states |
| `muted` | De-emphasized text or backgrounds |
| `destructive` | Error states or delete actions |
| `card` | Background for card components |
| `border` | Border color for inputs and dividers |

### Radius
- **Default Radius**: `0.5rem` (8px) - Used for buttons, inputs, and cards.

## Components
The UI is composed of atomic components located in `components/ui`. These are built using **Radix UI** primitives for accessibility and styled with Tailwind.

### Common Components
- **Button**: Supports variants (default, destructive, outline, secondary, ghost, link).
- **Input / Form**: Standardized inputs with label and error states.
- **Toast**: For ephemeral notifications (`sonner` or `radix` based).
- **Dialog/Modal**: For overlays.

## Icons
- **Library**: `lucide-react`
- **Usage**: Import icons directly from the library (e.g., `import { User } from "lucide-react"`).

## Usage Guidelines
1. **Utility First**: Use Tailwind utility classes for layout (flex, grid, spacing).
2. **Semantic Colors**: Always use `bg-primary`, `text-muted-foreground`, etc., instead of hardcoded hex values to ensure dark mode compatibility.
3. **Components**: Prefer using the pre-built components in `components/ui` over building from scratch.
4. **Spacing**: Use standard Tailwind spacing scale (`p-4`, `m-2`, `gap-4`).

## Dark Mode
Dark mode is implemented via the `dark` class on the root element. Colors automatically switch values based on the CSS variables defined in `app/globals.css`.
