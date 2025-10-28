# Overview

This is a birthday gift web application created for Kayla's 21st birthday. The application is an interactive, multi-scene experience built with Phaser 3 game engine. It features:

1. **EnvelopeScene**: Opening animation with confetti explosion, screen flash effect, and camera zoom
2. **LetterScene**: Letter display with parallax background, sparkle effects, and interactive CTA button
3. **RPGScene**: Quest-based exploration game where players collect 5 birthday tokens scattered across the map
4. **DialogScene**: Dedicated scene for NPC interactions with smooth animations

The application is a full-stack TypeScript project using Express.js for the backend API server and React with Vite for the frontend. It includes a complete UI component library based on Radix UI primitives and Tailwind CSS for styling.

## Recent Improvements (October 2025)

**Visual Enhancements:**
- Confetti particle explosions with 16 vibrant colors
- Sparkle effects and parallax backgrounds
- Player particle trail effects when moving
- Vignette overlay for atmospheric depth
- Golden glow effects around collectible tokens

**Gameplay Features:**
- Quest system with 5 collectible birthday tokens
- Animated UI HUD showing quest objectives and progress
- Dynamic NPC dialog based on quest completion status
- Smooth camera following with improved easing (0.08 lerp)
- Better interaction prompts with icons and animations

**Technical Improvements:**
- Dedicated DialogScene for better NPC interactions
- Proper memory management for particles and tweens
- Optimized performance with tween guards
- Clean object destruction when tokens are collected

# User Preferences

Preferred communication style: Simple, everyday language.

# System Architecture

## Frontend Architecture

**Framework**: React 18 with TypeScript, bundled using Vite
- Single Page Application (SPA) structure
- Component-based architecture using functional components with hooks
- Client-side routing would be handled by the application (currently single-page game)

**Game Engine**: Phaser 3
- Scene-based architecture with four main scenes:
  - `EnvelopeScene`: Animated sprite-sheet based envelope opening with confetti and camera effects
  - `LetterScene`: Letter display with parallax background, sparkle particles, and interactive button
  - `RPGScene`: Quest-based top-down RPG with collectible tokens, HUD, particle effects, and vignette
  - `DialogScene`: Modal dialog system for NPC interactions with proper pause/resume
- Physics system configured (Arcade physics) but gravity disabled for top-down movement
- Particle systems for visual effects (confetti, sparkles, trails, collection bursts)
- Asset loading system for images, sprite sheets, and procedurally generated textures

**State Management**: Zustand with middleware
- `useGame` store: Manages game phase lifecycle (ready → playing → ended)
- `useAudio` store: Controls background music and sound effects with mute functionality
- Uses `subscribeWithSelector` middleware for reactive state updates

**Styling**: Tailwind CSS with CSS custom properties
- Design system using HSL color values defined in CSS variables
- Dark mode support via class-based toggling
- Responsive design with mobile-first breakpoints

**UI Components**: Extensive component library based on Radix UI primitives
- Over 30 pre-built, accessible components (buttons, dialogs, cards, forms, etc.)
- Consistent styling using `class-variance-authority` for variant management
- Utility-first approach with `cn()` helper for className merging

**Path Aliases**: Configured for clean imports
- `@/*` → `./client/src/*`
- `@shared/*` → `./shared/*`

## Backend Architecture

**Server Framework**: Express.js with TypeScript
- ES Modules (type: "module")
- Middleware stack includes JSON and URL-encoded body parsing
- Request logging middleware captures API calls with duration and response data
- Error handling middleware for centralized error responses

**Development Setup**: Vite integration in development mode
- HMR (Hot Module Replacement) enabled
- Runtime error overlay for better DX
- Separate build process for production (Vite for client, esbuild for server)

**Storage Layer**: Abstract storage interface pattern
- `IStorage` interface defines CRUD contract
- `MemStorage` class provides in-memory implementation for users
- Designed to be swappable with database-backed implementations
- Currently includes basic user management (getUser, getUserByUsername, createUser)

**Route Organization**: Modular route registration via `registerRoutes()`
- All application routes prefixed with `/api`
- Returns HTTP server instance for flexible deployment

## Data Storage

**ORM**: Drizzle ORM with PostgreSQL dialect
- Schema-first approach with TypeScript types
- Schema defined in `shared/schema.ts` for code sharing between client and server
- Migration support via drizzle-kit
- Type-safe database operations with Zod schema validation

**Database**: Configured for PostgreSQL via Neon serverless driver
- Connection string via `DATABASE_URL` environment variable
- Schema includes users table with username/password fields
- Uses Drizzle's `createInsertSchema` for runtime validation

**Current Implementation**: Dual storage strategy
- In-memory storage (`MemStorage`) for development/testing
- Database schema prepared for PostgreSQL integration
- Separation allows easy migration from memory to persistent storage

## External Dependencies

**Database Services**:
- `@neondatabase/serverless`: Serverless PostgreSQL driver for Neon
- `drizzle-orm`: TypeScript ORM for type-safe database operations
- `drizzle-kit`: Migration and schema management tools

**Game Development**:
- `phaser`: Core game engine for 2D games
- `@react-three/fiber`, `@react-three/drei`, `@react-three/postprocessing`: Three.js React renderer (available but not actively used in current scenes)

**UI Framework**:
- `@radix-ui/*`: 25+ accessible, unstyled component primitives
- `tailwindcss`: Utility-first CSS framework
- `class-variance-authority`: Type-safe variant styling
- `lucide-react`: Icon library

**Data Fetching**:
- `@tanstack/react-query`: Server state management and caching
- Custom `apiRequest` helper for fetch-based API calls
- Query client configured with infinite stale time

**Form Handling**:
- `react-hook-form`: Form state management
- `zod`: Runtime type validation and schema definition
- `drizzle-zod`: Bridge between Drizzle schemas and Zod validation

**Utilities**:
- `date-fns`: Date manipulation
- `clsx` + `tailwind-merge`: Conditional className utilities
- `cmdk`: Command palette component
- `nanoid`: Unique ID generation

**Build Tools**:
- `vite`: Frontend build tool and dev server
- `esbuild`: Backend bundler for production
- `tsx`: TypeScript execution for development
- `@vitejs/plugin-react`: React support for Vite
- `vite-plugin-glsl`: GLSL shader support (for potential Three.js integration)
- `@replit/vite-plugin-runtime-error-modal`: Development error overlay

**Type Safety**:
- Full TypeScript coverage across client, server, and shared code
- Strict mode enabled
- Path aliases for improved import statements