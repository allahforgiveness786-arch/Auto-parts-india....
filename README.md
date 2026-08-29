# Auto Parts India - React Native Marketplace App

Auto Parts India is a full-featured, production-ready React Native marketplace mobile application for buying and selling automobile parts, scrap vehicles, and accessories in India.

---

## 📁 Clean Project Structure

```
├── react-native-app/              # 📱 Complete React Native Native Mobile App
│   ├── android/                   # Native Android Project & Gradle Build
│   │   ├── app/
│   │   │   ├── google-services.json # Firebase Configuration
│   │   │   └── build.gradle
│   ├── src/                       # Application Source Code
│   │   ├── screens/               # Screens (Home, Search, SellPart, Auth, Chat, Profile, etc.)
│   │   ├── navigation/            # React Navigation Setup (Stack, BottomTabs)
│   │   ├── services/              # Firebase, Cloudinary, Google Auth Services
│   │   ├── context/               # Global State & Auth Context
│   │   ├── components/            # Reusable UI Components
│   │   └── types.ts               # TypeScript Interfaces
│   ├── package.json               # React Native Dependencies
│   └── App.tsx                    # Root Mobile Component
├── firestore.rules                # Production Firebase Security Rules
└── package.json                   # Root Workspace Config
```

---

## 🚀 Running the React Native Mobile App

### 1. Install Dependencies
```bash
cd react-native-app
npm install
```

### 2. Run Android on Emulator / Device
```bash
npx react-native run-android
```

### 3. Build Release Android APK
```bash
cd react-native-app/android
./gradlew assembleRelease
```
The generated APK will be available at:
`react-native-app/android/app/build/outputs/apk/release/app-release.apk`

---

## 🔑 Firebase & Google Services Setup
1. Place your `google-services.json` inside `react-native-app/android/app/google-services.json`.
2. Add your **SHA-1** & **SHA-256** Fingerprint in the [Firebase Console](https://console.firebase.google.com/) under Project Settings.
3. Enable **Email/Password** and **Google Sign-In** in Firebase Authentication.
4. Deploy `firestore.rules` to Firestore Database.
