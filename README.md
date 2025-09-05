# Welcome to your Expo app 👋

This is an [Expo](https://expo.dev) project created with [`create-expo-app`](https://www.npmjs.com/package/create-expo-app).

## Get started

1. Create your .env file

   ```bash
   cp .env.example .env
   # Edit .env and set EXPO_PUBLIC_INSTANT_APP_ID (and any other variables you need)
   ```

2. Install dependencies

   ```bash
   npm install
   ```

3. Start the app

   ```bash
   npx expo start
   ```

In the output, you'll find options to open the app in a

- [development build](https://docs.expo.dev/develop/development-builds/introduction/)
- [Android emulator](https://docs.expo.dev/workflow/android-studio-emulator/)
- [iOS simulator](https://docs.expo.dev/workflow/ios-simulator/)
- [Expo Go](https://expo.dev/go), a limited sandbox for trying out app development with Expo

You can start developing by editing the files inside the **app** directory. This project uses [file-based routing](https://docs.expo.dev/router/introduction).

## Database Architecture

This app uses a hybrid database approach:

1. **InstantDB** - Used for real-time collaboration features and user authentication
2. **SQLite** - Used for local-first data storage with automatic synchronization

### Database Creation

For each new user, the app automatically creates:
- A dedicated InstantDB database for real-time features
- Database configuration stored in InstantDB for persistence across devices

The SQLite integration provides:
- Offline-first capability with local storage
- Automatic synchronization with InstantDB when online
- Per-user isolated databases for data privacy
- Database configuration stored in InstantDB for persistence across devices

### Simplified Authentication Flow

The authentication process is straightforward:
1. User authenticates with InstantDB (magic code flow)
2. System checks if user already has an app
3. If not, creates InstantDB app
4. Links user to their databases
5. Configures HybridDbContext for user-specific data
6. Navigates to main app

No caching is used since authentication already requires network connectivity.

## Get a fresh project

When you're ready, run:

```bash
npm run reset-project
```

This command will move the starter code to the **app-example** directory and create a blank **app** directory where you can start developing.

## Learn more

To learn more about developing your project with Expo, look at the following resources:

- [Expo documentation](https://docs.expo.dev/): Learn fundamentals, or go into advanced topics with our [guides](https://docs.expo.dev/guides).
- [Learn Expo tutorial](https://docs.expo.dev/tutorial/introduction/): Follow a step-by-step tutorial where you'll create a project that runs on Android, iOS, and the web.

## Join the community

Join our community of developers creating universal apps.

- [Expo on GitHub](https://github.com/expo/expo): View our open source platform and contribute.
- [Discord community](https://chat.expo.dev): Chat with Expo users and ask questions.