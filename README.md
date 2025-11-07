# MuscleUp - AI-Powered Fitness Tracker

A React Native fitness app with workout tracking, nutrition logging, AI coaching, and social features.

## ⚠️ Active Development

This is a beta project built through rapid iteration. Expect bugs, missing tests, and potential breaking changes. You'll need your own Firebase project and API keys to run it.

## 📱 Features

- **Workout Tracking** - Create templates, log sets/reps, track PRs, rest timer
- **Nutrition Logging** - Manual entry, USDA food search, macro tracking
- **AI Coach (Atlas)** - OpenAI-powered workout advice and analysis
- **Progress Tracking** - Charts, stats, personal records
- **Social Features** - Friends, workout feed, share progress
- **Exercise Database** - RapidAPI ExerciseDB integration with demos

## 🚀 Quick Start

### Prerequisites
- Node.js >= 18
- React Native development environment
- Android Studio (for Android) or Xcode (for iOS)
- Firebase account
- OpenAI API key (optional, for AI features)
- RapidAPI key (optional, for exercise database)

### Installation

1. **Clone the repo**
   ```bash
   git clone https://github.com/KyleMayotte/fittrackerapp.git
   cd fittrackerapp
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up Firebase**
   - Create a Firebase project at https://console.firebase.google.com
   - Enable Authentication (Email/Password)
   - Enable Firestore Database
   - Download `google-services.json` (Android) to `android/app/`
   - Download `GoogleService-Info.plist` (iOS) to `ios/`

4. **Configure environment variables**
   ```bash
   cp .env.example .env
   ```

   Edit `.env` with your keys:
   ```
   OPENAI_API_KEY=sk-your-openai-key
   RAPIDAPI_KEY=your-rapidapi-key
   ```

5. **Run the app**
   ```bash
   # Android
   npm run android

   # iOS
   npm run ios
   ```

## 🔧 Tech Stack

- **Frontend**: React Native 0.76
- **Backend**: Firebase (Auth + Firestore)
- **Navigation**: React Navigation
- **State**: React Context + Hooks
- **Language**: TypeScript
- **AI**: OpenAI GPT-4
- **APIs**: RapidAPI ExerciseDB, USDA Food Database

## 📁 Project Structure

```
muscleup/
├── src/
│   ├── components/      # Reusable UI components
│   ├── screens/         # App screens
│   ├── services/        # API & Firebase services
│   ├── hooks/           # Custom React hooks
│   ├── context/         # Auth & Theme context
│   ├── utils/           # Helper functions
│   ├── types/           # TypeScript types
│   ├── theme/           # Colors, spacing, typography
│   └── constants/       # App constants
├── android/             # Android native code
├── ios/                 # iOS native code
└── .env.example         # Environment template
```

## 🔑 Required API Keys

### Firebase (Required)
1. Go to https://console.firebase.google.com
2. Create a new project
3. Enable Authentication > Email/Password
4. Enable Firestore Database
5. Download config files to your project

### OpenAI (Optional - for AI coach)
1. Get key at https://platform.openai.com/api-keys
2. Add to `.env` as `OPENAI_API_KEY`

### RapidAPI (Optional - for exercise database)
1. Sign up at https://rapidapi.com
2. Subscribe to ExerciseDB API
3. Add to `.env` as `RAPIDAPI_KEY`

## 🤝 Contributing

This is an open-source project built in public. Contributions welcome!

1. Fork the repo
2. Create a feature branch
3. Make your changes
4. Submit a pull request

**Note:** The codebase was built through rapid iteration. Some files are large and could use refactoring. PRs for code cleanup are especially welcome!

## 📝 Known Issues

- WorkoutScreen.tsx is 3,800+ lines (needs refactoring)
- No test coverage yet
- Some features may be incomplete
- Built primarily for Android (iOS may need tweaks)

## 📄 License

MIT

## 🙏 Credits

Built by [@KyleMayotte](https://github.com/KyleMayotte) with help from the dev community.

Vibecoded with Claude Code.
