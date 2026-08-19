import type {
  ExplanationContent,
  GradeBand,
  MountContext,
  SimulationControl,
  SimulationInstance,
  SimulationModule,
  GraphSpec,
  SubjectId,
  WorkspaceLayout,
} from "../types";

/**
 * TEMPORARY DEVELOPMENT SCAFFOLD.
 * ---------------------------------------------------------------------------
 * Placeholder modules declare a simulation's UI contract (controls, graph
 * spec, explanation) WITHOUT any scientific behaviour. `mount()` intentionally
 * does nothing: the viewport renders its "module not connected yet" state
 * because `status === "placeholder"`.
 *
 * To implement a real simulation, create `src/simulations/modules/<id>.ts`
 * exporting a `SimulationModule` with `status: "ready"` and a real `mount()`,
 * then swap the registry entry. Delete nothing else.
 */
export interface PlaceholderSpec {
  id: string;
  subject: SubjectId;
  title: string;
  description: string;
  concepts: string[];
  grade: GradeBand;
  layout?: WorkspaceLayout;
  controls: SimulationControl[];
  explanation: ExplanationContent;
  graph?: GraphSpec;
  aspectRatio?: number;
}

export function createPlaceholderModule(spec: PlaceholderSpec): SimulationModule {
  return {
    ...spec,
    status: "placeholder",
    mount(_context: MountContext): SimulationInstance {
      void _context;
      return {
        destroy() {
          /* nothing to tear down */
        },
      };
    },
  };
}
