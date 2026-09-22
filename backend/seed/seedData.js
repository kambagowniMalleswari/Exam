// Seed script for initial SaaS data
import dotenv from "dotenv";
import bcrypt from "bcryptjs";
import mongoose from "mongoose";

import User from "../models/User.js";
import Organization from "../models/Organization.js";
import Test from "../models/Test.js";
import Question from "../models/Question.js";
import Attempt from "../models/Attempt.js";
import Result from "../models/Result.js";
import Subscription from "../models/Subscription.js";
import { evaluateAttempt } from "../utils/calculateResult.js";

dotenv.config();

const seedDatabase = async () => {
  try {
    const mongoUri = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/multi_tenant_mcq_portal";
    await mongoose.connect(mongoUri);
    console.log("Connected to MongoDB for seeding...");

    // Clean up existing collections
    await Promise.all([
      User.deleteMany({}),
      Organization.deleteMany({}),
      Test.deleteMany({}),
      Question.deleteMany({}),
      Attempt.deleteMany({}),
      Result.deleteMany({}),
      Subscription.deleteMany({})
    ]);
    console.log("Cleared existing collections.");

    const defaultPassword = await bcrypt.hash("password123", 10);
    const adminPassword = await bcrypt.hash("Admin@1234", 10);

    // 1. Create Super Admin
    const superAdmin = await User.create({
      name: "Malleswari (Super Admin)",
      email: "kambagownikmalleswari@gmail.com",
      phone: "9876543210",
      password: adminPassword,
      role: "super_admin",
      organizationId: null,
      status: "active",
      isActive: true
    });
    console.log("Created Super Admin:", superAdmin.email);

    // 2. Create Organization 1: Apex University
    const apexOrg = await Organization.create({
      name: "Apex University",
      slug: "apex-university",
      type: "University",
      adminName: "Dr. Sarah Jenkins",
      email: "admin@apexuniv.edu",
      phone: "9876500001",
      address: "100 Science Parkway",
      city: "San Francisco",
      state: "CA",
      country: "USA",
      status: "active",
      isActive: true,
      subscriptionPlan: "pro",
      subscriptionStatus: "active"
    });

    // Create Subscription for Apex University
    await Subscription.create({
      organizationId: apexOrg._id,
      plan: "pro",
      status: "active",
      maxTests: 100,
      maxStudents: 2500,
      price: 79,
      features: ["100 Tests", "2,500 Students", "Advanced Analytics", "Question Bank", "Custom Certificates"]
    });

    // Organization Admin
    const orgAdmin = await User.create({
      name: "Dr. Sarah Jenkins",
      email: "admin@apexuniv.edu",
      phone: "9876500001",
      password: defaultPassword,
      role: "org_admin",
      organizationId: apexOrg._id,
      status: "active",
      isActive: true
    });

    // Teacher
    const teacher = await User.create({
      name: "Prof. Alan Turing",
      email: "teacher@apexuniv.edu",
      phone: "9876500002",
      password: defaultPassword,
      role: "teacher",
      organizationId: apexOrg._id,
      createdBy: orgAdmin._id,
      status: "active",
      isActive: true
    });

    // Students
    const student1 = await User.create({
      name: "Alex Johnson",
      email: "alex@apexuniv.edu",
      phone: "9876500003",
      password: defaultPassword,
      role: "student",
      organizationId: apexOrg._id,
      createdBy: orgAdmin._id,
      status: "active",
      isActive: true
    });

    const student2 = await User.create({
      name: "Emma Watson",
      email: "emma@apexuniv.edu",
      phone: "9876500004",
      password: defaultPassword,
      role: "student",
      organizationId: apexOrg._id,
      createdBy: orgAdmin._id,
      status: "active",
      isActive: true
    });

    // 3. Create Senior Faculty Teacher
    const testCreator = await User.create({
      name: "David CodeMaster",
      email: "david.teacher@apexuniv.edu",
      phone: "9876500005",
      password: defaultPassword,
      role: "teacher",
      subject: "Web Development",
      organizationId: apexOrg._id,
      createdBy: orgAdmin._id,
      status: "active",
      isActive: true
    });
    console.log("Created Users & Organizations.");

    // 4. Create Organization Tests
    const test1 = await Test.create({
      title: "Full-Stack JavaScript & MERN Architecture",
      description: "Comprehensive assessment on Node.js, Express, React state management, and MongoDB query optimization.",
      subject: "Computer Science",
      duration: 25,
      totalMarks: 40,
      passingMarks: 20,
      passingPercentage: 50,
      numberOfAttempts: 2,
      type: "private",
      status: "published",
      instructions: "4 questions, 10 marks each. Negative marking of 2.5 marks applies for incorrect choices.",
      organizationId: apexOrg._id,
      createdBy: teacher._id,
      publishedAt: new Date()
    });

    const q1 = await Question.create({
      testId: test1._id,
      organizationId: apexOrg._id,
      questionText: "What is the primary role of indexing in MongoDB?",
      options: [
        { key: "A", text: "Encrypt stored documents on disk" },
        { key: "B", text: "Significantly increase query execution speed" },
        { key: "C", text: "Enforce strict relational schemas across tables" },
        { key: "D", text: "Automatically backup collections to cloud storage" }
      ],
      correctAnswer: "Significantly increase query execution speed",
      marks: 10,
      negativeMarks: 2.5,
      order: 1,
      explanation: "Indexes support the efficient execution of queries in MongoDB by storing a small portion of the collection's data set in an easy to traverse form."
    });

    const q2 = await Question.create({
      testId: test1._id,
      organizationId: apexOrg._id,
      questionText: "Which middleware in Express is standard for parsing incoming JSON request bodies?",
      options: [
        { key: "A", text: "express.urlencoded()" },
        { key: "B", text: "express.static()" },
        { key: "C", text: "express.json()" },
        { key: "D", text: "cors()" }
      ],
      correctAnswer: "express.json()",
      marks: 10,
      negativeMarks: 2.5,
      order: 2,
      explanation: "express.json() is a built-in middleware function in Express that parses incoming requests with JSON payloads."
    });

    const q3 = await Question.create({
      testId: test1._id,
      organizationId: apexOrg._id,
      questionText: "In React, which hook is primarily used for handling asynchronous side effects?",
      options: [
        { key: "A", text: "useMemo" },
        { key: "B", text: "useEffect" },
        { key: "C", text: "useCallback" },
        { key: "D", text: "useReducer" }
      ],
      correctAnswer: "useEffect",
      marks: 10,
      negativeMarks: 2.5,
      order: 3,
      explanation: "useEffect lets you synchronize a component with external systems such as network requests, timers, or the DOM."
    });

    const q4 = await Question.create({
      testId: test1._id,
      organizationId: apexOrg._id,
      questionText: "How does JWT (JSON Web Token) guarantee stateless authentication?",
      options: [
        { key: "A", text: "By storing session records in database cache" },
        { key: "B", text: "By verifying the cryptographic signature without querying session tables on every request" },
        { key: "C", text: "By relying exclusively on browser cookies" },
        { key: "D", text: "By expiring the user session every 60 seconds" }
      ],
      correctAnswer: "By verifying the cryptographic signature without querying session tables on every request",
      marks: 10,
      negativeMarks: 2.5,
      order: 4,
      explanation: "JWT is self-contained: the server validates authenticity using its secret key without querying session databases."
    });

    // 5. Create Public Test by Creator
    const publicTest = await Test.create({
      title: "General Web Technologies Certification Exam",
      description: "Public assessment covering modern web standards, HTTP protocol, security, and responsive design.",
      subject: "Web Development",
      duration: 15,
      totalMarks: 30,
      passingMarks: 15,
      passingPercentage: 50,
      numberOfAttempts: 3,
      type: "public",
      status: "published",
      instructions: "Open to everyone. Answer all questions to obtain your verified performance score.",
      organizationId: null,
      createdBy: testCreator._id,
      publishedAt: new Date()
    });

    await Question.create({
      testId: publicTest._id,
      organizationId: null,
      questionText: "What does HTTP status code 403 signify?",
      options: [
        { key: "A", text: "Resource Not Found" },
        { key: "B", text: "Forbidden (Access Denied)" },
        { key: "C", text: "Internal Server Error" },
        { key: "D", text: "Unauthorized (Missing Auth)" }
      ],
      correctAnswer: "Forbidden (Access Denied)",
      marks: 10,
      negativeMarks: 2,
      order: 1,
      explanation: "HTTP 403 Forbidden indicates the server understood the request but refuses to authorize it."
    });

    await Question.create({
      testId: publicTest._id,
      organizationId: null,
      questionText: "Which CSS property is used to create a flexible box container layout?",
      options: [
        { key: "A", text: "display: block" },
        { key: "B", text: "display: flex" },
        { key: "C", text: "float: left" },
        { key: "D", text: "position: absolute" }
      ],
      correctAnswer: "display: flex",
      marks: 10,
      negativeMarks: 2,
      order: 2,
      explanation: "display: flex enables flexbox formatting context for responsive layout design."
    });

    await Question.create({
      testId: publicTest._id,
      organizationId: null,
      questionText: "Which HTTP header is utilized by web servers to prevent cross-site scripting (XSS) and unauthorized iframe embedding?",
      options: [
        { key: "A", text: "Content-Security-Policy" },
        { key: "B", text: "Accept-Encoding" },
        { key: "C", text: "User-Agent" },
        { key: "D", text: "Cache-Control" }
      ],
      correctAnswer: "Content-Security-Policy",
      marks: 10,
      negativeMarks: 2,
      order: 3,
      explanation: "Content-Security-Policy (CSP) allows site administrators to restrict the resources browsers are allowed to load."
    });

    // 6. Simulate Completed Attempt & Result for Student 1
    const test1Questions = [q1, q2, q3, q4];
    const student1Answers = [
      { questionId: q1._id, selectedAnswer: "Significantly increase query execution speed" },
      { questionId: q2._id, selectedAnswer: "express.json()" },
      { questionId: q3._id, selectedAnswer: "useEffect" },
      { questionId: q4._id, selectedAnswer: "By storing session records in database cache" } // 1 wrong answer
    ];

    const startedAt = new Date(Date.now() - 12 * 60 * 1000); // 12 mins ago
    const submittedAt = new Date(Date.now() - 2 * 60 * 1000); // 2 mins ago

    const evaluation = evaluateAttempt(
      test1Questions,
      student1Answers,
      test1,
      startedAt,
      submittedAt
    );

    const attempt1 = await Attempt.create({
      testId: test1._id,
      studentId: student1._id,
      organizationId: apexOrg._id,
      answers: student1Answers,
      status: "evaluated",
      startedAt,
      submittedAt,
      score: evaluation.score,
      totalMarks: evaluation.totalMarks,
      percentage: evaluation.percentage,
      passed: evaluation.passed,
      timeTaken: evaluation.timeTaken
    });

    await Result.create({
      attemptId: attempt1._id,
      testId: test1._id,
      studentId: student1._id,
      organizationId: apexOrg._id,
      totalQuestions: evaluation.totalQuestions,
      correctAnswers: evaluation.correctAnswers,
      wrongAnswers: evaluation.wrongAnswers,
      unanswered: evaluation.unanswered,
      totalMarks: evaluation.totalMarks,
      score: evaluation.score,
      percentage: evaluation.percentage,
      passed: evaluation.passed,
      result: evaluation.result,
      timeTaken: evaluation.timeTaken,
      questionBreakdown: evaluation.questionBreakdown,
      evaluatedAt: submittedAt
    });

    console.log("Database seeded successfully with all models, tests, questions, and evaluated attempt!");
    await mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error("Seeding error:", error);
    await mongoose.connection.close();
    process.exit(1);
  }
};

seedDatabase();
