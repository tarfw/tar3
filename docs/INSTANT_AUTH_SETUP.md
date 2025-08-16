# InstantDB Magic Code Authentication Setup

## 🚀 Quick Setup

### 1. Get your InstantDB App ID
1. Go to [InstantDB Dashboard](https://instantdb.com/dash)
2. Create a new app or select an existing one
3. Copy your App ID

### 2. Update Environment Variables
Update your `.env.local` file:
```bash
EXPO_PUBLIC_INSTANT_APP_ID=your_app_id_here
```

### 3. Test the Authentication
1. Start your app: `npm start`
2. Navigate to the Profile tab
3. You should see the sign-in screen
4. Enter your email and check for the magic code

## 🎨 Design Features

The authentication system follows Linear app design principles:

- **Clean, minimal interface** with proper spacing and typography
- **Smooth transitions** between email and code input
- **Consistent color scheme** that adapts to light/dark mode
- **Proper error handling** with user-friendly messages
- **Loading states** for better UX

## 📱 Features Included

- ✅ Magic code email authentication
- ✅ Automatic routing based on auth state
- ✅ Sign out functionality
- ✅ Loading screens
- ✅ Error handling
- ✅ Linear-inspired design
- ✅ Dark/light mode support
- ✅ TypeScript support

## 🔧 How It Works

1. **Email Step**: User enters email, magic code is sent
2. **Code Step**: User enters 6-digit code from email
3. **Authentication**: InstantDB validates and signs in user
4. **Routing**: App automatically navigates to main tabs
5. **Profile**: User can view account info and sign out

## 📁 Files Created/Modified

- `lib/instant.ts` - InstantDB configuration
- `app/(auth)/_layout.tsx` - Auth group layout
- `app/(auth)/sign-in.tsx` - Magic code auth screen
- `contexts/AuthContext.tsx` - Authentication context
- `components/LoadingScreen.tsx` - Loading component
- `app/index.tsx` - Root redirect logic
- `app/_layout.tsx` - Updated with auth provider
- `app/(tabs)/profile.tsx` - Updated with user info and sign out

## 🎯 Next Steps

1. Replace `__YOUR_APP_ID__` in `.env.local` with your actual InstantDB App ID
2. Test the authentication flow
3. Customize the design colors/styling as needed
4. Add additional user profile features

## 🔐 Security Notes

- Magic codes are handled securely by InstantDB
- No passwords stored locally
- Automatic token refresh
- Secure email delivery