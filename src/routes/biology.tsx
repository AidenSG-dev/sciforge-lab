import { createFileRoute } from "@tanstack/react-router";
import { SubjectContent } from "@/components/discovery/ExploreContent";
export const Route = createFileRoute("/biology")({
  head: () => ({
    meta: [
      { title: "Biology Laboratory — SciForge" },
      {
        name: "description",
        content: "Look inside cells and living systems through interactive biology simulations.",
      },
    ],
  }),
  component: () => <SubjectContent subjectId="biology" />,
});
