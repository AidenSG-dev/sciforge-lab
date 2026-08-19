import { Link } from "@tanstack/react-router";
import { ArrowLeft, Orbit } from "lucide-react";
import { useSimulationStore } from "@/stores/simulationStore";
import { getSubject } from "@/lib/subjects";
import type { SimulationModule } from "@/simulations/types";
import { SimulationControls } from "./SimulationControls";
import { useSimulationRuntime } from "./useSimulationRuntime";
import {
  ExperimentPanel,
  ExplanationPanel,
  GraphPanel,
  MeasurementsPanel,
  SimulationViewport,
} from "./SimulationPanels";

export function SimulationWorkspace({ module }: { module: SimulationModule }) {
  const subject = getSubject(module.subject);
  const runtime = useSimulationRuntime(module);
  const status = useSimulationStore((state) => state.status);
  const running = useSimulationStore((state) => state.running);
  const params = useSimulationStore((state) => state.params);
  const measurements = useSimulationStore((state) => state.measurements);
  const graphData = useSimulationStore((state) => state.graphData);
  const explanation = useSimulationStore((state) => state.explanation);
  const notes = useSimulationStore((state) => state.notes);
  const errorMessage = useSimulationStore((state) => state.errorMessage);
  const setNote = useSimulationStore((state) => state.setNote);
  const clearNotes = useSimulationStore((state) => state.clearNotes);
  return (
    <div data-subject={module.subject} className="subject-tint min-h-screen pb-16">
      <main className="container pt-8">
        <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
          <Link
            to={subject.path}
            className="inline-flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            <ArrowLeft className="size-4" /> Back to {subject.name}
          </Link>
          <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
            module / {module.id}
          </span>
        </div>
        <header className="mb-8 grid gap-5 md:grid-cols-[1fr_auto] md:items-end">
          <div>
            <div className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.22em] text-subject">
              <Orbit className="size-4" /> {subject.name} laboratory
            </div>
            <h1 className="max-w-3xl font-display text-3xl font-semibold tracking-tight text-foreground sm:text-5xl">
              {module.title}
            </h1>
            <p className="mt-3 max-w-2xl text-base leading-7 text-muted-foreground">
              {module.description}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {module.concepts.map((concept) => (
              <span
                key={concept}
                className="rounded-full border border-border bg-panel px-3 py-1.5 text-xs text-muted-foreground"
              >
                {concept}
              </span>
            ))}
          </div>
        </header>
        <div className="grid gap-4 lg:grid-cols-[minmax(16rem,0.32fr)_minmax(0,1fr)]">
          <div className="min-h-[30rem]">
            <SimulationControls
              controls={module.controls}
              params={params}
              disabled={status === "loading" || status === "resetting"}
              running={running}
              onParamChange={runtime.setParam}
              onAction={runtime.runAction}
              onStart={runtime.start}
              onPause={runtime.pause}
              onReset={runtime.reset}
            />
          </div>
          <SimulationViewport
            simulationId={module.id}
            cellType={typeof params["cellType"] === "string" ? params["cellType"] : "animal"}
            containerRef={runtime.containerRef}
            status={status}
            errorMessage={errorMessage}
            title={module.title}
            aspectRatio={module.aspectRatio}
          />
        </div>
        <div className="mt-4">
          <MeasurementsPanel measurements={measurements} />
        </div>
        <div className="mt-4">
          <GraphPanel graph={module.graph} data={graphData} measurements={measurements} />
        </div>
        <div className="mt-4">
          <ExplanationPanel explanation={explanation} />
        </div>
        <div className="mt-4">
          <ExperimentPanel notes={notes} onChange={setNote} onClear={clearNotes} />
        </div>
      </main>
    </div>
  );
}
