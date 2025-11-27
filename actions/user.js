"use server";

import { db } from "@/lib/prisma";
import { auth, currentUser } from "@clerk/nextjs/server";
import { generateAIInsights } from "./dashboard";

// Server action used by onboarding form
export async function updateUser(_, formData) {
  const { userId } = await auth();
  if (!userId) return { error: "Unauthorized" };

  const cu = await currentUser().catch(() => null);

  const clerkEmail = cu?.emailAddresses?.[0]?.emailAddress ?? null;
  const clerkName = cu
    ? `${cu.firstName || ""} ${cu.lastName || ""}`.trim()
    : "";
  const clerkImage = cu?.imageUrl ?? null;

  const name = (formData.get("name") || clerkName || "").toString();
  const email = (formData.get("email") || clerkEmail || "").toString();
  const role = formData.get("role")?.toString() || null;
  const industry = formData.get("industry")?.toString() || null;
  const experience = formData.get("experience")?.toString() || null;
  const skillsRaw = formData.get("skills")?.toString() || "";

  // Normalize skills to a JSON array (because skills is Json? in Prisma)
  let skills = null;
  if (skillsRaw) {
    skills = skillsRaw
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
  }

  let user = await db.user.findUnique({
    where: { clerkUserId: userId },
  });

  if (!user) {
    // Create new user row
    user = await db.user.create({
      data: {
        clerkUserId: userId,
        name,
        email,
        role,
        industry,
        experienceLevel: experience, // matches schema
        skills,
        imageUrl: clerkImage,
      },
    });
  } else {
    // Update existing user row
    user = await db.user.update({
      where: { clerkUserId: userId },
      data: {
        name,
        email,
        role,
        industry,
        experienceLevel: experience,
        skills,
        imageUrl: clerkImage,
      },
    });
  }

  // Industry Insights generation/update (safe, does not crash onboarding if AI fails)
  if (industry) {
    try {
      const insights = await generateAIInsights(industry);

      const existing = await db.industryInsight.findUnique({
        where: { userId: user.id }, // userId is unique in IndustryInsight
      });

      const nextUpdate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // +7 days

      if (!existing) {
        await db.industryInsight.create({
          data: {
            userId: user.id,
            industry,
            ...insights,
            nextUpdate,
          },
        });
      } else {
        await db.industryInsight.update({
          where: { userId: user.id },
          data: {
            industry,
            ...insights,
            nextUpdate,
          },
        });
      }
    } catch (error) {
      console.error("Error generating industry insights (ignored):", error);
      // Do NOT throw here, so profile update still succeeds
    }
  }

  return { success: true };
}

export async function getUserOnboardingStatus() {
  const { userId } = await auth();
  if (!userId) return { isOnboarded: false };

  const user = await db.user.findUnique({
    where: { clerkUserId: userId },
    select: { industry: true },
  });

  return {
    isOnboarded: !!user?.industry,
  };
}
