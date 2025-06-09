# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a Next.js 15 tree editor application deployed on Cloudflare Workers/Pages. It features a drag-and-drop tree structure editor with authentication, internationalization, and workspace management.

## Tech Stack

- **Frontend**: Next.js 15.3.2 (App Router), React 19.1.0
- **Styling**: Tailwind CSS v4, shadcn/ui components
- **Backend API**: Hono 4.7.10
- **Database**: Drizzle ORM with Cloudflare D1 (SQLite)
- **Authentication**: OIDC with Google OAuth
- **State Management**: SWR for data fetching
- **Deployment**: Cloudflare Workers/Pages via @opennextjs/cloudflare

## Development Commands

```bash
# Install dependencies
pnpm install

# Development
pnpm dev                    # Start Next.js dev server

# Build & Deploy
pnpm build                  # Build Next.js app
pnpm preview               # Build and preview with Cloudflare
pnpm deploy                # Deploy to Cloudflare

# Database
pnpm db:generate           # Generate Drizzle migrations
pnpm db:migrate:local      # Apply migrations to local D1
pnpm db:studio             # Open Drizzle Studio

# Linting
pnpm lint                  # Run Next.js linter

# Type Generation
pnpm cf-typegen           # Generate Cloudflare env types
```

## Architecture

### Directory Structure
- `/app` - Next.js App Router pages and API routes
  - `/api/[[...hono]]` - Hono API routes with auth handlers
- `/components` - React components
  - `/ui` - shadcn/ui base components
  - `/tree-editor` - Main tree editor feature components
- `/db` - Database schema and configuration
- `/utils/i18n` - Internationalization (EN/JA)

### Key Components
- **Tree Editor** (`/components/tree-editor`): Core drag-drop tree functionality with nodes, search, workspaces
- **Authentication** (`/app/api/[[...hono]]/handlers/auth`): Google OAuth via OIDC
- **API Client** (`/lib/api-client.ts`): Frontend API communication using SWR

### Environment Configuration
- Cloudflare bindings defined in `wrangler.jsonc`:
  - D1 Database: `DB`
  - R2 Bucket: `AUTH_BUCKET`
  - Environment variables for OIDC auth

### Database Schema
User management schema in `/db/schema/users.ts` using Drizzle ORM with SQLite.

## Important Notes

- No testing framework is currently configured
- Authentication uses OIDC with session management via JWT/cookies
- Cloudflare-specific types are in `cloudflare-env.d.ts`
- Uses Hono middleware for auth context initialization