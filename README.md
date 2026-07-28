# Revo Fitness Gym Member Tracker

Currently hosted on [revotracker.dvcklab.com](https://revotracker.dvcklab.com)

A modern **Next.js 15** application designed to track live gym occupancy and historical membership data for Revo Fitness. Users can view the least crowded gyms based on member-to-area ratios and analyze trends to optimize their workout schedule.

## Key Features

-   **Live Tracking**: Fetches and displays live member counts and gym capacity.
-   **Smart Ranking**: Displays gyms based on occupancy density (least crowded first).
-   **Historical Data**: Stores data for trend analysis and historical occupancy viewing.
-   **User Accounts**: 
    -   Secure authentication via **Better Auth** (email/password, backed by MySQL).
    -   Customizable gym preferences and favorite gyms.
-   **Responsive Design**: Mobile-first UI with a polished dark mode toggle.
-   **Type Safety**: Full end-to-end type safety using PocketBase SDK and TypeScript.

## Tech Stack

-   **Framework**: [Next.js 15](https://nextjs.org/) (App Router)
-   **Runtime**: [Bun](https://bun.sh/)
-   **App Database**: [PocketBase](https://pocketbase.io/) (gym + announcement data)
-   **Authentication**: [Better Auth](https://www.better-auth.com/) (user accounts in MySQL via [Drizzle ORM](https://orm.drizzle.team/))
-   **Styling**: [Tailwind CSS](https://tailwindcss.com/)
-   **UI Components**: [shadcn/ui](https://ui.shadcn.com/) (Radix Primitives)
-   **Icons**: [Lucide React](https://lucide.dev/)

## Project Structure

```
├── app/                  # Next.js App Router directory
│   ├── components/       # App-specific components (e.g., Header)
│   ├── db/               # PocketBase client configuration
│   ├── layout.tsx        # Root layout with providers
│   └── globals.css       # Global styles and Tailwind directives
├── components/           # Shared UI components (shadcn/ui)
│   └── ui/               # Primitives (buttons, inputs, etc.)
├── lib/                  # Utility functions and PocketBase helpers
├── public/               # Static assets
└── ...config files       # Configs for Tailwind, Next.js, Bun, etc.
```

## Design System

The project follows a custom design system detailed in the [Design Guide](design-guide.md).
-   **Typography**: Inter (via `next/font/google`).
-   **Colors**: Semantic HSL tokens for seamless Light/Dark mode transitions.
-   **Radius**: Standard `0.5rem` (8px) for consistent UI elements.

## Getting Started

### Prerequisites
- [Bun](https://bun.sh/) (v1.0+ recommended)
- MySQL Database

### Installation

1. **Clone the repository**:
   ```bash
   git clone https://github.com/your-username/revo-member-tracker.git
   cd revo-member-tracker
   ```

2. **Install dependencies**:
   ```bash
   bun install
   ```

3. **Set up environment variables**:
   Create a `.env` file in the root directory:
   ```env
   NEXT_PUBLIC_POCKETBASE_URL="https://pb.dvcklab.work"
   POCKETBASE_URL="https://pb.dvcklab.work"
   POCKETBASE_ADMIN_EMAIL="admin@example.com"
   POCKETBASE_ADMIN_PASSWORD="your-admin-password"
   # Better Auth + MySQL (user accounts)
   DATABASE_URL="mysql://user:password@localhost:3306/revo"
   BETTER_AUTH_SECRET="generate-a-long-random-secret"
   BETTER_AUTH_URL="http://localhost:3000"
   NEXT_PUBLIC_BASE_URL="http://localhost:3000"
   NEXT_PUBLIC_ADMIN_API_URL="http://localhost:3001"
   ADMIN_API_TOKEN=""
   ADMIN_API_URLS="http://localhost:3001"
   ```

### Running the App

- **Development**:
  ```bash
  bun run dev
  ```
  The app will start at `http://localhost:3000`.

- **Production Build**:
  ```bash
  bun run build
  bun run start
  ```

## Database Schema

The app uses a **hybrid data architecture**:

-   **PocketBase** stores the gym/announcement data. Key collections:
    -   `Revo_Gyms`: metadata for each gym location (size, address, etc.).
    -   `Revo_Gym_Count`: snapshot data for occupancy and ratios.
    -   `announcements`: published site updates.
-   **MySQL** (via Drizzle ORM) stores Better Auth user-account tables: `user`,
    `session`, `account`, and `verification`. The `user` table also carries
    `gym_preferences` and an `isAdmin` flag. The MySQL schema is managed
    externally (there is no `drizzle/` migrations directory in this repo).

## API Endpoints

The Next.js app exposes a small set of routes:

-   `GET /api/db/gyminfo` — returns all gym metadata from PocketBase.
-   `GET /api/account/gym-preferences` — returns the signed-in user's gym preferences.
-   `ANY /api/auth/[...all]` — Better Auth handler (sign up/in/out, session).
-   `GET|POST /api/admin/proxy` — admin-only reverse proxy to the external stats
    API. The upstream base URL must be in the `ADMIN_API_URLS` allowlist.

> Note: `/api/gyms/stats/update` and `/api/gyms/stats/latest` (referenced in the
> admin diagnostics UI) are **not** Next.js routes. They are paths on the
> external stats API, reached at runtime through `/api/admin/proxy?path=/gyms/stats/...`.
> Historical trend data is fetched from `https://revotrackerapi.dvcklab.com/gyms/trends`.

## App Previews

<div align="center">
  <img src="https://github.com/user-attachments/assets/d8f9441f-7c61-47ce-87c9-242875bae910" width="200" alt="Home Screen">
  <img src="https://github.com/user-attachments/assets/b419ed44-47dc-4212-a7b0-d90d82895fff" width="200" alt="Gym List">
  <img src="https://github.com/user-attachments/assets/bc81f6ae-a9da-43ba-8cf8-e6ea57821e58" width="200" alt="Gym Details">
  <img src="https://github.com/user-attachments/assets/3e1e779d-a3ad-45cc-9f14-adf72bfe68af" width="200" alt="User Preferences">
</div>