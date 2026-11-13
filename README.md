# DM Messenger

A lightweight, 1-on-1 realtime direct messenger built with Next.js (App Router), Express, Socket.IO, and SQLite.

## Overview

- **Frontend (`client/`)**: Next.js App Router, TypeScript, Tailwind CSS, `socket.io-client`.
- **Backend (`server/`)**: Express, TypeScript, `better-sqlite3` (raw parameterized SQL), `Socket.IO`, JWT auth, `bcryptjs`.
- **Database**: Local embedded SQLite (`server/chat.db`) initialized automatically on startup.

## Getting Started

### Prerequisites

- Node.js 22+
- npm

### Installation

Install dependencies for both the client and server:

```bash
npm install --prefix server
npm install --prefix client
```

### Environment Configuration

1. **Server** (`server/.env`):
   ```env
   PORT=4000
   JWT_SECRET=your_jwt_secret_here
   CLIENT_URL=http://localhost:3000
   ```
   (See `server/.env.example` for reference.)

2. **Client** (`client/.env.local`):
   ```env
   NEXT_PUBLIC_API_URL=http://localhost:4000
   ```

### Running the Apps

Start the backend server (runs on `http://localhost:4000`):
```bash
npm run dev --prefix server
```

Start the frontend client (runs on `http://localhost:3000`):
```bash
npm run dev --prefix client
```

### Verification & Type Checking

- Type-check server:
  ```bash
  cd server && npx tsc --noEmit
  ```
- Build & type-check client:
  ```bash
  npm run build --prefix client
  ```
- Reset database:
  Stop server, delete `server/chat.db*`, and restart the server.
