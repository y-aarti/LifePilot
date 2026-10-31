# Life

A React Native Expo app for web, iOS, and Android. It includes email/password authentication, Health, Wealth, Career, and Personal areas, calendar-dated tasks, and Firestore task storage per signed-in user.

Requires Node.js 22.13 or newer, or Node.js 24.3 or newer. Run with `npm install` and `npm run start`.

## Firebase

Set the `EXPO_PUBLIC_FIREBASE_*` values in `.env.local`. Enable Email/Password under Firebase Authentication and create a Cloud Firestore database. The app stores tasks at `users/{uid}/tasks/{taskId}`. Publish the included security rules with `firebase deploy --only firestore:rules` (or add `firestore.rules` in the Firebase console).
