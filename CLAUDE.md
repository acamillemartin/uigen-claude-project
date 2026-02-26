# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
# Initial setup (install deps, generate Prisma client, run migrations)
npm run setup

# Development server (uses Turbopack)
npm run dev

# Build for production
npm run build

# Lint
npm lint

# Run all tests
npm test

# Run a single test file
npx vitest run src/lib/__tests__/file-system.test.ts

# Reset database
npm run db:reset

# Regenerate Prisma client after schema changes
npx prisma generate

# Run new migrations
npx prisma migrate dev
```

Set `ANTHROPIC_API_KEY` in `.env` to use real Claude. Without it, a `MockLanguageModel` in `src/lib/provider.ts` is used that returns static example components.

## Architecture

UIGen is a Next.js 15 (App Router) application where users describe React components via chat, and an AI generates them into a virtual file system with live preview.

### Request Flow

1. User submits chat in `ChatProvider` (`src/lib/contexts/chat-context.tsx`)
2. Vercel AI SDK (`useAIChat`) POSTs to `/api/chat` with messages + serialized VFS
3. API route (`src/app/api/chat/route.ts`) reconstructs the VFS, calls Claude with two tools, and streams the response
4. As Claude calls tools, `onToolCall` fires on the client → `FileSystemContext.handleToolCall` applies changes to the in-memory VFS
5. On finish, if user is authenticated with a `projectId`, the API persists messages and VFS to SQLite via Prisma

### Virtual File System (VFS)

`src/lib/file-system.ts` — `VirtualFileSystem` class holds all generated files in memory (no disk writes). It serializes to/from plain JSON objects for transport to the API and storage in the DB (`Project.data` column).

The `FileSystemContext` (`src/lib/contexts/file-system-context.tsx`) wraps the VFS in React state, exposing `handleToolCall` which interprets AI tool calls into VFS mutations.

### AI Tools

The AI is given two tools (both defined per-request with a VFS instance):

- **`str_replace_editor`** (`src/lib/tools/str-replace.ts`): `view`, `create`, `str_replace`, `insert` operations on VFS files
- **`file_manager`** (`src/lib/tools/file-manager.ts`): `rename` and `delete` operations

### Preview Rendering

`src/lib/transform/jsx-transformer.ts` runs entirely in the browser:
1. Each JS/JSX/TS/TSX file is transformed with `@babel/standalone`
2. Transformed code is turned into Blob URLs
3. An import map is generated mapping file paths and `@/` aliases to Blob URLs; third-party packages resolve to `https://esm.sh/<package>`
4. A preview HTML document is injected into an iframe (`PreviewFrame` component), using the import map and dynamically importing `/App.jsx` as the entry point
5. Tailwind CSS is loaded via CDN script tag in the preview iframe

### AI Prompt Conventions (enforced by system prompt in `src/lib/prompts/generation.tsx`)

- Every project must have `/App.jsx` as the root entry point with a default export
- Style with Tailwind, not hardcoded styles
- Use `@/` alias for all local imports (e.g., `import Foo from '@/components/Foo'`)
- The VFS root is `/`; there are no real filesystem directories to worry about

### Auth & Persistence

- JWT sessions stored in HTTP-only cookies; 7-day expiry (`src/lib/auth.ts`)
- Anonymous users can generate freely; work is tracked in `sessionStorage` (`src/lib/anon-work-tracker.ts`) and offered for import on signup/login
- Authenticated users' projects (messages + VFS data) are saved to SQLite (`prisma/schema.prisma`: `User` and `Project` models)
- Middleware (`src/middleware.ts`) protects `/api/projects` and `/api/filesystem` routes
- The `/api/chat` route is **not** protected — anyone can generate; persistence is skipped for unauthenticated requests

### Layout

`MainContent` (`src/app/main-content.tsx`) is a resizable split-pane layout:
- Left panel: `ChatInterface` (chat input + message history)
- Right panel: tabs between `PreviewFrame` (live iframe) and a code view (`FileTree` + `CodeEditor` via Monaco)

Authenticated users are redirected from `/` to their most recent project at `/{projectId}`.

### Node Compatibility

`node-compat.cjs` is required via `NODE_OPTIONS` in all npm scripts to patch Node.js compatibility issues with certain dependencies.
