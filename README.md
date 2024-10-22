# Revo Fitness Gym Occupancy Tracker

A **Next.js** app that tracks live gym member statistics for Revo Fitness. Users can view the least crowded gyms and store historical data for analysis. Integrated with **Supabase** for data storage and **Tailwind CSS** for styling.

## Current and Upcoming Features

- [x] Fetches live member count and gym size.
- [x] Displays gyms based on member-to-area ratio (least crowded first).
- [x] Stores historical data for trend analysis.
  - [ ] Access to older data.
- [ ] Users can filter favorite gyms and view live stats.
  - [ ] Create users to store favourite gyms.
- [x] Dark mode toggle for better UI experience.

## Tech Stack

- **Next.js** (Frontend)
- **Tailwind CSS** (Styling)
- **Supabase** (Database)
- **Hono** (API framework)

## Getting Started

1. **Clone the repository**:
   ```bash
   git clone https://github.com/your-username/revo-fitness-gym-tracker.git
   cd revo-fitness-gym-tracker
   ```
2. **Install dependencies**:
   ```bash
   bun install
   ```
3. **Create environment variables:** Add the following to .env.local:
   ```
   NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
   NEXT_PUBLIC_SUPABASE_KEY=your-supabase-anon-key
   SUPABASE_SERVICE_KEY=your-supabase-service-role-key
   ```
4. **Run the app**:
   ```
   bun run dev
   ```

## Database

The app uses **Supabase** for storing gym statistics.

### `Revo Member Stats` Table:

- `id`: Primary key.
- `name`: Gym name.
- `size`: Gym size (sqm).
- `member_count`: Live member count.
- `member_ratio`: Member-to-area ratio.
- `created_at`: Timestamp.

## API Endpoints

### `/api/gyms/stats/update`

- **Method**: `GET`
- **Description**: Fetches the latest gym stats and updates the database.

### `/api/gyms/stats/latest`

- **Method**: `GET`
- **Description**: Returns the most recent gym statistics (sorted by occupancy).
