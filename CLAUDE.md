# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

HeyBurrito is a Slack reward system that allows team members to recognize and reward colleagues with burritos (:burrito:) or rotten burritos (:rottenburrito:). It's a self-hosted alternative to systems like HeyTaco.

## Development Commands

### Core Commands
- `npm start` - Start production server (requires .env file with SLACK_API_TOKEN)
- `npm run dev` - Start development server with nodemon hot reload
- `npm test` - Run Mocha test suite
- `npm run lint` - Run ESLint (exits 0 on errors, check manually)
- `npm run mockDB` - Seed test database with mock data

### Docker Commands
- `npm run docker-build` - Build and tag Docker image
- `npm run docker-push` - Push image to registry
- `docker-compose up -d` - Run with Docker Compose

## Project Architecture

### Main Entry Points
- `src/server.ts` - Main application entry point, starts HTTP server and initializes all services
- `src/bot.ts` - Slack bot message handling and burrito distribution logic

### Core Components

**Slack Integration**
- `src/slack/` - Slack API integrations
  - `Events.ts` - Events API webhook handler for incoming messages
  - `Wbc.ts` - Web client API for sending messages
- Uses `@slack/web-api` package and Events API webhooks

**Data Layer**
- `src/database/` - Database abstraction layer with multiple drivers
  - Supports MongoDB (`MongoDBDriver.ts`) and file-based storage
  - `BurritoStore.ts` - Main data store for burrito transactions
  - `LocalStore.ts` - In-memory cache for Slack user data

**API & Web Interface**
- `src/api/` - REST API endpoints for scoreboard data
- `src/web/` - Static file serving for web dashboard
- `src/wss/` - WebSocket server for real-time updates

**Business Logic**
- `src/lib/parseMessage.ts` - Parses Slack messages for burrito emojis and mentions
- `src/lib/validator.ts` - Validates messages and bot mentions
- `src/middleware.ts` - Request processing middleware

### Configuration System
Configuration is environment-based (production/development/testing) in `src/config/index.ts`:
- Database settings (MongoDB or file-based)
- Slack API tokens and emoji configuration
- Daily caps for burrito giving/receiving
- HTTP/WebSocket ports and paths
- Theme system for customizable UI

### Key Features
- **Daily Caps**: Configurable limits on burritos given/received per day
- **Decrement Control**: Can disable rotten burritos or just their point impact
- **Multiple Emojis**: Supports custom emoji configurations via environment variables
- **Theme System**: Pluggable themes for web interface
- **Real-time Updates**: WebSocket support for live scoreboard updates

## Environment Setup

Copy `.env.example` to `.env` and configure:
- `SLACK_API_TOKEN` - Required Bot User OAuth Token (starts with xoxb-)
- `SLACK_SIGNING_SECRET` - Required for webhook verification
- `BOT_NAME` - Slack bot name (default: heyburrito)
- `DATABASE_DRIVER` - 'mongodb' or 'file' (default: file)
- `MONGODB_URL` / `MONGODB_DATABASE` - MongoDB connection (if using MongoDB driver)
- `SLACK_EMOJI_INC` / `SLACK_EMOJI_DEC` - Emoji configuration
- `SLACK_DAILY_CAP` - Daily burrito giving limit (default: 5 in prod, 5000 in dev)

## Modern Slack App Setup

Create a modern Slack app at https://api.slack.com/apps with these requirements:
- **Bot Scopes**: `channels:history`, `chat:write`, `users:read`, `app_mentions:read`
- **Event Subscriptions**: Enable with endpoint `https://your-domain/slack/events`
- **Bot Events**: Subscribe to `message.channels` and `app_mention`
- **App Manifest**: Use `slack-app-manifest.json` for easy Slack app creation

## Testing

- Uses Mocha with TypeScript support
- Test files follow `*-test.ts` pattern in `/test` directory
- Includes mock database and Slack API utilities in `test/lib/`
- Empty `test/mocha.opts` file present for Mocha configuration

## Code Style

- TypeScript with ESLint (Airbnb TypeScript config)
- Uses `ts-node` for direct TypeScript execution
- Interface definitions in `src/types/` directory
- Logging via `bog` package

## Development Notes

- Development mode uses higher daily caps (5000 vs 5) for easier testing
- File-based database creates `.db` files in `data/` directory
- Web interface served on port 3333, WebSocket on 3334 (configurable)
- Supports Docker deployment with included Dockerfile and docker-compose.yml