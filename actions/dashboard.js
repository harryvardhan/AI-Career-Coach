"use server";

import { db } from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

/** Fallback data used when AI fails */
function fallbackInsights(industry) {
  const baseIndustry = industry || "Technology";

  return {
    // 👇 ARRAY of objects, as DashboardView expects
    salaryRanges: [
      { role: "Junior", min: 300000, max: 600000 },
      { role: "Mid", min: 600000, max: 1200000 },
      { role: "Senior", min: 1200000, max: 2500000 },
    ],
    growthRate: 8.5,
    demandLevel: "High",
    topSkills: [
      "Problem Solving",
      "Communication",
      "Team Collaboration",
      `${baseIndustry} Fundamentals`,
    ],
    marketOutlook: `The ${baseIndustry} industry is growing steadily with strong demand for skilled professionals and increasing digital adoption.`,
    keyTrends: [
      "Increased automation and AI adoption",
      "Remote and hybrid work models",
      "Growing demand for multi-skilled professionals",
    ],
    recommendedSkills: [
      "Data Analysis",
      "Cloud Basics",
      "Version Control (Git)",
      "System Design Fundamentals",
    ],
  };
}

/**
 * Generate AI-based industry insights
 */
export async function generateAIInsights(industry) {
  if (!industry) {
    return fallbackInsights("General");
  }

  const prompt = `
You are an expert career and labor-market analyst.

Generate structured insights for the industry: "${industry}".

Return ONLY valid JSON (no markdown, no commentary) in this exact shape:

{
  "salaryRanges": [
    { "role": "Junior", "min": 300000, "max": 600000 },
    { "role": "Mid", "min": 600000, "max": 1200000 },
    { "role": "Senior", "min": 1200000, "max": 2500000 }
  ],
  "growthRate":  number (estimated % growth, e.g. 8.5),
  "demandLevel": "Low" | "Medium" | "High" | "Very High",
  "topSkills": ["skill1", "skill2", "skill3"],
  "marketOutlook": "1-3 sentences summary of current market & future outlook",
  "keyTrends": ["short trend 1", "short trend 2", "short trend 3"],
  "recommendedSkills": ["skill1", "skill2", "skill3"]
}
  `;

  try {
    const result = await model.generateContent(prompt);
    const text = result.response.text().trim();

    const cleaned = text.replace(/```(?:json)?|```/g, "").trim();

    if (!cleaned || (!cleaned.startsWith("{") && !cleaned.startsWith("["))) {
      console.error(
        "AI insights: model returned non-JSON:",
        cleaned.slice(0, 200)
      );
      return fallbackInsights(industry);
    }

    let data;
    try {
      data = JSON.parse(cleaned);
    } catch (err) {
      console.error(
        "AI insights: JSON parse error:",
        err,
        cleaned.slice(0, 200)
      );
      return fallbackInsights(industry);
    }

    const fb = fallbackInsights(industry);

    // Ensure salaryRanges is ALWAYS an array
    let salaryRanges = fb.salaryRanges;
    if (Array.isArray(data.salaryRanges)) {
      salaryRanges = data.salaryRanges.map((r) => ({
        role: r.role || "Role",
        min: typeof r.min === "number" ? r.min : 300000,
        max: typeof r.max === "number" ? r.max : 600000,
      }));
    }

    return {
      salaryRanges,
      growthRate:
        typeof data.growthRate === "number" ? data.growthRate : fb.growthRate,
      demandLevel: data.demandLevel || fb.demandLevel,
      topSkills: Array.isArray(data.topSkills)
        ? data.topSkills
        : fb.topSkills,
      marketOutlook: data.marketOutlook || fb.marketOutlook,
      keyTrends: Array.isArray(data.keyTrends) ? data.keyTrends : fb.keyTrends,
      recommendedSkills: Array.isArray(data.recommendedSkills)
        ? data.recommendedSkills
        : fb.recommendedSkills,
    };
  } catch (error) {
    console.error("Error generating AI insights:", error);
    return fallbackInsights(industry);
  }
}

/**
 * Get industry insights for the logged-in user.
 * 👉 ALWAYS regenerates and overwrites the DB row so old bad data is replaced.
 */
export async function getIndustryInsights() {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  const user = await db.user.findUnique({
    where: { clerkUserId: userId },
  });

  if (!user) throw new Error("User not found");

  const industry = user.industry || "General";

  // Always generate fresh insights (AI or fallback)
  const aiData = await generateAIInsights(industry);
  const nextUpdate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // +7 days

  const existing = await db.industryInsight.findUnique({
    where: { userId: user.id },
  });

  let insight;

  if (!existing) {
    insight = await db.industryInsight.create({
      data: {
        userId: user.id,
        industry,
        ...aiData,
        nextUpdate,
      },
    });
  } else {
    insight = await db.industryInsight.update({
      where: { userId: user.id },
      data: {
        industry,
        ...aiData,
        nextUpdate,
      },
    });
  }

  return { user, insight };
}
