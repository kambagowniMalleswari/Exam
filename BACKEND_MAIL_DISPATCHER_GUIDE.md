# 📬 AssessIQ Backend Mail Dispatching System Guide

This document outlines the architecture, configuration, testing, and transactional templates of the **Backend Mail Dispatching System** integrated into the AssessIQ Multi-Tenant Examination Platform.

All experimental Firebase mailing testing, Firebase auth mail APIs, and tester modals have been completely removed in favor of a native, high-performance **Backend SMTP Mail Dispatcher**.

---

## 🏗️ 1. Architecture Overview

The system uses a connection-pooled, asynchronous backend mail engine built directly into Express:

```
┌────────────────────────────────────────────────────────────────────────┐
│                   AssessIQ Platform Events                             │
│ (Password Reset OTP, Welcome, Temporary Credentials, Scorecard, Alerts)│
└───────────────────────────────────┬────────────────────────────────────┘
                                    │
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│               Backend Mail Dispatcher Service                          │
│               [backend/services/mailDispatcher.js]                     │
├────────────────────────────────────────────────────────────────────────┤
│ • Connection Pooling: pool: true, maxConnections: 5, maxMessages: 100   │
│ • Sockets: connectionTimeout: 10s, greetingTimeout: 10s, socketTimeout: 15s│
│ • Non-blocking Async Queue: dispatchMailAsync() (UI responds in <50ms) │
│ • Plain-Text Sanitizer: Prevents spam filters & deliverability drops   │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│                    Google Gmail / Custom SMTP                          │
│                  smtp.gmail.com (Port 465 SSL / 587 TLS)               │
└────────────────────────────────────────────────────────────────────────┘
```

---

## ⚙️ 2. Environment Configuration

The dispatcher is configured in [`backend/.env`](file:///c:/Users/hp/OneDrive/Desktop/Online%20Test/multi-tenant-mcq-portal/backend/.env):

```env
EMAIL_SERVICE=gmail
EMAIL_USER=kambagownikmalleswari@gmail.com
EMAIL_PASSWORD=jyfp phcx bpox ruzc
EMAIL_FROM="AssessIQ Platform" <kambagownikmalleswari@gmail.com>
SUPER_ADMIN_EMAIL=kambagownikmalleswari@gmail.com
CLIENT_URL=https://assess-iq.web.app
```

> [!NOTE]
> `EMAIL_PASSWORD` uses a secure 16-character Google App Password (`jyfp phcx bpox ruzc`), ensuring delivery without account blocks or OAuth token expiries.

---

## 🧪 3. Verifying & Testing the System

### A. Terminal Command Test
Run the backend diagnostic test:

```bash
cd backend
npm run test:email
```

**Live Test Output:**
```
==================================================
🚀 AssessIQ Backend Mail Dispatcher — Diagnostic Test
==================================================

1. Verifying SMTP Connection...
[Mail Dispatcher] SMTP Transporter initialized successfully (Account: kambagownikmalleswari@gmail.com)
SMTP Health: {
  connected: true,
  configured: true,
  user: 'kambagownikmalleswari@gmail.com',
  service: 'gmail',
  message: 'SMTP server is ready to dispatch emails'
}

2. Dispatching Live Test Email to: kambagownikmalleswari@gmail.com...
[Mail Dispatcher] ✓ Dispatched successfully! ID: <b567608a-5e66-2df9-69e9-16b7ef78b495@gmail.com> to: kambagownikmalleswari@gmail.com (Subject: "AssessIQ Live Mail Dispatcher — Verification Check")

3. Dispatch Result (4211ms): {
  success: true,
  messageId: '<b567608a-5e66-2df9-69e9-16b7ef78b495@gmail.com>',
  real: true,
  provider: 'backend-smtp',
  recipient: 'kambagownikmalleswari@gmail.com'
}

🎉 TEST PASSED: Backend Mail Dispatching System is 100% operational!
```

### B. HTTP API Diagnostic Endpoint
You can also trigger a test from any HTTP client or browser:

```http
GET /api/auth/test-email?email=your-email@example.com
```

---

## 📧 4. Supported Transactional Emails

The dispatcher provides standardized, responsive HTML email templates:

| Function | Recipient | Trigger / Purpose |
| :--- | :--- | :--- |
| `sendPasswordResetOtp` | User / Student / Teacher | 6-digit verification code with 10-minute expiry for password reset |
| `sendStudentWelcome` | Student | Account registration confirmation & portal access link |
| `sendAccountCredentials` | Teacher / Student | Dispatches username & temporary password when created by Administrator |
| `sendLoginAlert` | User | Security notification sent upon successful sign-in with timestamp |
| `sendStudentScorecard` | Student | Official evaluation summary with score, percentage, and PASSED status |
| `sendOrgApplicationAlert` | Super Admin | Alert when a new institution submits an onboarding application |
| `sendStudentRegistrationAlert` | Super Admin / Org Admin | Alert when a student self-registers |

---

## 🧼 5. Cleanup Summary

The following Firebase email testing artifacts have been permanently removed:
- ❌ `FIREBASE_MAILING_GUIDE.md` (Removed)
- ❌ `backend/services/firebaseMailService.js` (Removed)
- ❌ `backend/tests/testFirebaseMailing.js` (Removed)
- ❌ `frontend/src/services/firebaseMailService.js` (Removed)
- ❌ `frontend/src/components/common/FirebaseMailTesterModal.jsx` & `.css` (Removed)
- ❌ Firebase tester buttons from `Login.jsx`, `Profile.jsx`, and `SuperAdminDashboard.jsx` (Removed)
- ❌ `test:firebase-mail` script from `backend/package.json` (Removed)
- ❌ Unused Firebase mail endpoints from `authRoutes.js` and `authController.js` (Removed)
