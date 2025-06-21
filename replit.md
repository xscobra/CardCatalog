# MTG Deck Builder - Replit Project Guide

## Overview

This is a comprehensive Magic: The Gathering deck building application built with modern web technologies. The application provides a full-featured deck management system with card search, price tracking, wishlist functionality, and mobile support through Capacitor for Android deployment.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Routing**: Wouter for lightweight client-side routing
- **State Management**: TanStack Query (React Query) for server state management
- **UI Components**: Radix UI primitives with Tailwind CSS styling
- **Build Tool**: Vite for fast development and optimized builds
- **Mobile**: Capacitor for native Android app packaging

### Backend Architecture
- **Server**: Express.js with TypeScript
- **Database**: PostgreSQL with Drizzle ORM
- **Database Provider**: Neon (serverless PostgreSQL)
- **API Integration**: Scryfall API for Magic: The Gathering card data
- **Development**: Hot reload with Vite middleware integration

## Key Components

### Database Schema
- **Decks**: Core deck storage with card collections and metadata
- **Price History**: Historical price tracking for cards from multiple sources
- **Price Alerts**: User-configurable price change notifications
- **Card Metadata**: Cached card information for performance
- **Wishlist Cards**: Separate collection for desired cards

### API Integration
- **Scryfall API**: Primary source for card data, images, and pricing
- **Rate Limiting**: Intelligent request queuing to respect API limits
- **Caching**: Local storage for frequently accessed data

### Core Features
- **Card Search**: Real-time search with set selection and latest printing defaults
- **Deck Management**: Create, edit, and organize decks by format
- **Price Tracking**: Monitor card values across multiple vendors with custom pricing logic
- **Set Symbols**: Visual representation of card sets and printings
- **Pulled Cards**: Track cards obtained with set-specific pricing
- **Export System**: Custom pricing exports (commons $0.25, others rounded up)
- **Mobile Support**: Responsive design with native Android app capability

## Data Flow

### Client-Side Storage
- Uses browser localStorage for offline functionality
- Automatic synchronization with server when available
- Persistent deck and wishlist data across sessions

### Server Integration
- RESTful API endpoints for deck CRUD operations
- Price history tracking and alert management
- Database-backed persistence with Drizzle ORM
- Connection pooling for optimal performance

### External API Flow
1. User searches for cards through the interface
2. Debounced search triggers Scryfall API request
3. Rate limiter queues requests to prevent API abuse
4. Results are cached locally and displayed
5. Card metadata is optionally stored in database

## External Dependencies

### Core Dependencies
- **@neondatabase/serverless**: PostgreSQL database connectivity
- **@tanstack/react-query**: Server state management and caching
- **@radix-ui/***: Accessible UI component primitives
- **axios**: HTTP client with interceptors and error handling
- **drizzle-orm**: Type-safe database ORM
- **wouter**: Lightweight React router

### Development Dependencies
- **Vite**: Build tool and development server
- **TypeScript**: Static type checking
- **Tailwind CSS**: Utility-first CSS framework
- **Capacitor**: Cross-platform native runtime

### External APIs
- **Scryfall API**: Magic: The Gathering card database
- **Set symbol CDN**: Card set imagery and icons

## Deployment Strategy

### Development Environment
- **Runtime**: Node.js 20
- **Database**: PostgreSQL 16
- **Port**: 5000 (configurable)
- **Hot Reload**: Enabled through Vite middleware

### Production Deployment
- **Platform**: Google Cloud Run (configured in .replit)
- **Build Command**: `npm run build`
- **Start Command**: `npm run start`
- **Database**: Neon serverless PostgreSQL
- **Static Assets**: Served from dist/public directory

### Mobile Deployment
- **Android**: Capacitor-based native app
- **Build**: `android-build.sh` script for packaging
- **Platform**: Android Studio project in `/android` directory

### Database Migrations
- **Tool**: Drizzle Kit for schema management
- **Command**: `npm run db:push` for schema synchronization
- **Configuration**: `drizzle.config.ts` with Neon connection

## Changelog
- June 20, 2025: Initial setup with comprehensive MTG deck builder
- June 20, 2025: Removed "Picked Up" section, simplified to two-column layout (Deck/Pulled Cards)
- June 20, 2025: Implemented custom pricing logic for exports (commons $0.25, others rounded up)
- June 20, 2025: Renamed Wishlist to "Card Search" with set selection functionality
- June 20, 2025: Implemented auto-scaling responsive design for all screen sizes with viewport-based scaling
- June 20, 2025: Enhanced Card Search to allow duplicate cards with different sets for price comparison
- June 20, 2025: Optimized API usage with intelligent caching, request deduplication, and reduced call frequency
- June 20, 2025: Implemented strict Scryfall rate limiting (8 req/sec max, 125ms delays) to prevent API bans
- June 20, 2025: Fixed deck import functionality with proper error handling and state management
- June 20, 2025: Simplified deck import to Moxfield URLs only and added .txt file upload support
- June 21, 2025: Updated price totals to reflect only pulled cards value and removed format dropdown
- June 21, 2025: Simplified UI to utilitarian design with clean, functional interface and dark/light mode toggle

## User Preferences

Preferred communication style: Simple, everyday language.
Preferred design style: Utilitarian, clean, and functional interface without fancy effects.