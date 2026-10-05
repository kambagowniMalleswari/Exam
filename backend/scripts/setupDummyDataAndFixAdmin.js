import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, "../.env") });

import User from "../models/User.js";
import Organization from "../models/Organization.js";
import Batch from "../models/Batch.js";
import Test from "../models/Test.js";
import Question from "../models/Question.js";
import Attempt from "../models/Attempt.js";
import Result from "../models/Result.js";

async function run() {
  try {
    console.log("Connecting to MongoDB Atlas...");
    await mongoose.connect(process.env.MONGO_URI);
    console.log("Connected successfully!");

    // 1. Ensure kambagownikmalleswari@gmail.com is Platform Super Admin
    await User.findOneAndUpdate(
      { email: "kambagownikmalleswari@gmail.com" },
      { $set: { role: "super_admin", organizationId: null, status: "active", isActive: true } }
    );

    // 2. Ensure we have an active Organization for testing
    let org = await Organization.findOne({ slug: "it-academy" });
    if (!org) {
      org = await Organization.create({
        name: "IT Academy of Technology",
        slug: "it-academy",
        type: "College",
        adminName: "IT Academy Administrator",
        email: "contact@itacademy.edu",
        phone: "9876543211",
        city: "Hyderabad",
        state: "Telangana",
        country: "India",
        status: "active",
        isActive: true,
        subscriptionPlan: "pro",
        subscriptionStatus: "active"
      });
      console.log("Created testing Organization:", org.name);
    } else {
      org.status = "active";
      org.isActive = true;
      await org.save();
      console.log("Using existing Organization:", org.name, org._id.toString());
    }

    const defaultHashedPassword = await bcrypt.hash("Admin@12345", 10);
    const teacherPassword = await bcrypt.hash("Teacher@12345", 10);
    const studentPassword = await bcrypt.hash("Student@12345", 10);

    // 3. Create / Ensure Org Admin
    let orgAdmin = await User.findOne({ email: "orgadmin.itacademy@gmail.com" });
    if (!orgAdmin) {
      orgAdmin = await User.create({
        name: "Rajesh Sharma (Org Admin)",
        email: "orgadmin.itacademy@gmail.com",
        phone: "9876543220",
        password: defaultHashedPassword,
        role: "org_admin",
        organizationId: org._id,
        status: "active",
        isActive: true
      });
      console.log("Created Org Admin:", orgAdmin.email);
    } else {
      orgAdmin.organizationId = org._id;
      orgAdmin.role = "org_admin";
      orgAdmin.status = "active";
      orgAdmin.isActive = true;
      await orgAdmin.save();
      console.log("Ensured Org Admin:", orgAdmin.email);
    }

    // 4. Create / Ensure Faculty / Teacher
    let teacher = await User.findOne({ email: "teacher.cs@itacademy.edu" });
    if (!teacher) {
      teacher = await User.create({
        name: "Dr. Ananya Rao (Faculty)",
        email: "teacher.cs@itacademy.edu",
        phone: "9876543230",
        password: teacherPassword,
        role: "teacher",
        subject: "Computer Science",
        organizationId: org._id,
        status: "active",
        isActive: true
      });
      console.log("Created Teacher:", teacher.email);
    } else {
      teacher.organizationId = org._id;
      teacher.role = "teacher";
      teacher.subject = "Computer Science";
      teacher.status = "active";
      teacher.isActive = true;
      await teacher.save();
      console.log("Ensured Teacher:", teacher.email);
    }

    // 5. Create / Ensure 3 Students
    const studentData = [
      { name: "Aarav Patel", email: "student.aarav@itacademy.edu", phone: "9876543241" },
      { name: "Diya Reddy", email: "student.diya@itacademy.edu", phone: "9876543242" },
      { name: "Kiran Kumar", email: "student.kiran@itacademy.edu", phone: "9876543243" }
    ];

    const students = [];
    for (const s of studentData) {
      let stu = await User.findOne({ email: s.email });
      if (!stu) {
        stu = await User.create({
          name: s.name,
          email: s.email,
          phone: s.phone,
          password: studentPassword,
          role: "student",
          organizationId: org._id,
          status: "active",
          isActive: true
        });
        console.log("Created Student:", stu.email);
      } else {
        stu.organizationId = org._id;
        stu.role = "student";
        stu.status = "active";
        stu.isActive = true;
        await stu.save();
      }
      students.push(stu);
    }

    // 6. Create Batch / Academic Cohort
    let batch = await Batch.findOne({ batchNumber: "CS-2026-ALPHA" });
    if (!batch) {
      batch = await Batch.create({
        name: "Computer Science Alpha Cohort 2026",
        batchNumber: "CS-2026-ALPHA",
        organizationId: org._id,
        createdBy: teacher._id,
        description: "Primary cohort for CS core evaluations and assessments",
        maxStudents: 60,
        enrollmentType: "open",
        status: "active",
        isActive: true,
        isPublished: true,
        tests: []
      });
      console.log("Created Batch:", batch.name);
    }

    // Enroll students into the batch
    for (const stu of students) {
      stu.batchId = batch._id;
      stu.batchNumber = batch.batchNumber;
      await stu.save();
    }
    console.log("Enrolled 3 students into batch:", batch.batchNumber);

    // 7. Create 3 to 4 Dummy Tests with Questions
    const testTemplates = [
      {
        title: "Full-Stack Web Development & Modern React",
        subject: "Web Development",
        category: "Software Engineering",
        duration: 45,
        totalMarks: 30,
        passingPercentage: 50,
        type: "private",
        status: "published",
        questions: [
          {
            questionText: "What hook is used to perform side effects in modern React applications?",
            options: [
              { key: "A", text: "useState" },
              { key: "B", text: "useEffect" },
              { key: "C", text: "useContext" },
              { key: "D", text: "useReducer" }
            ],
            correctAnswer: "B",
            marks: 10,
            explanation: "useEffect is specifically intended to handle asynchronous tasks, subscriptions, and DOM mutations."
          },
          {
            questionText: "Which HTTP status code signifies that a resource was successfully created on the server?",
            options: [
              { key: "A", text: "200 OK" },
              { key: "B", text: "201 Created" },
              { key: "C", text: "204 No Content" },
              { key: "D", text: "301 Moved Permanently" }
            ],
            correctAnswer: "B",
            marks: 10,
            explanation: "HTTP 201 Created is the standard REST status code returned after a successful POST request creating an entity."
          },
          {
            questionText: "In Node.js Express, which middleware parses incoming request bodies with JSON payloads?",
            options: [
              { key: "A", text: "express.urlencoded()" },
              { key: "B", text: "express.json()" },
              { key: "C", text: "express.static()" },
              { key: "D", text: "express.router()" }
            ],
            correctAnswer: "B",
            marks: 10,
            explanation: "express.json() parses incoming requests with JSON payloads and is based on body-parser."
          }
        ]
      },
      {
        title: "Database Systems & MongoDB Architecture",
        subject: "Database Management",
        category: "Databases",
        duration: 30,
        totalMarks: 30,
        passingPercentage: 40,
        type: "private",
        status: "published",
        questions: [
          {
            questionText: "Which MongoDB aggregation stage is used to filter documents before grouping?",
            options: [
              { key: "A", text: "$project" },
              { key: "B", text: "$match" },
              { key: "C", text: "$group" },
              { key: "D", text: "$sort" }
            ],
            correctAnswer: "B",
            marks: 10,
            explanation: "$match filters documents in the aggregation pipeline similarly to a standard find query."
          },
          {
            questionText: "What type of index does MongoDB automatically create on the _id field of every document?",
            options: [
              { key: "A", text: "Unique Single Field Index" },
              { key: "B", text: "Compound Index" },
              { key: "C", text: "Geospatial Index" },
              { key: "D", text: "Text Index" }
            ],
            correctAnswer: "A",
            marks: 10,
            explanation: "MongoDB automatically provisions an ascending unique index on the _id field during collection initialization."
          },
          {
            questionText: "Which method in Mongoose bypasses document hydration for substantially faster query performance?",
            options: [
              { key: "A", text: ".exec()" },
              { key: "B", text: ".lean()" },
              { key: "C", text: ".hydrate()" },
              { key: "D", text: ".toObject()" }
            ],
            correctAnswer: "B",
            marks: 10,
            explanation: ".lean() instructs Mongoose to return plain JavaScript objects instead of Mongoose Documents, saving memory and CPU cycles."
          }
        ]
      },
      {
        title: "Data Structures & Algorithmic Complexity",
        subject: "Algorithms",
        category: "Computer Science",
        duration: 40,
        totalMarks: 30,
        passingPercentage: 40,
        type: "public",
        status: "published",
        questions: [
          {
            questionText: "What is the average time complexity of searching in a balanced Binary Search Tree (BST)?",
            options: [
              { key: "A", text: "O(1)" },
              { key: "B", text: "O(log n)" },
              { key: "C", text: "O(n)" },
              { key: "D", text: "O(n log n)" }
            ],
            correctAnswer: "B",
            marks: 10,
            explanation: "In a balanced BST, each comparison halves the search space, giving logarithmic time complexity O(log n)."
          },
          {
            questionText: "Which data structure follows the Last-In, First-Out (LIFO) order?",
            options: [
              { key: "A", text: "Queue" },
              { key: "B", text: "Stack" },
              { key: "C", text: "Array" },
              { key: "D", text: "Linked List" }
            ],
            correctAnswer: "B",
            marks: 10,
            explanation: "A Stack strictly operates on the LIFO principle."
          },
          {
            questionText: "Which sorting algorithm has a guaranteed worst-case time complexity of O(n log n)?",
            options: [
              { key: "A", text: "Quick Sort" },
              { key: "B", text: "Merge Sort" },
              { key: "C", text: "Bubble Sort" },
              { key: "D", text: "Insertion Sort" }
            ],
            correctAnswer: "B",
            marks: 10,
            explanation: "Merge Sort always divides the array evenly and merges in linear time, guaranteeing O(n log n) even in worst case."
          }
        ]
      },
      {
        title: "Python Programming & Core Fundamentals",
        subject: "Programming",
        category: "Languages",
        duration: 30,
        totalMarks: 30,
        passingPercentage: 40,
        type: "private",
        status: "published",
        questions: [
          {
            questionText: "Which keyword is used to create an anonymous inline function in Python?",
            options: [
              { key: "A", text: "def" },
              { key: "B", text: "lambda" },
              { key: "C", text: "function" },
              { key: "D", text: "anonymous" }
            ],
            correctAnswer: "B",
            marks: 10,
            explanation: "lambda is the keyword for creating small anonymous functions in Python."
          },
          {
            questionText: "What is the output of type((1,)) in Python?",
            options: [
              { key: "A", text: "int" },
              { key: "B", text: "tuple" },
              { key: "C", text: "set" },
              { key: "D", text: "list" }
            ],
            correctAnswer: "B",
            marks: 10,
            explanation: "A trailing comma inside parentheses designates a single-element tuple."
          },
          {
            questionText: "Which built-in Python function returns both the index and value when iterating over a list?",
            options: [
              { key: "A", text: "zip()" },
              { key: "B", text: "enumerate()" },
              { key: "C", text: "range()" },
              { key: "D", text: "map()" }
            ],
            correctAnswer: "B",
            marks: 10,
            explanation: "enumerate() returns pairs of (index, element) during iteration."
          }
        ]
      }
    ];

    const createdTestIds = [];
    for (const t of testTemplates) {
      let testRecord = await Test.findOne({ title: t.title });
      if (!testRecord) {
        testRecord = await Test.create({
          title: t.title,
          description: `Comprehensive evaluation covering core principles of ${t.subject}.`,
          subject: t.subject,
          category: t.category,
          duration: t.duration,
          totalMarks: t.totalMarks,
          totalQuestions: t.questions.length,
          passingPercentage: t.passingPercentage,
          type: t.type,
          status: t.status,
          organizationId: t.type === "private" ? org._id : null,
          createdBy: teacher._id,
          targetBatches: [batch._id],
          numberOfAttempts: 3,
          attemptMode: "best_of_n",
          instructions: "Read every question carefully before selecting an answer."
        });

        // Insert questions
        for (let i = 0; i < t.questions.length; i++) {
          const q = t.questions[i];
          await Question.create({
            testId: testRecord._id,
            organizationId: testRecord.organizationId,
            questionText: q.questionText,
            options: q.options,
            correctAnswer: q.correctAnswer,
            marks: q.marks,
            negativeMarks: 0,
            order: i + 1,
            explanation: q.explanation
          });
        }
        console.log(`Created Test: "${t.title}" with ${t.questions.length} questions.`);
      } else {
        console.log(`Test already exists: "${t.title}"`);
      }
      createdTestIds.push(testRecord._id);
    }

    // Attach tests to batch
    batch.tests = createdTestIds;
    await batch.save();
    console.log("Attached tests to batch:", batch.name);

    // 8. Simulate completed test attempts and results for analytics
    const test1 = await Test.findById(createdTestIds[0]);
    const questions1 = await Question.find({ testId: test1._id });

    // Aarav attempts Test 1 and passes with 30/30 (100%)
    let existingAttempt = await Attempt.findOne({ testId: test1._id, studentId: students[0]._id });
    if (!existingAttempt) {
      const attempt1 = await Attempt.create({
        testId: test1._id,
        studentId: students[0]._id,
        organizationId: org._id,
        answers: questions1.map(q => ({
          questionId: q._id,
          selectedAnswer: q.correctAnswer,
          isFlagged: false
        })),
        status: "evaluated",
        score: 30,
        totalMarks: 30,
        percentage: 100,
        passed: true,
        passingPercentage: 50,
        timeTaken: 1200,
        startedAt: new Date(Date.now() - 1800000),
        submittedAt: new Date()
      });

      await Result.create({
        attemptId: attempt1._id,
        testId: test1._id,
        studentId: students[0]._id,
        organizationId: org._id,
        score: 30,
        totalMarks: 30,
        percentage: 100,
        passed: true,
        correctCount: 3,
        incorrectCount: 0,
        unansweredCount: 0
      });
      console.log("Simulated 100% passed result for Student Aarav on Test 1");
    }

    // Diya attempts Test 1 and gets 20/30 (66.7%)
    let attemptDiya = await Attempt.findOne({ testId: test1._id, studentId: students[1]._id });
    if (!attemptDiya) {
      const attempt2 = await Attempt.create({
        testId: test1._id,
        studentId: students[1]._id,
        organizationId: org._id,
        answers: questions1.map((q, idx) => ({
          questionId: q._id,
          selectedAnswer: idx === 2 ? "A" : q.correctAnswer,
          isFlagged: false
        })),
        status: "evaluated",
        score: 20,
        totalMarks: 30,
        percentage: 66.67,
        passed: true,
        passingPercentage: 50,
        timeTaken: 1500,
        startedAt: new Date(Date.now() - 1500000),
        submittedAt: new Date()
      });

      await Result.create({
        attemptId: attempt2._id,
        testId: test1._id,
        studentId: students[1]._id,
        organizationId: org._id,
        score: 20,
        totalMarks: 30,
        percentage: 66.67,
        passed: true,
        correctCount: 2,
        incorrectCount: 1,
        unansweredCount: 0
      });
      console.log("Simulated 66.7% passed result for Student Diya on Test 1");
    }

    console.log("==================================================");
    console.log("SETUP & SEEDING COMPLETED SUCCESSFULLY!");
    console.log("==================================================");
    console.log("Credentials Summary:");
    console.log("1. Super Admin: kambagownikmalleswari@gmail.com (Password: Admin@145)");
    console.log("2. Org Admin:   orgadmin.itacademy@gmail.com (Password: Admin@12345)");
    console.log("3. Teacher:     teacher.cs@itacademy.edu (Password: Teacher@12345)");
    console.log("4. Student:     student.aarav@itacademy.edu (Password: Student@12345)");
    console.log("5. Student:     student.diya@itacademy.edu (Password: Student@12345)");
    console.log("6. Student:     student.kiran@itacademy.edu (Password: Student@12345)");
    console.log("==================================================");
  } catch (err) {
    console.error("Setup error:", err);
  } finally {
    await mongoose.disconnect();
  }
}

run();
