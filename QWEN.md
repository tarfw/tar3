# Project Context for TAR Application

## Project Overview

This is a React Native application built with Expo, named "TAR" (likely short for "Tamil AR" or similar). The application uses a hybrid database architecture combining InstantDB for real-time collaboration and user authentication with local SQLite storage for offline-first capabilities.

### Core Technologies
- **Framework**: Expo (React Native)
- **Database**: Hybrid approach using InstantDB (cloud) and SQLite/Turso (local)
- **Authentication**: InstantDB magic code flow
- **Storage**: Cloudflare R2 for file storage
- **AI**: Groq API integration
- **State Management**: React Context API
- **Routing**: Expo Router with file-based routing
- **UI Components**: React Native components with custom UI elements
- **Turso Integration**: HTTP-based API calls to avoid Node.js specific modules

## Project Structure

```
tar/
├── app/                    # Main application screens and routing
│   ├── (auth)/            # Authentication screens
│   ├── (tabs)/            # Tab-based navigation screens
│   ├── api/               # API endpoints
│   ├── issue/             # Issue management
│   ├── note/              # Note management
│   ├── post/              # Post management
│   └── _layout.tsx        # Root layout component
├── components/            # Reusable UI components
├── constants/             # Application constants
├── contexts/              # React context providers
├── hooks/                 # Custom React hooks
├── lib/                   # Utility libraries and services
├── assets/                # Static assets (images, fonts)
├── scripts/               # Utility scripts
└── ...
```

## Key Features

1. **Hybrid Database Architecture**:
   - InstantDB for real-time collaboration and user authentication
   - SQLite/Turso for local-first data storage with automatic synchronization

2. **User Authentication**:
   - Magic code authentication flow via InstantDB
   - Automatic app creation for new users
   - Per-user isolated databases

3. **Data Management**:
   - Local SQLite storage for offline access
   - Automatic synchronization with cloud when online
   - Turso integration for enhanced SQLite capabilities

4. **File Storage**:
   - Cloudflare R2 integration for file storage
   - File management capabilities

5. **AI Integration**:
   - Groq API for AI-powered features
   - AI chat functionality

## Environment Variables

The application requires several environment variables for proper operation:

- `EXPO_PUBLIC_INSTANT_APP_ID`: InstantDB application ID
- `EXPO_PUBLIC_INSTANT_PLATFORM_TOKEN`: Instant platform token for agent management
- `EXPO_PUBLIC_GROQ_API_KEY`: Groq API key for AI features
- `EXPO_PUBLIC_TURSO_API_TOKEN`: Turso API token for database management
- `EXPO_PUBLIC_R2_ACCOUNT_ID`: Cloudflare R2 account ID
- `EXPO_PUBLIC_R2_ACCESS_KEY_ID`: R2 access key
- `EXPO_PUBLIC_R2_SECRET_ACCESS_KEY`: R2 secret key
- `EXPO_PUBLIC_R2_BUCKET_NAME`: R2 bucket name
- `EXPO_PUBLIC_R2_ENDPOINT`: R2 S3-compatible endpoint

## Database Schema

### InstantDB Schema
- `$files`: File storage entity with path and URL
- `$users`: User entity with email
- `app`: User app registry with app ID and Turso database information

### Local SQLite Schema
- `notes`: Simple note storage
- `items`: Product/item storage with categories
- `variants`: Product variants with SKUs, pricing, and stock
- `opgroups`: Option groups for product customization
- `opvalues`: Option values belonging to groups

## Authentication Flow

1. User authenticates with InstantDB (magic code flow)
2. System checks if user already has an app
3. If not, creates InstantDB app with default schema
4. Creates Turso database for the user
5. Links user to their databases
6. Configures HybridDbContext for user-specific data
7. Navigates to main app

## Development Setup

### Prerequisites
- Node.js (LTS version)
- Expo CLI
- Android Studio or Xcode for mobile development
- Cloudflare R2 account
- Turso account
- InstantDB account
- Groq API key

### Getting Started
1. Create your .env file from .env.example
2. Install dependencies: `npm install`
3. Start the app: `npx expo start`

### Available Scripts
- `npm start`: Start the development server
- `npm run android`: Run on Android emulator
- `npm run ios`: Run on iOS simulator
- `npm run web`: Run on web browser
- `npm run lint`: Run ESLint
- `npm run reset-project`: Reset project to starter template

## Building and Running

### Development
```bash
# Start development server
npx expo start

# Run on specific platforms
npx expo start --android
npx expo start --ios
npx expo start --web
```

### Production Build
```bash
# Build for production
npx expo build
```

## Development Conventions

### Code Style
- TypeScript for type safety
- ESLint for code linting
- Prettier for code formatting
- File-based routing with Expo Router

### Component Structure
- Context API for state management
- Custom hooks for reusable logic
- Separation of UI components and business logic
- Consistent naming conventions

### Database Management
- Selective synchronization approach to minimize sync costs
- Local-first approach with SQLite for user-specific data
- Cloud access via Turso using HTTP API calls (to avoid Node.js module issues)
- Per-user database isolation
- Migration system for schema updates
- Local-only tables for non-collaborative data (items, variants, etc.)
- Cloud-accessible tables for collaborative data (notes, if needed)

## Testing

The project uses standard Expo testing practices. Run tests with:

```bash
npm test
```

## Deployment

The application can be deployed using Expo Application Services (EAS):

1. Configure `eas.json` for build settings
2. Run `eas build` for production builds
3. Use `eas submit` for app store submissions

## Key Directories and Files

### Core Context Providers
- `contexts/AuthContext.tsx`: Authentication state management
- `contexts/HybridDbContext.tsx`: Selective sync database integration (InstantDB + SQLite + Turso)
- `contexts/TursoContext.tsx`: Turso database configuration
- `contexts/ThemeContext.tsx`: Theme management

### Core Services
- `lib/instant.ts`: InstantDB initialization
- `lib/instantPlatformService.ts`: Instant platform API integration
- `lib/tursoService.ts`: Turso database management (user database creation)
- `lib/tursoHttpService.ts`: HTTP-based Turso database interactions (React Native compatible)
- `lib/migrations.ts`: SQLite database migrations
- `lib/selectiveSyncStrategy.md`: Documentation on selective sync strategy

### Main Application Screens
- `app/_layout.tsx`: Root application layout
- `app/index.tsx`: Entry point with authentication redirect
- `app/(tabs)/_layout.tsx`: Tab navigation layout
- `app/(auth)/`: Authentication screens
- `app/products.tsx`: Product management screen
- `app/tables.tsx`: Database schema management

## Troubleshooting

### Common Issues
1. **Missing Environment Variables**: Ensure all required env vars are set in `.env`
2. **Database Connection Issues**: Verify Turso API token and network connectivity
3. **Authentication Failures**: Check InstantDB configuration and platform token
4. **Build Errors**: Ensure all dependencies are properly installed

### Debugging
- Check console logs for detailed error messages
- Use React Developer Tools for component debugging
- Expo DevTools for runtime inspection