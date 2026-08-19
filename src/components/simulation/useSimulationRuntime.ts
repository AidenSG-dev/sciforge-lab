import { useCallback, useEffect, useRef } from "react";
import { useSimulationStore } from "@/stores/simulationStore";
import {
  defaultParamsFor,
  type ParamValue,
  type SimulationHost,
  type SimulationInstance,
  type SimulationModule,
} from "@/simulations/types";

/**
 * Bridges a `SimulationModule` to the UI store. The workspace never touches a
 * simulation instance directly — it only calls the handles returned here.
 */
export function useSimulationRuntime(module: SimulationModule | undefined) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const instanceRef = useRef<SimulationInstance | null>(null);

  const store = useSimulationStore;

  useEffect(() => {
    if (!module) {
      store.getState().setStatus("unavailable");
      return;
    }

    let cancelled = false;
    const params = defaultParamsFor(module);
    store
      .getState()
      .beginSession(module.id, params, module.explanation, module.graph?.window ?? 240);

    // Placeholder modules have no behaviour: the viewport shows the
    // "module not connected yet" state instead of mounting a renderer.
    if (module.status === "placeholder") {
      store.getState().setStatus("unavailable");
      return () => {
        store.getState().endSession();
      };
    }

    const container = containerRef.current;
    if (!container) {
      store.getState().setError("Simulation viewport is not ready.");
      return;
    }

    const host: SimulationHost = {
      publishMeasurements: (m) => store.getState().setMeasurements(m),
      publishGraphSample: (s) => store.getState().appendGraphSample(s),
      replaceGraphData: (s) => store.getState().replaceGraphData(s),
      publishExplanation: (c) => store.getState().patchExplanation(c),
      reportError: (message) => store.getState().setError(message),
      setRunning: (running) => store.getState().setRunning(running),
    };

    let observer: ResizeObserver | undefined;

    void Promise.resolve(
      module.mount({
        container,
        params,
        pixelRatio: typeof window === "undefined" ? 1 : window.devicePixelRatio,
        host,
      }),
    )
      .then((instance) => {
        if (cancelled) {
          instance.destroy();
          return;
        }
        instanceRef.current = instance;
        store.getState().setStatus("ready");

        observer = new ResizeObserver((entries) => {
          const rect = entries[0]?.contentRect;
          if (rect) instance.resize?.(rect.width, rect.height);
        });
        observer.observe(container);
      })
      .catch((error: unknown) => {
        if (cancelled) return;
        store
          .getState()
          .setError(error instanceof Error ? error.message : "The simulation failed to load.");
      });

    return () => {
      cancelled = true;
      observer?.disconnect();
      instanceRef.current?.destroy();
      instanceRef.current = null;
      store.getState().endSession();
    };
  }, [module, store]);

  const start = useCallback(() => {
    instanceRef.current?.start?.();
    store.getState().setRunning(true);
  }, [store]);

  const pause = useCallback(() => {
    instanceRef.current?.pause?.();
    store.getState().setRunning(false);
  }, [store]);

  const reset = useCallback(() => {
    if (!module) return;
    const state = store.getState();
    state.setStatus("resetting");
    state.setRunning(false);
    const params = defaultParamsFor(module);
    state.resetParams(params);
    state.replaceGraphData([]);
    instanceRef.current?.reset?.();
    instanceRef.current?.setParams?.(params);
    window.setTimeout(() => {
      const s = store.getState();
      s.setStatus(module.status === "placeholder" ? "unavailable" : "ready");
    }, 420);
  }, [module, store]);

  const setParam = useCallback(
    (id: string, value: ParamValue) => {
      store.getState().setParam(id, value);
      instanceRef.current?.setParam?.(id, value);
    },
    [store],
  );

  const runAction = useCallback((actionId: string) => {
    instanceRef.current?.onAction?.(actionId);
  }, []);

  return { containerRef, start, pause, reset, setParam, runAction };
}
