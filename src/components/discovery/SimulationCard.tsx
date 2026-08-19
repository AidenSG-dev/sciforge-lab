import { Link } from "@tanstack/react-router";
import { ArrowUpRight, Atom, Brain, CircuitBoard, Waves } from "lucide-react";
import type { SimulationModule } from "@/simulations/types";
import { getSubject } from "@/lib/subjects";

const icons = { physics: Waves, chemistry: Atom, biology: Brain, robotics: CircuitBoard } as const;
export function SimulationCard({ module }: { module: SimulationModule }) {
  const subject = getSubject(module.subject);
  const Icon = icons[module.subject];
  return (
    <Link
      to="/simulation/$simulationId"
      params={{ simulationId: module.id }}
      data-subject={module.subject}
      className="group panel relative block overflow-hidden p-5 transition-transform hover:-translate-y-1"
    >
      <div className="absolute right-0 top-0 size-32 translate-x-10 -translate-y-10 rounded-full bg-subject/10 blur-2xl transition-opacity group-hover:opacity-100" />
      <div className="relative">
        <div className="mb-6 flex items-start justify-between">
          <div className="flex size-11 items-center justify-center rounded-xl border border-subject/30 bg-subject/10 text-subject">
            <Icon className="size-5" />
          </div>
          <ArrowUpRight className="size-4 text-muted-foreground transition-colors group-hover:text-subject" />
        </div>
        <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-subject">
          {subject.name} · {module.grade}
        </p>
        <h3 className="mt-2 font-display text-lg font-semibold text-foreground">{module.title}</h3>
        <p className="mt-2 min-h-12 text-sm leading-6 text-muted-foreground">
          {module.description}
        </p>
        <div className="mt-5 flex flex-wrap gap-1.5">
          {module.concepts.map((concept) => (
            <span
              key={concept}
              className="rounded-full bg-background px-2 py-1 text-[10px] text-muted-foreground"
            >
              {concept}
            </span>
          ))}
        </div>
        <div className="mt-6 flex items-center justify-between border-t border-border pt-4 text-xs text-muted-foreground">
          <span>
            {module.status === "placeholder" ? "Integration preview" : "Ready to explore"}
          </span>
          <span className="font-medium text-foreground group-hover:text-subject">
            Open simulation
          </span>
        </div>
      </div>
    </Link>
  );
}
