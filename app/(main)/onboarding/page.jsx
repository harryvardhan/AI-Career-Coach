"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { updateUser } from "@/actions/user";
import { toast } from "sonner";

import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/components/ui/card";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";

export default function OnboardingPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);

    const formData = new FormData(e.target);
    const result = await updateUser(null, formData);

    setLoading(false);

    if (result?.success) {
      toast.success("Profile updated successfully!");
      router.push("/dashboard");
    } else {
      toast.error("Failed to update profile");
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <Card className="w-full max-w-xl shadow-lg border border-border/40">
        <CardHeader>
          <CardTitle className="text-3xl font-bold text-center">
            Complete Your Profile
          </CardTitle>
          <CardDescription className="text-center">
            Help us personalize your AI career experience
          </CardDescription>
        </CardHeader>

        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-5 mt-2">

            <div className="grid grid-cols-1 gap-5">
              {/* Name */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Full Name</label>
                <Input name="name" placeholder="Harsh Vardhan" required />
              </div>

              {/* Email */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Email Address</label>
                <Input
                  type="email"
                  name="email"
                  placeholder="you@example.com"
                  required
                />
              </div>

              {/* Role */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Your Role</label>
                <Input name="role" placeholder="Frontend Developer" />
              </div>

              {/* Industry */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Industry</label>

                <Select name="industry" required>
                  <SelectTrigger>
                    <SelectValue placeholder="Select your industry" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="IT">IT / Software</SelectItem>
                    <SelectItem value="Finance">Finance</SelectItem>
                    <SelectItem value="Healthcare">Healthcare</SelectItem>
                    <SelectItem value="Marketing">Marketing</SelectItem>
                    <SelectItem value="Engineering">Engineering</SelectItem>
                    <SelectItem value="Education">Education</SelectItem>
                    <SelectItem value="Other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Experience */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Experience Level</label>

                <Select name="experience">
                  <SelectTrigger>
                    <SelectValue placeholder="Select experience level" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Fresher">Fresher</SelectItem>
                    <SelectItem value="1-2 Years">1–2 Years</SelectItem>
                    <SelectItem value="3-5 Years">3–5 Years</SelectItem>
                    <SelectItem value="Senior">Senior (5+ Years)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Skills */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Skills</label>
                <Input
                  name="skills"
                  placeholder="HTML, CSS, JavaScript, React"
                />
                <p className="text-xs text-muted-foreground">
                  Add comma-separated skills
                </p>
              </div>

              {/* Bio */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Short Bio</label>
                <Textarea
                  name="bio"
                  placeholder="Describe yourself in a few words..."
                  rows="3"
                />
              </div>
            </div>
          </CardContent>

          <CardFooter>
            <Button type="submit" disabled={loading} className="w-full">
              {loading ? "Updating..." : "Complete Profile"}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
