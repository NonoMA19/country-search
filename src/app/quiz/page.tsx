import type { Metadata } from "next";
import Quiz from "@/components/quiz/Quiz";
import { pays } from "@/lib/pays";

export const metadata: Metadata = {
  title: "Le quiz | Orizo",
  description: `Réponds à quelques phrases, sans compte : on classe ${pays.length} pays selon ce qui compte pour toi. Tes réponses restent dans ton navigateur.`,
};

export default function PageQuiz() {
  return <Quiz />;
}
