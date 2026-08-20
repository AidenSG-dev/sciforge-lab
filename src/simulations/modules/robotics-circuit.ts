import type {
  GraphSample,
  MountContext,
  ParamValue,
  SimulationInstance,
  SimulationModule,
  SimulationParams,
} from "../types";

const DEFAULTS = {
  supplyVoltage: 5,
  bulbCount: 1,
  switchClosed: true,
  topology: "series",
  view: "physical",
  material: "copper",
  ammeter: true,
  voltmeter: true,
  fuse: false,
  showCurrent: true,
} as const;

type Topology = "series" | "parallel";
type ViewMode = "physical" | "diagram";
type Material = "copper" | "aluminium" | "iron" | "plastic" | "rubber" | "wood";

function num(params: SimulationParams, id: string, fallback: number) {
  return typeof params[id] === "number" && Number.isFinite(params[id]) ? params[id] : fallback;
}
function bool(params: SimulationParams, id: string, fallback: boolean) {
  return typeof params[id] === "boolean" ? params[id] : fallback;
}
function str(params: SimulationParams, id: string, fallback: string) {
  return typeof params[id] === "string" ? params[id] : fallback;
}
function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}
function svg<K extends keyof SVGElementTagNameMap>(tag: K, attrs: Record<string, string>) {
  const el = document.createElementNS("http://www.w3.org/2000/svg", tag);
  Object.entries(attrs).forEach(([key, value]) => el.setAttribute(key, value));
  return el as SVGElementTagNameMap[K];
}

const MATERIALS: Record<Material, { label: string; conducting: boolean; color: string }> = {
  copper: { label: "Copper", conducting: true, color: "#d98b52" },
  aluminium: { label: "Aluminium", conducting: true, color: "#b7c9d8" },
  iron: { label: "Iron", conducting: true, color: "#8f9aaa" },
  plastic: { label: "Plastic", conducting: false, color: "#db6f87" },
  rubber: { label: "Rubber", conducting: false, color: "#a46de0" },
  wood: { label: "Wood", conducting: false, color: "#b98654" },
};

function createCircuitModule(): SimulationModule {
  return {
    id: "robotics-circuit",
    subject: "robotics",
    title: "Physics Circuits Lab",
    description: "Build a complete circuit, open the path and see current respond.",
    concepts: ["Closed circuits", "Current flow", "Voltage", "Circuit components"],
    grade: "6-8",
    layout: "robotics",
    status: "ready",
    aspectRatio: 4 / 3,
    controls: [
      {
        kind: "slider",
        id: "supplyVoltage",
        label: "Battery Voltage",
        min: 1.5,
        max: 12,
        step: 0.5,
        unit: "V",
        defaultValue: DEFAULTS.supplyVoltage,
        group: "Power",
      },
      {
        kind: "number",
        id: "bulbCount",
        label: "Bulbs in circuit",
        min: 1,
        max: 2,
        step: 1,
        defaultValue: DEFAULTS.bulbCount,
        group: "Build",
      },
      {
        kind: "toggle",
        id: "switchClosed",
        label: "Close switch",
        defaultValue: DEFAULTS.switchClosed,
        group: "Build",
      },
      {
        kind: "select",
        id: "topology",
        label: "Circuit arrangement",
        options: [
          { value: "series", label: "Series circuit" },
          { value: "parallel", label: "Parallel circuit" },
        ],
        defaultValue: DEFAULTS.topology,
        group: "Build",
      },
      {
        kind: "select",
        id: "material",
        label: "Test wire material",
        options: Object.entries(MATERIALS).map(([value, item]) => ({ value, label: item.label })),
        defaultValue: DEFAULTS.material,
        group: "Materials",
      },
      {
        kind: "select",
        id: "view",
        label: "Lab view",
        options: [
          { value: "physical", label: "Physical lab" },
          { value: "diagram", label: "Circuit diagram" },
        ],
        defaultValue: DEFAULTS.view,
        group: "Display",
      },
      {
        kind: "checkbox",
        id: "ammeter",
        label: "Place ammeter",
        defaultValue: DEFAULTS.ammeter,
        group: "Instruments",
      },
      {
        kind: "checkbox",
        id: "voltmeter",
        label: "Place voltmeter",
        defaultValue: DEFAULTS.voltmeter,
        group: "Instruments",
      },
      {
        kind: "checkbox",
        id: "fuse",
        label: "Add safety fuse",
        defaultValue: DEFAULTS.fuse,
        group: "Components",
      },
      {
        kind: "checkbox",
        id: "showCurrent",
        label: "Animate current flow",
        defaultValue: DEFAULTS.showCurrent,
        group: "Display",
      },
      {
        kind: "button",
        id: "resetCircuit",
        label: "Reset circuit",
        actionId: "resetCircuit",
        variant: "subject",
        group: "Experiment",
      },
    ],
    graph: {
      title: "Current vs time",
      xLabel: "Time (s)",
      yLabel: "Current (A)",
      series: [{ id: "current", label: "Current", colorToken: 4 }],
      window: 180,
    },
    explanation: {
      whatsHappening:
        "Close the switch to complete the path. Current flows through the components and the bulb lights.",
      keyConcept:
        "A closed circuit has one or more complete conducting paths from the battery back to the battery.",
      deeperDive:
        "In this school-level model, bulb brightness follows current. A series circuit has one path; a parallel circuit splits current between branches.",
      formula: "I = V / R",
    },
    mount({ container, host, params: initialParams }: MountContext): SimulationInstance {
      let params = { ...initialParams };
      let running = false;
      let raf = 0;
      let lastTime = performance.now();
      let elapsed = 0;
      let graphAccumulator = 0;
      let width = 800;
      let height = 600;
      const root = document.createElement("div");
      root.className = "absolute inset-0 overflow-hidden";
      container.replaceChildren(root);
      const scene = svg("svg", {
        viewBox: "0 0 800 600",
        class: "h-full w-full",
        role: "img",
        "aria-label": "Interactive school physics circuit lab",
        preserveAspectRatio: "xMidYMid meet",
      });
      const defs = svg("defs", {});
      const bg = svg("linearGradient", { id: "circuit-bg", x1: "0", y1: "0", x2: "0", y2: "1" });
      bg.append(
        svg("stop", { offset: "0%", "stop-color": "#101b33" }),
        svg("stop", { offset: "100%", "stop-color": "#070c18" }),
      );
      const grid = svg("pattern", {
        id: "circuit-grid",
        width: "32",
        height: "32",
        patternUnits: "userSpaceOnUse",
      });
      grid.append(
        svg("path", {
          d: "M 32 0 L 0 0 0 32",
          fill: "none",
          stroke: "#8cb9e8",
          "stroke-opacity": "0.08",
        }),
      );
      const glow = svg("filter", {
        id: "bulb-glow",
        x: "-100%",
        y: "-100%",
        width: "300%",
        height: "300%",
      });
      glow.append(svg("feGaussianBlur", { stdDeviation: "7" }));
      defs.append(bg, grid, glow);
      scene.append(
        defs,
        svg("rect", { width: "800", height: "600", fill: "url(#circuit-bg)" }),
        svg("rect", { width: "800", height: "600", fill: "url(#circuit-grid)" }),
      );
      const wireLayer = svg("g", {});
      const flowLayer = svg("g", {});
      const componentLayer = svg("g", {});
      const labelLayer = svg("g", {});
      scene.append(wireLayer, flowLayer, componentLayer, labelLayer);
      root.append(scene);

      const text = (
        x: number,
        y: number,
        value: string,
        fill = "#dff8ff",
        size = 11,
        anchor = "start",
      ) => {
        const node = svg("text", {
          x: String(x),
          y: String(y),
          fill,
          "font-family": "ui-monospace, SFMono-Regular, Menlo, monospace",
          "font-size": String(size),
          "text-anchor": anchor,
        });
        node.textContent = value;
        return node;
      };
      const line = (
        x1: number,
        y1: number,
        x2: number,
        y2: number,
        stroke: string,
        widthValue = 4,
        dash = "",
      ) =>
        svg("line", {
          x1: String(x1),
          y1: String(y1),
          x2: String(x2),
          y2: String(y2),
          stroke,
          "stroke-width": String(widthValue),
          "stroke-linecap": "round",
          ...(dash ? { "stroke-dasharray": dash } : {}),
        });
      const path = (d: string, stroke: string, widthValue = 4, dash = "") =>
        svg("path", {
          d,
          fill: "none",
          stroke,
          "stroke-width": String(widthValue),
          "stroke-linecap": "round",
          "stroke-linejoin": "round",
          ...(dash ? { "stroke-dasharray": dash } : {}),
        });

      function state() {
        const voltage = num(params, "supplyVoltage", DEFAULTS.supplyVoltage);
        const bulbCount = clamp(Math.round(num(params, "bulbCount", DEFAULTS.bulbCount)), 1, 2);
        const closed = bool(params, "switchClosed", DEFAULTS.switchClosed);
        const topology = str(params, "topology", DEFAULTS.topology) as Topology;
        const material = str(params, "material", DEFAULTS.material) as Material;
        const conducting = MATERIALS[material]?.conducting ?? true;
        const fuse = bool(params, "fuse", DEFAULTS.fuse);
        const ammeter = bool(params, "ammeter", DEFAULTS.ammeter);
        const voltmeter = bool(params, "voltmeter", DEFAULTS.voltmeter);
        const fuseLimit = 0.08;
        const resistance = topology === "series" ? 90 + bulbCount * 70 : 90 + bulbCount * 35;
        const rawCurrent = voltage / resistance;
        const current = closed && conducting && (!fuse || rawCurrent <= fuseLimit) ? rawCurrent : 0;
        const fuseBlown = fuse && rawCurrent > fuseLimit;
        const brightness = clamp(current / 0.08, 0, 1);
        return {
          voltage,
          bulbCount,
          closed,
          topology,
          material,
          conducting,
          fuse,
          ammeter,
          voltmeter,
          fuseBlown,
          current,
          brightness,
        };
      }

      function publish() {
        const s = state();
        const circuitClosed = s.closed && s.conducting && !s.fuseBlown;
        host.publishMeasurements([
          {
            id: "voltage",
            label: "Voltage",
            value: s.voltage,
            unit: "V",
            precision: 1,
            emphasis: true,
          },
          {
            id: "current",
            label: "Current",
            value: s.current,
            unit: "A",
            precision: 3,
            emphasis: true,
          },
          { id: "state", label: "Circuit state", value: circuitClosed ? "CLOSED" : "OPEN" },
          { id: "bulb", label: "Bulb state", value: circuitClosed ? "ON" : "OFF" },
          {
            id: "cells",
            label: "Cells",
            value: Math.max(1, Math.round(s.voltage / 1.5)),
            precision: 0,
          },
          {
            id: "branches",
            label: "Branches",
            value: s.topology === "parallel" ? s.bulbCount : 1,
            precision: 0,
          },
        ]);
        const warning = !s.conducting
          ? `${MATERIALS[s.material].label} is an insulator: the path is broken and current is zero.`
          : s.fuseBlown
            ? "The fuse exceeded its safe current limit, heated up and opened the circuit."
            : circuitClosed
              ? "CIRCUIT CLOSED: the conducting path is complete, so current flows and the bulb lights."
              : "CIRCUIT OPEN: the switch or material creates a break, so current stops and the bulb turns off.";
        host.publishExplanation({ whatsHappening: warning });
      }

      function drawBulb(cx: number, cy: number, on: boolean, label: string) {
        const s = state();
        if (on)
          componentLayer.append(
            svg("circle", {
              cx: String(cx),
              cy: String(cy),
              r: "28",
              fill: "#ffd34e",
              "fill-opacity": String(0.12 + s.brightness * 0.26),
              filter: "url(#bulb-glow)",
            }),
          );
        componentLayer.append(
          svg("circle", {
            cx: String(cx),
            cy: String(cy),
            r: "20",
            fill: on ? "#ffd34e" : "#1a2634",
            stroke: on ? "#fff0a4" : "#8ea6b8",
            "stroke-width": "3",
          }),
          svg("path", {
            d: `M ${cx - 9} ${cy + 8} Q ${cx} ${cy - 10} ${cx + 9} ${cy + 8}`,
            fill: "none",
            stroke: on ? "#fff8ca" : "#8ea6b8",
            "stroke-width": "2",
          }),
          svg("line", {
            x1: String(cx - 8),
            y1: String(cy + 13),
            x2: String(cx + 8),
            y2: String(cy + 13),
            stroke: "#8ea6b8",
            "stroke-width": "2",
          }),
        );
        labelLayer.append(text(cx, cy + 43, label, "#b7d5e4", 10, "middle"));
      }

      function drawPhysical(now: number) {
        const s = state();
        const circuitClosed = s.closed && s.conducting && !s.fuseBlown;
        const wireColor = s.conducting ? "#83cfff" : MATERIALS[s.material].color;
        wireLayer.append(path("M 150 180 L 150 430 L 650 430 L 650 180 L 150 180", wireColor, 6));
        const switchX = 400;
        wireLayer.append(
          line(350, 180, 382, 180, wireColor, 6),
          line(418, 180, 450, 180, wireColor, 6),
        );
        componentLayer.append(
          svg("circle", { cx: "350", cy: "180", r: "7", fill: wireColor }),
          svg("circle", { cx: "450", cy: "180", r: "7", fill: wireColor }),
        );
        componentLayer.append(
          line(
            350,
            180,
            circuitClosed ? 450 : 410,
            circuitClosed ? 180 : 145,
            circuitClosed ? "#e6f7ff" : "#ff9c86",
            6,
          ),
        );
        labelLayer.append(
          text(
            switchX,
            120,
            circuitClosed ? "SWITCH CLOSED" : "SWITCH OPEN",
            circuitClosed ? "#8dffbf" : "#ffac9c",
            11,
            "middle",
          ),
        );
        // Battery with two visible terminals.
        componentLayer.append(
          line(150, 275, 150, 330, "#eaf7ff", 9),
          line(150, 260, 150, 345, "#eaf7ff", 3),
        );
        componentLayer.append(
          text(108, 315, "−", "#9cc9df", 18, "middle"),
          text(194, 315, "+", "#ffb36a", 18, "middle"),
          text(150, 372, `${s.voltage.toFixed(1)} V CELL`, "#b9d9e9", 10, "middle"),
        );
        // Series/parallel bulb arrangement.
        if (s.topology === "series") {
          drawBulb(330, 430, circuitClosed, "BULB 1");
          if (s.bulbCount > 1) drawBulb(500, 430, circuitClosed, "BULB 2");
        } else {
          wireLayer.append(
            path("M 330 430 L 330 335 L 470 335 L 470 430", wireColor, 5),
            path("M 330 430 L 330 525 L 470 525 L 470 430", wireColor, 5),
          );
          drawBulb(400, 335, circuitClosed, "BRANCH 1");
          if (s.bulbCount > 1) drawBulb(400, 525, circuitClosed, "BRANCH 2");
          componentLayer.append(
            svg("circle", { cx: "330", cy: "430", r: "7", fill: "#f5fbff" }),
            svg("circle", { cx: "470", cy: "430", r: "7", fill: "#f5fbff" }),
          );
        }
        if (s.ammeter) {
          componentLayer.append(
            svg("circle", {
              cx: "650",
              cy: "300",
              r: "27",
              fill: "#102437",
              stroke: "#8ce8ff",
              "stroke-width": "3",
            }),
          );
          labelLayer.append(
            text(650, 307, "A", "#8ce8ff", 20, "middle"),
            text(650, 350, "AMMETER / SERIES", "#9fc6d9", 9, "middle"),
          );
        }
        if (s.voltmeter) {
          componentLayer.append(
            svg("circle", {
              cx: "520",
              cy: "180",
              r: "27",
              fill: "#102437",
              stroke: "#ffb777",
              "stroke-width": "3",
            }),
          );
          labelLayer.append(
            text(520, 187, "V", "#ffb777", 20, "middle"),
            text(520, 235, "VOLTMETER / PARALLEL", "#9fc6d9", 9, "middle"),
          );
        }
        if (s.fuse) {
          componentLayer.append(
            line(240, 180, 300, 180, wireColor, 4),
            svg("rect", {
              x: "272",
              y: "168",
              width: "36",
              height: "24",
              rx: "4",
              fill: s.fuseBlown ? "#5c2e2a" : "#162b3b",
              stroke: s.fuseBlown ? "#ff7f63" : "#ffbc78",
              "stroke-width": "2",
            }),
          );
          labelLayer.append(
            text(
              290,
              220,
              s.fuseBlown ? "FUSE OPEN" : "FUSE",
              s.fuseBlown ? "#ff927e" : "#ffbc78",
              9,
              "middle",
            ),
          );
        }
        if (circuitClosed && bool(params, "showCurrent", true)) {
          const dash = 22;
          const offset = -((now / 35) % dash);
          const flow = path(
            "M 150 180 L 150 430 L 650 430 L 650 180 L 150 180",
            "#fff2a0",
            3,
            `${dash} ${dash}`,
          );
          flow.setAttribute("stroke-dashoffset", String(offset));
          flowLayer.append(flow);
        }
        labelLayer.append(
          text(36, 44, "PHYSICS CIRCUITS / LIVE LAB", "#84eaff", 13),
          text(36, 68, "CLOSED PATH → CURRENT → LIGHT", "#b8d8e8", 10),
        );
        const badge = svg("rect", {
          x: "585",
          y: "42",
          width: "178",
          height: "31",
          rx: "15",
          fill: "#081524",
          stroke: circuitClosed ? "#8dffbf" : "#ff9c86",
          "stroke-opacity": "0.8",
        });
        labelLayer.append(
          badge,
          text(
            674,
            62,
            circuitClosed ? "CIRCUIT CLOSED" : "CIRCUIT OPEN",
            circuitClosed ? "#8dffbf" : "#ffac9c",
            11,
            "middle",
          ),
        );
      }

      function drawDiagram() {
        const s = state();
        const circuitClosed = s.closed && s.conducting && !s.fuseBlown;
        const c = circuitClosed ? "#8dffbf" : "#ff9c86";
        wireLayer.append(path("M 150 180 L 150 430 L 650 430 L 650 180 L 150 180", c, 4));
        componentLayer.append(
          line(140, 260, 160, 260, "#dff7ff", 4),
          line(140, 300, 160, 300, "#dff7ff", 8),
        );
        labelLayer.append(text(150, 335, `${s.voltage.toFixed(1)} V`, "#b9d9e9", 10, "middle"));
        componentLayer.append(
          line(350, 180, 382, 180, c, 4),
          line(418, 180, 450, 180, c, 4),
          line(350, 180, circuitClosed ? 450 : 410, circuitClosed ? 180 : 145, c, 4),
        );
        for (let i = 0; i < s.bulbCount; i += 1) {
          const cx = s.topology === "series" ? 330 + i * 170 : 400;
          const cy = s.topology === "series" ? 430 : 335 + i * 190;
          componentLayer.append(
            svg("circle", {
              cx: String(cx),
              cy: String(cy),
              r: "24",
              fill: "none",
              stroke: c,
              "stroke-width": "3",
            }),
            svg("path", {
              d: `M ${cx - 10} ${cy + 8} Q ${cx} ${cy - 10} ${cx + 10} ${cy + 8}`,
              fill: "none",
              stroke: c,
              "stroke-width": "3",
            }),
          );
          labelLayer.append(text(cx, cy + 42, `LAMP ${i + 1}`, "#b9d9e9", 9, "middle"));
        }
        if (s.topology === "parallel") {
          wireLayer.append(
            path("M 330 430 L 330 335 L 470 335 L 470 430", c, 4),
            path("M 330 430 L 330 525 L 470 525 L 470 430", c, 4),
          );
          componentLayer.append(
            svg("circle", { cx: "330", cy: "430", r: "6", fill: c }),
            svg("circle", { cx: "470", cy: "430", r: "6", fill: c }),
          );
        }
        labelLayer.append(
          text(36, 44, "TEXTBOOK CIRCUIT DIAGRAM", "#84eaff", 13),
          text(
            36,
            68,
            s.topology === "series" ? "SERIES: ONE PATH" : "PARALLEL: TWO BRANCHES",
            "#b8d8e8",
            10,
          ),
        );
        const badge = svg("rect", {
          x: "585",
          y: "42",
          width: "178",
          height: "31",
          rx: "15",
          fill: "#081524",
          stroke: c,
          "stroke-opacity": "0.8",
        });
        labelLayer.append(
          badge,
          text(674, 62, circuitClosed ? "CIRCUIT CLOSED" : "CIRCUIT OPEN", c, 11, "middle"),
        );
      }

      function render(now: number) {
        const dt = Math.min(0.05, Math.max(0, (now - lastTime) / 1000));
        lastTime = now;
        if (running) {
          elapsed += dt;
          graphAccumulator += dt;
          if (graphAccumulator >= 1 / 12) {
            host.publishGraphSample({ x: elapsed, current: state().current });
            graphAccumulator = 0;
          }
        }
        wireLayer.replaceChildren();
        flowLayer.replaceChildren();
        componentLayer.replaceChildren();
        labelLayer.replaceChildren();
        const view = str(params, "view", DEFAULTS.view) as ViewMode;
        if (view === "diagram") drawDiagram();
        else drawPhysical(now);
        raf = requestAnimationFrame(render);
      }
      function setParams(next: SimulationParams) {
        params = { ...params, ...next };
        publish();
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
          graphAccumulator = 0;
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
        setParams,
        onAction(actionId) {
          if (actionId === "resetCircuit") this.reset?.();
        },
        destroy() {
          cancelAnimationFrame(raf);
          root.replaceChildren();
        },
      };
    },
  };
}

export const roboticsCircuit = createCircuitModule();
