# 💬 DM Messenger

<p align="center">
  <strong>A lightweight, production-grade 1-on-1 realtime direct messenger built with Next.js (App Router), Express, Socket.IO, TypeScript, and SQLite.</strong>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Next.js-16-black?style=flat-square&logo=next.js" alt="Next.js" />
  <img src="https://img.shields.io/badge/React-19-blue?style=flat-square&logo=react" alt="React" />
  <img src="https://img.shields.io/badge/TypeScript-5.7-blue?style=flat-square&logo=typescript" alt="TypeScript" />
  <img src="https://img.shields.io/badge/Tailwind_CSS-v4-38B2AC?style=flat-square&logo=tailwind-css" alt="Tailwind CSS" />
  <img src="https://img.shields.io/badge/Express-4.21-lightgrey?style=flat-square&logo=express" alt="Express" />
  <img src="https://img.shields.io/badge/Socket.IO-4.8-010101?style=flat-square&logo=socket.io" alt="Socket.IO" />
  <img src="https://img.shields.io/badge/SQLite-better--sqlite3-003B57?style=flat-square&logo=sqlite" alt="SQLite" />
  <img src="https://img.shields.io/badge/Node.js-22%2B-green?style=flat-square&logo=node.js" alt="Node.js" />
  <img src="https://img.shields.io/badge/License-MIT-yellow?style=flat-square" alt="License" />
</p>

---

## 📖 Table of Contents

- [Overview](#-overview)
- [Key Features](#-key-features)
- [Architecture & Data Flow](#-architecture--data-flow)
- [Tech Stack](#-tech-stack)
- [Project Structure](#-project-structure)
- [Getting Started](#-getting-started)
  - [Prerequisites](#prerequisites)
  - [Installation](#installation)
  - [Environment Variables](#environment-variables)
  - [Running the Applications](#running-the-applications)
- [API & WebSocket Specifications](#-api--websocket-specifications)
  - [REST Endpoints](#rest-endpoints)
  - [Socket.IO Events](#socketio-events)
- [Database Model](#-database-model)
- [Scripts & Quality Checks](#-scripts--quality-checks)
- [Design System](#-design-system)
- [License](#-license)

---

## 🌟 Overview

**DM Messenger** is a full-stack, focused 1-on-1 direct messaging platform designed for simplicity, performance, and transparency. Every layer is built without unnecessary abstractions:

- **Raw SQL over ORMs**: Direct, parameterized SQL queries using `better-sqlite3`.
- **Explicit Realtime Pipeline**: Direct Socket.IO room routing (`user:<id>`) without complex pub/sub brokers.
- **Hand-Rolled JWT Auth**: Clean, transparent authentication lifecycle with secure `bcryptjs` password hashing.
- **Zero-Config Database**: Automatically initializes SQLite in WAL mode on startup with foreign key guarantees.

---

## ✨ Key Features

- ⚡ **Instant Realtime Chat**: Low-latency bidirectional messaging powered by Socket.IO with delivery acknowledgements, connection state banners, and automatic reconnect recovery.
- 📬 **Unread Counters & Tab Alerts**: Per-conversation badge indicators in the sidebar and live `(N) DM Messenger` browser tab title updates.
- 🔍 **Instant User Search**: Fast prefix search by username to open direct conversations immediately (no friending / approval barriers).
- 🎨 **Deterministic Initials Avatars**: Dynamic avatar generation derived from user initials and consistent color hashing—zero external asset dependencies.
- 📱 **Thoughtful & Responsive UX**:
  - Auto-scroll with smart reading-history protection (no sudden scroll-jumps when reviewing history).
  - Floating *"New messages ↓"* pill when messages arrive while scrolled up.
  - Alternating message skeleton loaders and clean empty states.
  - Fully responsive mobile design tested down to 375px viewports.
- 🔒 **Secure Auth & Session Management**: Strict registration and login flows, stateless 7-day JWT tokens, and protected endpoints.
- 🛡️ **Account Deletion & Anonymization**: Dedicated Danger Zone with password-confirmed deletion. Preserves conversation integrity by atomically anonymizing accounts to `"Deleted User"` (`deleted#<id>`) while wiping all personal data and invalidating active sessions.

---

## 🏛️ Architecture & Data Flow

```
┌─────────────────────────────────┐                 REST API (HTTP)                ┌─────────────────────────────────┐
│        client/ (Port 3000)      │ ─────────────────────────────────────────────► │        server/ (Port 4000)      │
│                                 │   Auth, Profile, User Search, Conversations,   │                                 │
│  - Next.js 16 (App Router)      │   Message History                              │  - Express 4                    │
│  - React 19 + TypeScript        │                                                │  - Socket.IO                    │
│  - Tailwind CSS v4              │ ◄────────────────────────────────────────────► │  - TypeScript                   │
│  - socket.io-client             │            WebSocket (Push Only)               │                                 │
└─────────────────────────────────┘           New Messages & Live Acks             └────────────────┬────────────────┘
                                                                                                    │ better-sqlite3
                                                                                                    ▼
                                                                                           ┌─────────────────┐
                                                                                           │  server/chat.db │
                                                                                           │  (WAL + FKs)    │
                                                                                           └─────────────────┘
```

### Design Principles

1. **REST for State, WebSockets for Push**: REST handles request-response cycles (authentication, profile updates, search, history retrieval). WebSockets exclusively handle live push notifications for new messages.
2. **Personal Room Routing (`user:<id>`)**: Sockets join a personal room upon authentication. When User A messages User B, the server emits solely to `user:A` and `user:B`. This eliminates room join/leave choreography and effortlessly supports multi-tab sessions.

---

## 💻 Tech Stack

### Frontend (`client/`)
| Technology | Role | Purpose |
|---|---|---|
| **Next.js 16** | Web Framework | App Router, file-based routing, fast Turbopack compilation |
| **React 19** | UI Library | Component-driven interfaces and hooks |
| **TypeScript** | Language | Strict end-to-end type safety |
| **Tailwind CSS v4** | Styling | Modern, utility-first styling with responsive design |
| **socket.io-client** | Realtime Client | WebSocket connection management, auto-reconnection, and events |

### Backend (`server/`)
| Technology | Role | Purpose |
|---|---|---|
| **Node.js 22+** | Runtime | Native `--env-file` support, high-performance JS execution |
| **Express** | HTTP Framework | Modular REST routing and middleware pipeline |
| **Socket.IO** | Realtime Engine | Bi-directional WebSocket communication, rooms, and acks |
| **better-sqlite3** | Database Driver | Synchronous embedded SQLite execution with WAL mode |
| **jsonwebtoken** | Auth Tokens | Stateless token signing and verification |
| **bcryptjs** | Security | Password hashing with cryptographic salting |
| **tsx** | Development | TypeScript execution with hot-reload watch mode |

---

## 📂 Project Structure

```
chat-app/
├── client/                     # Next.js frontend application
│   ├── app/                    # App Router pages and layouts
│   │   ├── chat/page.tsx       # Main messaging interface (sidebar + thread)
│   │   ├── login/page.tsx      # Login form
│   │   ├── signup/page.tsx     # Registration form
│   │   ├── profile/page.tsx    # Profile editor & Danger Zone (delete account)
│   │   ├── layout.tsx          # Root layout & font definition
│   │   └── page.tsx            # Auth-aware route redirector
│   ├── components/             # Reusable UI components
│   │   ├── Avatar.tsx          # Initials avatar with deterministic color hashing
│   │   └── SignOutModal.tsx    # Logout confirmation dialog
│   ├── lib/                    # Client utilities & shared logic
│   │   ├── api.ts              # Fetch wrapper with Bearer token injection
│   │   ├── auth.ts             # LocalStorage token & user persistence
│   │   ├── display.ts          # Formatting & avatar helpers
│   │   ├── socket.ts           # Socket.IO client singleton
│   │   └── types.ts            # Client-side TypeScript contracts
│   ├── .env.example            # Client environment template
│   └── package.json
│
├── server/                     # Express & Socket.IO backend
│   ├── src/
│   │   ├── index.ts            # HTTP server, Express setup & Socket.IO entry
│   │   ├── db.ts               # SQLite connection & schema initialization
│   │   ├── auth.ts             # Auth handlers (signup, login) & requireAuth middleware
│   │   ├── users.ts            # /api/me (profile, delete) & /api/users search
│   │   ├── conversations.ts    # Conversation management & message history
│   │   ├── sockets.ts          # Socket handshake auth & message dispatch
│   │   └── types.ts            # Server-side TypeScript contracts
│   ├── .env.example            # Server environment template
│   └── package.json
│
└── docs/                       # Project documentation & architectural decisions
    ├── architecture.md         # Detailed system architecture & API contracts
    ├── features.md             # Complete feature roadmap and specifications
    ├── done.md                 # Completed feature log
    ├── rules.md                # Engineering constraints and conventions
    └── stack.md                # Technology decisions and rationales
```

---

## 🚀 Getting Started

### Prerequisites

- **Node.js**: `v22.0.0` or higher
- **npm**: `v10.0.0` or higher

### Installation

Clone the repository and install dependencies for both client and server:

```bash
git clone https://github.com/alireza-hedayati/fullstack-chat-app.git
cd fullstack-chat-app

# Install server dependencies
npm install --prefix server

# Install client dependencies
npm install --prefix client
```

### Environment Variables

#### 1. Server Configuration (`server/.env`)

Create `server/.env` based on `server/.env.example`:

```bash
cp server/.env.example server/.env
```

Ensure the variables are set:
```env
PORT=4000
JWT_SECRET=super_secret_jwt_key_change_me_in_production
CLIENT_URL=http://localhost:3000
```

> **Note**: `JWT_SECRET` is strictly required. The server refuses to boot if this is missing.

#### 2. Client Configuration (`client/.env.local`)

Create `client/.env.local` based on `client/.env.example`:

```bash
cp client/.env.example client/.env.local
```

Ensure the variable is set:
```env
NEXT_PUBLIC_API_URL=http://localhost:4000
```

### Running the Applications

Start both services in development mode:

#### Terminal 1 — Backend Server
```bash
npm run dev --prefix server
# Server boots on http://localhost:4000
```

#### Terminal 2 — Frontend Client
```bash
npm run dev --prefix client
# Client boots on http://localhost:3000
```

Visit [http://localhost:3000](http://localhost:3000) in your browser. Open a secondary incognito window to simulate two users chatting in real-time!

---

## 📡 API & WebSocket Specifications

### REST Endpoints

All protected endpoints require an `Authorization: Bearer <token>` header.

| Method | Endpoint | Auth | Description |
|---|---|:---:|---|
| `GET` | `/api/health` | No | Server health check (`{"ok": true}`) |
| `POST` | `/api/auth/signup` | No | Register a new user (`username`, `password`) |
| `POST` | `/api/auth/login` | No | Log in and receive a 7-day JWT token |
| `GET` | `/api/me` | Yes | Get the authenticated user's profile |
| `PATCH` | `/api/me` | Yes | Update profile (`first_name`, `last_name`, `bio`) |
| `DELETE` | `/api/me` | Yes | Anonymize and permanently delete account (requires password) |
| `GET` | `/api/users?q=<prefix>` | Yes | Search active users by username prefix |
| `GET` | `/api/conversations` | Yes | List conversations ordered by recent activity |
| `POST` | `/api/conversations` | Yes | Get or create conversation with peer (`peer_id`) |
| `GET` | `/api/conversations/:id/messages` | Yes | Fetch message history for authorized participant |

### Socket.IO Events

Authentication is verified during the Socket.IO handshake via `auth: { token: "<JWT>" }`.

| Event | Direction | Payload | Description |
|---|:---:|---|---|
| `message:send` | Client ➔ Server | `{ conversation_id: number, content: string }` | Client sends a message. Server invokes ack callback: `{ ok: true, message }` or `{ ok: false, error }`. |
| `message:new` | Server ➔ Client | `{ message: Message }` | Server pushes a newly created message to `user:<sender>` and `user:<peer>`. |

---

## 🗄️ Database Model

The database is built on **SQLite** with Write-Ahead Logging (`PRAGMA journal_mode = WAL`) and enforced foreign keys (`PRAGMA foreign_keys = ON`).

```sql
-- Users table: stores auth credentials and profile info
CREATE TABLE IF NOT EXISTS users (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  username      TEXT    NOT NULL UNIQUE COLLATE NOCASE,
  password_hash TEXT    NOT NULL,
  first_name    TEXT    NOT NULL DEFAULT '',
  last_name     TEXT    NOT NULL DEFAULT '',
  bio           TEXT    NOT NULL DEFAULT '',
  deleted_at    TEXT,             -- NULL for active users
  created_at    TEXT    NOT NULL DEFAULT (datetime('now'))
);

-- Conversations table: guaranteed canonical pair ordering (user_a < user_b)
CREATE TABLE IF NOT EXISTS conversations (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  user_a     INTEGER NOT NULL REFERENCES users(id),
  user_b     INTEGER NOT NULL REFERENCES users(id),
  created_at TEXT    NOT NULL DEFAULT (datetime('now')),
  UNIQUE (user_a, user_b),
  CHECK (user_a < user_b)
);

-- Messages table: messages linked to conversations
CREATE TABLE IF NOT EXISTS messages (
  id              INTEGER PRIMARY KEY AUTOINCREMENT,
  conversation_id INTEGER NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  sender_id       INTEGER NOT NULL REFERENCES users(id),
  content         TEXT    NOT NULL,
  created_at      TEXT    NOT NULL DEFAULT (datetime('now'))
);
```

> **Account Deletion Pattern**: When a user deletes their account, the record is anonymized rather than deleted: `deleted_at` is marked, `username` is renamed to `deleted#<id>`, profile fields are wiped, and credentials cleared. Message integrity and sender relationships remain fully intact for conversation history.

---

## 🛠️ Scripts & Quality Checks

### Server Scripts

| Command | Action |
|---|---|
| `npm run dev --prefix server` | Starts development server with tsx watch mode |
| `npm run build --prefix server` | Compiles TypeScript to `dist/` |
| `npm run start --prefix server` | Runs compiled production server |
| `cd server && npx tsc --noEmit` | Runs strict TypeScript type-checking |

### Client Scripts

| Command | Action |
|---|---|
| `npm run dev --prefix client` | Starts Next.js development server |
| `npm run build --prefix client` | Builds Next.js production bundle with type-checking |
| `npm run start --prefix client` | Starts Next.js production server |
| `npm run lint --prefix client` | Runs ESLint validation |

### Resetting Data

To start with a completely fresh database:
```bash
# Stop the server, then delete the SQLite files
rm server/chat.db*
# Restart the server - tables will automatically regenerate
npm run dev --prefix server
```

---

## 🎨 Design System

The application uses an intentional, warm editorial aesthetic rather than generic defaults:

- **Background Canvas**: `#F5F5F0` (warm stone paper)
- **Primary / Accent**: `#5D866C` (muted sage green)
- **Deep Neutral / Typography**: `#202734` (slate navy)
- **Danger / Deletion**: `#DC2626` (clean crimson red)

---

## 📄 License

This project is open-source and available under the [MIT License](LICENSE).
