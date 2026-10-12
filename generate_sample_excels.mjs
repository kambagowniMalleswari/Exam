import * as XLSX from "./frontend/node_modules/xlsx/xlsx.mjs";
import path from "path";
import fs from "fs";

XLSX.set_fs(fs);

// 1. Dataset 1: Computer Science & Engineering Department Roster (20 Students)
const csStudents = [
  {
    "Registration Number": "REG-2026-CSE-001",
    "Student ID": "STU-CSE-101",
    "Student Name": "Aarav Patel",
    "Email Address": "aarav.patel@student.edu",
    "Department": "Computer Science",
    "Course": "B.Tech CSE",
    "Academic Year": "2026-2027",
    "Semester": "5",
    "Section": "A",
    "Batch Name": "CS-Alpha-2026"
  },
  {
    "Registration Number": "REG-2026-CSE-002",
    "Student ID": "STU-CSE-102",
    "Student Name": "Diya Reddy",
    "Email Address": "diya.reddy@student.edu",
    "Department": "Computer Science",
    "Course": "B.Tech CSE",
    "Academic Year": "2026-2027",
    "Semester": "5",
    "Section": "A",
    "Batch Name": "CS-Alpha-2026"
  },
  {
    "Registration Number": "REG-2026-CSE-003",
    "Student ID": "STU-CSE-103",
    "Student Name": "Kiran Kumar",
    "Email Address": "kiran.kumar@student.edu",
    "Department": "Computer Science",
    "Course": "B.Tech CSE",
    "Academic Year": "2026-2027",
    "Semester": "5",
    "Section": "A",
    "Batch Name": "CS-Alpha-2026"
  },
  {
    "Registration Number": "REG-2026-CSE-004",
    "Student ID": "STU-CSE-104",
    "Student Name": "Ananya Sharma",
    "Email Address": "ananya.sharma@student.edu",
    "Department": "Computer Science",
    "Course": "B.Tech CSE",
    "Academic Year": "2026-2027",
    "Semester": "5",
    "Section": "A",
    "Batch Name": "CS-Alpha-2026"
  },
  {
    "Registration Number": "REG-2026-CSE-005",
    "Student ID": "STU-CSE-105",
    "Student Name": "Rohan Verma",
    "Email Address": "rohan.verma@student.edu",
    "Department": "Computer Science",
    "Course": "B.Tech CSE",
    "Academic Year": "2026-2027",
    "Semester": "5",
    "Section": "A",
    "Batch Name": "CS-Alpha-2026"
  },
  {
    "Registration Number": "REG-2026-CSE-006",
    "Student ID": "STU-CSE-106",
    "Student Name": "Sneha Kulkarni",
    "Email Address": "sneha.kulkarni@student.edu",
    "Department": "Computer Science",
    "Course": "B.Tech CSE",
    "Academic Year": "2026-2027",
    "Semester": "5",
    "Section": "B",
    "Batch Name": "CS-Beta-2026"
  },
  {
    "Registration Number": "REG-2026-CSE-007",
    "Student ID": "STU-CSE-107",
    "Student Name": "Vikramaditya Singh",
    "Email Address": "vikram.singh@student.edu",
    "Department": "Computer Science",
    "Course": "B.Tech CSE",
    "Academic Year": "2026-2027",
    "Semester": "5",
    "Section": "B",
    "Batch Name": "CS-Beta-2026"
  },
  {
    "Registration Number": "REG-2026-CSE-008",
    "Student ID": "STU-CSE-108",
    "Student Name": "Pooja Hegde",
    "Email Address": "pooja.hegde@student.edu",
    "Department": "Computer Science",
    "Course": "B.Tech CSE",
    "Academic Year": "2026-2027",
    "Semester": "5",
    "Section": "B",
    "Batch Name": "CS-Beta-2026"
  },
  {
    "Registration Number": "REG-2026-CSE-009",
    "Student ID": "STU-CSE-109",
    "Student Name": "Aditya Joshi",
    "Email Address": "aditya.joshi@student.edu",
    "Department": "Computer Science",
    "Course": "B.Tech CSE",
    "Academic Year": "2026-2027",
    "Semester": "5",
    "Section": "B",
    "Batch Name": "CS-Beta-2026"
  },
  {
    "Registration Number": "REG-2026-CSE-010",
    "Student ID": "STU-CSE-110",
    "Student Name": "Meera Nambiar",
    "Email Address": "meera.nambiar@student.edu",
    "Department": "Computer Science",
    "Course": "B.Tech CSE",
    "Academic Year": "2026-2027",
    "Semester": "5",
    "Section": "B",
    "Batch Name": "CS-Beta-2026"
  },
  {
    "Registration Number": "REG-2026-CSE-011",
    "Student ID": "STU-CSE-111",
    "Student Name": "Siddharth Rao",
    "Email Address": "siddharth.rao@student.edu",
    "Department": "Computer Science",
    "Course": "B.Tech CSE",
    "Academic Year": "2026-2027",
    "Semester": "3",
    "Section": "A",
    "Batch Name": "CS-Junior-2026"
  },
  {
    "Registration Number": "REG-2026-CSE-012",
    "Student ID": "STU-CSE-112",
    "Student Name": "Neha Gupta",
    "Email Address": "neha.gupta@student.edu",
    "Department": "Computer Science",
    "Course": "B.Tech CSE",
    "Academic Year": "2026-2027",
    "Semester": "3",
    "Section": "A",
    "Batch Name": "CS-Junior-2026"
  },
  {
    "Registration Number": "REG-2026-CSE-013",
    "Student ID": "STU-CSE-113",
    "Student Name": "Kavya Menon",
    "Email Address": "kavya.menon@student.edu",
    "Department": "Computer Science",
    "Course": "B.Tech CSE",
    "Academic Year": "2026-2027",
    "Semester": "3",
    "Section": "A",
    "Batch Name": "CS-Junior-2026"
  },
  {
    "Registration Number": "REG-2026-CSE-014",
    "Student ID": "STU-CSE-114",
    "Student Name": "Varun Tej",
    "Email Address": "varun.tej@student.edu",
    "Department": "Computer Science",
    "Course": "B.Tech CSE",
    "Academic Year": "2026-2027",
    "Semester": "3",
    "Section": "A",
    "Batch Name": "CS-Junior-2026"
  },
  {
    "Registration Number": "REG-2026-CSE-015",
    "Student ID": "STU-CSE-115",
    "Student Name": "Tanvi Deshmukh",
    "Email Address": "tanvi.deshmukh@student.edu",
    "Department": "Computer Science",
    "Course": "B.Tech CSE",
    "Academic Year": "2026-2027",
    "Semester": "3",
    "Section": "B",
    "Batch Name": "CS-Junior-2026"
  }
];

// 2. Dataset 2: Electronics & Information Technology Roster (15 Students)
const eceStudents = [
  {
    "Registration Number": "REG-2026-ECE-201",
    "Student ID": "STU-ECE-201",
    "Student Name": "Sai Charan",
    "Email Address": "sai.charan@student.edu",
    "Department": "Electronics & Communication",
    "Course": "B.Tech ECE",
    "Academic Year": "2026-2027",
    "Semester": "5",
    "Section": "A",
    "Batch Name": "ECE-Robotics-2026"
  },
  {
    "Registration Number": "REG-2026-ECE-202",
    "Student ID": "STU-ECE-202",
    "Student Name": "Pranavi Krishna",
    "Email Address": "pranavi.krishna@student.edu",
    "Department": "Electronics & Communication",
    "Course": "B.Tech ECE",
    "Academic Year": "2026-2027",
    "Semester": "5",
    "Section": "A",
    "Batch Name": "ECE-Robotics-2026"
  },
  {
    "Registration Number": "REG-2026-ECE-203",
    "Student ID": "STU-ECE-203",
    "Student Name": "Harshavardhan Raju",
    "Email Address": "harsha.raju@student.edu",
    "Department": "Electronics & Communication",
    "Course": "B.Tech ECE",
    "Academic Year": "2026-2027",
    "Semester": "5",
    "Section": "A",
    "Batch Name": "ECE-Robotics-2026"
  },
  {
    "Registration Number": "REG-2026-ECE-204",
    "Student ID": "STU-ECE-204",
    "Student Name": "Keerthi Suresh",
    "Email Address": "keerthi.suresh@student.edu",
    "Department": "Electronics & Communication",
    "Course": "B.Tech ECE",
    "Academic Year": "2026-2027",
    "Semester": "5",
    "Section": "A",
    "Batch Name": "ECE-Robotics-2026"
  },
  {
    "Registration Number": "REG-2026-ECE-205",
    "Student ID": "STU-ECE-205",
    "Student Name": "Gautam Gambhir",
    "Email Address": "gautam.gambhir@student.edu",
    "Department": "Electronics & Communication",
    "Course": "B.Tech ECE",
    "Academic Year": "2026-2027",
    "Semester": "5",
    "Section": "B",
    "Batch Name": "ECE-VLSI-2026"
  },
  {
    "Registration Number": "REG-2026-ECE-206",
    "Student ID": "STU-ECE-206",
    "Student Name": "Lavanya Tripathi",
    "Email Address": "lavanya.tripathi@student.edu",
    "Department": "Electronics & Communication",
    "Course": "B.Tech ECE",
    "Academic Year": "2026-2027",
    "Semester": "5",
    "Section": "B",
    "Batch Name": "ECE-VLSI-2026"
  },
  {
    "Registration Number": "REG-2026-ECE-207",
    "Student ID": "STU-ECE-207",
    "Student Name": "Nikhil Siddhartha",
    "Email Address": "nikhil.siddhartha@student.edu",
    "Department": "Electronics & Communication",
    "Course": "B.Tech ECE",
    "Academic Year": "2026-2027",
    "Semester": "5",
    "Section": "B",
    "Batch Name": "ECE-VLSI-2026"
  },
  {
    "Registration Number": "REG-2026-IT-301",
    "Student ID": "STU-IT-301",
    "Student Name": "Rithika Sen",
    "Email Address": "rithika.sen@student.edu",
    "Department": "Information Technology",
    "Course": "B.Tech IT",
    "Academic Year": "2026-2027",
    "Semester": "3",
    "Section": "A",
    "Batch Name": "IT-Cloud-2026"
  },
  {
    "Registration Number": "REG-2026-IT-302",
    "Student ID": "STU-IT-302",
    "Student Name": "Manish Pandey",
    "Email Address": "manish.pandey@student.edu",
    "Department": "Information Technology",
    "Course": "B.Tech IT",
    "Academic Year": "2026-2027",
    "Semester": "3",
    "Section": "A",
    "Batch Name": "IT-Cloud-2026"
  },
  {
    "Registration Number": "REG-2026-IT-303",
    "Student ID": "STU-IT-303",
    "Student Name": "Shruti Haasan",
    "Email Address": "shruti.haasan@student.edu",
    "Department": "Information Technology",
    "Course": "B.Tech IT",
    "Academic Year": "2026-2027",
    "Semester": "3",
    "Section": "A",
    "Batch Name": "IT-Cloud-2026"
  },
  {
    "Registration Number": "REG-2026-IT-304",
    "Student ID": "STU-IT-304",
    "Student Name": "Dinesh Karthik",
    "Email Address": "dinesh.karthik@student.edu",
    "Department": "Information Technology",
    "Course": "B.Tech IT",
    "Academic Year": "2026-2027",
    "Semester": "3",
    "Section": "B",
    "Batch Name": "IT-DevOps-2026"
  },
  {
    "Registration Number": "REG-2026-IT-305",
    "Student ID": "STU-IT-305",
    "Student Name": "Priyanka Mohan",
    "Email Address": "priyanka.mohan@student.edu",
    "Department": "Information Technology",
    "Course": "B.Tech IT",
    "Academic Year": "2026-2027",
    "Semester": "3",
    "Section": "B",
    "Batch Name": "IT-DevOps-2026"
  }
];

function createAndSaveExcel(data, filename, sheetName) {
  const ws = XLSX.utils.json_to_sheet(data);
  // Column width styling for clean readability
  const colWidths = [
    { wch: 20 }, // Registration Number
    { wch: 15 }, // Student ID
    { wch: 24 }, // Student Name
    { wch: 30 }, // Email Address
    { wch: 28 }, // Department
    { wch: 16 }, // Course
    { wch: 16 }, // Academic Year
    { wch: 10 }, // Semester
    { wch: 10 }, // Section
    { wch: 20 }  // Batch Name
  ];
  ws["!cols"] = colWidths;

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, sheetName);

  const outDirPublic = path.resolve("frontend/public");
  const outDirRoot = path.resolve(".");

  if (!fs.existsSync(outDirPublic)) {
    fs.mkdirSync(outDirPublic, { recursive: true });
  }

  const filePathPublic = path.join(outDirPublic, filename);
  const filePathRoot = path.join(outDirRoot, filename);

  XLSX.writeFile(wb, filePathPublic);
  XLSX.writeFile(wb, filePathRoot);

  console.log(`✓ Saved ${filename} to public/ and root directory (${data.length} records)`);
}

createAndSaveExcel(
  csStudents,
  "AssessIQ_Student_Roster_Batch_Allocation_Sample_1.xlsx",
  "CS Roster & Batch Allocation"
);

createAndSaveExcel(
  eceStudents,
  "AssessIQ_Student_Roster_Batch_Allocation_Sample_2.xlsx",
  "ECE & IT Cohort Roster"
);
