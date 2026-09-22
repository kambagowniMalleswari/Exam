// Helper to evaluate an attempt and compute score, negative marks, pass/fail status, and detailed breakdown
export const evaluateAttempt = (
  questions = [],
  studentAnswers = [],
  testDetails = {},
  startedAt = new Date(),
  submittedAt = new Date()
) => {
  let correctAnswers = 0;
  let wrongAnswers = 0;
  let unanswered = 0;
  let totalMarks = 0;
  let rawScore = 0;

  // Build answer lookup map supporting both Array of objects and Map/Object formats
  const answerMap = new Map();
  if (Array.isArray(studentAnswers)) {
    studentAnswers.forEach((ans) => {
      if (ans && ans.questionId) {
        const qId = ans.questionId._id ? ans.questionId._id.toString() : ans.questionId.toString();
        answerMap.set(qId, (ans.selectedAnswer || "").toString().trim());
      }
    });
  } else if (studentAnswers && typeof studentAnswers === "object") {
    Object.entries(studentAnswers).forEach(([qId, val]) => {
      if (qId) {
        answerMap.set(qId.toString(), (val || "").toString().trim());
      }
    });
  }

  const questionBreakdown = [];

  questions.forEach((question) => {
    const qMarks = Number(question.marks) || 1;
    const qNegMarks = Number(question.negativeMarks) || 0;
    totalMarks += qMarks;

    const qIdStr = question._id ? question._id.toString() : "";
    const studentChoice = answerMap.get(qIdStr) || "";
    const rawCorrect = (question.correctAnswer || "").toString().trim();

    // Normalize options into an array of { key: 'A', text: '...', index: 0 }
    const rawOptions = Array.isArray(question.options) ? question.options : [];
    const normalizedOptions = rawOptions.map((opt, idx) => {
      const defaultKey = String.fromCharCode(65 + idx); // 'A', 'B', 'C', 'D'
      if (typeof opt === "object" && opt !== null) {
        return {
          key: (opt.key || defaultKey).toString().trim(),
          text: (opt.text !== undefined ? opt.text : "").toString().trim(),
          index: idx
        };
      }
      return {
        key: defaultKey,
        text: (opt !== undefined && opt !== null ? opt : "").toString().trim(),
        index: idx
      };
    });

    // Identify canonical correct option from question options
    const correctOpt = normalizedOptions.find((opt) => {
      const optKey = opt.key.toLowerCase();
      const optText = opt.text.toLowerCase();
      const target = rawCorrect.toLowerCase();
      return (
        optKey === target ||
        optText === target ||
        `option ${optKey}` === target ||
        `option: ${optKey}` === target ||
        `(${optKey})` === target
      );
    }) || {
      key: rawCorrect,
      text: rawCorrect,
      index: -1
    };

    const canonicalCorrectAnswer = correctOpt.text || correctOpt.key || rawCorrect;

    // Check if unanswered
    if (!studentChoice) {
      unanswered++;
      questionBreakdown.push({
        questionId: question._id,
        questionText: question.questionText || question.text || "",
        options: question.options,
        selectedAnswer: "Not answered",
        yourAnswer: "Not answered",
        correctAnswer: canonicalCorrectAnswer,
        isCorrect: false,
        isUnanswered: true,
        status: "unanswered",
        marksAwarded: 0,
        marksObtained: 0,
        explanation: question.explanation || ""
      });
      return;
    }

    // Resolve which option the student selected
    const studentOpt = normalizedOptions.find((opt) => {
      const optKey = opt.key.toLowerCase();
      const optText = opt.text.toLowerCase();
      const choice = studentChoice.toLowerCase();
      return (
        optKey === choice ||
        optText === choice ||
        `option ${optKey}` === choice ||
        `option: ${optKey}` === choice ||
        `(${optKey})` === choice
      );
    });

    const canonicalStudentAnswer = studentOpt ? (studentOpt.text || studentOpt.key) : studentChoice;

    // Determine match
    let isMatch = false;
    if (studentOpt && correctOpt && correctOpt.index !== -1) {
      isMatch =
        studentOpt.index === correctOpt.index ||
        studentOpt.key.toLowerCase() === correctOpt.key.toLowerCase() ||
        studentOpt.text.toLowerCase() === correctOpt.text.toLowerCase();
    } else {
      isMatch = studentChoice.toLowerCase() === rawCorrect.toLowerCase();
    }

    if (isMatch) {
      correctAnswers++;
      rawScore += qMarks;
      questionBreakdown.push({
        questionId: question._id,
        questionText: question.questionText || question.text || "",
        options: question.options,
        selectedAnswer: canonicalStudentAnswer,
        yourAnswer: canonicalStudentAnswer,
        correctAnswer: canonicalCorrectAnswer,
        isCorrect: true,
        isUnanswered: false,
        status: "correct",
        marksAwarded: qMarks,
        marksObtained: qMarks,
        explanation: question.explanation || ""
      });
    } else {
      wrongAnswers++;
      rawScore -= qNegMarks; // deduct negative marks
      questionBreakdown.push({
        questionId: question._id,
        questionText: question.questionText || question.text || "",
        options: question.options,
        selectedAnswer: canonicalStudentAnswer,
        yourAnswer: canonicalStudentAnswer,
        correctAnswer: canonicalCorrectAnswer,
        isCorrect: false,
        isUnanswered: false,
        status: "incorrect",
        marksAwarded: -qNegMarks,
        marksObtained: -qNegMarks,
        explanation: question.explanation || ""
      });
    }
  });

  // Score should not be negative
  const finalScore = Math.max(0, Number(rawScore.toFixed(2)));

  // Calculate percentage
  const percentage = totalMarks > 0 ? Number(((finalScore / totalMarks) * 100).toFixed(2)) : 0;

  // Passing criteria: percentage strictly evaluated against test's passingPercentage (default 40%)
  const minPassPercent = testDetails.passingPercentage !== undefined && testDetails.passingPercentage !== null
    ? Number(testDetails.passingPercentage)
    : (testDetails.passingMarks && totalMarks > 0 ? Number(((testDetails.passingMarks / totalMarks) * 100).toFixed(1)) : 40);

  const passed = percentage >= minPassPercent;

  // Calculate time taken in seconds
  const startMs = new Date(startedAt).getTime();
  const endMs = new Date(submittedAt).getTime();
  const timeTaken = Math.max(0, Math.round((endMs - startMs) / 1000));

  return {
    totalQuestions: questions.length,
    correctAnswers,
    wrongAnswers,
    unanswered,
    totalMarks,
    score: finalScore,
    percentage,
    passed,
    passingPercentage: minPassPercent,
    result: passed ? "pass" : "fail",
    timeTaken,
    questionBreakdown
  };
};

export default evaluateAttempt;

