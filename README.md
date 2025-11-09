# CHS App - Continental Home Solutions

> Field canvassing application for tracking home visits and managing leads

## Overview

CHS App is a mobile-first Progressive Web Application (PWA) designed for Continental Home Solutions' field canvassing operations. Track home visits, manage leads, and integrate recently sold homes data to optimize door-to-door sales efforts.

## Features

### Phase 1 (Current)
- ✅ Log home visits with detailed information
- ✅ Track visit results (Not Home, Scheduled Demo, DND, etc.)
- ✅ Organize by City → Subdivision → Street → Address
- ✅ Contact information management
- ✅ Follow-up date tracking
- ✅ Mobile-optimized interface
- ✅ View and filter logged homes
- ✅ **Dynamic location management** - Add cities and subdivisions on the fly
- ✅ **Quick-add modals** - Add new locations directly from the LogVisit form
- ✅ **Bulk location management** - Dedicated ManageLocations page for organizing areas
- ✅ **GPS location tracking** - Pin your current location with one tap
- ✅ **Automatic geocoding** - Convert addresses to coordinates automatically
- ✅ **Interactive map view** - Visual representation of all home visits
- ✅ **Color-coded markers** - See visit results at a glance on the map
- ✅ **Google Maps integration** - Full mapping and geocoding capabilities

### Phase 2 (Coming Soon)
- 🔄 CoreLogic API integration
- 🔄 Recently sold homes (last 30 days)
- 🔄 Automated daily sync

### Phase 3 (Planned)
- ⏳ Multi-user support
- ⏳ Employee accounts and roles
- ⏳ Team dashboard and analytics
- ⏳ Performance tracking

## Tech Stack

- **Frontend:** Vite + React 18 + TypeScript
- **Styling:** Tailwind CSS + shadcn/ui
- **Backend:** Supabase (PostgreSQL + Auth + Realtime)
- **Forms:** React Hook Form + Zod validation
- **Maps:** @react-google-maps/api
- **APIs:** Google Maps JavaScript API, Geocoding API, Geolocation API
- **Deployment:** Vercel

## CHS Brand Colors

- **Water Blue:** `#0079A3`
- **Teal Green:** `#00A693`
- **Bright Green:** `#59B947`
- **Deep Navy:** `#003366`
- **Light Aqua:** `#6ED4FF`
- **Gradient:** `#00A693` → `#0079A3`

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- Supabase account (free tier works great)
- Git

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/HouseOfVibes/CHS-App.git
   cd CHS-App
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env.local
   ```

   Edit `.env.local` with your credentials:
   - `VITE_SUPABASE_URL` - Your Supabase project URL
   - `VITE_SUPABASE_ANON_KEY` - Your Supabase anonymous key
   - `VITE_GOOGLE_MAPS_API_KEY` - Your Google Maps API key (required for map features)

4. **Set up Supabase database**
   - Create a new Supabase project at https://supabase.com
   - Go to the SQL Editor
   - Run the schema from `database/schema.sql`
   - Run the seed data from `database/seed.sql`

5. **Set up Google Maps API**
   - Create a project in [Google Cloud Console](https://console.cloud.google.com/)
   - Enable the following APIs:
     - Maps JavaScript API
     - Geocoding API
     - Geolocation API
   - Create an API key and add it to your `.env.local`
   - (Optional) Restrict the API key to your domain for production

6. **Start development server**
   ```bash
   npm run dev
   ```

   Open http://localhost:5173 in your browser.

## Project Structure

```
CHS-App/
├── src/
│   ├── components/       # React components
│   ├── pages/           # Page components
│   ├── hooks/           # Custom React hooks
│   ├── lib/             # Utilities and configs
│   └── types/           # TypeScript types
├── database/            # Database schemas and migrations
├── public/              # Static assets
└── docs/                # Documentation
```

## Deployment

### Vercel (Recommended)

1. Push your code to GitHub
2. Connect your repo to Vercel
3. Add environment variables in Vercel dashboard
4. Deploy!

## Roadmap

- [x] **Phase 1: Core home logging functionality** ✅
  - Log visits with validation
  - View and filter homes
  - Dynamic location management
  - Google Maps integration with GPS tracking
  - Interactive map visualization
- [ ] **Phase 2: CoreLogic API integration**
  - Recently sold homes data
  - Automated daily sync
  - Enhanced lead targeting
- [ ] **Phase 3: Multi-user support**
  - Employee accounts and roles
  - Team dashboard
  - Performance tracking
- [ ] **Phase 4: Advanced analytics and reporting**
  - Conversion metrics
  - Territory optimization
  - Custom reports

## License

Proprietary - Continental Home Solutions © 2024

---

**Built with ❤️ for Continental Home Solutions**
