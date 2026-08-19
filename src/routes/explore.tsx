import { createFileRoute } from "@tanstack/react-router";
import { ExploreContent } from "@/components/discovery/ExploreContent";
export const Route = createFileRoute("/explore")({
  head: () => ({
    meta: [
      { title: "Explore Simulations — SciForge" },
      {
        name: "description",
        content: "Browse the SciForge simulation catalogue by subject, grade, and concept.",
      },
    ],
  }),
  component: ExploreContent,
});
