# Revo Fitness Gym Member Tracker

Currently hosted on [revotracker.dvcklab.com](https://revotracker.dvcklab.com)

A modern **Next.js 15** application designed to track live gym occupancy and historical membership data for Revo Fitness. Users can view the least crowded gyms based on member-to-area ratios and analyze trends to optimize their workout schedule.

## Key Features

-   **Live Tracking**: Fetches and displays live member counts and gym capacity.
-   **Smart Ranking**: Displays gyms based on occupancy density (least crowded first).
-   **Historical Data**: Stores data for trend analysis and historical occupancy viewing.
-   **User Accounts**: 
    -   Secure authentication via **PocketBase**.
    -   Customizable gym preferences and favorite gyms.
-   **Responsive Design**: Mobile-first UI with a polished dark mode toggle.
-   **Type Safety**: Full end-to-end type safety using PocketBase SDK and TypeScript.

## Tech Stack

-   **Framework**: [Next.js 15](https://nextjs.org/) (App Router)
-   **Runtime**: [Bun](https://bun.sh/)
-   **Database**: [PocketBase](https://pocketbase.io/)
-   **Authentication**: [PocketBase Auth](https://pocketbase.io/docs/authentication/)
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

The application uses a structured MySQL schema managed by Drizzle. Key tables include:

-   `Revo_Gyms`: Stores metadata for each gym location (size, address, etc.).
-   `Revo_Gym_Count`: Tracks snapshot data for occupancy and ratios.
-   `user`: Manages user profiles and `gym_preferences`.
-   `gym_trend_cache`: Stores pre-calculated trend data for performance.

## API Endpoints

### `GET /api/gyms/stats/update`
Fetches the latest gym stats from the source and updates the database.

### `GET /api/gyms/stats/latest`
Returns the most recent gym statistics, sorted by occupancy ratio.

## App Previews

<div align="center">
  <img src="https://github.com/user-attachments/assets/d8f9441f-7c61-47ce-87c9-242875bae910" width="200" alt="Home Screen">
  <img src="https://github.com/user-attachments/assets/b419ed44-47dc-4212-a7b0-d90d82895fff" width="200" alt="Gym List">
  <img src="https://github.com/user-attachments/assets/bc81f6ae-a9da-43ba-8cf8-e6ea57821e58" width="200" alt="Gym Details">
  <img src="https://github.com/user-attachments/assets/3e1e779d-a3ad-45cc-9f14-adf72bfe68af" width="200" alt="User Preferences">
</div>