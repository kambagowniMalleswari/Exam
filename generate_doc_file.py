import os

def generate_doc_file():
    html_content = """<html xmlns:o='urn:schemas-microsoft-com:office:office' 
xmlns:w='urn:schemas-microsoft-com:office:word' 
xmlns='http://www.w3.org/TR/REC-html40'>
<head>
<meta charset="utf-8">
<title>AssessIQ - Complete Project Documentation</title>
<!--[if gte mso 9]>
<xml>
 <w:WordDocument>
  <w:View>Print</w:View>
  <w:Zoom>100</w:Zoom>
  <w:DoNotOptimizeForBrowser/>
 </w:WordDocument>
</xml>
<![endif]-->
<style>
body {
    font-family: 'Segoe UI', Arial, sans-serif;
    line-height: 1.6;
    color: #1e293b;
    margin: 40px;
    background-color: #ffffff;
}
h1 {
    color: #4f46e5;
    font-size: 24pt;
    border-bottom: 2px solid #e0e7ff;
    padding-bottom: 8px;
    margin-top: 28px;
    margin-bottom: 14px;
}
h2 {
    color: #0f172a;
    font-size: 16pt;
    margin-top: 20px;
    margin-bottom: 8px;
}
h3 {
    color: #4f46e5;
    font-size: 13pt;
    margin-top: 14px;
    margin-bottom: 6px;
}
p, li {
    font-size: 11pt;
    color: #334155;
}
.header-box {
    text-align: center;
    background: #f8fafc;
    border: 1px solid #e2e8f0;
    border-radius: 8px;
    padding: 24px;
    margin-bottom: 30px;
}
.header-title {
    font-size: 26pt;
    font-weight: bold;
    color: #4f46e5;
    margin-bottom: 6px;
}
.header-sub {
    font-size: 13pt;
    font-weight: bold;
    color: #0f172a;
    margin-bottom: 6px;
}
.header-meta {
    font-size: 10pt;
    color: #64748b;
    font-style: italic;
}
.callout {
    background-color: #eef2ff;
    border-left: 5px solid #4f46e5;
    padding: 16px 20px;
    border-radius: 4px;
    margin: 16px 0;
}
.callout-title {
    font-weight: bold;
    font-size: 12pt;
    color: #4f46e5;
    margin-bottom: 8px;
}
table {
    width: 100%;
    border-collapse: collapse;
    margin: 18px 0;
    font-size: 10.5pt;
}
th {
    background-color: #1e293b;
    color: #ffffff;
    font-weight: bold;
    padding: 10px 12px;
    border: 1px solid #0f172a;
    text-align: left;
}
td {
    padding: 9px 12px;
    border: 1px solid #cbd5e1;
    vertical-align: top;
}
tr:nth-child(even) {
    background-color: #f8fafc;
}
.badge {
    display: inline-block;
    padding: 3px 8px;
    font-size: 9pt;
    font-weight: bold;
    border-radius: 4px;
    background-color: #e0e7ff;
    color: #4338ca;
}
.badge-green {
    background-color: #d1fae5;
    color: #065f46;
}
ul, ol {
    padding-left: 24px;
}
li {
    margin-bottom: 6px;
}
</style>
</head>
<body>

<div class="header-box">
    <div class="header-title">AssessIQ: Multi-Tenant Online MCQ Portal</div>
    <div class="header-sub">Complete Architecture, Technologies, 11 Database Models & Role-by-Role Workflow Guide</div>
    <div class="header-meta">Prepared for Project Understanding, Presentations & Technical Reference</div>
</div>

<h1>1. Project Summary (In Simple Words)</h1>
<p>
    <strong>AssessIQ</strong> is an enterprise-grade, multi-tenant online examination web application designed to help schools, colleges, universities, and training academies conduct <strong>Multiple Choice Question (MCQ)</strong> examinations securely over the internet.
</p>
<p>
    Think of AssessIQ like <strong>Google Classroom combined with a computerized testing hall</strong> for hundreds of institutions simultaneously:
</p>
<ul>
    <li>Instead of printing thousands of sheets of paper and spending days marking answers by hand, professors and administrators set up tests online.</li>
    <li>Students log in from any computer, tablet, or phone, view their scheduled tests, and answer questions within a strict countdown timer.</li>
    <li>The moment a student finishes, the system automatically grades their exam in less than a second, displays their marks, reveals correct answers with full explanations, and prepares analytical reports for faculty.</li>
    <li>Multiple colleges can use the platform at the same time, but each college operates in its own private, isolated workspace where students and questions cannot be seen by other colleges.</li>
</ul>

<div class="callout">
    <div class="callout-title">Key Core Pillars of the Platform:</div>
    <ul>
        <li><strong>Multi-Tenant Data Isolation:</strong> Every college's data is strictly partitioned using unique organization IDs.</li>
        <li><strong>4 Clear User Roles:</strong> Super Admin (Platform Owner), Org Admin (College Principal), Teacher (Test Creator), and Student (Test Taker).</li>
        <li><strong>Automated Instant Grading:</strong> Mathematically accurate server-side scoring with support for negative marking penalty.</li>
        <li><strong>Anti-Cheating Timer:</strong> Server-synchronized countdown clock with automatic submission upon timeout.</li>
        <li><strong>Bulk Excel Import:</strong> Effortlessly onboard hundreds of students and map them to batches with 1-click Excel rosters.</li>
    </ul>
</div>

<h1>2. Technology Stack (Frontend, Backend & Database)</h1>
<p>AssessIQ is built using the robust <strong>MERN</strong> technology stack (MongoDB, Express.js, React, Node.js) paired with modern security and utility libraries.</p>

<h2>A. Frontend Technologies (User Interface)</h2>
<table>
    <tr>
        <th>Technology</th>
        <th>Version / Tool</th>
        <th>Role & Purpose in AssessIQ</th>
    </tr>
    <tr>
        <td><strong>React</strong></td>
        <td>v19.2.8</td>
        <td>Powers the dynamic single-page application (SPA), reusable interface components, state management, and smooth interactive screens.</td>
    </tr>
    <tr>
        <td><strong>Vite</strong></td>
        <td>v8.2.2</td>
        <td>Next-generation build tool that provides instant hot module reloading (HMR) and optimized production bundles.</td>
    </tr>
    <tr>
        <td><strong>React Router DOM</strong></td>
        <td>v7.18.3</td>
        <td>Manages client-side routing, page navigation, and role-based route guards protecting student, teacher, and admin areas.</td>
    </tr>
    <tr>
        <td><strong>Axios</strong></td>
        <td>v1.20.0</td>
        <td>Handles asynchronous HTTP API requests with interceptors for attaching JWT authentication headers automatically.</td>
    </tr>
    <tr>
        <td><strong>Firebase SDK</strong></td>
        <td>v12.19.0</td>
        <td>Provides one-click Google OAuth 2.0 social login integration for quick, passwordless student access.</td>
    </tr>
    <tr>
        <td><strong>SheetJS (XLSX)</strong></td>
        <td>v0.18.5</td>
        <td>Enables client-side previewing of Excel rosters and instant 1-click export of exam gradebooks to Excel (.xlsx).</td>
    </tr>
    <tr>
        <td><strong>Vanilla CSS</strong></td>
        <td>Custom Design System</td>
        <td>Tailored design system with modern glassmorphism, responsive grid layouts, card hover effects, and accessible color schemes.</td>
    </tr>
</table>

<h2>B. Backend Technologies (Server & Logic)</h2>
<table>
    <tr>
        <th>Technology</th>
        <th>Version / Tool</th>
        <th>Role & Purpose in AssessIQ</th>
    </tr>
    <tr>
        <td><strong>Node.js</strong></td>
        <td>v20+ Runtime</td>
        <td>Asynchronous, event-driven JavaScript engine running backend server processes with high concurrent connection throughput.</td>
    </tr>
    <tr>
        <td><strong>Express.js</strong></td>
        <td>v5.2.1</td>
        <td>Clean REST API framework organizing modular controllers, routes, parameter validators, and error-handling middlewares.</td>
    </tr>
    <tr>
        <td><strong>JSON Web Token (JWT)</strong></td>
        <td>v9.0.3</td>
        <td>Generates and verifies tamper-proof cryptographic tokens storing user ID, role, and organization ID for stateless sessions.</td>
    </tr>
    <tr>
        <td><strong>Bcrypt.js</strong></td>
        <td>v3.0.3</td>
        <td>Applies one-way cryptographic hashing with random salt rounds to secure passwords against data breaches.</td>
    </tr>
    <tr>
        <td><strong>Nodemailer</strong></td>
        <td>v10.0.10</td>
        <td>Automated email service that sends college approvals, teacher invitation credentials, and password reset OTP emails.</td>
    </tr>
    <tr>
        <td><strong>SheetJS (xlsx)</strong></td>
        <td>v0.18.5</td>
        <td>Parses uploaded student Excel files on the server, matches registration numbers, and performs automated batch allocation.</td>
    </tr>
    <tr>
        <td><strong>Compression & CORS</strong></td>
        <td>v1.8.2 / v2.8.6</td>
        <td>Enables Gzip compression for faster API payload transfers and manages secure Cross-Origin Resource Sharing.</td>
    </tr>
</table>

<h2>C. Database Technologies (Storage & Data Modeling)</h2>
<table>
    <tr>
        <th>Technology</th>
        <th>Version / Tool</th>
        <th>Role & Purpose in AssessIQ</th>
    </tr>
    <tr>
        <td><strong>MongoDB</strong></td>
        <td>v6+ / Atlas Cloud</td>
        <td>Scalable document-oriented NoSQL database storing tests, questions, users, attempts, and results as JSON-like documents.</td>
    </tr>
    <tr>
        <td><strong>Mongoose ODM</strong></td>
        <td>v9.9.5</td>
        <td>Object Data Modeling library providing strict data schemas, field types, validation rules, relationship population, and hooks.</td>
    </tr>
    <tr>
        <td><strong>Multi-Tenant Indexing</strong></td>
        <td>Compound Indexes</td>
        <td>Compound indexes on { organizationId: 1, role: 1 } and { organizationId: 1, batchId: 1 } ensure fast, isolated database queries.</td>
    </tr>
</table>

<h1>3. Database Models (Total: 11 Models Explained)</h1>
<p>AssessIQ uses exactly <strong>11 Mongoose database models</strong>. Each model stores a specific piece of the educational workflow:</p>

<table>
    <tr>
        <th>#</th>
        <th>Model Name</th>
        <th>What It Stores in Simple Words</th>
        <th>Key Attributes / Fields</th>
    </tr>
    <tr>
        <td>1</td>
        <td><strong>User</strong></td>
        <td>All user accounts (Super Admin, Org Admin, Teacher, Student)</td>
        <td>name, email, password, role, organizationId, batchId, batchIds, studentId, registrationNumber, department, lastLogin.</td>
    </tr>
    <tr>
        <td>2</td>
        <td><strong>Organization</strong></td>
        <td>Educational institutions (Colleges, Schools, Coaching Centers)</td>
        <td>name, slug (subdomain), email, phone, logo, subscriptionPlan, isActive, status.</td>
    </tr>
    <tr>
        <td>3</td>
        <td><strong>OrgApplication</strong></td>
        <td>Public join requests from colleges wanting to use the portal</td>
        <td>name, type (College/School/Corporate), adminName, email, phone, expectedStudents, notes, status (pending/approved/rejected).</td>
    </tr>
    <tr>
        <td>4</td>
        <td><strong>TeacherApplication</strong></td>
        <td>Teachers requesting to join a specific college</td>
        <td>name, email, phone, organizationId, subject, qualification, experienceYears, certifications, status.</td>
    </tr>
    <tr>
        <td>5</td>
        <td><strong>Test</strong></td>
        <td>Exam blueprints and assessment guidelines</td>
        <td>title, subject, duration (minutes), totalMarks, passingPercentage, numberOfAttempts, type (private/public), instructions, status (draft/published).</td>
    </tr>
    <tr>
        <td>6</td>
        <td><strong>Question</strong></td>
        <td>Multiple choice questions with 4 options and answers</td>
        <td>testId, organizationId, questionText, options (A, B, C, D), correctAnswer, marks, negativeMarks, explanation.</td>
    </tr>
    <tr>
        <td>7</td>
        <td><strong>Attempt</strong></td>
        <td>Active or completed student exam sessions</td>
        <td>testId, studentId, organizationId, attemptNumber, status (started/in_progress/submitted), answers array, startTime, endTime, timeTaken.</td>
    </tr>
    <tr>
        <td>8</td>
        <td><strong>Result</strong></td>
        <td>Final scored marksheets with detailed answer breakdown</td>
        <td>attemptId, testId, studentId, totalQuestions, attempted, correct, wrong, unanswered, score, percentage, passed, breakdown array.</td>
    </tr>
    <tr>
        <td>9</td>
        <td><strong>Batch</strong></td>
        <td>Student cohorts, classes, or sections</td>
        <td>name (e.g. CSE-2024-A), batchNumber, organizationId, createdBy, department, maxStudents, enrollmentType (open/selective), tests.</td>
    </tr>
    <tr>
        <td>10</td>
        <td><strong>BatchAllocationAudit</strong></td>
        <td>Audit log of bulk Excel student roster uploads</td>
        <td>organizationId, uploadedBy, fileName, summary (totalRecords, matchedCount, allocatedCount, unmatchedCount), status.</td>
    </tr>
    <tr>
        <td>11</td>
        <td><strong>Subscription</strong></td>
        <td>Tenant pricing plans and operational resource caps</td>
        <td>organizationId, plan (free/basic/pro/enterprise), status, maxTests, maxStudents, price, features, startDate, endDate.</td>
    </tr>
</table>

<h1>4. Step-by-Step Guide for All 4 Roles & Dashboards</h1>

<h2>4.1 Super Admin Dashboard (Platform Owner)</h2>
<p><strong>Goal:</strong> Manage all registered institutions, approve new college onboarding requests, and monitor overall platform growth.</p>
<ol>
    <li><strong>Login:</strong> Access <code>/admin-login</code> and authenticate using Super Admin master credentials.</li>
    <li><strong>System Analytics:</strong> View the live dashboard showing total organizations, active teachers, registered students, tests taken, and server metrics.</li>
    <li><strong>Approve/Reject Colleges:</strong> Go to "Org Requests" to review applications submitted by institutions. Inspect the college name, admin contact, and student capacity. Clicking <strong>Approve</strong> instantly creates the Organization in the database, generates the Org Admin account, and dispatches a welcome email with login details.</li>
    <li><strong>Manage Organizations:</strong> View all active tenants, toggle institution status (Active / Suspended), inspect student rosters, or modify institution details.</li>
    <li><strong>Subscription Tiers:</strong> Manage pricing plans (Free, Basic, Pro, Enterprise), adjust allowed tests and student limits, and view platform subscription revenue.</li>
</ol>

<h2>4.2 Organization Admin Dashboard (College Principal / Dean)</h2>
<p><strong>Goal:</strong> Configure the college workspace, onboard faculty, organize student batches, and track college-wide academic results.</p>
<ol>
    <li><strong>Login:</strong> Log in using the college administrator credentials received via email.</li>
    <li><strong>College Overview:</strong> View the KPI dashboard highlighting total departments, teachers, batches, students, and exam passing percentages.</li>
    <li><strong>Teacher Onboarding:</strong> Review incoming teacher applications from faculty seeking to join the institution. Approve requests or manually invite teachers with specific department assignments.</li>
    <li><strong>Batches Setup:</strong> Create academic cohorts (e.g., <em>CSE-Year-3</em>, <em>Mechanical-Sec-A</em>) and configure seat capacities.</li>
    <li><strong>Bulk Student Upload via Excel:</strong> Upload a student roster spreadsheet (.xlsx) with columns for Name, Email, and Registration Number. The platform automatically provisions student accounts and assigns them to the chosen batch with an audit log.</li>
    <li><strong>Performance Analytics & Reports:</strong> Inspect institution-wide exam scorecards, view batch comparisons, and export complete test result spreadsheets.</li>
    <li><strong>Subscription Upgrades:</strong> Check remaining quotas (student seats and tests used) and upgrade tiers as the college expands.</li>
</ol>

<h2>4.3 Teacher Dashboard (Faculty / Instructors)</h2>
<p><strong>Goal:</strong> Author multiple choice tests, add questions with marking schemes, assign exams to batches, and monitor student grades.</p>
<ol>
    <li><strong>Login:</strong> Navigate to <code>/teacher-login</code> and sign in using approved teacher credentials.</li>
    <li><strong>Teacher Overview:</strong> View assigned batches, active tests, and student submission counters.</li>
    <li><strong>Create an Exam:</strong> Click <strong>"Create New Test"</strong>. Specify test title (e.g. <em>Computer Networks Midterm</em>), subject, exam timer (e.g. 45 minutes), total marks, passing percentage cutoff, and candidate instructions.</li>
    <li><strong>Build Question Bank:</strong> Add multiple-choice questions with 4 answer options (A, B, C, D). Designate the correct answer key, assign positive marks (e.g. +4) and negative marking penalty (e.g. -1 for wrong answer), and write an explanation explaining the solution.</li>
    <li><strong>Assign to Batches & Publish:</strong> Select the student batches eligible to take the test and click <strong>"Publish"</strong> to release the exam.</li>
    <li><strong>Live Monitoring & Analytics:</strong> Watch candidate submissions come in live. Review highest, lowest, and average scores, examine question difficulty statistics, and download the full gradebook as an Excel spreadsheet.</li>
</ol>

<h2>4.4 Student Dashboard & Exam Experience (Learners / Candidates)</h2>
<p><strong>Goal:</strong> Access scheduled exams, take tests inside an interactive timed testing environment, and review instant scorecards with explanations.</p>
<ol>
    <li><strong>Login:</strong> Sign in at <code>/login</code> using college-issued email/password or one-click Google OAuth.</li>
    <li><strong>Student Dashboard:</strong> View assigned batches, upcoming exam schedules, and performance progress cards.</li>
    <li><strong>Browse Tests:</strong> Visit "Available Tests" to view active tests published for their batch.</li>
    <li><strong>Read Exam Rules:</strong> Review the pre-test instructions detailing duration, marking scheme, negative marking rules, and total questions before beginning.</li>
    <li><strong>Take the Test:</strong> Enter the distraction-free exam screen:
        <ul>
            <li><strong>Live Countdown Timer:</strong> Synchronized timer showing remaining minutes and seconds (auto-submits when time expires).</li>
            <li><strong>Interactive Question Palette:</strong> Visual status indicators for Answered (Green), Flagged for Review (Yellow), and Unvisited (Gray).</li>
            <li><strong>Intuitive Controls:</strong> Next, Previous, and Clear Answer buttons.</li>
        </ul>
    </li>
    <li><strong>Instant Results & Detailed Feedback:</strong> Immediately upon submission, the student receives their scorecard:
        <ul>
            <li>Overall Score, Percentage, and Pass/Fail badge.</li>
            <li>Count of attempted, correct, wrong, and unanswered questions.</li>
            <li>Question-by-question review showing the student's selected option alongside the correct answer and the teacher's explanatory notes.</li>
        </ul>
    </li>
    <li><strong>History:</strong> Access "My Attempts" anytime to review historical scorecards and track academic improvement.</li>
</ol>

<h1>5. How the Application Works Overall (Architecture & Flow)</h1>
<p>
    AssessIQ functions as an interconnected SaaS ecosystem. The entire lifecycle operates in 4 streamlined phases:
</p>
<ol>
    <li><strong>Tenant Onboarding:</strong> An institution submits a join request &rarr; Super Admin reviews and approves &rarr; Dedicated Organization workspace is created &rarr; Org Admin receives credentials.</li>
    <li><strong>Roster & Batch Allocation:</strong> Org Admin creates batches (e.g. CSE-A) &rarr; Uploads student roster spreadsheet &rarr; Student accounts are automatically provisioned and mapped to batches.</li>
    <li><strong>Exam Creation:</strong> Teacher writes MCQ questions, sets countdown timer and negative marking &rarr; Links test to batch &rarr; Hits Publish.</li>
    <li><strong>Exam Execution & Instant Grading:</strong> Students take the timed exam &rarr; Answers are submitted &rarr; Backend scoring engine calculates positive marks minus penalties &rarr; Result scorecard and analytics are generated immediately for both student and teacher.</li>
</ol>

<h1>6. Practical Real-Time Scenarios</h1>

<h2>Scenario 1: University Midterm Semester Examination</h2>
<p>
    <strong>Situation:</strong> An engineering college with 2,000 students across 5 engineering branches needs to conduct midterm examinations within a single week.<br>
    <strong>How AssessIQ Solves It:</strong> The admin imports student rosters using Excel in under 2 minutes. Faculty members create branch-specific 60-minute tests with 50 questions each. All 2,000 students take their exams simultaneously from campus computer labs. By 11:01 AM, all scorecards are finalized, passing percentages are calculated, and the college dean exports department-wide grade sheets with zero manual grading labor.
</p>

<h2>Scenario 2: Competitive Coaching Institute (JEE / NEET Mock Tests)</h2>
<p>
    <strong>Situation:</strong> A medical entrance coaching center prepares candidates for national competitive examinations that strictly enforce negative marking.<br>
    <strong>How AssessIQ Solves It:</strong> Instructors configure mock tests with +4 marks for correct answers and -1 penalty for incorrect responses. Students practice under time pressure matching actual entrance conditions. After the exam, students immediately review full solution explanations for every wrong answer, pinpointing knowledge gaps before the final exam.
</p>

<h2>Scenario 3: Corporate Campus Recruitment Screening</h2>
<p>
    <strong>Situation:</strong> A software company visits universities to hire 50 software developers from a pool of 800 applicants.<br>
    <strong>How AssessIQ Solves It:</strong> The HR team publishes a 30-minute aptitude and programming MCQ test. Candidates take the test on their smartphones. The platform automatically ranks applicants on a live leaderboard and flags candidates who score 75% or higher, enabling interviewers to interview the top candidates that very afternoon.
</p>

<h2>Scenario 4: High School Weekly Revision Quizzes</h2>
<p>
    <strong>Situation:</strong> A school science teacher wants to verify whether 10th-grade students understood the week's physics lectures.<br>
    <strong>How AssessIQ Solves It:</strong> The teacher drafts a quick 10-question quiz on Friday afternoon and schedules it for the weekend. Students complete the test from home. On Monday morning, the teacher reviews the dashboard to see exactly which questions students struggled with, tailoring the next lesson accordingly.
</p>

<h2>Comparison: Traditional Paper Exams vs. AssessIQ Portal</h2>
<table>
    <tr>
        <th>Evaluation Dimension</th>
        <th>Traditional Paper-Based Exams</th>
        <th>AssessIQ Online MCQ Portal</th>
    </tr>
    <tr>
        <td><strong>Grading Speed</strong></td>
        <td>Days or weeks of manual paper correction.</td>
        <td>Instantaneous (less than 1 second per submission).</td>
    </tr>
    <tr>
        <td><strong>Logistics & Printing Cost</strong></td>
        <td>Thousands of pages printed, physical storage, and waste.</td>
        <td>100% paperless; zero printing, shipping, or storage costs.</td>
    </tr>
    <tr>
        <td><strong>Grading Accuracy</strong></td>
        <td>Subject to fatigue, calculation mistakes, and bias.</td>
        <td>100% mathematically exact server-side scoring algorithm.</td>
    </tr>
    <tr>
        <td><strong>Student Feedback</strong></td>
        <td>Delayed feedback when mistakes are already forgotten.</td>
        <td>Immediate question-by-question review with explanations.</td>
    </tr>
    <tr>
        <td><strong>Administrative Reporting</strong></td>
        <td>Manual data entry into spreadsheets.</td>
        <td>Automated analytics, pass/fail charts, and 1-click Excel export.</td>
    </tr>
</table>

<h1>7. Conclusion</h1>
<p>
    AssessIQ provides a scalable, secure, and modern digital assessment solution for modern education. 
    By uniting multi-tenant organization isolation, automated grading, anti-cheating timers, and role-specific interfaces, 
    AssessIQ transforms the assessment experience for institutions, educators, and learners alike.
</p>

</body>
</html>
"""
    output_filename = "AssessIQ_Project_Comprehensive_Guide.doc"
    output_path = os.path.join(os.getcwd(), output_filename)
    with open(output_path, "w", encoding="utf-8") as f:
        f.write(html_content)
    print(f"SUCCESS: Generated {output_path}")

if __name__ == "__main__":
    generate_doc_file()
