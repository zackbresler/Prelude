# Prelude Lite

A browser-based pre-production planning tool for music recording projects. Organize personnel, equipment, track lists, microphone plans, schedules, and more — no server required.

> **Looking for the full version?** [Prelude](https://github.com/zackbresler/Prelude) (main branch) offers multi-user support, persistent server storage, and user authentication.

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
- **Export Options**: Export projects to PDF, DOCX, JSON, or REAPER

## How It Works

Prelude Lite runs entirely in your browser. Your projects are stored locally using IndexedDB — no account or server needed.

**Important:** Your data is stored in this browser only. Clearing browsing data will delete your projects. Use the backup feature regularly to protect your work.

## Quick Start

### Option 1: Use the Hosted Version

[Visit the hosted version](https://zackbresler.com/prelude) — no installation needed.

### Option 2: Deploy Your Own

#### Netlify

1. Fork this repository
2. Connect to Netlify
3. Set build command: `npm run build`
4. Set publish directory: `client/dist`
5. Deploy

#### GitHub Pages

1. Fork this repository
2. Run `npm install && npm run build` in the `client` folder
3. Deploy the `client/dist` folder to GitHub Pages

#### Local Development

```bash
cd client
npm install
npm run dev
```

Open `http://localhost:5173`

## Backup & Restore

### Backing Up Your Projects

Click **Export All** in the header to download a JSON backup of all your projects.

### Restoring from Backup

Click **Import Backup** to restore projects from a backup file. You can:
- **Merge**: Add imported projects alongside existing ones
- **Replace**: Delete existing projects and import fresh

### Compatibility

Prelude Lite can import:
- Single project JSON exports from either version
- Full backups from the self-hosted Prelude server
- Lite backup files

## Browser Support

Works in all modern browsers (Chrome, Firefox, Safari, Edge).

**Note:** In private/incognito mode, data may not persist between sessions.

## Project Structure

```
client/
├── src/
│   ├── api/           # Local storage API
│   ├── components/    # React components
│   ├── storage/       # IndexedDB layer
│   ├── store/         # Zustand state stores
│   └── types/         # TypeScript types
├── netlify.toml       # Netlify deployment config
└── ...
```

## Full Version

For teams or persistent server-side storage, see the [full version of Prelude](https://github.com/zackbresler/Prelude) which includes:

- Multi-user support with authentication
- Server-side database storage
- Admin dashboard for user management
- Docker deployment

## License

MIT
