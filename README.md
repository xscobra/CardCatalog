# MTG Deck Builder

A comprehensive Magic: The Gathering deck building application built with modern web technologies. This application provides a full-featured deck management system with card search, price tracking, wishlist functionality, and mobile support.

## Features

### Core Functionality
- **Card Search**: Real-time search with Scryfall API integration and exact name matching
- **Deck Management**: Create, edit, and organize decks with full CRUD operations
- **Price Tracking**: Monitor card values across multiple vendors (TCGPlayer, Card Kingdom)
- **Set Selection**: Choose specific printings with visual set symbols
- **Pulled Cards**: Track obtained cards with set-specific pricing
- **Import/Export**: Support for Moxfield URLs and text file imports

### Advanced Features
- **Price History**: Historical price tracking with visual charts
- **Price Alerts**: Custom notifications for price changes
- **Format Support**: Organize decks by Magic formats
- **Responsive Design**: Optimized for desktop, tablet, and mobile
- **Offline Support**: Local storage for seamless offline functionality
- **Export Options**: Custom pricing exports with configurable rules

## Technology Stack

### Frontend
- **React 18** with TypeScript for type safety
- **Vite** for fast development and optimized builds
- **Wouter** for lightweight client-side routing
- **TanStack Query** for server state management and caching
- **Tailwind CSS** with Radix UI components for styling
- **Capacitor** for native Android app packaging

### Backend
- **Node.js** with Express.js server
- **PostgreSQL** database with Drizzle ORM
- **Neon** serverless PostgreSQL provider
- **Rate limiting** for API protection

### External APIs
- **Scryfall API** for Magic: The Gathering card data
- **Set symbol CDN** for card imagery

## Installation

### Prerequisites
- Node.js 20 or higher
- PostgreSQL database (or use included Neon setup)

### Setup
1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up environment variables:
   - `DATABASE_URL`: PostgreSQL connection string
   - Other environment variables as needed

4. Initialize the database:
   ```bash
   npm run db:push
   ```

5. Start the development server:
   ```bash
   npm run dev
   ```

The application will be available at `http://localhost:5000`

## Usage

### Creating a Deck
1. Navigate to the deck builder
2. Enter a deck name
3. Search for cards using the search interface
4. Add cards to your deck
5. Save your deck

### Importing Decks
- **Moxfield URLs**: Paste a Moxfield deck URL for automatic import
- **Text Files**: Upload `.txt` files with card lists
- **Manual Entry**: Type or paste card lists in various formats

### Managing Cards
- **Pull Cards**: Move cards from deck to pulled section when obtained
- **Set Selection**: Choose specific printings for accurate pricing
- **Price Tracking**: Monitor value changes over time
- **Remove Cards**: Use explicit remove buttons (swipe removal disabled)

### Export Options
- **Text Format**: Export deck lists as text files
- **Custom Pricing**: Commons default to $0.25, others rounded up
- **Separate Sections**: Deck and pulled cards exported separately

## Database Schema

### Core Tables
- **decks**: Deck information and card collections
- **price_history**: Historical price data
- **price_alerts**: User price notifications
- **card_metadata**: Cached card information
- **wishlist_cards**: Separate card collection

### Relationships
- Decks contain multiple cards with quantities
- Cards can have multiple printings across sets
- Price history tracks changes over time
- Alerts trigger on price thresholds

## API Endpoints

### Deck Operations
- `GET /api/decks` - List all decks
- `POST /api/decks` - Create new deck
- `GET /api/decks/:id` - Get specific deck
- `PUT /api/decks/:id` - Update deck
- `DELETE /api/decks/:id` - Delete deck

### Card Operations
- `GET /api/cards/search` - Search cards
- `GET /api/cards/:id/prints` - Get card printings
- `GET /api/cards/:id/history` - Get price history

### Import/Export
- `POST /api/import/deck` - Import from URL
- `GET /api/export/deck/:id` - Export deck

## Development

### Project Structure
```
├── client/              # Frontend React application
│   ├── src/
│   │   ├── components/  # React components
│   │   ├── pages/       # Route components
│   │   ├── lib/         # Utilities and API
│   │   └── hooks/       # Custom React hooks
├── server/              # Backend Express server
│   ├── routes.ts        # API routes
│   ├── storage.ts       # Database operations
│   └── index.ts         # Server entry point
├── shared/              # Shared types and schemas
│   └── schema.ts        # Database schema
└── flutter_app/         # Mobile app (Flutter)
```

### Development Commands
```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run db:push      # Push database schema changes
npm run db:studio    # Open database studio
```

### Code Style
- TypeScript for type safety
- Functional components with hooks
- Utility-first CSS with Tailwind
- Clean, readable code structure
- Comprehensive error handling

## Deployment

### Production Build
```bash
npm run build
npm run start
```

### Environment Variables
- `DATABASE_URL`: PostgreSQL connection
- `NODE_ENV`: Set to 'production'
- `PORT`: Server port (default: 5000)

### Database Migrations
Use Drizzle Kit for schema management:
```bash
npm run db:push  # Push schema changes
```

## Mobile App

### Android Build
The project includes Capacitor configuration for native Android apps:
```bash
npm run android-build
```

### Flutter Alternative
A Flutter version is included in `flutter_app/` for native performance.

## API Rate Limiting

### Scryfall API
- Maximum 8 requests per second
- 125ms minimum delay between requests
- Intelligent queuing system
- Automatic retry with backoff

### Best Practices
- Results are cached for 15 minutes
- Debounced search input (750ms)
- Request deduplication
- Error handling with user feedback

## Contributing

### Guidelines
- Follow TypeScript best practices
- Use existing component patterns
- Add comprehensive error handling
- Update documentation for new features
- Test on multiple screen sizes

### Code Quality
- Consistent naming conventions
- Proper TypeScript typing
- Responsive design patterns
- Accessibility considerations

## License

This project is open source and available under the MIT License.

## Support

For issues and feature requests, please use the project's issue tracker.

## Changelog

### Recent Updates
- Enhanced card search accuracy with exact name matching
- Fixed "Move to Deck" functionality
- Improved responsive design
- Added comprehensive error handling
- Implemented rate limiting for API protection
- Simplified UI to utilitarian design

### Version History
See `replit.md` for detailed changelog and project evolution.