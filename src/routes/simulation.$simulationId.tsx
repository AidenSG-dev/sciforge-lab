import { createFileRoute, notFound } from "@tanstack/react-router";
import { getSimulation } from "@/simulations/registry";
import { SimulationWorkspace } from "@/components/simulation/SimulationWorkspace";
import { RoboticsWorkspace } from "@/components/robotics/RoboticsWorkspace";

export const Route = createFileRoute("/simulation/$simulationId")({
  head: ({ params }) => ({
    meta: [
      { title: `${params.simulationId.replaceAll("-", " ")} — SciForge` },
      { name: "description", content: "Explore an interactive SciForge simulation workspace." },
    ],
  }),
  component: SimulationRoute,
});

function SimulationRoute() {
  const { simulationId } = Route.useParams();
  const module = getSimulation(simulationId);
  if (!module) throw notFound();
  return module.layout === "robotics" ? (
    <RoboticsWorkspace module={module} />
  ) : (
    <SimulationWorkspace module={module} />
  );
}
