
# MTG Deck Builder - Flutter Version

This is the Flutter version of the MTG Deck Builder app that connects to your existing Express.js backend.

## Features

- **Deck Management**: Create, edit, delete, and organize MTG decks
- **Card Search**: Search Magic: The Gathering cards using Scryfall API
- **Deck Import**: Import decks from Moxfield URLs
- **Price Tracking**: View card prices and historical data
- **Wishlist**: Manage cards you want to acquire
- **Mobile Native**: Built with Flutter for optimal mobile experience

## Architecture

- **Frontend**: Flutter/Dart with Provider for state management
- **Backend**: Your existing Express.js server (no changes needed)
- **Database**: Uses the same PostgreSQL database via your backend APIs
- **APIs**: Connects to your Express endpoints + Scryfall API

## Backend Connection

The Flutter app connects to your Express backend at `http://0.0.0.0:5000/api`. Make sure your Express server is running before testing the Flutter app.

## Development Setup

1. **Install Flutter SDK** (if not already installed)
2. **Navigate to flutter_app directory**: `cd flutter_app`
3. **Get dependencies**: `flutter pub get`
4. **Generate model files**: `flutter packages pub run build_runner build`
5. **Run the app**: `flutter run`

## Key Differences from React Version

- **State Management**: Uses Provider instead of TanStack Query
- **HTTP Client**: Uses Dart's http package instead of axios
- **UI Components**: Material Design widgets instead of Radix UI
- **Type Safety**: Dart's type system with JSON serialization
- **Platform**: Native mobile app instead of web-based

## API Endpoints Used

All the same endpoints as your React app:
- `GET /api/decks` - List all decks
- `POST /api/decks` - Create new deck
- `GET /api/decks/:id` - Get specific deck
- `PATCH /api/decks/:id` - Update deck
- `DELETE /api/decks/:id` - Delete deck
- `POST /api/import/deck` - Import deck from URL
- `GET /api/wishlist` - Get wishlist items
- `PUT /api/wishlist` - Update wishlist

## Building for Android

1. **Build APK**: `flutter build apk`
2. **Build App Bundle**: `flutter build appbundle`
3. **Install on device**: `flutter install`

The Flutter version maintains the same core functionality as your React app while providing a native mobile experience.
