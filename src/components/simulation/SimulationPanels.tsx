import {
  AlertTriangle,
  Beaker,
  BrainCircuit,
  CircleHelp,
  FlaskConical,
  RotateCcw,
} from "lucide-react";
import { Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  useSimulationStore,
  type ExperimentNotes,
  type SimulationStatus,
} from "@/stores/simulationStore";
import type { ExplanationContent, GraphSpec, Measurement } from "@/simulations/types";

export function SimulationViewport({
  simulationId,
  cellType,
  containerRef,
  status,
  errorMessage,
  title,
  aspectRatio,
}: {
  simulationId?: string;
  cellType: string | undefined;
  containerRef: React.RefObject<HTMLDivElement | null>;
  status: SimulationStatus;
  errorMessage: string | null;
  title: string;
  aspectRatio: number | undefined;
}) {
  const copy: Record<SimulationStatus, { label: string; detail: string; icon: typeof Beaker }> = {
    idle: { label: "Simulation slot", detail: "Waiting for a module to connect.", icon: Beaker },
    loading: {
      label: "Loading module",
      detail: "Preparing the renderer and runtime bridge.",
      icon: RotateCcw,
    },
    ready: {
      label: "Renderer surface",
      detail: "The simulation module owns this surface.",
      icon: FlaskConical,
    },
    resetting: {
      label: "Resetting experiment",
      detail: "Restoring the module's declared defaults.",
      icon: RotateCcw,
    },
    unavailable: {
      label: "Module not connected yet",
      detail: "This viewport is ready for a future Canvas, SVG, WebGL, or Three.js module.",
      icon: Beaker,
    },
    error: {
      label: "Simulation error",
      detail: errorMessage ?? "The module reported a recoverable error.",
      icon: AlertTriangle,
    },
  };
  const state = copy[status] ?? copy.idle;
  const Icon = state.icon;
  const normalizedCellType = cellType?.trim().toLowerCase();
  const selectedCellModel =
    normalizedCellType === "plant" || normalizedCellType === "plant cell"
      ? "plant"
      : normalizedCellType === "animal" || normalizedCellType === "animal cell"
        ? "animal"
        : normalizedCellType === "bacterial" || normalizedCellType === "bacterial cell"
          ? "bacterial"
          : null;
  return (
    <section className="panel overflow-hidden">
      <div className="flex items-center justify-between border-b border-border px-4 py-3">
        <div>
          <p className="panel-label">Simulation viewport</p>
          <p className="mt-1 text-xs text-muted-foreground">{title}</p>
        </div>
        <span className={`status-dot ${status === "ready" ? "status-dot-live" : ""}`}>
          <span />
          {status.toUpperCase()}
        </span>
      </div>
      <div
        className="relative m-3 overflow-hidden rounded-lg border border-border bg-[color-mix(in_oklch,var(--surface-0)_84%,var(--subject)_16%)]"
        style={{ aspectRatio }}
      >
        {simulationId === "biology-cell" && selectedCellModel !== null ? (
          <div className="absolute inset-0 bg-background">
            <iframe
              key={selectedCellModel}
              title={
                selectedCellModel === "plant"
                  ? "Eukaryotic Plant Cell 3D model by jlf_illustration on Sketchfab"
                  : selectedCellModel === "bacterial"
                    ? "Bacterial cell structure 3D model by Ebers on Sketchfab"
                    : "Animal Cell 3D model by aremay on Sketchfab"
              }
              src={
                selectedCellModel === "plant"
                  ? "https://sketchfab.com/models/f258c65762e5435c9d58c1aa136b557a/embed?autospin=1"
                  : selectedCellModel === "bacterial"
                    ? "https://sketchfab.com/models/42439edc90cd4d87b8ae322a4dcee8de/embed"
                    : "https://sketchfab.com/models/0b15c013059844d7a26c1f16752f8b61/embed"
              }
              className="absolute inset-0 h-full w-full border-0"
              allow="autoplay; fullscreen; xr-spatial-tracking"
              allowFullScreen
              referrerPolicy="strict-origin-when-cross-origin"
            />
            <a
              href={
                selectedCellModel === "plant"
                  ? "https://sketchfab.com/3d-models/eukaryotic-plant-cell-f258c65762e5435c9d58c1aa136b557a"
                  : selectedCellModel === "bacterial"
                    ? "https://sketchfab.com/3d-models/bacterial-cell-structure-42439edc90cd4d87b8ae322a4dcee8de"
                    : "https://sketchfab.com/3d-models/animal-cell-0b15c013059844d7a26c1f16752f8b61"
              }
              target="_blank"
              rel="noreferrer"
              className="absolute bottom-2 left-2 rounded bg-black/70 px-2 py-1 font-mono text-[10px] text-white/80 backdrop-blur transition-colors hover:text-white"
            >
              {selectedCellModel === "plant"
                ? "Eukaryotic Plant Cell · Sketchfab · by jlf_illustration"
                : selectedCellModel === "bacterial"
                  ? "Bacterial cell structure · Sketchfab · by Ebers"
                  : "Animal Cell · Sketchfab · by aremay"}
            </a>
          </div>
        ) : (
          <>
            <div ref={containerRef} className="absolute inset-0" />
            {status !== "ready" && (
              <>
                <div className="absolute inset-0 lab-grid opacity-60" />
                <div className="relative flex h-full min-h-64 flex-col items-center justify-center px-8 text-center">
                  <div
                    className={`mb-4 flex size-14 items-center justify-center rounded-2xl border border-subject/30 bg-subject/10 text-subject ${status === "loading" || status === "resetting" ? "animate-pulse" : ""}`}
                  >
                    <Icon className="size-6" />
                  </div>
                  <p className="font-display text-lg font-semibold text-foreground">
                    {state.label}
                  </p>
                  <p className="mt-2 max-w-md text-sm leading-6 text-muted-foreground">
                    {state.detail}
                  </p>
                  {status === "unavailable" && (
                    <p className="mt-5 rounded-full border border-border bg-background/70 px-3 py-1.5 font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
                      integration surface / awaiting renderer
                    </p>
                  )}
                </div>
              </>
            )}
          </>
        )}
      </div>
    </section>
  );
}

export function MeasurementsPanel({ measurements }: { measurements: Measurement[] }) {
  return (
    <section className="panel">
      <header className="border-b border-border px-4 py-3">
        <p className="panel-label">Current measurements</p>
      </header>
      <div className="grid grid-cols-2 divide-x divide-y divide-border sm:grid-cols-4 sm:divide-y-0">
        {measurements.length ? (
          measurements.map((measurement) => (
            <div key={measurement.id} className="px-4 py-4">
              <p className="text-xs text-muted-foreground">{measurement.label}</p>
              <p
                className={`mt-1 font-mono text-lg ${measurement.emphasis ? "text-subject" : "text-foreground"}`}
              >
                {typeof measurement.value === "number"
                  ? measurement.value.toFixed(measurement.precision ?? 2)
                  : measurement.value}
                <span className="ml-1 text-xs text-muted-foreground">{measurement.unit}</span>
              </p>
            </div>
          ))
        ) : (
          <div className="col-span-full px-4 py-5 text-sm text-muted-foreground">
            Measurements will appear here when a simulation module publishes them.
          </div>
        )}
      </div>
    </section>
  );
}

const chartColors = [
  "var(--chart-1)",
  "var(--chart-2)",
  "var(--chart-3)",
  "var(--chart-4)",
  "var(--chart-5)",
];
export function GraphPanel({
  graph,
  data,
  measurements = [],
}: {
  graph: GraphSpec | undefined;
  data: Array<Record<string, number>>;
  measurements?: Measurement[];
}) {
  if (!graph)
    return (
      <section className="panel px-4 py-5">
        <p className="panel-label">Graph</p>
        <p className="mt-3 text-sm text-muted-foreground">
          This module has not declared a time-series output.
        </p>
      </section>
    );
  const period = measurements.find((measurement) => measurement.id === "period");
  const frequency = measurements.find((measurement) => measurement.id === "frequency");
  const points = data;
  return (
    <section className="panel overflow-hidden">
      <header className="flex items-center justify-between border-b border-border px-4 py-3">
        <div>
          <p className="panel-label">{graph.title}</p>
          <p className="mt-1 text-xs text-muted-foreground">
            {graph.xLabel} · {graph.yLabel}
          </p>
        </div>
        <span className="rounded-full border border-border px-2 py-1 font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
          {data.length ? "live data" : "waiting for run"}
        </span>
      </header>
      {(period || frequency) && (
        <div className="grid grid-cols-2 divide-x divide-border border-b border-border">
          <div className="px-4 py-3">
            <p className="panel-label">Measured period (T)</p>
            <p className="mt-1 font-mono text-lg text-subject">
              {typeof period?.value === "number"
                ? period.value.toFixed(period.precision ?? 2)
                : "—"}
              <span className="ml-1 text-xs text-muted-foreground">s</span>
            </p>
          </div>
          <div className="px-4 py-3">
            <p className="panel-label">Frequency (f = 1/T)</p>
            <p className="mt-1 font-mono text-lg text-subject">
              {typeof frequency?.value === "number"
                ? frequency.value.toFixed(frequency.precision ?? 2)
                : "—"}
              <span className="ml-1 text-xs text-muted-foreground">Hz</span>
            </p>
          </div>
        </div>
      )}
      <div className="relative h-64 px-2 py-4 sm:h-72 sm:px-4">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={points} margin={{ top: 8, right: 12, left: -18, bottom: 0 }}>
            <XAxis
              dataKey="x"
              tick={{ fill: "var(--muted-foreground)", fontSize: 10 }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              tick={{ fill: "var(--muted-foreground)", fontSize: 10 }}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip
              contentStyle={{
                background: "var(--surface-1)",
                border: "1px solid var(--border)",
                borderRadius: 8,
                fontSize: 12,
              }}
            />
            {graph.series.map((series, index) => (
              <Line
                key={series.id}
                type="monotone"
                dataKey={series.id}
                name={series.label}
                stroke={chartColors[(series.colorToken ?? index + 1) - 1]}
                strokeWidth={3}
                dot={false}
                isAnimationActive={false}
                connectNulls
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
        {!data.length && (
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center pt-8 text-xs text-muted-foreground">
            Press Play to record live angle data.
          </div>
        )}
      </div>
    </section>
  );
}

export function ExplanationPanel({ explanation }: { explanation: ExplanationContent | null }) {
  if (!explanation) return null;
  return (
    <section className="panel">
      <header className="flex items-center gap-2 border-b border-border px-4 py-3">
        <CircleHelp className="size-4 text-subject" />
        <p className="panel-label">What's happening?</p>
      </header>
      <div className="grid gap-6 p-5 md:grid-cols-[1.15fr_1fr]">
        <div>
          <p className="text-sm leading-7 text-foreground">{explanation.whatsHappening}</p>
          {explanation.formula && (
            <p className="mt-5 inline-flex rounded-md border border-subject/25 bg-subject/10 px-3 py-2 font-mono text-sm text-subject">
              {explanation.formula}
            </p>
          )}
        </div>
        <div className="border-l border-border pl-5">
          <p className="panel-label text-subject">Key concept</p>
          <p className="mt-2 text-sm leading-7 text-muted-foreground">{explanation.keyConcept}</p>
          {explanation.deeperDive && (
            <p className="mt-3 text-xs leading-6 text-muted-foreground">{explanation.deeperDive}</p>
          )}
        </div>
      </div>
    </section>
  );
}

export function ExperimentPanel({
  notes,
  onChange,
  onClear,
}: {
  notes: ExperimentNotes;
  onChange(field: keyof ExperimentNotes, value: string): void;
  onClear(): void;
}) {
  return (
    <section className="panel">
      <header className="flex items-center justify-between border-b border-border px-4 py-3">
        <div className="flex items-center gap-2">
          <BrainCircuit className="size-4 text-subject" />
          <p className="panel-label">Experiment notes</p>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={onClear}
          className="h-7 text-xs text-muted-foreground"
        >
          Clear
        </Button>
      </header>
      <div className="grid gap-4 p-4 md:grid-cols-3">
        {(["hypothesis", "observation", "conclusion"] as const).map((field) => (
          <label key={field} className="space-y-2">
            <span className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
              {field}
            </span>
            <Textarea
              value={notes[field]}
              onChange={(event) => onChange(field, event.target.value)}
              placeholder={
                field === "hypothesis"
                  ? "What do you think will happen?"
                  : field === "observation"
                    ? "What changed?"
                    : "Why did it happen?"
              }
              className="min-h-24 resize-none bg-background text-sm"
            />
          </label>
        ))}
      </div>
    </section>
  );
}
