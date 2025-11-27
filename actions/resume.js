"use server";

import { db } from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { revalidatePath } from "next/cache";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

/**
 * Save or update resume content for the logged-in user
 */
export async function saveResume(content) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  const user = await db.user.findUnique({
    where: { clerkUserId: userId },
  });

  if (!user) throw new Error("User not found");

  try {
    const resume = await db.resume.upsert({
      where: {
        userId: user.id,
      },
      update: {
        content,
      },
      create: {
        userId: user.id,
        content,
      },
    });

    revalidatePath("/resume");
    return resume;
  } catch (error) {
    console.error("Error saving resume:", error);
    throw new Error("Failed to save resume");
  }
}

/**
 * Fetch resume for the logged-in user
 */
export async function getResume() {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  const user = await db.user.findUnique({
    where: { clerkUserId: userId },
  });

  if (!user) throw new Error("User not found");

  return await db.resume.findUnique({
    where: {
      userId: user.id,
    },
  });
}

/**
 * Improve a part of the resume with AI
 * payload: { current: string, type: string }
 * type can be: "professional summary", "experience bullet", etc.
 */
export async function improveWithAI(payload) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  if (!payload || typeof payload.current !== "string") {
    throw new Error("Invalid payload: 'current' text is required");
  }

  const currentText = payload.current.trim();
  const type = (payload.type || "section").toString();

  if (!currentText) {
    throw new Error("Cannot improve empty content");
  }

  const user = await db.user.findUnique({
    where: { clerkUserId: userId },
    include: {
      industryInsight: true,
    },
  });

  if (!user) throw new Error("User not found");

  // Normalize skills (Json | string | null → string)
  let skillsString = "N/A";
  if (Array.isArray(user.skills)) {
    skillsString = user.skills.join(", ");
  } else if (typeof user.skills === "string") {
    skillsString = user.skills;
  } else if (user.skills && typeof user.skills === "object") {
    try {
      const values = Array.isArray(user.skills)
        ? user.skills
        : Object.values(user.skills);
      skillsString = values.join(", ");
    } catch {
      skillsString = "N/A";
    }
  }

  const industry = user.industry || "your field";
  const experienceLevel = user.experienceLevel || "Fresher";

  // Optional: use industryInsight context if available
  const insight = user.industryInsight || {};
  const demandLevel = insight.demandLevel || null;
  const topSkillsInsight = Array.isArray(insight.topSkills)
    ? insight.topSkills.join(", ")
    : null;

  const prompt = `
You are an expert resume writer. Improve the following "${type}" for a professional in ${industry}.

Current content:
"${currentText}"

User details:
- Industry: ${industry}
- Experience Level: ${experienceLevel}
- Skills: ${skillsString}
${
  demandLevel
    ? `- Market demand level: ${demandLevel}`
    : ""
}
${
  topSkillsInsight
    ? `- In-demand skills in this industry: ${topSkillsInsight}`
    : ""
}

Requirements:
1. Use strong action verbs and a confident tone.
2. Focus on achievements and impact, not just responsibilities.
3. Add metrics and results where reasonable (without inventing unrealistic claims).
4. Naturally include relevant technical and industry keywords.
5. Keep it concise and professional.
6. Make it suitable for ATS scanning.
7. Do NOT use bullet points; respond as 1–3 sentences / a single paragraph.

Return ONLY the improved text. No headings, labels, or extra commentary.
  `;

  try {
    const result = await model.generateContent(prompt);
    const response = result.response;
    const improvedContent = response.text().trim();

    if (!improvedContent) {
      throw new Error("Model returned empty content");
    }

    return improvedContent;
  } catch (error) {
    console.error("Error improving content:", error);
    throw new Error("Failed to improve content");
  }
}
