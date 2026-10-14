# 📬 Firebase Mailing System Guide for AssessIQ

This guide documents the architecture, configuration, and verification of the **Google Firebase Mailing System** integrated into the AssessIQ Multi-Tenant Examination Platform.

---

## 🌟 1. System Architecture

The AssessIQ platform uses a high-reliability dual-pipeline mailing engine:

```
                               ┌────────────────────────────────────────────────────────┐
                               │                 User Recovery / Mailing Actions        │
                               └───────────────────────────┬────────────────────────────┘
                                                           │
                             ┌─────────────────────────────┴────────────────────────────┐
                             ▼                                                          ▼
             ┌───────────────────────────────┐                          ┌───────────────────────────────┐
             │    Pipeline A: Google Firebase│                          │    Pipeline B: Cloud SMTP     │
             │   Authentication Mailing      │                          │    & HTTP Mail API Fallback   │
             ├───────────────────────────────┤                          ├───────────────────────────────┤
             │ • Client SDK: firebase/auth   │                          │ • Brevo HTTP API (Port 443)   │
             │ • Backend: Identity Toolkit   │                          │ • Resend HTTP API (Port 443)  │
             │ • Instant Google Mail Servers │                          │ • Nodemailer Gmail / SMTP     │
             │ • Bypasses port blocks        │                          │ • Full HTML custom scorecards │
             └───────────────────────────────┘                          └───────────────────────────────┘
```

### Key Advantages of Firebase Mailing:
1. **Zero Cloud Port Blocking**: Google Firebase Identity APIs operate over standard HTTPS (Port 443), eliminating connection timeouts on cloud platforms (e.g., Render, Railway, Vercel, Firebase Hosting) where outbound SMTP ports (465/587) are frequently blocked.
2. **Built-in Deliverability**: Emails originate directly from Google's authenticated mail servers with valid SPF/DKIM records.
3. **Cryptographically Secure Action Links**: Firebase generates time-limited, tamper-proof single-use password reset tokens automatically.

---

## ⚙️ 2. Configuration & Credentials

The system is configured in your project environment files:

### Frontend (`frontend/.env`):
```env
VITE_API_URL=http://localhost:5000/api
VITE_FIREBASE_API_KEY=AIzaSyALVNRcFpnJY1YEX1koeqfVATD26LS9YZY
VITE_FIREBASE_AUTH_DOMAIN=assess-iq.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=assess-iq
VITE_FIREBASE_STORAGE_BUCKET=assess-iq.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=1076773052536
VITE_FIREBASE_APP_ID=1:1076773052536:web:79652d4560123e9bed4d8d
```

### Backend (`backend/.env`):
```env
FIREBASE_API_KEY=AIzaSyALVNRcFpnJY1YEX1koeqfVATD26LS9YZY
FIREBASE_PROJECT_ID=assess-iq
FIREBASE_AUTH_DOMAIN=assess-iq.firebaseapp.com
EMAIL_USER=kambagownikmalleswari@gmail.com
```

---

## 🧪 3. Verified Diagnostic Tests

The Firebase mailing system has been executed and verified:

```bash
# Run backend Firebase Mailing diagnostic:
npm run test:firebase-mail
```

**Live Verification Output:**
```
=================================================
🔥 AssessIQ Firebase Mailing System - Diagnostic Test
=================================================
1. Checking Firebase Configuration:
   - Provider: Firebase Identity Platform (Google Cloud)
   - Project ID: assess-iq
   - Auth Domain: assess-iq.firebaseapp.com
   - API Key Status: AIzaSyAL...9YZY
   - Configured: ✅ YES

2. Testing Firebase Email Dispatch to: kambagownikmalleswari@gmail.com
[Firebase Mail Sent] Password Reset to: kambagownikmalleswari@gmail.com (1096ms)
3. Test Result:
   - Status: ✅ SUCCESS
   - Time Elapsed: 1112ms
   - Target Email: kambagownikmalleswari@gmail.com
   - Delivery Details: {
  "success": true,
  "emailSent": true,
  "email": "kambagownikmalleswari@gmail.com",
  "provider": "firebase",
  "durationMs": 1096,
  "message": "Firebase password reset link successfully sent to kambagownikmalleswari@gmail.com.",
  "details": {
    "kind": "identitytoolkit#GetOobConfirmationCodeResponse",
    "email": "kambagownikmalleswari@gmail.com"
  }
}

🎉 TEST PASSED: Firebase successfully dispatched email through Google infrastructure!
```

---

## 🖥️ 4. In-App User & Administrator Access

### A. Universal Sign-In Recovery (`/login`):
1. Navigate to `http://localhost:5173/login`.
2. Click **"Forgot password?"** under the password field.
3. Enter your account email (e.g., `kambagownikmalleswari@gmail.com`).
4. Click **"🔥 Send Firebase Password Reset Link (Instant)"** to receive an official Google Firebase recovery email.
5. Alternatively, click **"🔥 Test Firebase Mailing"** at the bottom of the modal to open the live diagnostic modal.

### B. Super Admin Dashboard (`/superadmin/dashboard`):
- Click the **"🔥 Test Mailing System"** button located in the dashboard header actions.
- The interactive **Firebase Mailing Diagnostic Modal** will open, allowing you to:
  - Inspect Firebase project status (`assess-iq`, API status).
  - Switch between **🔥 Firebase Mail** and **✉️ SMTP / System Mail** tabs.
  - Dispatch a live test to any recipient email and inspect real-time latency (`⚡ ~1000ms`) and JSON payloads.

### C. User Profile & Security Settings (`/profile?tab=security`):
- Any authenticated user (Student, Teacher, Admin, Super Admin) can open **Profile → Security**.
- Click **"🔥 Send Firebase Password Reset Link"** to send an instant password reset email to their verified profile address.
- Click **"🔥 Open Firebase Mailing Diagnostic & Tester"** to test live mail dispatch.

---

## 🛠️ 5. Customizing Firebase Email Templates in Console

To customize the email subject line, sender name, or branding:

1. Open the [Firebase Console](https://console.firebase.google.com/).
2. Select your project: **`assess-iq`**.
3. In the left navigation, click **Build** > **Authentication**.
4. Click on the **Templates** tab at the top.
5. Select **Password reset** or **Email address verification**:
   - **Sender name**: Change to `AssessIQ Platform` or your institution name.
   - **Reply-to**: Set your support email (`kambagownikmalleswari@gmail.com`).
   - **Subject**: E.g. `Reset your password for AssessIQ Examination Portal`.
   - **Message body**: Customize the greeting and link text.
6. Click **Save**.

### (Optional) Custom SMTP in Firebase Console:
If you want Firebase to send emails from your own domain (e.g. `no-reply@assess-iq.com`) instead of `noreply@assess-iq.firebaseapp.com`:
1. In the **Templates** tab, click the **gear icon (Settings)** next to "SMTP settings".
2. Toggle **Enable custom SMTP**.
3. Provide your SMTP host, port, username, and password.
4. Firebase will route all auth emails through your SMTP server while managing links and tokens automatically.

---

## 📑 6. Backend API Reference

| Endpoint | Method | Description |
| :--- | :---: | :--- |
| `/api/auth/firebase-status` | `GET` | Returns current Firebase project configuration status and health |
| `/api/auth/firebase-test-email` | `ALL` | Dispatches a live test email via Firebase Identity Toolkit |
| `/api/auth/firebase-password-reset` | `POST` | Dispatches a password reset link to `{ email }` via Firebase |
| `/api/auth/test-email` | `ALL` | Diagnostic endpoint for testing SMTP / standard mailer |

---

## ✅ Summary of Verification
- **Google Firebase Auth API**: Successfully validated & operational.
- **Backend Service**: [`backend/services/firebaseMailService.js`](file:///c:/Users/hp/OneDrive/Desktop/Online%20Test/multi-tenant-mcq-portal/backend/services/firebaseMailService.js) created and verified.
- **Frontend Service**: [`frontend/src/services/firebaseMailService.js`](file:///c:/Users/hp/OneDrive/Desktop/Online%20Test/multi-tenant-mcq-portal/frontend/src/services/firebaseMailService.js) created and bundled.
- **Diagnostic Modal**: [`frontend/src/components/common/FirebaseMailTesterModal.jsx`](file:///c:/Users/hp/OneDrive/Desktop/Online%20Test/multi-tenant-mcq-portal/frontend/src/components/common/FirebaseMailTesterModal.jsx) integrated in Login, SuperAdmin Dashboard, and Profile.
- **Automated Test**: `npm run test:firebase-mail` passed with status 200 / duration 1096ms.
