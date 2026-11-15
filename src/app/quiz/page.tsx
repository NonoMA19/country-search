import type { Metadata } from "next";
import Quiz from "@/components/quiz/Quiz";

export const metadata: Metadata = {
  title: "Le quiz | Country Search",
  description: "Réponds à quelques phrases, sans compte : on classe 30 pays selon ce qui compte pour toi. Tes réponses restent dans ton navigateur.",
};

export default function PageQuiz() {
  return <Quiz />;
}
