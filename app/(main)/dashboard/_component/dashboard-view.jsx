"use client";

import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  BarChart3,
  TrendingUp,
  Sparkles,
  Briefcase,
  Target,
} from "lucide-react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";

export default function DashboardView({ insights, user }) {
  if (!insights) {
    return (
      <div className="py-12 text-center text-muted-foreground">
        No insights available yet. Complete your profile to get AI-powered
        industry insights.
      </div>
    );
  }

  const {
    salaryRanges = [],
    growthRate = 0,
    demandLevel = "N/A",
    topSkills = [],
    marketOutlook = "N/A",
    keyTrends = [],
    recommendedSkills = [],
  } = insights;

  const industryName = user?.industry || "Your Industry";
  const experience = user?.experienceLevel || "Experience not set";

  const growthValue =
    typeof growthRate === "number" && !Number.isNaN(growthRate)
      ? Math.max(0, Math.min(100, growthRate))
      : 0;

  const demandScoreMap = {
    Low: 25,
    Medium: 50,
    High: 75,
    "Very High": 95,
  };

  const demandScore = demandScoreMap[demandLevel] ?? 0;

  const salaryData = Array.isArray(salaryRanges)
    ? salaryRanges.map((range) => ({
        name: range.role || "Role",
        min: range.min ? Math.round(range.min / 100000) : 0, // approx LPA
        max: range.max ? Math.round(range.max / 100000) : 0,
      }))
    : [];

  const demandColor =
    demandLevel === "Very High"
      ? "bg-emerald-500/80"
      : demandLevel === "High"
      ? "bg-green-500/80"
      : demandLevel === "Medium"
      ? "bg-amber-500/80"
      : demandLevel === "Low"
      ? "bg-red-500/80"
      : "bg-slate-500/80";

  return (
    <div className="py-10 space-y-8">
      {/* Header */}
      <section className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.25em] text-primary/70 mb-2">
            AI Career Coach · Insights
          </p>
          <h1 className="text-3xl md:text-5xl font-bold tracking-tight bg-gradient-to-r from-sky-400 via-blue-400 to-indigo-400 bg-clip-text text-transparent">
            Industry Insights
          </h1>
          <p className="mt-2 text-sm md:text-base text-muted-foreground max-w-xl">
            A personalized snapshot of the{" "}
            <span className="font-semibold text-foreground">
              {industryName}
            </span>{" "}
            landscape based on current market trends and AI analysis.
          </p>
        </div>

        <div className="flex flex-col items-start md:items-end gap-2">
          <Badge
            variant="outline"
            className="border-primary/40 bg-primary/10 text-primary px-3 py-1 rounded-full"
          >
            <Briefcase className="w-3 h-3 mr-1" />
            {industryName}
          </Badge>
          <span className="text-xs text-muted-foreground">
            Experience level:{" "}
            <span className="font-medium text-foreground">{experience}</span>
          </span>
        </div>
      </section>

      {/* Top row cards */}
      <section className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {/* Market Outlook */}
        <Card className="bg-gradient-to-b from-slate-900/70 to-slate-950 border-slate-800 shadow-lg">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center justify-between text-sm font-semibold">
              <span>Market Outlook</span>
              <BarChart3 className="w-4 h-4 text-sky-400" />
            </CardTitle>
            <CardDescription className="text-xs">
              AI summary of your industry&apos;s current state
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm leading-relaxed text-slate-100">
              {marketOutlook || "No outlook available yet."}
            </p>
          </CardContent>
        </Card>

        {/* Growth */}
        <Card className="bg-gradient-to-b from-slate-900/70 to-slate-950 border-slate-800 shadow-lg">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center justify-between text-sm font-semibold">
              <span>Industry Growth</span>
              <TrendingUp className="w-4 h-4 text-emerald-400" />
            </CardTitle>
            <CardDescription className="text-xs">
              Expected growth rate over the next few years
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-bold text-emerald-400">
                {growthValue.toFixed(1)}%
              </span>
              <span className="text-xs text-muted-foreground">
                projected growth
              </span>
            </div>
            <Progress value={growthValue} className="h-2 bg-slate-800" />
            <p className="text-xs text-muted-foreground">
              Values are approximate and may vary by region and role.
            </p>
          </CardContent>
        </Card>

        {/* Demand level */}
        <Card className="bg-gradient-to-b from-slate-900/70 to-slate-950 border-slate-800 shadow-lg">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center justify-between text-sm font-semibold">
              <span>Demand Level</span>
              <Target className="w-4 h-4 text-pink-400" />
            </CardTitle>
            <CardDescription className="text-xs">
              Overall hiring intensity in this field
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Badge
              className={`${demandColor} border-0 px-3 py-1 text-xs font-semibold`}
            >
              {demandLevel}
            </Badge>
            <Progress value={demandScore} className="h-2 bg-slate-800" />
            <p className="text-xs text-muted-foreground">
              Higher demand can translate to more opportunities and better
              negotiation power.
            </p>
          </CardContent>
        </Card>

        {/* Top skills */}
        <Card className="bg-gradient-to-b from-slate-900/70 to-slate-950 border-slate-800 shadow-lg">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center justify-between text-sm font-semibold">
              <span>Top Skills</span>
              <Sparkles className="w-4 h-4 text-amber-300" />
            </CardTitle>
            <CardDescription className="text-xs">
              Skills commonly requested in job descriptions
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-2">
            {Array.isArray(topSkills) && topSkills.length > 0 ? (
              topSkills.map((skill, idx) => (
                <Badge
                  key={idx}
                  variant="secondary"
                  className="bg-slate-800 border-slate-700 text-xs"
                >
                  {skill}
                </Badge>
              ))
            ) : (
              <p className="text-xs text-muted-foreground">
                No skills data available yet.
              </p>
            )}
          </CardContent>
        </Card>
      </section>

      {/* Middle row: Salary chart + Recommended skills */}
      <section className="grid gap-6 lg:grid-cols-[2.3fr,1.7fr]">
        {/* Salary ranges chart */}
        <Card className="bg-slate-950/90 border-slate-800 shadow-lg">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-sm font-semibold">
              <BarChart3 className="w-4 h-4 text-sky-400" />
              Salary Ranges (Approx. LPA)
            </CardTitle>
            <CardDescription className="text-xs">
              Relative compensation bands by seniority
            </CardDescription>
          </CardHeader>
          <CardContent className="h-64">
            {salaryData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={salaryData} barGap={6}>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="rgba(148, 163, 184, 0.15)"
                    vertical={false}
                  />
                  <XAxis
                    dataKey="name"
                    tick={{ fontSize: 12, fill: "#9CA3AF" }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fontSize: 12, fill: "#9CA3AF" }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#020617",
                      borderColor: "#1f2933",
                      borderRadius: 8,
                      fontSize: 12,
                    }}
                    labelStyle={{ color: "#E5E7EB" }}
                  />
                  <Bar dataKey="min" name="Min LPA" fill="#38bdf8" />
                  <Bar dataKey="max" name="Max LPA" fill="#6366f1" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-xs text-muted-foreground">
                No salary data available.
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recommended skills */}
        <Card className="bg-slate-950/90 border-slate-800 shadow-lg">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-sm font-semibold">
              <Sparkles className="w-4 h-4 text-violet-400" />
              Recommended Skills to Focus On
            </CardTitle>
            <CardDescription className="text-xs">
              Build these to stand out in {industryName}.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {Array.isArray(recommendedSkills) &&
            recommendedSkills.length > 0 ? (
              recommendedSkills.map((skill, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between rounded-lg border border-slate-800/70 bg-slate-900/60 px-3 py-2"
                >
                  <div className="flex items-center gap-2">
                    <span className="h-6 w-6 inline-flex items-center justify-center rounded-full bg-slate-800 text-[11px] text-slate-200">
                      {idx + 1}
                    </span>
                    <span className="text-xs font-medium text-slate-100">
                      {skill}
                    </span>
                  </div>
                  <Badge
                    variant="outline"
                    className="border-slate-700 text-[10px] uppercase tracking-wide"
                  >
                    High Impact
                  </Badge>
                </div>
              ))
            ) : (
              <p className="text-xs text-muted-foreground">
                No recommendations yet. Complete your profile to get AI-powered
                skill suggestions.
              </p>
            )}
          </CardContent>
        </Card>
      </section>

      {/* Bottom row: Trends */}
      <section>
        <Card className="bg-slate-950/90 border-slate-800 shadow-lg">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-sm font-semibold">
              <TrendingUp className="w-4 h-4 text-emerald-400" />
              Industry Trends to Watch
            </CardTitle>
            <CardDescription className="text-xs">
              Keep an eye on these shifts to stay ahead in {industryName}.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {Array.isArray(keyTrends) && keyTrends.length > 0 ? (
              keyTrends.map((trend, idx) => (
                <div key={idx} className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="h-[18px] w-[18px] rounded-full bg-emerald-500/15 flex items-center justify-center text-[10px] text-emerald-300">
                      {idx + 1}
                    </span>
                    <span className="text-xs font-medium text-slate-100">
                      {trend}
                    </span>
                  </div>
                  {/* simple separator line instead of <Separator /> */}
                  <div className="h-px w-full bg-slate-800/70" />
                </div>
              ))
            ) : (
              <p className="text-xs text-muted-foreground">
                No trend data yet. Insights will appear here once generated.
              </p>
            )}
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
