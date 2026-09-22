# Firebase Google Authentication Setup Guide for AssessIQ

This guide walks you through setting up Firebase Authentication with Google Sign-In so that clicking **"Continue with Student Google ID"** automatically opens the Google account chooser displaying all accounts logged in to your device.

---

## 1. Create a Firebase Project
1. Navigate to the [Firebase Console](https://console.firebase.google.com/).
2. Click **Add project** (or **Create a project**).
3. Enter a project name (e.g., `AssessIQ-Portal` or `Online-Test-MCQ`).
4. (Optional) Disable Google Analytics if not needed, then click **Create Project**.

---

## 2. Enable Google Sign-In Provider
1. In the left sidebar of your Firebase Project, click on **Build** > **Authentication**.
2. Click **Get Started**.
3. Under the **Sign-in method** tab, click on **Google**.
4. Toggle the switch to **Enable**.
5. Set your **Project public-facing name** (e.g. `AssessIQ`).
6. Select your **Project support email** (`kambagownikmalleswari@gmail.com`).
7. Click **Save**.

---

## 3. Register a Web Application
1. In the Project Overview page or Project Settings (gear icon in the top left), click the **Web icon (`</>`)** to add an app.
2. Enter an app nickname (e.g., `AssessIQ Web Portal`).
3. Click **Register app**.
4. You will see a `firebaseConfig` object with keys like:
   - `apiKey`
   - `authDomain`
   - `projectId`
   - `storageBucket`
   - `messagingSenderId`
   - `appId`

---

## 4. Add Authorized Domains
1. In Firebase Console, go back to **Authentication** > **Settings** > **Authorized domains**.
2. Ensure `localhost` is listed (it is added by default).
3. If you deploy your app to production, click **Add domain** and enter your production domain (e.g. `yourdomain.com`).

---

## 5. Configure Your Frontend `.env` File
In your project directory, open or create `frontend/.env` and paste your keys:

```env
VITE_API_URL=http://localhost:5000/api

# Firebase Web App Credentials
VITE_FIREBASE_API_KEY=AIzaSyYourActualApiKeyHere
VITE_FIREBASE_AUTH_DOMAIN=your-project-id.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-project-id.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789012
VITE_FIREBASE_APP_ID=1:123456789012:web:abcdef123456
```

---

## 6. How It Works
- When a user clicks **"Continue with Student Google ID"**, Firebase executes `signInWithPopup(auth, googleProvider)`.
- Because we have configured `prompt: 'select_account'`, Google will always present a modal dialog with all active Google accounts on the user's browser, allowing them to pick any account or click "Use another account".
- Once selected, Firebase retrieves the verified account profile, and our frontend submits it to `POST /api/auth/google`, creating or signing into their student account seamlessly.
