"use server";

import { db } from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

/**
 * Generate AI Quiz Questions
 */
export const generateQuiz = async (industryOverride) => {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  // Try to use the logged-in user's industry first
  const user = await db.user.findUnique({
    where: { clerkUserId: userId },
  });

  const industry = industryOverride || user?.industry || "technology";

  const prompt = `
    Create 10 multiple-choice interview questions for the industry:
    ${JSON.stringify(industry)}

    Return ONLY valid JSON (no markdown, no extra commentary):
    {
      "questions": [
        {
          "question": "string",
          "options": ["A", "B", "C", "D"],
          "correctAnswer": "string",
          "explanation": "string"
        }
      ]
    }
  `;

  try {
    const result = await model.generateContent(prompt);
    const text = result.response.text().trim();

    // Strip code fences if model still wraps in ```json ... ```
    const cleaned = text.replace(/```(?:json)?|```/g, "").trim();

    // Quick sanity check: if it doesn't look like JSON, don't try to parse
    if (!cleaned || (!cleaned.startsWith("{") && !cleaned.startsWith("["))) {
      console.error(
        "Quiz generation: model returned non-JSON:",
        cleaned.slice(0, 200)
      );
      return [];
    }

    let data;
    try {
      data = JSON.parse(cleaned);
    } catch (parseErr) {
      console.error(
        "Quiz generation: error parsing JSON:",
        parseErr,
        cleaned.slice(0, 200)
      );
      return [];
    }

    if (!data || !Array.isArray(data.questions)) {
      console.error("Quiz generation: JSON missing 'questions' array:", data);
      return [];
    }

    return data.questions;
  } catch (error) {
    // Handles 503 and any other Gemini error
    console.error("Error generating quiz:", error);

    if (
      error?.message?.includes("503") ||
      error?.message?.toLowerCase().includes("overloaded")
    ) {
      console.error(
        "Gemini model is overloaded while generating quiz. Ask user to try again later."
      );
    }

    // Always fail gracefully
    return [];
  }
};

/**
 * Save Quiz Result to DB
 */
export async function saveQuizResult(questions, answers, score) {
  const { userId } = await auth();

  if (!userId) throw new Error("Unauthorized");

  const user = await db.user.findUnique({
    where: { clerkUserId: userId },
  });

  if (!user) throw new Error("User not found");

  const formattedQuestions = questions.map((q, i) => ({
    question: q.question,
    options: q.options,
    selectedAnswer: answers[i],
    correctAnswer: q.correctAnswer,
    explanation: q.explanation,
    isCorrect: answers[i] === q.correctAnswer,
  }));

  const wrong = formattedQuestions.filter((q) => !q.isCorrect);

  let improvementTip = null;

  if (wrong.length > 0) {
    const mistakes = wrong.map((q) => `Q: ${q.question}`).join("\n");

    const tipPrompt = `
      A user made mistakes on these interview topics:
      ${mistakes}
      Provide a short encouraging improvement tip (max 2 sentences).
    `;

    try {
      const tipResult = await model.generateContent(tipPrompt);
      improvementTip = tipResult.response.text().trim();
    } catch {
      improvementTip = null;
    }
  }

  try {
    return await db.assessment.create({
      data: {
        userId: user.id,
        quizScore: score,
        category: user.industry || "General",
        questions: formattedQuestions,
        improvementTip,
      },
    });
  } catch (error) {
    console.error(
      "Error saving quiz result FULL:",
      JSON.stringify(error, null, 2)
    );
    throw error; // keep Prisma details
  }
}

/**
 * Fetch Saved Quiz Results
 */
export async function getAssessments() {
  const { userId } = await auth();

  // Not logged in → no assessments
  if (!userId) {
    return [];
  }

  const user = await db.user.findUnique({
    where: { clerkUserId: userId },
  });

  // User row doesn’t exist yet → treat as “no quizzes taken”
  if (!user) {
    return [];
  }

  try {
    return await db.assessment.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
    });
  } catch (error) {
    console.error("Error fetching assessments:", error);
    // Fail gracefully instead of crashing the page
    return [];
  }
}
