# AutoPartsIndia — Full-Stack & React Native Automotive Spare Parts Marketplace

AutoPartsIndia is a premium, fully featured automotive spare parts marketplace designed for the Indian market. The project features a unified architecture: a full-stack Web Application (React, Vite, Express, Tailwind CSS, Gemini AI) alongside a native React Native Mobile Application sharing a real-time Firestore database schema.

---

## 🚀 Key Features

- **Smart AI Listing Auto-Fill**: Integrates Gemini API (`gemini-3.7-flash` via `@google/genai`) to automatically recognize car spare parts from uploaded photos. It instantly predicts the Title, Brand, Model, Category, Price, and seller description customized for the Indian automotive market.
- **Secure Image Management**: Features a secure backend proxy to upload, compress client-side, and dynamically delete images using Cloudinary.
- **Real-Time Data Sync & Hybrid Storage**: Syncs listings, chats, and ratings in real-time using Firebase Firestore. Includes custom local storage fallbacks so the app remains fully functional in offline environments.
- **Dual Platforms**:
  - **Full-Stack Web**: Fully responsive, high-contrast light theme built with React 19, Tailwind CSS, and Framer Motion.
  - **Mobile App**: Production-ready React Native app using React Navigation, React Native Paper, and Namespaced Firebase SDKs.

---

## 🛠️ Project Structure

```
├── dist/                          # Compiled web assets
├── public/                        # Static assets (icons, brand logos)
├── src/                           # Web application source files
│   ├── components/                # Modular UI components & screens
│   ├── data/                      # Indian states, districts & mock data
│   ├── lib/                       # Firebase configuration and state contexts
│   └── utils/                     # Utility services (compression, permissions)
├── react-native-app/              # React Native mobile codebase
│   ├── src/                       # Mobile screens, navigation & services
│   ├── android/                   # Native Android wrapper project
│   └── package.json               # Native application dependency manifest
├── server.ts                      # Custom Express API Gateway & Vite dev proxy
└── package.json                   # Root configuration & build scripts
```

---

## ⚙️ Prerequisites & Setup

### Environment Variables
Create a `.env` file in the root directory:
```env
PORT=3000
GEMINI_API_KEY=your_gemini_api_key
CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_API_SECRET=your_cloudinary_api_secret
```

### Installation

1. Install root full-stack dependencies:
   ```bash
   npm install
   ```
2. Install mobile dependencies:
   ```bash
   cd react-native-app
   npm install --legacy-peer-deps
   ```

---

## 🖥️ Commands

### Web Dashboard (Development & Production)
- **Run Dev Server**: `npm run dev` (starts Express server on port 3000 with Vite proxy middleware)
- **Build Web & Server**: `npm run build` (builds client assets and compiles `server.ts` to highly optimized CJS via `esbuild`)
- **Start Production Server**: `npm run start`

### Mobile Application
- **Type Check**: `cd react-native-app && npm x -- tsc --noEmit`
- **Run Android Emulator**: `cd react-native-app && npm run android`
- **Build Unsigned Release APK**: `cd react-native-app && npm run build:apk`

---

## 🌟 Quality Standards Achieved

- **Type Safety**: Both the React/Vite front-end and the React Native mobile app are fully written in TypeScript and type check cleanly with zero errors.
- **Optimized UI**: Adheres to modern design principles with responsive grids, micro-interactions powered by Framer Motion, and consistent, accessible color contrasts.
- **Robust Sync**: Utilizes automatic fallback mechanisms that seamlessly bridge Cloud Firestore and client LocalStorage.
