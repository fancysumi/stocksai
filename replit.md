# StockGenie - AI Trading Assistant

## Overview

StockGenie is a modern web application that provides AI-powered stock trading recommendations and portfolio management. The application combines React frontend with Express backend, using PostgreSQL for data persistence and integrating with external services like Anthropic's Claude AI and Polygon.io for market data.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

The application follows a full-stack architecture with clear separation between client and server code:

- **Frontend**: React with TypeScript, using Vite as the build tool
- **Backend**: Express.js with TypeScript
- **Database**: PostgreSQL with Drizzle ORM
- **AI Integration**: Anthropic Claude for investment analysis
- **Market Data**: Polygon.io API for real-time stock information
- **UI Framework**: Shadcn/ui components with Tailwind CSS

## Key Components

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Routing**: Wouter for client-side routing
- **State Management**: TanStack Query (React Query) for server state
- **UI Components**: Shadcn/ui component library built on Radix UI primitives
- **Styling**: Tailwind CSS with CSS variables for theming
- **Build Tool**: Vite with custom configuration for development and production

### Backend Architecture
- **Server**: Express.js with TypeScript
- **Database ORM**: Drizzle ORM with PostgreSQL dialect
- **Session Management**: Connect-pg-simple for PostgreSQL session storage
- **API Structure**: RESTful endpoints for stocks, portfolio, watchlist, and recommendations
- **Error Handling**: Centralized error middleware with proper HTTP status codes

### Database Schema
The application uses the following main entities:
- **Users**: User authentication and profile data
- **Stocks**: Stock information including price, volume, and market data
- **Watchlist**: User's watched stocks with timestamps
- **Portfolio**: User's stock holdings with shares and average price
- **Recommendations**: AI-generated trading recommendations
- **Market Data**: General market indicators and trends

### AI Integration
- **Service**: Anthropic Claude API integration
- **Model**: Uses claude-sonnet-4-20250514 (latest model)
- **Features**: Stock analysis, portfolio recommendations, market sentiment analysis
- **Types**: Supports different recommendation types (WATCHLIST, PORTFOLIO, DISCOVERY)

## Data Flow

1. **Market Data Updates**: Scheduled service fetches real-time data from Polygon.io API
2. **AI Analysis**: Claude service analyzes market conditions and generates recommendations
3. **User Interactions**: Frontend components interact with backend APIs using React Query
4. **Database Operations**: Drizzle ORM handles all database interactions with type safety
5. **Real-time Updates**: Polling-based updates for market data and recommendations

## External Dependencies

### Third-party Services
- **Anthropic Claude API**: AI-powered investment analysis and recommendations
- **Polygon.io API**: Real-time and historical stock market data
- **Neon Database**: PostgreSQL hosting service

### Key Libraries
- **Frontend**: React, TypeScript, Vite, TanStack Query, Wouter, Radix UI, Tailwind CSS
- **Backend**: Express, Drizzle ORM, Node-cron for scheduling
- **UI Components**: Shadcn/ui component system with consistent theming

## Deployment Strategy

### Development Environment
- **Frontend**: Vite dev server with HMR (Hot Module Replacement)
- **Backend**: Node.js with tsx for TypeScript execution
- **Database**: PostgreSQL with Drizzle migrations
- **Environment Variables**: Separate configs for development and production

### Production Build
- **Frontend**: Vite builds optimized static assets
- **Backend**: esbuild bundles server code with external dependencies
- **Database**: Drizzle migrations applied via `db:push` command
- **Deployment**: Single Node.js process serving both API and static files

### Architecture Decisions

**Database Choice**: PostgreSQL was chosen for its robust ACID compliance and excellent support for financial data with decimal precision for stock prices and portfolio values.

**ORM Selection**: Drizzle ORM provides type-safe database operations with minimal runtime overhead, making it ideal for a TypeScript-first application.

**AI Service Integration**: Anthropic Claude was selected for its superior reasoning capabilities in financial analysis compared to other AI services.

**State Management**: TanStack Query handles server state management, reducing boilerplate code and providing excellent caching and synchronization features.

**Component Library**: Shadcn/ui was chosen for its customizable, accessible components built on proven Radix UI primitives, allowing for consistent design while maintaining flexibility.

**Mobile-First Design**: The application is designed with mobile users in mind, featuring a bottom navigation pattern and responsive layouts optimized for trading on mobile devices.

## Recent Changes: Latest modifications with dates

### January 24, 2025
- **Database Migration**: Successfully migrated from in-memory storage to PostgreSQL database with proper schema for portfolios, stocks, and user data persistence
- **Bulk Portfolio Import**: Added comprehensive bulk import functionality allowing users to add existing portfolio positions via CSV/text format with validation and preview
- **Real Portfolio Tracking**: Implemented actual position tracking with quantities, average prices, and real-time P&L calculations based on current market data
- **Database Schema**: Created normalized database tables for users, portfolios, stocks, watchlist, portfolio items, recommendations, and market data with proper relationships
- **Multi-Portfolio Architecture**: Implemented support for 3 portfolios (Main, Growth, Dividend) with portfolio-specific watchlists and position management
- **Cash Balance Tracking**: Added comprehensive cash management with real-time balance display, deposit/withdraw functionality stored in database
- **Portfolio Context**: Created portfolio selection system with database-backed portfolio management and cash balance visibility
- **Enhanced Position Management**: Added edit, remove, and bulk import capabilities for portfolio positions with proper database persistence
- **AI-Driven Deployment Suggestions**: Integrated cash balance data with Claude AI for informed investment recommendations based on available funds
- **Automated Scheduling**: Added automatic recommendation generation at NYSE close (4:30 PM EST) in addition to pre-market generation (9 AM EST)