import { createFileRoute } from "@tanstack/react-router";
import { SubjectContent } from "@/components/discovery/ExploreContent";
export const Route = createFileRoute("/physics")({
  head: () => ({
    meta: [
      { title: "Physics Laboratory — SciForge" },
      {
        name: "description",
        content:
          "Explore motion, forces, electricity, and light through interactive physics simulations.",
      },
    ],
  }),
  component: () => <SubjectContent subjectId="physics" />,
});
