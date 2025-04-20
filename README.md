# Revo Fitness Gym Occupancy Tracker

Currently hosted on https://revotracker.dvcklab.com

A **Next.js** app that tracks live gym member statistics for Revo Fitness. Users can view the least crowded gyms and store historical data for analysis. Integrated with **Supabase** for data storage and **Tailwind CSS** for styling.

## Current and Upcoming Features

- [x] Fetches live member count and gym size.
- [x] Displays gyms based on member-to-area ratio (least crowded first).
- [x] Stores historical data for trend analysis.
  - [ ] Access to older data.
- [x] User Accounts
  - [x] Implement Authenticaton (Better-auth)
  - [ ] Account Creation
    - [ ] Account Modification
      - [ ] Change name, password
      - [ ] Delete Account
      - [x] Change Gym Preferences 
  - [x] Users can see their favorite gyms
- [x] Dark mode toggle for better UI experience.

## App Previews

<img src="https://github.com/user-attachments/assets/d8f9441f-7c61-47ce-87c9-242875bae910" width="200">
<img src="https://github.com/user-attachments/assets/b419ed44-47dc-4212-a7b0-d90d82895fff" width="200">
<img src="https://github.com/user-attachments/assets/bc81f6ae-a9da-43ba-8cf8-e6ea57821e58" width="200">
<img src="https://github.com/user-attachments/assets/3e1e779d-a3ad-45cc-9f14-adf72bfe68af" width="200">



## Tech Stack

- **Next.js** (Frontend)
- **Tailwind CSS** (Styling)
- **Supabase** (Database)
- **Hono** (API framework)
## Images


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
   DATABASE_URL
   BETTER_AUTH_SECRET
   ```
4. **Run the app**:
   ```
   bun run dev
   ```

## Database

The app uses **MySQL** for storing gym statistics.

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
