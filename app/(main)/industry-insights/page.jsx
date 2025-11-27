"use client";

import { useEffect, useState } from "react";
import { getUserOnboardingStatus } from "@/actions/user";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

export default function IndustryInsightsPage() {
  const [loading, setLoading] = useState(true);
  const [insights, setInsights] = useState(null);

  useEffect(() => {
    async function fetchInsights() {
      try {
        const res = await fetch("/api/industry-insights");
        if (!res.ok) throw new Error("Failed to load insights");

        const data = await res.json();
        setInsights(data);
      } catch (err) {
        toast.error("Error fetching insights");
      } finally {
        setLoading(false);
      }
    }

    fetchInsights();
  }, []);

  if (loading)
    return (
      <div className="flex justify-center items-center min-h-[50vh]">
        <Loader2 className="animate-spin h-6 w-6" />
      </div>
    );

  if (!insights)
    return (
      <div className="text-center py-10 text-muted-foreground">
        No insights available yet. Try updating your profile.
      </div>
    );

  return (
    <div className="container mx-auto py-10 space-y-6">
      <h1 className="text-5xl font-bold gradient-title">Industry Insights</h1>

      <Card>
        <CardHeader>
          <CardTitle>Industry Overview</CardTitle>
        </CardHeader>
        <CardContent>
          <p>{insights.overview}</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Top Skills</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="list-disc ml-6">
            {insights.topSkills?.map((skill, idx) => (
              <li key={idx}>{skill}</li>
            ))}
          </ul>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Future Trends</CardTitle>
        </CardHeader>
        <CardContent>
          <p>{insights.futureTrends}</p>
        </CardContent>
      </Card>
    </div>
  );
}
