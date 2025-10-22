# Budget Tracker

A simple, budget tracking app for students built with React Native and Expo.

## Features

- 📊 Track expenses and income
- 🎯 Categorize transactions
- 📈 Dashboard with financial insights
- 🔄 Optional cloud sync with Supabase
- 🔐 Google Authentication
- 🌙 Dark/Light theme support
- 📱 Offline-first design
- 🔒 Encrypted local storage

## Quick Start

### Prerequisites

- Node.js (v18 or higher)
- npm or yarn
- Expo CLI
- Android Studio (for Android) or Xcode (for iOS)

### Installation

1. Clone the repository:
```bash
git clone https://github.com/lowmax205/piggy-tracker.git
cd piggy-tracker
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.example .env
```

4. Edit `.env` with your Supabase and Google OAuth credentials:
```env
# Supabase
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key

# Google OAuth
GOOGLE_WEB_CLIENT_ID=your-web-client-id
GOOGLE_IOS_CLIENT_ID=your-ios-client-id
GOOGLE_ANDROID_CLIENT_ID=your-android-client-id

# API Configuration
API_BASE_URL=https://your-api.com
API_TIMEOUT=10000

# Feature Flags
ENABLE_SYNC=true
ENABLE_ANALYTICS=false
```

5. Run on your device:
```bash
# For Android
npm run android

# For iOS
npm run ios
```

## Project Structure

```
budget_tracker/
├── app/                    # Application source code
│   ├── components/         # Reusable UI components
│   ├── db/                 # Realm database configuration
│   ├── lib/                # Utility functions
│   ├── navigation/         # Navigation configuration
│   ├── screens/            # App screens
│   ├── services/           # API and business logic
│   └── state/              # Global state management
└── assets/                 # Images, fonts, etc.
```

## Technology Stack

- **Framework**: React Native with Expo
- **Language**: TypeScript
- **Database**: Realm (local) + Supabase (cloud sync)
- **Authentication**: Supabase Auth with Google OAuth
- **Navigation**: React Navigation
- **State Management**: React Context + Hooks
- **Styling**: React Native StyleSheet

## Development

### Available Scripts

- `npm start` - Start the Expo development server
- `npm run android` - Run on Android device/emulator
- `npm run ios` - Run on iOS device/simulator
- `npm run web` - Run on web browser
- `npm run lint` - Run ESLint

### Code Style

This project uses ESLint with TypeScript configuration. Run linting with:

```bash
npm run lint
```

## Contributing

Contributions are welcome! Please feel free to submit issues or pull requests.

## Privacy & Security

- All data is encrypted at rest using platform keystore
- No ads, no trackers, no third-party analytics
- Cloud sync is optional and uses end-to-end encryption
- Google OAuth is only used for authentication, not data collection

## License

0BSD - See LICENSE file for details

## Support

If you enjoy this app and want to support development:

- ☕ [Buy me a coffee](https://paypal.me/NiloJrOlang)
- ⭐ Star this repository
- 🐛 Report bugs and request features
- 💬 Share feedback

## Author

Made with ☕ and way too much caffeine by NiloJr

---

**Note**: This app is a personal project and is provided as-is without any warranties. Always back up your important financial data.
