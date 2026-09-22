# REST API Specification & Reference

This document provides a comprehensive reference for all REST endpoints provided by the **Enterprise Multi-Tenant MCQ Portal** backend service.

---

## Base URL & Authentication

- **Base URL**: `http://localhost:5000/api`
- **Authentication**: Bearer Token in `Authorization` header:
  ```http
  Authorization: Bearer <jwt_token>
  ```
- **Tenant Context Header** *(optional for Super Admin, or for multi-tenant targeting)*:
  ```http
  x-organization-id: <organization_mongo_id>
  ```

---

## Standard Response Format

### Success Response
```json
{
  "success": true,
  "message": "Operation completed successfully",
  "data": {}
}
```

### Error Response
```json
{
  "success": false,
  "message": "Detailed error message",
  "error": "Error stack / code in development mode"
}
```

---

## 1. Authentication Endpoints (`/api/auth`)

### Register User
- **Method**: `POST`
- **Endpoint**: `/api/auth/register`
- **Access**: Public
- **Request Body**:
  ```json
  {
    "name": "Jane Doe",
    "email": "jane@example.com",
    "role": "student", // Public registration strictly creates "student". Teachers apply via /api/teacher-applications
    "phone": "9876543210", // Exactly 10 digits required
    "organizationId": "651a2b3c4d5e6f7a8b9c0d1e", // Optional organization affiliation
    "organizationSlug": "oxford-academy" // Optional slug alternative
  }
  ```
- **Response** `(201 Created)`:
  ```json
  {
    "success": true,
    "token": "eyJhbGciOi...",
    "user": {
      "id": "651a...",
      "name": "Jane Doe",
      "email": "jane@example.com",
      "role": "student",
      "organizationId": "651a..."
    }
  }
  ```

### Login User
- **Method**: `POST`
- **Endpoint**: `/api/auth/login`
- **Access**: Public
- **Request Body**:
  ```json
  {
    "email": "jane@example.com",
    "password": "SecurePassword123!"
  }
  ```
- **Response** `(200 OK)`:
  ```json
  {
    "success": true,
    "token": "eyJhbGciOi...",
    "user": {
      "id": "651a...",
      "name": "Jane Doe",
      "email": "jane@example.com",
      "role": "student",
      "organization": {
        "_id": "651a...",
        "name": "Oxford Academy",
        "slug": "oxford-academy"
      }
    }
  }
  ```

### Get Current Profile
- **Method**: `GET`
- **Endpoint**: `/api/auth/me`
- **Access**: Private (Authenticated user)
- **Response** `(200 OK)`: Returns current authenticated user record with populated organization details.

---

## 2. Organization Endpoints (`/api/organizations`)

### Create Organization
- **Method**: `POST`
- **Endpoint**: `/api/organizations`
- **Access**: Super Admin (`super_admin`)
- **Request Body**:
  ```json
  {
    "name": "Cambridge Institute",
    "email": "contact@cambridge.edu",
    "slug": "cambridge",
    "subscriptionPlan": "pro"
  }
  ```

### List All Organizations
- **Method**: `GET`
- **Endpoint**: `/api/organizations`
- **Access**: Super Admin (`super_admin`)

### Get Organization by ID / Slug
- **Method**: `GET`
- **Endpoint**: `/api/organizations/:id`
- **Access**: Super Admin or Organization Members

### Update Organization
- **Method**: `PUT`
- **Endpoint**: `/api/organizations/:id`
- **Access**: Super Admin or Organization Admin

---

## 3. User Management Endpoints (`/api/users`)

### List Enrolled Students
- **Method**: `GET`
- **Endpoint**: `/api/users/students`
- **Access**: Admin, Org Admin, Teacher, Super Admin

### List Organization Teachers
- **Method**: `GET`
- **Endpoint**: `/api/users/teachers`
- **Access**: Admin, Org Admin, Super Admin

### Create Organization Member
- **Method**: `POST`
- **Endpoint**: `/api/users`
- **Access**: Admin, Org Admin, Super Admin
- **Request Body**:
  ```json
  {
    "name": "Dr. Alan Turing",
    "email": "alan@cambridge.edu",
    "password": "TemporaryPassword123!",
    "role": "teacher"
  }
  ```

---

## 4. Assessment / Test Endpoints (`/api/tests`)

### List Tenant Tests
- **Method**: `GET`
- **Endpoint**: `/api/tests`
- **Access**: Admin, Org Admin, Teacher, Test Creator, Super Admin

### List Public Tests
- **Method**: `GET`
- **Endpoint**: `/api/tests/public`
- **Access**: Public (No authentication required)

### Get Test by ID
- **Method**: `GET`
- **Endpoint**: `/api/tests/:id`
- **Access**: Authenticated users

### Create Test
- **Method**: `POST`
- **Endpoint**: `/api/tests`
- **Access**: Admin, Org Admin, Teacher, Test Creator
- **Request Body**:
  ```json
  {
    "title": "Algorithms & Complexity Exam",
    "subject": "Computer Science",
    "duration": 45,
    "totalMarks": 100,
    "passingMarks": 40,
    "numberOfAttempts": 2,
    "type": "private", // "private" or "public"
    "instructions": "No external calculators allowed.",
    "status": "draft" // "draft" or "published"
  }
  ```

### Update Test
- **Method**: `PUT`
- **Endpoint**: `/api/tests/:id`
- **Access**: Admin, Org Admin, Teacher (Creator of test), Test Creator

### Publish / Unpublish Test
- **Method**: `PATCH`
- **Endpoint**: `/api/tests/:id/publish` or `/api/tests/:id/unpublish`
- **Access**: Admin, Org Admin, Teacher, Test Creator

### Delete Test
- **Method**: `DELETE`
- **Endpoint**: `/api/tests/:id`
- **Access**: Admin, Org Admin, Teacher, Test Creator

---

## 5. Question Endpoints (`/api/questions`)

### Get Questions for Test (Teacher / Admin View)
- **Method**: `GET`
- **Endpoint**: `/api/questions/test/:testId`
- **Access**: Admin, Org Admin, Teacher, Test Creator
- **Includes**: Correct answers, marks, negative marks, and explanations.

### Get Questions for Student Exam Mode (Sanitized)
- **Method**: `GET`
- **Endpoint**: `/api/questions/test/:testId/student`
- **Access**: Student, Authenticated User
- **Security Feature**: Strips `correctAnswer` and `explanation` from response objects to prevent answer leakage.

### Create Question
- **Method**: `POST`
- **Endpoint**: `/api/questions`
- **Access**: Admin, Org Admin, Teacher, Test Creator
- **Request Body**:
  ```json
  {
    "testId": "651a2b3c4d5e6f7a8b9c0d1e",
    "questionText": "What is the worst-case time complexity of QuickSort?",
    "options": [
      { "key": "A", "text": "O(N log N)" },
      { "key": "B", "text": "O(N^2)" },
      { "key": "C", "text": "O(log N)" },
      { "key": "D", "text": "O(N)" }
    ],
    "correctAnswer": "B",
    "marks": 2,
    "negativeMarks": 0.5,
    "explanation": "When the partition is unbalanced, QuickSort degrades to quadratic time complexity O(N^2)."
  }
  ```

### Update Question
- **Method**: `PUT`
- **Endpoint**: `/api/questions/:id`
- **Access**: Admin, Org Admin, Teacher, Test Creator

### Delete Question
- **Method**: `DELETE`
- **Endpoint**: `/api/questions/:id`
- **Access**: Admin, Org Admin, Teacher, Test Creator

---

## 6. Exam Attempt Endpoints (`/api/attempts`)

### Get Available Tests for Student
- **Method**: `GET`
- **Endpoint**: `/api/attempts/available-tests`
- **Access**: Student
- **Response**: List of published tests eligible for student attempt, with remaining allowed attempts calculation.

### Start Exam Attempt
- **Method**: `POST`
- **Endpoint**: `/api/attempts/start/:testId`
- **Access**: Student
- **Response**: Creates an active `Attempt` document with a recorded `startTime` and returns `attemptId`.

### Save Incremental Answer
- **Method**: `POST`
- **Endpoint**: `/api/attempts/save-answer/:attemptId`
- **Access**: Student
- **Request Body**:
  ```json
  {
    "questionId": "651a2b3c4d5e6f7a8b9c0d1e",
    "selectedAnswer": "B"
  }
  ```

### Submit & Finalize Attempt
- **Method**: `POST`
- **Endpoint**: `/api/attempts/submit/:attemptId`
- **Access**: Student
- **Behavior**: Marks attempt status as `submitted`, invokes server-side evaluation engine (`calculateResult.js`), generates a final `Result` record, and returns evaluated scorecard.

### Get Student's Own Attempts
- **Method**: `GET`
- **Endpoint**: `/api/attempts/my-attempts`
- **Access**: Student

---

## 7. Results & Scorecards (`/api/results`)

### Get Result by Attempt ID
- **Method**: `GET`
- **Endpoint**: `/api/results/:attemptId`
- **Access**: Attempt Author (Student) or Admin/Teacher/Super Admin
- **Response**: Comprehensive result breakdown with total marks, marks obtained, percentage, status (passed/failed), question-by-question response comparison, and explanations.

### Get Student's All Results
- **Method**: `GET`
- **Endpoint**: `/api/results/my-results`
- **Access**: Student

### Get Organization Results
- **Method**: `GET`
- **Endpoint**: `/api/results/organization`
- **Access**: Admin, Org Admin, Teacher, Super Admin

### Get Results for Specific Test
- **Method**: `GET`
- **Endpoint**: `/api/results/test/:testId`
- **Access**: Admin, Org Admin, Teacher, Test Creator, Super Admin

---

## 8. Analytics & Telemetry Reports (`/api/reports`)

### Institutional Report
- **Method**: `GET`
- **Endpoint**: `/api/reports/organization`
- **Access**: Admin, Org Admin, Teacher, Super Admin
- **Metrics**: Total Students, Teachers, Tests, Published Tests, Total Attempts, Pass Rate, Average Score, High/Low Scores, Subject Breakdown, Recent Submissions.

### Test Creator Report
- **Method**: `GET`
- **Endpoint**: `/api/reports/creator`
- **Access**: Test Creator, Super Admin
- **Metrics**: Authored Tests, Published Tests, Candidate Submissions, Pass/Fail Breakdown, Average Score, Recent Attempts.

### Global Platform Report
- **Method**: `GET`
- **Endpoint**: `/api/reports/platform`
- **Access**: Super Admin
- **Metrics**: Total Organizations, Active Organizations, Total Users, Total Tests, Total Attempts, Global Pass Rate, Global Average Score.

---

## 9. Subscriptions & Billing (`/api/subscriptions`)

### Get Current Tenant Subscription & Usage
- **Method**: `GET`
- **Endpoint**: `/api/subscriptions/current`
- **Access**: Admin, Org Admin, Super Admin
- **Response**: Active plan, price, quota limits, live usage counters (`testsUsed`, `studentsUsed`), and available upgrade tiers.

### Upgrade Subscription Tier
- **Method**: `POST`
- **Endpoint**: `/api/subscriptions/upgrade`
- **Access**: Admin, Org Admin, Super Admin
- **Request Body**:
  ```json
  {
    "plan": "pro" // "free", "basic", "pro", "enterprise"
  }
  ```

### List All Tenant Subscriptions
- **Method**: `GET`
- **Endpoint**: `/api/subscriptions`
- **Access**: Super Admin
