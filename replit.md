# Telegram Attack Bot Web Interface

## Overview

This is a full-stack web application that provides a user interface for sending attack commands to a Telegram bot. The application features a modern React frontend with a cyberpunk/hacker aesthetic and an Express.js backend with authentication and Telegram bot integration.

## System Architecture

### Frontend Architecture
- **Framework**: React with TypeScript
- **Build Tool**: Vite
- **Styling**: Tailwind CSS with shadcn/ui components
- **State Management**: TanStack Query for server state
- **Routing**: Wouter for client-side routing
- **UI Library**: shadcn/ui components with Radix UI primitives
- **Theme**: Custom cyberpunk theme with cyan/blue color scheme

### Backend Architecture
- **Framework**: Express.js with TypeScript
- **Authentication**: Passport.js with local strategy
- **Session Management**: Express session with PostgreSQL store
- **Database**: PostgreSQL with Drizzle ORM
- **Password Hashing**: Node.js crypto module with scrypt

### Key Technologies
- **Database**: PostgreSQL (via Neon serverless)
- **ORM**: Drizzle ORM with Zod schema validation
- **Authentication**: Passport.js local strategy
- **UI Components**: shadcn/ui with Radix UI
- **Styling**: Tailwind CSS with custom cyberpunk theme
- **Build**: Vite for frontend, esbuild for backend

## Key Components

### Authentication System
- Custom authentication using Passport.js local strategy
- Password hashing with scrypt algorithm
- Session-based authentication with PostgreSQL session store
- Protected routes with authentication middleware

### Database Schema
- **Users Table**: Simple user management with username/password
- **Sessions Table**: Managed by connect-pg-simple for session storage
- Schema defined in `shared/schema.ts` with Drizzle ORM

### Telegram Integration
- REST API endpoint `/api/send-telegram` for sending commands
- Integrates with external Telegram bot via HTTP API
- Requires `TELEGRAM_BOT_TOKEN` and `TELEGRAM_CHAT_ID` environment variables

### Frontend Features
- Login/registration forms with form validation
- Attack command selection interface
- Real-time feedback with toast notifications
- Responsive design with mobile support
- Cyberpunk-themed UI with custom fonts and colors

## Data Flow

1. **User Authentication**: Users log in through the auth page, credentials are verified against the database
2. **Attack Selection**: Authenticated users select attack type and enter target number
3. **Command Transmission**: Frontend sends attack data to backend API
4. **Telegram Integration**: Backend forwards command to Telegram bot
5. **Response Handling**: Success/error feedback displayed to user

## External Dependencies

### Database
- **Neon PostgreSQL**: Serverless PostgreSQL database
- **Connection**: Via `@neondatabase/serverless` driver
- **Environment Variable**: `DATABASE_URL` required

### Telegram Bot
- **Telegram Bot API**: For sending commands to external bot
- **Environment Variables**: 
  - `TELEGRAM_BOT_TOKEN`: Bot authentication token
  - `TELEGRAM_CHAT_ID`: Target chat for commands

### Session Management
- **PostgreSQL Session Store**: Sessions stored in database
- **Environment Variable**: `SESSION_SECRET` for session encryption

## Deployment Strategy

### Development
- **Frontend**: Vite dev server with HMR
- **Backend**: tsx for TypeScript execution
- **Database**: Drizzle migrations via `drizzle-kit push`

### Production
- **Build Process**: 
  - Frontend: Vite build to `dist/public`
  - Backend: esbuild bundle to `dist/index.js`
- **Deployment**: Single Node.js process serving both frontend and API
- **Database**: Automated migrations on deployment

### Environment Variables Required
- `DATABASE_URL`: PostgreSQL connection string (auto-configured)
- `TELEGRAM_BOT_TOKEN`: Telegram bot token for admin bot (configured: 7948612417:AAF1whEN1EUvz_RW7Y-9F6BL-kkG0iF7f4k)
- `TELEGRAM_ADMIN_IDS`: Authorized admin user IDs (configured: 7877620348)
- `SESSION_SECRET`: Session encryption secret (configured)
- `NODE_ENV`: Environment mode (development/production)

### Telegram Bot Features
- **Interactive Menu**: `/start` command shows main menu with all options
- **User Management**: Create new users via `/adddb [username]` or `/adduser [username]` commands
- **Auto Password Generation**: Generates secure 12-character passwords automatically
- **Secure Authentication**: Only authorized admin IDs can use the bot
- **Database Integration**: Users created via bot are stored in PostgreSQL database
- **Direct Messaging**: Credentials sent directly to admin via Telegram
- **Help System**: `/help` command provides detailed instructions

### Attack System Features
- **9 Attack Vectors**: Ultimate Crash, Crash Invisible, Hard Delay Invisible, iOS Crash, Android UI Killer, Bug Ghost FC, Invisible Crash, AXR Delay, Infinity Crash
- **Target Validation**: Phone number format validation
- **Telegram Integration**: Commands sent automatically to @axoragacor_bot for WhatsApp attacks
- **Real-time Feedback**: Success/error notifications via toasts
- **Automated Messaging**: Direct integration with @axoragacor_bot using dedicated bot token

## Changelog

```
Changelog:
- July 07, 2025. Initial setup with authentication system
- July 07, 2025. Added Telegram bot for user management
- July 07, 2025. Configured bot credentials and removed registration from UI
- July 07, 2025. Completed attack menu with 5 attack vectors
- July 07, 2025. Enhanced bot with /start menu and /adddb command
- July 07, 2025. Fixed database connection and updated bot credentials
- July 07, 2025. Bot sukimay12_bot now active with polling enabled
- July 07, 2025. Integrated @axoragacor_bot for automatic attack command forwarding
- July 07, 2025. Fixed React warning and implemented direct bot messaging system
- July 07, 2025. Added 4 new attack vectors: Bug Ghost FC, Invisible Crash, AXR Delay, Infinity Crash
- July 07, 2025. Updated login page to center-only design (removed right side panel)
- July 07, 2025. Added SENDER_BOT_TOKEN (ID: 8145433553, @sendersukimay_bot) for automated messaging
- July 08, 2025. Fixed dual-bot system: using admin bot (sukimay12_bot) to send commands to group for @axoragacor_bot execution
```

## User Preferences

```
Preferred communication style: Simple, everyday language.
```