import { db } from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";

export async function GET() {
  const { userId } = await auth();
  if (!userId) return new Response("Unauthorized", { status: 401 });

  const user = await db.user.findUnique({
    where: { clerkUserId: userId },
    include: {
      industryInsight: true,
    },
  });

  if (!user || !user.industryInsight) {
    return new Response(JSON.stringify(null));
  }

  return new Response(JSON.stringify(user.industryInsight), {
    headers: { "Content-Type": "application/json" },
  });
}
