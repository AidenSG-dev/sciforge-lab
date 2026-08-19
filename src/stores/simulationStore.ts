import { create } from "zustand";
import type {
  ExplanationContent,
  GraphSample,
  Measurement,
  ParamValue,
  SimulationParams,
} from "@/simulations/types";

export type SimulationStatus = "idle" | "loading" | "ready" | "resetting" | "unavailable" | "error";

export interface ExperimentNotes {
  hypothesis: string;
  observation: string;
  conclusion: string;
}

interface SimulationState {
  /** Currently mounted simulation id, if any. */
  activeId: string | null;
  status: SimulationStatus;
  errorMessage: string | null;
  running: boolean;
  params: SimulationParams;
  measurements: Measurement[];
  graphData: GraphSample[];
  graphWindow: number;
  explanation: ExplanationContent | null;
  notes: ExperimentNotes;

  beginSession(id: string, params: SimulationParams, explanation: ExplanationContent, graphWindow?: number): void;
  endSession(): void;
  setStatus(status: SimulationStatus): void;
  setError(message: string | null): void;
  setRunning(running: boolean): void;
  setParam(id: string, value: ParamValue): void;
  resetParams(params: SimulationParams): void;
  setMeasurements(measurements: Measurement[]): void;
  appendGraphSample(sample: GraphSample): void;
  replaceGraphData(samples: GraphSample[]): void;
  patchExplanation(content: Partial<ExplanationContent>): void;
  setNote(field: keyof ExperimentNotes, value: string): void;
  clearNotes(): void;
}

const emptyNotes: ExperimentNotes = { hypothesis: "", observation: "", conclusion: "" };

export const useSimulationStore = create<SimulationState>((set) => ({
  activeId: null,
  status: "idle",
  errorMessage: null,
  running: false,
  params: {},
  measurements: [],
  graphData: [],
  graphWindow: 240,
  explanation: null,
  notes: emptyNotes,

  beginSession: (id, params, explanation, graphWindow = 240) =>
    set({
      activeId: id,
      status: "loading",
      errorMessage: null,
      running: false,
      params,
      measurements: [],
      graphData: [],
      graphWindow,
      explanation,
      notes: emptyNotes,
    }),
  endSession: () => set({ activeId: null, status: "idle", running: false, measurements: [], graphData: [] }),
  setStatus: (status) => set({ status }),
  setError: (errorMessage) => set({ errorMessage, status: errorMessage ? "error" : "ready" }),
  setRunning: (running) => set({ running }),
  setParam: (id, value) => set((s) => ({ params: { ...s.params, [id]: value } })),
  resetParams: (params) => set({ params }),
  setMeasurements: (measurements) => set({ measurements }),
  appendGraphSample: (sample) =>
    set((s) => {
      const next = [...s.graphData, sample];
      return { graphData: next.length > s.graphWindow ? next.slice(next.length - s.graphWindow) : next };
    }),
  replaceGraphData: (graphData) => set({ graphData }),
  patchExplanation: (content) =>
    set((s) => ({ explanation: s.explanation ? { ...s.explanation, ...content } : null })),
  setNote: (field, value) => set((s) => ({ notes: { ...s.notes, [field]: value } })),
  clearNotes: () => set({ notes: emptyNotes }),
}));
