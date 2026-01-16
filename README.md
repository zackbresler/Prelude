# Prelude

A pre-production planning tool for music recording projects. Organize personnel, equipment, track lists, microphone plans, schedules, and more.

## Features

- **Project Management**: Create and manage multiple pre-production projects
- **Personnel Tracking**: Track musicians, engineers, and other personnel with roles
- **Instrumentation**: Document instruments and assign performers
- **Track Lists**: Plan your session tracks and arrangements
- **Microphone Plans**: Document microphone selections and placements
- **Input Lists**: Track all audio inputs and routing
- **Equipment Lists**: Manage required equipment
- **Session Scheduling**: Plan recording sessions with detailed schedules
- **Venue Information**: Store venue details and photos
- **Dolby Atmos Support**: Special configuration for immersive audio projects
- **Export Options**: Export projects to PDF, DOCX, or JSON

## Quick Start with Docker

The easiest way to run Prelude is with Docker.

### Option A: Minimal Setup

Create a `docker-compose.yml` file:

```yaml
version: '3.8'

services:
  prelude:
    build: https://github.com/zbresler/prelude.git
    ports:
      - "3000:3000"
    volumes:
      - prelude-data:/app/server/data
    environment:
      - SESSION_SECRET=change-this-to-at-least-32-random-characters
      - ADMIN_EMAIL=your@email.com
      - ADMIN_PASSWORD=your-secure-password
    restart: unless-stopped

volumes:
  prelude-data:
```

Then run:

```bash
docker-compose up -d
```

### Option B: Clone and Configure

**1. Clone the repository:**

```bash
git clone https://github.com/zbresler/prelude.git
cd prelude
```

**2. Configure environment:**

```bash
cp .env.example .env
```

Edit `.env` and set your values:

```env
SESSION_SECRET="your-secure-random-string-at-least-32-characters"
ADMIN_EMAIL="your@email.com"
ADMIN_PASSWORD="your-secure-password"
ADMIN_NAME="Your Name"
```

**3. Start the application:**

```bash
docker-compose up -d
```

---

The application will be available at `http://localhost:3000`. Log in with the admin credentials you configured.

## Configuration Options

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | `3000` | Server port |
| `SESSION_SECRET` | (required) | Secret for session encryption (min 32 chars) |
| `SESSION_MAX_AGE` | `604800000` | Session duration in ms (default: 7 days) |
| `ALLOW_REGISTRATION` | `false` | Allow users to self-register |
| `REQUIRE_APPROVAL` | `false` | Require admin approval for new users |
| `ADMIN_EMAIL` | `admin@example.com` | Default admin email |
| `ADMIN_PASSWORD` | `changeme` | Default admin password |
| `ADMIN_NAME` | `Administrator` | Default admin display name |
| `COOKIE_SECURE` | `auto` | Cookie secure flag: `auto` (HTTPS in production), `true`, or `false` |

## Development Setup

### Prerequisites

- Node.js 20+
- npm 9+

### Install dependencies

```bash
npm install
```

### Initialize the database

```bash
cd server
npx prisma migrate dev
npx prisma db seed
```

### Start development servers

Run both frontend and backend:

```bash
npm run dev:all
```

Or run them separately:

```bash
# Terminal 1 - Backend
npm run dev:server

# Terminal 2 - Frontend
npm run dev
```

- Frontend: `http://localhost:5173`
- Backend API: `http://localhost:3001`

### Build for production

```bash
npm run build
```

## Project Structure

```
prelude/
├── client/                 # React frontend
│   ├── src/
│   │   ├── api/           # API client functions
│   │   ├── components/    # React components
│   │   ├── store/         # Zustand state stores
│   │   └── types/         # TypeScript types
│   └── ...
├── server/                 # Express backend
│   ├── src/
│   │   ├── routes/        # API routes
│   │   ├── middleware/    # Express middleware
│   │   └── lib/           # Utilities
│   └── prisma/            # Database schema
├── Dockerfile
├── docker-compose.yml
└── package.json
```

## User Management

Admin users can manage users through the Admin panel (accessible via the "Admin" link in the header).

- Create new users with specific roles (USER or ADMIN)
- Edit existing users
- Delete users (cascades to delete their projects)

## Data Persistence

When running with Docker, data is persisted in a Docker volume (`prelude-data`). This includes:

- SQLite database with all user and project data

To backup your data:

```bash
docker cp prelude-prelude-1:/app/server/data ./backup
```

## Migrating from localStorage Version

If you have projects saved in the browser's localStorage from an earlier version:

1. Export each project as JSON from the old version
2. Log into the new version with your account
3. Use "Import Project" to import each JSON file

## License

MIT
