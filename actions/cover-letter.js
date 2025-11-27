"use server";

import { db } from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

/**
 * Generate a new AI cover letter and save it
 * data: { jobTitle, companyName, jobDescription }
 */
export async function generateCoverLetter(data) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  const user = await db.user.findUnique({
    where: { clerkUserId: userId },
  });

  if (!user) throw new Error("User not found");

  // 🔹 Normalize fields safely
  const name = user.name || "Candidate";
  const email = user.email || "email@example.com";
  const industry = user.industry || "N/A";
  const experience = user.experienceLevel || "Fresher";

  // 🔹 skills can be Json, array, string, or null → normalize to a string
  let skillsString = "N/A";
  if (Array.isArray(user.skills)) {
    skillsString = user.skills.join(", ");
  } else if (typeof user.skills === "string") {
    skillsString = user.skills;
  } else if (user.skills && typeof user.skills === "object") {
    try {
      const maybeArray = Array.isArray(user.skills)
        ? user.skills
        : Object.values(user.skills);
      skillsString = maybeArray.join(", ");
    } catch {
      skillsString = "N/A";
    }
  }

  const bioLike = user.currentCompany || "";
  const today = new Date().toLocaleDateString("en-US", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  const prompt = `
You are an expert career coach. Write a complete, ready-to-send cover letter
for the position of **${data.jobTitle}** at **${data.companyName}**.

Applicant details:
- Name: ${name}
- Email: ${email}
- Date: ${today}
- Industry: ${industry}
- Experience Level: ${experience}
- Skills: ${skillsString}
- Background Notes: ${bioLike}

Job Description:
${data.jobDescription || ""}

Requirements:
1. The letter must be fully filled out and ready to send.
2. Do NOT include any placeholders or bracketed text like [Your Name], [Email], [Phone Number], [Current Date], etc.
3. Use a professional, enthusiastic tone.
4. Highlight the most relevant skills and experience for this role.
5. Show understanding of the company's needs.
6. Keep it concise (max ~400 words).
7. Use proper business letter formatting in markdown.
8. At the end of the letter, sign with the candidate's real name: ${name}.
9. Use the real date "${today}" where a date is needed.
10. You may omit phone number and physical address if they are not provided. Do NOT invent random contact info.

Return ONLY the markdown cover letter, nothing else.
  `;

  try {
    const result = await model.generateContent(prompt);
    const content = result.response.text().trim();

    const coverLetter = await db.coverLetter.create({
      data: {
        content,
        jobDescription: data.jobDescription || "",
        companyName: data.companyName || "",
        jobTitle: data.jobTitle || "",
        status: "completed",
        userId: user.id,
      },
    });

    return coverLetter;
  } catch (error) {
    console.error("Error generating cover letter:", error);
    throw new Error("Failed to generate cover letter");
  }
}

/**
 * Get all cover letters for the logged-in user (for list page)
 */
export async function getCoverLetters() {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  const user = await db.user.findUnique({
    where: { clerkUserId: userId },
  });

  if (!user) {
    // safer to return empty list than crash the whole page
    return [];
  }

  return await db.coverLetter.findMany({
    where: {
      userId: user.id,
    },
    orderBy: {
      createdAt: "desc",
    },
  });
}

/**
 * Get a single cover letter by id (for /ai-cover-letter/[id])
 */
export async function getCoverLetter(id) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  const user = await db.user.findUnique({
    where: { clerkUserId: userId },
  });

  if (!user) throw new Error("User not found");

  return await db.coverLetter.findUnique({
    where: {
      id,
      userId: user.id,
    },
  });
}

/**
 * Delete a cover letter by id
 */
export async function deleteCoverLetter(id) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  const user = await db.user.findUnique({
    where: { clerkUserId: userId },
  });

  if (!user) throw new Error("User not found");

  return await db.coverLetter.delete({
    where: {
      id,
      userId: user.id,
    },
  });
}
