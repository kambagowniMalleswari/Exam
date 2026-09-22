import os
import shutil
import docx
from docx import Document
from docx.shared import Inches, Pt, RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.enum.table import WD_TABLE_ALIGNMENT
from docx.oxml import OxmlElement, parse_xml
from docx.oxml.ns import qn, nsdecls

def create_document():
    doc = Document()

    # Page Margins (1 inch)
    for section in doc.sections:
        section.top_margin = Inches(1)
        section.bottom_margin = Inches(1)
        section.left_margin = Inches(1)
        section.right_margin = Inches(1)

    # Palette
    COLOR_PRIMARY = RGBColor(79, 70, 229)    # #4F46E5 Deep Indigo
    COLOR_SECONDARY = RGBColor(15, 23, 42)   # #0F172A Slate Navy
    COLOR_MUTED = RGBColor(100, 116, 139)    # #64748B Slate Muted
    COLOR_TEXT = RGBColor(30, 41, 59)        # #1E293B Slate Dark
    COLOR_SUCCESS = RGBColor(16, 185, 129)   # Emerald Green

    # Helper: Set cell background color
    def set_cell_background(cell, hex_color):
        tcPr = cell._element.get_or_add_tcPr()
        shd = parse_xml(f'<w:shd {nsdecls("w")} w:fill="{hex_color}"/>')
        tcPr.append(shd)

    # Helper: Set cell padding
    def set_cell_margins(cell, top=140, bottom=140, left=180, right=180):
        tcPr = cell._element.get_or_add_tcPr()
        tcMar = OxmlElement('w:tcMar')
        for m, val in [('top', top), ('bottom', bottom), ('left', left), ('right', right)]:
            node = OxmlElement(f'w:{m}')
            node.set(qn('w:w'), str(val))
            node.set(qn('w:type'), 'dxa')
            tcMar.append(node)
        tcPr.append(tcMar)

    # Helper: Format Heading 1
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

    # Helper: Format Heading 2
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

    # Document Header Title
    p_title = doc.add_paragraph()
    p_title.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p_title.paragraph_format.space_before = Pt(8)
    p_title.paragraph_format.space_after = Pt(4)
    run_title = p_title.add_run("AssessIQ: Multi-Tenant Online MCQ Assessment Platform")
    run_title.font.name = "Arial"
    run_title.font.size = Pt(24)
    run_title.font.bold = True
    run_title.font.color.rgb = COLOR_PRIMARY

    # Subtitle
    p_sub = doc.add_paragraph()
    p_sub.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p_sub.paragraph_format.space_after = Pt(16)
    run_sub = p_sub.add_run("Executive Management Guide: Functional Architecture, Registration vs. Login Flow & Technical Blueprint")
    run_sub.font.name = "Arial"
    run_sub.font.size = Pt(12)
    run_sub.font.color.rgb = COLOR_MUTED

    # Meta banner
    p_meta = doc.add_paragraph()
    p_meta.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p_meta.paragraph_format.space_after = Pt(20)
    run_meta = p_meta.add_run("Confidential Project Document | Prepared for Senior Leadership & Engineering Managers")
    run_meta.font.size = Pt(9.5)
    run_meta.font.italic = True
    run_meta.font.color.rgb = COLOR_MUTED

    # Divider line
    doc.add_paragraph().paragraph_format.space_after = Pt(6)

    # =========================================================================
    # SECTION 1: EXECUTIVE SUMMARY
    # =========================================================================
    add_custom_h1("1. Executive Summary & Problem-Solution Overview")

    p1 = doc.add_paragraph()
    p1.paragraph_format.space_after = Pt(10)
    p1.paragraph_format.line_spacing = 1.15
    p1.add_run(
        "AssessIQ is a modern, enterprise-grade, multi-tenant Software-as-a-Service (SaaS) examination platform. "
        "It solves a pervasive operational challenge across universities, colleges, coaching institutes, and enterprise training teams: "
        "the absence of a unified, scalable, anti-cheating evaluation platform that can serve multiple distinct institutions from a single secure cloud deployment.\n\n"
        "Rather than each school building or licensing individual disconnected software installations, AssessIQ delivers a "
        "multi-tenant cloud architecture where every institution operates in its own isolated private workspace with dedicated student rosters, "
        "faculty test authors, department-level questions, and real-time performance analytics."
    )

    # Callout Box: Core Value Highlights
    tbl_callout = doc.add_table(rows=1, cols=1)
    tbl_callout.alignment = WD_TABLE_ALIGNMENT.CENTER
    tbl_callout.autofit = False
    cell_callout = tbl_callout.cell(0, 0)
    cell_callout.width = Inches(6.5)
    set_cell_background(cell_callout, "EEF2FF")  # soft indigo
    set_cell_margins(cell_callout, top=140, bottom=140, left=180, right=180)

    p_callout = cell_callout.paragraphs[0]
    p_callout.paragraph_format.space_after = Pt(4)
    r_c1 = p_callout.add_run("Key Business & Technical Pillars:\n")
    r_c1.font.bold = True
    r_c1.font.color.rgb = COLOR_PRIMARY
    p_callout.add_run(
        "• 100% Multi-Tenant Isolation: Every college's students, question banks, and grades are strictly quarantined.\n"
        "• Anti-Cheating Timer Engine: Strict server-side countdown timers with automated submission on timeout.\n"
        "• Real-Time Server-Side Grading: Instant scoring with positive marks, negative penalty scoring, and percentage thresholds.\n"
        "• Dual Catalog Architecture: Supports both private internal organization tests and publicly discoverable skill certifications.\n"
        "• SaaS Monetization Model: Flexible multi-tier subscription quotas (Free, Starter, Pro, Enterprise) for institutional billing."
    )

    doc.add_paragraph().paragraph_format.space_after = Pt(10)

    # =========================================================================
    # SECTION 2: REGISTRATION VS LOGIN FLOW (USER'S EXACT QUESTION)
    # =========================================================================
    add_custom_h1("2. Registration vs. Login Architecture: The Complete User Flow")

    p_flow_intro = doc.add_paragraph()
    p_flow_intro.paragraph_format.space_after = Pt(8)
    p_flow_intro.paragraph_format.line_spacing = 1.15
    p_flow_intro.add_run(
        "A common point of inquiry when reviewing the platform is:\n"
        "\"Why are there 3 categories on the Register page (Student, Creator, Org Admin), "
        "while the Login page lists 5 roles (Student, Org Admin, Teacher, Creator, Super Admin)?\"\n\n"
        "The reason lies in Enterprise Security and Institutional Hierarchy. Not all roles are allowed to self-register publicly on the web."
    )

    # Comparison Table
    tbl_reg_vs_login = doc.add_table(rows=6, cols=4)
    tbl_reg_vs_login.alignment = WD_TABLE_ALIGNMENT.CENTER
    tbl_reg_vs_login.autofit = False

    headers_flow = ["System Role", "Public Register?", "How Account is Created", "Where Login Takes Them"]
    widths_flow = [Inches(1.2), Inches(1.3), Inches(2.2), Inches(1.8)]

    # Format Header Row
    for idx, name in enumerate(headers_flow):
        c = tbl_reg_vs_login.rows[0].cells[idx]
        c.text = name
        c.width = widths_flow[idx]
        set_cell_background(c, "1E1B4B")
        set_cell_margins(c, top=120, bottom=120, left=100, right=100)
        p = c.paragraphs[0]
        p.runs[0].font.bold = True
        p.runs[0].font.color.rgb = RGBColor(255, 255, 255)
        p.runs[0].font.size = Pt(9)
        if idx in [1]:
            p.alignment = WD_ALIGN_PARAGRAPH.CENTER

    flow_table_data = [
        ("Student", "YES (Tab 1)", "Self-registers on /register as an Independent learner or chooses an enrolled college.", "Student Portal (/student/dashboard) to take tests and view scorecards."),
        ("Creator", "YES (Tab 2)", "Self-registers on /register as an independent educator/author.", "Creator Studio (/creator/dashboard) to build and publish public tests."),
        ("Org Admin", "YES (Tab 3)", "Self-registers institution details (College/School name) & admin credentials.", "Admin Portal (/admin/dashboard) to manage teachers, students & subscriptions."),
        ("Teacher", "NO (Restricted)", "Created & invited by their Org Admin inside the Admin Portal (/admin/teachers).", "Teacher Portal (/teacher/dashboard) to author class tests & question banks."),
        ("Super Admin", "NO (Restricted)", "Master Platform Owner. Pre-seeded directly into the database for cybersecurity.", "Super Admin Console (/superadmin/dashboard) for platform governance & billing.")
    ]

    for r_idx, (r_role, r_pub, r_how, r_dest) in enumerate(flow_table_data, start=1):
        row = tbl_reg_vs_login.rows[r_idx]
        bg = "F8FAFC" if r_idx % 2 == 0 else "FFFFFF"
        for c_idx, val in enumerate([r_role, r_pub, r_how, r_dest]):
            cell = row.cells[c_idx]
            cell.text = val
            cell.width = widths_flow[c_idx]
            set_cell_background(cell, bg)
            set_cell_margins(cell, top=100, bottom=100, left=100, right=100)
            p = cell.paragraphs[0]
            p.runs[0].font.size = Pt(8.5)
            if c_idx == 0:
                p.runs[0].font.bold = True
            elif c_idx == 1:
                p.alignment = WD_ALIGN_PARAGRAPH.CENTER
                if "YES" in val:
                    p.runs[0].font.bold = True
                    p.runs[0].font.color.rgb = COLOR_SUCCESS
                else:
                    p.runs[0].font.bold = True
                    p.runs[0].font.color.rgb = RGBColor(239, 68, 68)

    doc.add_paragraph().paragraph_format.space_after = Pt(12)

    # Explanation of the Universal Login
    add_custom_h2("A. The Universal Login Engine: One Single Login for All 5 Roles")
    p_uni = doc.add_paragraph()
    p_uni.paragraph_format.space_after = Pt(8)
    p_uni.paragraph_format.line_spacing = 1.15
    p_uni.add_run(
        "AssessIQ utilizes a Unified Authentication Architecture. There is only ONE login page in the entire system (/login).\n\n"
        "• No Need for Multiple Login URLs: A student does not visit a special 'student login' link, nor does an admin visit an 'admin login' link. "
        "Every user enters their email and password into the exact same login form.\n"
        "• Automatic Intelligent Role Routing: When the user submits the form, the Node.js backend validates their credentials, "
        "retrieves their authenticated role record from MongoDB (student, teacher, org_admin, test_creator, or super_admin), "
        "and responds with an encrypted JWT token. The React frontend immediately redirects the user to their respective secure dashboard.\n"
        "• Role-Based Guardrails: If a student attempts to type /admin/dashboard or /superadmin/dashboard in the browser address bar, "
        "the frontend ProtectedRoute component intercepts the request, blocks access, and redirects them to an Unauthorized error page."
    )

    # What are the Demo Buttons?
    add_custom_h2("B. Purpose of the 'Quick Demo Logins' on the Login Page")
    p_demo = doc.add_paragraph()
    p_demo.paragraph_format.space_after = Pt(8)
    p_demo.paragraph_format.line_spacing = 1.15
    p_demo.add_run(
        "On the /login page, you will notice five pill buttons labeled: [Student], [Org Admin], [Teacher], [Creator], and [Super Admin].\n"
        "These are Quick Demo Fill buttons engineered specifically for evaluators, project managers, and product reviewers. "
        "Clicking any of these pills automatically pre-fills the credentials of that role into the email and password inputs, "
        "allowing anyone to test and inspect all 5 distinct user experiences in seconds without having to memorize or manually type demo passwords."
    )

    # Step-by-Step Journeys
    add_custom_h2("C. Detailed Step-by-Step User Journeys for Each Role")

    journeys = [
        ("1. Student Journey (Learner)",
         "• Step 1 - Registration: The student visits /register, selects the [Student] tab, fills in Name, Email, Password, and optionally selects their college from the dropdown (or leaves it as 'Independent Student').\n"
         "• Step 2 - Sign In: After registration (or whenever returning), they visit /login and enter their email and password.\n"
         "• Step 3 - Dashboard Landing: The system recognizes role='student' and routes them to /student/dashboard.\n"
         "• Step 4 - Test Execution: The student browses 'Available Tests', filters between their College tests and Public tests, reads test instructions, and starts the timed assessment with live countdown anti-cheating.\n"
         "• Step 5 - Instant Feedback: Upon finishing (or automatic timer timeout), the student instantly views their result scorecard, circular score percentage, pass/fail status, and question-by-question explanations."),

        ("2. Test Creator Journey (Independent Author)",
         "• Step 1 - Registration: Visits /register, selects the [Creator] tab, fills in Name, Email, Password, and Phone Number.\n"
         "• Step 2 - Sign In: Visits /login with their creator credentials.\n"
         "• Step 3 - Dashboard Landing: System routes them to /creator/dashboard.\n"
         "• Step 4 - Authoring: The creator clicks 'Create New Test', sets test duration, passing marks, and subject tags, and adds multiple-choice questions with answer choices.\n"
         "• Step 5 - Publishing: The creator clicks 'Publish Test'. The test becomes immediately visible to all students across the platform in the Public Tests catalog."),

        ("3. Organization Administrator Journey (College / School Admin)",
         "• Step 1 - Registration: An authorized college representative visits /register, selects the [Org Admin] tab, enters their institution name (e.g. 'Stanford Academy'), institution type (College/University/School), and admin credentials.\n"
         "• Step 2 - Automatic Onboarding: The backend automatically creates the new Organization record and assigns this user as the Organization Administrator.\n"
         "• Step 3 - Dashboard Landing: The admin is routed to /admin/dashboard.\n"
         "• Step 4 - Faculty Provisioning: The admin navigates to /admin/teachers and clicks 'Add New Teacher' to create accounts for faculty members.\n"
         "• Step 5 - Oversight & Analytics: The admin tracks overall institution test participation, student pass rates, and monitors their organization's subscription quotas."),

        ("4. Teacher Journey (Institution Faculty Member)",
         "• Step 1 - Provisioning (No Public Registration): The teacher does NOT register on the public website. Their account is created by their college Org Admin inside the administration portal.\n"
         "• Step 2 - Sign In: The teacher visits the standard universal /login page and enters their issued email and password.\n"
         "• Step 3 - Dashboard Landing: The system detects role='teacher' and routes them to /teacher/dashboard.\n"
         "• Step 4 - Assessment Creation: The teacher creates tests assigned to their department/organization, enters questions with positive marks and negative penalties, and clicks 'Publish'.\n"
         "• Step 5 - Academic Grading: Teachers view class submission logs, average marks, and identify struggling students via the results breakdown."),

        ("5. Super Admin Journey (Master SaaS Platform Owner)",
         "• Step 1 - Root Setup (No Public Registration): As the master software operator, Super Admin accounts are pre-seeded in the database during system deployment for strict cybersecurity.\n"
         "• Step 2 - Sign In: Visits the universal /login page with master credentials.\n"
         "• Step 3 - Dashboard Landing: System recognizes role='super_admin' and opens the master console at /superadmin/dashboard.\n"
         "• Step 4 - Tenant Governance: Super Admin monitors all registered organizations, approves or suspends tenant accounts, and configures SaaS subscription tiers.\n"
         "• Step 5 - Platform Health: Super Admin tracks overall server load, global attempt numbers, and system-wide revenue.")
    ]

    for j_title, j_desc in journeys:
        p_j = doc.add_paragraph()
        p_j.paragraph_format.space_before = Pt(4)
        p_j.paragraph_format.space_after = Pt(8)
        p_j.paragraph_format.line_spacing = 1.15
        r_jt = p_j.add_run(j_title + "\n")
        r_jt.font.bold = True
        r_jt.font.size = Pt(11)
        r_jt.font.color.rgb = COLOR_SECONDARY
        r_jd = p_j.add_run(j_desc)
        r_jd.font.color.rgb = COLOR_TEXT

    doc.add_paragraph().paragraph_format.space_after = Pt(10)

    # =========================================================================
    # SECTION 3: MULTI-TENANCY IN SIMPLE WORDS
    # =========================================================================
    add_custom_h1("3. Multi-Tenancy Architecture Explained Simply")

    p2 = doc.add_paragraph()
    p2.paragraph_format.space_after = Pt(10)
    p2.paragraph_format.line_spacing = 1.15
    p2.add_run(
        "To explain multi-tenancy to business leaders or institutional clients, it is helpful to use the Real Estate Metaphor:\n\n"
        "• The Apartment Complex (The SaaS Application & Server): The shared foundations, elevators, water supply, and security gates represent the shared React frontend, Node.js API, and database cluster.\n"
        "• The Individual Apartments (The Tenant Organizations): 'Apex Engineering College' and 'Greenwood High School' each have their own private apartment with their own private keys. A teacher or student from Greenwood High School can never unlock Apex College's apartment or view their tests, questions, or grades.\n"
        "• The Public Park (Public Certification Catalog): Independent students and educators can also interact in the common public catalog to take open tests, completely separate from private institutional exams."
    )

    doc.add_paragraph().paragraph_format.space_after = Pt(10)

    # =========================================================================
    # SECTION 4: ROLE-BY-ROLE BREAKDOWN & CAPABILITY MATRIX
    # =========================================================================
    add_custom_h1("4. Comprehensive Functional Role Matrix")

    table_matrix = doc.add_table(rows=7, cols=6)
    table_matrix.alignment = WD_TABLE_ALIGNMENT.CENTER
    table_matrix.autofit = False

    headers = ["Capability / Feature", "Super Admin", "Org Admin", "Teacher", "Student", "Creator"]
    col_widths = [Inches(2.2), Inches(0.85), Inches(0.85), Inches(0.85), Inches(0.85), Inches(0.85)]

    # Header Row
    hdr_cells = table_matrix.rows[0].cells
    for i, title in enumerate(headers):
        hdr_cells[i].text = title
        hdr_cells[i].width = col_widths[i]
        set_cell_background(hdr_cells[i], "1E1B4B")  # dark navy
        set_cell_margins(hdr_cells[i], top=120, bottom=120, left=100, right=100)
        p = hdr_cells[i].paragraphs[0]
        p.runs[0].font.bold = True
        p.runs[0].font.color.rgb = RGBColor(255, 255, 255)
        p.runs[0].font.size = Pt(9)
        p.alignment = WD_ALIGN_PARAGRAPH.CENTER if i > 0 else WD_ALIGN_PARAGRAPH.LEFT

    matrix_data = [
        ("Manage Tenant Orgs & Subscriptions", "YES", "NO", "NO", "NO", "NO"),
        ("Provision Teachers & Student Rosters", "YES", "YES", "NO", "NO", "NO"),
        ("Author & Publish Tests", "YES", "YES", "YES", "NO", "YES (Public)"),
        ("Take Exams & View Instant Scores", "NO", "NO", "NO", "YES", "NO"),
        ("Live Anti-Cheating Countdown Timers", "YES", "YES", "YES", "YES", "YES"),
        ("Analytics Scope", "Global Platform", "Entire College", "Assigned Classes", "Own Attempts", "Own Tests")
    ]

    for row_idx, row_data in enumerate(matrix_data, start=1):
        row_cells = table_matrix.rows[row_idx].cells
        bg_color = "F8FAFC" if row_idx % 2 == 0 else "FFFFFF"
        for col_idx, val in enumerate(row_data):
            row_cells[col_idx].text = val
            row_cells[col_idx].width = col_widths[col_idx]
            set_cell_background(row_cells[col_idx], bg_color)
            set_cell_margins(row_cells[col_idx], top=100, bottom=100, left=100, right=100)
            p = row_cells[col_idx].paragraphs[0]
            p.runs[0].font.size = Pt(8.5)
            if col_idx > 0:
                p.alignment = WD_ALIGN_PARAGRAPH.CENTER
                if "YES" in val:
                    p.runs[0].font.bold = True
                    p.runs[0].font.color.rgb = COLOR_SUCCESS
                elif val == "NO":
                    p.runs[0].font.color.rgb = RGBColor(156, 163, 175)

    doc.add_paragraph().paragraph_format.space_after = Pt(12)

    # =========================================================================
    # SECTION 5: TECHNICAL STACK & ARCHITECTURAL ADVANTAGES
    # =========================================================================
    add_custom_h1("5. Technical Stack & Enterprise Security Architecture")

    p5 = doc.add_paragraph()
    p5.paragraph_format.space_after = Pt(8)
    p5.paragraph_format.line_spacing = 1.15
    p5.add_run(
        "AssessIQ is built upon the robust, modern MERN (MongoDB, Express, React, Node.js) technology stack, adhering to industry standards for high availability and low latency:\n\n"
        "• Modern React Frontend (Vite + Modular CSS): Delivers instant build refreshes, zero bundle bloat, responsive layouts across mobile phones, tablets, and desktop workstations, and a modern glassmorphic visual language.\n"
        "• Node.js & Express REST Backend: Stateless JSON Web Token (JWT) authorization, automated bcrypt password hashing (10 salt rounds), structured controller-service architecture, and centralized error logging.\n"
        "• MongoDB Multi-Tenant Quarantine: Every critical collection (Users, Tests, Questions, Attempts, Results) enforces tenant scoping via indexed organizationId foreign keys, preventing cross-tenant leakage.\n"
        "• Tamper-Proof Server-Side Grading: Correct answers are never sent to the student's browser during an active exam. Evaluation happens strictly server-side upon attempt completion, preventing client-side inspection hacks.\n"
        "• Fraction Penalty Scoring: Full support for customizable negative marking (e.g., -0.25 or -1.0 penalty per wrong choice) to mirror national competitive exam standards (SAT, GRE, JEE, NEET, UPSC)."
    )

    doc.add_paragraph().paragraph_format.space_after = Pt(10)

    # =========================================================================
    # SECTION 6: EXECUTIVE TALKING POINTS (MANAGER Q&A)
    # =========================================================================
    add_custom_h1("6. Executive Talking Points (Manager Q&A)")

    qa_items = [
        ("Q: Why not just use Google Forms or WordPress quiz plugins?",
         "A: Google Forms and generic quiz tools offer zero tenant data isolation, no server-validated anti-cheating countdown timers with auto-submit, no role-based permission tiers (Super Admin vs Org Admin vs Teacher vs Student), no automated negative marking, and no multi-institution subscription monetization engine."),
        ("Q: What happens if a student's internet drops during an active test?",
         "A: Every question answered is saved dynamically in real-time. When the student reconnects, their active attempt is restored with the exact remaining server timestamp, preventing loss of progress."),
        ("Q: How does the platform generate revenue as a commercial product?",
         "A: The Super Admin defines monthly and annual subscription plans (Starter, Growth, Enterprise) based on student enrollment limits, teacher seats, and total test authoring quotas. Educational institutions pay recurring SaaS fees for platform access."),
        ("Q: Can a college prevent students from seeing test questions before the exam starts?",
         "A: Yes. Teachers author questions in a private draft state. Only when the teacher or admin explicitly triggers 'Publish' does the test become active, and test questions are only delivered one-by-one or in session upon the student clicking 'Start Exam'.")
    ]

    for q, a in qa_items:
        p_qa = doc.add_paragraph()
        p_qa.paragraph_format.space_after = Pt(8)
        p_qa.paragraph_format.line_spacing = 1.15
        r_q = p_qa.add_run(q + "\n")
        r_q.font.bold = True
        r_q.font.color.rgb = COLOR_SECONDARY
        r_a = p_qa.add_run(a)
        r_a.font.color.rgb = COLOR_TEXT

    # Footer note
    doc.add_paragraph().paragraph_format.space_after = Pt(16)
    p_footer = doc.add_paragraph()
    p_footer.alignment = WD_ALIGN_PARAGRAPH.CENTER
    r_foot = p_footer.add_run("— AssessIQ Comprehensive Executive & Functional Role Architecture Guide —\nPrepared for Senior Management, Investors & Product Stakeholders")
    r_foot.font.italic = True
    r_foot.font.size = Pt(9.5)
    r_foot.font.color.rgb = COLOR_MUTED

    # File saving locations:
    filename = "AssessIQ_Project_Overview_For_Manager.docx"
    
    root_path = os.path.join(os.getcwd(), filename)
    doc.save(root_path)
    print(f"[1] Saved to Project Root: {root_path}")

    frontend_public = os.path.join(os.getcwd(), "frontend", "public", filename)
    shutil.copy2(root_path, frontend_public)
    print(f"[2] Copied to Frontend Public (Downloadable via URL): {frontend_public}")

    user_downloads = os.path.join(r"C:\Users\hp\Downloads", filename)
    try:
        shutil.copy2(root_path, user_downloads)
        print(f"[3] Copied to User Downloads Folder: {user_downloads}")
    except Exception as e:
        print(f"[!] Could not copy to Downloads: {e}")

    artifact_dir = r"C:\Users\hp\.gemini\antigravity-ide\brain\244d091b-c0b9-46dd-af7d-107c29f99232"
    if os.path.exists(artifact_dir):
        artifact_path = os.path.join(artifact_dir, filename)
        shutil.copy2(root_path, artifact_path)
        print(f"[4] Copied to Artifact Directory: {artifact_path}")

if __name__ == "__main__":
    create_document()
