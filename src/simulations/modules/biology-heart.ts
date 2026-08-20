import type {
  MountContext,
  SimulationInstance,
  SimulationModule,
  SimulationParams,
} from "../types";

const DEFAULT_RATE = 72;
function numberParam(params: SimulationParams, id: string, fallback: number) {
  return typeof params[id] === "number" && Number.isFinite(params[id]) ? params[id] : fallback;
}
function boolParam(params: SimulationParams, id: string, fallback: boolean) {
  return typeof params[id] === "boolean" ? params[id] : fallback;
}
function svg<K extends keyof SVGElementTagNameMap>(tag: K, attrs: Record<string, string>) {
  const node = document.createElementNS("http://www.w3.org/2000/svg", tag);
  Object.entries(attrs).forEach(([key, value]) => node.setAttribute(key, value));
  return node as SVGElementTagNameMap[K];
}
function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

export const biologyHeart: SimulationModule = {
  id: "biology-heart",
  subject: "biology",
  title: "Heart Circulation",
  description: "Follow blood through the heart, lungs and body as the heart rate changes.",
  concepts: ["Double circulation", "Gas exchange", "Heart rate"],
  grade: "8-10",
  status: "ready",
  aspectRatio: 4 / 3,
  controls: [
    {
      kind: "slider",
      id: "heartRate",
      label: "Heart Rate",
      min: 40,
      max: 180,
      step: 1,
      unit: "bpm",
      defaultValue: DEFAULT_RATE,
      group: "Body state",
    },
    {
      kind: "checkbox",
      id: "labels",
      label: "Show chamber labels",
      defaultValue: true,
      group: "Display",
    },
    {
      kind: "checkbox",
      id: "highlightOxygen",
      label: "Highlight oxygenation",
      defaultValue: true,
      group: "Display",
    },
  ],
  graph: {
    title: "Circulation flow vs time",
    xLabel: "Time (s)",
    yLabel: "Relative flow",
    series: [{ id: "flow", label: "Blood flow", colorToken: 2 }],
    window: 180,
  },
  explanation: {
    whatsHappening:
      "Deoxygenated blood returns from the body to the right side of the heart, travels to the lungs, then oxygenated blood returns to the left side and is pumped to the body.",
    keyConcept:
      "The heart drives two linked loops: pulmonary circulation to the lungs and systemic circulation to the body.",
    deeperDive:
      "The four chambers work in sequence. Valves keep blood moving forward instead of flowing backward.",
    formula: "Body → RA → RV → Lungs → LA → LV → Body",
  },
  mount({ container, host, params: initial }: MountContext): SimulationInstance {
    let params = { ...initial };
    let running = false;
    let raf = 0;
    let last = performance.now();
    let elapsed = 0;
    let phase = 0;
    let graphClock = 0;
    let width = 800;
    let height = 600;
    const root = document.createElement("div");
    root.className = "absolute inset-0 overflow-hidden";
    container.replaceChildren(root);
    const scene = svg("svg", {
      viewBox: "0 0 900 650",
      class: "h-full w-full",
      role: "img",
      "aria-label": "Animated heart circulation model",
      preserveAspectRatio: "xMidYMid meet",
    });
    const defs = svg("defs", {});
    const bg = svg("linearGradient", { id: "heart-bg", x1: "0", y1: "0", x2: "0", y2: "1" });
    bg.append(
      svg("stop", { offset: "0%", "stop-color": "#141a36" }),
      svg("stop", { offset: "100%", "stop-color": "#080b19" }),
    );
    const grid = svg("pattern", {
      id: "heart-grid",
      width: "32",
      height: "32",
      patternUnits: "userSpaceOnUse",
    });
    grid.append(
      svg("path", {
        d: "M 32 0 L 0 0 0 32",
        fill: "none",
        stroke: "#9fc1ee",
        "stroke-opacity": "0.08",
      }),
    );
    const glow = svg("filter", {
      id: "heart-glow",
      x: "-100%",
      y: "-100%",
      width: "300%",
      height: "300%",
    });
    glow.append(svg("feGaussianBlur", { stdDeviation: "6" }));
    defs.append(bg, grid, glow);
    scene.append(
      defs,
      svg("rect", { width: "900", height: "650", fill: "url(#heart-bg)" }),
      svg("rect", { width: "900", height: "650", fill: "url(#heart-grid)" }),
    );
    const vesselLayer = svg("g", {}),
      bloodLayer = svg("g", {}),
      heartLayer = svg("g", {}),
      labelLayer = svg("g", {});
    scene.append(vesselLayer, bloodLayer, heartLayer, labelLayer);
    root.append(scene);
    const text = (
      x: number,
      y: number,
      value: string,
      fill = "#e4f5ff",
      size = 12,
      anchor = "start",
    ) => {
      const t = svg("text", {
        x: String(x),
        y: String(y),
        fill,
        "font-family": "ui-monospace, SFMono-Regular, Menlo, monospace",
        "font-size": String(size),
        "text-anchor": anchor,
      });
      t.textContent = value;
      return t;
    };
    function stageInfo() {
      const names = [
        "ATRIAL FILLING",
        "VENTRICULAR FILLING",
        "VENTRICULAR CONTRACTION",
        "BLOOD LEAVING HEART",
        "CIRCULATION CONTINUES",
      ];
      const index = Math.floor(phase * names.length) % names.length;
      return {
        index,
        name: names[index]!,
        active:
          index === 0
            ? "RA"
            : index === 1
              ? "RV"
              : index === 2
                ? "LV"
                : index === 3
                  ? "LV"
                  : "BODY",
      };
    }
    function publish() {
      const rate = numberParam(params, "heartRate", DEFAULT_RATE);
      const stage = stageInfo();
      host.publishMeasurements([
        {
          id: "rate",
          label: "Heart rate",
          value: Math.round(rate),
          unit: "bpm",
          precision: 0,
          emphasis: true,
        },
        { id: "stage", label: "Current stage", value: stage.name },
        {
          id: "oxygen",
          label: "Blood pathway",
          value: stage.index < 2 ? "Deoxygenated → lungs" : "Oxygenated → body",
        },
      ]);
      host.publishExplanation({
        whatsHappening:
          stage.index < 2
            ? "Dark red blood is filling the right side of the heart and preparing to travel to the lungs."
            : "Bright red blood has returned from the lungs and is being sent from the left ventricle to the body.",
      });
    }
    function draw(now: number) {
      vesselLayer.replaceChildren();
      bloodLayer.replaceChildren();
      heartLayer.replaceChildren();
      labelLayer.replaceChildren();
      const rate = numberParam(params, "heartRate", DEFAULT_RATE);
      const cycle = Math.max(0.42, 60 / rate);
      const beat = running ? (elapsed % cycle) / cycle : 0;
      const contraction = Math.sin(beat * Math.PI * 2) * 0.5 + 0.5;
      const stage = stageInfo();
      const labels = boolParam(params, "labels", true);
      const oxy = boolParam(params, "highlightOxygen", true);
      const pulse = running ? 1 + contraction * 0.035 : 1;
      vesselLayer.append(
        svg("path", {
          d: "M 210 250 C 105 170 80 100 150 58",
          fill: "none",
          stroke: "#6f8297",
          "stroke-width": "26",
          "stroke-linecap": "round",
        }),
        svg("path", {
          d: "M 690 250 C 795 170 820 100 750 58",
          fill: "none",
          stroke: "#8a4450",
          "stroke-width": "26",
          "stroke-linecap": "round",
        }),
        svg("path", {
          d: "M 305 330 C 210 390 130 465 90 570",
          fill: "none",
          stroke: "#7b3b48",
          "stroke-width": "24",
          "stroke-linecap": "round",
        }),
        svg("path", {
          d: "M 595 330 C 690 390 770 465 810 570",
          fill: "none",
          stroke: "#b23f4b",
          "stroke-width": "24",
          "stroke-linecap": "round",
        }),
      );
      const bodyPath = "M 90 570 C 130 465 210 390 305 330";
      const lungPath = "M 210 250 C 105 170 80 100 150 58";
      const lungPath2 = "M 690 250 C 795 170 820 100 750 58";
      const bodyOut = "M 595 330 C 690 390 770 465 810 570";
      if (running) {
        const particleCount = 7;
        for (let i = 0; i < particleCount; i += 1) {
          const p = (elapsed * (0.18 + rate / 9000) + i / particleCount) % 1;
          const x = 450 + Math.cos(p * Math.PI * 2) * 190;
          const y = 325 + Math.sin(p * Math.PI * 2) * 220;
          const oxygenated = p > 0.48;
          bloodLayer.append(
            svg("circle", {
              cx: String(x),
              cy: String(y),
              r: "6",
              fill: oxygenated ? "#ff5361" : "#8f2738",
              "fill-opacity": "0.95",
            }),
          );
        }
      }
      const sx = 450 - 120 * (pulse - 1),
        sy = 315 - 160 * (pulse - 1);
      heartLayer.append(
        svg("path", {
          d: `M 450 ${sy - 160} C 350 ${sy - 245} 255 ${sy - 150} 285 ${sy - 55} L 450 ${sy + 180} L 615 ${sy - 55} C 645 ${sy - 150} 550 ${sy - 245} 450 ${sy - 160} Z`,
          fill: "#8f3045",
          stroke: "#ff6d78",
          "stroke-width": "4",
        }),
      );
      const chambers = [
        { id: "RA", x: 370, y: 265, label: "RIGHT ATRIUM", color: "#8d2e42", blood: "#7d2537" },
        { id: "RV", x: 370, y: 390, label: "RIGHT VENTRICLE", color: "#7a263a", blood: "#8d2c3d" },
        { id: "LA", x: 530, y: 265, label: "LEFT ATRIUM", color: "#d6404d", blood: "#f34d59" },
        { id: "LV", x: 530, y: 390, label: "LEFT VENTRICLE", color: "#bd3448", blood: "#ff5662" },
      ];
      chambers.forEach((ch) => {
        const active = stage.active === ch.id;
        heartLayer.append(
          svg("ellipse", {
            cx: String(ch.x),
            cy: String(ch.y),
            rx: active ? "58" : "52",
            ry: active ? "72" : "66",
            fill: ch.color,
            "fill-opacity": "0.95",
            stroke: active ? "#ffe69b" : "#ff8990",
            "stroke-width": active ? "4" : "2",
          }),
          svg("ellipse", {
            cx: String(ch.x),
            cy: String(ch.y + 6),
            rx: "32",
            ry: "42",
            fill: ch.blood,
            "fill-opacity": "0.8",
          }),
        );
        if (labels)
          labelLayer.append(
            text(ch.x, ch.y + 5, ch.id, "#fff4f2", 18, "middle"),
            text(ch.x, ch.y + 92, ch.label, active ? "#ffe69b" : "#c8d6e2", 10, "middle"),
          );
      });
      // Valves and pathway arrows.
      [
        [450, 307, 450, 338],
        [450, 438, 450, 480],
      ].forEach(([x1, y1, x2, y2]) =>
        heartLayer.append(
          svg("path", {
            d: `M ${x1! - 12} ${y1} L ${x1!} ${y2} L ${x1! + 12} ${y1}`,
            fill: "none",
            stroke: "#f6e7bf",
            "stroke-width": "4",
          }),
        ),
      );
      labelLayer.append(
        text(32, 44, "HEART CIRCULATION / LIVE MODEL", "#87ebff", 14),
        text(32, 70, "DARK RED = DEOXYGENATED  •  BRIGHT RED = OXYGENATED", "#b7d5e4", 10),
      );
      const badge = svg("rect", {
        x: "650",
        y: "34",
        width: "210",
        height: "36",
        rx: "18",
        fill: "#071321",
        stroke: "#ff9c9c",
        "stroke-opacity": "0.7",
      });
      labelLayer.append(
        badge,
        text(
          755,
          58,
          running ? "CIRCULATION ACTIVE" : "PAUSED",
          running ? "#8dffbf" : "#ffb6aa",
          11,
          "middle",
        ),
      );
      const panel = svg("rect", {
        x: "30",
        y: "500",
        width: "245",
        height: "112",
        rx: "14",
        fill: "#081421",
        "fill-opacity": "0.94",
        stroke: "#7e9bb3",
        "stroke-opacity": "0.35",
      });
      labelLayer.append(
        panel,
        text(48, 528, "CURRENT STAGE", "#ffd578", 10),
        text(48, 554, stage.name, "#f3fbff", 13),
        text(48, 580, `HEART RATE  ${Math.round(rate)} BPM`, "#9fc5d6", 10),
        text(48, 600, "BODY → RA → RV → LUNGS → LA → LV → BODY", "#9fc5d6", 9),
      );
      void now;
      void oxy;
      void bodyPath;
      void lungPath;
      void lungPath2;
      void bodyOut;
    }
    function render(now: number) {
      const dt = Math.min(0.05, Math.max(0, (now - last) / 1000));
      last = now;
      if (running) {
        const rate = numberParam(params, "heartRate", DEFAULT_RATE);
        elapsed += dt;
        phase = (phase + (dt * rate) / 60 / 5) % 1;
        graphClock += dt;
        if (graphClock > 1 / 12) {
          host.publishGraphSample({ x: elapsed, flow: running ? 1 : 0 });
          graphClock = 0;
          publish();
        }
      }
      draw(now);
      raf = requestAnimationFrame(render);
    }
    publish();
    raf = requestAnimationFrame(render);
    return {
      start() {
        running = true;
        host.setRunning(true);
      },
      pause() {
        running = false;
        host.setRunning(false);
      },
      reset() {
        running = false;
        elapsed = 0;
        phase = 0;
        graphClock = 0;
        host.replaceGraphData([]);
        host.setRunning(false);
        publish();
      },
      resize(w, h) {
        width = w;
        height = h;
        void width;
        void height;
      },
      setParam(id, value) {
        params[id] = value;
        publish();
      },
      setParams(next) {
        params = { ...params, ...next };
        publish();
      },
      destroy() {
        cancelAnimationFrame(raf);
        root.replaceChildren();
      },
    };
  },
};
