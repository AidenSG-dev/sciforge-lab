import { createFileRoute } from "@tanstack/react-router";
import { SubjectContent } from "@/components/discovery/ExploreContent";
export const Route = createFileRoute("/chemistry")({
  head: () => ({
    meta: [
      { title: "Chemistry Laboratory — SciForge" },
      {
        name: "description",
        content:
          "Investigate matter, reactions, and bonding through interactive chemistry simulations.",
      },
    ],
  }),
  component: () => <SubjectContent subjectId="chemistry" />,
});
