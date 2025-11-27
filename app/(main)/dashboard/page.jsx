import { getIndustryInsights } from "@/actions/dashboard";
import DashboardView from "./_component/dashboard-view";
import { getUserOnboardingStatus } from "@/actions/user";
import { redirect } from "next/navigation";

export default async function DashboardPage() {
  const { isOnboarded } = await getUserOnboardingStatus();

  if (!isOnboarded) {
    redirect("/onboarding");
  }

  // getIndustryInsights returns { user, insight }
  const { insight, user } = await getIndustryInsights();

  return (
    <div className="container mx-auto">
      {/* Pass only the insight object, which has marketOutlook, growthRate, etc */}
      <DashboardView insights={insight} user={user} />
    </div>
  );
}
