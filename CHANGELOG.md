# Changelog

All notable changes to Prelude will be documented in this file.

## [1.0.0] - 2025-01-16

### Initial Release

Prelude is a pre-production planning tool designed for music recording projects. This initial release includes:

#### Features

- **Project Management**
  - Create, duplicate, and delete projects
  - Import/export projects as JSON
  - Support for multiple project types (Album, EP, Single, Live Recording, Film/TV, Podcast, Dolby Atmos)

- **Project Sections**
  - **Overview**: Project name, client, dates, and description
  - **Personnel**: Track musicians, engineers, producers with roles and contact info
  - **Instrumentation**: Document instruments and assign performers
  - **Track List**: Plan songs/tracks with working titles, keys, tempos, and notes
  - **Microphone Plan**: Document mic selections and placements per source
  - **Input List**: Track all audio inputs with channel assignments and routing
  - **Equipment**: Manage required gear with quantities and notes
  - **Setup Notes**: Free-form notes with image/diagram uploads
  - **Sessions**: Schedule recording sessions with time-blocked activities
  - **Venue**: Store location details, contacts, and reference photos

- **Dolby Atmos Support**
  - Dedicated configuration section for immersive audio projects
  - Track bed vs object assignments
  - Renderer and format settings

- **Export Options**
  - Export individual projects to PDF, Word (DOCX), or JSON
  - Bulk export multiple projects as a ZIP file

- **User Management**
  - Multi-user support with authentication
  - Admin panel for user management
  - Role-based access (User/Admin)

- **Deployment**
  - Docker support for easy self-hosting
  - SQLite database (no external database required)
  - Reverse proxy compatible (nginx, Traefik, etc.)

### Technical Stack

- **Frontend**: React 18, TypeScript, Tailwind CSS, Zustand
- **Backend**: Node.js, Express, Prisma ORM
- **Database**: SQLite
- **Export**: jsPDF, docx.js, JSZip
