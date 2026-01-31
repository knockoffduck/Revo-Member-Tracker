# Project Guide - Revo Member Tracker

## Overview
Revo Member Tracker is a Next.js 15 application designed to track gym membership data. It utilizes a modern tech stack centered around type safety and performance.

## Tech Stack
- **Framework**: [Next.js 15](https://nextjs.org/) (App Router)
- **Runtime**: [Bun](https://bun.sh/)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/)
- **UI Components**: [shadcn/ui](https://ui.shadcn.com/) (Radix Primitives)
- **Database**: MySQL
- **ORM**: [Drizzle ORM](https://orm.drizzle.team/)
- **Authentication**: [Better Auth](https://better-auth.com/)
- **Package Manager**: [Bun](https://bun.sh/)

## Project Structure

```
├── app/                  # Next.js App Router directory
│   ├── components/       # App-specific components (e.g., Header)
│   ├── db/               # Database schema location (referenced in drizzle config)
│   ├── layout.tsx        # Root layout with providers
│   └── globals.css       # Global styles and Tailwind directives
├── components/           # Shared UI components (shadcn/ui)
│   └── ui/               # Primitives (buttons, inputs, etc.)
├── lib/                  # Utility functions (utils.ts)
├── drizzle/              # Drizzle migrations output
├── public/               # Static assets
└── ...config files       # Configs for Tailwind, Drizzle, Next.js, etc.
```

## Setup & Installation

### Prerequisites
- [Bun](https://bun.sh/) (v1.0+ recommended)
- MySQL Database

### Installation
1. Clone the repository.
2. Install dependencies:
   ```bash
   bun install
   ```
3. Set up environment variables:
   Create a `.env` file in the root directory. You will likely need:
   ```env
   DATABASE_URL="mysql://user:password@host:port/database"
   # Add other auth/app specific keys here
   ```
4. Run database migrations (using Drizzle Kit):
   ```bash
   bunx drizzle-kit push
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

## Key Features
- **Authentication**: Secure user authentication managed by Better Auth, with schemas defined in `auth-schema.ts`.
- **Database**: Type-safe database interactions using Drizzle ORM with MySQL.
- **Responsive Design**: Mobile-first UI built with Tailwind CSS.

## Development Commands
- `bun run dev`: Start development server.
- `bun run build`: Build for production.
- `bun run lint`: Run ESLint.
