import type { Metadata } from "next";
import Quiz from "@/components/quiz/Quiz";

export const metadata: Metadata = { title: "Le quiz | Country Search" };

export default function PageQuiz() {
  return <Quiz />;
}
