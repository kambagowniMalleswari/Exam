import os
import docx
from docx import Document
from docx.shared import Inches, Pt, RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.enum.table import WD_TABLE_ALIGNMENT
from docx.oxml import OxmlElement, parse_xml
from docx.oxml.ns import qn, nsdecls

def create_document():
    doc = Document()

    # Set page margins (1 inch on all sides)
    for section in doc.sections:
        section.top_margin = Inches(1)
        section.bottom_margin = Inches(1)
        section.left_margin = Inches(1)
        section.right_margin = Inches(1)

    # Color Palette
    COLOR_PRIMARY = RGBColor(79, 70, 229)    # Indigo #4F46E5
    COLOR_SECONDARY = RGBColor(15, 23, 42)   # Dark Slate #0F172A
    COLOR_MUTED = RGBColor(100, 116, 139)    # Muted Slate #64748B
    COLOR_TEXT = RGBColor(30, 41, 59)        # Dark Text #1E293B
    COLOR_SUCCESS = RGBColor(16, 185, 129)   # Emerald #10B981
    COLOR_ACCENT = RGBColor(217, 119, 6)     # Amber #D97706

    def set_cell_background(cell, hex_color):
        tcPr = cell._element.get_or_add_tcPr()
        shd = parse_xml(f'<w:shd {nsdecls("w")} w:fill="{hex_color}"/>')
        tcPr.append(shd)

    def set_cell_margins(cell, top=140, bottom=140, left=180, right=180):
        tcPr = cell._element.get_or_add_tcPr()
        tcMar = OxmlElement('w:tcMar')
        for m, val in [('top', top), ('bottom', bottom), ('left', left), ('right', right)]:
            node = OxmlElement(f'w:{m}')
            node.set(qn('w:w'), str(val))
            node.set(qn('w:type'), 'dxa')
            tcMar.append(node)
        tcPr.append(tcMar)

    def add_custom_h1(title_text):
        h = doc.add_heading(level=1)
        h.paragraph_format.space_before = Pt(18)
        h.paragraph_format.space_after = Pt(8)
        r = h.add_run(title_text)
        r.font.name = "Arial"
        r.font.size = Pt(16)
        r.font.bold = True
        r.font.color.rgb = COLOR_PRIMARY
        return h

    def add_custom_h2(subtitle_text):
        h = doc.add_heading(level=2)
        h.paragraph_format.space_before = Pt(14)
        h.paragraph_format.space_after = Pt(6)
        r = h.add_run(subtitle_text)
        r.font.name = "Arial"
        r.font.size = Pt(13)
        r.font.bold = True
        r.font.color.rgb = COLOR_SECONDARY
        return h

    def add_custom_h3(subsubtitle_text):
        h = doc.add_heading(level=3)
        h.paragraph_format.space_before = Pt(10)
        h.paragraph_format.space_after = Pt(4)
        r = h.add_run(subsubtitle_text)
        r.font.name = "Arial"
        r.font.size = Pt(11)
        r.font.bold = True
        r.font.color.rgb = COLOR_PRIMARY
        return h

    def add_callout(text, title=None, bg_color="EEF2FF", border_color=COLOR_PRIMARY):
        tbl = doc.add_table(rows=1, cols=1)
        tbl.alignment = WD_TABLE_ALIGNMENT.CENTER
        tbl.autofit = False
        cell = tbl.cell(0, 0)
        cell.width = Inches(6.5)
        set_cell_background(cell, bg_color)
        set_cell_margins(cell, top=140, bottom=140, left=180, right=180)
        p = cell.paragraphs[0]
        p.paragraph_format.space_after = Pt(4)
        p.paragraph_format.line_spacing = 1.15
        if title:
            rt = p.add_run(title + "\n")
            rt.font.name = "Arial"
            rt.font.bold = True
            rt.font.color.rgb = border_color
            rt.font.size = Pt(10.5)
        rc = p.add_run(text)
        rc.font.name = "Arial"
        rc.font.size = Pt(10)
        rc.font.color.rgb = COLOR_TEXT
        doc.add_paragraph().paragraph_format.space_after = Pt(6)

    def style_table(table, col_widths, headers, data):
        table.alignment = WD_TABLE_ALIGNMENT.CENTER
        table.autofit = False

        # Header Row
        hdr_cells = table.rows[0].cells
        for i, header_text in enumerate(headers):
            hdr_cells[i].text = header_text
            hdr_cells[i].width = Inches(col_widths[i])
            set_cell_background(hdr_cells[i], "1E293B")  # Dark slate
            set_cell_margins(hdr_cells[i], top=120, bottom=120, left=140, right=140)
            p = hdr_cells[i].paragraphs[0]
            p.alignment = WD_ALIGN_PARAGRAPH.LEFT
            for r in p.runs:
                r.font.name = "Arial"
                r.font.bold = True
                r.font.size = Pt(9.5)
                r.font.color.rgb = RGBColor(255, 255, 255)

        # Data Rows
        for r_idx, row_data in enumerate(data):
            row_cells = table.add_row().cells
            bg_color = "F8FAFC" if r_idx % 2 == 1 else "FFFFFF"
            for c_idx, cell_value in enumerate(row_data):
                row_cells[c_idx].text = cell_value
                row_cells[c_idx].width = Inches(col_widths[c_idx])
                set_cell_background(row_cells[c_idx], bg_color)
                set_cell_margins(row_cells[c_idx], top=100, bottom=100, left=140, right=140)
                p = row_cells[c_idx].paragraphs[0]
                for r in p.runs:
                    r.font.name = "Arial"
                    r.font.size = Pt(9)
                    r.font.color.rgb = COLOR_TEXT

    # =========================================================================
    # DOCUMENT HEADER / TITLE
    # =========================================================================
    p_title = doc.add_paragraph()
    p_title.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p_title.paragraph_format.space_before = Pt(8)
    p_title.paragraph_format.space_after = Pt(4)
    run_title = p_title.add_run("AssessIQ: Multi-Tenant Online MCQ Assessment Portal")
    run_title.font.name = "Arial"
    run_title.font.size = Pt(22)
    run_title.font.bold = True
    run_title.font.color.rgb = COLOR_PRIMARY

    p_sub = doc.add_paragraph()
    p_sub.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p_sub.paragraph_format.space_after = Pt(12)
    run_sub = p_sub.add_run("Complete Project Architecture, Technology Stack, Data Models, Role-Based Dashboards & Real-Time Scenarios Guide")
    run_sub.font.name = "Arial"
    run_sub.font.size = Pt(11)
    run_sub.font.bold = True
    run_sub.font.color.rgb = COLOR_SECONDARY

    p_meta = doc.add_paragraph()
    p_meta.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p_meta.paragraph_format.space_after = Pt(18)
    run_meta = p_meta.add_run("Comprehensive Project Guide | Simple, Easy-to-Understand Documentation for All Users")
    run_meta.font.name = "Arial"
    run_meta.font.size = Pt(9.5)
    run_meta.font.italic = True
    run_meta.font.color.rgb = COLOR_MUTED

    # =========================================================================
    # SECTION 1: SUMMARY OF THE PROJECT (SIMPLE WAY)
    # =========================================================================
    add_custom_h1("1. Project Summary (In Simple Words)")

    p = doc.add_paragraph()
    p.paragraph_format.space_after = Pt(8)
    p.paragraph_format.line_spacing = 1.15
    p.add_run(
        "AssessIQ is an online examination web application designed to help schools, colleges, universities, "
        "and training institutes conduct Multiple Choice Question (MCQ) tests securely over the internet.\n\n"
        "Think of AssessIQ like Google Classroom combined with a high-security examination hall. "
        "Instead of printing thousands of paper question sheets and spending days grading them manually by hand, "
        "teachers can create tests online, assign them to student batches, and students take the exam on their laptop or mobile. "
        "The moment a student finishes, the system automatically grades every answer in less than a second, displays their marks, "
        "shows correct answers with explanations, and sends results to the teacher and college administrators."
    )

    add_callout(
        "• Multi-Tenant Architecture: Many different colleges use the same platform, but their data is 100% private and separated.\n"
        "• 4 Clear User Roles: Super Admin (Platform Owner), Org Admin (College Principal), Teacher (Test Creator), and Student (Test Taker).\n"
        "• Automated Grading: Instant calculation of scores, percentages, and pass/fail status with negative marking support.\n"
        "• Anti-Cheating Timer: Strict countdown timer that auto-submits tests when time runs out.\n"
        "• Batch Management: Easy organization of students into classes/cohorts with bulk Excel upload support.",
        title="Key Highlights of AssessIQ:"
    )

    # =========================================================================
    # SECTION 2: TECHNOLOGIES USED (FRONTEND, BACKEND, DATABASE)
    # =========================================================================
    add_custom_h1("2. Technologies Used Across the Platform")

    p = doc.add_paragraph()
    p.paragraph_format.space_after = Pt(8)
    p.paragraph_format.line_spacing = 1.15
    p.add_run(
        "AssessIQ is built using the MERN stack (MongoDB, Express, React, Node.js) paired with modern tools "
        "for security, styling, authentication, and spreadsheet processing. Here is the complete breakdown:"
    )

    add_custom_h2("A. Frontend Technologies (User Interface)")
    p = doc.add_paragraph()
    p.paragraph_format.space_after = Pt(6)
    p.paragraph_format.line_spacing = 1.15
    p.add_run(
        "The frontend is what users see and interact with in their web browser. It is built to be fast, responsive, and easy to use."
    )

    t_front = doc.add_table(rows=1, cols=3)
    front_headers = ["Technology", "Version / Tool", "Purpose in AssessIQ"]
    front_data = [
        ["React", "v19.2.8", "Builds fast, interactive user interfaces with reusable UI components and real-time state updates."],
        ["Vite", "v8.2.2", "Ultra-fast next-generation frontend build tool and local development server."],
        ["React Router DOM", "v7.18.3", "Handles page navigation and protects routes based on user role (Student, Teacher, Admin, Super Admin)."],
        ["Axios", "v1.20.0", "Sends secure HTTP requests (GET, POST, PUT, DELETE) to the backend API with authentication tokens."],
        ["Firebase SDK", "v12.19.0", "Enables quick and secure Google OAuth Sign-In for students and teachers."],
        ["SheetJS (XLSX)", "v0.18.5", "Allows admins and teachers to download reports and upload student rosters as Excel spreadsheets."],
        ["Vanilla CSS", "Custom CSS", "Modern, clean design system with dark/light glassmorphism, responsive cards, and smooth animations."]
    ]
    style_table(t_front, [1.4, 1.2, 3.9], front_headers, front_data)

    doc.add_paragraph().paragraph_format.space_after = Pt(10)

    add_custom_h2("B. Backend Technologies (Server & Logic)")
    p = doc.add_paragraph()
    p.paragraph_format.space_after = Pt(6)
    p.paragraph_format.line_spacing = 1.15
    p.add_run(
        "The backend runs on the server. It handles business logic, database queries, password security, test grading, and email dispatch."
    )

    t_back = doc.add_table(rows=1, cols=3)
    back_headers = ["Technology", "Version / Tool", "Purpose in AssessIQ"]
    back_data = [
        ["Node.js", "v20+ Runtime", "High-performance JavaScript runtime environment executing backend server operations asynchronously."],
        ["Express.js", "v5.2.1", "Robust web application framework managing RESTful API routes, middlewares, and request validation."],
        ["JWT (jsonwebtoken)", "v9.0.3", "Generates and verifies secure stateless authentication tokens for user sessions."],
        ["Bcrypt.js", "v3.0.3", "Hashes and salts user passwords securely so passwords are never stored in plain text."],
        ["Nodemailer", "v10.0.10", "Automated email dispatcher sending welcome emails, approvals, credentials, and password reset OTPs."],
        ["SheetJS (xlsx)", "v0.18.5", "Parses uploaded Excel files on the server to match students with batch rosters automatically."],
        ["Compression & CORS", "v1.8.2 / v2.8.6", "Gzip compresses API responses for fast page loads and manages secure cross-origin requests."]
    ]
    style_table(t_back, [1.5, 1.2, 3.8], back_headers, back_data)

    doc.add_paragraph().paragraph_format.space_after = Pt(10)

    add_custom_h2("C. Database Technologies (Storage & Data)")
    p = doc.add_paragraph()
    p.paragraph_format.space_after = Pt(6)
    p.paragraph_format.line_spacing = 1.15
    p.add_run(
        "The database stores all persistent data, such as users, colleges, test questions, student submissions, and scorecards."
    )

    t_db = doc.add_table(rows=1, cols=3)
    db_headers = ["Technology", "Version / Tool", "Purpose in AssessIQ"]
    db_data = [
        ["MongoDB", "v6+ / Atlas Cloud", "Scalable NoSQL document database storing data in flexible, JSON-like documents."],
        ["Mongoose ODM", "v9.9.5", "Object Data Modeling library providing strict schema validation, type safety, and relationship population."],
        ["Multi-Tenant Indexing", "Compound Indexes", "Tags data with organizationId so queries are ultra-fast and strictly isolated between colleges."]
    ]
    style_table(t_db, [1.5, 1.4, 3.6], db_headers, db_data)

    doc.add_paragraph().paragraph_format.space_after = Pt(10)

    # =========================================================================
    # SECTION 3: HOW MANY MODELS ARE PRESENT (ALL 11 MODELS EXPLAINED)
    # =========================================================================
    add_custom_h1("3. Database Models (Total: 11 Models)")

    p = doc.add_paragraph()
    p.paragraph_format.space_after = Pt(8)
    p.paragraph_format.line_spacing = 1.15
    p.add_run(
        "There are exactly 11 Mongoose database models in the AssessIQ portal. Each model acts as a blueprint "
        "for a specific entity in the system. Here is what each model does, written in simple, everyday language:"
    )

    t_models = doc.add_table(rows=1, cols=4)
    model_headers = ["#", "Model Name", "What It Represents", "Key Information Stored"]
    model_data = [
        ["1", "User", "All accounts in the system", "Name, email, password hash, role (superadmin, org_admin, teacher, student), college ID, batch IDs, phone, registration number."],
        ["2", "Organization", "College or Educational Institute", "Name, unique slug (e.g., 'oxford'), email, phone, logo URL, subscription plan, active/suspended status."],
        ["3", "OrgApplication", "New College Join Requests", "Form submissions from colleges requesting to join AssessIQ; admin contact details, expected student count, approval/rejection status."],
        ["4", "TeacherApplication", "Teacher Joining Requests", "Teachers applying to teach at a specific organization; includes subjects, qualification degrees, years of experience, status."],
        ["5", "Test", "Exam or Quiz Configurations", "Test title, subject, duration (minutes), total marks, passing cutoff, attempts allowed, public/private type, status (draft/published)."],
        ["6", "Question", "Individual Exam Questions", "Linked to a Test; contains question text, 4 options (A, B, C, D), correct option key, positive marks, negative penalty, explanation."],
        ["7", "Attempt", "Live / Submitted Exam Sessions", "Tracks when a student started a test, their selected answers for each question, time taken, and status (started, submitted, evaluated)."],
        ["8", "Result", "Final Evaluated Scorecard", "Generated upon test submit; total questions, attempted, correct, wrong, score, percentage, pass/fail result, and full answer breakdown."],
        ["9", "Batch", "Class, Cohort or Section", "Batch name (e.g. 'CSE-2024-A'), batch code, student capacity, enrollment type (open/selective), assigned tests, creator teacher/admin."],
        ["10", "BatchAllocationAudit", "Excel Roster Upload Logs", "Audit trail of bulk student imports; tracks file name, total rows, matched students, newly allocated students, unmatched rows."],
        ["11", "Subscription", "SaaS Pricing & Quotas", "Organization's active subscription tier (Free, Basic, Pro, Enterprise), max test limit, max student seats, billing price, active features."]
    ]
    style_table(t_models, [0.4, 1.4, 1.8, 2.9], model_headers, model_data)

    doc.add_paragraph().paragraph_format.space_after = Pt(12)

    # Detailed descriptions of key models
    add_custom_h2("Detailed Walkthrough of Crucial Models:")
    
    add_custom_h3("Model 1: User (The People)")
    p = doc.add_paragraph()
    p.paragraph_format.space_after = Pt(6)
    p.paragraph_format.line_spacing = 1.15
    p.add_run(
        "Every person who uses AssessIQ has a record in the User model. Their role field determines what they can see: "
        "Super Admin can control everything; Org Admin controls their college; Teachers can make tests and grade them; "
        "and Students can take tests. For students, this model also stores their batch ID, semester, and registration number."
    )

    add_custom_h3("Model 2 & 3: Organization & OrgApplication (The Institutions)")
    p = doc.add_paragraph()
    p.paragraph_format.space_after = Pt(6)
    p.paragraph_format.line_spacing = 1.15
    p.add_run(
        "When a new college visits the website, they fill out a form that gets saved as an OrgApplication. "
        "Once the Super Admin reviews and clicks 'Approve', the system automatically creates an official Organization "
        "document, creates the college administrator account, and sends them their login credentials by email."
    )

    add_custom_h3("Model 5 & 6: Test & Question (The Exams)")
    p = doc.add_paragraph()
    p.paragraph_format.space_after = Pt(6)
    p.paragraph_format.line_spacing = 1.15
    p.add_run(
        "A Test is like an exam envelope containing rules: 60 minutes duration, 100 total marks, 40% passing marks, "
        "and instructions. Inside that envelope are Questions. Each Question has 4 choices (A, B, C, D), a marked correct answer, "
        "positive points (e.g. +4), negative penalty (e.g. -1 for wrong answer), and a detailed explanation showing why the answer is correct."
    )

    add_custom_h3("Model 7 & 8: Attempt & Result (The Submissions & Scorecards)")
    p = doc.add_paragraph()
    p.paragraph_format.space_after = Pt(6)
    p.paragraph_format.line_spacing = 1.15
    p.add_run(
        "When a student clicks 'Start Exam', an Attempt is created with a timestamp. As the student answers questions, "
        "the attempt records their choices. When they hit submit (or the timer reaches 00:00), the backend automatically runs "
        "a grading algorithm, compares each answer against the correct key, calculates the net score, and generates a Result "
        "document with a complete scorecard and pass/fail badge."
    )

    # =========================================================================
    # SECTION 4: STEP-BY-STEP GUIDE FOR ALL 4 DASHBOARDS
    # =========================================================================
    add_custom_h1("4. Step-by-Step Guide for All 4 Roles & Dashboards")

    p = doc.add_paragraph()
    p.paragraph_format.space_after = Pt(8)
    p.paragraph_format.line_spacing = 1.15
    p.add_run(
        "AssessIQ provides four distinct, tailor-made user experiences. Here is exactly how each dashboard works step-by-step:"
    )

    # 4.1 SUPER ADMIN DASHBOARD
    add_custom_h2("4.1 Super Admin Dashboard (Platform Owner)")
    p = doc.add_paragraph()
    p.paragraph_format.space_after = Pt(6)
    p.paragraph_format.line_spacing = 1.15
    p.add_run(
        "Who it is for: The company or team operating the AssessIQ SaaS platform.\n"
        "Main Goal: Oversee all colleges, approve new institutions, manage subscription plans, and monitor platform health."
    )

    add_callout(
        "Step 1: Secure Login - Navigate to /admin-login and sign in with Super Admin credentials.\n"
        "Step 2: Platform Analytics - View global statistics: total organizations registered, active teachers, total students, total exams conducted, and system health.\n"
        "Step 3: Review College Applications - Open 'Org Requests'. Inspect incoming applications from schools and colleges. Click 'Approve' to instantly create their organization and send login credentials to the principal, or 'Reject' with a reason.\n"
        "Step 4: Manage Organizations - View the full list of active colleges. Suspend inactive institutions, inspect college details, or update tenant information.\n"
        "Step 5: Subscriptions & Billing - Manage SaaS plans (Free, Basic, Pro, Enterprise), adjust student capacity caps, and monitor platform subscription renewals.",
        title="Super Admin Step-by-Step Workflow:"
    )

    # 4.2 ORG ADMIN DASHBOARD
    add_custom_h2("4.2 Organization Admin Dashboard (College Principal / Dean)")
    p = doc.add_paragraph()
    p.paragraph_format.space_after = Pt(6)
    p.paragraph_format.line_spacing = 1.15
    p.add_run(
        "Who it is for: The college principal, examination controller, or institution IT director.\n"
        "Main Goal: Manage the college workspace, onboard teachers, organize student batches, and track college-wide exam performance."
    )

    add_callout(
        "Step 1: Organization Login - Log in with the college admin account credentials received via email.\n"
        "Step 2: College Overview - View key numbers: total teachers in the college, active batches, enrolled students, and upcoming exams.\n"
        "Step 3: Teacher Onboarding - Review incoming 'Teacher Applications' from teachers wishing to join the college, or manually create new teacher accounts and assign their departments.\n"
        "Step 4: Academic Batches Setup - Create batches/classes (e.g., 'B.Tech-CSE-Sem4', 'Medical-Batch-A'), set student seat limits, and assign tests to specific batches.\n"
        "Step 5: Bulk Student Import via Excel - Upload an Excel roster (.xlsx) containing student names, emails, and registration numbers. The system automatically creates student accounts and maps them into batches with an audit log.\n"
        "Step 6: College Performance Reports - View institute-wide scorecards, passing percentages, highest/lowest scores, and export detailed results to Excel.\n"
        "Step 7: Plan Management - View remaining test quota and student seats, and upgrade subscription when needed.",
        title="Org Admin Step-by-Step Workflow:"
    )

    # 4.3 TEACHER DASHBOARD
    add_custom_h2("4.3 Teacher Dashboard (Faculty / Professors / Instructors)")
    p = doc.add_paragraph()
    p.paragraph_format.space_after = Pt(6)
    p.paragraph_format.line_spacing = 1.15
    p.add_run(
        "Who it is for: School teachers, university professors, and coaching tutors.\n"
        "Main Goal: Create tests, write multiple choice questions, set rules, publish to batches, and review student grades."
    )

    add_callout(
        "Step 1: Teacher Login - Sign in at /teacher-login using approved faculty credentials.\n"
        "Step 2: Dashboard Overview - Check assigned batches, active tests, and student test submissions.\n"
        "Step 3: Create a New Test - Click 'Create Test', enter test title (e.g. 'Data Structures Quiz 1'), subject, exam duration in minutes (e.g. 45 mins), total marks, passing cutoff %, number of allowed attempts, and student instructions.\n"
        "Step 4: Add Questions & Answer Keys - Add MCQ questions with 4 answer options (A, B, C, D), select the correct option, configure positive marks (e.g. +3) and negative penalty marks (e.g. -1), and add explanation text for students.\n"
        "Step 5: Batch Assignment & Publishing - Select which student batches can take the test and click 'Publish' to make it live.\n"
        "Step 6: Live Monitoring & Grading - View student submissions in real time as they finish. View average marks, pass/fail charts, leaderboard rankings, and download the full gradebook in Excel.",
        title="Teacher Step-by-Step Workflow:"
    )

    # 4.4 STUDENT DASHBOARD
    add_custom_h2("4.4 Student Dashboard & Exam Experience (Learners / Candidates)")
    p = doc.add_paragraph()
    p.paragraph_format.space_after = Pt(6)
    p.paragraph_format.line_spacing = 1.15
    p.add_run(
        "Who it is for: Students enrolled in the college or candidates taking competitive exams.\n"
        "Main Goal: View assigned exams, take timed tests with an intuitive question palette, and see instant scorecards with explanations."
    )

    add_callout(
        "Step 1: Student Login - Sign in using email/password or Google OAuth. The student's college and batch details load automatically.\n"
        "Step 2: Student Dashboard - View enrolled batches, upcoming scheduled tests, and previous exam performance history.\n"
        "Step 3: Browse Available Tests - Click 'Available Tests' to see tests published for their batch, test duration, and total marks.\n"
        "Step 4: Read Exam Instructions - Click 'Start Test'. Review rules: timer warnings, negative marking rules, and total questions before starting.\n"
        "Step 5: Interactive Exam Hall - The exam loads in a distraction-free view with:\n"
        "   • Live countdown timer (auto-submits when 00:00 is reached).\n"
        "   • Question palette showing Answered (Green), Flagged/Review (Yellow), and Unvisited (Gray).\n"
        "   • Easy navigation with 'Next', 'Previous', and 'Clear Selection' buttons.\n"
        "Step 6: Instant Results & Scorecard - Immediately upon submission, the student sees:\n"
        "   • Final Score & Percentage.\n"
        "   • Pass or Fail badge.\n"
        "   • Total attempted, correct answers, and wrong answers.\n"
        "   • Question-by-question breakdown showing student choice vs correct answer and the teacher's explanation.\n"
        "Step 7: Performance History - View past attempt records under 'My Attempts' to track learning progress over time.",
        title="Student Step-by-Step Workflow:"
    )

    # =========================================================================
    # SECTION 5: HOW THE APPLICATION WORKS (OVERALL WORKFLOW)
    # =========================================================================
    add_custom_h1("5. How the Application Works Overall (System Architecture)")

    p = doc.add_paragraph()
    p.paragraph_format.space_after = Pt(8)
    p.paragraph_format.line_spacing = 1.15
    p.add_run(
        "The overall workflow of AssessIQ connects colleges, teachers, students, and tests seamlessly. "
        "Here is the high-level architecture explained in simple steps:"
    )

    add_custom_h2("1. Multi-Tenant Isolation (Safe & Private)")
    p = doc.add_paragraph()
    p.paragraph_format.space_after = Pt(6)
    p.paragraph_format.line_spacing = 1.15
    p.add_run(
        "AssessIQ is a multi-tenant platform. This means that ABC Engineering College and XYZ Medical Institute "
        "can use the exact same application at the same time, but their data is completely separated. "
        "Every database query automatically filters by organizationId. Students from ABC College cannot see tests "
        "from XYZ Institute, keeping question papers and student records strictly confidential."
    )

    add_custom_h2("2. Role-Based Access Control (RBAC)")
    p = doc.add_paragraph()
    p.paragraph_format.space_after = Pt(6)
    p.paragraph_format.line_spacing = 1.15
    p.add_run(
        "When any user logs in, the backend issues an encrypted JSON Web Token (JWT) that encodes their user ID, "
        "role, and college ID. Whenever the user visits a page or clicks a button, backend middleware checks their role. "
        "A student cannot create a test, a teacher cannot delete an organization, and an unauthorized user is blocked immediately."
    )

    add_custom_h2("3. Automated Real-Time Evaluation Engine")
    p = doc.add_paragraph()
    p.paragraph_format.space_after = Pt(6)
    p.paragraph_format.line_spacing = 1.15
    p.add_run(
        "Manual test grading is slow and prone to errors. In AssessIQ, evaluation happens instantly on the server using calculateResult.js:\n"
        "• Correct Answer = Awards positive points (e.g. +4).\n"
        "• Wrong Answer = Deducts negative penalty marks (e.g. -1), if enabled by the teacher.\n"
        "• Blank / Unanswered = 0 marks (no penalty).\n"
        "• Final Score = Sum of positive marks minus penalty marks.\n"
        "• Percentage = (Score / Total Marks) * 100.\n"
        "• Pass/Fail = Evaluated against the test's passing cutoff percentage."
    )

    # =========================================================================
    # SECTION 6: USES AND REAL-TIME SCENARIOS
    # =========================================================================
    add_custom_h1("6. Uses & Real-Time Scenarios")

    p = doc.add_paragraph()
    p.paragraph_format.space_after = Pt(8)
    p.paragraph_format.line_spacing = 1.15
    p.add_run(
        "AssessIQ is designed for real-world academic and professional environments. Here are four practical scenarios "
        "showing how different organizations use the portal on a daily basis:"
    )

    add_custom_h2("Scenario 1: University Midterm Semester Examination")
    p = doc.add_paragraph()
    p.paragraph_format.space_after = Pt(6)
    p.paragraph_format.line_spacing = 1.15
    p.add_run(
        "Context: An engineering university with 2,500 students across 6 departments needs to conduct mid-semester tests.\n"
        "How AssessIQ Solves It: The college admin imports the entire student roster via Excel in 30 seconds. "
        "Professors from Computer Science, Mechanical, and Electrical create their respective 50-question tests with a 60-minute time limit. "
        "At 10:00 AM, students log in simultaneously and complete their exams. By 11:01 AM, all 2,500 scorecards are generated, "
        "and the dean downloads department performance summaries with zero paper used and zero manual correction hours."
    )

    add_custom_h2("Scenario 2: Competitive Coaching Institute (JEE / NEET Mock Tests)")
    p = doc.add_paragraph()
    p.paragraph_format.space_after = Pt(6)
    p.paragraph_format.line_spacing = 1.15
    p.add_run(
        "Context: A coaching institute prepares students for national entrance exams where negative marking is strictly enforced.\n"
        "How AssessIQ Solves It: Tutors set up weekly mock exams with +4 marks for correct answers and -1 mark penalty for wrong choices. "
        "Students practice in a timed environment identical to actual entrance exams. After submission, students see the step-by-step "
        "solution explanation for every question they got wrong, helping them learn and improve rapidly."
    )

    add_custom_h2("Scenario 3: Corporate Campus Recruitment & Technical Screening")
    p = doc.add_paragraph()
    p.paragraph_format.space_after = Pt(6)
    p.paragraph_format.line_spacing = 1.15
    p.add_run(
        "Context: A technology enterprise visits 10 college campuses to hire graduate software engineers.\n"
        "How AssessIQ Solves It: The HR team creates a public or batch-assigned aptitude and coding MCQ screening test. "
        "Hundreds of applicants take the test on their smartphones or laptops. The system automatically filters out candidates "
        "who scored below 70%, allowing HR interviewers to immediately meet the top qualifying candidates on the same day."
    )

    add_custom_h2("Scenario 4: High School Chapter Quizzes & Continuous Evaluation")
    p = doc.add_paragraph()
    p.paragraph_format.space_after = Pt(6)
    p.paragraph_format.line_spacing = 1.15
    p.add_run(
        "Context: High school teachers need a way to assign weekly quizzes to reinforce concepts after completing chapters.\n"
        "How AssessIQ Solves It: Teachers quickly create 10-question weekly quizzes and publish them to their 10th-grade batch. "
        "Students complete the quiz from home on the weekend. Parents and teachers can view whether students passed or failed, "
        "identifying struggling students early before final term exams."
    )

    # Summary Table of Benefits
    add_custom_h2("Summary of Core Benefits:")
    t_benefits = doc.add_table(rows=1, cols=3)
    b_headers = ["Benefit", "Traditional Exam Method", "AssessIQ Platform Advantage"]
    b_data = [
        ["Grading Time", "Days or weeks of manual paper grading.", "Instantaneous (under 1 second)."],
        ["Cost & Waste", "Massive paper printing, storage, and stationery costs.", "100% paperless, zero physical logistics cost."],
        ["Grading Accuracy", "Prone to human counting and transcription errors.", "100% mathematically accurate server evaluation."],
        ["Feedback Speed", "Students wait weeks to know their mistakes.", "Immediate scorecard with correct keys and explanations."],
        ["Reporting", "Manual Excel entry by teachers.", "Automated charts, leaderboards, and 1-click Excel export."]
    ]
    style_table(t_benefits, [1.5, 2.3, 2.7], b_headers, b_data)

    doc.add_paragraph().paragraph_format.space_after = Pt(14)

    # =========================================================================
    # SECTION 7: SUMMARY & CONCLUSION
    # =========================================================================
    add_custom_h1("7. Summary & Conclusion")
    p = doc.add_paragraph()
    p.paragraph_format.space_after = Pt(8)
    p.paragraph_format.line_spacing = 1.15
    p.add_run(
        "AssessIQ is a complete, scalable, and modern online examination solution built to transform the way educational "
        "institutions and companies conduct assessments. With its robust MERN stack foundation, 11 dedicated database models, "
        "strict multi-tenant security, and intuitive role-based dashboards, AssessIQ eliminates manual grading friction, "
        "ensures fairness, and provides teachers and students with powerful real-time educational insights."
    )

    add_callout(
        "Document Prepared for: AssessIQ Educational Platform\n"
        "Format: Microsoft Word (.docx) & HTML Compatible Document\n"
        "Version: 2.0 Complete Architecture & Functional Guide",
        title="Document Information:"
    )

    # Save to disk
    output_filename = "AssessIQ_Project_Comprehensive_Guide.docx"
    output_path = os.path.join(os.getcwd(), output_filename)
    doc.save(output_path)
    print(f"SUCCESS: Document generated successfully at {output_path}")

if __name__ == "__main__":
    create_document()
