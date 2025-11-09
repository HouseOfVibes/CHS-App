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

### Phase 2 (Coming Soon)
- 🔄 CoreLogic API integration
- 🔄 Recently sold homes (last 30 days)
- 🔄 Automated daily sync
- 🔄 Map view of homes

### Phase 3 (Planned)
- ⏳ Multi-user support
- ⏳ Employee accounts and roles
- ⏳ Team dashboard and analytics
- ⏳ Performance tracking

## Tech Stack

- **Frontend:** Vite + React 18 + TypeScript
- **Styling:** Tailwind CSS + shadcn/ui
- **Backend:** Supabase (PostgreSQL + Auth + Realtime)
- **Deployment:** Vercel
- **Maps:** Google Maps API (Phase 2)

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
   
   Edit `.env.local` with your Supabase credentials

4. **Set up Supabase database**
   - Create a new Supabase project at https://supabase.com
   - Go to the SQL Editor
   - Run the schema from `database/schema.sql`
   - Run the seed data from `database/seed.sql`

5. **Start development server**
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

- [x] Phase 1: Core home logging functionality
- [ ] Phase 2: CoreLogic integration
- [ ] Phase 3: Multi-user support
- [ ] Phase 4: Advanced analytics and reporting

## License

Proprietary - Continental Home Solutions © 2024

---

**Built with ❤️ for Continental Home Solutions**
