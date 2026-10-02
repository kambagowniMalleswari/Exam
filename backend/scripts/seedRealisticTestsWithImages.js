// Script to add cover images to all existing tests and seed realistic public tests
import dotenv from "dotenv";
import mongoose from "mongoose";
import Test from "../models/Test.js";
import Question from "../models/Question.js";
import User from "../models/User.js";
import Organization from "../models/Organization.js";

dotenv.config();

const seedTests = async () => {
  try {
    console.log("Connecting to MongoDB...");
    await mongoose.connect(process.env.MONGO_URI);
    console.log("Connected successfully.");

    // Find an author user (super admin or teacher or org admin)
    let authorUser = await User.findOne({ role: { $in: ["super_admin", "admin", "org_admin", "teacher"] } });
    if (!authorUser) {
      authorUser = await User.findOne({});
    }

    const org = await Organization.findOne({ status: "active" });
    const orgId = org ? org._id : null;

    console.log(`Using Author: ${authorUser?.name} (${authorUser?.email}), Org: ${org?.name || "Global"}`);

    // 1. Update existing tests with real cover images and professional titles
    const updates = [
      {
        query: { title: /Full-Stack Web Development/i },
        update: {
          image: "https://images.unsplash.com/photo-1593720219276-0b1eacd0aef4?w=800&auto=format&fit=crop&q=80",
          subject: "Web Development",
          type: "public",
          description: "Assess fundamental and modern full-stack web engineering concepts including React 18, REST APIs, and Node runtime."
        }
      },
      {
        query: { title: /Database Systems & MongoDB/i },
        update: {
          image: "https://images.unsplash.com/photo-1544383835-bda2bc66a55d?w=800&auto=format&fit=crop&q=80",
          subject: "Database Management",
          type: "public",
          description: "Comprehensive assessment covering document indexing, aggregation pipelines, replica sets, and query optimization."
        }
      },
      {
        query: { title: /Data Structures & Algorithmic/i },
        update: {
          image: "https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=800&auto=format&fit=crop&q=80",
          subject: "Algorithms",
          type: "public",
          description: "Master level assessment on Big-O algorithmic complexity, dynamic programming, binary search trees, and graphs."
        }
      },
      {
        query: { title: /Python Programming & Core/i },
        update: {
          image: "https://images.unsplash.com/photo-1526379095098-d400fd0bf935?w=800&auto=format&fit=crop&q=80",
          subject: "Programming",
          type: "public",
          description: "Rigorous timed assessment of Python 3 syntax, list comprehensions, decorators, generators, and exception handling."
        }
      },
      {
        query: { title: /^math$/i },
        update: {
          title: "Mathematics & Applied Calculus Assessment",
          image: "https://images.unsplash.com/photo-1635070041078-e363dbe005cb?w=800&auto=format&fit=crop&q=80",
          subject: "Mathematics",
          type: "public",
          duration: 40,
          description: "High-level examination in differential calculus, linear algebra, vector spaces, and probability theory."
        }
      }
    ];

    for (const item of updates) {
      const res = await Test.findOneAndUpdate(item.query, { $set: item.update }, { new: true });
      if (res) {
        console.log(`Updated test: "${res.title}" with image: ${res.image}`);
      }
    }

    // 2. Check if we already have Cloud & DevOps test
    const existingCloud = await Test.findOne({ title: /Cloud Infrastructure & AWS DevOps/i });
    if (!existingCloud) {
      console.log("Seeding 'Cloud Infrastructure & AWS DevOps Certification'...");
      const cloudTest = await Test.create({
        title: "Cloud Infrastructure & AWS DevOps Certification",
        description: "Covers Amazon Web Services core primitives (EC2, S3, VPC), Docker containerization, and modern CI/CD automation pipelines.",
        image: "https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=800&auto=format&fit=crop&q=80",
        subject: "Cloud & DevOps",
        duration: 45,
        passingPercentage: 50,
        passingMarks: 50,
        totalMarks: 30,
        numberOfAttempts: 2,
        attemptMode: "best_of_n",
        type: "public",
        status: "published",
        instructions: "Calculators are permitted. Read all scenario-based architecture questions carefully before submitting.",
        createdBy: authorUser._id,
        organizationId: orgId
      });

      const cloudQuestions = [
        {
          questionText: "Which AWS service provides serverless compute execution triggered by event streams without managing servers?",
          options: [
            { key: "A", text: "AWS Elastic Beanstalk" },
            { key: "B", text: "AWS Lambda" },
            { key: "C", text: "Amazon EC2" },
            { key: "D", text: "Amazon Lightsail" }
          ],
          correctAnswer: "B",
          marks: 10,
          negativeMarks: 2,
          explanation: "AWS Lambda lets you run code without provisioning or managing servers, billing only for compute time consumed."
        },
        {
          questionText: "In Docker containerization, which instruction in a Dockerfile defines the immutable executable that always runs when the container starts?",
          options: [
            { key: "A", text: "RUN" },
            { key: "B", text: "ENTRYPOINT" },
            { key: "C", text: "ENV" },
            { key: "D", text: "EXPOSE" }
          ],
          correctAnswer: "B",
          marks: 10,
          negativeMarks: 2,
          explanation: "ENTRYPOINT configures a container that will run as an executable, making command arguments appendable."
        },
        {
          questionText: "Which HTTP status code is returned when a client makes too many requests within a given timeframe to a rate-limited API gateway?",
          options: [
            { key: "A", text: "401 Unauthorized" },
            { key: "B", text: "403 Forbidden" },
            { key: "C", text: "429 Too Many Requests" },
            { key: "D", text: "503 Service Unavailable" }
          ],
          correctAnswer: "C",
          marks: 10,
          negativeMarks: 2,
          explanation: "HTTP 429 Too Many Requests indicates the user has sent too many requests in a given amount of time (rate limiting)."
        }
      ];

      for (const q of cloudQuestions) {
        await Question.create({
          ...q,
          testId: cloudTest._id,
          organizationId: orgId
        });
      }
      console.log("Seeded Cloud test with 3 questions.");
    }

    // 3. Check if we already have Aptitude test
    const existingAptitude = await Test.findOne({ title: /Quantitative Aptitude & Logical Reasoning/i });
    if (!existingAptitude) {
      console.log("Seeding 'Quantitative Aptitude & Logical Reasoning Master Test'...");
      const aptTest = await Test.create({
        title: "Quantitative Aptitude & Logical Reasoning Master Test",
        description: "Benchmark reasoning evaluation designed for competitive placements: arithmetic progressions, logic deduction, and speed math.",
        image: "https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=800&auto=format&fit=crop&q=80",
        subject: "Aptitude & Reasoning",
        duration: 30,
        passingPercentage: 40,
        passingMarks: 40,
        totalMarks: 30,
        numberOfAttempts: 3,
        attemptMode: "best_of_n",
        type: "public",
        status: "published",
        instructions: "Rough sheet permitted. Negative marking is active for incorrect selections.",
        createdBy: authorUser._id,
        organizationId: orgId
      });

      const aptQuestions = [
        {
          questionText: "A train running at 72 km/hr crosses a platform 200 meters long in 25 seconds. What is the length of the train in meters?",
          options: [
            { key: "A", text: "250 meters" },
            { key: "B", text: "300 meters" },
            { key: "C", text: "350 meters" },
            { key: "D", text: "400 meters" }
          ],
          correctAnswer: "B",
          marks: 10,
          negativeMarks: 2,
          explanation: "Speed = 72 * (5/18) = 20 m/s. Total distance in 25s = 20 * 25 = 500m. Length of train = 500 - 200 = 300m."
        },
        {
          questionText: "If 12 men can complete a project in 18 days, in how many days can 9 men complete the identical project working at the same pace?",
          options: [
            { key: "A", text: "20 days" },
            { key: "B", text: "22 days" },
            { key: "C", text: "24 days" },
            { key: "D", text: "26 days" }
          ],
          correctAnswer: "C",
          marks: 10,
          negativeMarks: 2,
          explanation: "Total man-days = 12 * 18 = 216 man-days. Days for 9 men = 216 / 9 = 24 days."
        },
        {
          questionText: "Find the missing number in the sequence: 4, 9, 25, 49, 121, ___",
          options: [
            { key: "A", text: "144" },
            { key: "B", text: "169" },
            { key: "C", text: "196" },
            { key: "D", text: "225" }
          ],
          correctAnswer: "B",
          marks: 10,
          negativeMarks: 2,
          explanation: "The series consists of squares of prime numbers: 2^2=4, 3^2=9, 5^2=25, 7^2=49, 11^2=121, and 13^2 = 169."
        }
      ];

      for (const q of aptQuestions) {
        await Question.create({
          ...q,
          testId: aptTest._id,
          organizationId: orgId
        });
      }
      console.log("Seeded Aptitude test with 3 questions.");
    }

    console.log("\nAll tests and questions seeded with images successfully!");
    process.exit(0);
  } catch (err) {
    console.error("Error seeding tests:", err);
    process.exit(1);
  }
};

seedTests();
