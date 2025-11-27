import Link from "next/link";
import { Button } from "@/components/ui/button";
import { generateQuiz } from "@/actions/interview";
import Quiz from "../_components/quiz";

export default async function MockInterviewPage() {
  // You can pass the user industry here if you track it; "IT" as default
  const questions = await generateQuiz("IT");

  return (
    <div className="space-y-6">
      {/* Header with back button */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-3xl md:text-4xl font-bold">
            Mock Interview Quiz
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Answer the questions below. Your score and tips will be saved in your
            interview history.
          </p>
        </div>

        <Link href="/interview">
          <Button variant="outline" size="sm">
            Back to Interview Overview
          </Button>
        </Link>
      </div>

      {/* Quiz component (client-side) */}
      <Quiz questions={questions} />
    </div>
  );
}
