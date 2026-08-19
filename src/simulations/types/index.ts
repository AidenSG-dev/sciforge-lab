/**
 * SciForge simulation contract.
 * ---------------------------------------------------------------------------
 * This file is the ONLY boundary between the SciForge UI and an individual
 * simulation. The UI owns layout, navigation, controls rendering, measurement
 * presentation, graphs, explanations and loading/error states. A simulation
 * module owns its scientific logic and rendering (Canvas, SVG, WebGL,
 * Three.js, Matter.js, ...).
 *
 * A future developer/agent implementing a simulation should ONLY:
 *   1. create a file under `src/simulations/modules/<id>.ts`
 *   2. export a `SimulationModule`
 *   3. register it in `src/simulations/registry/index.ts`
 * No change to SimulationWorkspace or any UI component is required.
 */

export type SubjectId = "physics" | "chemistry" | "biology" | "robotics";

export type GradeBand = "6-8" | "8-10" | "9-12";

/** Any parameter value a control can produce. */
export type ParamValue = number | boolean | string;

/** Parameter bag owned by the simulation, keyed by control id. */
export type SimulationParams = Record<string, ParamValue>;

/* -------------------------------------------------------------------------- */
/* Controls — declared by the module, rendered by the UI                       */
/* -------------------------------------------------------------------------- */

interface ControlBase {
  /** Unique within the module; used as the parameter key. */
  id: string;
  label: string;
  /** Optional helper text shown under the control. */
  hint?: string;
  /** Optional grouping label, e.g. "Environment". */
  group?: string;
}

export interface SliderControl extends ControlBase {
  kind: "slider";
  min: number;
  max: number;
  step?: number;
  unit?: string;
  defaultValue: number;
}

export interface NumberControl extends ControlBase {
  kind: "number";
  min?: number;
  max?: number;
  step?: number;
  unit?: string;
  defaultValue: number;
}

export interface ToggleControl extends ControlBase {
  kind: "toggle";
  defaultValue: boolean;
}

export interface CheckboxControl extends ControlBase {
  kind: "checkbox";
  defaultValue: boolean;
}

export interface SelectControl extends ControlBase {
  kind: "select";
  options: Array<{ value: string; label: string }>;
  defaultValue: string;
}

export interface ButtonControl extends ControlBase {
  kind: "button";
  /** Sent to the instance via `onAction(actionId)`. */
  actionId: string;
  variant?: "default" | "outline" | "subject";
}

export type SimulationControl =
  | SliderControl
  | NumberControl
  | ToggleControl
  | CheckboxControl
  | SelectControl
  | ButtonControl;

/* -------------------------------------------------------------------------- */
/* Data the simulation pushes back to the UI                                  */
/* -------------------------------------------------------------------------- */

export interface Measurement {
  id: string;
  label: string;
  value: number | string;
  unit?: string;
  /** Digits used when `value` is a number. Defaults to 2. */
  precision?: number;
  /** Highlight as a derived/primary result (e.g. Period). */
  emphasis?: boolean;
}

export interface GraphSeries {
  id: string;
  label: string;
  /** Semantic chart token index (1-5). Defaults to subject accent. */
  colorToken?: 1 | 2 | 3 | 4 | 5;
}

export interface GraphSpec {
  title: string;
  xLabel: string;
  yLabel: string;
  series: GraphSeries[];
  /** Max samples the chart keeps in view. Defaults to 240. */
  window?: number;
}

/** One sample row: `{ x: number, [seriesId]: number }`. */
export type GraphSample = { x: number } & Record<string, number>;

export interface ExplanationContent {
  /** "What's happening?" — may change as parameters change. */
  whatsHappening: string;
  /** "Key concept" — stable educational framing. */
  keyConcept: string;
  /** Optional deeper explanation, revealed on demand. */
  deeperDive?: string;
  /** Optional formula, rendered in mono type. */
  formula?: string;
}

/* -------------------------------------------------------------------------- */
/* Runtime handles                                                            */
/* -------------------------------------------------------------------------- */

/** Channel the UI hands to a module so it can publish state upward. */
export interface SimulationHost {
  /** Replace the full measurement list. */
  publishMeasurements(measurements: Measurement[]): void;
  /** Append one graph sample (UI applies the windowing). */
  publishGraphSample(sample: GraphSample): void;
  /** Replace all graph data at once (e.g. after reset). */
  replaceGraphData(samples: GraphSample[]): void;
  /** Update the explanation panel text. */
  publishExplanation(content: Partial<ExplanationContent>): void;
  /** Report a recoverable/unrecoverable failure; UI shows an error state. */
  reportError(message: string): void;
  /** Reflect running state if the module changes it internally. */
  setRunning(running: boolean): void;
}

export interface MountContext {
  /** Sized element owned by the viewport. Render into this only. */
  container: HTMLElement;
  /** Initial parameter values (module defaults merged with saved state). */
  params: SimulationParams;
  /** Device pixel ratio at mount time. */
  pixelRatio: number;
  host: SimulationHost;
}

/**
 * Live instance returned by `SimulationModule.mount`.
 * All methods are optional except `destroy` so trivial modules stay small.
 */
export interface SimulationInstance {
  start?(): void;
  pause?(): void;
  reset?(): void;
  /** Called on container resize (ResizeObserver) — width/height in CSS px. */
  resize?(width: number, height: number): void;
  /** A single parameter changed. */
  setParam?(id: string, value: ParamValue): void;
  /** All parameters changed at once (e.g. preset applied). */
  setParams?(params: SimulationParams): void;
  /** A `ButtonControl` was pressed. */
  onAction?(actionId: string): void;
  /** Tear down timers, listeners, GL contexts, workers. Required. */
  destroy(): void;
}

/** Layout shell the workspace should use for this module. */
export type WorkspaceLayout = "standard" | "robotics";

export interface SimulationModule {
  id: string;
  subject: SubjectId;
  title: string;
  /** One-line description used on cards and in the workspace header. */
  description: string;
  concepts: string[];
  grade: GradeBand;
  layout?: WorkspaceLayout;
  /**
   * `placeholder` = architecture only, no scientific behaviour yet.
   * `ready` = a real simulation is connected.
   */
  status: "ready" | "placeholder";
  controls: SimulationControl[];
  /** Static explanation content; a module may refine it at runtime. */
  explanation: ExplanationContent;
  /** Omit when the simulation has no time-series output. */
  graph?: GraphSpec;
  /** Optional preferred aspect ratio for the viewport (width / height). */
  aspectRatio?: number;
  /**
   * Create the running simulation. May be async (dynamic import of a heavy
   * renderer is encouraged so the UI bundle stays small).
   */
  mount(context: MountContext): SimulationInstance | Promise<SimulationInstance>;
}

/** Derive default params from a module's control declarations. */
export function defaultParamsFor(module: SimulationModule): SimulationParams {
  const params: SimulationParams = {};
  for (const control of module.controls) {
    if (control.kind === "button") continue;
    params[control.id] = control.defaultValue;
  }
  return params;
}
