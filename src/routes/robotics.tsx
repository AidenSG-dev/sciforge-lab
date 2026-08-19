import { createFileRoute } from "@tanstack/react-router";
import { SubjectContent } from "@/components/discovery/ExploreContent";
export const Route = createFileRoute("/robotics")({
  head: () => ({
    meta: [
      { title: "Robotics Laboratory — SciForge" },
      {
        name: "description",
        content:
          "Build circuits and explore sensors, automation, and control logic through robotics simulations.",
      },
    ],
  }),
  component: () => <SubjectContent subjectId="robotics" />,
});
